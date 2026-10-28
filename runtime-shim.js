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

  /* ---------- identity: honest "who are you" picker (no login) ---------- */
  var slug = function (n) { return String(n || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); };
  var me = null, meName = '';

  function readWho() { try { return JSON.parse(localStorage.getItem(WHO_KEY) || 'null'); } catch (e) { return null; } }
  function saveWho(w) { try { localStorage.setItem(WHO_KEY, JSON.stringify(w)); } catch (e) { /* private mode */ } }

  function knownNames() {
    var out = [];
    try { out.push(ADMIN, REVIEWER); Object.keys(EDITORS).forEach(function (k) { out = out.concat(EDITORS[k]); }); } catch (e) { /* globals missing */ }
    return out.filter(function (n, i, a) { return n && a.indexOf(n) === i; }).sort();
  }

  function chip(w) {
    var el = document.createElement('div');
    el.setAttribute('style', 'position:fixed;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:9999;background:#fff;border:1px solid #cbd4de;border-radius:999px;padding:5px 12px;font:12px -apple-system,BlinkMacSystemFont,sans-serif;color:#5d6b7b;box-shadow:0 2px 8px rgba(0,0,0,.08)');
    el.innerHTML = 'Viewing as <b style="color:#14202e"></b> · <a href="#" style="color:#4e64df">change</a>';
    el.querySelector('b').textContent = w.name;
    el.querySelector('a').addEventListener('click', function (ev) { ev.preventDefault(); try { localStorage.removeItem(WHO_KEY); } catch (e) {} location.reload(); });
    document.body.appendChild(el);
  }

  function chooser() {
    return new Promise(function (resolve) {
      var list = knownNames();
      var box = document.createElement('div');
      box.setAttribute('style', 'position:fixed;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:9999;width:260px;background:#fff;border:1px solid #cbd4de;border-radius:12px;padding:14px;font:13px -apple-system,BlinkMacSystemFont,sans-serif;color:#14202e;box-shadow:0 6px 24px rgba(0,0,0,.15)');
      box.innerHTML = '<b style="display:block;margin-bottom:6px">Who is viewing?</b>' +
        '<span style="display:block;color:#5d6b7b;margin-bottom:8px">Lets you add topics, tick items and flag estimates. Not a login.</span>' +
        '<select id="pod-who-sel" style="width:100%;margin-bottom:6px"></select>' +
        '<input id="pod-who-name" placeholder="Your name" maxlength="40" style="width:100%;box-sizing:border-box;margin-bottom:8px;display:none">' +
        '<button id="pod-who-go" style="margin-right:6px">Continue</button><button id="pod-who-skip">Just looking</button>';
      var sel = box.querySelector('#pod-who-sel'), nm = box.querySelector('#pod-who-name');
      sel.innerHTML = '<option value="">Choose your name…</option>' + list.map(function (n) { return '<option>' + n.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</option>'; }).join('') + '<option value="__other">Someone else…</option>';
      sel.addEventListener('change', function () { nm.style.display = sel.value === '__other' ? 'block' : 'none'; });
      function done(w) { saveWho(w); box.remove(); chip(w); resolve(w); }
      box.querySelector('#pod-who-go').addEventListener('click', function () {
        if (sel.value === '__other') { var n = nm.value.trim(); if (n) done({ id: 'x-' + slug(n), name: n }); }
        else if (sel.value) done({ id: slug(sel.value), name: sel.value });
      });
      box.querySelector('#pod-who-skip').addEventListener('click', function () {
        done({ id: 'guest-' + Math.random().toString(36).slice(2, 10), name: 'Guest' });
      });
      document.body.appendChild(box);
    });
  }

  var whoP = null;
  function who() {
    if (whoP) return whoP;
    whoP = new Promise(function (resolve) { setTimeout(resolve, 0); }).then(function () {   // wait until app.js globals exist
      var w = readWho();
      if (w && w.id) { chip(w); return w; }
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
