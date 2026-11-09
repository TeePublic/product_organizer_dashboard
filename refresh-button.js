// The CVR refresh note and link, right next to the sale pill on the CVR pages (Redbubble and TeePublic), where people already look
// to see which day they are viewing. After a saved refresh:
//     Refreshed automatically from Amplitude. Pulled Mon Nov 9, 11:42 AM ET, through Sun Nov 8.   Refresh CVR
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
  var when = snap && snap.applied && snap.createdAt ? fmtTime(snap.createdAt) : null;
  var through = snap && snap.applied ? fmtDay(snap.asOf) : null;
  var message = when ? 'Refreshed automatically from Amplitude. Pulled ' + when + (through ? ', through ' + through : '') + '.'
    : 'CVR numbers run through ' + (fmtDay(asOf()) || 'the latest finished day') + '.';
  var scope = 'The CVR numbers (CVR and sessions, the channel, device, funnel and region breakdowns, revenue, orders and payments, in all three bot filters) are refreshed from Amplitude. By product, hourly and the other panels are updated by hand.';

  // ---- the pieces (created once, so a running refresh survives the page redrawing around them) ----
  function el(tag, attrs, style) { var e = document.createElement(tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (style) e.setAttribute('style', style); return e; }
  var note = el('span', { 'data-cvr-note': '1' }, 'display:inline-flex;align-items:center;flex-wrap:wrap;gap:4px 10px;margin:4px 0 4px 12px;font-size:12.5px;line-height:1.4;color:var(--muted,#6b7280);vertical-align:middle');
  var txt = el('span', { 'data-cvr-stamp': '1', title: scope }); txt.textContent = message;
  var btn = el('button', { type: 'button', 'data-cvr-btn': '1', class: 'cvr-refresh-btn' }, '');
  note.appendChild(btn); // the stamp text now lives in the hover on the top-right "Last refreshed" (Mike, Nov 9)
  var wrap = el('div', { 'data-cvr-panel': '1' }, 'display:none;flex:0 0 100%;width:100%;margin:4px 0 8px');
  var card = el('div', { 'data-cvr-card': '1' }, 'max-width:560px;border:1px solid var(--line-2,#cfcfd6);background:var(--surface,#fff);color:var(--ink,#1a1a1a);border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.45;box-shadow:0 2px 8px rgba(0,0,0,.12)');
  wrap.appendChild(card);

  // ---- put it next to the sale pill. The page redraws this area when the day, site or tab changes, so this runs again after every redraw ----
  var ANCHORS = ['.vsalew .vsale', '.dayline .tag', '[aria-label="Day under review"] .tag'];
  var HOSTS = ['.vsalew', '.dayline', '[aria-label="Day under review"]'];
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
  function idle() { btn.disabled = false; btn.textContent = '↻ Refresh CVR'; btn.title = 'Refresh the CVR numbers from Amplitude: both sites, all three bot filters, revenue, orders and payments. It does not change the roadmap or anything else. Takes a minute or two. The CVR data now runs through ' + (fmtDay(asOf()) || 'the latest finished day') + '.'; }
  function show(title, lines, good) {
    card.textContent = '';
    var h = el('div', {}, 'font-weight:600;color:' + (good ? '#15803d' : '#b91c1c')); h.textContent = title; card.appendChild(h);
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
          show('Working: ' + d + ' of ' + t + ' done', [slow ? 'Amplitude is answering slowly (' + rep.pausedBecause + '). Continuing automatically. Please stay on this page.' : 'Continuing automatically. Please stay on this page.'], true);
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
    btn.disabled = true; btn.textContent = 'Refreshing...'; wrap.style.display = 'none';
    state = { runId: null, lastDone: -1, still: 0, netFails: 0 };
    step();
  });
})();