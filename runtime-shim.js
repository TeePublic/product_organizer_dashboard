/* Stand-in for the claude.ai artifact runtime (claude.use('db') / claude.use('user')).
   app.js is unchanged: it keeps calling the same API, and this file answers it using /api/docs (Neon Postgres).
   Does nothing when the real runtime is present (i.e. when the page is opened inside claude.ai). */
(function () {
  if (window.claude && window.claude.use) return;

  var API = '/api/docs';
  var POLL_MS = 15000;           // shared changes show up within this long; polling only runs while the tab is visible
  var WHO_KEY = 'pod.who';

  /* ---------- database: collection().onSnapshot / doc().set over polling ---------- */
  var subs = {}, last = {}, pending = {}, inflight = false, again = false, timer = null;

  function names() { return Object.keys(subs).filter(function (c) { return subs[c].length; }); }
  function snapshot(list) {
    return { docs: list.map(function (d) { return { id: d.id, data: function () { return d.data; } }; }) };
  }
  function emit(c, list) {
    (subs[c] || []).slice().forEach(function (s) { try { s.ok(snapshot(list)); } catch (e) { console.error(e); } });
  }

  async function poll() {
    if (inflight) { again = true; return; }
    var cs = names(); if (!cs.length) return;
    inflight = true;
    try {
      var r = await fetch(API + '?collections=' + encodeURIComponent(cs.join(',')), { credentials: 'same-origin' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      var j = await r.json();
      cs.forEach(function (c) {
        if (pending[c]) return;                       // a save is in flight: don't overwrite the optimistic state
        var list = (j.collections || {})[c] || [];
        var h = JSON.stringify(list);
        if (h === last[c]) return;
        last[c] = h; emit(c, list);
      });
    } catch (e) {
      cs.forEach(function (c) {                       // first failure per collection: tell the page so it can fall back
        if (last[c] === undefined) {
          last[c] = null;
          (subs[c] || []).slice().forEach(function (s) { if (s.err) { try { s.err(e); } catch (_) {} } });
        }
      });
    } finally {
      inflight = false;
      if (again) { again = false; setTimeout(poll, 0); }
    }
  }

  function start() {
    if (timer) return;
    timer = setInterval(function () { if (!document.hidden) poll(); }, POLL_MS);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) poll(); });
  }

  async function put(c, id, data) {
    pending[c] = (pending[c] || 0) + 1;
    try {
      var r = await fetch(API, {
        method: 'PUT', credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ collection: c, id: id, data: data })
      });
      if (!r.ok) throw new Error('save failed (HTTP ' + r.status + ')');
    } finally {
      pending[c]--;
    }
    setTimeout(poll, 0);
  }

  var db = {
    collection: function (c) {
      return {
        onSnapshot: function (ok, err) {
          var s = { ok: ok, err: err };
          (subs[c] = subs[c] || []).push(s);
          start(); setTimeout(poll, 0);
          return function () { subs[c] = (subs[c] || []).filter(function (x) { return x !== s; }); };
        },
        doc: function (id) {
          return { set: function (data) { return put(c, id, data); } };
        }
      };
    }
  };

  /* ---------- identity: who is viewing. Choosing a name that carries admin controls asks for a password (the name, lowercase, no spaces).
     This is a convenience gate in the browser, not real security: the page itself sits behind the company login. ---------- */
  var slug = function (n) { return String(n || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); };
  var me = null, meName = '';

  function readWho() { try { return JSON.parse(localStorage.getItem(WHO_KEY) || 'null'); } catch (e) { return null; } }
  function saveWho(w) { try { localStorage.setItem(WHO_KEY, JSON.stringify(w)); } catch (e) { /* private mode */ } }

  function knownNames() {
    var out = [];
    try { out.push(ADMIN, REVIEWER); Object.keys(EDITORS).forEach(function (k) { out = out.concat(EDITORS[k]); }); } catch (e) { /* globals missing */ }
    return out.filter(function (n, i, a) { return n && a.indexOf(n) === i; }).sort();
  }
  function isKnown(id) { return knownNames().some(function (n) { return slug(n) === id; }); }
  var flat = function (n) { return String(n || '').toLowerCase().replace(/\s+/g, ''); };
  var fold = function (s) { try { return s.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) { return s; } };
  function passOk(name, typed) { var p = flat(typed); return !!p && (p === flat(name) || p === fold(flat(name))); }
  var esc = function (x) { return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };

  function css() {
    if (document.getElementById('pod-who-css')) return;
    var st = document.createElement('style'); st.id = 'pod-who-css';
    var base = 'position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9999;display:flex;align-items:center;background:var(--surface,#fff);color:var(--muted,#5d6b7b);border:1px solid var(--line,#cbd4de);font:12.5px var(--body,-apple-system,BlinkMacSystemFont,sans-serif);box-shadow:0 4px 14px rgba(16,28,43,.12);max-width:calc(100vw - 32px);';
    st.textContent =
      '.podchip{' + base + 'gap:8px;border-radius:999px;padding:5px 12px 5px 6px;opacity:.38;transition:opacity .2s}' +
      '.podchip:hover,.podchip:focus-within{opacity:1}' +
      '.podwho{' + base + 'flex-wrap:wrap;gap:8px;border-radius:22px;padding:6px 8px 6px 6px;width:max-content;max-width:min(380px,calc(100vw - 32px))}' +
      '.podwho i,.podchip i{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:var(--ctl,#4e64df);color:#fff;font:700 11px var(--body,inherit);font-style:normal;flex:none}' +
      '.podwho select,.podwho input{padding:5px 8px;border:1px solid var(--line,#cbd4de);border-radius:999px;background:var(--bg,#fff);color:var(--ink,#14202e);font:inherit;min-width:0;max-width:190px}' +
      '.podwho select:focus,.podwho input:focus{outline:2px solid var(--ctl,#4e64df);outline-offset:1px}' +
      '.podwho .go{padding:5px 12px;border:0;border-radius:999px;background:var(--ctl,#4e64df);color:#fff;font:700 12.5px var(--body,inherit);cursor:pointer}' +
      '.podwho .skip{padding:4px 6px;border:0;background:none;color:var(--muted,#5d6b7b);cursor:pointer;font:inherit;text-decoration:underline}' +
      '.podwho .msg{flex-basis:100%;margin:0;padding:2px 8px 0 30px;font-size:12px;color:var(--muted,#5d6b7b)}' +
      '.podwho .err{flex-basis:100%;margin:0;padding:0 8px 0 30px;font-size:12px;color:var(--bad,#c23a46)}' +
      '.podchip b{color:var(--ink,#14202e)} .podchip em{font-style:normal;font-weight:700;font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--good,#1f7a4d);background:color-mix(in srgb,var(--good,#1f7a4d) 12%,transparent);padding:1px 6px;border-radius:99px}' +
      '.podchip a{color:var(--ctl,#4e64df)}';
    document.head.appendChild(st);
  }

  function chip(w) {
    css();
    var el = document.createElement('div'); el.className = 'podchip'; el.title = 'Hover to change who is viewing';
    el.innerHTML = '<i>' + esc((w.name || '?').trim().charAt(0).toUpperCase()) + '</i><span>Viewing as <b>' + esc(w.name) + '</b></span>' + (w.auth ? '<em>Admin</em>' : '') + '<a href="#">change</a>';
    el.querySelector('a').addEventListener('click', function (ev) { ev.preventDefault(); try { localStorage.removeItem(WHO_KEY); } catch (e) {} location.reload(); });
    document.body.appendChild(el);
  }

  function chooser() {
    css();
    return new Promise(function (resolve) {
      var box = document.createElement('div'); box.className = 'podwho'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Who is viewing');
      function done(w) { saveWho(w); box.remove(); chip(w); resolve(w); }
      function guest() { done({ id: 'guest-' + Math.random().toString(36).slice(2, 10), name: 'Guest' }); }
      function pick() {
        var list = knownNames();
        box.innerHTML = '<i>?</i>' +
          '<select id="pod-who-sel" aria-label="Who is viewing"><option value="">Who’s viewing?</option>' + list.map(function (n) { return '<option>' + esc(n) + '</option>'; }).join('') + '<option value="__other">Someone else…</option></select>' +
          '<input id="pod-who-name" placeholder="Your name" maxlength="40" aria-label="Your name" style="display:none">' +
          '<button class="go" id="pod-who-go" type="button">Continue</button><button class="skip" id="pod-who-skip" type="button">Just looking</button>' +
          '<p class="msg">Only used to label what you add or tick. Not used to track you.</p>';
        var sel = box.querySelector('#pod-who-sel'), nm = box.querySelector('#pod-who-name');
        sel.addEventListener('change', function () { nm.style.display = sel.value === '__other' ? 'block' : 'none'; if (sel.value === '__other') nm.focus(); });
        box.querySelector('#pod-who-go').addEventListener('click', function () {
          if (sel.value === '__other') { var n = nm.value.trim(); if (n) done({ id: 'x-' + slug(n), name: n }); }
          else if (sel.value) password(sel.value);
        });
        box.querySelector('#pod-who-skip').addEventListener('click', guest);
      }
      function password(name) {
        box.innerHTML = '<i>' + esc(name.trim().charAt(0).toUpperCase()) + '</i>' +
          '<input id="pod-who-pw" type="password" placeholder="Password" autocomplete="off" aria-label="Password">' +
          '<button class="go" id="pod-who-go" type="button">Continue</button><button class="skip" id="pod-who-back" type="button">Back</button>' +
          '<p class="msg">Enter password to have admin controls over parts of the dashboard.</p>' +
          '<p class="err" id="pod-who-err" hidden>That password does not match. Try again.</p>';
        var pw = box.querySelector('#pod-who-pw'), err = box.querySelector('#pod-who-err');
        function tryIt() { if (passOk(name, pw.value)) done({ id: slug(name), name: name, auth: true }); else { err.hidden = false; pw.select(); } }
        box.querySelector('#pod-who-go').addEventListener('click', tryIt);
        pw.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') tryIt(); });
        box.querySelector('#pod-who-back').addEventListener('click', pick);
        setTimeout(function () { pw.focus(); }, 0);
      }
      pick(); document.body.appendChild(box);
    });
  }

  var whoP = null;
  function who() {
    if (whoP) return whoP;
    whoP = new Promise(function (resolve) { setTimeout(resolve, 0); }).then(function () {   // wait until app.js globals exist
      var w = readWho();
      if (w && w.id && (w.auth || !isKnown(w.id))) { chip(w); return w; }                    // a known name needs its password, once
      return chooser();
    }).then(function (w) { me = w.id; meName = w.name; return w; });
    return whoP;
  }

  var user = {
    id: function () { return who().then(function (w) { return w.id; }); },
    isOwner: function () { try { return !!me && me === slug(ADMIN); } catch (e) { return false; } },   // honor system: the page is already behind Vercel login
    can: function () { return true; },
    search: function (n) { return Promise.resolve([{ id: slug(n), name: n }]); },
    profiles: function (ids) {
      var map = {}, ks = knownNames();
      (ids || []).forEach(function (id) {
        var hit = ks.filter(function (n) { return slug(n) === id; })[0];
        map[id] = { name: hit || (id === me ? meName : '') || 'someone' };
      });
      return Promise.resolve(map);
    }
  };

  window.claude = { use: function (name) { return Promise.resolve(name === 'db' ? db : name === 'user' ? user : null); } };
})();
