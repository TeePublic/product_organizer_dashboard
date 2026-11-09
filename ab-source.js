// The A/B tab's note and refresh button. Loaded after /api/ab-data and BEFORE app.js, so app.js can call these two helpers when it draws the tab.
//   abSrcLine()        the one line under the "Running" heading: what was refreshed automatically, from where, and when (or, with no automatic refresh
//                      yet, that the numbers were entered by hand). On the Redbubble (RBO) view it ends with a "Refresh A/B" link; on the TeePublic
//                      (TPO) view it only says those numbers are not pulled automatically. It is always shown, so the tab never has an unexplained number.
//   abSrcText(t, key)  replaces the default wording of four rows in a test's "Where this comes from" box when that test has a refreshed `src`.
//                      Returns '' for a test without one, and app.js then uses its normal wording.
// The link asks /api/ab-refresh (POST) to pull the Redbubble tests that refresh automatically and save a snapshot, then reloads the page. It does
// not touch CVR, the roadmap or TeePublic, which have their own buttons and notes. The click is handled once for the whole page, so it keeps
// working when the page redraws the tab, and a refresh that is running keeps its state across a redraw.
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  // "Sat Nov 7, 3:48 PM ET" from an ISO time or Postgres text time.
  function et(s) {
    try {
      var iso = String(s).replace(' ', 'T').replace(/([+-]\d\d)$/, '$1:00').replace(/(\.\d{3})\d+/, '$1');
      var d = new Date(iso); if (isNaN(d.getTime())) return '';
      var p = {}; new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
      return p.weekday + ' ' + p.month + ' ' + p.day + ', ' + p.hour + ':' + p.minute + ' ' + p.dayPeriod + ' ET';
    } catch (e) { return ''; }
  }
  function snap() { var s = window.__abSnapshot; return s && s.applied ? s : null; }
  function nameOf(id) {
    var found = null;
    [].concat(typeof EXPS !== 'undefined' ? (EXPS.live || []) : [], typeof EXPS !== 'undefined' ? (EXPS.done || []) : []).forEach(function (t) { if (String(t.id) === String(id)) found = t; });
    return found ? found.name : null;
  }
  var STYLE = 'margin:8px 0 12px;max-width:760px';
  function parts(date, opts) { var p = {}; new Intl.DateTimeFormat('en-US', opts).formatToParts(date).forEach(function (x) { p[x.type] = x.value; }); return p; }
  // "Fri Nov 6" from "2026-11-06".
  function day(s) {
    var m = /^(\d{4})-(\d\d)-(\d\d)/.exec(String(s || '')); if (!m) return String(s || '');
    var p = parts(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)), { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' });
    return p.weekday + ' ' + p.month + ' ' + p.day;
  }
  function testNames(ids) { return (ids || []).map(nameOf).filter(Boolean); }

  // What the button is doing and what it last said. Kept here, not in the page, so a redraw of the tab does not lose it.
  var st = { busy: false, title: '', lines: [], good: true, show: false };
  var BTN_STYLE = 'cursor:pointer;border:0;background:none;color:var(--accent,#4f46e5);padding:0;font:inherit;font-weight:600;text-decoration:underline';
  var BTN_TITLE = 'Pull fresh numbers for the Redbubble tests that refresh automatically. It does not change CVR, the roadmap, TeePublic or the tests entered by hand. Takes about 15 seconds per test.';
  function btnHtml() { return '<button type="button" data-ab-refresh="1" title="' + esc(BTN_TITLE) + '" style="' + BTN_STYLE + '"' + (st.busy ? ' disabled' : '') + '>' + (st.busy ? 'Refreshing...' : 'Refresh A/B') + '</button>'; }
  function panelHtml() {
    var inner = st.show ? '<div style="max-width:560px;border:1px solid var(--line-2,#cfcfd6);background:var(--surface,#fff);color:var(--ink,#1a1a1a);border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.45;box-shadow:0 2px 8px rgba(0,0,0,.12)"><div style="font-weight:600;color:' + (st.good ? '#15803d' : '#b91c1c') + '">' + esc(st.title) + '</div>' + st.lines.slice(0, 12).map(function (l) { return '<div style="margin-top:4px;white-space:pre-wrap;word-break:break-word">' + esc(l) + '</div>'; }).join('') + '</div>' : '';
    return '<div data-ab-panel="1" style="margin:0 0 12px"' + (st.show ? '' : ' hidden') + '>' + inner + '</div>';
  }
  // Update whatever copies of the button and panel are on the page right now.
  function paint() {
    if (typeof document === 'undefined') return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-ab-refresh]'), function (b) { b.disabled = st.busy; b.textContent = st.busy ? 'Refreshing...' : 'Refresh A/B'; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-ab-panel]'), function (p) { var tmp = document.createElement('div'); tmp.innerHTML = panelHtml(); p.replaceWith(tmp.firstChild); });
  }
  function say(title, lines, good) { st.busy = false; st.title = title; st.lines = lines || []; st.good = !!good; st.show = true; paint(); }
  function readJson(r) { return r.json().catch(function () { return { ok: false, error: 'The server did not send a readable answer (status ' + r.status + ').' }; }); }
  function reload() { (window.__abReload || function () { location.reload(); })(); }

  function refresh() {
    if (st.busy) return;
    st.busy = true; st.show = false; paint();
    fetch('/api/ab-refresh', { method: 'POST', headers: { Accept: 'application/json' } })
      .then(readJson)
      .then(function (rep) {
        var left = rep && rep.errors && !Array.isArray(rep.errors) ? Object.keys(rep.errors).map(function (id) { return nameOf(id) || ('test ' + id); }) : [];
        var extra = left.length ? ['Not pulled this time, kept as they were: ' + left.join(', ') + '.'] : [];
        if (rep.refused) return say('Not refreshed', [rep.error || 'The refresh was refused.', 'The A/B tab was left as it was.'], false);
        if (rep.saved) { say('Refreshed through ' + day(rep.asOf), ['Reloading the page...'].concat(extra), true); return void setTimeout(reload, 1200); }
        if (rep.ok) return say('Checked Amplitude: nothing was saved', [rep.note || 'Dry run.'].concat(extra), true);
        say('Not refreshed', [rep.error || (rep.errors && rep.errors[0]) || 'Something went wrong.'].concat(extra, ['The A/B tab was left as it was.']), false);
      })
      .catch(function (e) { say('Not refreshed', ['Could not reach the server: ' + e.message, 'The A/B tab was left as it was.'], false); });
  }
  // One handler for the whole page, so the button works however many times the tab is redrawn.
  if (typeof document !== 'undefined' && !window.__abRefreshBound) { window.__abRefreshBound = true; document.addEventListener('click', function (ev) { var b = ev.target && ev.target.closest && ev.target.closest('[data-ab-refresh]'); if (b) { ev.preventDefault(); refresh(); } }); }

  // The line follows the RBO / TPO toggle: the automatic refresh covers Redbubble tests only, and the TeePublic view says so.
  window.abSrcLine = function () {
    var site = 'RB'; try { if (typeof abSiteNow === 'function') site = abSiteNow(); } catch (e) { /* keep RB */ }
    var s = snap(), names = s && s.tests ? testNames(s.tests) : [];
    var readAt = typeof EXPS !== 'undefined' && EXPS.asOf ? ' (read ' + EXPS.asOf + ')' : '';
    var more = ' Click \u24d8 Sources on a test for details.';
    if (site === 'TP') return '<p class="cap" style="' + STYLE + '">TeePublic (TPO) numbers are not pulled automatically. They come from Statsig and Split and were entered into the dashboard\'s data file' + esc(readAt) + '. The automatic refresh from the Amplitude Analytics API covers Redbubble (RBO) tests only.' + more + '</p>';
    var text = (!s || !names.length)
      ? 'Every Redbubble (RBO) number on this tab was pulled from Amplitude Experiment and entered into the dashboard\'s data file' + esc(readAt) + '. Automatic refresh from the Amplitude Analytics API is not switched on yet; when it is, it covers Redbubble (RBO) tests only.' + more
      : 'Refreshed automatically from the Amplitude Analytics API (approximate): ' + esc(names.join(', ')) + '. Pulled ' + esc(et(s.createdAt)) + ', through ' + esc(day(s.asOf)) + '. Only Redbubble (RBO) tests are pulled automatically; other RBO tests, and every verdict and confidence figure, were entered by hand from Amplitude Experiment' + esc(readAt) + '.' + more;
    return '<p class="cap" data-ab-note="1" style="' + STYLE + '">' + text + ' ' + btnHtml() + '</p>' + panelHtml();
  };

  window.abSrcText = function (t, which) {
    var s = t && t.src; if (!s || typeof s !== 'object') return '';
    var when = et(s.pulledAt), amp = t.url ? '<a href="' + esc(t.url) + '" target="_blank" rel="noopener">Amplitude Experiment ↗</a>' : 'Amplitude Experiment';
    if (which === 'origin') return 'Numbers pulled from the ' + esc(s.source) + (when ? ' on ' + esc(when) : '') + ', ' + esc(s.window) + '; ' + esc(s.method) + '. Approximate: ' + esc(s.note) + ' The test itself lives in ' + amp + (t.id ? ' (experiment ' + esc(t.id) + ')' : '') + '.';
    if (which === 'primary') return 'Computed from the Analytics API (users tagged with their experiment version), test vs control. Approximate: it can differ from the ' + amp + ' screen by about half a point.';
    if (which === 'site_imp') return 'Calculated: the CVR change for people in the test (Analytics API, approximate) × the share of site traffic the test reaches (' + Math.round((t.reach || 1) * 100) + '%, entered by hand).';
    if (which === 'conf') return 'Entered by hand from ' + amp + '. The automatic refresh does not change confidence, significance or verdicts.';
    return '';
  };
})();