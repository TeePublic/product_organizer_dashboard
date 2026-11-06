// Two small things on the same line as "Last refreshed ..." in the top-right of the header:
//  1. For everyone, once a saved CVR refresh is in use:  "CVR refreshed Fri Nov 6, 11:42 AM ET"  (when the button last ran successfully).
//  2. Only when the address ends with ?refresh=1:  a "Refresh now" link that asks the server to pull fresh CVR numbers from Amplitude.
// If the "Last refreshed" line is not on the page, the link floats bottom-left and the stamp is skipped. Loaded after app.js.
(function () {
  var wantBtn = new URLSearchParams(location.search).get('refresh') === '1';
  var snap = window.__cvrSnapshot; // set by /api/cvr-data when a saved refresh is being shown
  function fmt(s) {
    var iso = String(s).replace(' ', 'T').replace(/([+-]\d\d)$/, '$1:00').replace(/(\.\d{3})\d+/, '$1');
    var d = new Date(iso); if (isNaN(d.getTime())) return null;
    var p = {}; new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
    return p.weekday + ' ' + p.month + ' ' + p.day + ', ' + p.hour + ':' + p.minute + ' ' + p.dayPeriod + ' ET';
  }
  var when = snap && snap.applied && snap.createdAt ? fmt(snap.createdAt) : null;
  if (!wantBtn && !when) return;

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
  function idle() { btn.disabled = false; btn.textContent = inHeader ? 'Refresh now' : 'Refresh data (now through ' + asOf() + ')'; btn.title = 'Pull fresh numbers from Amplitude. The data now runs through ' + asOf() + '.'; }
  function show(title, lines, good) {
    panel.textContent = '';
    var h = document.createElement('div'); h.textContent = title; h.setAttribute('style', 'font-weight:600;color:' + (good ? '#15803d' : '#b91c1c'));
    panel.appendChild(h);
    (lines || []).slice(0, 18).forEach(function (l) { var p = document.createElement('div'); p.textContent = l; p.setAttribute('style', 'margin-top:4px;white-space:pre-wrap;word-break:break-word'); panel.appendChild(p); });
    panel.style.display = 'block';
  }
  idle();
  btn.addEventListener('click', function () {
    btn.disabled = true; btn.textContent = inHeader ? 'Refreshing... about a minute' : 'Refreshing... this takes about a minute. Please stay on this page.'; panel.style.display = 'none';
    fetch('/api/refresh-cvr', { method: 'POST', headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json().catch(function () { return { ok: false, errors: ['The server did not send a readable answer (status ' + r.status + ').'] }; }); })
      .then(function (rep) {
        if (rep.refused) show(rep.refused === 'busy' ? 'Someone else is refreshing right now' : 'Too soon since the last refresh', rep.errors, false);
        else if (rep.ok && rep.stored) { show('Refreshed through ' + rep.window.end, ['Reloading the page...'], true); setTimeout(function () { (window.__cvrReload || function () { location.reload(); })(); }, 1200); return; }
        else if (rep.ok) show('Checked Amplitude: nothing was saved', ['Would bring the data through ' + rep.window.end + ' (' + rep.window.newDays + ' new day(s)).', rep.note || 'Dry run.'], true);
        else show('Not refreshed', (rep.errors && rep.errors.length ? rep.errors : [rep.error || rep.note || 'Something went wrong.']).concat(['Nothing on the page was changed.']), false);
      })
      .catch(function (e) { show('Not refreshed', ['Could not reach the server: ' + e.message, 'Nothing on the page was changed.'], false); })
      .then(function () { idle(); });
  });
})();