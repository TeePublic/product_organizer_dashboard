// The "Refresh data" button on the CVR pages (Redbubble and TeePublic), top right under the Bot filter. Its hover says when the CVR numbers
// were last pulled from Amplitude and which day they run through, and whether a click would change anything. To stop people from clicking
// it over and over: when the numbers are already current and were pulled in the last 4 hours, a click explains that instead of calling the
// server (with a small "Refresh anyway" link), and the server itself allows one saved refresh an hour for everyone.
// It shows only on the CVR pages; the Roadmap and A/B tests tabs have their own notes.
// It also adds one line under the By product heading saying what that section covers, because By product is NOT part of the
// automatic Amplitude refresh (Mike's Claude updates it once a day) and can end a day or two before the CVR numbers. Loaded after app.js.
(function () {
  var snap = window.__cvrSnapshot; // set by /api/cvr-data when a saved refresh is being shown

  // ---- wording ----
  function parts(date, opts) { var p = {}; new Intl.DateTimeFormat('en-US', opts).formatToParts(date).forEach(function (x) { p[x.type] = x.value; }); return p; }
  function fmtTime(s) {
    var iso = String(s).replace(' ', 'T').replace(/([+-]\d\d)$/, '$1:00').replace(/(\.\d{3})\d+/, '$1');
    var d = new Date(iso); if (isNaN(d.getTime())) return null;
    var p = parts(d, { timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    return p.weekday + ' ' + p.month + ' ' + p.day + ', ' + p.hour + ':' + p.minute + ' ' + p.dayPeriod + ' ET';
  }
  function fmtDay(s) {
    var m = /^(\d{4})-(\d\d)-(\d\d)/.exec(String(s || '')); if (!m) return null;
    var p = parts(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)), { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' });
    return p.weekday + ' ' + p.month + ' ' + p.day;
  }
  function asOf() { return (typeof D !== 'undefined' && D.asOf) || null; }
  var now = function () { return window.__cvrNow ? window.__cvrNow() : new Date(); }; // (the hook is only for tests)
  function parseTime(s) { var d = new Date(String(s).replace(' ', 'T').replace(/([+-]\d\d)$/, '$1:00').replace(/(\.\d{3})\d+/, '$1')); return isNaN(d.getTime()) ? null : d; }
  var pulled = snap && snap.applied && snap.createdAt ? parseTime(snap.createdAt) : null;       // when the saved refresh was made
  var when = pulled ? fmtTime(snap.createdAt) : null;
  var through = snap && snap.applied ? fmtDay(snap.asOf) : null;
  function ago(d) { var m = Math.max(0, Math.round((now() - d) / 60000)); if (m < 60) return m + (m === 1 ? ' minute ago' : ' minutes ago'); var h = Math.floor(m / 60); if (h < 48) return h + (h === 1 ? ' hour ago' : ' hours ago'); return Math.floor(h / 24) + ' days ago'; }
  // The newest day both sites have finished (TeePublic cuts days in Eastern time, Redbubble in Pacific, and a day needs 5 hours to settle), the same rule the server uses.
  function addDays(iso, n) { var m = iso.split('-'); return new Date(Date.UTC(+m[0], +m[1] - 1, +m[2]) + n * 864e5).toISOString().slice(0, 10); }
  function dateIn(tz, d) { return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d); }
  function lastComplete(tz) { return addDays(dateIn(tz, new Date(now().getTime() - 5 * 3600e3)), -1); }
  function newestFullDay() { var a = lastComplete('America/New_York'), b = lastComplete('America/Los_Angeles'); return a < b ? a : b; }
  var RECENT_HOURS = 4;
  function current() { var have = asOf(); return !!(have && have >= newestFullDay()); }        // is the newest complete day already in?
  function softLocked() { return !!(pulled && current() && now() - pulled < RECENT_HOURS * 3600e3); } // current AND pulled recently: a click would change nothing
  function hover() {
    var lines = [when ? 'CVR numbers last pulled from Amplitude: ' + when + (through ? ', through ' + through : '') + ' (' + ago(pulled) + ').'
      : 'CVR numbers run through ' + (fmtDay(asOf()) || 'the latest finished day') + '. No automatic pull has been saved yet.'];
    lines.push(current() ? 'Already up to date: the newest complete day (' + fmtDay(newestFullDay()) + ') is in.' : 'A newer complete day is available (' + fmtDay(newestFullDay()) + ').');
    lines.push('It also refreshes by itself every morning around 8:30 AM ET, so you rarely need this button.');
    lines.push('A refresh takes 3 to 4 minutes and is limited to one an hour for everyone.');
    lines.push('CVR pages only: the roadmap, A/B tests and By product refresh separately.');
    return lines.join('\n');
  }

  // ---- the pieces (created once, so a running refresh survives the page redrawing around them) ----
  function el(tag, attrs, style) { var e = document.createElement(tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (style) e.setAttribute('style', style); return e; }
  var note = el('span', { 'data-cvr-note': '1' }, 'display:inline-flex;align-items:center;margin:8px 0 0;vertical-align:middle');
  // Uses the page's own hover box (class hint + data-pop) so it looks and behaves like every other tip, not the browser's grey tooltip (Mike, Nov 11).
  var btn = el('button', { type: 'button', 'data-cvr-btn': '1', 'data-pop': 'cvrrefresh', class: 'cvr-refresh-btn hint' }, '');
  note.appendChild(btn); // the "last pulled" wording lives in this button's hover (Mike, Nov 9)
  var wrap = el('div', { 'data-cvr-panel': '1' }, 'display:none;flex:0 0 100%;width:100%;margin:8px 0 0;text-align:left');
  var card = el('div', { 'data-cvr-card': '1' }, 'max-width:560px;border:1px solid var(--line-2,#cfcfd6);background:var(--surface,#fff);color:var(--ink,#1a1a1a);border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.45;box-shadow:0 2px 8px rgba(0,0,0,.12)');
  wrap.appendChild(card);

  // ---- put it next to the sale pill. The page redraws this area when the day, site or tab changes, so this runs again after every redraw ----
  // Top right, in the stack under the Bot filter (Mike, Nov 9). Falls back to the old spot beside the sale pill if that stack is missing.
  var ANCHORS = ['.dtop .bfwrap', '.vsalew .vsale', '.dayline .tag', '[aria-label="Day under review"] .tag'];
  var HOSTS = ['.dtop', '.vsalew', '.dayline', '[aria-label="Day under review"]'];
  function first(list) { for (var i = 0; i < list.length; i++) { var f = document.querySelector(list[i]); if (f) return f; } return null; }
  function place() {
    var a = first(ANCHORS);
    if (a && a.parentNode) {
      if (a.nextSibling !== note || note.nextSibling !== wrap) { a.parentNode.insertBefore(note, a.nextSibling); note.parentNode.insertBefore(wrap, note.nextSibling); }
      return;
    }
    var h = first(HOSTS);
    if (h) { if (note.parentNode !== h) { h.appendChild(note); h.appendChild(wrap); } return; }
    if (note.parentNode) { note.parentNode.removeChild(note); if (wrap.parentNode) wrap.parentNode.removeChild(wrap); } // not on a CVR page
  }
  // ---- By product: say what it covers. It comes from Mike's Claude, not the automatic refresh, so it can end before the CVR numbers do ----
  var pnote = el('p', { 'data-prod-note': '1' }, 'margin:2px 0 10px;font-size:12.5px;line-height:1.45;color:var(--muted,#6b7280)');
  function productNote() {
    var g = document.getElementById('g-product');
    if (!g || typeof PROD === 'undefined' || !PROD) { if (pnote.parentNode) pnote.parentNode.removeChild(pnote); return; }
    var ends = ['tp', 'rb'].map(function (b) { var d = PROD[b] && PROD[b].dates; return d && d.length ? d[d.length - 1] : null; }).filter(Boolean).sort();
    var through = ends[0] || PROD.asOf, shown = fmtDay(through), site = asOf();
    if (!shown) { if (pnote.parentNode) pnote.parentNode.removeChild(pnote); return; }
    var text = 'By product is updated once a day by Mike\u2019s Claude, not by the automatic Amplitude refresh. It runs through ' + shown + '.' + (site && through < site ? ' Until it is extended, the newest day or two show No value.' : '');
    if (pnote.textContent !== text) pnote.textContent = text;
    var head = g.querySelector('.ghead');
    if (head) { if (head.nextSibling !== pnote) g.insertBefore(pnote, head.nextSibling); } else if (pnote.parentNode !== g) g.insertBefore(pnote, g.firstChild);
  }
  var queued = 0;
  function later() { if (queued) return; queued = (window.requestAnimationFrame || window.setTimeout)(function () { queued = 0; place(); productNote(); }); }
  place(); productNote();
  new MutationObserver(later).observe(document.body, { childList: true, subtree: true });

  // ---- the button ----
  function hoverTip() {
    try { if (typeof POPS !== 'undefined') Object.defineProperty(POPS, 'cvrrefresh', { configurable: true, get: function () { var esc = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }; var L = hover().split('\n'); return '<b class="tiph nosrc">Refresh Amplitude data</b><ul class="hul nrul">' + L.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; } }); } catch (e) {}
  }
  function idle() {
    btn.disabled = false; btn.textContent = '\u21bb Refresh Amplitude data'; btn.removeAttribute('title'); hoverTip();
    var locked = softLocked(); btn.setAttribute('aria-disabled', locked ? 'true' : 'false'); btn.style.opacity = locked ? '.75' : ''; /* stays a normal pointer button: clicking when current just explains why nothing changed */
  }
  // The message card can always be closed: the x, the Escape key, or a click anywhere outside it (Mike, Nov 10: it would not go away).
  // Closing it during a running refresh only hides the progress card; the button still shows the count and the refresh carries on.
  var userClosed = false;
  function closeCard() { if (wrap.style.display !== 'none') { wrap.style.display = 'none'; userClosed = true; } }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCard(); });
  document.addEventListener('click', function (e) { if (wrap.style.display !== 'none' && !wrap.contains(e.target) && !note.contains(e.target)) closeCard(); });
  function show(title, lines, good) {
    card.textContent = '';
    var head = el('div', {}, 'display:flex;justify-content:space-between;align-items:flex-start;gap:12px');
    var h = el('div', {}, 'font-weight:600;color:' + (good ? '#15803d' : '#b91c1c')); h.textContent = title; head.appendChild(h);
    var x = el('button', { type: 'button', 'data-cvr-close': '1', 'aria-label': 'Close this message' }, 'cursor:pointer;border:0;background:none;color:var(--muted,#6b7280);font-size:20px;line-height:1;padding:0 2px;margin:-2px -2px 0 0');
    x.textContent = '×'; x.addEventListener('click', closeCard); head.appendChild(x); card.appendChild(head);
    (lines || []).slice(0, 18).forEach(function (l) { var p = el('div', {}, 'margin-top:4px;white-space:pre-wrap;word-break:break-word'); p.textContent = l; card.appendChild(p); });
    wrap.style.display = 'block';
  }
  // A refresh happens in rounds. Each round is one short call to the server, which says how far it got.
  // This keeps calling until the server says it is done (or failed), pausing when Amplitude is slow. Progress is saved
  // on the server, so closing the page or a dropped connection never loses finished work: clicking again continues.
  var wait = function (s) { return (window.__cvrWait ? window.__cvrWait(s) : s * 1000); };
  function readJson(r) { return r.json().catch(function () { return { ok: false, errors: ['The server did not send a readable answer (status ' + r.status + ').'] }; }); }
  function stopWith(title, lines, good) { show(title, lines, good); idle(); }
  var state = null;
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
          btn.textContent = 'Refreshing ' + d + '/' + t + '...';
          var slow = rep.pausedBecause && !/^(time )?budget/.test(rep.pausedBecause); // a round that just used up its 30 seconds is normal
          if (!userClosed) show('Working: ' + d + ' of ' + t + ' done', [slow ? 'Amplitude is answering slowly (' + rep.pausedBecause + '). Continuing automatically. Please stay on this page.' : 'Continuing automatically. Please stay on this page.'], true);
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
  function start() {
    btn.disabled = true; btn.textContent = 'Refreshing...'; btn.removeAttribute('title'); wrap.style.display = 'none'; userClosed = false;
    state = { runId: null, lastDone: -1, still: 0, netFails: 0 };
    step();
  }
  btn.addEventListener('mouseenter', function () { if (!btn.disabled && btn.textContent.indexOf('Refreshing') !== 0) idle(); }); // keep "x minutes ago" and "up to date" current while the page stays open
  btn.addEventListener('click', function () {
    if (btn.disabled) return;
    if (softLocked()) {
      show('Already up to date', ['The CVR numbers were pulled ' + when + ' (' + ago(pulled) + ') and run through ' + (through || fmtDay(asOf())) + ', the newest complete day.', 'They also refresh by themselves every morning around 8:30 AM ET, so there is nothing new to fetch right now.', 'This button only refreshes the Amplitude CVR numbers. The "Last refreshed" date at the top right is a different clock: ' + ((typeof REFRESH !== 'undefined' && REFRESH && REFRESH.last) ? REFRESH.last : 'the last hand update') + ' is when Claude last updated the hand-curated panels (roadmap, A/B tests, By product).'], true);
      var again = el('button', { type: 'button', 'data-cvr-anyway': '1' }, 'margin-top:8px;cursor:pointer;border:0;background:none;color:var(--accent,#4f46e5);padding:0;font:inherit;font-size:12.5px;text-decoration:underline');
      again.textContent = 'Refresh anyway (limited to one an hour)';
      again.addEventListener('click', function () { start(); });
      card.appendChild(again);
      return;
    }
    start();
  });
})();