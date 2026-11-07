// Where the A/B tab's numbers come from. Loaded after /api/ab-data and BEFORE app.js, so app.js can call these two helpers when it draws the tab.
//   abSrcLine()        one short line under the "Running" heading: what was refreshed automatically, from where, and when (or, with no automatic
//                      refresh yet, that the numbers were entered by hand). It is always shown, so the tab never has an unexplained number.
//   abSrcText(t, key)  replaces the default wording of four rows in a test's "Where this comes from" box when that test has a refreshed `src`.
//                      Returns '' for a test without one, and app.js then uses its normal wording.
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

  window.abSrcLine = function () {
    var s = snap(), names = s && s.tests ? s.tests.map(nameOf).filter(Boolean) : [];
    var readAt = typeof EXPS !== 'undefined' && EXPS.asOf ? ' (read ' + EXPS.asOf + ')' : '';
    if (!s || !names.length) return '<p class="cap" style="' + STYLE + '">Every number on this tab was pulled from Amplitude Experiment (and Statsig and Split for TeePublic) and entered into the dashboard\'s data file' + esc(readAt) + '. Automatic refresh from the Amplitude Analytics API is not switched on yet. Click ⓘ Sources on a test for details.</p>';
    return '<p class="cap" style="' + STYLE + '">Refreshed automatically from the Amplitude Analytics API (approximate): ' + esc(names.join(', ')) + '. Pulled ' + esc(et(s.createdAt)) + ', through ' + esc(s.asOf) + '. Other tests, and every verdict and confidence figure, were entered by hand from their own tools' + esc(readAt) + '. Click ⓘ Sources on a test for details.</p>';
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