/* Stand-in for the claude.ai artifact runtime (claude.use('db')).
   app.js is unchanged: it keeps calling the same API, and this file answers it using /api/docs (Neon Postgres).
   Does nothing when the real runtime is present (i.e. when the page is opened inside claude.ai). */
(function () {
  if (window.claude && window.claude.use) return;

  var API = '/api/docs';
  var POLL_MS = 15000;           // shared changes show up within this long; polling only runs while the tab is visible

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

  /* No identity for now: the page is behind the company login and does not ask who is viewing.
     Without a user, app.js hides what needs one (adding topics, Reorder); shared data still loads. */
  window.claude = { use: function (name) { return Promise.resolve(name === 'db' ? db : null); } };
})();
