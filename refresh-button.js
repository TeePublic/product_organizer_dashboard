// A small "Refresh data" button. Hidden unless the address ends with ?refresh=1, so only people who know about it see it.
// It sits in the top-right "meta" area, under "Last refreshed" and "About this data"; if that area is not on the page it floats
// in the bottom-left corner instead. It asks the server to pull fresh CVR numbers from Amplitude. Until saving is switched on,
// the server only does a dry run and the result panel says so. Loaded after app.js.
(function () {
  if (new URLSearchParams(location.search).get('refresh') !== '1') return;
  var host = document.getElementById('meta');
  var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  var fg = dark ? '#e8e8e8' : '#1a1a1a', bg = dark ? '#1f1f23' : '#ffffff', line = dark ? '#3a3a42' : '#cfcfd6', accent = dark ? '#a5b4fc' : '#4f46e5';
  var box = document.createElement('div'), btn = document.createElement('button'), panel = document.createElement('div');
  btn.type = 'button';
  panel.setAttribute('data-cvr-panel', '1');
  var panelStyle = 'display:none;border:1px solid ' + line + ';background:' + bg + ';color:' + fg + ';border-radius:8px;padding:10px 12px;box-shadow:0 2px 8px rgba(0,0,0,.15);font:13px/1.4 system-ui,sans-serif;max-width:380px';
  if (host) {
    box.setAttribute('style', 'display:block;text-align:right;margin-top:4px');
    btn.setAttribute('style', 'cursor:pointer;border:0;background:none;color:' + accent + ';padding:0;font:inherit;text-decoration:underline');
    panel.setAttribute('style', panelStyle + ';position:fixed;top:96px;right:24px;z-index:2147483000;text-align:left');
    box.appendChild(btn); host.appendChild(box); document.body.appendChild(panel);
  } else {
    box.setAttribute('style', 'position:fixed;left:16px;bottom:16px;z-index:2147483000;font:13px/1.4 system-ui,sans-serif;color:' + fg + ';max-width:380px');
    btn.setAttribute('style', 'cursor:pointer;border:1px solid ' + line + ';background:' + bg + ';color:' + fg + ';border-radius:8px;padding:8px 12px;font:inherit;box-shadow:0 2px 8px rgba(0,0,0,.15)');
    panel.setAttribute('style', panelStyle + ';margin-top:8px');
    box.appendChild(btn); box.appendChild(panel); document.body.appendChild(box);
  }

  function asOf() { return (typeof D !== 'undefined' && D.asOf) || 'unknown'; }
  function idle() { btn.disabled = false; btn.textContent = (host ? '\u21bb Refresh data' : 'Refresh data (now through ' + asOf() + ')'); btn.title = 'Pull fresh numbers from Amplitude. The data now runs through ' + asOf() + '.'; }
  function show(title, lines, good) {
    panel.textContent = '';
    var h = document.createElement('div'); h.textContent = title; h.setAttribute('style', 'font-weight:600;color:' + (good ? '#15803d' : '#b91c1c'));
    panel.appendChild(h);
    (lines || []).slice(0, 18).forEach(function (l) { var p = document.createElement('div'); p.textContent = l; p.setAttribute('style', 'margin-top:4px;white-space:pre-wrap;word-break:break-word'); panel.appendChild(p); });
    panel.style.display = 'block';
  }
  idle();
  btn.addEventListener('click', function () {
    btn.disabled = true; btn.textContent = 'Refreshing... this takes about a minute. Please stay on this page.'; panel.style.display = 'none';
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