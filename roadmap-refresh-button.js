// The "Refresh from sheet" button on the Roadmap tab (app.js draws it beside the "Built from the sheet" note). Loaded after app.js.
// A click asks /api/roadmap-refresh (POST) to read the Active Work tab now and save a new snapshot, then reloads the page so it shows it.
// The server allows one saved pull an hour for everyone; inside that window it answers "already up to date" without reading the sheet.
// The roadmap also refreshes by itself twice a day (Vercel cron). The CVR pages have their own button (refresh-button.js).
(function () {
  var ENDPOINT = '/api/roadmap-refresh', MIN_GAP_MIN = 60, busy = false;

  function parseTime(s) { var d = new Date(String(s).replace(' ', 'T').replace(/([+-]\d\d)$/, '$1:00').replace(/(\.\d{3})\d+/, '$1')); return isNaN(d.getTime()) ? null : d; }
  function fmtTime(d) {
    var p = {}; new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
    return p.weekday + ' ' + p.month + ' ' + p.day + ', ' + p.hour + ':' + p.minute + ' ' + p.dayPeriod + ' ET';
  }
  function ago(d) { var m = Math.max(0, Math.round((Date.now() - d) / 60000)); if (m < 60) return m + (m === 1 ? ' minute ago' : ' minutes ago'); var h = Math.floor(m / 60); if (h < 48) return h + (h === 1 ? ' hour ago' : ' hours ago'); return Math.floor(h / 24) + ' days ago'; }
  function pageSnapshotTime() { var s = window.__roadmapSnapshot; return s && s.createdAt ? parseTime(s.createdAt) : null; }
  var seen = null; // the newest pull the server has told us about (the cron or another person's click can be newer than this page's snapshot)
  function lastPull() { var a = pageSnapshotTime(); return a && seen ? (a > seen ? a : seen) : (a || seen); }
  function lockedUntil() { var t = lastPull(); return t ? new Date(t.getTime() + MIN_GAP_MIN * 60000) : null; }
  function locked() { var u = lockedUntil(); return !!u && Date.now() < u.getTime(); }
  function timeOnly(d) { return new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' }).format(d) + ' ET'; }
  // For an hour after any pull the button looks disabled. It stays clickable so a click can say why (like the Amplitude button). The class sits on <html>, so it survives the page redrawing the button.
  function paint() { document.documentElement.classList.toggle('rm-locked', locked()); }
  function hover() {
    var t = lastPull(), live = window.__roadmapSnapshot && Array.isArray(window.__roadmapSnapshot.rows);
    var lines = [t && (live || seen) ? 'Roadmap last pulled from the sheet: ' + fmtTime(t) + ' (' + ago(t) + ').' : 'No saved pull from the sheet is being shown yet.'];
    if (locked()) lines.push('Up to date. You can refresh again at ' + timeOnly(lockedUntil()) + '.');
    lines.push('It also refreshes by itself twice a day, so you rarely need this button.', 'A refresh takes a few seconds and is limited to one an hour for everyone.', 'Roadmap only: the CVR pages have their own button.');
    return lines.join('\n');
  }

  // ---- a message card, fixed to the corner so it survives the page redrawing ----
  function el(tag, attrs, style) { var e = document.createElement(tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (style) e.setAttribute('style', style); return e; }
  var card = el('div', { 'data-rm-card': '1', role: 'status' }, 'display:none;position:fixed;right:20px;bottom:20px;z-index:60;max-width:420px;border:1px solid var(--line-2,#cfcfd6);background:var(--surface,#fff);color:var(--ink,#1a1a1a);border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.45;box-shadow:0 4px 16px rgba(0,0,0,.28)');
  document.body.appendChild(card);
  function closeCard() { card.style.display = 'none'; }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCard(); });
  document.addEventListener('click', function (e) { if (card.style.display !== 'none' && !card.contains(e.target) && !(e.target.closest && e.target.closest('[data-rm-refresh]'))) closeCard(); });
  function show(title, lines, good) {
    card.textContent = '';
    var head = el('div', {}, 'display:flex;justify-content:space-between;align-items:flex-start;gap:12px');
    var h = el('div', {}, 'font-weight:600;color:' + (good ? '#15803d' : '#b91c1c')); h.textContent = title; head.appendChild(h);
    var x = el('button', { type: 'button', 'aria-label': 'Close this message' }, 'cursor:pointer;border:0;background:none;color:var(--muted,#6b7280);font-size:20px;line-height:1;padding:0 2px;margin:-2px -2px 0 0');
    x.textContent = '×'; x.addEventListener('click', closeCard); head.appendChild(x); card.appendChild(head);
    (lines || []).slice(0, 10).forEach(function (l) { var p = el('div', {}, 'margin-top:4px;white-space:pre-wrap;word-break:break-word'); p.textContent = l; card.appendChild(p); });
    card.style.display = 'block';
  }
  function buttons() { return document.querySelectorAll('[data-rm-refresh]'); }
  function setBusy(on) { busy = on; buttons().forEach(function (b) { b.disabled = on; b.textContent = on ? 'Refreshing...' : '↻ Refresh from sheet'; }); }
  function reloadSoon() { setTimeout(function () { (window.__rmReload || function () { location.reload(); })(); }, 1200); }

  function run() {
    if (busy) return;
    if (locked()) { var lt = lastPull(); return show('Already up to date', ['The sheet was pulled ' + fmtTime(lt) + ' (' + ago(lt) + '), and this page is showing that pull.', 'You can refresh again at ' + timeOnly(lockedUntil()) + '. It also refreshes by itself twice a day.'], true); }
    setBusy(true); closeCard();
    fetch(ENDPOINT, { method: 'POST', headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'The server did not send a readable answer (status ' + r.status + ').' }; }); })
      .then(function (j) {
        setBusy(false);
        if (j.ok && j.stored) {
          var sh = j.sheet || {};
          show('Refreshed from the sheet', [(j.sheetRows || sh.filledRows || '?') + ' project rows read; ' + (sh.cardsOnPage != null ? sh.cardsOnPage + ' on the page' : 'cards rebuilt') + (sh.hiddenUntilAssigned && sh.hiddenUntilAssigned.length ? ', ' + sh.hiddenUntilAssigned.length + ' hidden until a team is set' : '') + '.', 'Reloading the page...'], true);
          return reloadSoon();
        }
        if (j.ok && j.refused === 'recent') {
          var saved = j.lastPulled ? parseTime(j.lastPulled) : null, mine = pageSnapshotTime();
          if (saved) { seen = saved; paint(); }
          if (saved && (!mine || saved.getTime() - mine.getTime() > 5000)) { show('A newer pull is available', ['The sheet was pulled ' + fmtTime(saved) + ' (' + ago(saved) + '). Reloading the page...'], true); return reloadSoon(); }
          return show('Already up to date', ['The sheet was pulled ' + (saved ? fmtTime(saved) + ' (' + ago(saved) + ')' : 'within the last hour') + ', and this page is showing that pull.', 'You can refresh again at ' + timeOnly(lockedUntil()) + '.'], true);
        }
        if (j.ok) return show('Checked the sheet: nothing was saved', [j.note || 'Saving is switched off, so this was a dry run.'], false);
        show('Not refreshed', [j.error || j.note || 'Something went wrong.', 'The page was not changed.'], false);
      })
      .catch(function (e) { setBusy(false); show('Not refreshed', ['Could not reach the server: ' + e.message, 'The page was not changed.'], false); });
  }
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-rm-refresh]'); if (b && !b.disabled) run(); });
  paint(); setInterval(paint, 30000); window.__rmPaint = paint; // (the hook is only for tests)
  document.addEventListener('mouseover', function (e) { var b = e.target.closest && e.target.closest('[data-rm-refresh]'); if (b && !b.disabled) b.title = hover(); }); // keeps "x minutes ago" current while the page stays open
})();
