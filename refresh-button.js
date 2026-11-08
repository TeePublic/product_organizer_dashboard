// Small things on the same line as "Last refreshed ..." in the top-right of the header:
//  1. For everyone, once a saved CVR refresh is in use:  "CVR refreshed Fri Nov 6, 11:42 AM ET"  (when the button last ran successfully).
//  1b. For everyone, once a saved A/B refresh is in use:  "A/B refreshed Sat Nov 7, 3:48 PM ET".
//  2. Only when the address ends with ?refresh=1:  a "Refresh now" link that asks the server to pull fresh numbers from Amplitude:
//     first the A/B tab (one short call to /api/ab-refresh), then the CVR numbers (rounds, as before). A problem with one never stops the other.
// If the "Last refreshed" line is not on the page, the link floats bottom-left and the stamp is skipped. Loaded after app.js.
(function () {
  var wantBtn = new URLSearchParams(location.search).get('refresh') === '1';
  var snap = window.__cvrSnapshot; // set by /api/cvr-data when a saved refresh is being shown
  var abSnap = window.__abSnapshot; // set by /api/ab-data when a saved A/B refresh is being shown
  function fmt(s) {
    var iso = String(s).replace(' ', 'T').replace(/([+-]\d\d)$/, '$1:00').replace(/(\.\d{3})\d+/, '$1');
    var d = new Date(iso); if (isNaN(d.getTime())) return null;
    var p = {}; new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
    return p.weekday + ' ' + p.month + ' ' + p.day + ', ' + p.hour + ':' + p.minute + ' ' + p.dayPeriod + ' ET';
  }
  var when = snap && snap.applied && snap.createdAt ? fmt(snap.createdAt) : null;
  var abWhen = abSnap && abSnap.applied && abSnap.createdAt ? fmt(abSnap.createdAt) : null;
  if (!wantBtn && !when && !abWhen) return;

  var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  var fg = dark ? '#e8e8e8' : '#1a1a1a', bg = dark ? '#1f1f23' : '#ffffff', line = dark ? '#3a3a42' : '#cfcfd6', accent = dark ? '#a5b4fc' : '#4f46e5';
  var btn = document.createElement('button'), panel = document.createElement('div'), floating = null;
  btn.type = 'button'; btn.setAttribute('data-cvr-btn', '1');
  panel.setAttribute('data-cvr-panel', '1');
  var panelStyle = 'display:none;border:1px solid ' + line + ';background:' + bg + ';color:' + fg + ';border-radius:8px;padding:10px 12px;box-shadow:0 2px 8px rgba(0,0,0,.15);font:13px/1.4 system-ui,sans-serif;max-width:380px';
  function dot() { var d = document.createElement('span'); d.textContent = '\u00b7'; d.setAttribute('aria-hidden', 'true'); d.setAttribute('style', 'opacity:.5'); return d; }

  // One row holding "Last refreshed ...", the CVR stamp and the link. The page redraws the header now and then,
  // which would drop what we added, so this runs again whenever the header changes.
  function place() {
    var rfl = document.querySelector('#meta .rflnav');
    if (!rfl) return false;
    var row = rfl.parentNode;
    if (row.getAttribute('data-cvr-row') !== '1') {
      row = document.createElement('span');
      row.setAttribute('data-cvr-row', '1');
      row.setAttribute('style', 'display:inline-flex;align-items:center;gap:8px;white-space:nowrap');
      rfl.parentNode.insertBefore(row, rfl);
      row.appendChild(rfl);
    }
    if (when && !row.querySelector('[data-cvr-stamp]')) {
      var st = document.createElement('span');
      st.setAttribute('data-cvr-stamp', '1'); st.setAttribute('style', 'font-size:12px;color:var(--muted,#6b7280)');
      st.textContent = 'CVR refreshed ' + when;
      st.title = 'The CVR numbers (all three bot filters, revenue, orders and payments) were last refreshed from Amplitude at this time and run through ' + (snap.asOf || 'the latest finished day') + '. The rest of the page refreshes on its own schedule.';
      row.appendChild(dot()); row.appendChild(st);
    }
    if (abWhen && !row.querySelector('[data-ab-stamp]')) {
      var sa = document.createElement('span');
      sa.setAttribute('data-ab-stamp', '1'); sa.setAttribute('style', 'font-size:12px;color:var(--muted,#6b7280)');
      sa.textContent = 'A/B refreshed ' + abWhen;
      sa.title = 'The A/B Testing numbers for the tests named on that tab were last refreshed from the Amplitude Analytics API at this time and run through ' + (abSnap.asOf || 'the latest finished day') + ' (approximate). Verdicts and confidence are entered by hand.';
      row.appendChild(dot()); row.appendChild(sa);
    }
    if (wantBtn && !row.contains(btn)) { row.appendChild(dot()); row.appendChild(btn); }
    return true;
  }
  var inHeader = place();
  if (inHeader) {
    new MutationObserver(function () { place(); }).observe(document.getElementById('meta'), { childList: true, subtree: true });
  }
  if (!wantBtn) return;

  if (inHeader) {
    btn.setAttribute('style', 'cursor:pointer;border:0;background:none;color:' + accent + ';padding:0;font:inherit;font-size:12px;text-decoration:underline');
    panel.setAttribute('style', panelStyle + ';position:fixed;top:96px;right:24px;z-index:2147483000;text-align:left');
    document.body.appendChild(panel);
  } else {
    floating = document.createElement('div');
    floating.setAttribute('style', 'position:fixed;left:16px;bottom:16px;z-index:2147483000;font:13px/1.4 system-ui,sans-serif;color:' + fg + ';max-width:380px');
    btn.setAttribute('style', 'cursor:pointer;border:1px solid ' + line + ';background:' + bg + ';color:' + fg + ';border-radius:8px;padding:8px 12px;font:inherit;box-shadow:0 2px 8px rgba(0,0,0,.15)');
    panel.setAttribute('style', panelStyle + ';margin-top:8px');
    floating.appendChild(btn); floating.appendChild(panel); document.body.appendChild(floating);
  }

  function asOf() { return (typeof D !== 'undefined' && D.asOf) || 'unknown'; }
  function idle() { btn.disabled = false; btn.textContent = inHeader ? 'Refresh now' : 'Refresh data (now through ' + asOf() + ')'; btn.title = 'Pull fresh numbers from Amplitude: the A/B Testing tab and the CVR numbers. The CVR data now runs through ' + asOf() + '.'; }
  function show(title, lines, good) {
    panel.textContent = '';
    var h = document.createElement('div'); h.textContent = title; h.setAttribute('style', 'font-weight:600;color:' + (good ? '#15803d' : '#b91c1c'));
    panel.appendChild(h);
    (lines || []).concat((state && state.abLines) || []).slice(0, 18).forEach(function (l) { var p = document.createElement('div'); p.textContent = l; p.setAttribute('style', 'margin-top:4px;white-space:pre-wrap;word-break:break-word'); panel.appendChild(p); });
    panel.style.display = 'block';
  }
  // A refresh now happens in rounds. Each round is one short call to the server, which says how far it got.
  // This keeps calling until the server says it is done (or failed), pausing when Amplitude is slow. Progress is saved
  // on the server, so closing the page or a dropped connection never loses finished work: clicking again continues.
  var wait = function (s) { return (window.__cvrWait ? window.__cvrWait(s) : s * 1000); };
  function readJson(r) { return r.json().catch(function () { return { ok: false, errors: ['The server did not send a readable answer (status ' + r.status + ').'] }; }); }
  function stopWith(title, lines, good) { if (state && state.abSaved) state.abLines = state.abLines.concat(['Reload the page to see the A/B tab update.']); show(title, lines, good); idle(); }
  var state = null;
  // The A/B tab first: one POST, no rounds. Whatever happens here is only noted for the panel; the CVR refresh always goes on after it.
  function runAb() {
    btn.textContent = inHeader ? 'Refreshing A/B...' : 'Refreshing the A/B tab... Please stay on this page.';
    return fetch('/api/ab-refresh', { method: 'POST', headers: { Accept: 'application/json' } })
      .then(readJson)
      .then(function (rep) {
        var bad = rep && rep.errors && !Array.isArray(rep.errors) ? Object.keys(rep.errors) : [];
        if (rep.refused) state.abLines = ['A/B tab not refreshed: ' + (rep.error || 'refused') + ' It was left as it was.'];
        else if (rep.saved) { state.abSaved = true; state.abLines = ['A/B tab refreshed through ' + rep.asOf + ' (approximate, from the Amplitude Analytics API).']; }
        else if (rep.ok) state.abLines = ['A/B tab: checked Amplitude, nothing saved. ' + (rep.note || 'Dry run.')];
        else state.abLines = ['A/B tab not refreshed: ' + (rep.error || (rep.errors && rep.errors[0]) || 'something went wrong') + ' It was left as it was.'];
        if (bad.length) state.abLines.push('Not pulled this time, kept as they were: test ' + bad.join(', ') + '.');
      })
      .catch(function (e) { state.abLines = ['A/B tab not refreshed: could not reach the server (' + e.message + ').']; });
  }
  function step() {
    fetch('/api/refresh-cvr' + (state.runId ? '?run=' + state.runId : ''), { method: 'POST', headers: { Accept: 'application/json' } })
      .then(readJson)
      .then(function (rep) {
        state.netFails = 0;
        if (rep.runId) state.runId = rep.runId;
        if (rep.refused) return stopWith(rep.refused === 'busy' ? 'Someone else is refreshing right now' : 'Too soon since the last refresh', rep.errors, false);
        if (rep.status === 'running') {
          var d = rep.progress ? rep.progress.done : 0, t = rep.progress ? rep.progress.total : 0;
          state.still = d > state.lastDone ? 0 : state.still + 1; state.lastDone = d;
          if (rep.waitSeconds >= 300) return stopWith('Paused: Amplitude\'s hourly limit is used up', [d + ' of ' + t + ' done and saved. Click again in a while to continue.'], false);
          if (state.still >= 4) return stopWith('Amplitude is slow right now', [d + ' of ' + t + ' done and saved. Click again later to continue.'], false);
          btn.textContent = inHeader ? 'Refreshing ' + d + '/' + t + '...' : 'Refreshing... ' + d + ' of ' + t + '. Please stay on this page.';
          show('Working: ' + d + ' of ' + t + ' done', [rep.pausedBecause ? 'Amplitude is answering slowly (' + rep.pausedBecause + '). Continuing automatically.' : 'Continuing...'], true);
          return void setTimeout(step, wait(Math.max(1, rep.waitSeconds || 2)));
        }
        if (rep.ok && rep.stored) { show('Refreshed through ' + rep.window.end, ['Reloading the page...'], true); return void setTimeout(function () { (window.__cvrReload || function () { location.reload(); })(); }, 1200); }
        if (rep.ok) return stopWith('Checked Amplitude: nothing was saved', ['Would bring the data through ' + rep.window.end + ' (' + rep.window.newDays + ' new day(s)).', rep.note || 'Dry run.'], true);
        stopWith('Not refreshed', (rep.errors && rep.errors.length ? rep.errors : [rep.error || rep.note || 'Something went wrong.']).concat(['Nothing on the page was changed.']), false);
      })
      .catch(function (e) {
        state.netFails++;
        if (state.netFails <= 3) return void setTimeout(step, wait(5));
        stopWith('Not refreshed', ['Could not reach the server: ' + e.message, state.runId ? 'Progress is saved. Click again to continue.' : 'Nothing on the page was changed.'], false);
      });
  }
  idle();
  btn.addEventListener('click', function () {
    btn.disabled = true; btn.textContent = inHeader ? 'Refreshing...' : 'Refreshing... Please stay on this page.'; panel.style.display = 'none';
    state = { runId: null, lastDone: -1, still: 0, netFails: 0, abLines: [], abSaved: false };
    runAb().then(step);
  });
})();