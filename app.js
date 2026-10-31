/* CVR Pacer v6. Everything is computed in the page from the snapshots in D (overall, payments), L (slices), R (revenue), AP (Apple Pay entry), SLACK and TOPS. */
const DAY = 86400000;
const WD = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const WDL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
// Newer news beats the sheet (Mike, Oct 27): a status or launch date posted in a project channel, sprint metrics channel or Jira
// after the sheet was synced replaces the sheet's value. The sheet's value is kept as sheetS / sheetEta for the pop-up.
if (typeof LATEST !== 'undefined' && typeof COMING !== 'undefined') COMING.teams.forEach(tm => (tm.items || []).forEach(it => { const L = LATEST[it.t]; if (!L) return;
  if (L.s && L.s !== it.s) { it.sheetS = it.s; it.s = L.s; } if (L.eta && L.eta !== it.eta) { it.sheetEta = it.eta; it.eta = L.eta; } }));
const parse = s => Date.parse(s + 'T00:00:00Z');
const iso = t => new Date(t).toISOString().slice(0, 10);
// Lowercase for mid-sentence use, but keep acronyms, months and site names as written: "in QA", not "in qa" (Mike, Oct 26).
const lcx = t => String(t || '').toLowerCase().replace(/\b(qa|cvr|aov|usa|uk|seo|api|pdp|ux|ui|ai|sms|sku)\b/g, m => m.toUpperCase()).replace(/\bios\b/g, 'iOS').replace(/\ba\/b\b/g, 'A/B')
  .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/g, m => m.charAt(0).toUpperCase() + m.slice(1)).replace(/\b(redbubble|teepublic|dashery|jira|amplitude|apple pay|google pay|paypal|klarna|afterpay|black friday|cyber monday)\b/g, m => m.replace(/\b\w/g, c => c.toUpperCase()).replace('Teepublic', 'TeePublic').replace('Paypal', 'PayPal'));
const addDays = (s, n) => iso(parse(s) + n * DAY);
const dow = s => new Date(parse(s)).getUTCDay();
const label = s => { const d = new Date(parse(s)); return WD[d.getUTCDay()] + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCDate(); };
const short = s => { const d = new Date(parse(s)); return MON[d.getUTCMonth()] + ' ' + d.getUTCDate(); };
const dmy = (s, yr) => { const d = new Date(parse(s)); return WD[d.getUTCDay()] + ' ' + (d.getUTCMonth() + 1) + '/' + d.getUTCDate() + (yr ? '/' + String(d.getUTCFullYear()).slice(2) : ''); };
const dlong = s => { const d = new Date(parse(s)); return WDL[d.getUTCDay()] + ' ' + MON[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear(); };
const pct = (v, d = 2) => (v * 100).toFixed(d) + '%';
const int = v => Math.round(v).toLocaleString('en-US');
const usd = v => '$' + Math.round(v).toLocaleString('en-US');
const MINUS = '−';
const sgn = (x, d = 1) => (x < 0 ? MINUS : '+') + Math.abs(x * 100).toFixed(d) + '%';
const xbar = s => s.replace(/x\u0304/g, '<span class="xbar">x</span>');
const upDown = x => (x < 0 ? 'down ' : 'up ') + Math.abs(x * 100).toFixed(Math.abs(x) < 0.1 ? 1 : 0) + '%';
const sum = a => a.reduce((p, c) => p + c, 0);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const $ = s => document.querySelector(s);
const range = (a, b) => short(a) + ' to ' + short(b);

/* Sale calendars from #promotions, as logged in the brain's sale-calendar file. */
const SALES = {
  tp: [['2026-07-23','2026-07-26'],['2026-08-05','2026-08-09'],['2026-08-19','2026-08-23'],['2026-08-27','2026-08-30'],['2026-09-03','2026-09-07'],['2026-09-15','2026-09-20'],['2026-09-25','2026-09-27'],['2026-09-30','2026-10-04'],['2026-10-13','2026-10-18'],['2026-10-21','2026-10-25'],['2026-11-01','2026-12-19']],
  rb: [['2026-08-10','2026-08-17'],['2026-09-06','2026-09-13'],['2026-09-23','2026-09-28'],['2026-10-04','2026-10-11'],['2026-10-21','2026-10-26'],['2026-11-02','2026-12-20']]
};
/* TP Sep 30 to Oct 4: $16.50 Classic Tee price test, plus a bot spike Oct 2 and 3. Shown, but never used as a comparison or baseline day. */
const CONTAM = { tp: ['2026-09-30','2026-10-04'] };
const isContam = (b, s) => !!(CONTAM[b] && s >= CONTAM[b][0] && s <= CONTAM[b][1]);
/* Nov 1 to Dec 31: shopping behavior is day-specific, so the same calendar date last year leads. The rest of the year, 4 weeks ago leads. */
const isHoliday = s => { const m = new Date(parse(s)).getUTCMonth(); return m === 10 || m === 11; };
/* Last year's sale days are not logged. A day at or above 3% bot-filtered CVR counts as a sale day. */
const LYR = (() => {
  const out = []; let a = null;
  D.tpLY.cvr.forEach((v, i) => {
    const d = addDays(D.tpLY.start, i), on = v >= 0.03;
    if (on && a === null) a = d;
    if ((!on || i === D.tpLY.cvr.length - 1) && a !== null) { out.push([a, on ? d : addDays(d, -1)]); a = null; }
  });
  return out;
})();
function saleInfo(ranges, d) {
  for (const [a, e] of ranges) if (d >= a && d <= e) {
    const pos = (parse(d) - parse(a)) / DAY + 1, len = (parse(e) - parse(a)) / DAY + 1;
    return { sale: true, pos, len, label: 'Sale day ' + pos + ' of ' + len };
  }
  for (const [, e] of ranges) if (d === addDays(e, 1)) return { sale: false, after: true, label: 'Day after a sale' };
  return { sale: false, label: 'No sale' };
}
const infoNow = (b, d) => saleInfo(SALES[b], d);
// The day before a sale and the day after a sale are their own kinds of day: they only compare with each other, and ordinary
// no-sale days leave them out (standup, Oct 28: a day-before-sale Oct 20 was pulling a day-after-sale baseline up).
const edgeOf = (b, x) => { const i = infoNow(b, x); if (i.sale) return null; if (i.after) return 'after'; return SALES[b].some(r => addDays(r[0], -1) === x) ? 'before' : 'plain'; };
const sameKind = (b, d, x) => { const e = edgeOf(b, d), f = edgeOf(b, x); return e === 'plain' ? f === 'plain' && dow(x) === dow(d) : f === e; };
const EDGEN = { after: 'day after a sale', before: 'day before a sale' };
const noSaleKind = (b, d, n) => { const e = edgeOf(b, d); if (EDGEN[e]) return n === 1 ? EDGEN[e] : EDGEN[e].replace('day', 'days'); return baseDays(b, d).topped ? 'no-sale days' : WDL[dow(d)] + (n === 1 ? '' : 's') + ' with no sale'; };
const infoLY = d => saleInfo(LYR, d);

const BR = {
  tp: { name: 'TeePublic', abbr: 'TP', other: 'rb', color: 'var(--tp)', strip: 'var(--strip-tp)', band: 'var(--band-tp)' }, // sale days in the site's color on every chart (Mike, Oct 28: back from yellow)
  rb: { name: 'Redbubble', abbr: 'RB', other: 'tp', color: 'var(--rb)', strip: 'var(--strip-rb)', band: 'var(--band-rb)' }
};
const SER = {};
['tp', 'rb'].forEach(b => {
  const s = D[b], dates = s.cvr.map((_, i) => addDays(s.start, i)), idx = {};
  dates.forEach((d, i) => { idx[d] = i; });
  SER[b] = { dates, cvr: s.cvr, sess: s.sess, idx };
});
// What people are saying is a 48-hour snapshot (Mike, Oct 26): items dated before the day before the latest data day are dropped.
(() => {
  if (typeof SLACK === 'undefined') return;
  const yr = D.asOf.slice(0, 4), cut = addDays(D.asOf, -1);
  const lastDate = w => { const m = String(w || '').match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(?![\s\S]*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d)/); if (!m) return null; const mo = MON.indexOf(m[1]) + 1; return yr + '-' + String(mo).padStart(2, '0') + '-' + String(m[2]).padStart(2, '0'); };
  for (let i = SLACK.length - 1; i >= 0; i--) { const t = lastDate(SLACK[i].when); if (t && t < cut) SLACK.splice(i, 1); }
})();
const lyIndex = d => { const k = Math.round((parse(d) - parse(D.tpLY.start)) / DAY); return k >= 0 && k < D.tpLY.cvr.length ? k : -1; };
const LEDGER_START = '2026-09-01';
// Comparable days start. Under the Maximum filter it starts Sep 22, when Maximum's audience shrank sharply, so the baseline never mixes the two (Mike, Oct 26).
let BASE_START = '2026-08-20';
const BASE_START_MAX = '2026-09-22';
const YOYMAX = '<b>Year over year under the Maximum filter</b><br>Maximum keeps only visitors scoring 90+ in a few countries. From about Sep 22 that audience shrank sharply (to roughly half of Strong\'s sessions), and last year\'s visitors were scored under different conditions. So this year\'s Maximum CVR is compared with a differently filtered audience last year. Trust the direction more than the size; Strong gives the steadier YoY read.';
const SECS = { overall: 'All users', device: 'Device', funnel: 'Funnel steps', channel: 'Channel', geo: 'Region', product: 'By product' };
const SEC_EMOJI = { product: '🛍️', overall: '🛒', device: '📱', funnel: '🔻', channel: '📣', geo: '🌎', pay: '💳' };
const EMO = {
  'T-shirts': '👕', 'Long sleeve T-shirts': '👕', 'Kids T-shirts': '🧒', 'Hoodies': '🧥', 'Hoodies & sweatshirts': '🧥', 'Hats': '🧢', 'Stickers': '🏷️', 'Posters': '🖼️', 'Posters & art prints': '🖼️', 'Wall art prints': '🖼️', 'Tapestries': '🧶', 'Phone cases': '📱', 'Greeting cards': '💌', 'Throw pillows': '🛋️',
  'CVR': '🛒', 'Sessions': '👥', 'Revenue': '💵', 'Desktop': '💻', 'Mobile': '📱',
  'Add to cart rate': '🛍️', 'Funnel completion rate': '✅', 'Checkout completion rate': '💳',
  'Paid Search': '🔎', 'Paid Search (cpc)': '🔎', 'Direct': '🧭', 'Direct (none)': '🧭',
  'Paid Social': '📣', 'Organic Search': '🌱', 'Organic': '🌱', 'Email': '✉️',
  'USA': '🇺🇸', 'Canada': '🇨🇦', 'Australia': '🇦🇺', 'Europe': '🇪🇺',
  'Card': '💳', 'Apple Pay': '🍎', 'PayPal': '🅿️', 'Google Pay': '🇬',
  'Card, Apple Pay, Google Pay': '💳', 'Klarna, Afterpay': '🧾'
};
const em = l => EMO[l] || '•';
const CP = { 'Organic Search': 'Organic', 'Organic': 'Organic Search', 'Paid Search': 'Paid Search (cpc)', 'Paid Search (cpc)': 'Paid Search', 'Direct': 'Direct (none)', 'Direct (none)': 'Direct' };

/* ---------- definitions: how each metric is measured ---------- */
function defOf(m) {
  if (m.sec === 'product') return (typeof PROD !== 'undefined' && PROD.def) || 'Of visitors who view a ' + m.label.toLowerCase() + ' product page, the share who order one.';
  const b = m.b, bots = b === 'tp' ? 'bot score 70 or higher, verified crawlers excluded' : 'bot score 70 or higher';
  const base = {
    'CVR': 'Of all visitors who view a page in a day, the share who place an order that same day (pageview to order_completed, 1-day window). Bot-filtered: ' + bots + '.',
    'Sessions': 'The number of visits (Amplitude sessions) in the day, bot-filtered. It is the traffic behind every CVR on this page.',
    'Revenue': 'Order revenue in US dollars for the day, from completed orders (order_completed), bot-filtered.',
    'Add to cart rate': 'Of visitors who view a page, the share who add something to their cart.',
    'Funnel completion rate': 'Of visitors who add to cart or start an express checkout (Apple Pay, PayPal, Google Pay), the share who go on to place an order. It tells you how well we turn intent into orders.',
    'Checkout completion rate': 'Of visitors who reach checkout, the share who place an order. A drop here points at the checkout steps or payment, not at traffic quality.',
    'Desktop': 'CVR for visits on a desktop or laptop browser.',
    'Mobile': 'CVR for visits on a phone or tablet browser.',
    'Paid Search': 'CVR for visits that arrive from paid search ads (Google Shopping and search).',
    'Paid Search (cpc)': 'CVR for visits tagged as paid search (campaign medium = cpc).',
    'Direct': 'CVR for visits with no referring source: typed or bookmarked URLs, plus anything untagged.',
    'Direct (none)': 'CVR for visits with no campaign medium. On Redbubble this also catches untagged traffic, so bots sit here.',
    'Paid Social': 'CVR for visits from paid social ads (Meta, TikTok, Pinterest and similar).',
    'Organic Search': 'CVR for visits from unpaid search results.',
    'Organic': 'CVR for visits from unpaid search results.',
    'Email': 'CVR for visits that arrive from an email click.',
    'USA': 'CVR for visitors located in the United States.',
    'Canada': 'CVR for visitors located in Canada.',
    'Australia': 'CVR for visitors located in Australia.',
    'Europe': 'CVR for visitors in 16 European countries (GB, IE, DE, FR, NL, BE, IT, ES, PT, AT, CH, SE, NO, DK, FI, PL). The bucket still needs sign-off.'
  };
  const t = base[m.label] || ('CVR for ' + m.label + '.');
  return m.sec === 'overall' || m.sec === 'funnel' ? t : t + ' CVR here is pageview to order within a day, the same as the top number.';
}

const state = { rmGantt: true, gGroup: 'stage', tsort: { k: 'eta', dir: 1 }, mvAll: false, sphase: 'pre', prog: 'all', obj: 'all', stage: 'all', fteam: 'all', phase: 'pre', su: 'next', days: { tp: D.asOf, rb: D.asOf }, cust: { tp: null, rb: null }, cmpEdit: false, defOn: new Set(), view: 'daily', tab: 'tp', day: D.asOf, thr: {}, open: new Set(), sessOff: new Set(), full: new Set(), payChart: false, cmp: null, cmpMode: 'overlay' };
// Phones open the roadmap as a list: the timeline needs width (Mike, Oct 30). Desktop keeps the timeline.
if (window.matchMedia && matchMedia('(max-width: 760px)').matches) state.rmGantt = false;
Object.keys(SECS).forEach(k => { state.thr[k] = { g: 3, r: 5 }; });
try { const t = JSON.parse(localStorage.getItem('cvrpacer.thr6') || 'null'); if (t) Object.keys(SECS).forEach(k => { if (t[k]) state.thr[k] = t[k]; }); } catch (e) { /* storage unavailable */ }
const saveThr = () => { try { localStorage.setItem('cvrpacer.thr6', JSON.stringify(state.thr)); } catch (e) { /* ignore */ } };
const settling = d => d >= addDays(D.asOf, -1);

/* ---------- hints: underlined words that explain themselves on hover or tap ---------- */
let HINTS = [];
// Hints are inline spans (not buttons) so long phrases can wrap mid-sentence like ordinary text.
const hint = (text, cls, html) => { HINTS.push(html); return '<span role="button" tabindex="0" class="hint ' + (cls || '') + '" data-hint="' + (HINTS.length - 1) + '">' + text + '</span>'; };
let pinned = null;
const POPS = {
  get bot() { return BOTF[state.botf || 'max'].tip; }
};
// Keep any countdown in the hover ticking.
const tickCD = () => { document.querySelectorAll('.cdlive').forEach(c => { let ms = Math.max(0, +c.dataset.to - Date.now()); const d = Math.floor(ms / 864e5); ms -= d * 864e5; const h = Math.floor(ms / 36e5); ms -= h * 36e5; const m = Math.floor(ms / 6e4); ms -= m * 6e4; const s2 = Math.floor(ms / 1e3); const tile = (v, u, cls) => '<span class="cdt2' + (cls || '') + '"><b>' + v + '</b><i>' + u + '</i></span>'; c.innerHTML = tile(d, 'd') + tile(String(h).padStart(2, '0'), 'h') + tile(String(m).padStart(2, '0'), 'm') + tile(String(s2).padStart(2, '0'), 's', ' sec'); }); document.querySelectorAll('#hintbox .cdclock').forEach(c => { let ms = Math.max(0, +c.dataset.to - Date.now()); const u = [[86400000, 'days'], [3600000, 'hrs'], [60000, 'min'], [1000, 'sec']].map(([d, l]) => { const v = Math.floor(ms / d); ms -= v * d; return '<span class="cdu"><b>' + String(v).padStart(2, '0') + '</b><i>' + l + '</i></span>'; }); c.innerHTML = u.join(''); }); };
setInterval(tickCD, 1000);
// Big targets (cards) anchor their tip to the pointer, like a small word does, instead of dropping it below the whole card.
const PTR = { x: 0, y: 0 };
['pointerover', 'pointermove'].forEach(t => document.addEventListener(t, ev => { PTR.x = ev.clientX; PTR.y = ev.clientY; }, { passive: true, capture: true }));
function showHint(el) {
  const box = $('#hintbox'), html = el.dataset.pop ? POPS[el.dataset.pop] : HINTS[+el.dataset.hint]; if (!html) return;
  box.innerHTML = html; box.hidden = false; if (html.indexOf('cdclock') >= 0) tickCD();
  if (html.indexOf('tipsrc') < 0 && html.indexOf('nosrc') < 0 && html.indexOf('data-srcbox') < 0) box.insertAdjacentHTML('beforeend', tipSrcHtml(html));
  const r = el.getBoundingClientRect(), bw = box.offsetWidth, bh = box.offsetHeight;
  let left = Math.min(Math.max(8, r.left + r.width / 2 - bw / 2), window.innerWidth - bw - 8);
  let top = r.bottom + 8; if (top + bh > window.innerHeight - 8) top = Math.max(8, r.top - bh - 8);
  if (r.height > 110 && PTR.y >= r.top && PTR.y <= r.bottom) { left = Math.min(Math.max(8, PTR.x - bw / 2), window.innerWidth - bw - 8); top = PTR.y + 14; if (top + bh > window.innerHeight - 8) top = Math.max(8, PTR.y - bh - 14); }
  // .hup opens above (over the header if needed), so it doesn't cover the headline under it (Mike, Oct 26).
  if (el.classList.contains('hup')) { top = Math.max(8, r.top - bh - 8); }
  box.style.left = left + 'px'; box.style.top = top + 'px';
}
function hideHint() { const box = $('#hintbox'); if (box) box.hidden = true; pinned = null; hintSrc = null; }

/* ---------- comparisons: a week ago (one day), last month's average (or a custom range), last year (one day) ---------- */
function compCands(b, d, kind) {
  const st = infoNow(b, d), hol = isHoliday(d);
  const offs = kind === 'yoy' ? (hol ? [365, 364, 366, 357, 371, 350, 378] : [364, 357, 371, 350, 378, 343, 385]) : [7, 14, 21];
  return offs.map(off => {
    const cd = addDays(d, -off); let ok = true, reason = '', ci;
    if (kind === 'yoy') {
      if (lyIndex(cd) < 0) { ok = false; reason = 'no bot-filtered data that far back (last year starts ' + short(D.tpLY.start) + ', 2025)'; }
      else { ci = infoLY(cd); if (ci.sale !== st.sale) { ok = false; reason = ci.sale ? 'it was a sale day last year' : 'it was not a sale day last year'; } }
    } else {
      if (SER[b].idx[cd] === undefined) { ok = false; reason = 'before our data starts'; }
      else if (isContam(b, cd)) { ok = false; reason = 'price test and bot spike week'; }
      else { ci = infoNow(b, cd); if (ci.sale !== st.sale) { ok = false; reason = ci.sale ? 'it was a sale day' : 'it was not a sale day'; } }
    }
    return { off, date: cd, ok, reason, pos: ci ? ci.pos : null, label: ci ? ci.label : '' };
  });
}
/* A sale day is compared by its place in the sale: day 1 with other day 1s, the final day with final days, mid-sale with mid-sale. */
// Day 1 always counts as day 1 (so in a 3-day sale it wins over third-to-last). The last three days are counted from the end.
const posKey = i => { if (!i || !i.sale) return null; const r = i.len - i.pos; return i.pos === 1 ? 'first' : r === 0 ? 'last' : r === 1 ? 'last2' : r === 2 ? 'last3' : 'mid'; };
const POSN = { first: 'sale day 1', last: 'final sale day', last2: 'second-to-last sale day', last3: 'third-to-last sale day', mid: 'mid-sale day' };
const POSL = { first: 'day 1', last: 'final day', last2: 'second-to-last day', last3: 'third-to-last day', mid: 'mid-sale day' };
// Discount tier from the sale calendar ('40', '35' or null when not logged). Sale days only compare with the same tier; an unknown tier matches anything.
const tierOf = (b, d) => { const o = offerOn(b, d); return o ? ((o[2].match(/(\d+)%/) || [])[1] || null) : null; };
const sameTier = (b, d, cd) => { const a = tierOf(b, d), c = tierOf(b, cd); return !a || !c || a === c; };
function compDate(b, d, kind) {
  const st = infoNow(b, d), pk = posKey(st);
  if (pk && kind === 'wow') {
    // Same position and same discount tier first; only if none exists in 9 weeks, the same position at another tier.
    for (const strict of [true, false]) for (let k = 1; k <= 63; k++) { const cd = addDays(d, -k); if (SER[b].idx[cd] === undefined || isContam(b, cd)) continue; const ci = infoNow(b, cd); if (posKey(ci) === pk && (!strict || sameTier(b, d, cd))) return { off: k, date: cd, ok: true, pos: ci.pos, label: ci.label, lab: "last sale's " + POSL[pk], tierMix: !strict }; }
    return null;
  }
  if (pk && kind === 'yoy') {
    // The same calendar month last year: on an October sale day 1, every sale day 1 in October 2025.
    const ly0 = (+d.slice(0, 4) - 1) + d.slice(4, 8) + '01', mon = new Date(ly0 + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }), dates = [];
    for (let cd = ly0; cd.slice(5, 7) === ly0.slice(5, 7); cd = addDays(cd, 1)) if (lyIndex(cd) >= 0 && posKey(infoLY(cd)) === pk) dates.push(cd);
    return dates.length ? { date: dates[0], dates, around: addDays(d, -364), mlab: mon + ' ' + ly0.slice(0, 4), n: dates.length, from: dates[0], to: dates[dates.length - 1], ok: true, lab: "last year's " + mon + ' ' + POSN[pk] + ' average' } : null;
  }
  const c = compCands(b, d, kind).filter(x => x.ok);
  return c.length ? c[0] : null;
}
/* matching days (same sale status, no price-test days) in the 4 weeks before */
function monthAvg(b, d) {
  const st = infoNow(b, d), pk = posKey(st);
  if (pk) {
    // Same position in earlier sales over the past ~5 weeks, widening to 9 weeks if there are too few.
    for (const strict of [true, false]) for (const span of [35, 63]) {
      const dates = [], skipped = [];
      for (let k = 1; k <= span; k++) {
        const cd = addDays(d, -k); if (SER[b].idx[cd] === undefined) continue; const ci = infoNow(b, cd);
        if (!ci.sale) continue;
        if (isContam(b, cd)) { if (posKey(ci) === pk) skipped.push([cd, 'price test week']); continue; }
        if (posKey(ci) !== pk) continue;
        if (strict && !sameTier(b, d, cd)) { skipped.push([cd, tierOf(b, cd) + '% off sale, not ' + tierOf(b, d) + '% off']); continue; }
        dates.push(cd);
      }
      if (dates.length >= 2) return { sale: true, pk, tierMix: !strict, dates, from: dates[dates.length - 1], to: dates[0], n: dates.length, skipped, lab: "last month's " + POSN[pk] + ' average' };
    }
    return null;
  }
  const dates = [], skipped = [];
  for (let k = 1; k <= 28; k++) {
    const cd = addDays(d, -k); if (SER[b].idx[cd] === undefined) continue;
    if (isContam(b, cd)) { skipped.push([cd, 'price test week']); continue; }
    if (infoNow(b, cd).sale !== st.sale) { skipped.push([cd, st.sale ? 'not a sale day' : 'sale day']); continue; }
    dates.push(cd);
  }
  return dates.length >= 3 ? { sale: st.sale, dates, from: dates[dates.length - 1], to: dates[0], n: dates.length, skipped, lab: "last month's non-sale average" } : null;
}
const COMPC = {};
function compsDefault(b, d) {
  const k = b + d; if (COMPC[k]) return COMPC[k];
  const pd = addDays(d, -1), bd = baseDays(b, d);
  return (COMPC[k] = { yoy: b === 'tp' ? compDate(b, d, 'yoy') : null, wow: compDate(b, d, 'wow'), mom: monthAvg(b, d),
    pd: SER[b].idx[pd] !== undefined ? { date: pd, dates: [pd], lab: 'prior day' } : null,
    bs: bd.length ? { dates: bd, n: bd.length, tierMix: bd.tierMix, near: bd.near, from: bd[0], to: bd[bd.length - 1], lab: 'comparable days' } : null });
}
function compsFor(b, d) {
  const c = compsDefault(b, d), cu = state.cust[b];
  if (!cu || d !== state.days[b]) return c;
  const dates = []; for (let x = cu.from; x <= cu.to; x = addDays(x, 1)) if (SER[b].idx[x] !== undefined && x !== d) dates.push(x);
  return Object.assign({}, c, { mom: dates.length ? { dates: dates.reverse(), from: cu.from, to: cu.to, n: dates.length, custom: true } : null });
}
// An average's days: a plain range only when every day in it is used; a handful of scattered days (like two sale day 1s) are listed by date.
const listed = c => !c.custom && c.dates && c.dates.length <= 4 && (parse(c.to) - parse(c.from)) / DAY + 1 !== c.dates.length;
const spanOf = c => { if (!listed(c)) return range(c.from, c.to); const ds = c.dates.slice().sort().map(short); return ds.length === 1 ? ds[0] : ds.slice(0, -1).join(', ') + ' and ' + ds[ds.length - 1]; };
const cmpLabel = (cmp, kind) => !cmp ? '' : kind === 'pd' ? dmy(cmp.date) : kind === 'bs' ? 'avg of ' + cmp.n + ' matching days' : kind === 'yoy' && cmp.dates ? 'avg of ' + cmp.n + ' day' + (cmp.n === 1 ? '' : 's') + (cmp.mlab ? ' in ' + cmp.mlab : ' around ' + short(cmp.around || addDays(state.day, -364)) + ', 2025') : kind === 'yoy' ? dmy(cmp.date, true) : kind === 'wow' ? dmy(cmp.date) : 'avg of ' + spanOf(cmp) + (listed(cmp) ? '' : ' (' + cmp.n + ' days)');
const cmpShort = (cmp, kind) => !cmp ? '' : kind === 'mom' ? spanOf(cmp) : cmpLabel(cmp, kind);
const lead = (b, d) => (b === 'tp' && isHoliday(d)) ? 'yoy' : 'wow';
const KIND = {
  wow: { name: 'a week ago', full: 'the same weekday a week earlier', col: 'vs a week ago' },
  mom: { name: 'last month\'s average', full: 'the average of matching days (sale or non-sale, like the day itself) over the 4 weeks before', col: 'vs last month\'s avg' },
  yoy: { name: 'last year', full: 'the same day last year', col: 'vs last year' },
  pd: { name: 'the prior day', full: 'the calendar day before', col: 'vs prior day' },
  bs: { name: 'comparable days', full: 'the average of matching days since Aug 20', col: 'vs comparable days' }
};
const MA = (b, d) => { const pk = posKey(infoNow(b, d)); return pk ? "last month's " + POSN[pk] + ' average' : "last month's non-sale average"; };
const kname = (k, comps) => { const c = comps && comps[k]; if (c && c.lab && !c.custom) return c.lab; if (k === 'wow' && c && c.off !== 7) return (c.off % 7 === 0 ? (c.off / 7) + ' weeks ago' : c.off + ' days ago'); return KIND[k].name; };
const kcol = (k, comps) => 'vs ' + kname(k, comps).replace("average", "avg");
// The scorecard, What moved and the headline all use the same three: prior day, comparable days, last year.
const KINDS = b => b === 'tp' ? ['pd', 'bs', 'yoy'] : ['pd', 'bs'];
const cv = (c, k) => k === 'yoy' ? c.ly : k === 'wow' ? c.wowV : k === 'pd' ? c.pdV : k === 'bs' ? c.bsV : c.momV;

/* ---------- metrics ---------- */
function metricList(b) {
  const o = { key: 'overall', label: 'CVR', v: D[b].cvr, ly: b === 'tp' ? D.tpLY.cvr : null, sess: D[b].sess, fmt: 'cvr', sec: 'overall', b, axis: 'CVR' };
  const sessM = { key: 'sessions', label: 'Sessions', v: D[b].sess, ly: b === 'tp' ? D.tpLY.sess : null, fmt: 'int', sec: 'overall', isSess: true, b, axis: 'Sessions per day' };
  const revM = { key: 'revenue', label: 'Revenue', v: R[b], ly: b === 'tp' ? R.tpLY : null, fmt: 'usd', sec: 'overall', isRev: true, b, axis: 'Revenue per day' };
  const metrics = { overall: [o, sessM, revM], device: [], funnel: [], channel: [], geo: [], product: [] };
  // By product (Mike, Oct 27): product-page CVR per product type from src/products.json, re-aligned to this site's dates, with a country split for the chart's geo toggle.
  const P = typeof PROD !== 'undefined' && PROD && PROD[b];
  if (P && P.items) { const al = arr => SER[b].dates.map(dt => { const i = P.dates.indexOf(dt); return i < 0 || !arr ? null : arr[i]; });
    Object.entries(P.items).forEach(([name, r]) => { const geo = {}; Object.entries(r.geo || {}).forEach(([g, x]) => { geo[g] = { v: al(x.v), s: al(x.s) }; });
      metrics.product.push({ key: 'product/' + name, label: name, sec: 'product', v: al(r.v), sess: al(r.s), ly: null, fmt: 'cvr', b, axis: name + ' CVR', pgeo: geo }); }); }
  ['device', 'funnel', 'channel', 'geo'].forEach(g => {
    Object.entries(L[b][g]).forEach(([name, r]) => {
      // Display "USA", not "US" (Mike, Oct 22); the key stays geo/US so saved links and data refs keep working.
      const lab = name === 'US' ? 'USA' : name;
      metrics[g].push({ key: g + '/' + name, label: lab, sec: g, v: r.v, sess: r.s || null, ly: b === 'tp' ? L.tpLY[g][name] : null, fmt: g === 'funnel' ? 'rate1' : 'cvr', b, axis: g === 'funnel' ? name : lab + ' CVR' });
    });
  });
  return metrics;
}
const MCACHE = {};
const metricsFor = b => MCACHE[b] || (MCACHE[b] = metricList(b));
/* ---------- bot filter: Maximum (default) or Strong, swapped in place (Mike, Oct 26) ---------- */
// Maximum comes from Amplitude dashboard 5ec1pe2j (src/datamax.js). Strong is the original data in D, L, R and ORD.
// Where the CVR page's numbers come from, with links out (Allison, Oct 28: "I need reassurance that it is confirmed correct").
const AMPD = { strong: 'lm29400h', max: '5ec1pe2j' }, AMPY = { tp: 'usaj36an', rb: 'zvsdv2k8' };
// Every named source is a link (Mike, Oct 28: "All sources should always be linkable").
const SLK = (id, name) => '<a href="https://grid-articore.enterprise.slack.com/archives/' + id + '" target="_blank" rel="noopener">#' + name + ' ↗</a>';
const LNK = (u, t) => '<a href="' + u + '" target="_blank" rel="noopener">' + t + ' ↗</a>';
const JIRA = LNK('https://articore.atlassian.net/jira/software/c/projects/DEAP/issues', 'Jira (DEAP)'), AMPX = LNK('https://app.amplitude.com/experiment/tpub', 'Amplitude Experiment'), SIGMA = LNK('https://app.sigmacomputing.com/teepublic/workbook/GA4-Search-Experiments-7wRanD8z9Oa0ZcLIk3FW7T', 'Sigma "[GA4] Search Experiments"');
const METRICS = [['C0ASAJUSD6D', 'Customer'], ['C0ARR26TXHS', 'PLC'], ['C0B3HBAA691', 'Data Engineering'], ['C0AUA7R32VC', 'Dashery'], ['C0AR87G1755', 'Search'], ['C0ASTL7LK6C', 'Artist'], ['C0AS67UT41M', 'Core']].map(x => '<a href="https://grid-articore.enterprise.slack.com/archives/' + x[0] + '" target="_blank" rel="noopener">' + x[1] + '</a>').join(', ');
// The other pages' hovers: where that page's facts come from (Mike, Oct 28: "There should always be a source link").
function pageSrcHtml(html) {
  const sheet = '<a href="https://docs.google.com/spreadsheets/d/1fbxp4eAXZe1JNmhxsiDJTeSRhOdAOeblmOiVbU0yNkU" target="_blank" rel="noopener">roadmap sheet ↗</a>', v = state.view, L = [];
  if (v === 'soon') {
    L.push('🗂️ <b>Projects, owners and goals:</b> the ' + sheet + ', with newer news overriding it');
    L.push('🎙️ <b>Official updates:</b> the fortnightly Executive Roadmap Review');
    L.push('🎫 <b>Status, dates and points:</b> ' + JIRA + ', comments first');
    L.push('💬 <b>Latest updates:</b> ' + SLK('C0V4PM9DW', 'released') + ', ' + SLK('C0C9X6MHV89', 'peak_daily_performance_standup') + ', ' + SLK('C0CAD7Q83B8', 'cfx-deap-peak-2026-planning') + ' and each project\'s own channel (linked in its ⓘ Sources)');
    if (/pace|points|projected|likely|burn/i.test(html)) L.push('📈 <b>Team pace:</b> sprint metrics posts for ' + METRICS);
    L.push('🔎 <b>Per project:</b> the ⓘ Sources link next to each project title lists every fact\'s source');
  } else if (v === 'tests') {
    const tx = typeof EXPS !== 'undefined' ? [].concat(EXPS.live || [], EXPS.done || [], EXPS.older || []).find(z => z.id && z.name && html.indexOf(esc(z.name)) >= 0) : null;
    L.push('🧪 <b>Results:</b> ' + (tx ? LNK('https://app.amplitude.com/experiment/tpub/774278/config/' + tx.id, 'this test in Amplitude Experiment') : 'each test\'s analysis in ' + AMPX));
    if (/search/i.test(html)) L.push('🔍 <b>Search tests:</b> the ' + SIGMA + ' workbook');
    L.push('🎫 <b>Plans and status:</b> ' + JIRA + ' and ' + SLK('C0V4PM9DW', 'released'));
    if (tx) L.push('🔎 <b>Every fact on this test:</b> <button type="button" class="linkbtn" data-srcbox="test:' + esc(tx.id) + '">open its full sources →</button>');
  } else if (v === 'impact') {
    L.push('🚀 <b>What shipped or was decided:</b> ' + SLK('C0V4PM9DW', 'released') + ' and ' + JIRA);
    L.push('🧪 <b>Measured results:</b> ' + AMPX);
    if (/\$|a year|estimate/i.test(html)) L.push('🧮 <b>Revenue estimates:</b> Claude\'s estimate from the test result or the ' + sheet + '; the ⓘ Sources on each row shows the math');
  } else {
    const say = typeof SLACK !== 'undefined' ? SLACK.find(z => z.url && z.title && html.indexOf(esc(z.title)) >= 0) : null;
    if (say) L.push('💬 <b>This post:</b> ' + LNK(say.url, 'the Slack thread'));
    if (/sell|order|top|product|design/i.test(html)) L.push('🛍️ <b>What is selling:</b> order data in ' + LNK('https://app.amplitude.com/analytics/tpub/dashboard/' + AMPY[state.tab === 'rb' ? 'rb' : 'tp'], 'Amplitude') + ', last 48 hours');
    if (!say && /said|saying|slack|channel/i.test(html)) L.push('💬 <b>What people are saying:</b> public and project Slack channels, last 48 hours; each item links its own post');
    if (/customer|ticket|CS\b|support/i.test(html)) L.push('🎧 <b>Customer service:</b> ' + SLK('C018Q6H0ZED', 'team-cs-issues'));
    if (/bot/i.test(html)) L.push('🤖 <b>Bot notes:</b> ' + SLK('C095R5DPN3H', 'ask-deap-bot-squad'));
    if (!L.length) L.push('💬 <b>Source:</b> ' + SLK('C0V4PM9DW', 'released') + ' and ' + LNK('https://app.amplitude.com/analytics/tpub', 'Amplitude') + ', last 48 hours');
  }
  return '<div class="tipsrcw"><button type="button" class="srcbtn tipsrc" data-tipsrc="1">ⓘ ' + (L.length === 1 ? 'Source' : 'Sources') + '</button><div class="tipsrcbox" hidden><ul class="hul nrul">' + L.map(x => '<li>' + x + '</li>').join('') + '</ul></div></div>';
}
// The sources behind a CVR-page hover, by what the card talks about. The label is singular or plural to match.
// Each scorecard section links to its own Amplitude charts, per site and bot filter (Allison, Oct 28: "so it's easy to get to the dataset").
const SECAMP = {
  max: { tp: { overall: [['CVR', 'sij6sjzl']], channel: [['CVR by channel', 'bkyp384a']], device: [['CVR by device', 'idhqxu31']], funnel: [['Add to cart rate', 'bov1b5rq'], ['Funnel completion rate', 'sydsccj1'], ['Checkout completion rate', '00ez5hda']] },
         rb: { overall: [['CVR', 'eotq1vlp']], channel: [['CVR by channel', 'a3ptpewu']], device: [['CVR by device', 'zgfkixsf']], funnel: [['Add to cart rate', 'dcciy910'], ['Funnel completion rate', '37yoz8p3'], ['Checkout completion rate', '7h271vlc']] } },
  strong: { tp: { overall: [['CVR', 't50lzd6f']], channel: [['CVR by channel', 'qhto4t7e']], device: [['CVR by device', '6u97stef']], geo: [['CVR, USA', 'd45gja14']], funnel: [['Add to cart rate', 'jbpkevmk'], ['Funnel completion rate', '4pmgjkdy'], ['Checkout completion rate', 'r72vauky']] },
            rb: { overall: [['CVR', 'hv3jdftd']], channel: [['CVR by channel', 'bjjgl1uu']], device: [['CVR by device', 'ucllwnls']], funnel: [['Add to cart rate', 'ir369hds'], ['Funnel completion rate', 'o6krg9lp'], ['Checkout completion rate', 'nhhy4cjn']] } }
};
function secSrc(b, sec) {
  const bf = state.botf === 'strong' ? 'strong' : 'max', ch = ((SECAMP[bf] || {})[b] || {})[sec] || [], L = [];
  const ac = (id, t) => '<a href="https://app.amplitude.com/analytics/tpub/chart/' + id + '" target="_blank" rel="noopener">' + esc(t) + ' ↗</a>';
  if (ch.length) L.push('📊 <b>Amplitude charts (' + BOTF[bf].l + ' bot filter):</b> ' + ch.map(x => ac(x[1], x[0])).join(' · '));
  if (sec === 'product') L.push('📊 <b>Amplitude, pulled each morning:</b> people who viewed a product page of each type, then ordered that type within 24 hours, divided by those viewers (Maximum bot filter).');
  L.push('🗂️ <b>Dashboard:</b> <a href="https://app.amplitude.com/analytics/tpub/dashboard/' + AMPD[bf] + '" target="_blank" rel="noopener">CVR Pacer, ' + BOTF[bf].l + ' bot filter ↗</a>' + (sec === 'geo' && bf === 'max' ? '. Maximum counts a few countries as one audience, so regions come from the same charts split by country.' : ''));
  return '<div class="tipsrcw gsrc"><button type="button" class="srcbtn tipsrc" data-tipsrc="1">ⓘ Sources</button><div class="tipsrcbox" hidden><ul class="hul nrul">' + L.map(x => '<li>' + x + '</li>').join('') + '</ul></div></div>';
}
function tipSrcHtml(html) {
  if (state.view !== 'daily') return pageSrcHtml(html);
  const b = state.tab, bf = state.botf === 'strong' ? 'strong' : 'max', a = (id, t) => '<a href="https://app.amplitude.com/analytics/tpub/dashboard/' + id + '" target="_blank" rel="noopener">' + t + ' ↗</a>', L = [];
  L.push('📊 <b>The numbers:</b> ' + a(AMPD[bf], 'Amplitude, CVR Pacer dashboard (' + BOTF[bf].l + ' bot filter)') + '. CVR is people who viewed a page and ordered within a day, divided by people who viewed a page.');
  L.push('🔁 <b>Cross-check:</b> ' + a(AMPY[b], BR[b].name + ' Yesterday\'s Performance') + '. Its filters differ, so numbers can be a little different.');
  if (/last year|vs last year|2025/i.test(html)) L.push('📅 <b>Last year:</b> the same ' + a(AMPD[bf], 'Amplitude charts') + ', run for the same weekday 364 days back.');
  if (/sale|off\b/i.test(html)) L.push('🏷️ <b>Sale days:</b> ' + SLK('CBHK9E864', 'promotions') + ', kept as the sale calendar.');
  if (/Bot Squad|Likely bots|🤖/i.test(html)) L.push('🤖 <b>Bot notes:</b> ' + SLK('C095R5DPN3H', 'ask-deap-bot-squad') + '.');
  return '<div class="tipsrcw"><button type="button" class="srcbtn tipsrc" data-tipsrc="1">ⓘ ' + (L.length === 1 ? 'Source' : 'Sources') + '</button><div class="tipsrcbox" hidden><ul class="hul nrul">' + L.map(x => '<li>' + x + '</li>').join('') + '</ul></div></div>';
}
const BOTF = {
  max: { l: 'Maximum', tip: '<b>Maximum bot filter</b><br>Counts only visitors Cloudflare scores 90 or higher (very likely human). TeePublic also drops verified crawlers and counts only the USA, UK, Australia and Canada. Redbubble counts only the USA, Canada, UK, Australia, Germany, France and New Zealand.<br><br>It over-corrects on purpose, so read the direction, not the level. Revenue and AOV count every order under both filters. Payment mix, hourly charts and Trending use the Strong filter.' },
  strong: { l: 'Strong', tip: '<b>Strong bot filter</b><br>Counts visitors Cloudflare scores 70 or higher (likely human), in every country. TeePublic also drops verified crawlers. This is the filter the page used through Oct 26. Bots that score above 70, like the fleets the Bot Squad has tracked, still get through.' }
};
// Short version for the label hover, so it fits above the headline.
// Short hovers on each option (Mike, Oct 26: on the options, not the label).
// Only the site on screen, on one line (Mike, Oct 26).
const BOTF_TIP = { max: b => '<b>Maximum</b> (default): Bot score 90+, only ' + (b === 'tp' ? 'US, UK, AU and CA' : 'US, UK, AU, CA, DE, FR and NZ') + '.<br><i class="cap">Revenue and AOV measure every order placed.</i>', strong: () => '<b>Strong</b>: Bot score 70+, all countries.<br><i class="cap">Revenue and AOV measure every order placed.</i>' };
const STRONG = { D: { tp: { cvr: D.tp.cvr, sess: D.tp.sess }, rb: { cvr: D.rb.cvr, sess: D.rb.sess }, tpLY: { cvr: D.tpLY.cvr, sess: D.tpLY.sess } }, L: { tp: L.tp, rb: L.rb, tpLY: L.tpLY }, R: { tp: R.tp, rb: R.rb, tpLY: R.tpLY }, ORD: typeof ORD !== 'undefined' ? { tp: ORD.tp, rb: ORD.rb } : null };
const hasMax = () => typeof MAX !== 'undefined' && MAX && MAX.D;
function applyBotFilter(mode) {
  const src = mode === 'max' && hasMax() ? MAX : STRONG, pick = (a, b) => a != null ? a : b;
  ['tp', 'rb', 'tpLY'].forEach(k => {
    D[k].cvr = pick(src.D[k] && src.D[k].cvr, STRONG.D[k].cvr); D[k].sess = pick(src.D[k] && src.D[k].sess, STRONG.D[k].sess);
    // Revenue and orders count every order under both filters: bots don't buy, and a country-limited total would understate the business (Oct 26).
    L[k] = pick(src.L && src.L[k], STRONG.L[k]); R[k] = STRONG.R[k];
  });
  ['tp', 'rb'].forEach(b => { SER[b].cvr = D[b].cvr; SER[b].sess = D[b].sess; delete MCACHE[b]; });
  state.botf = mode === 'max' && hasMax() ? 'max' : 'strong';
  BASE_START = state.botf === 'max' ? BASE_START_MAX : '2026-08-20';
  // Comparable days and "usual" depend on the data and the baseline start, so they're rebuilt for the new filter.
  [COMPC, BASEC, NRC].forEach(o => Object.keys(o).forEach(k => delete o[k]));
}
const findMetric = (b, key) => { const M = metricsFor(b); for (const k in M) { const m = M[k].find(x => x.key === key); if (m) return m; } return null; };
function counterpart(m) {
  const ob = BR[m.b].other, name = CP[m.label] || m.label;
  return metricsFor(ob)[m.sec].find(x => x.label === name) || null;
}
const isNum = m => m.fmt === 'int' || m.fmt === 'usd';
const fmtVal = (m, v) => v == null ? '' : m.fmt === 'int' ? int(v) : m.fmt === 'usd' ? usd(v) : m.fmt === 'rate1' ? pct(v, 1) : pct(v, 2);
function cellsFor(m, d, comps) {
  const I = SER.tp.idx, i = I[d], val = m.v[i], rel = (a, c) => (a != null && c ? (a - c) / c : null); /* a missing day is no data, never −100% (Mike, Oct 28) */
  const avgOf = (arr, ds) => { const xs = ds.map(x => arr[I[x]]).filter(v => v != null); return xs.length ? sum(xs) / xs.length : null; };
  const yk = comps.yoy ? lyIndex(comps.yoy.date) : -1, lyAvg = ds => { const xs = ds.map(x => m.ly[lyIndex(x)]).filter(v => v != null); return xs.length ? sum(xs) / xs.length : null; };
  const ly = !m.ly || !comps.yoy ? null : comps.yoy.dates ? lyAvg(comps.yoy.dates) : yk >= 0 ? m.ly[yk] : null;
  const wowV = comps.wow ? m.v[I[comps.wow.date]] : null, momV = comps.mom ? avgOf(m.v, comps.mom.dates) : null;
  const o = { val, ly, yoy: ly != null ? rel(val, ly) : null, wowV, wow: wowV != null ? rel(val, wowV) : null, momV, mom: momV != null ? rel(val, momV) : null, custom: !!(comps.mom && comps.mom.custom) };
  const pdV = comps.pd ? avgOf(m.v, comps.pd.dates) : null, bsV = comps.bs ? avgOf(m.v, comps.bs.dates) : null;
  Object.assign(o, { pdV, pd: pdV != null ? rel(val, pdV) : null, bsV, bs: bsV != null ? rel(val, bsV) : null });
  if (m.sess) { o.sessPd = comps.pd ? rel(m.sess[i], avgOf(m.sess, comps.pd.dates)) : null; o.sessBs = comps.bs ? rel(m.sess[i], avgOf(m.sess, comps.bs.dates)) : null; }
  if (m.sess) { o.sess = m.sess[i]; o.sessWow = comps.wow ? rel(o.sess, m.sess[I[comps.wow.date]]) : null; o.sessMom = comps.mom ? rel(o.sess, avgOf(m.sess, comps.mom.dates)) : null; }
  return o;
}
/* "usual" = this metric's average change since BASE_START, split into sale days and non-sale days */
const BASEC = {};
function baseline(m, kind, sale) {
  const k = m.b + '|' + m.key + '|' + kind + '|' + sale; if (k in BASEC) return BASEC[k];
  const vals = [], last = addDays(D.asOf, -2); let from = null, to = null;
  for (let d = BASE_START; d <= last; d = addDays(d, 1)) {
    if (isContam(m.b, d) || infoNow(m.b, d).sale !== sale) continue;
    const c = cellsFor(m, d, compsDefault(m.b, d)), x = c[kind];
    if (x != null) { vals.push(x); if (!from) from = d; to = d; }
  }
  return (BASEC[k] = { avg: vals.length ? sum(vals) / vals.length : 0, n: vals.length, from, to });
}
/* Normal range (Mike, Oct 27): how far a metric usually lands from its comparable days. It's the typical day-vs-baseline swing
   (root mean square of every day since BASE_START with 2+ matching days), clamped per kind of metric so a few odd days can't make it
   meaningless. Inside the range is blue and never a driver; above is green, below is red. */
const NRC = {};
const NRB = { rate: [0.05, 0.12], funnel: [0.04, 0.12], seg: [0.08, 0.25], count: [0.08, 0.20] };
function normBand(m) {
  const k = m.b + '|' + m.key; if (k in NRC) return NRC[k];
  // Only ordinary days count (Mike, Oct 27: a day that was on fire isn't a normal fluctuation). Left out: the price test week,
  // days a Bot Squad note covers, and any day so far off that it's an incident rather than noise (more than 3x the typical swing,
  // measured with the median so the bad days can't inflate it).
  const xs = [];
  let skipped = 0;
  for (let d = BASE_START; d <= D.asOf; d = addDays(d, 1)) {
    if (isContam(m.b, d)) { skipped++; continue; } const bd = baseDays(m.b, d); if (bd.near || bd.length < 2) continue;
    const botDay = (typeof BOTN === 'undefined' ? [] : BOTN).some(e => e.bot !== false && (e.site === m.b || e.site === 'both') && d >= e.date && d <= (e.end || e.date) && (botHas(e, m.key) || e.metrics.indexOf('overall') >= 0));
    if (botDay) { skipped++; continue; }
    const c = cellsFor(m, d, { bs: { dates: bd } }); if (c.bs != null && isFinite(c.bs)) xs.push(c.bs);
  }
  const med = a => { const b = a.slice().sort((p, q) => p - q); return b.length ? b[Math.floor(b.length / 2)] : 0; };
  const robust = med(xs.map(Math.abs)) * 1.4826, keep = robust > 0 ? xs.filter(x => Math.abs(x) <= 3 * robust) : xs;
  skipped += xs.length - keep.length;
  const [lo, hi] = NRB[isNum(m) ? 'count' : m.sec === 'overall' ? 'rate' : m.sec === 'funnel' ? 'funnel' : 'seg'];
  const sd = keep.length >= 4 ? Math.sqrt(sum(keep.map(x => x * x)) / keep.length) : (lo + hi) / 2;
  return (NRC[k] = { w: Math.min(hi, Math.max(lo, sd)), n: keep.length, sd, lo, hi, skipped });
}
const nrOf = (m, x) => { if (x == null) return null; const w = normBand(m).w; return { w, st: x >= w ? 'hi' : x <= -w ? 'lo' : 'in' }; };
// Top-section color (Mike, Oct 27): green when up (inside the range or above it), blue when down but inside it, red below it.
const tcls = (r, x) => !r ? '' : r.st === 'lo' ? 'lo' : r.st === 'hi' || x > 0 ? 'hi' : 'in';
// Full-width range bar in HTML (stretches to its box): band = the normal range, dot = the day, edges labeled.
const nrBarH = (x, w) => { const r = { st: x >= w ? 'hi' : x <= -w ? 'lo' : 'in' }, P = 50 + 50 * Math.max(-1, Math.min(1, x / (2 * w))), W = Math.round(w * 100);
  return '<span class="nrh"><span class="nrtrack"></span><span class="nrband"></span><span class="nrzero"></span><span class="nrdot t' + tcls(r, x) + '" style="left:' + P.toFixed(1) + '%"></span></span><span class="nrhl"><span>−' + W + '%</span><span>0</span><span>+' + W + '%</span></span>'; };
const nrWord = r => r.st === 'in' ? 'within its normal range' : r.st === 'hi' ? 'above its normal range' : 'below its normal range';
// The range drawn like the payment mix's: band = the normal range (blue), dot = this day; green above, red below.
const nrBar = (x, w, wide) => { const W = wide ? 120 : 96, H = 14, c = W / 2, X = v => c + (c - 4) * Math.max(-1, Math.min(1, v / (2 * w))), st = x >= w ? 'hi' : x <= -w ? 'lo' : 'in', col = st === 'in' ? 'var(--ctl)' : st === 'hi' ? 'var(--good)' : 'var(--bad)';
  return '<svg class="nrbar' + (wide ? ' wide' : '') + '" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true"><line x1="3" x2="' + (W - 3) + '" y1="7" y2="7" style="stroke:var(--line-2);stroke-width:1"/><rect x="' + X(-w).toFixed(1) + '" y="2.5" width="' + (X(w) - X(-w)).toFixed(1) + '" height="9" rx="3" style="fill:color-mix(in srgb, var(--ctl) 16%, transparent);stroke:color-mix(in srgb, var(--ctl) 45%, transparent)"/><line x1="' + c + '" x2="' + c + '" y1="1.5" y2="12.5" style="stroke:color-mix(in srgb, var(--ctl) 55%, transparent);stroke-width:1"/><circle cx="' + X(x).toFixed(1) + '" cy="7" r="3.2" style="fill:' + col + ';stroke:var(--surface);stroke-width:1.2"/></svg>'; };
// One hover for every "vs comparable days" number (Mike, Oct 27: more informative, with the visual): the change, the range bar with its
// edges labeled, what the range means, then the baseline itself.
// Hover titles name the thing, like "Redbubble CVR vs prior day"; the verdict is the first line under it (Mike, Oct 28).
const tipName = m => m === metricsFor(m.b).overall[0] ? BR[m.b].name + ' CVR' : m.label + (m.sec === 'funnel' ? '' : ' CVR');
function nrTip(m, x, bsV, val, ds) {
  const r = nrOf(m, x), w = Math.round(r.w * 100), nb = normBand(m), tc = tcls(r, x);
  const how = 'the <b>typical gap</b> between ' + esc(lcx(m.label)) + ' and its comparable days across <b>' + nb.n + ' ordinary days since ' + short(BASE_START) + '</b>' + (nb.skipped ? ' (' + nb.skipped + ' day' + (nb.skipped === 1 ? '' : 's') + ' with incidents, bot spikes or the price test left out)' : '') + (r.w >= nb.hi && nb.sd > nb.hi ? ', <b>capped at ' + w + '%</b> so a few odd days don\'t widen it' : r.w <= nb.lo && nb.sd < nb.lo ? ', with a <b>' + w + '% floor</b> so small wobbles don\'t count' : '') + '.';
  // Design agency, Oct 28: verdict first, then what day this is and exactly what it's compared with, then a chart with axes. The method is a footnote.
  return '<div class="nrtip"><b class="tiph">' + esc(tipName(m)) + ' vs comparable days</b>' + dayTag(m.b) + '<span class="tipv">' + (r.st === 'in' ? '✅' : r.st === 'hi' ? '🚀' : '🔻') + ' <b>' + sgn(x, 0) + '</b>: <b class="t' + tc + '">' + (r.st === 'in' ? 'a normal day' : r.st === 'hi' ? 'above its normal range' : 'below its normal range') + '</b></span><span class="tipnr nr' + r.st + '">' + nrBarH(x, r.w) + '</span>' +
    '<ul class="hul nrul">' + cmpLines(m.b, ds, bsV, m) + '</ul>' +
    tipChart(m, ds, bsV, tc === 'lo' ? 'bad' : tc === 'hi' ? 'good' : null, { band: r.w }) + '<span class="nrhow">How the range is set: ' + how + '</span></div>';
}
// A jump of 30%+ on last year is more than shoppers explain; it's last year's less-filtered bot traffic (Mike, Oct 27).
const YOYBOT = 0.30, yoyBot = x => x != null && x >= YOYBOT;
const YOYBOT_TIP = '<b>🤖 Likely bots</b><br>Up 30%+ on last year is more than shoppers explain. Last year\'s traffic carried more bots that today\'s filter would remove, so last year looks lower than it was. Not counted in the headline.';
/* Every comparison is graded against usual: green if better than usual, red if worse. mat marks changes big enough to call out. */
function judge(m, kind, x, sale) {
  if (x == null) return null;
  // Comparable days is graded against the metric's own normal range (Mike, Oct 27); inside it nothing is a driver.
  if (kind === 'bs') { const r = nrOf(m, x); return { cls: r.st === 'hi' ? 'good' : r.st === 'lo' ? 'bad' : '', mat: r.st === 'hi' ? 'good' : r.st === 'lo' ? 'bad' : null, x, usual: 0, dlt: x, base: null, sale, kind, nr: r }; }
  if (kind === 'yoy' && yoyBot(x)) return { cls: '', mat: null, x, usual: 0, dlt: x, base: null, sale, kind, bot: true };
  // Prior day, baseline and last year are graded on the change itself: the baseline already is "usual". Prior day is context, never graded.
  if (kind === 'pd' || kind === 'bs' || kind === 'yoy') { const t = state.thr[m.sec], p = x * 100, mat = kind === 'pd' ? null : p >= t.g ? 'good' : p <= -t.r ? 'bad' : null; return { cls: mat || '', mat, x, usual: 0, dlt: x, base: null, sale, kind }; }
  const t = state.thr[m.sec], base = baseline(m, kind, sale), u = base.avg, dlt = x - u, p = dlt * 100;
  return { cls: dlt >= 0 ? 'good' : 'bad', mat: p >= t.g ? 'good' : p <= -t.r ? 'bad' : null, x, usual: u, dlt, base, sale, kind };
}
const rel0 = j => Math.round(Math.abs(j.dlt) * 100);
const judgeText = (j, sh) => rel0(j) === 0 ? (sh ? 'on baseline' : 'in line with comparable days') : (j.dlt < 0 ? MINUS : '+') + rel0(j) + '% vs ' + (sh ? 'baseline' : 'comparable days');
function explainJudge(m, kind, c, comps, d, j) {
  const cmp = comps[kind], v = cv(c, kind);
  return '<b class="' + (j.x < 0 ? 'w' : 'b') + '">' + ucf(upDown(j.x)) + ' vs ' + cmpLabel(cmp, kind) + '</b> (' + fmtVal(m, v) + ' → ' + fmtVal(m, c.val) + ')<br>' +
    'This comparison usually runs ' + upDown(j.usual) + ', so this day is <b class="' + (j.cls === 'bad' ? 'w' : 'b') + '">' + judgeText(j) + '</b>.';
}
const ucf = t => t.charAt(0).toUpperCase() + t.slice(1);
function baselineHint(m, kind, c, d, j) {
  const set = (j.sale ? 'sale' : 'non-sale') + ' days';
  return '<b>What "comparable days" means</b><br>The average change in ' + esc(lcx(m.label)) + ' vs ' + KIND[kind].name + ' across our last ' + j.base.n + ' ' + set + (j.base.n ? ' (' + range(j.base.from, j.base.to) + ')' : '') + ': <b>' + upDown(j.usual) + '</b>.' +
    '<br>This day: ' + upDown(j.x) + ', so it is <b class="' + (j.cls === 'bad' ? 'w' : 'b') + '">' + judgeText(j) + '</b>.' +
    '<br><span class="cap">Sale and non-sale days get separate baselines' + (m.b === 'tp' ? ', and the Sep 30 to Oct 4 price test week is left out' : '') + '.</span>';
}
/* a hover-able verdict word for a metric and kind */
// vs comparable days cells: the number itself is green or red and hovers; no "above/below usual" words on every row (Mike, Oct 26).
function bsCell(m, c, comps, d) {
  const j = judge(m, 'bs', c.bs, infoNow(m.b, d).sale), cb = comps.bs; if (!j || !cb) return sgn(c.bs);
  return hint(sgn(c.bs) + nrBar(c.bs, j.nr.w), 'bsn ' + (j.mat || ''), nrTip(m, c.bs, c.bsV, c.val, cb.dates));
}
function mkFor(m, kind, c, comps, d, opts) {
  opts = opts || {};
  if (kind === 'mom' && c.custom) return '<span class="cap">custom range, not graded</span>';
  // The prior-day context is the same for every row, so it lives once: in the column header's details and on the top card.
  if (kind === 'pd') return '';
  if (kind === 'yoy') return '';
  if (kind === 'bs') return ''; // the number carries the color and hover now (bsCell)
  const sale = infoNow(m.b, d).sale, x = c[kind], j = judge(m, kind, x, sale);
  if (!j) return '';
  return hint(opts.text || judgeText(j, opts.short), 'mkh ' + (j.cls === 'bad' ? 'bad' : 'good'), baselineHint(m, kind, c, d, j));
}
/* why a cell has no value */
function naReason(m, d, kind, comps) {
  if (kind === 'yoy') {
    if (m.b === 'rb') return { s: 'No LY data', l: 'Redbubble data in Amplitude starts July 2026, so there is no last year to compare to.' };
    if (lyIndex(addDays(d, -364)) < 0) return { s: 'No LY data', l: 'Bot-filtered data for last year starts ' + short(D.tpLY.start) + ' 2025, so this date has no match.' };
    if (!comps.yoy) return { s: 'No sale match LY', l: 'No day last year around this date had the same sale status, so we skip rather than compare a sale day to a normal day.' };
    return { s: 'No LY value', l: 'This metric has no value for the matching day last year.' };
  }
  if (kind === 'pd' && !comps.pd) return { s: 'No data', l: 'No data for the day before.' };
  if (kind === 'bs' && !comps.bs) return { s: 'No matching days', l: 'No earlier day since ' + short(BASE_START) + ' matches this one.' };
  if (isContam(m.b, d)) return { s: 'Price test week', l: 'Sep 30 to Oct 4 had a $16.50 tee price test and a bot spike, so it is shown but not compared.' };
  if (kind === 'wow' && !comps.wow) return { s: 'No matching day', l: 'None of the same weekdays 1 to 3 weeks back had the same sale status, so we skip instead of comparing a sale day to a normal day.' };
  if (kind === 'mom' && !comps.mom) return { s: 'Too few days', l: 'Fewer than 3 days in the 4 weeks before had the same sale status.' };
  return { s: 'No value', l: 'This metric has no value for the comparison day.' };
}
const naCell = (m, d, kind, comps, tag) => { const r = naReason(m, d, kind, comps); return '<' + (tag || 'span') + ' class="na" title="' + esc(r.l) + '">' + r.s + '</' + (tag || 'span') + '>'; };
const dayOf = () => ({ d: state.day, sale: infoNow(state.tab, state.day).sale });

/* ---------- cross-site read: only call it out when the other site is not seeing the same thing ---------- */
// Two sites "move the same way" only when both raw changes point the same direction, are each at least 3%, and the smaller is at least a third of the larger.
const sameMove = (a, b) => a != null && b != null && Math.sign(a) === Math.sign(b) && Math.min(Math.abs(a), Math.abs(b)) >= 0.03 && Math.min(Math.abs(a), Math.abs(b)) >= Math.max(Math.abs(a), Math.abs(b)) / 3;
function crossRead(m, d) {
  const o = counterpart(m); if (!o) return null;
  const c = cellsFor(m, d, compsFor(m.b, d)), co = cellsFor(o, d, compsFor(o.b, d));
  const j = judge(m, 'wow', c.wow, infoNow(m.b, d).sale), jo = judge(o, 'wow', co.wow, infoNow(o.b, d).sale);
  if (!j || !jo) return null;
  const swing = v => v != null && Math.abs(v) >= 0.3;
  let rel;
  if (swing(co.sessWow) || swing(c.sessWow)) rel = 'noisy';
  else {
    // Each site against its own comparable days (same point in the sale and discount, or same weekday), the comparison the headline uses.
    const a = baseOf(m.b, d, m).c, bo = baseOf(o.b, d, o).c;
    rel = a.mom == null || Math.abs(a.mom) < 0.03 ? 'quiet' : sameMove(a.mom, bo.mom) ? 'shared' : 'only';
    return { o, c, co, j, jo, rel, a, bo };
  }
  return { o, c, co, j, jo, rel };
}
const CROSS_TAG = (x, m) => ({ shared: BR[x.o.b].abbr + ' seeing it too', only: 'Only on ' + BR[m.b].abbr, noisy: "Can't compare", quiet: '' })[x.rel];
function crossHint(x, m, d) {
  const A = BR[m.b].name, B = BR[x.o.b].name, ca = compsFor(m.b, d).wow, cb = compsFor(x.o.b, d).wow;
  const line = (nm, mm, c, cmp) => '<b>' + nm + ':</b> ' + upDown(c.wow) + ' vs ' + dmy(cmp.date) + ' (' + fmtVal(mm, c.wowV) + ' → ' + fmtVal(mm, c.val) + ')' + (c.sessWow != null ? ', sessions ' + upDown(c.sessWow) : '') + '.';
  const head = { shared: B + ' is seeing the same thing', only: 'Only on ' + A, noisy: B + ' can\'t be compared today', quiet: 'Nothing unusual on ' + A }[x.rel];
  const tail = {
    shared: 'Both sites moved the same way, so it is more likely market-wide (season, a shared change like the feed or checkout) than a ' + A + ' problem.',
    only: B + ' is not moving the same way. That makes it worth digging into: something specific to ' + A + ' changed.',
    noisy: 'Traffic swung more than 30% on one site vs a week ago, which changes who is in the count (bots or untagged traffic coming or going). We don\'t read the CVR change.',
    quiet: A + ' is close to comparable days here, so there is nothing to match.'
  }[x.rel];
  const bl = (nm, mm, c) => '<b>' + nm + ':</b> ' + (c.mom == null ? 'no baseline' : upDown(c.mom) + ' vs comparable days (' + fmtVal(mm, c.momV) + ' → ' + fmtVal(mm, c.val) + ')') + '.';
  return '<b>' + head + '</b><br>' + (x.a ? bl(A, m, x.a) + '<br>' + bl(B, x.o, x.bo) : line(A, m, x.c, ca) + '<br>' + line(B, x.o, x.co, cb)) + '<br>' + tail;
}
/* ---------- modal ---------- */
let lastFocus = null;
// An open driver or compare pop-up is part of the link, so sharing the URL shares that exact view (Mike, Oct 27).
let SHARE = null;
const encK = k => String(k).replace(/[^A-Za-z0-9]+/g, '.');
const setHash = () => { try { history.replaceState(null, '', '#' + viewToken()); } catch (e) {} };
function openModal(html, tok) {
  lastFocus = document.activeElement; SHARE = tok || null; setHash();
  const ov = $('#modal');
  // Every pop-up ends with Sources too, unless it already shows its sources (Mike, Oct 28).
  const src = /tipsrc|provbox|Where this comes from|data-srcbox/.test(html) ? '' : tipSrcHtml(html);
  ov.innerHTML = '<div class="mbox" role="dialog" aria-modal="true" aria-labelledby="mtitle"><button class="mclose" aria-label="Close">×</button>' + html + src + '</div>';
  ov.hidden = false; document.body.classList.add('noscroll');
  ov.querySelector('.mclose').focus();
}
function closeModal() { const ov = $('#modal'); ov.hidden = true; ov.innerHTML = ''; if (SHARE) { SHARE = null; setHash(); } document.body.classList.remove('noscroll'); hideHint(); if (lastFocus && lastFocus.focus) lastFocus.focus(); }

/* ---------- what moved ---------- */
function movedFor(b, d) {
  const sale = infoNow(b, d).sale, comps = compsFor(b, d), out = [];
  ['device', 'funnel', 'channel', 'geo'].forEach(sec => metricsFor(b)[sec].forEach(m => {
    // Measured against comparable days; c.mom/momV/sessMom are pointed at the baseline so the What moved copy reads one comparison.
    const c0 = cellsFor(m, d, comps), c = Object.assign({}, c0, { mom: c0.bs, momV: c0.bsV, sessMom: c0.sessBs }), jm = judge(m, 'bs', c0.bs, sale), jy = b === 'tp' ? judge(m, 'yoy', c0.yoy, sale) : null;
    const mix = jm && jm.mat === 'bad' && c.sessMom != null && c.sessMom >= 0.25;
    const bad = mix || (b === 'tp' ? (jm && jm.mat === 'bad' && jy && jy.mat === 'bad') : (jm && jm.mat === 'bad'));
    if (bad) out.push({ m, c, mix, jm, jy, score: jm.dlt });
  }));
  // A segment only explains the day if it is worse than its peers. When the whole site drops, every segment drops with it;
  // naming those as drivers is noise. Keep one only if it is at least 8 points worse than the rest of its group (or a traffic spike).
  const keep = out.filter(f => { const x = sibsOf(f.m, d); if (x) { f.rest = x.restMom; f.gap = x.gap; f.peers = x.rest.length === 1 ? x.rest[0].m.label : 'other ' + x.n[1]; } return f.mix || !x || x.gap <= -0.08; });
  keep.sort((a, c) => (c.mix - a.mix) || (a.score - c.score));
  // Likely bots are not drivers: a Bot Squad note on this segment around this day, or traffic up 50%+ while CVR fell (Mike, Oct 26).
  BOTSET[b] = []; const real = [];
  keep.forEach(f => { const why = botWhy(b, d, f); if (why) BOTSET[b].push({ m: f.m, why }); else real.push(f); });
  return real;
}
let BOTSET = { tp: [], rb: [] };
// Notes and sites name segments differently ("geo/USA" vs Redbubble's "geo/US", "channel/Direct" vs "channel/Direct (none)"), so both sides are normalized before matching.
const bkey = k => { let x = String(k).replace(/\s*\(.*\)$/, ''); if (x === 'geo/US') x = 'geo/USA'; return x; };
const botHas = (e, key) => e.metrics.some(x => bkey(x) === bkey(key));
const botNoteOn = (b, d, key) => (typeof BOTN === 'undefined' ? [] : BOTN).find(e => (e.site === b || e.site === 'both') && botHas(e, key) && d >= e.date && d <= addDays(e.end || e.date, 3));
function botWhy(b, d, f) {
  const n = botNoteOn(b, d, f.m.key);
  if (n) return 'Bot Squad, ' + short(n.date) + ': ' + n.title;
  if (!f.lift && f.c.sessMom != null && f.c.sessMom >= 0.5 && f.c.mom != null && f.c.mom < 0) return 'Traffic ' + sgn(f.c.sessMom, 0) + ' vs comparable days while CVR fell ' + sgn(f.c.mom, 0) + ': the pattern bot traffic leaves';
  return null;
}
// The mirror of movedFor for up days: segments above their baseline and 8+ points better than the rest of their group.
function liftsFor(b, d) {
  const sale = infoNow(b, d).sale, comps = compsFor(b, d), tot = cellsFor(metricsFor(b).overall[0], d, comps).sess || 1, out = [];
  ['device', 'funnel', 'channel', 'geo'].forEach(sec => metricsFor(b)[sec].forEach(m => {
    const c0 = cellsFor(m, d, comps), c = Object.assign({}, c0, { mom: c0.bs, momV: c0.bsV, sessMom: c0.sessBs }), jm = judge(m, 'bs', c0.bs, sale), jy = b === 'tp' ? judge(m, 'yoy', c0.yoy, sale) : null;
    if (!jm || jm.mat !== 'good' || (jy && jy.mat === 'bad')) return;
    const x = sibsOf(m, d); if (x) { if (x.gap < 0.08) return; Object.assign(c, {}); }
    const f = { m, c, jm, jy, lift: true, rest: x ? x.restMom : null, gap: x ? x.gap : null, peers: x ? (x.rest.length === 1 ? x.rest[0].m.label : 'other ' + x.n[1]) : null };
    f.w = Math.max(0, jm.dlt) * (m.sec === 'funnel' ? 1 : Math.min(1, (c.sess || 0) / tot)); out.push(f);
  }));
  return out.filter(f => { const why = botWhy(b, d, f); if (why) { (BOTSET[b] = BOTSET[b] || []).push({ m: f.m, why, lift: true }); return false; } return true; }).sort((a, z) => z.w - a.w).slice(0, 6);
}
let MOVED = [], LIFTS = [], MVUP = '', ALERTS = new Map(), VNAMES = [], VLEAD = '';
/* Alerts are rare on purpose: a big miss against usual, on every comparison we have, that the other site is not showing. Three at most. */
function alertsFor(b, d) {
  const out = new Map();
  for (const f of MOVED) {
    if (out.size >= 3) break;
    const hard = f.jm.dlt <= -0.10 && (!f.jy || f.jy.dlt <= -0.10);
    const x = crossRead(f.m, d);
    const shared = x && x.rel === 'shared';
    if (f.mix) out.set(f.m.key, { kind: 'traffic', text: 'Traffic spike ' + sgn(f.c.sessMom, 0), tip: 'Sessions ' + sgn(f.c.sessMom, 0) + ' vs comparable days' });
    else if (hard && !shared) out.set(f.m.key, { kind: 'bad', text: 'Unusual', f });
  }
  // Each Unusual tag explains itself on hover (Mike, Oct 28: "why does one of these have an unusual tag and the other ones don't?").
  // Rows in the same section that are also down 10%+ but not tagged, with the reason: the other site shows it too, or it isn't a top mover.
  const otherDn = sec => metricsFor(b)[sec].filter(g => !out.has(g.key)).map(g => ({ g, bs: cellsFor(g, d, compsFor(b, d)).bs, x: crossRead(g, d) })).filter(z => z.bs != null && z.bs <= -0.10);
  out.forEach(a => { if (a.kind !== 'bad') return; const f = a.f, m = f.m, r = nrOf(m, f.c.mom), ob = BR[BR[m.b].other].name, od = otherDn(m.sec), peers = od.filter(z => z.x && z.x.rel === 'shared').map(z => z.g.label), rest = od.filter(z => !(z.x && z.x.rel === 'shared')).map(z => z.g.label);
    a.html = '<div class="nrtip"><b class="tiph">Why ' + esc(m.label) + ' is flagged Unusual</b><span class="tipv">⚠️ It\'s down and the drop is only on ' + BR[m.b].name + '.</span><ul class="hul nrul">' +
      '<li>🔻 <b>Down a lot:</b> ' + sgn(f.c.mom, 0) + ' vs comparable days' + (r ? ' (normal is ±' + Math.round(r.w * 100) + '%)' : '') + (f.jy ? ', and ' + sgn(f.c.yoy, 0) + ' vs last year' : '') + '</li>' +
      '<li>📍 <b>Only on ' + BR[m.b].name + ':</b> ' + ob + ' isn\'t seeing the same drop, so it\'s less likely to be the market or the season</li>' +
      (peers.length ? '<li>👥 <b>Why ' + esc(peers.join(' and ')) + (peers.length === 1 ? ' isn\'t' : ' aren\'t') + ' tagged:</b> ' + (peers.length === 1 ? 'it\'s' : 'they\'re') + ' down too, but ' + ob + ' shows the same drop, which points to something wider than ' + BR[m.b].name + '</li>' : '') +
      (rest.length ? '<li>➖ <b>Why ' + esc(rest.join(' and ')) + (rest.length === 1 ? ' isn\'t' : ' aren\'t') + ' tagged:</b> ' + (rest.length === 1 ? 'a smaller drop, inside its' : 'smaller drops, inside their') + ' normal range</li>' : '') +
      '<li>🏷️ <b>The rule:</b> a potential driver, down 10% or more vs comparable days' + (f.jy ? ' and vs last year' : '') + ', and not seen on ' + ob + '. At most three tags a day.</li></ul></div>'; });
  return out;
}
const alertBadge = key => { const a = ALERTS.get(key); if (!a) return ''; const inner = (a.kind === 'traffic' ? '▲ ' : '⚠ ') + a.text; return a.html ? hint(inner, 'alert ualert', a.html) : '<span class="alert ' + (a.kind === 'traffic' ? 'traffic' : '') + '"' + (a.tip ? ' title="' + a.tip + '"' : '') + '>' + inner + '</span>'; };
const NEXT = {
  'Email': 'Check the last send: list, volume and subject, deliverability, and the page it links to.',
  'Paid Search': 'Check spend and the Shopping feed first. The wrong-images feed issue would hit here.',
  'Paid Social': 'Check spend and creative changes, and whether the audience shifted.',
  'Direct': 'Check for bots and untagged traffic before blaming shoppers.',
  'Direct (none)': 'Check for bots and untagged traffic. Channel tagging is broken on Redbubble, so it mixes a lot of traffic.',
  'Organic Search': 'Check rankings and indexing, and whether a landing page changed.',
  'Organic': 'Check rankings and indexing, and whether a landing page changed.',
  'Mobile': 'Check for a mobile release or checkout bug.',
  'Desktop': 'Check for a desktop release, or bot traffic hiding in desktop.',
  'Add to cart rate': 'Look at the product page and pricing. Shoppers are looking, not adding.',
  'Funnel completion rate': 'Look at what happens after add to cart: shipping cost, price shown, payment errors.',
  'Checkout completion rate': 'Look at the checkout steps and payment errors. This is not a traffic problem.'
};
// The two views of a segment: this site alone, or side by side with the other site. Plus a way to its scorecard row.
function mvTabs(m, on) {
  const o = BR[BR[m.b].other].name;
  return '<div class="mvtabs"><div class="segs" role="tablist"><button type="button" role="tab" aria-selected="' + (on === 'one') + '" data-mvback="' + esc(m.b + '|' + m.key) + '">📍 ' + BR[m.b].name + ' only</button><button type="button" role="tab" aria-selected="' + (on === 'cmp') + '" data-cmp="' + esc(m.key) + '" data-from="' + m.b + '">👀 Compare with ' + o + '</button></div><button type="button" class="linkbtn" data-show="' + esc(m.key) + '">Show in the scorecard →</button></div>';
}
const movedFor1 = m => MOVED.concat(typeof LIFTS !== 'undefined' ? LIFTS : []).find(x => x.m === m || (x.m.key === m.key && x.m.b === m.b)) || { m, c: cellsFor(m, state.day, compsFor(m.b, state.day)) };
// What kind of day this is, in the words the header pill uses (Mike, Oct 28: "Day 5 of 5, 40% off sale" should be clear in the pop-up).
const dayKind = (b, d) => { const st = infoNow(b, d); return st.sale ? (tierOf(b, d) ? 'Up to ' + tierOf(b, d) + '% off sale' : 'Sale') + ' · day ' + st.pos + ' of ' + st.len : 'No sale · regular prices'; };
const cmpKind = (b, d, n) => { const st = infoNow(b, d), pk = st.sale ? posKey(st) : null; return pk && POSN[pk] ? 'the ' + POSN[pk] + ' of ' + n + ' earlier sale' + (n === 1 ? '' : 's') : n + ' earlier ' + (st.sale ? 'sale day' + (n === 1 ? '' : 's') : noSaleKind(b, d, n)); };
function movedModal(f) {
  const { m, c } = f, d = state.day, comps = compsFor(m.b, d), other = BR[BR[m.b].other].name, x = crossRead(m, d), jm = f.jm;
  const head = f.mix ? esc(m.label) + ' traffic ' + sgn(c.sessMom, 0) + ', CVR ' + sgn(c.mom, 0) : esc(m.label) + (m.sec === 'funnel' ? ' ' : ' CVR ') + sgn(c.mom, 0) + ' vs comparable days';
  const pts = [
    fmtVal(m, c.momV) + ' → <b>' + fmtVal(m, c.val) + '</b> (avg of ' + (comps.bs ? comps.bs.n : 0) + ' matching days' + bsWhen(comps.bs && comps.bs.dates) + ')' + (c.pd != null ? '. Vs the prior day: ' + sgn(c.pd, 0) + '.' : '.') + (priorCtx(m.b, d) ? ' ' + priorCtx(m.b, d) : ''),
    f.mix ? 'A surge that doesn\'t buy is usually bots, untagged or low-intent traffic, not shoppers getting worse.' : (f.jy ? 'Vs last year: ' + sgn(c.yoy, 0) + '.' : '') + (x && x.rel === 'shared' ? ' ' + other + ' is seeing it too.' : x && x.rel === 'only' ? ' ' + other + ' isn\'t seeing it, so it\'s specific to ' + BR[m.b].name + '.' : ''),
    (f.rest != null ? ucf(esc(f.peers)) + ': ' + sgn(f.rest, 0) + ', so ' + esc(m.label) + ' is ' + Math.round(Math.abs(f.gap) * 100) + ' points ' + (f.gap > 0 ? 'better' : 'worse') + ' than its peers. ' : '') + '<b>Next:</b> ' + (f.lift ? 'Find what is working here and whether it can be repeated elsewhere.' : NEXT[m.label] || 'Check what changed on the site for this segment.')
  ];
  // Design agency, Oct 27: the top was three dense numbered lines that repeated the peer box below. Now: a switch (this site / compare),
  // three short labeled facts, the peer bars, the chart. Compare is a tab you can switch back from, not a dead end.
  const bd = (comps.bs && comps.bs.dates) || [];
  const facts = [['📏 Comparable days', fmtVal(m, c.momV) + ' → <b>' + fmtVal(m, c.val) + '</b> ' + hint('(avg of ' + bd.length + ' day' + (bd.length === 1 ? '' : 's') + ')', 'soft kvh', '<b>Days like ' + short(d) + '</b><br>' + bd.map(x => short(x)).join(', ')) + (bd.length && bd.length <= 2 ? '<span class="thinb">Only ' + bd.length + ' matching day' + (bd.length === 1 ? '' : 's') + ', so treat this as a rough read. The comparison days are marked on the chart.</span>' : '')],
    [BR[BR[m.b].other].name, x && x.rel === 'shared' ? 'Seeing it too' : x && x.rel === 'only' ? 'Not seeing it, so it\'s specific to ' + BR[m.b].name : 'No clear read'],
    ['👉 Next', esc(f.lift ? 'Find what is working here and whether it can be repeated elsewhere.' : NEXT[m.label] || NEXT[m.label.replace(/ \(.*\)$/, '')] || 'Check what changed on the site for this segment.')]];
  const ctx = '<div class="mvctx"><span class="mvday' + (infoNow(m.b, d).sale ? ' sale' : '') + '">🏷️ <b>' + short(d) + ':</b> ' + esc(dayKind(m.b, d)) + '</span>' + (bd.length ? '<span class="mvcmp">🎯 <b>Compared with</b> ' + esc(cmpKind(m.b, d, bd.length)) + '</span>' : '') + '</div>';
  openModal('<div class="mhead"><span class="lbl">' + SECS[m.sec] + ' · ' + label(d) + '</span><h3 id="mtitle">' + em(m.label) + ' ' + head + '</h3>' + ctx + '</div>' + mvTabs(m, 'one') +
    '<dl class="mvfacts">' + facts.map(r => '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>').join('') + '</dl>' + sibHtml(m, d) +
    '<div class="legend"><span><i class="sw" style="background:' + BR[m.b].color + '"></i>' + esc(m.axis) + '</span>' + (m.ly ? '<span><i class="sw dash"></i>Same weekday last year</span>' : '') + '<span><i class="sw blk" style="background:' + BR[m.b].band + ';outline:1px solid ' + BR[m.b].strip + '"></i>Sale days</span>' + (bd.length ? '<span><i class="sw" style="width:10px;height:10px;border-radius:50%;background:var(--surface);border:3px solid color-mix(in srgb, var(--ctl) 30%, var(--surface));box-shadow:inset 0 0 0 4px var(--ctl)"></i>Comparison days, avg ' + fmtVal(m, c.momV) + '</span>' : '') + '</div><div class="chart" id="mvchart"></div>', 'mv_' + encK(m.key));
  drawChart($('#mvchart'), { m, mini: true, tall: true, base: { dates: bd, v: c.momV } });
}

/* ---------- why these dates ---------- */
function whyModal(kind) {
  if (kind === 'bs') return baseModal(state.tab);
  if (kind === 'pd') { const d = state.day, ctx = priorCtx(state.tab, d); return openModal('<div class="mhead"><span class="lbl">vs prior day</span><h3 id="mtitle">Compared with ' + dmy(addDays(d, -1)) + '</h3></div><p class="mtext">Always the calendar day before. It is context, not graded red or green, because a day next to a sale start or end swings by design.' + (ctx ? ' <b>' + ctx + '</b>' : '') + '</p>'); }
  const b = state.tab, d = state.day, comps = compsFor(b, d), cmp = comps[kind], st = infoNow(b, d), m = metricsFor(b).overall[0], bs = baseline(m, kind, st.sale);
  let body; const pk = posKey(st);
  if (pk && cmp && !cmp.custom) {
    const ds = cmp.dates || [cmp.date];
    body = '<p class="mtext"><b>Matched on the point in the sale.</b> ' + short(d) + ' is ' + (pk === 'first' ? 'day 1' : 'the ' + POSL[pk]) + ' of a sale, so it is compared only with the same point in other sales: day 1 with day 1, the final day with final days, and so on. ' +
      (kind === 'wow' ? 'This is the most recent earlier sale\'s ' + POSL[pk] + '.' : kind === 'mom' ? 'This averages every ' + POSN[pk] + ' in the past ' + (ds.length && (parse(d) - parse(ds[ds.length - 1])) / DAY > 35 ? 'nine' : 'five') + ' weeks.' : 'This averages every ' + POSN[pk] + ' in ' + (cmp.mlab || 'the same month last year') + ', the same month last year. Last year\'s sales are inferred from CVR, since the 2025 sale calendar was not logged.') + '</p>' +
      '<div><h3 style="font-size:16px;margin-bottom:6px">Days used</h3><p class="mtext">' + ds.slice().sort().map(x => dmy(x, kind === 'yoy')).join(', ') + '</p></div>' +
      (cmp.skipped && cmp.skipped.length ? '<div><h3 style="font-size:16px;margin-bottom:6px">Days left out</h3><p class="mtext">' + cmp.skipped.map(x => dmy(x[0]) + ' (' + x[1] + ')').join(', ') + '</p></div>' : '');
  } else if (kind === 'mom') {
    body = cmp ? (cmp.custom ? '<p class="mtext"><b>You picked this range.</b> We average every day from ' + range(cmp.from, cmp.to) + ' (' + cmp.n + ' days), sale or not. Custom ranges are not graded red or green.</p>' :
      '<p class="mtext"><b>An average, not one day.</b> We take every ' + (st.sale ? 'sale' : 'non-sale') + ' day in the 4 weeks before ' + short(d) + ' and average them: ' + cmp.n + ' days, ' + range(cmp.from, cmp.to) + '. Matching sale status keeps a sale day from being compared with a normal day.</p>' +
      '<div><h3 style="font-size:16px;margin-bottom:6px">Days used</h3><p class="mtext">' + cmp.dates.slice().reverse().map(x => dmy(x)).join(', ') + '</p></div>' +
      (cmp.skipped.length ? '<div><h3 style="font-size:16px;margin-bottom:6px">Days left out</h3><p class="mtext">' + cmp.skipped.map(x => dmy(x[0]) + ' (' + x[1] + ')').join(', ') + '</p></div>' : '')) :
      '<p class="mtext">Fewer than 3 days in the 4 weeks before had the same sale status, so there is no fair average.</p>';
  } else {
    const list = compCands(b, d, kind).map(x => '<li class="' + (cmp && x.date === cmp.date ? 'pick' : x.ok ? '' : 'skip') + '"><b>' + dmy(x.date, kind === 'yoy') + '</b>: ' + (cmp && x.date === cmp.date ? '<span class="b">used.</span> ' + esc(x.label) : x.ok ? 'also matches, but an earlier match won.' : 'skipped, ' + x.reason + '.') + '</li>').join('');
    body = '<p class="mtext"><b>One day, not an average.</b> We take ' + KIND[kind].full + ' and require the same sale status (' + (st.sale ? 'a sale day' : 'a non-sale day') + '). ' + (kind === 'wow' ? 'It answers: did something change suddenly?' : 'It answers: are we ahead of or behind last year?') + '</p><div><h3 style="font-size:16px;margin-bottom:6px">Days we tried, in order</h3><ul class="tried">' + list + '</ul></div>';
  }
  openModal('<div class="mhead"><span class="lbl">' + KIND[kind].col + ' · ' + label(d) + ' · ' + st.label + '</span><h3 id="mtitle">' + (cmp ? 'Compared with ' + cmpLabel(cmp, kind) : 'No fair comparison for ' + KIND[kind].name) + '</h3></div>' + body +
    '<p class="cap">Comparable days for this comparison: ' + upDown(bs.avg) + ' on average across ' + bs.n + ' ' + (st.sale ? 'sale' : 'non-sale') + ' days since ' + short(BASE_START) + '.</p>');
}

/* ---------- compare brands ---------- */
function compareModal(m) {
  const o = counterpart(m), d = state.day;
  if (!o) { openModal('<h3 id="mtitle">No match</h3><p class="mtext">' + esc(m.label) + ' has no matching metric on ' + BR[BR[m.b].other].name + '.</p>'); return; }
  state.cmp = m.b + '|' + m.key;
  const mk = x => { const c = cellsFor(x, d, compsDefault(x.b, d)), sale = infoNow(x.b, d).sale; return { x, c, sale, jm: judge(x, 'bs', c.bs, sale), jy: judge(x, 'yoy', c.yoy, sale) }; };
  const A = mk(m), B = mk(o), w = t => '<span class="w">' + t + '</span>', g = t => '<span class="b">' + t + '</span>';
  const nm = P => BR[P.x.b].name, dn = P => P.jm && P.jm.dlt < 0, matBad = P => P.jm && P.jm.mat === 'bad', matGood = P => P.jm && P.jm.mat === 'good';
  let verdict;
  const same = sameMove(A.c.bs, B.c.bs), big = P => Math.abs(P.c.bs || 0);
  if (matBad(A) && matBad(B) && !same) verdict = w('Down on both sites, but not by the same amount.') + ' ' + esc(m.label) + ' is ' + upDown(A.c.bs) + ' on ' + nm(A) + ' and ' + upDown(B.c.bs) + ' on ' + nm(B) + ' vs their comparable dayss. The bigger drop on ' + nm(big(A) >= big(B) ? A : B) + ' is specific to that site, so start there.';
  else if (matBad(A) && matBad(B)) verdict = w('Down on both sites.') + ' ' + esc(m.label) + ' is ' + judgeText(A.jm) + ' on ' + nm(A) + ' and ' + judgeText(B.jm) + ' on ' + nm(B) + '. Same direction on both means something bigger than one site: seasonality, a macro swing, or a shared change like the feed or checkout. Not a ' + nm(A) + ' problem alone.';
  else if (matBad(A)) verdict = w('Only ' + nm(A) + ' is down.') + ' ' + nm(B) + ' is ' + (matGood(B) ? g('better than comparable days') : judgeText(B.jm)) + ', so this is specific to ' + nm(A) + '. Look at what changed there.';
  else if (matBad(B)) verdict = nm(A) + ' is ' + judgeText(A.jm) + ', but ' + w(nm(B) + ' is down') + ' (' + judgeText(B.jm) + '). Specific to ' + nm(B) + '.';
  else if (matGood(A) && matGood(B)) verdict = g(same ? 'Up on both sites.' : 'Better than usual on both sites.') + ' Nothing to chase.';
  else verdict = 'Both sites are close to their comparable days. Nothing to chase.';
  const xr = crossRead(m, d); if (xr && xr.rel === 'noisy') verdict = '<b>Not a clean comparison today.</b> Sessions swung more than 25% on one site (' + BR[m.b].name + ' ' + upDown(A.c.sessWow || 0) + ', ' + BR[o.b].name + ' ' + upDown(B.c.sessWow || 0) + ' vs ' + kname('wow', compsFor(m.b, d)) + '), which usually means bots or untagged traffic came or went. Read the shape of the lines, not the change.';
  const col = P => '<div class="col"><h4><i style="background:' + BR[P.x.b].color + '"></i>' + nm(P) + ' <span class="tag' + (P.sale ? ' sale' : '') + '">' + infoNow(P.x.b, d).label + '</span></h4><span class="big">' + fmtVal(P.x, P.c.val) + '</span>' +
    '<span>' + (P.c.bs == null ? '' : sgn(P.c.bs, 0) + ' vs comparable days ') + mkFor(P.x, 'bs', P.c, compsDefault(P.x.b, d), d) + '</span>' + (P.x.b === 'tp' && P.c.yoy != null ? '<span>' + upDown(P.c.yoy) + ' vs ' + dmy(compsFor('tp', d).yoy.date, true) + ' ' + mkFor(P.x, 'yoy', P.c, compsFor('tp', d), d) + '</span>' : '') +
    (P.c.sess != null ? '<span class="cap">' + int(P.c.sess) + ' sessions' + (P.c.sessBs != null ? ', ' + sgn(P.c.sessBs, 0) + ' vs comparable days' : '') + '</span>' : '') + (state.cmpMode === 'side' ? '<div class="chart" id="cmp-' + P.x.b + '"></div>' : '') + '</div>';
  const modeBtns = '<div class="seg" role="group" aria-label="Chart layout"><button data-cmpmode="overlay" aria-pressed="' + (state.cmpMode === 'overlay') + '">Overlaid</button><button data-cmpmode="side" aria-pressed="' + (state.cmpMode === 'side') + '">Side by side</button></div>';
  openModal('<div class="mhead"><span class="lbl">Both sites on ' + label(d) + '</span><h3 id="mtitle">' + em(m.label) + ' ' + esc(m.label) + '</h3></div>' + mvTabs(m, 'cmp') + '<p class="mtext">' + verdict + '</p>' + modeBtns + '<div class="two">' + col(A) + col(B) + '</div>' +
    (state.cmpMode === 'overlay' ? '<div class="legend"><span><i class="sw" style="background:' + BR.tp.color + '"></i>TeePublic</span><span><i class="sw" style="background:' + BR.rb.color + '"></i>Redbubble</span><span class="cap">Each line is indexed so its own 90-day average is 100, so you compare shape, not level. Light bands are each site\'s sale days.</span></div><div class="chart" id="cmp-over"></div>' : '') +
    '<p class="cap">Each site is graded against its own comparable days, so this compares behavior, not levels. Redbubble has no last-year data.</p>', 'cmp_' + encK(m.key));
  if (state.cmpMode === 'overlay') drawOverlay($('#cmp-over'), A.x.b === 'tp' ? A.x : B.x, A.x.b === 'tp' ? B.x : A.x);
  else [A, B].forEach(P => drawChart($('#cmp-' + P.x.b), { m: P.x, mini: true }));
}

const todayChip = () => { const t = addDays(D.asOf, 1), x = infoNow('tp', t), y = infoNow('rb', t);
  const txt = x.sale && y.sale && x.pos === y.pos ? 'sale day ' + x.pos + ' on both sites' : x.sale || y.sale ? [x.sale ? 'TP sale day ' + x.pos : 'TP no sale', y.sale ? 'RB sale day ' + y.pos : 'RB no sale'].join(' · ') : 'no sale on either site';
  return '<span class="today">' + WD[dow(t)] + ': ' + txt + '</span>'; };
/* ---------- how this refreshes ---------- */
function refreshModal() {
  const R = typeof REFRESH !== 'undefined' ? REFRESH : null;
  openModal('<div class="mhead"><span class="lbl">How this refreshes</span><h3 id="mtitle">↻ Updated three times a day, automatically</h3></div>' +
    '<p class="mtext">' + (R ? 'Last refreshed <b>' + esc(R.last) + '</b>. ' : '') + 'At about 8:30 AM ET (yesterday\'s full numbers and overnight Slack), 2:30 PM ET (fresh before the daily peak standup) and 4:30 PM ET (after it), a scheduled Claude task on Mike\'s computer rebuilds this page and republishes it to the same link. It runs while the Claude app is open there; if the computer is off, it runs the next time the app opens.</p>' +
    '<div class="guide"><div><b>1. CVR</b>The latest complete day from Amplitude for TeePublic and Redbubble: CVR, sessions, revenue, device, funnel, channel, region and payment mix, all bot-filtered. Dashery joins once its selling-store dashboard exists.</div>' +
    '<div><b>2. A/B tests and impact</b>Running, upcoming and recently decided tests from Amplitude Experiment, with confidence and whole-site impact. Wins and their write-ups from Confluence.</div>' +
    '<div><b>3. Roadmap</b>Status, launch dates and progress from Jira, team velocity from the sprint-metrics channels, and priority moves from standups, team channels and each team\'s exec meeting.</div>' +
    '<div><b>4. Trending</b>The last 24 hours of top designs, topics and categories, the threads people are talking about, and the shout-out of the day.</div>' +
    '<div><b>5. Customer service</b>Scans the customer service channels against a four-week baseline and only flags what is above normal.</div>' +
    '<div><b>6. Daily peak standup</b>Meeting notes become the recap and tomorrow\'s agenda. Roundtable topics and next-step ticks are saved live as people add them.</div>' +
    '<div><b>7. Checks, then publish</b>Recomputes comparisons and baselines, checks the build and republishes. If a source fails, the page keeps the previous data rather than guessing.</div></div>' +
    '<p class="cap">Between refreshes the numbers do not change; clicking around only re-arranges data already in the page. Shared items (topics, ticks, reorders) update live. The newest day is not final for about 48 hours.</p>');
}

/* ---------- how to read ---------- */
function guideModal() {
  const b = state.tab;
  const notes = [
    ['Comparable days', 'Each metric has its own comparable days: the average from Aug 20 of that comparison, worked out separately for sale days and non-sale days. A metric that is up 25% all year is not "better than comparable days" just for being up.'],
    ['Green and red', 'Every comparison is graded against comparable days. Green is better than it, red is worse. Hover any underlined phrase to see the numbers behind it.'],
    ['The headline and top cards', 'Vs prior day is always the day before, with a note when that day was different (a sale vs no sale, or another discount), since that explains most big swings. Vs comparable days averages every matching day since ' + short(BASE_START) + ': the same point in a sale at the same discount, or the same weekday on normal days. Vs last year averages the same kind of day in the same month last year.'],
    ['Scorecard columns', 'On a normal day: vs a week ago is the same weekday last week, vs last month\'s average is the non-sale days in the four weeks before, and vs last year is the same weekday a year back' + (b === 'tp' ? '.' : ' (Redbubble has no data that far back yet).')],
    ['Sale days are matched by position', 'A sale day is only compared with the same point in other sales: day 1 with day 1s, and the third-to-last, second-to-last and final days with the same days of other sales. Everything in between counts as mid-sale. In a 3-day sale, its first day counts as day 1. So on a sale day the three comparisons become the last sale\'s matching day, last month\'s average for that day, and last year\'s average for that day in the same month (an October sale day 1 against October 2025\'s sale day 1s). They also have to be at the same discount: a 40% off day is only compared with 40% off days, and 35% with 35%. If no matching day exists, the closest one at another discount is used and flagged. Last year\'s discounts are not logged, so that comparison matches on position only.'],
    ['Change the comparison', 'Use the pencil next to the date picker to compare against any day or range you pick. The 📅 sale calendar shows every sale and its offer; click a day for details.'],
    ['Holidays', 'Nov 1 to Dec 31 every date behaves differently, so vs last year leads and uses the same calendar date. The rest of the year, vs a week ago leads.'],
    ['What moved', 'The segments that are worse than usual on every comparison, worst first. The rolling cell beside each one shows context: how the other devices, regions or channels did, overall CVR for funnel steps, and traffic. Click one for the full read.'],
    ['Seen on the other site?', 'The CVR row says whether the other site is seeing the same move (the same direction, at least 3%, and at least a third as big). Other rows only show a tag when they differ from that; otherwise the column is blank. It is also blank when a segment\'s traffic swung too much to read fairly.'],
    ['Bot filter', state.botf === 'max' ? 'Maximum (the default): bot score 90 or higher, top countries only. ' + (b === 'tp' ? 'USA, UK, Australia and Canada; verified crawlers excluded.' : 'USA, Canada, UK, Australia, Germany, France and New Zealand.') + ' It over-corrects on purpose: read the direction, not the level. Switch to Strong at the top of the page for the score-70 view.' : b === 'tp' ? 'Visitors need a Cloudflare bot score of 70 or higher, and verified crawlers are excluded. Levels read higher than the unfiltered Amplitude charts.' : 'Redbubble uses the score of 70 or higher only. Bots still sit in Direct and desktop traffic, so levels read low. Read direction, not level.'],
    ['Settling', 'The newest two days usually revise up 4 to 11% over the next 48 hours. Do not call a day weak until it has settled.'],
    b === 'tp' ? ['Sep 30 to Oct 4', 'A $16.50 tee price test ran all week and a bot spike hit Oct 2 and 3. Those days are never used as comparison or comparable days.'] : ['Channel on Redbubble', 'Redbubble\'s Channel property is broken upstream (DEAP-5099), so channel uses campaign medium. Direct is (none), Paid Search is cpc.'],
    b === 'tp' ? ['Last year\'s sale days', 'The 2025 sale calendar is not logged, so a day at or above 3% bot-filtered CVR counts as a sale day there.'] : ['Checkout completion', 'Not comparable across Aug 17 and Sep 8 because of the cart shipping removal test. It steps down from about 85% to about 70% across those dates.'],
    ['Alerts', 'Rare on purpose. A segment gets one only when it is at least 10% worse than comparable days on every comparison, and the other site is not seeing the same thing. Three at most.']
  ];
  const rows = Object.keys(SECS).map(k => '<tr><td>' + SEC_EMOJI[k] + ' ' + SECS[k] + '</td><td>+<input type="number" step="0.5" min="0" data-thr="' + k + '" data-k="g" value="' + state.thr[k].g + '" aria-label="' + SECS[k] + ' better threshold"> %</td><td>−<input type="number" step="0.5" min="0" data-thr="' + k + '" data-k="r" value="' + state.thr[k].r + '" aria-label="' + SECS[k] + ' worse threshold"> %</td></tr>').join('');
  openModal('<div class="mhead"><h3 id="mtitle">How to read this</h3></div><div class="guide">' + notes.map(n => '<div><b>' + n[0] + '</b>' + n[1] + '</div>').join('') + '</div>' +
    '<div><h3 style="font-size:16px;margin-bottom:6px">When a miss counts for What moved</h3><table class="thr"><thead><tr><th class="l">Section</th><th class="l">Better than comparable days by</th><th class="l">Worse than comparable days by</th></tr></thead><tbody>' + rows + '</tbody></table></div>');
}

/* ---------- verdict and key numbers ---------- */
// Hover on the headline number: the last 4 weeks of CVR, sale days shaded, this day marked.
// Hover on any of the four big numbers: a small bar chart of exactly what's being compared (the comparison days, their average
// as a dashed line, and the day under review), with CVR / Sessions / Revenue switches. Click the number to pin it open.
// Hover chart: one site, with a switch (top right) that adds the other site's same chart below it (Mike, Oct 25).
function cmpTip(b, d, kind, mk) {
  const CAP = '<div class="cap">Click the number to keep this open.</div>', h = cmpTip1(b, d, kind, mk, false).replace(CAP, '');
  return h + (state.tipOther ? '<div class="kcoth">' + cmpTip1(BR[b].other, d, kind, mk, true).replace(CAP, '').replace(/var\(--accent\)/g, BR[BR[b].other].color) + '</div>' : '') + CAP;
}
function cmpTip1(b, d, kind, mk, bare) {
  const M = metricsFor(b), m = M.overall[{ cvr: 0, sess: 1, rev: 2 }[mk]], I = SER.tp.idx, c = compsDefault(b, d), ly = kind === 'yoy';
  const fmt = mk === 'cvr' ? (x => pct(x)) : mk === 'sess' ? int : usd, nm = { cvr: 'CVR', sess: 'Sessions', rev: 'Revenue' }[mk];
  let ds = [], ttl = '';
  if (kind === 'hero') { for (let k = 13; k >= 1; k--) { const x = addDays(d, -k); if (I[x] !== undefined) ds.push(x); } ttl = 'the last two weeks'; }
  else if (kind === 'pd') { ds = c.pd ? c.pd.dates : []; ttl = 'vs prior day'; }
  else if (kind === 'bs') { ds = baseDays(b, d); ttl = 'vs comparable days'; }
  else { ds = c.yoy && c.yoy.dates ? c.yoy.dates : []; ttl = 'vs last year'; }
  const v = x => ly ? (m.ly ? m.ly[lyIndex(x)] : null) : m.v[I[x]];
  const pts = ds.map(x => [x, v(x)]).filter(p => p[1] != null), today = m.v[I[d]];
  const sw = bare ? '' : '<div class="kctop"><div class="kcsw">' + [['cvr', 'CVR'], ['sess', 'Sessions'], ['rev', 'Revenue']].map(o => '<button type="button" data-kctip="' + b + '|' + d + '|' + kind + '|' + o[0] + '" aria-pressed="' + (o[0] === mk) + '">' + o[1] + '</button>').join('') + '</div>' +
    '<button type="button" class="swtog kctog" role="switch" data-kctip="' + b + '|' + d + '|' + kind + '|' + mk + '|o" aria-checked="' + !!state.tipOther + '"><span class="trk"><span class="knb"></span></span>' + BR[BR[b].other].name + '</button></div>';
  // Hourly overlay when we have hours: the day's line against the comparison (one day, or the hour-by-hour average of several).
  const HR = state.botf !== 'max' && typeof HOURLY !== 'undefined' && HOURLY[b] ? HOURLY[b] : null, hd = HR && HR[d] && HR[d][mk];
  const hc = HR && kind !== 'hero' ? ds.map(x => HR[x] && HR[x][mk]).filter(Boolean) : [];
  if (hd && hc.length) {
    const cmp = Array.from({ length: 24 }, (_, h) => { const xs = hc.map(a => a[h]).filter(x => x != null); return xs.length ? sum(xs) / xs.length : null; });
    const all = hd.concat(cmp).filter(x => x != null), lo = Math.min(...all), hi = Math.max(...all), W = 300, H = 130, pl = 6, pr = 6, pt = 8, pb = 20;
    const X = h => pl + (W - pl - pr) * h / 23, Y = x => pt + (H - pt - pb) * (1 - (x - lo) / ((hi - lo) || 1));
    const path = a => a.map((x, h) => x == null ? '' : (h && a[h - 1] != null ? 'L' : 'M') + X(h).toFixed(1) + ' ' + Y(x).toFixed(1)).join(' ');
    const ticks = [[0, '12a'], [6, '6a'], [12, '12p'], [18, '6p'], [23, '11p']].map(t => '<text x="' + X(t[0]).toFixed(1) + '" y="' + (H - 5) + '" text-anchor="middle" style="font-size:9.5px;fill:var(--muted)">' + t[1] + '</text>').join('');
    const svg = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" style="display:block;margin:8px 0" aria-hidden="true"><path d="' + path(cmp) + '" style="fill:none;stroke:var(--muted);stroke-width:1.6;stroke-dasharray:4 3"/><path d="' + path(hd) + '" style="fill:none;stroke:var(--accent);stroke-width:2.2;stroke-linejoin:round"/>' + ticks + '</svg>';
    const cl = kind === 'pd' ? short(ds[0]) : ly ? 'avg of ' + hc.length + ' matching days last year' : 'avg of ' + hc.length + ' comparable days';
    const dl = pts.length && today != null ? today / (sum(pts.map(p => p[1])) / pts.length) - 1 : null;
    return '<b>' + BR[b].name + ' ' + nm + ' by hour, ' + ttl + '</b>' + sw + svg + '<div class="kcleg"><span><i class="kl1"></i>' + short(d) + '</span><span><i class="kl2"></i>' + cl + '</span></div>' +
      (dl != null ? '<div class="kct">Whole day: <b>' + fmt(today) + '</b> vs <b>' + fmt(sum(pts.map(p => p[1])) / pts.length) + '</b>: <b style="color:var(--' + (dl < 0 ? 'bad' : 'good') + ')">' + sgn(dl, 1) + '</b></div>' : '') + '<div class="cap">Hours in ' + esc((typeof HOURLY !== 'undefined' && HOURLY.tzLabel) || 'ET') + '. The hourly lines come from Amplitude\'s hourly funnel, so compare their shapes; levels can sit a little off the daily figures. Click the number to keep this open.</div>';
  }
  if (!pts.length || today == null) return '<b>' + BR[b].name + ' ' + nm + ' ' + ttl + '</b><br>No comparison days for this.' + sw;
  const avg = sum(pts.map(p => p[1])) / pts.length, hi = Math.max(...pts.map(p => p[1]), today) * 1.1, w = 300, h = 120, pl = 4, pb = 20, n = pts.length + 1, bw = (w - 2 * pl) / n;
  const Y = x => h - pb - (x / hi) * (h - pb - 6), dlab = x => short(x) + (ly ? " '25" : '');
  const bars = pts.map((p, i) => { const sale = !ly && infoNow(b, p[0]).sale; return '<rect x="' + (pl + i * bw + bw * .15).toFixed(1) + '" y="' + Y(p[1]).toFixed(1) + '" width="' + (bw * .7).toFixed(1) + '" height="' + (h - pb - Y(p[1])).toFixed(1) + '" rx="2" style="fill:var(--faint);opacity:' + (sale ? .9 : .55) + '"><title>' + dlab(p[0]) + ': ' + fmt(p[1]) + (sale ? ' (sale)' : '') + '</title></rect>' + (n <= 8 ? '<text x="' + (pl + i * bw + bw / 2).toFixed(1) + '" y="' + (h - 5) + '" text-anchor="middle" style="font-size:9.5px;fill:var(--muted)">' + dlab(p[0]) + '</text>' : ''); }).join('');
  const ti = pts.length, tb = '<rect x="' + (pl + ti * bw + bw * .15).toFixed(1) + '" y="' + Y(today).toFixed(1) + '" width="' + (bw * .7).toFixed(1) + '" height="' + (h - pb - Y(today)).toFixed(1) + '" rx="2" style="fill:var(--accent)"/><text x="' + (pl + ti * bw + bw / 2).toFixed(1) + '" y="' + (h - 5) + '" text-anchor="middle" style="font-size:9.5px;fill:var(--ink);font-weight:700">' + short(d) + '</text>';
  const al = '<line x1="' + pl + '" x2="' + (pl + ti * bw).toFixed(1) + '" y1="' + Y(avg).toFixed(1) + '" y2="' + Y(avg).toFixed(1) + '" style="stroke:var(--ink);stroke-width:1.2;stroke-dasharray:4 3;opacity:.7"/>';
  const svg = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" style="display:block;margin:8px 0" aria-hidden="true">' + bars + al + tb + '</svg>';
  const dl = today / avg - 1;
  return '<b>' + BR[b].name + ' ' + nm + ' ' + ttl + '</b>' + sw + svg + '<div class="kct"><b>' + fmt(today) + '</b> on ' + short(d) + ' vs <b>' + fmt(avg) + '</b> ' + (pts.length === 1 ? 'on ' + dlab(pts[0][0]) : 'average of ' + pts.length + ' days (dashed line)') + ': <b style="color:var(--' + (dl < 0 ? 'bad' : 'good') + ')">' + sgn(dl, 1) + '</b></div>' +
    (pts.length <= 6 ? '<div class="cap">' + pts.map(p => dlab(p[0]) + ' ' + fmt(p[1]) + (!ly && infoNow(b, p[0]).sale ? ' (sale)' : '')).join(' · ') + '</div>' : '<div class="cap">Darker bars are sale days.</div>') + '<div class="cap">Click the number to keep this open.</div>';
}
function kpiTip(b, d, m) {
  const I = SER.tp.idx, ds = []; for (let k = 27; k >= 0; k--) { const x = addDays(d, -k); if (I[x] !== undefined && m.v[I[x]] != null) ds.push(x); }
  if (ds.length < 2) return '<b>' + BR[b].name + ' CVR</b>';
  const pd = addDays(d, -1), pi = ds.indexOf(pd), vs = ds.map(x => m.v[I[x]]), lo = Math.min(...vs), hi = Math.max(...vs), w = 240, h = 64, p = 4;
  const X = i => p + (w - 2 * p) * i / (ds.length - 1), Y = v => p + (h - 2 * p) * (1 - (v - lo) / ((hi - lo) || 1)), bw = (w - 2 * p) / (ds.length - 1);
  const bands = ds.map((x, i) => infoNow(b, x).sale ? '<rect x="' + (X(i) - bw / 2).toFixed(1) + '" y="0" width="' + bw.toFixed(1) + '" height="' + h + '" style="fill:var(--accent);opacity:.12"/>' : '').join('');
  const svg = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" style="display:block;margin:6px 0" aria-hidden="true">' + bands + (pi >= 0 ? '<line x1="0" x2="' + w + '" y1="' + Y(vs[pi]).toFixed(1) + '" y2="' + Y(vs[pi]).toFixed(1) + '" style="stroke:var(--muted);stroke-width:1;stroke-dasharray:3 3;opacity:.7"/>' : '') + '<polyline points="' + vs.map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ') + '" style="fill:none;stroke:var(--accent);stroke-width:2;stroke-linejoin:round"/>' + (pi >= 0 ? '<circle cx="' + X(pi).toFixed(1) + '" cy="' + Y(vs[pi]).toFixed(1) + '" r="3.5" style="fill:var(--surface);stroke:var(--muted);stroke-width:1.5"/>' : '') + '<circle cx="' + X(ds.length - 1).toFixed(1) + '" cy="' + Y(vs[vs.length - 1]).toFixed(1) + '" r="3.5" style="fill:var(--accent)"/></svg>';
  const sm = metricsFor(b).overall[1], rm = metricsFor(b).overall[2], i = I[d];
  return '<b>' + BR[b].name + ' CVR, last 4 weeks</b>' + svg + (pi >= 0 ? '<b>' + sgn(m.v[I[d]] / vs[pi] - 1, 0) + ' vs ' + dmy(pd) + '</b> (' + pct(vs[pi]) + ', the dashed line). ' : '') + 'Low ' + pct(lo) + ' · high ' + pct(hi) + '. Shaded days are sales.<br>' + short(d) + ': <b>' + pct(m.v[i]) + '</b> from ' + int(sm.v[i]) + ' sessions and ' + usd(rm.v[i]) + ' revenue. Share of visitors who order the same day, bots filtered out.';
}
// A segment named in the headline: hover for the same read as its scorecard row (range bar, peers, the other site, a mini chart), click to jump there opened.
const segLink = (f, mid, cls, tot) => hint(esc(inSent(f.m.label, mid)), 'verd ' + cls + ' seglink" data-watch="' + f.m.b + '|' + esc(f.m.key), segTip2(f, tot));
// The peers named in the headline get their own hover card: each one's move, and a click jumps to that section (Mike, Oct 28).
function peerLink(f) {
  const x = sibsOf(f.m, state.day), txt = esc(lcx(f.peers || 'its peers'));
  if (!x || x.rest.length < 2) return txt;
  const mx = Math.max(...x.rest.map(y => Math.abs(y.mom)), 0.01);
  const bars = x.rest.slice().sort((a, z) => z.mom - a.mom).map(y => '<div class="sbrow"><span class="sbl">' + esc(y.m.label) + '</span><span class="sbt"><i class="' + (y.mom < 0 ? 'neg' : 'pos') + '" style="width:' + Math.round(Math.abs(y.mom) / mx * 50) + '%"></i></span><span class="sbv">' + sgn(y.mom, Math.abs(y.mom) < 0.01 ? 1 : 0) + '</span></div>').join('');
  const up = x.rest.filter(y => y.mom > 0.01).length, dn = x.rest.filter(y => y.mom < -0.01).length;
  const tip = '<div class="nrtip segtip"><b class="tiph">' + esc(ucf(f.peers)) + ' vs comparable days</b><span class="tipv">' + (x.restMom >= 0 ? '📈' : '📉') + ' <b>' + sgn(x.restMom, 0) + '</b> on average</span>' +
    '<p class="cap">' + (up ? up + ' up' : '') + (up && dn ? ', ' : '') + (dn ? dn + ' down' : '') + (x.rest.length - up - dn ? (up || dn ? ', ' : '') + (x.rest.length - up - dn) + ' flat' : '') + '; the average weights each by its sessions. ' + esc(f.m.label) + ' is ' + sgn(x.me.mom, 0) + ', ' + Math.round(Math.abs(x.gap) * 100) + ' points ' + (x.gap < 0 ? 'behind' : 'ahead') + '.</p>' +
    '<div class="sbars">' + bars + '</div><span class="segmore">Click to see ' + esc(SECS[f.m.sec] || 'the section') + ' →</span></div>';
  return hint(txt, 'verd seglink" data-jumpsec="' + f.m.sec, tip);
}
function segTip2(f, tot) {
  // Cut down for a glance (Mike, Oct 28: "this overlay is way too intense"): title, which days it's compared with, the verdict and range bar,
  // its peers, then one chart with sessions in it. How the days are picked lives in the Sources and the full view, not here.
  const m = f.m, d = state.day, c = cellsFor(m, d, compsFor(m.b, d)), r = nrOf(m, c.bs), bd = (compsFor(m.b, d).bs || {}).dates || [];
  const st = infoNow(m.b, d), pk = st.sale ? posKey(st) : null, kind = st.sale ? (pk && POSN[pk] ? POSN[pk] + 's' : 'sale days') : noSaleKind(m.b, d, 2);
  const peers = f.rest != null ? '<li>👥 <b>' + esc(ucf(f.peers)) + ':</b> ' + sgn(f.rest, 0) + ' on average</li>' : ''; // no "N points behind": the two numbers say it (Mike, Oct 28)
  return '<div class="nrtip segtip"><b class="tiph">' + esc(tipName(m)) + ' vs comparable days</b>' +
    (bd.length ? '<span class="tipsub">Most recent comparable days: ' + bd.slice(-3).map(z => short(z)).join(', ') + ' (' + kind + ')</span>' : '') +
    '<span class="tipv">' + (r ? (r.st === 'in' ? '✅' : r.st === 'hi' ? '🚀' : '🔻') + ' ' : '') + '<b>' + sgn(c.bs, 0) + '</b>' + (r ? ': <b class="t' + tcls(r, c.bs) + '">' + (r.st === 'in' ? 'a normal day' : r.st === 'hi' ? 'above its normal range' : 'below its normal range') + '</b>' : '') + '</span>' + (r ? '<span class="tipnr nr' + r.st + '">' + nrBarH(c.bs, r.w) + '</span>' : '') +
    (peers ? '<ul class="hul nrul">' + peers + '</ul>' : '') +
    tipChart(m, bd, c.bsV, r ? (tcls(r, c.bs) === 'lo' ? 'bad' : tcls(r, c.bs) === 'hi' ? 'good' : null) : null, { band: r ? r.w : 0, full: true, sess: !m.isSess && m.sess, h: 140 }) + '<button type="button" class="segmore segbtn" data-segkey="' + esc(m.key) + '">Click for more details →</button></div>'; // a working link inside the hover (Mike, Oct 28: it did nothing)
}
function segTip(f, tot) {
  const up = f.c.mom >= 0, cls = up ? 'b' : 'w', sh = f.m.sec === 'funnel' ? 'Every order passes this step' : Math.round(Math.min(1, (f.c.sess || 0) / (tot || 1)) * 100) + '% of sessions';
  const row = (k, v) => '<div class="r2"><span>' + k + '</span><span>' + v + '</span></div>';
  return '<b>' + esc(f.m.label) + (f.m.sec === 'funnel' ? '' : ' CVR') + '</b>' +
    row('vs comparable days', '<b class="' + cls + '">' + sgn(f.c.mom, 0) + '</b>') +
    (f.rest != null ? row(ucf(esc(f.peers)), sgn(f.rest, 0)) + row('Gap to its peers', '<b class="' + cls + '">' + Math.round(Math.abs(f.gap) * 100) + ' points ' + (f.gap > 0 ? 'better' : 'worse') + '</b>') : '') +
    row(short(state.day), fmtVal(f.m, f.c.val) + ' vs ' + fmtVal(f.m, f.c.momV) + ' usual') + row('Weight', sh) + (f.mix ? row('Sessions', sgn(f.c.sessMom, 0) + ', a traffic spike') : '');
}
// What the team said about this data at the daily peak standup. The standup the day after a data day discusses that day,
// so a page showing Oct 21 pulls the Oct 22 standup. Leads with the open and blocked items for this site, named by owner.
function standupLine(b, d) {
  const auto = autoLead(b, d);
  if (typeof STANDUPS === 'undefined' || !STANDUPS.length) return auto;
  const code = b === 'rb' ? 'RB' : 'TP', su = STANDUPS.filter(x => x.date > d && parse(x.date) - parse(d) <= 4 * DAY).sort((a, z) => a.date < z.date ? -1 : 1)[0];
  if (!su) return auto;
  const take = typeof SU_TAKE !== 'undefined' && SU_TAKE[code] && SU_TAKE[code][d];
  if (take) return '<p class="sulead" title="From the ' + esc(label(su.date)) + ' daily peak standup">' + esc(take) + '</p>';
  const ORD = { blocked: 0, open: 1, soon: 2, done: 3 };
  const mine = su.items.filter(it => it.site === code || it.site === 'Both').sort((a, z) => (ORD[a.tone] ?? 4) - (ORD[z.tone] ?? 4)).filter(it => it.tone !== 'done').slice(0, 2);
  if (!mine.length) return auto;
  const lc = t => t ? t.charAt(0).toLowerCase() + t.slice(1) : '';
  const who = it => it.owner && !/^(the )?team$/i.test(it.owner) ? it.owner + ' to ' + lc(it.nx || '') : lc(it.nx || '');
  const part = it => hint('<b>' + esc(it.title) + '</b>', 'sui', '<b>' + esc(it.title) + '</b><br>' + esc(it.detail || '') + (it.impact ? '<br><br><b>Why it matters:</b> ' + esc(it.impact) : '')) + (it.nx ? ' <span class="suw">(' + esc(who(it)) + ')</span>' : '');
  return '<p class="sulead">' + mine.map(part).join('; ') + '.</p>';
}
// Days no standup covered still get a subhead, built from the data: what kind of day it was and what stood out.
// "Potential drivers vs comparable days:" with the comparable days on hover, so nobody has to ask what the pills compare to.
function drvLbl() {
  const b = state.tab, d = state.day, bd = (compsFor(b, d).bs || {}).dates || [], st = infoNow(b, d);
  return '<span class="mvlbl">' + hint('Key drivers', 'soft kvh', '<b>Each pill: ' + short(d) + ' vs its comparable days</b><ul class="hul nrul"><li>📏 <b>Baseline:</b> the average of ' + bd.length + ' day' + (bd.length === 1 ? '' : 's') + ' like ' + short(d) + '</li><li>🎯 <b>Like it:</b> ' + (st.sale ? 'the same point in a sale' : 'the same weekday, no sale') + '</li><li>📅 <b>The days:</b> ' + bd.map(x => short(x)).join(', ') + '</li><li>↔️ <b>Right side:</b> the rest of that group (other regions, other channels) on the same basis</li></ul>' + (bd.length < 3 ? '<span class="cap">Only ' + bd.length + ' matching day' + (bd.length === 1 ? '' : 's') + ', so treat big gaps with care.</span>' : '')) + ':</span>';
}
function autoLead(b, d) {
  const st = infoNow(b, d), tr = tierOf(b, d), comps = compsFor(b, d), ov = cellsFor(metricsFor(b).overall[0], d, comps), out = [];
  // The sale tag above the headline already says what kind of day it is, so the subtitle doesn't repeat it (design agency, Oct 28).
  if (ov.sessBs != null && Math.abs(ov.sessBs) >= 0.1) out.push('Traffic ' + sgn(ov.sessBs, 0) + ' vs comparable days');
  const f = MOVED[0], l = LIFTS[0];
  if (f && f.mix) out.push(f.m.label + ' brought a traffic spike (' + sgn(f.c.sessMom, 0) + ') that converted below usual');
  // Every number names what it's compared with (standup, Oct 27: "what's the baseline?" took the room a minute).
  /* the top driver's numbers are already in the headline; don't say them twice */
  // No driver numbers here: the pills carry them (Mike, Oct 28).
  return out.length ? '<p class="sulead" title="No standup notes for this day, so this line comes from the data">' + esc(out.join('. ')) + '.</p>' : '';
}
// Segment names inside a sentence: funnel steps and devices are ordinary words, so they're lowercase mid-sentence ("USA and add to cart rate lifted it"); channels and regions keep their capitals.
const inSent = (label, mid) => { const common = /\brate$/i.test(label) || /^(Desktop|Mobile|Tablet|App)$/i.test(label); return mid && common ? label.charAt(0).toLowerCase() + label.slice(1) : label.charAt(0).toUpperCase() + label.slice(1); };
// The segment furthest from its peers in one direction (dir -1: worse, +1: better), never one set aside as likely bots.
function standout(b, d, dir) {
  const comps = compsFor(b, d), tot = cellsFor(metricsFor(b).overall[0], d, comps).sess || 1, out = [];
  ['device', 'funnel', 'channel', 'geo'].forEach(sec => metricsFor(b)[sec].forEach(m => {
    const c0 = cellsFor(m, d, comps), x = sibsOf(m, d); if (c0.bs == null || !x || Math.sign(c0.bs) !== dir || Math.sign(x.gap) !== dir || nrOf(m, c0.bs).st === 'in') return;
    if (m.sec !== 'funnel' && (c0.sess || 0) / tot < 0.05) return; // too small to matter
    const f = { m, c: Object.assign({}, c0, { mom: c0.bs, momV: c0.bsV, sessMom: c0.sessBs }), rest: x.restMom, gap: x.gap, peers: x.rest.length === 1 ? x.rest[0].m.label : 'other ' + x.n[1] };
    if (!botWhy(b, d, f)) out.push(f);
  }));
  return out.sort((a, z) => dir * (z.gap - a.gap)).slice(0, 1);
}
function verdictHtml(b) {
  const { d } = dayOf(), m = metricsFor(b).overall[0], comps = compsFor(b, d), c = cellsFor(m, d, comps), L1 = lead(b, d);
  // Same three comparisons as the cards: prior day (context only, not graded), comparable days, last year.
  let good = 0, bad = 0; const parts = [];
  const p1 = priorOf(b, d, m), ctx = priorCtx(b, d), B = baseOf(b, d, m);
  if (c.custom && c.mom != null) parts.push('<b>' + sgn(c.mom, 0) + ' vs your custom range</b>');
  // The headline grades the day on comparable days and last year (Mike, Oct 23). The prior day is context; it only leads when nothing else is available.
  let pdPart = null;
  if (!(c.custom && c.mom != null) && p1.mom != null) pdPart = '<span class="verd n2">' + sgn(p1.mom, 0) + ' vs the prior day</span>';
  // Colored by the normal range: inside is blue and says so; only outside it is green or red (Mike, Oct 27).
  const NR = B.c.mom != null ? nrOf(m, B.c.mom) : null;
  const calm = NR && NR.st === 'in';
  if (B.c.mom != null) { const x = B.c.mom, tc0 = tcls(NR, x), cls = tc0 === 'lo' ? 'w' : tc0 === 'hi' ? 'b' : 'n2'; parts.push('<span class="verd ' + cls + '">' + sgn(x, 0) + ' vs comparable days' + (NR.st === 'in' ? ' (within its normal range)' : '') + '</span>'); }
  // Up 30%+ on last year reads as last year's bots, so it stays out of the headline (Mike, Oct 27); the YoY card says "Likely bots".
  if (b === 'tp' && c.yoy != null && !yoyBot(c.yoy)) { const j = judge(m, 'yoy', c.yoy, infoNow(b, d).sale); if (j.cls === 'bad') bad++; else if (j.cls === 'good') good++; const y = comps.yoy, ys = y && y.dates ? y.dates.map(x => short(x)).join(', ') + ', 2025' : y ? dmy(y.date, true) : ''; parts.push('<span class="verd ' + (c.yoy < 0 ? 'w' : c.yoy > 0 ? 'b' : 'n2') + '">' + sgn(c.yoy, 0) + ' YoY</span>'); }
  // YoY always ends the H1 (Mike, Oct 28). 30%+ is last year's bots, so it shows with 🤖, ungraded, and explains itself on hover.
  if (b === 'tp' && c.yoy != null && yoyBot(c.yoy)) parts.push(hint(sgn(c.yoy, 0) + ' YoY 🤖', 'verd n2', YOYBOT_TIP + '<br>' + pct(c.ly) + ' → ' + pct(c.val) + '.'));
  // Comparable days always sets the tone; last year only when there's no baseline. Last year's bot traffic was worse and less filtered,
  // so a big YoY gap doesn't overrule it (Mike, Oct 26: tried letting a 4x-bigger YoY lead, then undid it).
  const yb = b === 'tp' ? c.yoy : null;
  if (!parts.length && pdPart) parts.push(pdPart);
  // When the graded comparisons point opposite ways, say "but", so the tension reads at a glance.
  const sg = [B.c.mom, b === 'tp' && !yoyBot(c.yoy) ? c.yoy : null].filter(v => v != null && Math.abs(v) >= 0.02).map(Math.sign);
  const conj = sg.length === 2 && sg[0] !== sg[1] ? ' but ' : ' and ';
  const list = parts.length > 2 ? parts.slice(0, -1).join(', ') + conj + parts[parts.length - 1] : parts.join(conj);
  const lead0 = B.c.mom != null ? B.c.mom : yb, ktone = NR ? (tcls(NR, B.c.mom) === 'hi' ? ' kup' : NR.st === 'lo' ? ' kdn' : ' kin') : lead0 == null || yoyBot(lead0) ? '' : lead0 > 0 ? ' kup' : lead0 < 0 ? ' kdn' : '';
  let s = BR[b].name + ' CVR was ' + hint(pct(c.val), 'kpi' + ktone, kpiTip(b, d, m)) + ', ' + list + '. ';
  VLEAD = s; // the page shows only this first sentence; the drivers live in the pills (Allison and Mike, Oct 28)
  let names = rankMoved().slice(0, 2).map(r => r.f);
  const drv = f => '<b class="w">' + sgn(f.c.mom, 0) + ' vs comparable days</b> (' + fmtVal(f.m, f.c.momV) + ' → ' + fmtVal(f.m, f.c.val) + ')' + (f.mix ? ', while its sessions went ' + upDown(f.c.sessMom) + '.' : '.') + (f.rest != null ? '<br>' + ucf(esc(f.peers)) + ': ' + sgn(f.rest, 0) + ', so it is <b class="w">' + Math.round(-f.gap * 100) + ' points worse than its peers</b>.' : '');
  // The named segments are always the ones doing worse than usual: they drove a down day, held back an up day, or were simply the softest on a flat one.
  // Tone follows comparable days: up says what's working, down says what isn't (Mike, Oct 26). Last year only decides it when there's no baseline.
  const tb = B.c.mom != null ? B.c.mom : yb;
  const tone = tb == null ? 'flat' : tb > 0 ? 'up' : tb < 0 ? 'down' : 'flat';
  // Always lead with the one thing that stands out: when no segment clears the driver bar, name the one furthest from its peers in the day's direction.
  if (tone === 'down' && !names.length) names = standout(b, d, -1);
  if (tone === 'up' && !LIFTS.length && state.tab === b) LIFTS = standout(b, d, 1).map(f => Object.assign(f, { lift: true }));
  // On an up day, lead with what lifted CVR; segments that lagged come second.
  VNAMES = [];
  if (tone === 'up' && LIFTS.length && state.tab === b) { const L2 = LIFTS.slice(0, 2); L2.forEach(f => VNAMES.push(f.m.label)); s += L2.map((f, k) => segLink(f, k > 0, 'b', cellsFor(m, d, comps).sess)).join(' and ') + (calm ? ' did best' : ' lifted it most') + (names.length && !calm ? ', but ' : '. '); }
  if (calm && !names.length && !(tone === 'up' && LIFTS.length)) s += 'No device, region, channel or funnel step is outside its normal range. ';
  if (!names.length && tone === 'down' && !calm) s += 'It is broad-based: no device, region, channel or funnel step stands out from the rest. ';
  // Say how each one stood out: its drop next to its peers', e.g. "Organic Search (−47% vs −21% for other channels)".
  const tot = cellsFor(m, d, comps).sess || 1;
  names.forEach(f => VNAMES.push(f.m.label));
  const midNames = tone === 'up' && LIFTS.length && state.tab === b;
  // Within the normal range nothing "held it back" (Mike, Oct 27): say a segment lagged its peers, and what kept CVR steady.
  if (calm && names.length) { const up2 = (LIFTS || []).filter(f => VNAMES.indexOf(f.m.label) < 0 && names.every(n => n.m.key !== f.m.key)).slice(0, 1);
    // Say how far, against what (Mike, Oct 27: the short version felt thin): "Paid Search (cpc) fell 16% while other channels rose 10%".
    const mv = (f, k) => { const r = f.rest, pw = r == null ? '' : Math.abs(r) < 0.01 ? ' while ' + peerLink(f) + ' held flat' + onAvg(f.peers) : ' while ' + peerLink(f) + (r > 0 ? ' rose ' : ' fell ') + Math.round(Math.abs(r) * 100) + '%' + onAvg(f.peers);
      return segLink(f, k > 0 || midNames, 'w', tot) + ' fell ' + Math.round(Math.abs(f.c.mom) * 100) + '%' + (k === 0 ? pw : ''); };
    s += names.map(mv).join(', and ') + (up2.length ? ', but ' + segLink(up2[0], true, 'b', tot) + ' kept it afloat. ' : '. '); }
  else if (names.length) s += names.map((f, k) => segLink(f, midNames || k > 0, 'w', tot)).join(' and ') + (tone === 'up' ? ' held it back. ' : ' pulled it down most. ');
  // The other site's read stays out of the headline (Mike, Oct 22): it lives in the scorecard's "Seen on" column.
  return s;
}
function cmpControls(b, d) {
  const def = compsDefault(b, d).mom, cu = state.cust[b], st = infoNow(b, d);
  const why = def && def.pk ? 'This uses the ' + def.n + ' earlier ' + POSN[def.pk] + 's in the ' + ((parse(d) - parse(def.from)) / DAY > 35 ? 'nine' : 'five') + ' weeks before ' + short(d) + ' (' + spanOf(def) + '). Sale days are only averaged with the same point in other sales.' : def ? 'Last month\'s average uses the ' + def.n + ' ' + (st.sale ? 'sale' : 'non-sale') + ' days in the 4 weeks before ' + short(d) + ' (' + spanOf(def) + '). Same sale status, so a sale day is never averaged against normal days.' : 'Too few matching days in the 4 weeks before for a fair average.';
  let h = '<div class="cmpbar"><span>Comparing with <b>' + (cu ? 'your range</b> (' + range(cu.from, cu.to) + ')' : 'the prior day</b> (' + dmy(addDays(d, -1)) + ')') + ', <b>comparable days</b>' + (b === 'tp' ? ' and <b>last year</b>' : '') + '.</span>' +
    (cu ? '<button class="linkbtn" id="cmpreset">Back to the prior day</button>' : '') + '</div>';
  if (state.cmpEdit) h += '<div class="cmpedit"><label>Average of <input type="date" class="pick" id="cfrom" min="' + SER[b].dates[0] + '" max="' + D.asOf + '" value="' + (cu ? cu.from : def ? def.from : addDays(d, -28)) + '"></label><label>to <input type="date" class="pick" id="cto" min="' + SER[b].dates[0] + '" max="' + D.asOf + '" value="' + (cu ? cu.to : def ? def.to : addDays(d, -1)) + '"></label><button class="btn pri" id="cmpapply">Compare</button><p class="cap">' + why + ' Pick one day or a range to compare ' + short(d) + ' against instead. Custom ranges use every day in the range and are not graded red or green.</p></div>';
  return h;
}
// Always at least 2 comparison days (Mike, Oct 30). When too few same-kind days exist, top up with the most recent day of the same kind
// from the same part of the week (Mon to Thu, Friday, or the weekend), then older ones, so one odd day never sets the baseline alone.
const wkGrp = x => { const w = dow(x); return w >= 1 && w <= 4 ? 'wk' : w === 5 ? 'fri' : 'we'; }, WKGN = { wk: 'midweek day', fri: 'Friday', we: 'weekend day' };
const BDC = {};
// When the rule had to stretch to reach 2 days, say so plainly (Mike, Oct 30: "just note that").
const stretchNote = (b, d, bd) => { if (!bd || !bd.topped) return ''; const st = infoNow(b, d), e = st.sale ? null : edgeOf(b, d);
  return ' ⚠️ Rule stretched: ' + (st.sale ? 'too few recent sales at this point, so an older one was added.' : e !== 'plain' ? 'too few recent ' + EDGEN[e].replace('day', 'days') + ', so an older one was added.' : 'too few recent ' + WDL[dow(d)] + 's with no sale, so the nearest ' + WKGN[wkGrp(d)] + ' was added (' + bd.filter(x => dow(x) !== dow(d)).map(x => short(x) + ', a ' + WDL[dow(x)]).join('; ') + ').'); };
function baseDays(b, d) {
  const key = b + '|' + d + '|' + BASE_START; if (key in BDC) return BDC[key];
  const out = baseDays0(b, d); if (out.length >= 2) return (BDC[key] = out);
  const st = infoNow(b, d), pk = posKey(st), e = st.sale ? null : edgeOf(b, d), S = SER[b];
  const loose = x => { if (x === d || isContam(b, x) || out.indexOf(x) >= 0) return false; const i = infoNow(b, x); if (st.sale) return i.sale && posKey(i) === pk; if (i.sale) return false; return e === 'plain' ? edgeOf(b, x) === 'plain' && wkGrp(x) === wkGrp(d) : edgeOf(b, x) === e; };
  const add = []; for (let x = addDays(d, -1); x >= S.dates[0] && out.length + add.length < 2; x = addDays(x, -1)) if (loose(x)) add.push(x);
  if (!add.length) return (BDC[key] = out);
  const res = out.concat(add).sort(); res.tierMix = out.tierMix; res.near = out.near; res.topped = true;
  return (BDC[key] = res);
}
function baseDays0(b, d) {
  const st = infoNow(b, d), pk = posKey(st), wd = new Date(d + 'T12:00:00Z').getUTCDay();
  // Same discount tier first; if no such day exists, the same position at any tier, flagged.
  for (const strict of [true, false]) {
    const out = [];
    for (let x = BASE_START; x < d; x = addDays(x, 1)) {
      if (isContam(b, x)) continue;
      const i = infoNow(b, x);
      if (st.sale ? posKey(i) === pk && (!strict || sameTier(b, d, x)) : !i.sale && sameKind(b, d, x)) out.push(x);
    }
    if (out.length) { out.tierMix = !strict; return out; }
  }
  // Nothing since BASE_START (a day before the baseline starts, e.g. Sep 12 under Maximum): use the nearest matching days instead,
  // up to 4, looking back first and then forward, so the column is never empty (Mike, Oct 26).
  const S = SER[b], ok = (x, strict) => { if (x === d || isContam(b, x)) return false; const i = infoNow(b, x); return st.sale ? posKey(i) === pk && (!strict || sameTier(b, d, x)) : !i.sale && sameKind(b, d, x); };
  for (const strict of [true, false]) {
    let out = [];
    for (let x = addDays(d, -1); x >= S.dates[0] && out.length < 4; x = addDays(x, -1)) if (ok(x, strict)) out.unshift(x);
    if (!out.length) for (let x = addDays(d, 1); x <= S.dates[S.dates.length - 1] && out.length < 4; x = addDays(x, 1)) if (ok(x, strict)) out.push(x);
    if (out.length) { out.tierMix = !strict; out.near = true; return out; }
    if (!st.sale) break;
  }
  return [];
}
// How a baseline's days were picked, for hovers: since the baseline start, or the nearest matching days when none came before.
const bsWhen = ds => ds && ds.near ? ' nearest this day (none since ' + short(BASE_START) + ' came before it)' : ' since ' + short(BASE_START);
// Prior day: always the calendar day before. When it was a different kind of day, say so, because that explains most of a big swing.
function ctxLabel() { return 'Context:'; }
function priorCtx(b, d) {
  // Short and plain: what changed from the day before.
  const pd = addDays(d, -1), st = infoNow(b, d), si = infoNow(b, pd), t = tierOf(b, d), tp = tierOf(b, pd);
  if (isContam(b, pd)) return 'The day before was in the price test week.';
  if (st.sale && !si.sale) return 'First day of the sale; the day before had none.';
  if (!st.sale && si.sale) return 'First day after the sale ended.';
  if (st.sale && si.sale && t && tp && t !== tp) return 'Discount went from up to ' + tp + '% to up to ' + t + '%.';
  return '';
}
// AOV = revenue / orders (ORD, Amplitude order_completed totals). "avg" is the same recent-comparable days the CVR comparison uses.
const aovAt = (b, i) => typeof ORD !== 'undefined' && ORD[b] && ORD[b][i] ? R[b][i] / ORD[b][i] : null;
function aovRow(b, d) {
  const S = SER[b], i = S.idx[d], v = i == null ? null : aovAt(b, i); if (v == null) return '';
  const bd = baseDays(b, d).map(x => S.idx[x]).filter(j => j != null && ORD[b][j]);
  const avg = bd.length ? bd.reduce((t, j) => t + R[b][j], 0) / bd.reduce((t, j) => t + ORD[b][j], 0) : null;
  return '<span class="krow aovrow"><b>AOV</b> <span class="kpair">$' + v.toFixed(2) + (avg ? ' <span class="aovavg">(avg $' + avg.toFixed(2) + ')</span>' : '') + '</span></span>';
}
// The day's leading comparison: comparable days (last year only when there's no baseline).
function leadOf(b, d) {
  const m = metricsFor(b).overall[0], B = baseOf(b, d, m);
  return B.c.mom != null ? B.c.mom : b === 'tp' ? cellsFor(m, d, compsFor(b, d)).yoy : null;
}
const baseOf = (b, d, m) => { const bd = baseDays(b, d); return { bd, c: cellsFor(m, d, { mom: bd.length ? { dates: bd } : null }) }; };
const priorOf = (b, d, m) => cellsFor(m, d, { mom: SER.tp.idx[addDays(d, -1)] !== undefined ? { dates: [addDays(d, -1)] } : null });
function baseModal(b) {
  const d = state.day, st = infoNow(b, d), bd = baseDays(b, d), m = metricsFor(b).overall[0], I = SER.tp.idx, sm = metricsFor(b).overall[1];
  const what = st.sale ? 'the same point in earlier sales (' + POSN[posKey(st)] + 's)' : 'the same weekday on non-sale days';
  const rows = bd.slice().reverse().map(x => '<tr><td class="l">' + dmy(x) + '</td><td>' + pct(m.v[I[x]]) + '</td><td>' + (sm && sm.v[I[x]] != null ? int(sm.v[I[x]]) : '–') + '</td></tr>').join('');
  openModal('<div class="mhead"><span class="lbl">vs comparable days</span><h3 id="mtitle">The days in this average</h3></div><p class="mtext">' + short(d) + ' is compared with ' + (bd.near ? 'the nearest days that match it, since no matching day since ' + short(BASE_START) + ' came before it: ' : 'the average of every day since ' + short(BASE_START) + ' that matches it: ') + what + '. ' + (st.sale && tierOf(b, d) ? (bd.tierMix ? 'No earlier matching day was in a ' + tierOf(b, d) + '% off sale, so these are at a different discount. ' : 'Only days at the same discount (' + tierOf(b, d) + '% off sales) count. ') : '') + 'Price test and bot spike days are left out.</p>' +
    '<table class="thr"><thead><tr><th class="l">Day</th><th>CVR</th><th>Sessions</th></tr></thead><tbody>' + rows + '</tbody></table>');
}
function topHtml(b) {
  const { d } = dayOf(), st = infoNow(b, d), M = metricsFor(b), m = M.overall[0], comps = compsFor(b, d), c = cellsFor(m, d, comps);
  const atStart = d <= LEDGER_START, atEnd = d >= D.asOf;
  const sm = M.overall[1], cs = cellsFor(sm, d, comps), rm = M.overall[2], cr = cellsFor(rm, d, comps);
  // Ticker arrows live only in the ticker; the sign says the direction here (Mike, Oct 26).
  const sd = x => x == null ? '<b class="sd">n/a</b>' : '<b class="sd ' + (x >= 0 ? 'up' : 'down') + '">' + sgn(x) + '</b>';
  // Every card reads the same: label, big number, what it is measured against, then matching Sessions and Revenue rows.
  const line = (lab, x, cur, comp, f) => '<span class="krow"><b>' + lab + '</b> ' + (comp == null ? '<span class="na">n/a</span>' : sd(x) + ' <span class="kpair">' + f(cur) + ' vs ' + f(comp) + '</span>') + '</span>';
  const plain = (lab, v) => '<span class="krow"><b>' + lab + '</b> <span class="kpair">' + v + '</span></span>';
  // Same color as the headline's number: whichever comparison leads (see leadOf).
  const lt = leadOf(b, d), bx = baseOf(b, d, m).c.mom, hr = nrOf(m, bx);
  // Under the number: the change vs comparable days and where it sits in the normal range (Mike, Oct 27).
  // A small panel, not a tag (Mike, Oct 27): the change on top, the range bar, then the verdict, tinted by where the day sits.
  const hb = baseOf(b, d, m), hw = hr ? Math.round(hr.w * 100) : 0, htc = tcls(hr, bx);
  // The range box as before, without its hover (Mike, Oct 28: the chart beside it already does that; the redesign was reverted).
  // Name the days it's compared with (Mike, Oct 28): "compared with the 3 most recent second-to-last sale days".
  const cst = infoNow(b, d), cpk = cst.sale ? posKey(cst) : null, cn = (hb.bd || []).length;
  const ckind = !cn ? 'comparable days' : 'the ' + (cn > 1 ? cn + ' ' : '') + 'most recent ' + (cst.sale ? (cpk && POSN[cpk] ? POSN[cpk] : 'sale day') + (cn > 1 ? 's' : '') : noSaleKind(b, d, cn));
  const nrRow = hr ? '<span class="nrpanel nr' + hr.st + '"><span class="nrp2">' + (hr.st === 'in' ? '<b>Within normal range:</b> compared with ' + ckind + ', and within the normal ±' + hw + '% swing' : hr.st === 'hi' ? '<b>Above normal range:</b> compared with ' + ckind + ', more than the normal ±' + hw + '% swing' : '<b>Below normal range:</b> compared with ' + ckind + ', more than the normal ±' + hw + '% swing') + '</span><span class="nrp1"><b class="t' + htc + '">' + sgn(bx, 0) + '</b> vs comparable days</span>' + nrBarH(bx, hr.w) + '</span>' : '';
  let keys = '<div class="key hero' + (hr ? (htc === 'hi' ? ' kup' : htc === 'lo' ? ' kdn' : ' kin') : lt == null || yoyBot(lt) ? '' : lt > 0 ? ' kup' : lt < 0 ? ' kdn' : '') + '"><span class="lbl">Conversion rate <span class="lbld">' + label(d) + ' · ' + lcx(st.label) + '</span></span><span class="big">' + hint(pct(c.val), 'kbig', cmpTip(b, d, 'hero', 'cvr')) + '</span>' + nrRow + '@@SR@@' + aovRow(b, d) + '</div>';
  const comp = k => {
    if (k === 'yoy' && b === 'rb') return '<div class="key"><span class="lbl">vs last year</span><span class="big na-big">Not yet</span><span class="sub">RBO data in Amplitude starts July 2026.</span></div>';
    const cmp = comps[k], x = c[k], v = cv(c, k);
    const lbl = k === 'mom' && c.custom ? 'vs your range' : k === 'yoy' ? hint('vs last year', 'soft', '<b>' + esc(ucf(kname('yoy', comps))) + '</b><br>' + (cmp && cmp.dates ? 'The average of ' + cmp.n + ' matching days: ' + cmp.dates.map(x => short(x)).join(', ') + ', 2025.' : 'The same weekday last year.')) : kcol(k, comps);
    const yj = k === 'yoy' && x != null ? judge(m, 'yoy', x, st.sale) : null;
    return '<div class="key' + (yj && yj.mat ? ' g' + yj.mat : '') + '"><span class="lbl">' + lbl + '</span><span class="big">' + (x == null ? '<span class="na-big">n/a</span>' : k === 'yoy' ? hint(sgn(x), 'kbig', cmpTip(b, d, 'yoy', 'cvr')) : sgn(x)) + '</span>' +
      '<span class="sub kvs">' + (v == null ? naCell(m, d, k, comps) : (k === 'yoy' ? hint('vs ' + pct(v), 'kvh" data-why="yoy', '<b>vs ' + pct(v) + ': last year</b><ul class="hul nrul"><li>📏 <b>What it is:</b> ' + (cmp && cmp.dates ? 'the average of ' + cmp.n + ' matching days last year' : 'the same day last year') + '</li>' + (cmp && cmp.dates ? '<li>📅 <b>The days:</b> ' + cmp.dates.map(x => short(x)).join(', ') + '</li>' : '') + '</ul><span class="segmore">Click for details →</span>') + '<button hidden>' : 'vs ' + pct(v) + ' · <button class="linkbtn" data-why="' + k + '">') + (k === 'yoy' ? '' : k === 'wow' || (cmp && cmp.custom) ? cmpLabel(cmp, k) : 'What\'s this?') + '</button>' + (cmp && cmp.tierMix ? ' · <span class="na" title="No earlier matching day at the same discount, so this one is at a different discount">different discount</span>' : '')) + '</span>' +
      // Maximum's audience shrank sharply from Sep 22, and last year's visitors scored differently, so its YoY is a loose read (Mike, Oct 26).
      (k === 'yoy' && yoyBot(x) ? '<span class="sub ymax">' + hint('<span class="ybot">🤖 Likely bots</span>', 'soft ybh2', YOYBOT_TIP) + '</span>' : k === 'yoy' && state.botf === 'max' && x != null ? '<span class="sub ymax">' + hint('Read loosely under Maximum', 'soft', YOYMAX) + '</span>' : '') +
      line('Sessions', cs[k === 'yoy' ? 'yoy' : k], cs.val, cv(cs, k), int) + line('Revenue', cr[k], cr.val, cv(cr, k), usd) + '</div>';
  };
  // Baseline card: the day vs the average of matching days since BASE_START (same sale position, or same weekday on normal days).
  const bd = baseDays(b, d), bc = { mom: bd.length ? { dates: bd } : null }, c2 = cellsFor(m, d, bc), cs2 = cellsFor(sm, d, bc), cr2 = cellsFor(rm, d, bc);
  const what = st.sale ? POSL[posKey(st)].replace('day 1', 'sale day 1') + 's' : new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }) + 's';
  const br = nrOf(m, c2.mom);
  const base = '<div class="key' + (br ? ' nr' + tcls(br, c2.mom) : '') + '"><span class="lbl">vs comparable days</span><span class="big">' + (c2.mom == null ? '<span class="na-big">n/a</span>' : hint(sgn(c2.mom), 'kbig', cmpTip(b, d, 'bs', 'cvr'))) + '</span>' +
    '<span class="sub kvs">' + (c2.momV == null ? 'No matching days since ' + short(BASE_START) : /* No "N matching days" link: the comparison number explains itself on hover, in short bullets (Mike, Oct 27). */
      hint('vs ' + pct(c2.momV), 'kvh" data-basewhy="' + b, br && c2.mom != null ? nrTip(m, c2.mom, c2.momV, c2.val, bd).replace(/<\/div>$/, '<span class="segmore">Click to see each day →</span></div>') /* same card as the headline's baseline hover; a days table was tried and read worse (Mike, Oct 28) */ : '<b>vs ' + pct(c2.momV) + ': comparable days</b><ul class="hul nrul"><li>📏 <b>What it is:</b> the average CVR of ' + bd.length + ' days like this one</li><li>🎯 <b>Like this one:</b> ' + esc(st.sale ? 'the same point in a sale' + (tierOf(b, d) && !bd.tierMix ? ', at up to ' + tierOf(b, d) + '% off' : '') : 'the same weekday, with no sale') + '</li><li>📅 <b>The days:</b> ' + bd.map(x => short(x)).join(', ') + '</li></ul><span class="segmore">Click to see each day →</span>') + (bd.tierMix ? ' · <span class="na" title="No earlier matching day at the same discount, so these are at a different discount">different discount</span>' : '')) + '</span>' +
    line('Sessions', cs2.mom, cs2.val, cs2.momV, int) + line('Revenue', cr2.mom, cr2.val, cr2.momV, usd) + '</div>';
  const pd = addDays(d, -1), p1 = priorOf(b, d, m), ps = priorOf(b, d, sm), pr = priorOf(b, d, rm), ctx = priorCtx(b, d);
  const prior = '<div class="key kctx"><span class="lbl">vs prior day <span class="ctxtag" title="The day before is context: a day next to a sale start or end swings by design, so it is never graded">context only</span></span><span class="big">' + (p1.mom == null ? '<span class="na-big">n/a</span>' : hint(sgn(p1.mom), 'kbig', cmpTip(b, d, 'pd', 'cvr'))) + '</span>' +
    '<span class="sub kvs">' + (p1.momV == null ? 'No data for ' + short(pd) : 'vs ' + pct(p1.momV) + ' · ' + dmy(pd)) + '</span>' + (ctx ? '<span class="sub ctx"><b>' + ctxLabel(b, d, p1.mom) + '</b> ' + ctx + '</span>' : '') +
    line('Sessions', ps.mom, ps.val, ps.momV, int) + line('Revenue', pr.mom, pr.val, pr.momV, usd) + '</div>';
  // Quiet compare: one muted line per card with the other site's number, behind a small toggle (Mike, Oct 25).
  // The other site's number is the first row in every card, so the two sites read side by side (Mike, Oct 25).
  const ob = BR[b].other, om = metricsFor(ob).overall[0], ocm = compsFor(ob, d), oc = cellsFor(om, d, ocm), kon = oc.val != null;
  // No color dot and no ticker arrows here: the sign and green/red already say it (Mike, Oct 26).
  const onm = '<b class="kob">' + BR[ob].name + '</b>', sdx = x => '<b class="sd ' + (x > 0 ? 'up' : x < 0 ? 'down' : '') + '">' + sgn(x) + '</b>';
  const kadd = (h, row) => { if (!kon || !row) return h; const at = h.indexOf('<span class="krow'); return at < 0 ? h.slice(0, -6) + row + '</div>' : h.slice(0, at) + row + h.slice(at); };
  // The other site reads as a plain sentence, "TeePublic was −4% vs its own comparable days", with the numbers on hover (Mike, Oct 27: "6.16% vs 6.43%" read as noise).
  const orow = (x, cur, cmp, nr, what) => { if (x == null) return '<span class="krow kother">' + onm + ' <span class="na">n/a</span></span>';
    const cls = nr ? { hi: 'up', lo: 'down', in: 'nrin' }[tcls(nr, x)] : '', bot = what === 'last year' && yoyBot(x);
    return '<span class="krow kother">' + hint(onm + ' <span class="kow">was</span> <b class="sd ' + cls + '">' + sgn(x, 0) + '</b> <span class="kow">vs its ' + what + '</span>' + (bot ? ' <span class="ybot">🤖 Likely bots</span>' : ''), 'kohint', '<b>' + BR[ob].name + ' CVR</b><br>' + pct(cur) + ' vs ' + pct(cmp) + ' (its ' + what + ').' + (nr ? '<br>' + ucf(nrWord(nr)) + ' (±' + Math.round(nr.w * 100) + '%).' : '') + (bot ? '<br>Up 30%+ on last year: likely bots.' : '')) + '</span>'; };
  const op = kon ? priorOf(ob, d, om) : {}, obc = kon ? cellsFor(om, d, { mom: { dates: baseDays(ob, d) } }) : {};
  // The CVR card compares the two sites directly, so it carries a change like the other three; neutral, since the sites differ by design.
  // Same order as the other three cards: the other site's name, its change, then its number vs this site's (Mike, Oct 26).
  // Overview card (Allison and Mike, Oct 28: the sentence, the first card and the baseline card said the same thing three times).
  // One wide card: the rate, its range bar, the other site vs its own baseline, sessions and revenue vs comparable days, and the comparison chart on the right.
  // Prior day leaves the top (context only; it's in the scorecard). Last year stays as the one side card.
  keys = keys.replace('@@SR@@', plain('Sessions', int(cs.val)) + line('Revenue', cr2.mom, cr2.val, cr2.momV, usd)); // sessions plain here (Mike, Oct 28)
  keys = kadd(keys, kon ? orow(obc.mom, obc.val, obc.momV, nrOf(om, obc.mom), 'comparable days').replace('<span class="kow">was</span>', '<span class="kow">CVR was</span> <b>' + pct(oc.val) + '</b>,') : '');
  const kop = keys.indexOf('>') + 1, kch = cmpBars(m, bd, c2.momV, htc === 'lo' ? 'bad' : htc === 'hi' ? 'good' : null, hr ? hr.w : 0) || tipChart(m, bd, c2.momV, htc === 'lo' ? 'bad' : htc === 'hi' ? 'good' : null, { band: hr ? hr.w : 0, h: 200, w: 560, dots: true });
  keys = keys.slice(0, kop).replace('class="key hero', 'class="key hero kwide') + '<div class="kleft">' + keys.slice(kop, -6) + '</div>' + (kch ? '<div class="kright"><span class="lbl">Against its comparison days</span><span class="kexp">' + (bd.length ? 'Compared with ' + esc(cmpKind(b, d, bd.length)) + ' (' + bd.map(z => short(z)).join(', ') + '). The band is the normal range around their average.' + stretchNote(b, d, bd) : 'No comparable days yet.') + '</span>' + kch + '</div>' : '') + '</div>' +
    (c.custom ? kadd(comp('mom'), orow(op.mom, op.val, op.momV, null, 'range')) : '') + ''; // no last-year tile on either site: the RB layout reads better, and YoY lives in the H1 and the scorecard (Mike, Oct 28)
  // The day controls live in a small chip at the top right; click it for the full panel (pick a day, edit comparisons, sale calendar).
  const saleTxt = st.sale && tierOf(b, d) ? 'Up to ' + tierOf(b, d) + '% off sale · day ' + st.pos + ' of ' + st.len : st.label;
  const panel = '<div class="dayline"><span class="daynav"><button class="navbtn" id="prev" aria-label="Previous day" ' + (atStart ? 'disabled' : '') + '>‹</button><span class="daytitle">' + label(d) + '</span><button class="navbtn" id="next" aria-label="Next day" ' + (atEnd ? 'disabled' : '') + '>›</button></span>' +
    '<button type="button" class="cmpbtn" id="cmpedit" aria-pressed="' + state.cmpEdit + '"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M10.6 2.6a1.6 1.6 0 0 1 2.3 2.3L5.7 12.1 2.5 13l.9-3.2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="m9.4 3.8 2.3 2.3" stroke="currentColor" stroke-width="1.5"/></svg>' + (state.cmpEdit ? 'Close comparison' : 'Change comparison') + '</button>' +
    '<span class="tag' + (st.sale ? ' sale' : '') + '">' + saleTxt + '</span>' + (isContam(b, d) ? '<span class="tag bad">Price test and bot spike</span>' : '') +
    (atEnd ? '' : '<button class="linkbtn" id="latest">Back to latest</button>') + '<button class="salebtn" id="salecal">📅 Full sale calendar <span aria-hidden="true">→</span></button></div>' + popCal(b, d) + cmpControls(b, d);
  // Bot filter switch, where the old grey badge sat. Each option explains itself on hover (Mike, Oct 26).
  // Hidden until src/datamax.js exists, so the switch never offers a filter with no data behind it.
  // Each option explains itself on hover; the label is plain (Mike, Oct 26).
  // Bot filter: a quiet menu top right, above the date, so it doesn't sit between the sale and the headline (Mike, Oct 28).
  const bfk = state.botf === 'strong' ? 'strong' : 'max';
  const bot = !hasMax() ? '' : '<div class="bfwrap"><span class="bftitle">Bot filter</span><details class="bfdd"><summary><svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M8 1.6 3 3.6v4c0 3 2.1 5.3 5 6.4 2.9-1.1 5-3.4 5-6.4v-4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg><b>' + BOTF[bfk].l + '</b><span class="bfcar" aria-hidden="true">▾</span></summary><div class="bfmenu">' +
    ['max', 'strong'].map(k => '<button type="button" class="bfitem" data-botf="' + k + '" aria-pressed="' + (bfk === k) + '"><b>' + BOTF[k].l + (k === 'max' ? ' <span class="bfdef">default</span>' : '') + '</b><span>' + BOTF_TIP[k](b).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().replace(/^\S+( \(default\))?\s*:\s*/, '').replace(/\bUS\b/g, 'USA').replace(/^Bot score/, 'Cloudflare bot score') + '</span></button>').join('') + '</div></details></div>'; // "Bot filter" as the title, the shield and the choice as the dropdown (Mike, Oct 28)
  const chip = '<div class="dchipw"><button type="button" class="dchip' + (atEnd ? '' : ' past') + '" data-dayopen="1" aria-expanded="' + !!state.dayOpen + '"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="2" y="3" width="12" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M2 6.5h12M5.5 1.8v2.6M10.5 1.8v2.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><b>' + label(d) + '</b><span class="dcar" aria-hidden="true"><svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M10.6 2.6a1.6 1.6 0 0 1 2.3 2.3L5.7 12.1 2.5 13l.9-3.2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="m9.4 3.8 2.3 2.3" stroke="currentColor" stroke-width="1.5"/></svg></span></button><div class="daypop"' + (state.dayOpen ? '' : ' hidden') + '>' + panel + '</div></div>';
  return '<section aria-label="Day under review"><div class="dtop">' + bot + '</div>' +
    '<div class="vsalew vsale2">' + chip + (st.sale ? '<span class="vsale">🏷️ ' + saleTxt + '</span>' : '<span class="vsale off">No sale · regular prices</span>') + '</div>' /* above the headline on the CVR tabs, in the earlier brand-tinted design (Mike, Oct 28) */ + '<p class="verdict">' + (verdictHtml(b), VLEAD) + '</p>' + standupLine(b, d) /* the subhead is back (Mike, Oct 28) */ + movedHtml() + '<div class="keys kov' + (c.custom ? ' kcus' : '') + (!c.custom ? ' ksolo' : '') /* full width on both sites now the last-year tile is gone (Mike, Oct 28) */ + '">' + keys + '</div>' + '</section>';
}
// Small month calendar inside the day pop-over: sale days shaded by discount, so picking a day shows what kind of day it was.
function popCal(b, d) {
  const m0 = state.popMon || d.slice(0, 8) + '01', mo = new Date(parse(m0)).getUTCMonth(), yr = new Date(parse(m0)).getUTCFullYear();
  const run = x => (SALES[b] || []).find(r => x >= r[0] && x <= r[1]);
  const tier = o => o ? (/40/.test(o[2]) ? 't40' : /35/.test(o[2]) ? 't35' : 'tsale') : 'tsale';
  const pm = addDays(m0, -1).slice(0, 8) + '01', nm = addDays(m0, 32).slice(0, 8) + '01';
  let h = '<div class="popcal cal-' + b + '"><div class="pchead"><button type="button" class="navbtn" data-popmon="' + pm + '" aria-label="Previous month"' + (pm < LEDGER_START.slice(0, 8) + '01' ? ' disabled' : '') + '>‹</button><b>' + MON[mo] + ' ' + yr + '</b><button type="button" class="navbtn" data-popmon="' + nm + '" aria-label="Next month"' + (nm > D.asOf ? ' disabled' : '') + '>›</button></div><div class="calg">' + WD.map(w => '<span class="calh">' + w[0] + '</span>').join('') + '<span></span>'.repeat(dow(m0));
  for (let x = m0; new Date(parse(x)).getUTCMonth() === mo; x = addDays(x, 1)) {
    const r = run(x), o = offerOn(b, x), pct = o ? (o[2].match(/\d+%/) || [''])[0] : '', off = x > D.asOf || x < LEDGER_START || SER.tp.idx[x] === undefined;
    h += '<button type="button" data-popday="' + x + '" class="cald2' + (r ? ' on ' + tier(o) : '') + (x === d ? ' sel' : '') + (x === D.asOf ? ' today' : '') + (off ? ' fut' : '') + '"' + (off ? ' disabled' : '') + ' aria-label="' + label(x) + (r ? ', sale' + (pct ? ' ' + pct + ' off' : '') : '') + '"><span>' + new Date(parse(x)).getUTCDate() + '</span>' + (pct ? '<small>' + pct.replace('%', '') + '</small>' : '') + '</button>';
  }
  return h + '</div><div class="pckey"><span><i class="sw cal40"></i>40% off sale</span><span><i class="sw cal35"></i>35% off sale</span><span><i class="sw calsale"></i>Sale, offer not logged</span></div></div>';
}
/* ---------- sale calendar ---------- */
// Offer details by day, from the #promotions calendar (sale-calendar.md). [start, end, discount, featured deal]
const OFFERS = {
  tp: [['2026-08-19', '2026-08-23', 'Up to 40% off', ''], ['2026-08-27', '2026-08-28', 'Up to 35% off', '$8 off Vintage Tees'], ['2026-08-29', '2026-08-30', 'Up to 40% off', '$6 off Extra Soft Tees'],
    ['2026-09-03', '2026-09-07', 'Up to 40% off', 'Sep 5 and 6 may have been 35%'], ['2026-09-15', '2026-09-17', 'Up to 40% off', '$6 off Extra Soft Tees'], ['2026-09-18', '2026-09-19', 'Up to 35% off', '$10 off Hoodies'], ['2026-09-20', '2026-09-20', 'Up to 40% off', '$8 off Vintage Tees'],
    ['2026-09-25', '2026-09-27', 'Up to 40% off', '$16 Tees, $8 off Crewnecks'], ['2026-09-30', '2026-10-01', 'Up to 40% off', '$8 off Vintage Tees'], ['2026-10-02', '2026-10-03', 'Up to 35% off', '$8 off Streetwear Tees'], ['2026-10-04', '2026-10-04', 'Up to 40% off', '$5 off Mugs'],
    ['2026-10-13', '2026-10-14', 'Up to 40% off', '$8 off Baseball Tees'], ['2026-10-15', '2026-10-16', 'Up to 35% off', '$10 off Kids Hoodies'], ['2026-10-17', '2026-10-18', 'Up to 40% off', '$6 off Extra Soft Tees'],
    ['2026-10-21', '2026-10-21', 'Up to 40% off', '$10 off Hoodies'], ['2026-10-22', '2026-10-23', 'Up to 35% off', '$8 off Hats'], ['2026-10-24', '2026-10-25', 'Up to 40% off', '$10 off Hoodies'], ['2026-11-01', '2026-11-03', 'Up to 40% off', '$16 Tees, $8 off Crewnecks'], ['2026-11-04', '2026-11-05', 'Up to 35% off', '$16 Tees, $8 off Hats'], ['2026-11-06', '2026-11-07', 'Up to 40% off', '$16 Tees, $8 off Vintage Tees'], ['2026-11-08', '2026-11-09', 'Up to 35% off', '$16 Tees, $6 off Mugs'], ['2026-11-10', '2026-11-12', 'Up to 40% off', '$16 Tees, $6 off Extra Soft Tees'], ['2026-11-13', '2026-11-14', 'Up to 35% off', '$16 Tees, $6 off Crossbody Bags'], ['2026-11-15', '2026-11-16', 'Up to 40% off', '$16 Tees, $10 off Hoodies'], ['2026-11-17', '2026-11-19', 'Up to 35% off', '$16 Tees, $7 off Kids Tees'], ['2026-11-20', '2026-11-21', 'Up to 40% off', '$16 Tees, $7 off Socks'], ['2026-11-22', '2026-11-23', 'Up to 35% off', '$16 Tees, $7 off Phone Cases'], ['2026-11-24', '2026-11-26', 'Up to 40% off', 'Cyber: $15 Tees, $6 off Mugs'], ['2026-11-27', '2026-11-30', 'Up to 40% off', 'Cyber: $15 Tees'], ['2026-12-01', '2026-12-19', 'Holiday sale', 'Planned: December offers to be posted next week']],
  rb: [['2026-09-23', '2026-09-28', 'Up to 40% off', ''], ['2026-10-04', '2026-10-11', 'Up to 40% off', 'Plus 25% off 1 to 3 stickers (test)'], ['2026-10-21', '2026-10-26', 'Up to 40% off', ''], ['2026-11-02', '2026-11-08', 'Up to 50% off', '30% off Tees'], ['2026-11-09', '2026-11-15', 'Up to 50% off', '30% off Posters'], ['2026-11-16', '2026-11-21', 'Up to 50% off', '30% off select Phone Cases'], ['2026-11-22', '2026-12-01', 'Up to 60% off', 'Cyber: 35% off Tees, plus flash deals'], ['2026-12-02', '2026-12-02', 'Up to 50% off', 'Planned; Dec 2 tier still being confirmed'], ['2026-12-03', '2026-12-20', 'Up to 55% off', 'Planned']]
};
const offerOn = (b, d) => (OFFERS[b] || []).find(o => d >= o[0] && d <= o[1]);
function saleCalModal() {
  const b = state.calSite || (state.tab === 'rb' ? 'rb' : 'tp'), sel = state.calDay || state.day, months = ['2026-08-01', '2026-09-01', '2026-10-01', '2026-11-01'];
  state.calSite = b;
  const run = d => (SALES[b] || []).find(r => d >= r[0] && d <= r[1]);
  const tier = o => o ? (/40/.test(o[2]) ? 't40' : /35/.test(o[2]) ? 't35' : 'tsale') : 'tsale';
  const cal = m0 => {
    const dt = new Date(parse(m0)), mo = dt.getUTCMonth(); let h = '<div class="calm"><b>' + MON[mo] + '</b><div class="calg">' + WD.map(w => '<span class="calh">' + w[0] + '</span>').join('') + '<span></span>'.repeat(dow(m0));
    for (let x = m0; new Date(parse(x)).getUTCMonth() === mo; x = addDays(x, 1)) {
      const r = run(x), o = offerOn(b, x), pct = o ? (o[2].match(/\d+%/) || [''])[0] : '';
      h += '<button type="button" data-calday="' + x + '" class="cald2' + (r ? ' on ' + tier(o) : '') + (x === sel ? ' sel' : '') + (x === D.asOf ? ' today' : '') + (x > D.asOf ? ' fut' : '') + '" aria-label="' + label(x) + (r ? ', sale' + (pct ? ' ' + pct : '') : '') + '"><span>' + new Date(parse(x)).getUTCDate() + '</span>' + (pct ? '<small>' + pct.replace('%', '') + '</small>' : '') + '</button>';
    }
    return h + '</div></div>';
  };
  const r = run(sel), o = offerOn(b, sel), pos = r ? Math.round((parse(sel) - parse(r[0])) / DAY) + 1 : 0, len = r ? Math.round((parse(r[1]) - parse(r[0])) / DAY) + 1 : 0;
  const next = (SALES[b] || []).find(x => x[0] > D.asOf), cur = run(D.asOf);
  const detail = '<div class="caldet ' + (r ? 'on' : '') + '"><span class="cdk">' + dlong(sel) + '</span>' + (r ? '<b>' + (o ? esc(o[2]) : 'Sale day') + '</b><span>Day ' + pos + ' of ' + len + ' · ' + range(r[0], r[1]) + '</span>' + (o && o[3] ? '<span class="cdx">⭐ ' + esc(o[3]) + '</span>' : '') + (!o ? '<span class="cap">Offer details were not logged for this sale.</span>' : '') : '<b>No sale</b><span class="cap">Regular prices on ' + BR[b].name + '.</span>') + '</div>';
  const glance = '<div class="calgl"><div><span class="lbl">Today</span><b>' + (cur ? (offerOn(b, D.asOf) ? esc(offerOn(b, D.asOf)[2]) : 'Sale on') + '</b><span class="cap">day ' + (Math.round((parse(D.asOf) - parse(cur[0])) / DAY) + 1) + ' of ' + (Math.round((parse(cur[1]) - parse(cur[0])) / DAY) + 1) + ', ends ' + short(cur[1]) : 'No sale</b><span class="cap">regular prices') + '</span></div><div><span class="lbl">Next sale</span><b>' + (next ? range(next[0], next[1]) : 'Not on the calendar yet') + '</b>' + (next && offerOn(b, next[0]) ? '<span class="cap">' + esc(offerOn(b, next[0])[2]) + '</span>' : '') + '</div></div>';
  const seg = '<div class="fseg calseg">' + [['rb', 'Redbubble'], ['tp', 'TeePublic']].map(x => '<button type="button" data-calsite="' + x[0] + '" aria-pressed="' + (b === x[0]) + '"><i style="background:var(--' + x[0] + ')"></i>' + x[1] + '</button>').join('') + '</div>';
  openModal('<div class="mhead calhead"><div><span class="lbl">From the #promotions calendar</span><h3 id="mtitle">📅 Sale calendar</h3></div>' + seg + '</div>' + glance +
    '<div class="calwrap cal-' + b + '"><div class="cals">' + months.map(cal).join('') + '</div>' + detail + '</div>' +
    '<div class="legend cal-' + b + '"><span><i class="sw blk cal40"></i>Up to 40% off</span><span><i class="sw blk cal35"></i>Up to 35% off</span><span><i class="sw blk calsale"></i>Sale, offer not logged</span><span class="cap">Click any day for details</span></div>');
}
/* Siblings: a move only means something next to the other devices, regions or channels on the same comparison. */
const SIBN = { device: ['device', 'devices'], geo: ['region', 'regions'], channel: ['channel', 'channels'], funnel: ['step', 'funnel steps'] };
// Several peers are a blend, so say "on average" (Mike, Oct 28).
const onAvg = p => /^other /i.test(p || '') ? ' on average' : '';
function sibsOf(m, d) {
  if (!SIBN[m.sec]) return null;
  const comps = compsFor(m.b, d), all = metricsFor(m.b)[m.sec].map(x => { const c = cellsFor(x, d, comps); return { m: x, mom: c.bs, sess: c.sess || 0 }; }).filter(x => x.mom != null);
  const me = all.find(x => x.m.key === m.key), rest = all.filter(x => x.m.key !== m.key);
  if (!me || !rest.length) return null;
  const w = sum(rest.map(x => x.sess)), restMom = w ? sum(rest.map(x => x.mom * x.sess)) / w : sum(rest.map(x => x.mom)) / rest.length;
  return { all, me, rest, restMom, gap: me.mom - restMom, n: SIBN[m.sec] };
}
function sibChip(m, d) {
  const x = sibsOf(m, d); if (!x) return '';
  return '<span class="mvs">' + (x.rest.length === 1 ? esc(x.rest[0].m.label) : 'Other ' + x.n[1]) + ' ' + sgn(x.rest.length === 1 ? x.rest[0].mom : x.restMom, 0) + '</span>';
}
function sibHtml(m, d) {
  d = d || dayOf().d; const x = sibsOf(m, d); if (!x) return '';
  const who = x.rest.length === 1 ? esc(x.rest[0].m.label) : 'the other ' + x.n[1], lead = esc(m.label) + ' is ' + upDown(x.me.mom) + ' vs comparable days; ' + who + (x.rest.length === 1 ? ' is ' : ' are ') + upDown(x.restMom) + (x.rest.length === 1 ? '' : ' together') + '.';
  if (m.sec === 'funnel') {
    const ov = cellsFor(metricsFor(m.b).overall[0], d, compsFor(m.b, d)).bs, worst = x.all.slice().sort((a, z) => a.mom - z.mom)[0];
    const fl = esc(m.label) + ' is ' + upDown(x.me.mom) + ' vs comparable days' + (ov != null ? ', while overall CVR is ' + upDown(ov) : '') + '.' + (Math.max(...x.all.map(y => y.mom)) - worst.mom < 0.04 ? ' Every step is down by about the same amount, and the steps compound into the bigger CVR drop. So no single step is broken: fewer shoppers are moving forward at every stage.' : worst.m.key === m.key ? ' This is the weakest step in the funnel, so it explains the largest share of the CVR drop.' : ' The weakest step is ' + esc(worst.m.label) + ' (' + sgn(worst.mom, 0) + '), so look there first.');
    const mx2 = Math.max(...x.all.map(y => Math.abs(y.mom)), Math.abs(ov || 0), 0.01), bar = (lab, v, me) => '<div class="sbrow' + (me ? ' me' : '') + '"><span class="sbl">' + lab + '</span><span class="sbt"><i class="' + (v < 0 ? 'neg' : 'pos') + '" style="width:' + Math.round(Math.abs(v) / mx2 * 50) + '%"></i></span><span class="sbv">' + sgn(v, Math.abs(v) < 0.01 ? 1 : 0) + '</span></div>';
    return '<div class="sibs"><span class="lbl">Where in the funnel (vs comparable days)</span><p>' + fl + '</p><div class="sbars">' + (ov != null ? bar('Overall CVR', ov, false) : '') + x.all.map(y => bar(esc(y.m.label), y.mom, y.m.key === m.key)).join('') + '</div></div>';
  }
  const read = Math.abs(x.gap) < 0.05 ? ' Close enough that this looks site-wide, not specific to ' + esc(m.label) + '.' : x.gap < 0 ? ' That is ' + Math.round(-x.gap * 100) + ' points worse, so it is specific to ' + esc(m.label) + '.' : ' ' + esc(m.label) + ' is holding up better than the rest.';
  const mx = Math.max(...x.all.map(y => Math.abs(y.mom)), 0.01);
  const bars = x.all.slice().sort((a, z) => a.mom - z.mom).map(y => '<div class="sbrow' + (y.m.key === m.key ? ' me' : '') + '"><span class="sbl">' + esc(y.m.label) + '</span><span class="sbt"><i class="' + (y.mom < 0 ? 'neg' : 'pos') + '" style="width:' + Math.round(Math.abs(y.mom) / mx * 50) + '%"></i></span><span class="sbv">' + sgn(y.mom, Math.abs(y.mom) < 0.01 ? 1 : 0) + '</span></div>').join('');
  return '<div class="sibs"><span class="lbl">Next to the other ' + x.n[1] + ' (vs comparable days)</span><p>' + lead + read + '</p><div class="sbars">' + bars + '</div></div>';
}
// Weight = how far below usual × share of traffic it carries (funnel steps touch everyone). Shared by What moved and the headline.
const rankTot = () => MOVED.length ? (cellsFor(metricsFor(MOVED[0].m.b).overall[0], state.day, compsFor(MOVED[0].m.b, state.day)).sess || 1) : 1;
function rankMoved() {
  const tot = rankTot(), wt = f => Math.max(0, -(f.jm ? f.jm.dlt : f.c.mom || 0)) * (f.m.sec === 'funnel' ? 1 : Math.min(1, (f.c.sess || 0) / tot));
  return MOVED.slice(0, 8).map((f, i) => ({ f, i, w: wt(f) })).sort((a, z) => z.w - a.w);
}
function movedHtml() {
  let h = movedHtml0(); if (state.view === 'daily') return h; // flagged pills come back ready: 3 plus "View N more" (Mike, Oct 28)
  const all0 = h.match(/<button class="mv[^"]*"[\s\S]*?<\/button>/g) || [];
  const rank = p => { const i = VNAMES.findIndex(n => p.indexOf('<b>' + esc(n) + '</b>') >= 0); return i < 0 ? 99 : i; };
  const all = all0.slice().sort((a, z) => rank(a) - rank(z));
  if (all.length) { const first = h.indexOf(all0[0]); all0.forEach(p => { h = h.replace(p, ''); }); h = h.slice(0, first) + all.join('') + h.slice(first); }
  if (all.length <= 2) return h;
  const hide = state.mvAll ? [] : all.slice(2);
  let out = h; hide.forEach(b => { out = out.replace(b, ''); });
  return out.replace(/<\/div><\/div>$/, '<button type="button" class="linkbtn mvmore" data-mvmore="1">' + (state.mvAll ? 'Show fewer' : '+' + (all.length - 2) + ' more') + '</button></div></div>');
}
// The top pills are exactly the rows flagged in the right nav (below their normal range), worst first (Mike, Oct 28).
let FLAGGED = [];
function flaggedFor(b, d) {
  const comps = compsFor(b, d), sale = infoNow(b, d).sale, M = metricsFor(b), out = [];
  Object.keys(SECS).forEach(sec => (M[sec] || []).forEach(m => {
    if (m === M.overall[0]) return;
    const c0 = cellsFor(m, d, comps); if (c0.bs == null || c0.custom || nrOf(m, c0.bs).st !== 'lo') return;
    const x = sibsOf(m, d);
    out.push({ m, c: Object.assign({}, c0, { mom: c0.bs, momV: c0.bsV, sessMom: c0.sessBs }), rest: x ? x.restMom : null, gap: x ? x.gap : null, peers: x ? (x.rest.length === 1 ? x.rest[0].m.label : 'other ' + x.n[1]) : null, mix: false, jm: judge(m, 'bs', c0.bs, sale) });
  }));
  return out.sort((a, z) => a.c.bs - z.c.bs);
}
function movedHtml0() {
  const ovb = cellsFor(metricsFor(state.tab).overall[0], state.day, compsFor(state.tab, state.day)).bs, up = ovb != null && ovb >= 0.02;
  const totS = cellsFor(metricsFor(state.tab).overall[0], state.day, compsFor(state.tab, state.day)).sess;
  // Pills are the day's callouts now (Allison and Mike, Oct 28): name, what it did, then its peers; hover for the read, click for the full view.
  const lpill = (f, i) => '<button class="mv up" data-lift="' + i + '" data-hint="' + (HINTS.push(segTip2(f, totS)) - 1) + '"><span class="mvl"><span aria-hidden="true">' + em(f.m.label) + '</span><b>' + esc(f.m.label) + '</b><span class="mvv">did best</span><span class="d">' + sgn(f.c.mom, 0) + '</span></span>' + (f.rest != null ? '<span class="mvr roll"><span class="rf sib on" data-jumpsec="' + f.m.sec + '" role="link" aria-label="Jump to ' + esc(SECS[f.m.sec] || f.m.sec) + '">' + esc(ucf(f.peers)) + ' ' + sgn(f.rest, 0) + '</span></span>' : '') + '</button>';
  const liftTier = up && LIFTS.length ? LIFTS.map(lpill).join('') : '';
  if (up) MVUP = liftTier;
  const how = t => hint('How drivers are picked ⓘ', 'soft mvhowh', '<b>What counts as a driver</b><br>' + t + '<br><br><b>Colors:</b> red pills are the biggest drags on total CVR, yellow ones are smaller, green ones lifted it.');
  const have = MOVED.length + (liftTier ? LIFTS.length : 0);
  if (have < 2) {
    // Fewer than two drivers: add the segments furthest from their peers, so there is always something to compare against.
    const b = state.tab, d = state.day, comps = compsFor(b, d), seen = new Set(MOVED.map(f => f.m.key).concat(liftTier ? LIFTS.map(f => f.m.key) : [])), cand = [];
    ['device', 'funnel', 'channel', 'geo'].forEach(sec => metricsFor(b)[sec].forEach(m => {
      if (seen.has(m.key)) return; const x = sibsOf(m, d), c0 = cellsFor(m, d, comps); if (!x || c0.bs == null || nrOf(m, c0.bs).st === 'in' || (BOTSET[b] || []).some(z => z.m.key === m.key)) return; // inside its normal range, or likely bots, is never a driver (Mike, Oct 27)
      cand.push({ m, c: Object.assign({}, c0, { mom: c0.bs, momV: c0.bsV, sessMom: c0.sessBs }), rest: x.restMom, gap: x.gap, peers: x.rest.length === 1 ? x.rest[0].m.label : 'other ' + x.n[1], mix: false, pad: true });
    }));
    cand.sort((a, z) => Math.abs(z.gap) - Math.abs(a.gap)).slice(0, 2 - have).forEach(f => { if (f.gap >= 0) { f.lift = true; LIFTS.push(f); } else MOVED.push(f); });
  }
  const liftAll = up && LIFTS.length ? LIFTS.map(lpill).join('') : LIFTS.filter(f => f.pad).map((f, k) => lpill(f, LIFTS.indexOf(f))).join('');
  if (!MOVED.length && !liftAll) return '<div class="moved inhead"><div class="mvlist">' + drvLbl() + '<span class="cap">none today. Every device, region, channel and funnel step is within its normal range.</span></div></div>';
  if (!MOVED.length) return '<div class="moved inhead"><div class="mvlist">' + drvLbl() + '' + liftAll + '</div></div>';
  if (false) return '<div class="moved inhead"><span class="cap">No single driver: every device, region, channel and funnel step moved about the same as the rest of its group.</span></div>';
  // Weight = how far below usual × share of traffic it carries (funnel steps touch everyone).
  const tot = rankTot(), ranked = rankMoved(), top = ranked[0] ? ranked[0].w : 0;
  const big = ranked.filter((r, k) => k < 3 && r.w >= top * 0.35), rest = ranked.filter(r => big.indexOf(r) < 0);
  const share = f => f.m.sec === 'funnel' ? 'every order passes this step' : Math.round(Math.min(1, (f.c.sess || 0) / tot) * 100) + '% of traffic';
  const pill = (f, i) => {
    const a = ALERTS.get(f.m.key), x = sibsOf(f.m, state.day), facts = [], ov = cellsFor(metricsFor(f.m.b).overall[0], state.day, compsFor(f.m.b, state.day));
    if (f.m.sec === 'funnel' && ov.bs != null) facts.push(['sib', 'CVR ' + sgn(ov.bs, 0)]);
    if (x) facts.push(['sib', (x.rest.length === 1 ? x.rest[0].m.label + ' ' : 'Other ' + x.n[1] + ' x\u0304 ') + sgn(x.rest.length === 1 ? x.rest[0].mom : x.restMom, 0), f.m.sec]); // no "on average" in the pills, it crowds them (Mike, Oct 28)
    if (f.c.sessMom != null && f.m.sec !== 'funnel') facts.push(['traffic', 'Traffic ' + sgn(f.c.sessMom, 0)]);
    if (facts.length < 2 && f.c.pd != null) facts.push(['sib', 'vs prior day ' + sgn(f.c.pd, 0)]);
    const flag = f.mix ? '<span class="mvr spike">Traffic spike ' + sgn(f.c.sessMom, 0) + '</span>' : '';
    const tip = esc(f.m.label) + ' ' + sgn(f.c.mom, 0) + ' vs comparable days · ' + share(f) + (facts.length ? ' · ' + facts.map(z => esc(z[1])).join(' · ') : '');
    return '<button class="mv" data-moved="' + i + '" data-hint="' + (HINTS.push(segTip2(f, tot)) - 1) + '" aria-label="' + tip + '"><span class="mvl"><span aria-hidden="true">' + em(f.m.label) + '</span><b>' + esc(f.m.label) + '</b>' + (f.mix ? '<span class="mvv">traffic spike</span>' : '') + '<span class="d">' + sgn(f.c.mom, 0) /* just the number, no "fell"/"rose"; negatives carry a minus (Mike, Oct 28) */ + '</span></span>' +
      (facts.length ? '<span class="mvr roll' + (facts.length > 1 ? ' multi' : '') + '">' + facts.map((z, k) => '<span class="rf ' + z[0] + (k ? '' : ' on') + '"' + (z[2] ? ' data-jumpsec="' + z[2] + '" role="link" aria-label="Jump to ' + esc(SECS[z[2]] || z[2]) + '"' : '') + '>' + xbar(esc(z[1])) + '</span>').join('') + '</span>' : '') + flag + '</button>';
  };
  const tier = (cls, list) => list.map(r => pill(r.f, r.i).replace('<button class="mv"', '<button class="mv ' + cls + '"')).join('');
  if (state.view === 'daily') {
    FLAGGED = flaggedFor(state.tab, state.day);
    const fp = FLAGGED.slice(0, state.flAll ? 99 : 2).map((f, i) => pill(f, i).replace('data-moved=', 'data-fl=').replace(/ data-hint="\d+"/, '').replace('<button class="mv"', '<button class="mv big"')).join('');
    return '<div class="moved inhead"><div class="mvlist">' + (FLAGGED.length ? fp + (FLAGGED.length > 2 ? '<button type="button" class="linkbtn mvmore" data-flmore="1">' + (state.flAll ? 'Show fewer' : 'View ' + (FLAGGED.length - 2) + ' more') + '</button>' : '') : '<span class="cap">✅ Nothing is below its normal range today.</span>') + '</div></div>';
  }
  if (up) return '<div class="moved inhead"><div class="mvlist">' + drvLbl() + '' + liftAll + tier('big', big.concat(rest)) + '</div>' + '</div>';
  return '<div class="moved inhead"><div class="mvlist">' + drvLbl() + '' + tier('big', big) + tier('small', rest) + liftAll + '</div>' + '</div>';
}
const SITE = { TP: 'TeePublic', RB: 'Redbubble', Both: 'Both sites' };
const nextWeekday = d => { let x = addDays(d, 1); while (dow(x) === 0 || dow(x) === 6) x = addDays(x, 1); return x; };
// Ticks on open next steps are per viewer, so a host can run through them live.
// Shared ticks: one doc per standup date in ticks/, fields k0, k1… Falls back to this browser when the page has no database.
let SHT = {}, TKSH = false;
const ticked = (date, k) => TKSH ? !!(SHT[date] || {})['k' + k] : TICKS.has(date + ':' + k);
const TICKS = new Set((() => { try { return JSON.parse(localStorage.getItem('pod.ticks') || '[]'); } catch (e) { return []; } })());
/* Roundtable topics: shared, signed-in viewers add their own; each person's topics live in topics/<their id>. */
// Editor names must really match a directory name (Jon ↔ Jonathan is fine); never fall back to whoever the search returned first.
const nrm = x => (x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().split(/\s+/);
const sameName = (a, b) => { const x = nrm(a), y = nrm(b); return x.length > 1 && y.length > 1 && x[x.length - 1] === y[y.length - 1] && (x[0].startsWith(y[0]) || y[0].startsWith(x[0])); };
const RT = { db: null, user: null, me: null, canWrite: null, docs: [], names: {}, ready: false, date: null };
(async () => {
  if (!window.claude || !window.claude.use) return;
  const [db, user] = await Promise.all([claude.use('db'), claude.use('user')]);
  if (!db) return;
  RT.db = db; RT.user = user;
  try { RT.me = user ? await user.id() : null; } catch (e) { RT.me = null; }
  try { OR.owner = !!(user && user.isOwner()); } catch (e) { /* not the owner */ }
  try { RT.canWrite = user && user.can ? user.can('data.write') : null; } catch (e) { RT.canWrite = null; }
  if (user && user.search) { const names = [ADMIN, REVIEWER].concat(...Object.values(EDITORS)).filter((n, i, a) => a.indexOf(n) === i); for (const n of names) { try { const r = await user.search(n); const hit = (r || []).find(p => sameName(p.name, n)); if (hit) OR.ids[n] = hit.id; } catch (e) { /* directory unavailable */ } } }
  db.collection('order').onSnapshot(snap => { OR.docs = snap.docs.map(d => ({ id: d.id, orders: (d.data() || {}).orders || {} })); OR.ready = true; if (state.view === 'soon') renderKeep(); }, () => { /* keep the default order */ });
  db.collection('flags').onSnapshot(snap => { FLAGS = {}; snap.docs.forEach(d => { FLAGS[d.id] = (d.data() || {}).items || {}; }); if (state.view === 'impact') renderKeep(); }, () => { /* flags unavailable */ });
  db.collection('acks').onSnapshot(snap => { Object.keys(ACK).forEach(k => delete ACK[k]); snap.docs.forEach(d => { ACK[d.id] = d.data() || {}; }); if (state.view === 'soon') renderKeep(); }, () => { /* no shared reviews */ });
  db.collection('ticks').onSnapshot(snap => { SHT = {}; snap.docs.forEach(d => { SHT[d.id] = d.data() || {}; }); TKSH = true; if (state.view === 'standup') renderKeep(); }, () => { /* fall back to this browser's ticks */ });
  db.collection('topics').onSnapshot(async snap => {
    RT.docs = snap.docs.map(d => ({ id: d.id, items: ((d.data() || {}).items || []) }));
    const ids = RT.docs.map(d => d.id);
    if (user && ids.length) { try { RT.names = await user.profiles(ids); } catch (e) { /* names optional */ } }
    RT.ready = true; paintRT();
  }, () => { RT.ready = true; paintRT(); });
})();
const rtList = date => [].concat(...RT.docs.map(d => d.items.filter(x => x.date === date).map(x => Object.assign({ who: d.id }, x)))).sort((a, z) => a.at - z.at);
function rtInner(date) {
  const list = rtList(date);
  const items = list.map(x => { const mine = x.who === RT.me, tt = topicT(x.t); return '<li><span class="rte" aria-hidden="true">' + topicE(x.t) + '</span><div><b class="rtt">' + esc(tt.title) + '</b>' + (tt.rest ? '<span class="rtr">…' + esc(tt.rest) + '</span>' : '') + '<span class="rtwho">Added by ' + esc(x.name || ((RT.names[x.who] || {}).name) || 'someone') + '</span></div>' + (mine ? '<button type="button" class="rtx" data-rtdel="' + x.at + '" aria-label="Remove this topic">×</button>' : '') + '</li>'; }).join('');
  return list.length ? '<ul class="rtlist">' + items + '</ul>' : '<p class="cap">' + (RT.ready ? 'No topics yet.' : RT.db ? 'Loading topics…' : 'Topics show here once the shared database responds.') + '</p>';
}
function rtHtml(date) {
  RT.date = date;
  const can = RT.db && RT.me;
  return '<div class="rt rttop"><div class="rthead"><b>➕ Add a topic for ' + label(nextWeekday(date)) + '</b></div>' +
    (can ? '<form class="rtform" id="rtform"><input id="rtname" maxlength="40" required placeholder="Your name" aria-label="Your name"><input id="rtin" maxlength="200" required placeholder="What do you want to talk about?" aria-label="Topic"><button class="btn pri sm" type="submit">Add topic</button></form>' : '') +
    '<div id="rtbody">' + rtInner(date) + '</div></div>';
}
function prefillName() { const nm = document.getElementById('rtname'); if (nm && !nm.value) { try { nm.value = localStorage.getItem('pod.name') || ''; } catch (e) { /* ignore */ } } }
function paintRT() { prefillName(); const b = document.getElementById('rtbody'); if (b && RT.date) b.innerHTML = rtInner(RT.date); if (RT.db && RT.me && !document.getElementById('rtform') && document.querySelector('.rt')) renderKeep(); }
async function rtSave(items) { try { await RT.db.collection('topics').doc(RT.me).set({ items }); } catch (e) { const b = document.getElementById('rtbody'); if (b) b.insertAdjacentHTML('beforeend', '<p class="cap" style="color:var(--bad)">Could not save that topic. You may only have view access.</p>'); } }
const myItems = () => ((RT.docs.find(d => d.id === RT.me) || {}).items || []).slice();
document.addEventListener('input', ev => { const q = ev.target.closest && ev.target.closest('[data-fq]'); if (!q) return; state.q = q.value; const pos = q.selectionStart; renderKeep(); const n = document.querySelector('[data-fq]'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } });
document.addEventListener('change', ev => { const f = ev.target.closest && ev.target.closest('[data-fs]'); if (f) { state[f.dataset.fs] = f.value; renderKeep(); } });
document.addEventListener('change', ev => { const f = ev.target.closest && ev.target.closest('[data-rmscope]'); if (f) { state.rmScope = f.value; renderKeep(); } });
document.addEventListener('submit', ev => { const f = ev.target.closest && ev.target.closest('[data-flagf]'); if (!f) return; ev.preventDefault(); const fd = new FormData(f); flagSave(f.dataset.flagf, fd.get('fv') || 'off', fd.get('note')); });
document.addEventListener('submit', ev => {
  if (ev.target.id !== 'rtform') return; ev.preventDefault();
  const inp = document.getElementById('rtin'), nm = document.getElementById('rtname'), t = (inp.value || '').trim(), name = (nm.value || '').trim(); if (!t || !name || !RT.me) return;
  try { localStorage.setItem('pod.name', name); } catch (e) { /* ignore */ }
  inp.value = ''; rtSave(myItems().concat([{ t, name, date: RT.date, at: Date.now() }]).slice(-20));
});
const md = d => { const x = new Date(parse(d)); return (x.getUTCMonth() + 1) + '/' + x.getUTCDate(); };
const TOPIC_E = [[/pay|checkout|apple|paypal|card/i, '💳'], [/test|a\/b|experiment/i, '🧪'], [/search|rank/i, '🔎'], [/email|lifecycle|crm/i, '✉️'], [/ship|fulfil|deliver|order/i, '📦'], [/ads?|paid|marketing|promo|sale/i, '📣'], [/data|amplitude|tracking|report/i, '📊'], [/bug|broken|incident|error|down/i, '🐞'], [/design|ux|page|pdp|cart/i, '🛍️'], [/hire|team|people|process/i, '👥'], [/price|pricing|aov|upsell/i, '💵']];
const topicE = t => (TOPIC_E.find(x => x[0].test(t)) || [0, '💬'])[1];
const topicT = t => { const w = t.replace(/\s+/g, ' ').trim().split(' '), h = w.slice(0, 9).join(' '); return { title: h.charAt(0).toUpperCase() + h.slice(1).replace(/[.,;:]$/, '') + (w.length > 9 ? '…' : ''), rest: w.length > 9 ? w.slice(9).join(' ') : '' }; };
function agendaHtml(s) {
  const tp = metricsFor('tp').overall[0], d = D.asOf, cd = compsDefault('tp', d), c = cellsFor(tp, d, cd), mv = (() => { const all = movedFor('tp', d), tot = c.sess || 1, w = f => Math.max(0, -f.jm.dlt) * (f.m.sec === 'funnel' ? 1 : Math.min(1, (f.c.sess || 0) / tot)); return all.slice(0, 8).sort((a, z) => w(z) - w(a)).slice(0, 2).map(f => f.m.label); })();
  const best = [].concat(EXPS.live).sort((a, z) => z.cvr.rel * z.reach - a.cvr.rel * a.reach)[0];
  // Three tiers instead of a timed run sheet: what standup has to cover, what to get to if there is time, and ideas the dashboard surfaced.
  const items = [
    ['must', '📈', 'Yesterday\'s read', 'TeePublic ' + pct(c.val) + ', ' + sgn(c.bs, 0) + ' vs comparable days.' + (mv.length ? ' ' + mv.join(' and ') + ' fell furthest.' : ' Broad-based, no segment stands out.'), 'w:tp|overall'],
    ['must', '⚖️', 'Decisions due', 'Shipping add-on (Pricing). Apple Pay buy-now on Redbubble (Mike).', 'standuplast|.bh.open'],
    ['must', '✅', 'Open next steps', s.next.length + ' owners, on the right.', 'standup|.nextcard'],
    ['must', '🗣️', 'Roundtable', (() => { const n = rtList(s.date).length; return n ? n + ' topic' + (n === 1 ? '' : 's') + ' added above.' : 'No topics yet. Add one above.'; })(), 'standup|.rt'],
    ['time', '🖼️', 'Did the feed fix land?', 'TeePublic Paid Search should lift from Oct 22.', 'w:tp|channel/Paid Search'],
    ['time', '💳', 'PayPlus guardrail', 'Agree the drop that pauses it.', 'w:tp|funnel/Checkout completion rate'],
    ['sugg', '🧪', 'Tests to call', esc(best.name), 'tests|.trow'],
    ['sugg', '⚾', 'Market the Brewers?', '2.5× their usual share of orders', 'trending|.callcard']
  ];
  const TIER = { must: 'Must cover', time: 'If there\'s time', sugg: 'Suggestions from the dashboard' };
  const row = i => { const go = i[4] ? (i[4].indexOf('w:') === 0 ? ' data-watch="' + esc(i[4].slice(2)) + '"' : ' data-goto="' + esc(i[4]) + '"') : ''; return '<li class="' + i[0] + '"><button type="button" class="arow"' + go + '><div><b><span aria-hidden="true">' + i[1] + '</span> ' + i[2] + '</b><p>' + i[3] + '</p></div><span class="ago" aria-hidden="true">→</span></button></li>'; };
  const chip = i => { const go = i[4].indexOf('w:') === 0 ? ' data-watch="' + esc(i[4].slice(2)) + '"' : ' data-goto="' + esc(i[4]) + '"'; return '<button type="button" class="achip"' + go + '><span aria-hidden="true">' + i[1] + '</span> <b>' + i[2] + '</b> <span class="cap">' + i[3] + '</span></button>'; };
  const rows = Object.keys(TIER).map(k => '<li class="atier ' + k + '">' + TIER[k] + '</li>' + (k === 'sugg' ? '<li class="achips">' + items.filter(i => i[0] === k).map(chip).join('') + '</li>' : items.filter(i => i[0] === k).map(row).join(''))).join('');
  return '<div class="sgrid2"><section class="sec2"><div class="shead"><div><h2>🗓️ ' + md(nextWeekday(s.date)) + ' agenda</h2><p class="cap">Built from this dashboard and the ' + md(s.date) + ' notes. Click a line to jump to it.</p></div></div><div class="pbody">' + rtHtml(s.date) + '<ol class="agenda3">' + rows + '</ol></div></section>' +
    '<section class="sec2 nextcard"><div class="shead"><div><h2>✅ Open next steps</h2><p class="cap">From ' + label(s.date) + '. Ticks show for everyone.</p></div></div><div class="pbody"><ul class="checks">' + s.next.map((n, k) => { const on = ticked(s.date, k); return '<li><button type="button" class="chk" aria-pressed="' + on + '" data-tick="' + s.date + ':' + k + '"><span class="box" aria-hidden="true">' + (on ? '✓' : '') + '</span><div><span class="who">' + esc(n[0]) + '</span>' + esc(n[1]) + '</div></button></li>'; }).join('') + '</ul></div></section></div>';
}
// Section marks: one family with the CVR Pacer gauge (dark tile, slate + green strokes, white accents).
const LOGO = (k, z) => {
  const g = {
    pacer: '<path d="M6.5 21.5a9.5 9.5 0 0 1 19 0" fill="none" stroke="#34465a" stroke-width="3.4" stroke-linecap="round"/><path d="M6.5 21.5a9.5 9.5 0 0 1 14.6-8" fill="none" stroke="#4fd18b" stroke-width="3.4" stroke-linecap="round"/><path d="M16 21.5l6-7" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="16" cy="21.5" r="2.6" fill="#fff"/>',
    pod: '<rect x="7" y="17" width="4.6" height="8" rx="1.6" fill="#34465a"/><rect x="13.7" y="12" width="4.6" height="13" rx="1.6" fill="#34465a"/><rect x="20.4" y="7" width="4.6" height="18" rx="1.6" fill="#4fd18b"/><circle cx="9.3" cy="10" r="2.4" fill="#f0586c"/>',
    tests: '<path d="M13 6.5h6M14 6.5v6.2L8.6 22.3a2.2 2.2 0 0 0 1.9 3.2h11a2.2 2.2 0 0 0 1.9-3.2L18 12.7V6.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/><path d="M11 18.5h10l2.3 4.2a1.2 1.2 0 0 1-1 1.8H9.7a1.2 1.2 0 0 1-1-1.8z" fill="#4fd18b"/>',
    soon: '<path d="M7 10l6 6-6 6" fill="none" stroke="#34465a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.5 10l6 6-6 6" fill="none" stroke="#7fa0b8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 10l6 6-6 6" fill="none" stroke="#4fd18b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
    trend: '<path d="M6.5 22l6-6 4 4 8-9" fill="none" stroke="#4fd18b" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 10.5h6v6" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    standup: '<path d="M7 10.5l2 2 3.5-4" fill="none" stroke="#4fd18b" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.5 10.5H25M15.5 16.5H25M15.5 22.5H25" stroke="#34465a" stroke-width="2.6" stroke-linecap="round"/><circle cx="9.7" cy="16.5" r="1.6" fill="#fff"/><circle cx="9.7" cy="22.5" r="1.6" fill="#fff"/>'
  }[k];
  return '<svg class="slogo" width="' + z + '" height="' + z + '" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#14202e"/>' + g + '</svg>';
};
const VH = (k, t) => '<h1>' + { tests: '🧪', soon: '🚧', trend: '🔥', standup: '📋' }[k] + ' ' + t + '</h1>';
function standupHtml() {
  // Key takeaways and who owes what, for the latest standup or an earlier one. No suggested agenda, no how-to text.
  const si = Math.min(state.suDay || 0, STANDUPS.length - 1), s = STANDUPS[si], nx = nextWeekday(STANDUPS[0].date), ORD = { blocked: 0, open: 1, soon: 2, done: 3 }, TN = { open: 'Deciding', blocked: 'Blocked', soon: 'This week', done: 'Done' }, TC = { open: 'warn', blocked: 'bad', soon: '', done: 'good' };
  const all = s.items.map((x, k) => [x, k]).sort((a, z) => (ORD[a[0].tone] ?? 4) - (ORD[z[0].tone] ?? 4)), live = all.filter(x => x[0].tone !== 'done'), done = all.filter(x => x[0].tone === 'done');
  const chip = it => { const t = TN[it.tone] || esc(it.status); return it.tone === 'blocked' || it.tone === 'open' ? hint(t, 'stat-chip ' + TC[it.tone], '<b>' + t + '</b><br>' + esc(it.status || '') + (it.nx ? '<br><br><b>Next:</b> ' + esc(it.nx) : '')) : '<span class="stat-chip ' + TC[it.tone] + '">' + t + '</span>'; };
  const trow = ([it, k]) => '<li><div class="tkrow" role="button" tabindex="0" data-card="' + k + '"><span class="tke" aria-hidden="true">' + it.icon + '</span><span class="tkt"><b>' + esc(it.title) + '</b><span class="tmtags">' + (it.site ? '<span class="rtag site">' + siteDot(it.site) + '</span>' : '') + (it.owner ? '<span class="rtag">' + esc(it.owner) + '</span>' : '') + '</span></span>' + chip(it) + '</div></li>';
  const watch = s.items.filter(i => i.watch).map(i => '<button class="wchip" data-watch="' + esc(i.watch) + '">' + i.icon + ' ' + esc(i.watchLabel) + ' →</button>').join('');
  const days = STANDUPS.length > 1 ? '<div class="sudays" role="tablist" aria-label="Standup day">' + STANDUPS.map((x, i) => '<button type="button" role="tab" data-suday="' + i + '" aria-selected="' + (i === si) + '">' + (i === 0 ? 'Latest · ' : '') + label(x.date) + '</button>').join('') + '</div>' : '';
  const takeaways = '<section class="sec2"><div class="shead"><div><h2>🎯 Key takeaways from ' + label(s.date) + '</h2></div></div><div class="pbody"><p class="tklead">' + esc(s.tldr) + '</p>' +
    '<ul class="tklist">' + live.map(trow).join('') + (state.suAll ? done.map(trow).join('') : '') + '</ul>' +
    (done.length ? '<button type="button" class="linkbtn" data-suall="1">' + (state.suAll ? 'Hide done' : 'Show ' + done.length + ' done') + '</button>' : '') +
    (watch ? '<div class="wrow"><span class="cap">Watch</span>' + watch + '</div>' : '') + '</div></section>';
  const acts = s.next.map((n, k) => [n[0], n[1], String(k)]).concat(s.items.map((it, k) => [it, k]).filter(x => x[0].nx && x[0].tone !== 'done' && !s.next.some(n => n[0].toLowerCase() === (x[0].owner || '').toLowerCase())).map(x => [x[0].owner, x[0].nx, 'i' + x[1]]));
  const openN = acts.filter(a => !ticked(s.date, a[2])).length;
  const actions = '<section class="sec2 nextcard"><div class="shead"><div><h2>✅ Open actionables <span class="tmcount">' + openN + ' of ' + acts.length + '</span></h2></div></div><div class="pbody"><ul class="checks">' + acts.map(a => { const on = ticked(s.date, a[2]); return '<li><button type="button" class="chk" aria-pressed="' + on + '" data-tick="' + s.date + ':' + a[2] + '"><span class="box" aria-hidden="true">' + (on ? '✓' : '') + '</span><div><span class="who">' + esc(a[0]) + '</span>' + esc(a[1]) + '</div></button></li>'; }).join('') + '</ul></div></section>';
  return '<section class="sview"><div class="vhead">' + VH('standup', 'Daily peak standup') + '<span class="tag">Next: ' + label(nx) + ', 3 PM ET</span></div>' + days + '<div class="sgrid2">' + takeaways + actions + '</div></section>';
}
function cardModal(k) {
  const it = STANDUPS[Math.min(state.suDay || 0, STANDUPS.length - 1)].items[k];
  openModal('<div class="mhead"><h3 id="mtitle">' + it.icon + ' ' + esc(it.title) + '</h3></div><div class="mtags">' + (it.site ? '<span class="rtag">' + siteDot(it.site) + '</span>' : '') + '<span class="rtag">' + esc(it.status) + '</span></div><div class="pmeta"><div><span class="lbl">Owner</span><b>' + esc(it.owner) + '</b></div><div><span class="lbl">Impact</span><b>' + esc(it.impact) + '</b></div></div><p class="pdesc">' + esc(it.detail) + '</p>' + (it.nx ? '<div class="pbox up"><span class="lbl">Next step</span><p>' + esc(it.nx) + '</p></div>' : '') + refsHtml((it.watch ? [{ go: it.watch, l: it.watchLabel }] : []).concat(it.refs || [])));
}
function cvrTalk(b) {
  const code = b === 'rb' ? 'RB' : 'TP', list = SLACK.filter(x => x.site === code).concat(SLACK.filter(x => x.site === 'Both')).slice(0, 4);
  return list.length ? '<section class="cvrtalk"><div class="ghead"><div class="gt"><h3>💬 What people are saying</h3><p class="gsub">The topics most likely to explain ' + BR[b].name + '\'s CVR right now, from Slack and meetings.</p></div></div>' + sayList(list) + '</section>' : '';
}
// Reference links: small "See" footers that jump inside the dashboard (→) or open Jira, Confluence, Slack (↗).
function refsHtml(r) {
  if (!r || !r.length) return '';
  const one = x => x.go ? '<button type="button" class="ref" data-watch="' + esc(x.go) + '">' + esc(x.l) + ' <span aria-hidden="true">→</span></button>'
    : x.test ? '<button type="button" class="ref" data-jt="' + esc(x.test) + '">🧪 ' + esc(x.l) + ' <span aria-hidden="true">→</span></button>'
    : x.soon ? '<button type="button" class="ref" data-js="' + esc(x.soon) + '">🚧 ' + esc(x.l) + ' <span aria-hidden="true">→</span></button>'
    : x.jira ? '<a class="ref ext" href="https://articore.atlassian.net/browse/' + esc(x.jira) + '" target="_blank" rel="noopener">Jira ' + esc(x.jira) + ' <span aria-hidden="true">↗</span></a>'
    : '<a class="ref ext" href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.l) + ' <span aria-hidden="true">↗</span></a>';
  return '<div class="refs"><span class="refl">See</span>' + r.map(one).join('<span class="refsep" aria-hidden="true">·</span>') + '</div>';
}
// Bold the facts a reader scans for: percentages, money, dates and counts.
const boldKey = t => esc(t).replace(/(\$[\d.,]+[KM]?|[\d.,]+(?:\s?to\s?[\d.,]+)?%|\b(?:Oct|Nov|Sep) \d{1,2}\b|\b\d+-day\b|\b(?:all three|fixed|shipped|confirmed)\b)/gi, '<b>$1</b>');
// Glance first (Mike, Oct 27: the pop-up was a wall of text): the takeaway in one line, what we know as short bullets,
// then two small boxes for what to watch and whether it's in this page's numbers (a Yes / Partly / No pill, then one line).
const sents = t => String(t || '').split(/(?<=[.!?])\s+(?=[A-Z"(])/).filter(Boolean);
function sayModal(i) {
  const s = SLACK[i], ss = sents(s.body), tl = s.tldr || ss[0] || '', pts = s.pts || (s.tldr ? ss : ss.slice(1));
  const fxk = /^yes/i.test(s.fx || '') ? 'Yes' : /^partly/i.test(s.fx || '') ? 'Partly' : /^(no\b|nothing)/i.test(s.fx || '') ? 'No' : '', fxt = String(s.fx || '').replace(/^(yes|partly|no)\s*[:,.]\s*/i, '');
  openModal('<div class="mhead"><span class="lbl">' + esc(s.channel) + ' · ' + esc(s.when) + '</span><h3 id="mtitle">' + s.icon + ' ' + esc(s.title) + '</h3></div>' +
    '<div class="saymeta"><span class="stat-chip ' + s.tone + '">' + esc(s.status) + '</span>' + (s.site ? '<span class="scmeta">' + esc(SITE[s.site] || s.site) + '</span>' : '') + '</div>' +
    '<p class="saytl">' + boldKey(tl) + '</p>' +
    (pts.length ? '<div class="saypts"><h4 class="ph">What we know</h4><ul>' + pts.map(p => '<li>' + boldKey(p) + '</li>').join('') + '</ul></div>' : '') +
    (s.qs && s.qs.length ? '<div class="saypts"><h4 class="ph">Still open</h4><ul>' + s.qs.map(p => '<li>' + boldKey(p) + '</li>').join('') + '</ul></div>' : '') +
    '<div class="saybox2">' + (s.why ? '<div class="pbox upd"><h4 class="ph">👀 What to watch</h4><p>' + esc(s.why) + '</p></div>' : '') +
    (s.fx ? '<div class="pbox"><h4 class="ph">📊 In this page\'s numbers?</h4><p><span class="fxpill ' + fxk.toLowerCase() + '">' + fxk + '</span> ' + esc(ucf(fxt)) + '</p></div>' : '') + '</div>' +
    refsHtml((s.refs || []).concat(s.url && !(/atlassian\.net\/browse\//.test(s.url) && (s.refs || []).some(r => r.jira)) ? [{ url: s.url, l: /slack\.com/.test(s.url) ? 'Open the thread in Slack' : /atlassian\.net\/wiki/.test(s.url) ? 'Open in Confluence' : /atlassian\.net/.test(s.url) ? 'Open in Jira' : /granola/.test(s.url) ? 'Open the meeting notes' : 'Open the source' }] : [])));
}
// Search tests (Sigma). One card each: what changed, the primary metric per variant with a plain verdict, and the Search team's reading rules on hover.
/* ---------- page headlines (Mike, Oct 27): each work page opens like the CVR page, a verdict sentence and one supporting line,
   every number hovering to a short list and every name hovering to its card and clicking through ---------- */
// Plain-English names for projects inside a sentence (Mike, Oct 27: "feed fixes, incl. new iPhone case" was confusing). The refresh adds `say` to new projects.
const SAYN = {"New iPhone cases in the feed": "adding new iPhone cases to the feed", "Cart and cart-tray cross-sell": "adding cross-sell to the cart and cart tray", "Cart tray vs cart page test": "testing the cart tray against the cart page", "T-shirt style pills on product pages": "showing T-shirt styles as pills on product pages", "Thank-you page upsell, 6 slots": "a six-slot upsell on the thank-you page", "Checkout email opt-in and hashing": "email opt-in at checkout", "Retire 8 low-value Redbubble products": "retiring 8 low-value Redbubble products", "Takedown (DMCA) tool": "a takedown tool for artists", "Fix sale prices in Google Shopping": "fixing sale prices in Google Shopping", "Creator behavior data in Amplitude": "creator behavior data in Amplitude", "Delivery-issue resolution queue": "a queue for delivery issues", "Trucker hat fulfillment": "trucker hat fulfillment", "Trucker hats on Redbubble": "trucker hats on Redbubble", "Standardized wall art sizes": "standard wall art sizes", "Simon AI profile attributes": "Simon AI profile attributes", "Search cluster migration": "moving search to its new cluster", "Sticker quick-add with quantity on search": "sticker quick-add on search", "Sticker cross-sell on add to cart": "a sticker cross-sell on add to cart", "Feed images at 1260px": "sharper feed images", "Apple Pay buy-now on product pages": "Apple Pay buy-now on product pages", "Premium tee upsell in cart": "a premium tee upsell in the cart", "Greeting cards and postcards in the feeds": "greeting cards and postcards on TeePublic", "Learn to Rank rerun": "rerunning Learn to Rank", "Show the lowest-priced T-shirt style first in Redbubble search": "showing the cheapest T-shirt style first in Redbubble search", "Selling blanks on TeePublic": "selling blank apparel on TeePublic", "Recently viewed on Redbubble search and product pages": "a recently viewed row on Redbubble search and product pages", "More prominent Redbubble search bar": "a more prominent Redbubble search bar", "TeePublic GRIN webhook tracking": "tracking creator affiliate sales from GRIN on TeePublic", "Redbubble search tracking": "tracking searches on Redbubble", "One data layer across Redbubble and TeePublic": "one shared tracking data layer for Redbubble and TeePublic", "Redbubble GA4 purchase tracking fix": "fixing Redbubble purchase tracking in GA4", "Tracking on search and remaining pages": "tracking on search and the remaining pages", "Automated tracking QA": "automated checks on site tracking", "Redbubble app analytics": "analytics for the Redbubble app", "One consent platform across all brands": "one consent platform across all brands", "Communication preference management": "letting shoppers manage their email and message preferences", "Artist tracking and audiences": "tracking artist activity and building artist audiences"};
const sayOf = it => it.say || SAYN[it.t] || midCase(it.t);
// Titles stay verbatim from the Active Work tab (Product Managers, Oct 30): an item with a sheet title shows it, and every record keyed by the old title is aliased.
// The Team column on the sheet is the authority for the team. Dashery has not broken its goal into OKRs, so its projects show no goal.
(function verbatimTitles() {
  if (typeof COMING === 'undefined') return;
  const clean = x => { const v = String(x).replace(/\s+/g, ' ').trim().replace(/\.$/, '').replace(/ — /g, ': '); return v.charAt(0).toUpperCase() + v.slice(1); };
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const maps = [typeof SRCS !== 'undefined' && SRCS, typeof LATEST !== 'undefined' && LATEST, typeof DATES !== 'undefined' && DATES, typeof PEOPLE !== 'undefined' && PEOPLE, typeof BURN !== 'undefined' && BURN, SAYN, typeof COMING_PREV !== 'undefined' && COMING_PREV.items].filter(Boolean);
  const moves = [];
  COMING.teams.forEach(T => T.items.forEach(it => {
    if (it.sheet) { const v = clean(it.sheet), old = it.t; if (v !== old) { it.t0 = old; it.t = v; maps.forEach(o => { if (has(o, old) && !has(o, v)) o[v] = o[old]; }); } }
    if (it.sheetTeam && it.sheetTeam !== T.key) moves.push([T, it]);
  }));
  moves.forEach(([T, it]) => { let D = COMING.teams.find(x => x.key === it.sheetTeam); if (!D) { D = { key: it.sheetTeam, name: 'Infrastructure', icon: '🏗️', tagline: 'Platform and tooling consolidation across the sites.', items: [] }; COMING.teams.push(D); } T.items.splice(T.items.indexOf(it), 1); D.items.push(it); });
  const dz = COMING.teams.find(x => x.key === 'dashery');
  if (dz) dz.items.forEach(it => { it.obj = ''; const R = typeof SRCS !== 'undefined' && SRCS[it.t]; if (R && R.obj) delete R.obj; });
})();
// Numbered lists show the top 3, then "Show more" (Mike, Oct 27: the full list of 13 was too big).
const hlist = (title, items, ol) => '<b>' + title + '</b><' + (ol ? 'ol class="hol"' : 'ul class="hul nrul"') + '>' + items.map((x, i) => ol && i >= 3 ? x.replace('<li>', '<li class="hx">') : x).join('') + '</' + (ol ? 'ol' : 'ul') + '>' + (ol && items.length > 3 ? '<button type="button" class="linkbtn hmore" data-hmore="1">Show ' + (items.length - 3) + ' more</button>' : '');
// Names inside a sentence keep the sentence's case: "feed fixes", "cart and cart-tray cross-sell"; proper nouns stay capitalized.
const midCase = t => /^(TeePublic|Redbubble|Dashery|Google|Amazon|Apple|Android|iOS|USA|Black|Meta|Simon|Shirt Monkey|Sign in with Google)\b/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1);
const andJoin = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0] || '';
// Undated work sits at the bottom of its own stage in the timeline, as a "No launch date yet" block of chips grouped by team (Mike, Oct 27: two "In progress" sections was confusing).
// A date we shouldn't draw as a launch: the "date" is really the end of scoping, a hope or a range, or the work is still in discovery
// or sizing with no committed date (Mike, Oct 27: "Scoping ends Oct 27" drew as an Oct 27 launch). These go in the no-firm-date sections.
const softDate = it => { const DT = (typeof DATES !== 'undefined' && DATES[it.t]) || {}; return /scop|sizing|ends|hop|tbd|rolling|after |~|soon|next sprint|pre-?peak|by peak|before peak/i.test(it.eta || '') || (stepIx(it.s) <= 1 && !DT.due && !DT.likely); };
function undatedPool(keep) {
  const DT = it => (typeof DATES !== 'undefined' && DATES[it.t]) || {}, dashAll = ((COMING.teams.find(t => t.key === 'dashery') || {}).items || []).map((it, i) => Object.assign({ team: 'dashery', ref: 'dashery|' + i }, it));
  const pool = preList().filter(it => !(stepIx(it.s) === 6 && !stuck(it.s)) && ((!etaDate(it.eta) && !DT(it).due) || softDate(it))).filter(it => !keep || keep(it)); // the page's filters apply here too (Mike, Oct 27, revised)
  const notStarted = it => DT(it).notStarted || STAGE(it) === 'next';
  // A soft target like "Before peak" rides along on the chip, so "no launch date" doesn't read as "no plan" (Data Engineering lead, Oct 27).
  const chip = it => '<button type="button" class="gchip" data-lbm2="' + it.ref + '"><span aria-hidden="true">' + it.e + '</span>' + esc(it.t) + (it.eta && !/^(tbd|paused)$/i.test(it.eta) ? '<span class="gchd">' + esc(it.eta) + '</span>' : '') + '</button>';
  const byTeam = a => MEETS.map(m => [m, a.filter(it => teamKey(it.team) === m[0])]).filter(g => g[1].length).map(([m, l]) => '<div class="ugrp"><span class="ugt">' + ((COMING.teams.find(t => t.key === m[0]) || {}).icon || '') + ' ' + esc(m[1]) + '</span><div class="gcw"><div class="gchips clamp">' + l.map(chip).join('') + '</div><button type="button" class="linkbtn gmore" data-gmore="1" hidden>See more</button></div></div>').join('');
  const sec = (t, sub, a) => a.length ? '<section class="sec2 tmsec usec"><div class="ushead"><h2>' + t + ' <span class="ggn">' + a.length + '</span></h2><p class="cap">' + sub + '</p></div><div class="ubody">' + byTeam(a) + '</div></section>' : '';
  return { pool, notStarted, byTeam };
  return sec('🚧 In progress, launching later', 'No firm launch date yet: being built, but no date in Jira or the roadmap sheet. Following the filters above.', pool.filter(it => !notStarted(it))) + sec('🚀 Just getting started', 'No firm launch date yet: in discovery, sizing or not started.', pool.filter(notStarted));
}
// A row of small context tags above every page's headline sentence, like the CVR pages' sale and bot-filter row (Mike, Oct 27).
const ctxTags = tags => '<div class="vsalew ctxtags">' + tags.filter(Boolean).map(t => '<span class="vsale">' + t + '</span>').join('') + '</div>';
// The Executive Roadmap Review is every other Tuesday at 6 PM ET, counting from Oct 27, 2026.
function nextReview() {
  const n = new Date(), today = Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()), base = Date.UTC(2026, 9, 27), k = Math.max(0, Math.ceil((today - base) / (14 * DAY))), t = base + k * 14 * DAY;
  return t === today ? 'today, 6 PM ET' : WD[new Date(t).getUTCDay()] + ' ' + MON[new Date(t).getUTCMonth()] + ' ' + new Date(t).getUTCDate();
}
function rmHeadline() {
  const today = parse(D.asOf) + DAY, dow = new Date(today).getUTCDay(), wkEnd = today + ((7 - dow) % 7) * DAY, md = t => MON[new Date(t).getUTCMonth()] + ' ' + new Date(t).getUTCDate();
  const DT = it => (typeof DATES !== 'undefined' && DATES[it.t]) || {}, dueOf = it => etaDate(it.eta) || (DT(it).due ? parse(DT(it).due) : null);
  const all = preList().map(it => Object.assign({}, it)), open = all.filter(it => !(stepIx(it.s) === 6 && !stuck(it.s)));
  const wk = open.filter(it => { const e = dueOf(it); return e && e >= today && e <= wkEnd + DAY - 1; }).sort((a, b) => impVal(b) - impVal(a));
  const late = open.filter(it => { const e = dueOf(it); return e && e < today && (today - e) / DAY <= 60; }).sort((a, b) => impVal(b) - impVal(a));
  const disc = open.filter(it => (STAGE(it) === 'next' || DT(it).notStarted) && late.indexOf(it) < 0 && wk.indexOf(it) < 0).sort((a, b) => impVal(b) - impVal(a));
  const later = open.filter(it => { const e = dueOf(it); return e && e > wkEnd && e <= FREEZE; });
  const nm = (it, cls) => hint(esc(sayOf(it)), 'verd ' + (cls || 'b') + ' hlink" data-lbm2="' + it.ref, gTip(it, dueOf(it), false, null, DT(it).start ? parse(DT(it).start) : null));
  const SITEN = { RB: 'Redbubble', TP: 'TeePublic', Both: 'both sites', Dashery: 'Dashery' };
  // Hover rows as a small table: the project (and its site underneath) on the left, the date on the right (Mike, Oct 27: easier to read).
  const li = (it, extra) => '<li><button type="button" class="hlli" data-lbm2="' + it.ref + '"><span class="hln"><b>' + esc(it.t) + '</b><span class="hls">' + esc(SITEN[it.site] || '') + ' · ' + esc(TEAMS(it.team)) + '</span></span><span class="hld">' + (extra || '') + '</span></button></li>';
  const num = (n, word, title, items, cls) => hint(n + ' ' + word, 'verd ' + (cls || 'n2'), hlist(title, items, true));
  const h1 = wk.length ? 'We\'re launching ' + num(wk.length, wk.length === 1 ? 'project' : 'projects', 'Launching by ' + md(wkEnd) + ' (click one to open it)', wk.map(it => li(it, esc(rng(it.eta))))) + ' this week' + (wk.length > 1 ? ', including ' + nm(wk[0]) + (wk[1] ? ' and ' + nm(wk[1]) : '') : wk.length === 1 ? ': ' + nm(wk[0]) : '') + '.'
    : 'Nothing launches this week' + (later.length ? '; next up is ' + nm(later.sort((a, b) => dueOf(a) - dueOf(b))[0]) + '.' : '.');
  const sub = [];
  // Short sentences, one fact each (Mike reads a run-on as noise).
  if (later.length && !late.length) sub.push('We have ' + num(later.length, 'more', 'Launching before the Nov 20 freeze (click one to open it)', later.map(it => li(it, esc(rng(it.eta))))) + ' to launch before the Nov 20 code freeze.');
  // The one to watch: the project furthest past its launch date, in red (Mike, Oct 27: the second line needs substance).
  if (late.length) { const w = late.slice().sort((a, b) => dueOf(a) - dueOf(b))[0], dd = Math.max(1, Math.round((today - dueOf(w)) / DAY)); sub.push('Keep an eye on ' + nm(w, 'w') + ' (' + dd + ' day' + (dd === 1 ? '' : 's') + ' late).'); }
  const days = Math.max(0, Math.round((FREEZE - parse(D.asOf)) / DAY));
  const nw = new Date(), td = Date.UTC(nw.getFullYear(), nw.getMonth(), nw.getDate()), wkStart = td - ((new Date(td).getUTCDay() + 6) % 7) * DAY;
  return '<p class="verdict">' + h1 + '</p>' + (sub.length ? '<p class="sulead">' + sub.map(ucf).join(' ') + '</p>' : '');
}
function abHeadline() {
  const live = (EXPS.live || []).filter(t => abSiteOk(testSite(t))), done = EXPS.done || [], soon = EXPS.soon || [], imp = t => siteImp(t.cvr.rel, t.reach);
  // Each running test hovers to a card: where it runs, day N, whole-site and in-test effect, a confidence bar to 95%, the primary metric.
  const card = t => { const c = t.p != null ? conf(t) : null, w = c == null ? 0 : Math.min(100, c);
    return '<div class="gtipc"><b class="gtt">' + testE(t.name) + ' ' + esc(t.name) + '</b><span class="cap">' + esc(t.where || '') + '</span><div class="gkv">' +
      '<span class="gk">Running</span><span class="gv">Day ' + testDays(t) + ' · since ' + short(t.start) + '</span>' +
      '<span class="gk">Whole site</span><span class="gv"><b class="' + (imp(t) >= 0 ? 'b' : 'w') + '">' + sgn(imp(t), 1) + '</b> CVR so far</span>' +
      '<span class="gk">In the test</span><span class="gv">' + sgn(t.cvr.rel, 1) + ' CVR for people who see it</span>' +
      (t.primary ? '<span class="gk">Primary metric</span><span class="gv">' + esc(t.primary.name || '') + ' ' + sgn(t.primary.rel, 1) + '</span>' : '') +
      '<span class="gk">Confidence</span><span class="gv"><span class="cfbar"><i style="width:' + w + '%"></i><em style="left:95%"></em></span>' + (c == null ? 'Too early to tell' : c < 50 ? 'Too early to tell (' + c + '%, needs 95%)' : c + '% (needs 95%)') + '</span></div><span class="segmore">Click for the full test →</span></div>'; };
  const tn = t => hint(esc(midCase(t.name)), 'verd n2 hlink" data-jt="' + esc(t.id), card(t));
  const li = (t, x) => '<li>' + testE(t.name) + ' <b>' + esc(t.name) + '</b>' + (x ? ': ' + x : '') + '</li>';
  const words = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const rpvOf = t => ((abRd(t).m || {}).rpv || {}).v, asOfD = parse(EXPS_AS_OF);
  const tps = (typeof TPEXPS !== 'undefined' && abSiteOk('TP') ? TPEXPS.items : []).map((x, i) => Object.assign({ tp: true, ix: i }, x)), all2 = live.concat(tps);
  const recent = all2.filter(t => (asOfD - parse(t.start)) / DAY <= 2).sort((p, q) => parse(q.start) - parse(p.start))[0];
  const next24 = (EXPS.soon || []).find(x => x.start && (parse(x.start) - asOfD) / DAY >= 0 && (parse(x.start) - asOfD) / DAY <= 1);
  const pool = live.filter(t => abRd(t).verdict[0] !== 'paused' && rpvOf(t) != null && t !== recent).sort((p, q) => rpvOf(q) - rpvOf(p));
  const promising = pool[0], latest = all2.slice().sort((p, q) => parse(q.start) - parse(p.start))[0];
  const L = t => t.tp ? '<span class="verd n2 hlink" role="link" tabindex="0" data-tpx="' + t.ix + '">' + esc(t.name) + '</span>' : t.id ? '<span class="verd n2 hlink" role="link" tabindex="0" data-jt="' + esc(t.id) + '">' + esc(t.name) + '</span>' : esc(t.name);
  const first = recent ? L(recent) + ' launched ' + short(recent.start) : promising ? L(promising) + ' is the most promising, at ' + sgn(rpvOf(promising), 1) + ' revenue per user' : all2.length ? L(latest) + ' started ' + short(latest.start) : '';
  const second = next24 ? esc(next24.name) + ' launches ' + short(next24.start) : recent ? (promising ? L(promising) + ' leads at ' + sgn(rpvOf(promising), 1) + ' revenue per user' : '') : (promising && latest && latest !== promising ? L(latest) + ' started ' + short(latest.start) : '');
  const up = soon.filter(x => abSiteOk(x.site)).slice(0, 2).map(x => esc(x.name)), won = done.filter(t => abSiteOk(testSite(t)) && t.status === 'shipped' && t.cvr && t.cvr.rel > 0).sort((p, q) => parse(q.end) - parse(p.end))[0];
  const subs = [up.length ? 'Up next: ' + up.join(' and ') + '.' : '', won ? 'Recently shipped: ' + L(won) + ' (' + sgn(won.cvr.rel, 1) + ' CVR).' : ''].filter(Boolean);
  return '<p class="verdict vtests">' + (first ? first + (second ? ', and ' + second : '') + '.' : 'No tests are running right now.') + '</p>' + (subs.length ? '<p class="sulead">' + subs.join(' ') + '</p>' : '');
}
function trHeadline() {
  const L = (typeof SLACK !== 'undefined' ? SLACK : []).slice(0, 2), tn = (s, k) => hint(esc(/^(TeePublic|Redbubble|Dashery|Google|Amazon|Apple|USA|Black|Meta)\b/.test(s.title) || !k ? s.title : s.title.charAt(0).toLowerCase() + s.title.slice(1)), 'verd n2 hlink" data-say="' + SLACK.indexOf(s), '<b>' + esc(s.title) + '</b><br>' + esc(s.tldr || sents(s.body)[0] || '') + '<span class="segmore">Click for the full read →</span>');
  const csAll = typeof CS !== 'undefined' && CS.tp && CS.rb ? ['rb', 'tp'].flatMap(b => (CS[b].topics || []).map(t => Object.assign({ b }, t))) : [];
  const csTop = csAll.sort((a, z) => (a.level === 'high' ? 0 : 1) - (z.level === 'high' ? 0 : 1))[0];
  const botFirst = L.length && /bot-squad/.test(L[0].channel || ''), h1 = L.length ? (botFirst ? 'Bot Squad update: ' : '') + tn(L[0], botFirst) + '.' : 'Nothing unusual in Slack lately.';
  const hot = ((typeof TRENDS !== 'undefined' && TRENDS.tags) || []).filter(t => t[2] >= 2).sort((a, z) => z[2] - a[2]).slice(0, 1), lbl = t => t[0].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').replace(/^Wutang/, 'Wu-Tang');
  const sub = hot.length ? andJoin(hot.map(t => hint(esc(lbl(t)), 'verd b', '<b>' + esc(lbl(t)) + '</b><div class="gkv"><span class="gk">Orders, 24 hours</span><span class="gv">' + t[1] + '</span><span class="gk">vs its usual share</span><span class="gv">' + t[2].toFixed(1) + '×</span></div>') + ' designs are selling ' + t[2].toFixed(1) + '× usual')) + '.' : '';
  // Tags, design agency Oct 27: what the selling data covers (as a kind of day, not a date), where the talk comes from, and the customer service read. Nothing the sentence already says.
  const dayKind = ((TOPS.window || '').match(/\((?:full day, )?([^)]*)\)/) || [])[1] || '', csN = csAll.filter(t => t.level === 'high').length;
  const trTags = ctxTags([dayKind ? '🛍️ Top sellers from the ' + esc(dayKind) : '🛍️ Top sellers from the latest full day', '💬 Slack, the last 48 hours', csN ? '🎧 Customer service: ' + csN + ' issue' + (csN === 1 ? '' : 's') + ' flagged' : '🎧 Customer service: all clear']);
  return '<p class="verdict">' + h1 + '</p>' + (sub ? '<p class="sulead">' + ucf(sub) + '</p>' : '');
}
// Earlier tests as cards (Mike, Oct 27), Amplitude Experiment and Search (Sigma) tests together, newest first.
// Recently shipped and Coming soon share the main table's look (Mike, Oct 30): same header, rows and name cell.
const erSite = s => /tee/i.test(s || '') ? 'TP' : /both/i.test(s || '') ? 'Both' : 'RB';
const sitePill = code => '<span class="rtag sitepill"' + (code === 'RB' || code === 'TP' ? ' data-absite="' + code + '" role="button" tabindex="0"' : '') + '>' + siteDot(code) + '</span>';
const erName = (name, team, site) => '<span class="tname tnico"><span class="ge gico g-CVR" aria-hidden="true">' + projIco({ t: name, obj: 'CVR' }) + '</span><b>' + esc(name) + '</b><span class="cap tmeta">' + sitePill(erSite(site)) + '</span></span>';
function shippedHtml() {
  const cut = addDays(EXPS_AS_OF, -60), sx = (typeof SEXP !== 'undefined' ? SEXP.items : []);
  const dash = '<span class="abtbd"><b>TBD</b><small>not recorded</small></span>', tbd = '<span class="abst tbd">TBD</span>', dayC = d => '<span class="abday"><b>' + short(d) + '</b><small>ended</small></span>';
  const D1 = (abSiteOk('RB') ? EXPS.done || [] : []).map(t => ({ end: t.end, html: testRow(t) }));
  const A = (abSiteOk('RB') ? EXPS.older : []).map((o, i) => ({ end: o.end, html: '<div class="rowwrap"><div class="trow abrow" role="button" tabindex="0" data-told="' + i + '">' + erName(o.name, 'customer', 'Redbubble') + dayC(o.end) + tbd + dash + dash + '<span class="abcall"><span class="abv2 ' + (o.status === 'shipped' ? 'v-ship' : '') + '">' + (o.status === 'shipped' ? 'Shipped' : 'Kept control') + '</span></span><span class="chev" aria-hidden="true">›</span></div></div>' }));
  const B = sx.filter(x => abSiteOk(x.site)).map(x => ({ end: x.end, html: '<div class="rowwrap"><a class="trow abrow erow2" href="' + esc(SEXP.url) + '" target="_blank" rel="noopener">' + erName(x.name, 'search', x.site) + dayC(x.end) + tbd + dash + dash + '<span class="abcall"><span class="abv2 ' + (x.verdict === 'win' ? 'v-ship' : '') + '">' + (x.verdict === 'win' ? 'Clear winner' : x.verdict === 'loss' ? 'Clear loser' : 'Inconclusive') + '</span></span><span class="chev" aria-hidden="true">↗</span></a></div>' }));
  const all = D1.concat(A, B).filter(x => x.end >= cut).sort((p, q) => p.end < q.end ? 1 : -1);
  return all.length ? '<div class="group"><div class="ghead"><h3>Recently shipped</h3><span class="sfacts">' + all.length + ' tests</span></div>' + ABHEAD + '<div class="rows">' + all.map(x => x.html).join('') + '</div></div>' : '';
}
function soonHtml() {
  return '<div class="group"><div class="ghead"><h3>Coming soon</h3><span class="sfacts">' + EXPS.soon.filter(x => abSiteOk(x.site)).length + ' queued</span></div><div class="tcols stc"><span>Test</span><span>Where</span><span>When</span><span>What it tests</span><span></span></div><div class="rows">' + EXPS.soon.map((x, i) => !abSiteOk(x.site) ? '' : '<div class="rowwrap"><div class="trow strow" role="button" tabindex="0" data-tsoon="' + i + '">' + erName(x.name, x.team || 'customer', x.site) + '<span class="erlt">' + esc(x.where) + '</span><span class="erlt">' + esc(x.when) + '</span><span class="erlt">' + esc(x.what) + '</span><span class="chev" aria-hidden="true">›</span></div></div>').join('') + '</div></div>';
}
function searchTestsHtml() {
  if (typeof SEXP === 'undefined' || !SEXP.items.length) return '';
  const RULES = '<b>How to read Search tests</b><ul class="hul nrul"><li>🔎 <b>All search types combined</b> unless a type is named.</li><li>🤷 <b>No stat sig means inconclusive</b>, not "no effect".</li><li>⚖️ <b>Stat sig is not a decision:</b> weigh the size of the change, guardrails and the test\'s goal.</li><li>📋 <b>Some tests read differently:</b> check the test plan before quoting numbers.</li><li>💬 <b>Surprising result?</b> Ask the Search and Content team before sharing it.</li></ul>';
  const card = x => { const verd = x.verdict === 'win' ? ['🟢', 'Clear winner'] : x.verdict === 'loss' ? ['🔴', 'Clear loser'] : ['🤷', 'Inconclusive: no variant reached stat sig'];
    const row = v => '<li><span>' + esc(v[0]) + '</span><b class="' + (v[2] != null && v[2] <= 0.05 ? (v[1] > 0 ? 'b' : 'w') : '') + '">' + sgn(v[1], 1) + '</b>' + (v[2] != null ? '<span class="cap">' + (v[2] <= 0.05 ? 'stat sig' : 'not stat sig') + '</span>' : '') + '</li>';
    return '<article class="stcard"><div class="stch"><span class="tse" aria-hidden="true">' + x.e + '</span><div><b>' + esc(x.name) + '</b><span class="cap">' + esc(x.site) + ' · ' + short(x.start) + ' to ' + short(x.end) + ' · ' + int(x.users) + ' people</span></div></div>' +
      '<p class="stw">' + esc(x.what) + '</p><p class="stv">' + verd[0] + ' <b>' + verd[1] + '</b></p>' +
      '<div class="stm"><span class="lbl">' + esc(x.metric) + ' vs control (' + pct(x.base, 1) + ')</span><ul>' + x.vars.map(row).join('') + '</ul></div>' +
      (x.second || []).map(s2 => '<div class="stm sec"><span class="lbl">' + esc(s2[0]) + '</span><ul>' + s2[1].map(row).join('') + '</ul></div>').join('') + '</article>'; };
  return '<div class="group"><div class="ghead"><h3>Search tests</h3><span class="sfacts">' + hint('From Sigma · how to read these', 'sfact', RULES) + ' · <a href="' + SEXP.url + '" target="_blank" rel="noopener">Open in Sigma ↗</a></span></div><div class="stgrid">' + SEXP.items.map(card).join('') + '</div></div>';
}
function sayList(list, max) {
  const tone = { bad: 'bad', warn: 'warn', good: 'good' };
  return '<div class="say4">' + (list || SLACK).slice(0, max || 4).map(s =>
    '<article class="scard ' + (tone[s.tone] || 'warn') + '" role="button" tabindex="0" data-say="' + SLACK.indexOf(s) + '"><div class="schd"><h4><span class="scic" aria-hidden="true">' + s.icon + '</span><span>' + esc(s.title) + '</span></h4><span class="sctags"><span class="stat-chip ' + (tone[s.tone] || 'warn') + '">' + esc(s.status) + '</span>' + (s.site ? '<span class="scmeta">' + esc(SITE[s.site] || s.site) + '</span>' : '') + (s.fx && /^(yes|partly)/i.test(s.fx) ? '<span class="scmeta" title="' + esc(s.fx) + '">Shows up in the CVR numbers</span>' : '') + '</span></div>' +
    '<p title="' + esc(s.body + ' ' + s.why) + '">' + boldKey(s.body) + '</p>' +

    '<div class="scft"><span class="cap">' + esc(s.channel) + ' · ' + esc(s.when) + '</span>' + refsHtml((s.refs || []).slice(0, 1)) + '</div></article>').join('') + '</div>';
}

/* ---------- scorecard ---------- */
// Hover-card chart (Mike, Oct 28: "that little downward trend line doesn't mean much without an x- and y-axis"): the last six weeks
// (stretched back to reach the comparison days), min and max labeled on the left, first and last dates below, the comparison days
// as blue dots, their average as a dotted line, and the day being read as the colored dot.
// Overview chart as a comparison, not a line (Mike, Oct 28): one bar per comparable day, their average, the normal band around it,
// and the day itself as the last bar in its grade color. Different shape from the 90-day chart, so it reads as a verdict, not a trend.
function cmpBars(m, bd, bv, tone, bw) {
  const S = SER[m.b], days = (bd || []).filter(z => S.idx[z] != null && m.v[S.idx[z]] != null), si = S.idx[state.day];
  if (!days.length || bv == null || si == null || m.v[si] == null) return '';
  const W = 560, H = 200, L = 44, R = 12, T = 14, B = 34, today = m.v[si], band = bw ? [bv * (1 - bw), bv * (1 + bw)] : null;
  const top = Math.max(today, ...days.map(z => m.v[S.idx[z]]), band ? band[1] : bv) * 1.12;
  const step = niceStep(top, isNum(m) ? [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000] : [0.001, 0.0025, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2], 4), mx = Math.ceil(top / step) * step;
  const y = v => T + (H - T - B) * (1 - v / mx), n = days.length + 1, gap = 0.9, slot = (W - L - R) / (n + gap), bwid = Math.min(54, slot * 0.56);
  const cx = k => L + slot * (k + 0.5) + (k === n - 1 ? slot * gap : 0), col = tone === 'bad' ? 'var(--bad)' : tone === 'good' ? 'var(--good)' : 'var(--ctl)';
  const fmtY = v => isNum(m) ? compact(v, m.fmt === 'usd') : (v * 100).toFixed(step < 0.01 ? 1 : 0) + '%';
  const bar = (x, v, fill, cls) => { const yt = y(v), yb = H - B, r = Math.min(5, (yb - yt) / 2), x0 = x - bwid / 2, x1 = x + bwid / 2;
    return '<path class="' + cls + '" d="M' + x0.toFixed(1) + ' ' + yb + 'V' + (yt + r).toFixed(1) + 'Q' + x0.toFixed(1) + ' ' + yt.toFixed(1) + ' ' + (x0 + r).toFixed(1) + ' ' + yt.toFixed(1) + 'H' + (x1 - r).toFixed(1) + 'Q' + x1.toFixed(1) + ' ' + yt.toFixed(1) + ' ' + x1.toFixed(1) + ' ' + (yt + r).toFixed(1) + 'V' + yb + 'Z" style="fill:' + fill + '"/>'; };
  let g = '';
  for (let v = 0, k = 0; v <= mx + 1e-9 && k < 12; v += step, k++) g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '" class="tcg"/><text x="' + (L - 6) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end" class="tct">' + fmtY(v) + '</text>';
  if (band) { const yt = y(band[1]), yb = y(band[0]); g += '<rect x="' + L + '" y="' + yt.toFixed(1) + '" width="' + (W - L - R) + '" height="' + (yb - yt).toFixed(1) + '" class="tcband"/><line x1="' + L + '" x2="' + (W - R) + '" y1="' + yt.toFixed(1) + '" y2="' + yt.toFixed(1) + '" class="tcbl"/><line x1="' + L + '" x2="' + (W - R) + '" y1="' + yb.toFixed(1) + '" y2="' + yb.toFixed(1) + '" class="tcbl"/>'; }
  const sep = (cx(n - 2) + cx(n - 1)) / 2;
  g += '<line x1="' + sep.toFixed(1) + '" x2="' + sep.toFixed(1) + '" y1="' + T + '" y2="' + (H - B + 4) + '" class="cbsep"/>';
  days.forEach((z, k) => { const v = m.v[S.idx[z]]; g += bar(cx(k), v, 'color-mix(in srgb, var(--ctl) 55%, var(--surface))', 'cbbar') + '<text x="' + cx(k).toFixed(1) + '" y="' + (y(v) - 6).toFixed(1) + '" text-anchor="middle" class="cbv">' + fmtVal(m, v) + '</text><text x="' + cx(k).toFixed(1) + '" y="' + (H - B + 16) + '" text-anchor="middle" class="tct">' + short(z) + '</text>'; });
  const tx = cx(n - 1);
  g += bar(tx, today, col, 'cbbar today') + '<text x="' + tx.toFixed(1) + '" y="' + (y(today) - 6).toFixed(1) + '" text-anchor="middle" class="cbv cbt" style="fill:' + col + '">' + fmtVal(m, today) + '</text><text x="' + tx.toFixed(1) + '" y="' + (H - B + 16) + '" text-anchor="middle" class="tct cbt">' + short(state.day) + '</text><text x="' + tx.toFixed(1) + '" y="' + (H - B + 29) + '" text-anchor="middle" class="tct">' + sgn(today / bv - 1, 0) + '</text>';
  g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(bv).toFixed(1) + '" y2="' + y(bv).toFixed(1) + '" class="cbavg"/>';
  // Each bar hovers: its date, what kind of day, its number.
  const hit = (x, z, v, tag) => hint('', 'tdot', '<b>' + label(z) + '</b><br>' + esc(dayKind(m.b, z)) + '<br>' + esc(tipName(m)) + ': <b>' + fmtVal(m, v) + '</b><br><span class="cap">' + tag + '</span>').replace('<span ', '<rect x="' + (x - slot / 2).toFixed(1) + '" y="' + T + '" width="' + slot.toFixed(1) + '" height="' + (H - B - T + 20) + '" ').replace('></span>', '/>');
  days.forEach((z, k) => { g += hit(cx(k), z, m.v[S.idx[z]], '🎯 A comparison day for ' + short(state.day)); });
  g += hit(tx, state.day, today, '📍 The day you\'re reading: ' + sgn(today / bv - 1, 0) + ' vs the average (' + fmtVal(m, bv) + ')');
  const key = '<span class="tckey"><span><i class="tk-cbar"></i>Comparison days</span><span><i class="tk-day" style="background:' + col + '"></i>' + short(state.day) + '</span><span><i class="tk-avg"></i>Average ' + fmtVal(m, bv) + '</span>' + (band ? '<span><i class="tk-band"></i>Normal range</span>' : '') + '</span>';
  return '<span class="tchart tcfull cbars">' + key + '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true">' + g + '</svg></span>';
}
function tipChart(m, bd, bv, tone, opt) {
  opt = opt || {};
  const S = SER[m.b], si = S.idx[state.day]; if (si == null) return '';
  const bi = (bd || []).map(z => S.idx[z]).filter(i => i != null && m.v[i] != null), i0 = Math.max(0, Math.min(si - 41, ...(bi.length ? bi.map(i => i - 3) : [si - 41])));
  const idx = []; for (let i = i0; i <= si; i++) if (m.v[i] != null) idx.push(i);
  if (idx.length < 3) return '';
  const band = opt.band && bv != null ? [bv * (1 - opt.band), bv * (1 + opt.band)] : null;
  const vals = idx.map(i => m.v[i]).concat(bv != null ? [bv] : [], band || []), mn0 = Math.min(...vals), mx0 = Math.max(...vals);
  // The page chart gets real y gridlines, like the 90-day chart (Mike, Oct 28); hover charts keep min and max.
  const FULL = opt.dots || opt.full, ystep = FULL ? niceStep((mx0 - mn0) || mx0 || 1, isNum(m) ? [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000, 2000000] : [0.001, 0.0025, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2], 4) : 0, mn = FULL ? Math.max(0, Math.floor(mn0 / ystep) * ystep) : mn0, mx = FULL ? Math.ceil(mx0 / ystep) * ystep : mx0;
  const W = opt.w || 280, H = opt.h || 96, L = 40, R = 8, T = FULL ? 10 : 8, B = FULL ? 34 : 20, x = i => L + (W - L - R) * (i - i0) / (si - i0), y = v => T + (H - T - B) * (1 - (v - mn) / ((mx - mn) || 1));
  const col = tone === 'bad' ? 'var(--bad)' : tone === 'good' ? 'var(--good)' : 'var(--ctl)';
  let g = '';
  if (FULL) { for (let v = mn, k = 0; v <= mx + 1e-9 && k < 12; v += ystep, k++) g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '" class="tcg"/><text x="' + (L - 6) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end" class="tct">' + (isNum(m) ? compact(v, m.fmt === 'usd') : (v * 100).toFixed(ystep < 0.01 ? 1 : 0) + '%') + '</text>';
    for (let i = si; i >= i0; i -= 14) g += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 4) + '" text-anchor="' + (i === si ? 'end' : 'middle') + '" class="tct">' + short(S.dates[i]) + '</text>';
    for (let i = i0; i <= si; i++) if (infoNow(m.b, S.dates[i]).sale) g += '<rect x="' + (x(i) - (W - L - R) / (si - i0) / 2 + 0.5).toFixed(1) + '" y="' + (H - B + 5) + '" width="' + Math.max(1, (W - L - R) / (si - i0) - 1).toFixed(1) + '" height="4" rx="1" style="fill:' + BR[m.b].strip + '"/>'; }
  else g = '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(mx).toFixed(1) + '" y2="' + y(mx).toFixed(1) + '" class="tcg"/><line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(mn).toFixed(1) + '" y2="' + y(mn).toFixed(1) + '" class="tcg"/>' +
    '<text x="' + (L - 6) + '" y="' + (y(mx) + 4).toFixed(1) + '" text-anchor="end" class="tct">' + fmtVal(m, mx) + '</text><text x="' + (L - 6) + '" y="' + (y(mn) + 4).toFixed(1) + '" text-anchor="end" class="tct">' + fmtVal(m, mn) + '</text>' +
    '<text x="' + L + '" y="' + (H - 4) + '" class="tct">' + short(S.dates[i0]) + '</text><text x="' + (W - R) + '" y="' + (H - 4) + '" text-anchor="end" class="tct">' + short(state.day) + '</text>';
  for (let i = i0; i <= si; i++) if (infoNow(m.b, S.dates[i]).sale) g += '<rect x="' + (x(i) - (W - L - R) / (si - i0) / 2).toFixed(1) + '" y="' + T + '" width="' + ((W - L - R) / (si - i0)).toFixed(1) + '" height="' + (H - T - B) + '" class="tcs" style="fill:' + BR[m.b].band + '"/>';
  // The normal range drawn as a band around the comparison average: the same blue band as the range bar, over time (Mike, Oct 28).
  if (band) { const yt = y(band[1]).toFixed(1), yb = y(band[0]).toFixed(1); g += '<rect x="' + L + '" y="' + yt + '" width="' + (W - L - R) + '" height="' + (yb - yt).toFixed(1) + '" class="tcband"/><line x1="' + L + '" x2="' + (W - R) + '" y1="' + yt + '" y2="' + yt + '" class="tcbl"/><line x1="' + L + '" x2="' + (W - R) + '" y1="' + yb + '" y2="' + yb + '" class="tcbl"/>'; } // a stripe edge to edge, so it reads as a vertical range only (Mike, Oct 28)
  if (opt.sess && m.sess) { const sv = idx.map(i => m.sess[i] || 0), smx = Math.max(...sv) * 1.1 || 1, ys = v => (H - B) - (H - B - T) * v / smx; g += '<path d="M' + x(idx[0]).toFixed(1) + ' ' + (H - B) + idx.map(i => 'L' + x(i).toFixed(1) + ' ' + ys(m.sess[i] || 0).toFixed(1)).join('') + 'L' + x(idx[idx.length - 1]).toFixed(1) + ' ' + (H - B) + 'Z" style="fill:var(--sess);opacity:.16"/>'; }
  g += '<polyline points="' + idx.map(i => x(i).toFixed(1) + ',' + y(m.v[i]).toFixed(1)).join(' ') + '" style="fill:none;stroke:var(--ink-2, var(--muted));stroke-width:1.5;stroke-linejoin:round"/>';
  if (bv != null && bi.length) g += '<line x1="' + x(Math.min(...bi)).toFixed(1) + '" x2="' + x(si).toFixed(1) + '" y1="' + y(bv).toFixed(1) + '" y2="' + y(bv).toFixed(1) + '" style="stroke:var(--ctl);stroke-width:1.5;stroke-dasharray:1 3;stroke-linecap:round"/>';
  // Each dot explains itself on hover: the date, what kind of day it was, its number (Mike, Oct 28).
  const dtip = (i, lab) => { if (!opt.dots) return ''; const dd = S.dates[i]; return hint('', 'tdot', '<b>' + label(dd) + '</b><br>' + esc(dayKind(m.b, dd)) + '<br>' + esc(tipName(m)) + ': <b>' + fmtVal(m, m.v[i]) + '</b>' + (lab ? '<br><span class="cap">' + lab + '</span>' : '')); };
  // Back to the original look (Mike, Oct 28): solid blue circles with a soft blue halo breathing around them; no white ring. The day's own dot does the same in its color.
  bi.forEach(i => { const cx = x(i).toFixed(1), cy = y(m.v[i]).toFixed(1); g += '<circle cx="' + cx + '" cy="' + cy + '" r="8" class="cmpglow"/><circle cx="' + cx + '" cy="' + cy + '" r="4.2" style="fill:var(--ctl)"/>'; });
  g += '<circle cx="' + x(si).toFixed(1) + '" cy="' + y(m.v[si]).toFixed(1) + '" r="8" class="cmpglow today" style="fill:color-mix(in srgb, ' + col + ' 26%, transparent)"/><circle cx="' + x(si).toFixed(1) + '" cy="' + y(m.v[si]).toFixed(1) + '" r="4.5" style="fill:' + col + '"/>';
  // Every day hovers on the page chart (Mike, Oct 28): its date, what kind of day, its CVR, and whether it's a comparison day.
  if (opt.dots) { const cw = (W - L - R) / Math.max(1, si - i0); idx.forEach(i => { const dd = S.dates[i], tag = i === si ? '📍 The day you\'re reading' + (bv != null ? ': ' + sgn(m.v[i] / bv - 1, 0) + ' vs the comparison average (' + fmtVal(m, bv) + ')' : '') : bi.indexOf(i) >= 0 ? '🎯 A comparison day for ' + short(state.day) : ''; g += hint('', 'tdot', '<b>' + label(dd) + '</b><br>' + esc(dayKind(m.b, dd)) + '<br>' + esc(tipName(m)) + ': <b>' + fmtVal(m, m.v[i]) + '</b>' + (tag ? '<br><span class="cap">' + tag + '</span>' : '')).replace('<span ', '<rect x="' + (x(i) - cw / 2).toFixed(1) + '" y="' + T + '" width="' + cw.toFixed(1) + '" height="' + (H - B - T) + '" ').replace('></span>', '/>'); }); }
  const svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true">' + g + '</svg>', key = '<span class="tckey"><b class="tcspan">Last ' + (si - i0 + 1) + ' days</b><span><i class="tk-day" style="background:' + col + '"></i>' + short(state.day) + '</span>' + (bi.length ? '<span><i class="tk-cmp"></i>Comparison days</span>' : '') + (band ? '<span><i class="tk-band"></i>Normal range</span>' : '') + (opt.sess ? '<span><i class="tk-sess"></i>Sessions</span>' : '') + '<span><i class="tk-sale" style="background:' + BR[m.b].band + ';box-shadow:inset 0 -3px 0 ' + BR[m.b].strip + '"></i>Sale days</span></span>';
  return '<span class="tchart' + (FULL ? ' tcfull' : '') + '">' + (FULL ? key + svg : svg + key) + '</span>'; // the page chart has its key above, like the 90-day chart (Mike, Oct 28)
}
// The day and its comparison set, as two short lines for hover cards (Mike, Oct 28: include the dates the baseline uses).
// The day's sale status is a tag at the top of the hover now (dayTag), not a line here (Mike, Oct 28).
const dayTag = b => '<span class="tiptag' + (infoNow(b, state.day).sale ? '' : ' off') + '">🏷️ ' + short(state.day) + ': ' + esc(dayKind(b, state.day)) + '</span>';
const cmpLines = (b, bd, bv, m) => (bd && bd.length ? '<li>🎯 <b>Compared with:</b> ' + esc(cmpKind(b, state.day, bd.length)) + ' (' + bd.map(z => short(z)).join(', ') + ')' + (bv != null && m ? ', avg <b>' + fmtVal(m, bv) + '</b>' : '') + '</li>' + cmpHow(b) : '');
// How comparable days are picked, in plain words (Allison, Oct 28: "how is the baseline determined? what is the source? what are the data ranges?").
const cmpHow = b => { const st = infoNow(b, state.day); return '<li>🧭 <b>How they\'re picked:</b> ' + (st.sale ? 'the same point in a sale, at the same discount when possible' : (EDGEN[edgeOf(b, state.day)] ? 'other ' + EDGEN[edgeOf(b, state.day)].replace('day', 'days') : 'the same weekday with no sale')) + ', since ' + short(BASE_START) + '. Odd days left out.</li>'; }; /* about a third of the old length (Mike, Oct 28) */
function spark(m, j) {
  const S = SER[m.b], n = S.dates.length, end = S.idx[D.asOf], vals = m.v.slice(0, end + 1), w = 110, h = 28, p = 3;
  const mn = Math.min(...vals), mx = Math.max(...vals), x = i => p + (w - 2 * p) * i / (vals.length - 1), y = v => p + (h - 2 * p) * (1 - (v - mn) / ((mx - mn) || 1));
  const col = j && j.mat === 'bad' ? 'var(--bad)' : j && j.mat === 'good' ? 'var(--good)' : 'var(--faint)', si = S.idx[state.day];
  return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><polyline points="' + vals.map((v, i) => x(i).toFixed(1) + ',' + y(v).toFixed(1)).join(' ') + '" style="fill:none;stroke:' + col + ';stroke-width:1.5;stroke-linejoin:round"/>' + (si != null ? '<circle cx="' + x(si).toFixed(1) + '" cy="' + y(vals[si]).toFixed(1) + '" r="2.8" style="fill:' + (col === 'var(--faint)' ? 'var(--ink)' : col) + '"/>' : '') + '</svg>';
}
function rowHtml(m) {
  const { d, sale } = dayOf(), comps = compsFor(m.b, d), c = cellsFor(m, d, comps), open = state.open.has(m.key);
  const chg = k => {
    const x = c[k];
    return '<div class="chg"><span class="mlabel">' + KIND[k].col + '</span><span class="n">' + (x == null ? naCell(m, d, k, comps) : k === 'bs' ? bsCell(m, c, comps, d) : k === 'yoy' && yoyBot(x) ? hint(sgn(x) + '<span class="ybot">🤖 Likely bots</span>', 'ybh', YOYBOT_TIP) : sgn(x)) + '</span>' + (x == null ? '' : mkFor(m, k, c, comps, d, { short: true })) + '</div>';
  };
  const x = crossRead(m, d), ob = BR[BR[m.b].other];
  const ov = m === metricsFor(m.b).overall[0] ? null : crossRead(metricsFor(m.b).overall[0], d), same = x && ov && x.rel === ov.rel && x.rel !== 'noisy' && x.rel !== 'quiet';
  // Only say something when it adds to the headline: the site's own CVR row, or a row that differs from it. Everything else stays blank.
  const rtag = x && !same && x.rel !== 'quiet' && x.rel !== 'noisy' ? '<button class="rbtag ' + x.rel + '" data-cmp="' + esc(m.key) + '" data-from="' + m.b + '"><i></i>' + CROSS_TAG(x, m) + '</button>' : '<span class="rbnone"></span>';
  const surge = c.sessBs != null && Math.abs(c.sessBs) >= 0.25;
  const ss = m.isSess || m.isRev || c.sess == null ? '<div class="ss"></div>' : '<div class="ss"><span class="mlabel">Sessions</span><span class="n">' + int(c.sess) + '</span>' + '<span class="' + (surge ? 'surge' : 'cap') + '">' + (c.sessBs == null ? '' : sgn(c.sessBs, 0) + ' vs comparable days') + '</span></div>';
  const nrb = c.bs != null && !c.custom && nrOf(m, c.bs).st === 'lo'; // red only: green rows made too much color (Mike, Oct 28)
  let h = '<div class="rowwrap"><div class="row' + (nrb ? ' nrbad' : '') + '" role="button" tabindex="0" aria-expanded="' + open + '" data-row="' + esc(m.key) + '"><span class="name"><span class="e">' + em(m.label) + '</span>' + esc(m.label) + alertBadge(m.key) + '</span><span class="v">' + fmtVal(m, c.val) + '</span>' + chg('bs') + '<span class="spark">' + spark(m, c.custom || c.bs == null ? null : { mat: nrOf(m, c.bs).st === 'lo' ? 'bad' : nrOf(m, c.bs).st === 'hi' ? 'good' : null }) /* the line's color is the row's own grade, vs comparable days (Allison and Mike, Oct 28); it used to grade a hidden vs-last-month comparison */ + '</span>' +
    KINDS(m.b).filter(k => k !== 'bs' && k !== 'pd').map(chg).join('') /* prior day lives in the expanded row (Mike, Oct 28) */ + ss + '<span class="rbc">' + rtag + '</span><span class="chev" aria-hidden="true">▾</span></div>';
  if (open) h += '<div class="detail">' + detailHtml(m) + '</div>';
  return h + '</div>';
}
function baselineLine(m) {
  const extra = m.b === 'rb' && /Direct|Paid Search|Paid Social|Email|Organic/.test(m.label) ? ' Redbubble channel tags are broken (DEAP-5099), so read channel rows loosely.' : m.b === 'rb' && m.label === 'Checkout completion rate' ? ' The cart shipping test stepped checkout completion down from Aug 17 to Sep 8.' : '';
  return '<div class="baseline"><b>How to read the columns:</b> vs prior day is the day before, shown for context and never graded. Vs baseline averages every matching day since ' + short(BASE_START) + ' (the same point in a sale at the same discount, or the same weekday). Cells turn green or red when a change passes this section\'s threshold.' + extra + '</div>';
}
/* bot squad notes: dated bot-traffic events from the Bot Squad channel, matched to this site and metric */
// Key releases for a site: shipped wins with a date (from #released, the standup and Jira), the ones worth marking on the chart.
const RMON = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
function relFor(b) {
  const code = b === 'tp' ? 'TP' : 'RB';
  const w = ((typeof COMING !== 'undefined' && COMING.wins) || []).filter(w => w.site === code && /^[A-Z][a-z]{2} \d{1,2}$/.test(w.when || '')).map(w => { const [mo, dd] = w.when.split(' '); return { date: '2026-' + String(RMON[mo] + 1).padStart(2, '0') + '-' + String(+dd).padStart(2, '0'), t: w.t, imp: w.imp }; });
  const r = (typeof RELN !== 'undefined' ? RELN : []).filter(x => x.site === b || x.site === 'both');
  // One marker per day: the #released list first, then any win it doesn't already cover.
  return r.concat(w.filter(x => !r.some(y => y.date === x.date))).sort((a, z) => a.date < z.date ? -1 : 1);
}
function botFor(m) {
  if (typeof BOTN === 'undefined') return [];
  const S = SER[m.b], d0 = S.dates[0], d1 = S.dates[S.dates.length - 1];
  return BOTN.filter(e => (e.site === m.b || e.site === 'both') && (botHas(e, m.key) || ((m.sec === 'overall' || m.sec === 'funnel') && !m.isRev && e.metrics.indexOf('overall') >= 0)) && (e.end || e.date) >= d0 && e.date <= d1);
}
// Bot-related notes always show 🤖, so it's clear at a glance; notes that turned out not to be bots keep their own icon (Mike, Oct 26).
const bIcon = e => e.bot === false ? (e.emoji || '📈') : '🤖';
const botOn = (e, d) => d >= e.date && d <= (e.end || e.date);
function botHtml(m) {
  const ev = botFor(m).slice().sort((a, z) => z.date < a.date ? -1 : 1); if (!ev.length) return '';
  const row = e => '<li><span class="bnd">' + short(e.date) + (e.end ? '–' + short(e.end) : '') + '</span><div><b>' + (e.emoji || bIcon(e)) + ' ' + esc(e.short || e.title) + ':</b> ' + esc(e.sum || e.note) + (e.link ? ' <a href="' + esc(e.link) + '" target="_blank" rel="noopener">Slack ↗</a>' : '') + '</div></li>';
  const top = ev.slice(0, 3), more = ev.slice(3);
  return '<div class="botnotes bwlist"><span class="lbl">🤖 Bot traffic notes from the Bot Squad</span><p class="bnsub">Dated markers on the chart above. These events move sessions and CVR without any change in shopper behavior.</p><ul>' + top.map(row).join('') + '</ul>' +
    (more.length ? '<details><summary>' + more.length + ' earlier note' + (more.length > 1 ? 's' : '') + '</summary><ul>' + more.map(row).join('') + '</ul></details>' : '') + '</div>';
}
// The day's normal-range read, right-aligned in the chart's control row, with the same hover as the row (Mike, Oct 27).
function detailRange(m) {
  const { d } = dayOf(), comps = compsFor(m.b, d), c = cellsFor(m, d, comps); if (c.bs == null || !comps.bs) return '';
  const r = nrOf(m, c.bs); if (!r) return '';
  return '<span class="nrpanel nr' + r.st + ' dnr">' + hint('<span class="nrp1"><b>' + sgn(c.bs, 0) + '</b> vs comparable days, ' + (r.st === 'in' ? 'within' : r.st === 'hi' ? 'above' : 'below') + ' normal range</span>' + nrBarH(c.bs, r.w), 'nrph', nrTip(m, c.bs, c.bsV, c.val, comps.bs.dates)) + '</span>';
}
// Expanded row: the prior day, as context (it left the row, Mike, Oct 28). The comparable-days read is already on the row, so it isn't repeated here.
function detailPrior(m) { const d = state.day, c = cellsFor(m, d, compsFor(m.b, d)); return c.pd == null ? '' : '<span class="dprior"><span class="lbl">vs prior day, ' + short(addDays(d, -1)) + '</span> <b>' + sgn(c.pd, 1) + '</b> <span class="cap">' + fmtVal(m, c.pdV) + ' → ' + fmtVal(m, c.val) + ', context only</span></span>'; }
function detailHtml(m) {
  const sessOn = !state.sessOff.has(m.key), ob = BR[BR[m.b].other].name;
  const leg = '<div class="legend"><span><i class="sw" style="background:' + BR[m.b].color + '"></i>' + esc(m.axis) + '</span>' + (m.ly ? '<span><i class="sw dash"></i>Same weekday last year</span>' : '') + (sessOn ? '<span><i class="sw blk" style="background:var(--sess);opacity:.5"></i>Sessions per day</span>' : '') + '<span><i class="sw blk" style="background:' + BR[m.b].band + ';outline:1px solid ' + BR[m.b].strip + '"></i>Sale days</span></div>';
  // By product: a geo toggle on the chart (Mike, Oct 27).
  const GN = { all: 'All', US: 'USA', GB: 'UK', AU: 'Australia', CA: 'Canada', DE: 'Germany', FR: 'France', NZ: 'New Zealand' }, pg = (state.pgeo || {})[m.key] || 'all';
  const geoTog = m.pgeo && Object.keys(m.pgeo).length ? '<div class="segs pgeo" role="group" aria-label="Country">' + ['all'].concat(Object.keys(m.pgeo)).map(g => '<button type="button" data-pgeo="' + esc(m.key + '|' + g) + '" aria-pressed="' + (pg === g) + '">' + (GN[g] || g) + '</button>').join('') + '</div>' : '';
  const gs = pg !== 'all' && m.pgeo && m.pgeo[pg] ? (m.pgeo[pg].s || []).filter(x => x != null).slice(-14).sort((x, y) => x - y) : [], thin = gs.length && gs[Math.floor(gs.length / 2)] < 100;
  return '<div class="devtop"><div class="devl"><div class="dhead"><div class="dtitle"><h4>' + em(m.label) + ' ' + esc(m.label) + ' <span>' + BR[m.b].name + (pg !== 'all' ? ', ' + (GN[pg] || pg) : '') + ', last 90 days</span></h4><p class="dsub">' + esc(defOf(m)) + (thin ? ' <b>Under 100 product-page viewers a day here, so daily swings are mostly noise.</b>' : '') + '</p></div><div class="dbtns">' + geoTog +
    (m.sess && !m.isSess ? '<button type="button" class="swtog" role="switch" data-sesstog="' + esc(m.key) + '" aria-checked="' + sessOn + '"><span class="trk"><span class="knb"></span></span>Sessions</button>' : '') +
    '<button type="button" class="actbtn" data-cmp="' + esc(m.key) + '" data-from="' + m.b + '">👀 Compare with ' + ob + '</button>' + detailPrior(m) + '</div></div></div>' + sibHtml(m) + '</div>' + leg +
    '<div class="chart" data-chart="' + esc(m.key) + '"></div>' + '<div class="tbox">' + metricTable(m) + '</div>';
}
/* table cells are only red or green: better or worse than usual */
const cellCls = j => j ? j.cls : '';
function metricTable(m) {
  const ks = KINDS(m.b);
  const head = { pd: '<th>Prior day</th><th>vs prior day</th>', bs: '<th>Comparable days avg</th><th>vs comparable days</th>', wow: '<th>Week-ago day</th><th>A week ago</th><th>vs a week ago</th>', mom: '<th>Last month\'s avg</th><th>vs month avg</th>', yoy: '<th>Last-year day</th><th>Last year</th><th>vs last year</th>' };
  let h = '<table><thead><tr><th class="l">Date</th><th class="l">Sale</th><th>' + esc(m.label) + '</th>' + ks.map(k => head[k]).join('') + (m.sess && !m.isSess ? '<th>Sessions</th>' : '') + '</tr></thead><tbody>';
  for (let d = D.asOf; d >= LEDGER_START; d = addDays(d, -1)) {
    const comps = compsDefault(m.b, d), c = cellsFor(m, d, comps), st = infoNow(m.b, d);
    const cell = k => { const j = judge(m, k, c[k], st.sale), v = cv(c, k);
      const val = v == null ? naCell(m, d, k, comps) : fmtVal(m, v), ch = c[k] == null ? naCell(m, d, k, comps) : sgn(c[k]);
      const tit = j && j.base ? ' title="' + esc(judgeText(j) + '. Baseline ' + upDown(j.usual) + '.') + '"' : '';
      return (k === 'mom' || k === 'pd' || k === 'bs' ? '' : '<td class="dim">' + (comps[k] ? cmpLabel(comps[k], k) : '') + '</td>') + '<td>' + val + '</td><td class="' + (j ? j.cls : '') + '"' + tit + '>' + ch + '</td>'; };
    h += '<tr data-date="' + d + '" class="' + (st.sale ? 'salerow ' : '') + (d === state.day ? 'sel ' : '') + (dow(d) === 1 ? 'wk' : '') + '"><td class="l">' + dmy(d) + (settling(d) ? ' •' : '') + '</td><td class="l dim">' + (st.sale ? '<span class="saledot"></span>' : '') + st.label + (isContam(m.b, d) ? ' ⚠' : '') + '</td><td><b>' + fmtVal(m, c.val) + '</b></td>' +
      ks.map(cell).join('') + (m.sess && !m.isSess ? '<td>' + int(c.sess) + '</td>' : '') + '</tr>';
  }
  return h + '</tbody></table>';
}
function wideTable(b, sec) {
  const ms = metricsFor(b)[sec], ks = KINDS(b), short2 = { pd: 'vs prior', bs: 'vs base', wow: 'vs wk', mom: 'vs mo avg', yoy: 'vs LY' };
  let h1 = '<tr><th class="s l" rowspan="2">Date</th><th class="l" rowspan="2">Sale</th>', h2 = '<tr>';
  ms.forEach(m => { h1 += '<th class="grp bl" colspan="' + (1 + ks.length) + '">' + em(m.label) + ' ' + esc(m.label) + '</th>'; h2 += '<th class="bl">Value</th>' + ks.map(k => '<th>' + short2[k] + '</th>').join(''); });
  let rows = '';
  for (let d = D.asOf; d >= LEDGER_START; d = addDays(d, -1)) {
    const comps = compsDefault(b, d), st = infoNow(b, d);
    rows += '<tr data-date="' + d + '" class="' + (st.sale ? 'salerow ' : '') + (d === state.day ? 'sel ' : '') + (dow(d) === 1 ? 'wk' : '') + '"><td class="s l">' + dmy(d) + '</td><td class="l dim">' + (st.sale ? '<span class="saledot"></span>' : '') + st.label + '</td>';
    ms.forEach(m => { const c = cellsFor(m, d, comps); rows += '<td class="bl"><b>' + fmtVal(m, c.val) + '</b></td>' + ks.map(k => { const j = judge(m, k, c[k], st.sale); return '<td class="' + (j ? j.cls : '') + '">' + (c[k] == null ? naCell(m, d, k, comps) : sgn(c[k])) + '</td>'; }).join(''); });
    rows += '</tr>';
  }
  return '<div class="tbox wide full" style="margin-top:10px"><table><thead>' + h1 + '</tr>' + h2 + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}
function highlight(b, sec) {
  const { d, sale } = dayOf(), comps = compsFor(b, d);
  const items = metricsFor(b)[sec].filter(m => !m.isSess && !m.isRev).map(m => { const c = cellsFor(m, d, comps); return { m, c, j: judge(m, 'bs', c.bs, sale) }; }).filter(x => x.j);
  if (!items.length || sec === 'overall') return '';
  items.sort((a, c) => a.j.dlt - c.j.dlt);
  const worst = items[0], best = items[items.length - 1], out = [];
  if (worst.j.mat === 'bad') out.push('Furthest below comparable days: <b class="w">' + esc(worst.m.label) + ', ' + MINUS + rel0(worst.j) + '%</b>');
  if (best.j.mat === 'good') out.push('furthest above: <b class="b">' + esc(best.m.label) + ', +' + rel0(best.j) + '%</b>');
  return out.length ? ucf(out.join('; ')) + '.' : 'Everything is close to comparable days.';
}
function groupHtml(b, sec) {
  if (!metricsFor(b)[sec] || !metricsFor(b)[sec].length) return '';
  const full = state.full.has(sec);
  const hl = highlight(b, sec);
  return '<div class="group" id="g-' + sec + '"><div class="ghead"><div class="gt"><h3>' + SEC_EMOJI[sec] + ' ' + SECS[sec] + '</h3>' + (hl ? '<p class="gsub">' + hl + '</p>' : '') + '</div><div class="gacts">' + secSrc(b, sec) + '<button class="linkbtn" data-full="' + sec + '">' + (full ? 'Hide the full data table' : 'View full data table') + '</button></div></div>' +
    '<div class="rows">' + metricsFor(b)[sec].map(rowHtml).join('') + '</div>' + (full ? wideTable(b, sec) : '') + '</div>';
}

/* ---------- payment mix: donut with the usual mix inside, deviation bars, Apple Pay entry point ---------- */
/* categorical colors for payment methods, kept separate from brand colors so a brand red never reads as 'bad' */
const PAYC = ['#2f6fd6', '#e0612e', '#1a9e70', '#8a63d2'];
const PAYORD = ['Card', 'Card, Apple Pay, Google Pay', 'Apple Pay', 'Apple Pay from PDP', 'Google Pay', 'PayPal', 'Klarna, Afterpay'];
// Brand-adjacent colors so each slice reads as its brand at a glance (Allison, Oct 28): card networks' orange, Apple black (light grey
// in dark mode), Google blue, PayPal navy (gold in dark mode), Klarna pink. Tokens live in page.html so both themes stay legible.
const PAYCOL = { 'Card': 'var(--pay-card)', 'Card, Apple Pay, Google Pay': 'var(--pay-card)', 'Apple Pay': 'var(--pay-apple)', 'Apple Pay from PDP': 'var(--pay-apple2)', 'Google Pay': 'var(--pay-google)', 'PayPal': 'var(--pay-paypal)', 'Klarna, Afterpay': 'var(--pay-klarna)' };
const PAYINK = { 'var(--pay-apple)': 'var(--pay-apple-ink)', 'var(--pay-klarna)': '#3b1220', 'var(--pay-paypal)': 'var(--pay-paypal-ink)' };
const PAYSHORT = { 'Card': 'Card', 'Card, Apple Pay, Google Pay': 'Card', 'Apple Pay': 'Apple Pay', 'Apple Pay from PDP': 'PDP', 'Google Pay': 'Google', 'PayPal': 'PayPal', 'Klarna, Afterpay': 'Klarna' };
function arc(cx, cy, r0, r1, a0, a1) {
  if (a1 - a0 >= 6.2831) a1 = a0 + 6.2831;
  const p = (r, a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)], big = a1 - a0 > Math.PI ? 1 : 0;
  const A = p(r1, a0), B = p(r1, a1), C = p(r0, a1), Dd = p(r0, a0);
  return 'M' + A[0].toFixed(2) + ' ' + A[1].toFixed(2) + 'A' + r1 + ' ' + r1 + ' 0 ' + big + ' 1 ' + B[0].toFixed(2) + ' ' + B[1].toFixed(2) + 'L' + C[0].toFixed(2) + ' ' + C[1].toFixed(2) + 'A' + r0 + ' ' + r0 + ' 0 ' + big + ' 0 ' + Dd[0].toFixed(2) + ' ' + Dd[1].toFixed(2) + 'Z';
}
function payMix(b, d) {
  const P = D.pay[b], names = Object.keys(P), n = P[names[0]].length, start = D.pay.start, sale = infoNow(b, d).sale;
  const t = Math.round((parse(d) - parse(start)) / DAY); if (t < 0 || t >= n) return null;
  // Compared with the last 30 days average: every other day in the 30-day window (Mike, Oct 26).
  const idx = []; for (let i = 0; i < n; i++) if (i !== t && !isContam(b, addDays(start, i))) idx.push(i);
  /* TeePublic: split Apple Pay orders by the share of Apple Pay taps that came from the product page buy-now button that day */
  const apSplit = i => { if (b !== 'tp' || typeof AP === 'undefined') return null; const ai = Math.round((parse(addDays(start, i)) - parse(AP.start)) / DAY); if (ai < 0 || ai >= AP['Product page'].length) return null; const keys = Object.keys(AP).filter(k => k !== 'start'); return AP['Product page'][ai] / sum(keys.map(k => AP[k][ai])); };
  const rows = i => {
    const out = [], tot = sum(names.map(k => P[k][i]));
    names.forEach((k, j) => {
      const sh = P[k][i] / tot, ps = k === 'Apple Pay' ? apSplit(i) : null;
      if (ps != null) { out.push({ k: 'Apple Pay', c: PAYCOL['Apple Pay'], sh: sh * (1 - ps), n: P[k][i] * (1 - ps), est: true }); out.push({ k: 'Apple Pay from PDP', c: PAYCOL['Apple Pay from PDP'], sh: sh * ps, n: P[k][i] * ps, est: true }); }
      else out.push({ k, c: PAYCOL[k] || PAYC[j % PAYC.length], sh, n: P[k][i] });
    });
    // Fixed order (Mike, Oct 26): Card, Apple Pay, Apple Pay from PDP, Google Pay, PayPal, Klarna/Afterpay.
    return out.sort((x, z) => PAYORD.indexOf(x.k) - PAYORD.indexOf(z.k));
  };
  const today = rows(t), base = today.map((r, j) => ({ ...r, sh: idx.length ? sum(idx.map(i => rows(i)[j].sh)) / idx.length : r.sh }));
  // Normal range per method (Mike, Oct 26: red means a team should dig in, so the bar is high): a change counts only past
  // 3x that method's own day-to-day swing over the window, and never under 10%. Small methods swing more, so they need a bigger move.
  base.forEach((r, j) => { const xs = idx.map(i => rows(i)[j].sh / r.sh - 1), sd = xs.length > 2 ? Math.sqrt(sum(xs.map(x => x * x)) / xs.length) : 0; r.thr = Math.max(0.10, 3 * sd); });
  return { today, base, sale, days: idx.length };
}
function donut(mix) {
  let a = 0, b2 = 0, g = '';
  mix.base.forEach((r, j) => { const s2 = r.sh * 6.2832; g += '<path d="' + arc(90, 90, 79, 87, b2, b2 + s2) + '" style="fill:' + r.c + ';opacity:.5;stroke:var(--surface);stroke-width:2"/>'; b2 += s2; });
  mix.today.forEach((r, j) => {
    const s2 = r.sh * 6.2832, bs = mix.base[j].sh, rel = (r.sh - bs) / bs;
    const tip = '<b>' + esc(r.k) + '</b><br>' + pct(r.sh, 1) + ' of orders on ' + short(state.day) + ' (about ' + int(r.n) + ')<br>Last 30 days average: ' + pct(bs, 1) + (Math.abs(rel) >= mix.base[j].thr ? ', so <b>' + upDown(rel) + '</b>, outside its normal range' : ', within its normal range') + '.' + (r.est ? '<br><span class="cap">Apple Pay split estimated from where people tapped the button.</span>' : '');
    g += '<path class="slice hint" data-hint="' + (HINTS.push(tip) - 1) + '" tabindex="0" d="' + arc(90, 90, 46, 76, a, a + s2) + '" style="fill:' + r.c + '"/>';
    // No text on the slices: brand colors carry it (Mike, Oct 28: "Your text overlays are awful").
    a += s2;
  });
  return '<svg class="donut" viewBox="0 0 180 180" width="190" height="190" role="img" aria-label="Payment mix on the selected day, with the last 30 days average as a thin outer ring">' + g + '<text x="90" y="86" text-anchor="middle" style="font:700 15px var(--display);fill:var(--ink)">' + int(sum(mix.today.map(r => r.n))) + '</text><text x="90" y="103" text-anchor="middle" style="font:500 11px var(--body);fill:var(--muted)">orders</text></svg>';
}
// Where the payment mix comes from (Allison, Oct 28: "we need a source for the payment data").
function paySrc(b) {
  const L = ['💳 <b>Payment methods:</b> every order_completed event in ' + LNK('https://app.amplitude.com/analytics/tpub', 'Amplitude') + ' (' + BR[b].name + ' project ' + (b === 'tp' ? '499673' : '774278') + '), grouped by payment type' + (b === 'rb' ? '; Stripe orders are split into card, Apple Pay and Google Pay by wallet type' : '') + '. Orders count every buyer, with no bot filter.',
    '📱 <b>Apple Pay from product pages:</b> estimated from taps on the product page buy-now button',
    '📏 <b>Normal range:</b> each method\'s day-to-day swing over the last 30 days'];
  return '<div class="tipsrcw"><button type="button" class="srcbtn tipsrc" data-tipsrc="1">ⓘ Sources</button><div class="tipsrcbox" hidden><ul class="hul nrul">' + L.map(x => '<li>' + x + '</li>').join('') + '</ul></div></div>';
}
function payHtml(b) {
  const d = state.day, mix = payMix(b, d);
  const head = '<div class="ghead"><div class="gt"><h3>' + SEC_EMOJI.pay + ' Payment mix</h3>' + (mix ? '' : '') + '</div></div>'; // 30-day chart link removed (Mike, Oct 26)
  if (!mix) return '<div class="group" id="g-pay">' + head + '<div class="rows"><div class="row" style="cursor:default;display:block"><span class="na">Payment data only covers ' + short(D.pay.start) + ' to ' + short(addDays(D.pay.start, 29)) + '.</span></div></div></div>';
  const moves = mix.today.map((r, j) => ({ r, bs: mix.base[j].sh, rel: (r.sh - mix.base[j].sh) / mix.base[j].sh })).filter(x => Math.abs(x.rel) >= mix.base[mix.today.indexOf(x.r)].thr);
  const WHY = {
    'Apple Pay from PDP': ['likely sale-day impulse buys from social and Shopping ads, which favor one-tap checkout', 'check the buy-now button on product pages'],
    'Apple Pay': ['more mobile shoppers paying in cart or checkout', 'check Apple Pay in cart and checkout'],
    'Klarna, Afterpay': ['more shoppers splitting payments', 'check the Klarna and Afterpay options'],
    'Card, Apple Pay, Google Pay': ['more card and wallet payments', 'check card and wallet errors on the payment step'],
    'PayPal': ['often older or international shoppers', 'check the PayPal button and its error rate'],
    'Card': ['fewer wallet payments', 'check card errors on the payment step'],
    'Google Pay': ['more Android shoppers', 'check the Google Pay button']
  };
  const top = moves.sort((a, z) => Math.abs(z.rel) - Math.abs(a.rel))[0];
  // A status line above the block: green when every method is normal, yellow/red naming the one that isn't (Mike, Oct 26).
  const sub = !top ? '<span class="pstat ok">All payment method usage rates are within their normal range.</span>' :
    '<span class="pstat ' + (top.rel > 0 ? 'hi' : 'lo') + '">' + esc(top.r.k) + ' is ' + (top.rel > 0 ? 'above' : 'below') + ' its normal range</span> (' + pct(top.r.sh, 1) + ' of orders vs ' + pct(top.bs, 1) + '): ' + ((WHY[top.r.k] || ['a mix shift', 'check that method'])[top.rel > 0 ? 0 : 1]) + '.' + (moves.length > 1 ? ' ' + moves.slice(1).map(x => esc(x.r.k) + ' ' + upDown(x.rel)).join(', ') + '.' : ' Everything else is normal.');
  // One scale for every row's range bar, so bands and dots compare across methods.
  const SC = Math.max(...mix.today.map((r, j) => Math.max(mix.base[j].thr, Math.abs(r.sh / mix.base[j].sh - 1)))) * 1.15;
  const rbar = (rel, thr) => { const X = v => 60 + 56 * Math.max(-1, Math.min(1, v / SC)), out = Math.abs(rel) >= thr, col = !out ? 'var(--good)' : rel > 0 ? 'var(--warn)' : 'var(--bad)'; // green normal, yellow above the band, red below it (Mike, Oct 26)
    return '<svg class="rbar" viewBox="0 0 120 16" width="120" height="16" aria-hidden="true"><line x1="4" x2="116" y1="8" y2="8" style="stroke:var(--line-2);stroke-width:1"/><rect x="' + X(-thr).toFixed(1) + '" y="3" width="' + (X(thr) - X(-thr)).toFixed(1) + '" height="10" rx="3" style="fill:var(--good-bg);stroke:color-mix(in srgb, var(--good) 45%, transparent)"/><line x1="60" x2="60" y1="2" y2="14" style="stroke:var(--faint);stroke-width:1"/><circle cx="' + X(rel).toFixed(1) + '" cy="8" r="4" style="fill:' + col + ';stroke:var(--surface);stroke-width:1.5"/></svg>'; };
  const table = '<table class="paytab"><thead><tr><th class="l">Method</th><th>' + short(d) + ' % of orders</th><th>L30D average</th><th>Change vs L30D</th><th>' + hint('vs normal range', 'soft', '<b>vs normal range</b><ul class="hul"><li><b>Band:</b> a normal day\'s swing</li><li><b>Dot:</b> today</li><li><span style="color:var(--good)">Green</span> normal, <span style="color:var(--warn)">yellow</span> above, <span style="color:var(--bad)">red</span> below</li></ul>') + '</th></tr></thead><tbody>' + mix.today.map((r, j) => {
    const bs = mix.base[j].sh, rel = (r.sh - bs) / bs;
    return '<tr><td class="l"><i class="sw blk" style="background:' + r.c + '"></i>' + esc(r.k) + '</td><td><b>' + pct(r.sh, 1) + '</b></td><td class="dim">' + pct(bs, 1) + '</td><td class="pchg' + (Math.abs(rel) >= mix.base[j].thr ? ' on' + (rel > 0 ? ' hi' : ' dn') : '') + '">' + hint(sgn(rel, 0), 'soft', Math.abs(rel) >= mix.base[j].thr ? '<b>Outside its normal range</b><br>' + esc(r.k) + ' usually moves less than ' + pct(mix.base[j].thr, 0) + ' a day. Worth a look.' : '<b>Within its normal range</b><br>' + esc(r.k) + ' moves up to about ' + pct(mix.base[j].thr, 0) + ' on a normal day.') + '</td><td>' + hint(rbar(rel, mix.base[j].thr), 'rbh', (Math.abs(rel) >= mix.base[j].thr ? '<b>Outside its normal range</b>' : '<b>Within its normal range</b>') + '<br>' + esc(r.k) + ': ' + sgn(rel, 0) + ' today; normal is within ±' + pct(mix.base[j].thr, 0) + '.') + '</td></tr>'; // green/red only outside the method's normal range
  }).join('') + '</tbody></table>';
  // The status sits inside the card, under the table, as a soft banner (Mike, Oct 26).
  const tone = !top ? 'ok' : top.rel > 0 ? 'hi' : 'lo';
  return '<div class="group" id="g-pay">' + head + '<div class="rows payrows"><div class="paywrap"><div class="donutbox">' + donut(mix) + '<span class="ringkey"><span><svg width="28" height="14" viewBox="0 0 28 14" aria-hidden="true"><rect x="1" y="3" width="26" height="8" rx="2" style="fill:var(--ink);opacity:.75"/></svg>Thick ring: ' + short(d) + '</span><span><svg width="28" height="14" viewBox="0 0 28 14" aria-hidden="true"><rect x="1" y="5.5" width="26" height="3" rx="1.5" style="fill:var(--ink);opacity:.35"/></svg>Thin outer ring: last 30 days average</span></span></div><div class="paytbl"><div class="pstatbar ' + tone + '"><span class="psi" aria-hidden="true">' + (tone === 'ok' ? '✓' : '!') + '</span><span>' + sub + '</span></div>' + table + '</div></div>' +
    paySrc(b) + '</div></div>';
}
/* ---------- Trending: what people are saying, what is selling, top sellers ---------- */
// Sections: an accent-bar heading outside, the content on its own card. `act` is an optional button on the heading's right.
function panel(icon, title, sub, body, cls, act) { return '<section class="sec2 ' + (cls || '') + '"><div class="shead"><div><h2>' + icon + ' ' + title + '</h2>' + (sub ? '<p class="cap">' + sub + '</p>' : '') + '</div>' + (act || '') + '</div><div class="pbody">' + body + '</div></section>'; }
const CATC = ['#2f6fd6', '#e0612e', '#1a9e70', '#8a63d2', '#d4a017', '#c2417f', 'var(--line-2)'];
function sellingHtml() {
  const sl = CATPIE.slices.concat([['Everything else', CATPIE.total - sum(CATPIE.slices.map(x => x[1]))]]);
  let a = 0, g = '';
  sl.forEach((x, j) => { const sh = x[1] / CATPIE.total, s2 = sh * 6.2832; g += '<path class="slice hint" tabindex="0" data-hint="' + (HINTS.push('<b>' + esc(x[0]) + '</b><br>' + pct(sh, 1) + ' of categorized items ordered (' + int(x[1]) + ')') - 1) + '" d="' + arc(90, 90, 48, 80, a, a + s2) + '" style="fill:' + CATC[j] + ';stroke:var(--surface);stroke-width:2"/>'; a += s2; });
  const pie = '<div class="catpie"><svg class="donut" viewBox="0 0 180 180" width="250" height="250" role="img" aria-label="Share of orders by category">' + g + '<text x="90" y="88" text-anchor="middle" style="font:700 15px var(--display);fill:var(--ink)">' + int(CATPIE.total) + '</text><text x="90" y="104" text-anchor="middle" style="font:500 11px var(--body);fill:var(--muted)">items</text></svg><ul class="catleg">' +
    sl.map((x, j) => '<li><i style="background:' + CATC[j] + '"></i><span>' + esc(x[0]) + '</span><b>' + pct(x[1] / CATPIE.total, 0) + '</b>' + (() => { const m = x[2] != null ? x[2] : (j === sl.length - 1 && typeof CATPIE.restX === 'number' ? CATPIE.restX : null); return m == null ? '<em class="catx"></em>' : '<em class="catx' + (m >= 1.15 ? ' up' : '') + '">' + m.toFixed(1) + '×</em>'; })() + '</li>').join('') + '</ul></div>';
  const all = TRENDS.tags.concat(TRENDS.cats).map(r => ({ n: r[0].replace(/-/g, ' '), c: r[1], x: r[2] }));
  const hot = all.filter(r => r.x >= 1.15).sort((a, z) => z.x - a.x).slice(0, 4), cold = all.filter(r => r.x <= 0.8).sort((a, z) => a.x - z.x).slice(0, 3), mx = Math.max(...hot.map(r => r.x), 2);
  const mover = (r, up) => '<li><a href="https://www.teepublic.com/t-shirts?query=' + encodeURIComponent(r.n) + '" target="_blank" rel="noopener">' + esc(r.n) + '</a><span class="mvbar"><i class="' + (up ? 'up' : 'down') + '" style="width:' + (up ? (r.x / mx * 100) : (r.x * 100)).toFixed(0) + '%"></i></span><b class="' + (up ? 'b' : 'dimx') + '">' + r.x.toFixed(1) + '×</b></li>';
  const movers = '<div class="movers"><h4>🔥 Heating up</h4><ol>' + hot.map(r => mover(r, true)).join('') + '</ol><h4>🧊 Cooling off</h4><ol>' + cold.map(r => mover(r, false)).join('') + '</ol><p class="cap">× = share of the last 24 hours\' orders compared with its share over the 7 days before. 1.0× is normal.</p></div>';
  const call = typeof SELLCALL !== 'undefined' ? '<div class="sellcall"><span class="sbig" aria-hidden="true">' + SELLCALL.e + '</span><div><b>' + esc(SELLCALL.title) + '</b><p>' + esc(SELLCALL.body) + '</p><p class="ask">👉 ' + esc(SELLCALL.ask) + ' <a href="' + esc(SELLCALL.src) + '" target="_blank" rel="noopener">Source ↗</a></p></div></div>' : '';
  return '<div class="selling">' + pie + movers + '</div>';
}
const TOPIC = [[/brewers/i, 'Brewers World Series'], [/rays/i, 'World Series'], [/eagles/i, 'Philadelphia Eagles'], [/twenty one pilots/i, 'Twenty One Pilots'], [/kentucky|football/i, 'College football'], [/oozma|kappa/i, 'Monsters University'], [/usps|postal/i, 'US Postal Service']];
const hotTopic = name => TRENDS.tags.concat(TRENDS.cats).some(r => r[2] >= 1.15 && r[0].replace(/-/g, ' ').toLowerCase() === name.toLowerCase());
const topicOf = t => (TOPIC.find(x => x[0].test(t)) || [0, ''])[1];
// The day's number one design, in gold, beside What is selling; the Top designs grid then shows 2 onward.
function topOne() {
  const t = TOPS.items[0]; if (!t) return '';
  const tp = topicOf(t.title);
  return '<a class="top1" href="https://www.teepublic.com/t-shirt/' + TOP_IDS[0] + '" target="_blank" rel="noopener"><span class="t1k">🏆 Top design, last 24 hours</span><span class="t1img"><img src="' + t.img + '" alt="' + esc(t.title) + '" loading="lazy"><span class="rank">1</span></span><b>' + esc(t.title) + '</b>' + (tp ? '<span class="ttag gold">' + (hotTopic(tp) ? '🔥 ' : '#') + esc(tp) + '</span>' : '') + '<span class="cap">' + int(t.orders) + ' orders</span></a>';
}
function topsHtml() {
  return '<div class="topgrid">' + TOPS.items.map((t, i) => '<a class="top" href="https://www.teepublic.com/t-shirt/' + TOP_IDS[i] + '" target="_blank" rel="noopener"><span class="rank">' + (i + 1) + '</span><img src="' + t.img + '" alt="' + esc(t.title) + '" loading="lazy"><b title="' + esc(t.title) + '">' + esc(t.title) + '</b>' + (topicOf(t.title) ? '<span class="ttag' + (hotTopic(topicOf(t.title)) ? ' hot' : '') + '" title="Topic this design rides on' + (hotTopic(topicOf(t.title)) ? ', heating up right now' : '') + '">' + (hotTopic(topicOf(t.title)) ? '🔥 ' : '#') + esc(topicOf(t.title)) + '</span>' : '') + '<span class="cap">' + int(t.orders) + ' orders</span></a>').join('') + '</div>';
}
function trendingHtml() {
  const call = typeof SELLCALL !== 'undefined' ? '<section class="callcard2"><h3>' + SELLCALL.e + ' ' + esc(SELLCALL.title) + '</h3><p>' + esc(SELLCALL.body) + '</p><p class="ask">💰 ' + esc(SELLCALL.ask) + '</p><a class="ref ext" href="' + esc(SELLCALL.src) + '" target="_blank" rel="noopener">Series preview ↗</a></section>' : '';
  return '<section class="sview"><div class="vhead vhl">' + trHeadline() + '</div>' +
    // Topics go straight under the title (Mike, Oct 22): four cards, then a one-time "Show N more".
    (() => { const L = SLACK, more = L.length - 4; return '<section class="bare tsay"><div class="ghead"><div class="gt"><h3>💬 What people are saying</h3><p class="gsub">The last 48 hours.</p></div></div>' + (L.length ? '' : '<p class="cap">Quiet: nothing new in the last 48 hours.</p>') + sayList(state.sayAll ? L : L.slice(0, 4), state.sayAll ? L.length : 4) + (more > 0 && !state.sayAll ? '<button type="button" class="linkbtn saymore" data-saymore="1">Show ' + more + ' more</button>' : '') + '</section>'; })() +
    // Bot Squad updates moved here from the CVR pages, under What people are saying, both sites (Mike, Oct 27).
    '<section class="botsec" id="g-bots"><div class="bothead"><h2>🤖 Bot Squad updates</h2><span class="botlinks">' + ['rb', 'tp'].map(b => botNotesFor(b).length ? '<button type="button" class="linkbtn bmore" data-botwatch="' + b + '">All ' + BR[b].name + ' bot notes →</button>' : '').join('') + '</span></div><div class="say4 botsay">' + ['rb', 'tp'].map(b => botRow(b, true)).join('') + '</div></section>' +
    // Customer service lives here once, for both sites (Mike, Oct 24), instead of on each CVR page.
    (typeof CS !== 'undefined' && CS.tp && CS.rb ? '<section class="bare tcs"><div class="ghead"><div class="gt"><h3>🎧 What customer service is seeing</h3><p class="gsub">Repeat customer complaints from the customer service channels, ' + esc(String(CS.window || '').replace(/^Customer service channels,\s*/i, '')) + '.</p></div></div>' + csHtml() + '</section>' : '') +
    '<div class="sellrow">' + panel('🏷️', 'What is selling', 'Share of TeePublic orders by category in the last 24 hours, and the topics moving fastest.', sellingHtml(), 'p-sell') +
    '</div>' +
    (call ? '<section class="sec2 dbl"><div class="shead"><div><h2>💡 Should we double down?</h2></div></div>' + call + '</section>' : '') +
    panel('🏆', 'Top designs', 'TeePublic designs in the most orders, last 24 hours. Each is tagged with the topic it rides on; 🔥 marks a topic that is heating up right now. ' + esc(TOPS.note || ''), topsHtml(), 'p-top') +
    (typeof SHOUTS !== 'undefined' ? panel('🙌', 'Shout-out of the day', 'One person who drove something through.', shoutCard(), 'p-shout p-shoutw') : '') + '</section>';
}
function scoreHtml(b) {
  const hasLY = b === 'tp', ob = BR[BR[b].other].name, d = state.day, comps = compsFor(b, d);
  // Column headers explain themselves on hover; no "What's this?" (Mike, Oct 27). Prior day keeps its date.
  const CHT = { bs: '<b>vs comparable days</b><br>The day vs the average of matching days since ' + short(BASE_START) + ' (same weekday, or the same point in a sale at the same discount).<ul class="hul"><li>📏 <b>Band:</b> the metric\'s normal fluctuation</li><li>📍 <b>Dot:</b> this day</li><li>🎨 <b>Color:</b> red below the range; rows below it are tinted red</li></ul>', pd: '<b>vs prior day</b><br>Always the day before. Context, never graded.', yoy: '<b class="tiph nosrc">vs LY: last year</b><span class="tipv">Each metric vs ' + esc(kname('yoy', comps)) + '.</span><ul class="hul nrul"><li>📅 <b>Which days:</b> ' + (comps.yoy && comps.yoy.dates ? comps.yoy.dates.map(x => short(x)).join(', ') + ', 2025' : 'the same weekday, 364 days back') + '</li><li>🤖 <b>Up 30% or more:</b> likely last year\'s bot traffic, not shoppers</li></ul>' };
  const ch = k => '<span class="ch"><button type="button" class="chbtn" data-why="' + k + '">' + (k === 'pd' ? '<span class="chh">' + kcol(k, comps) + '</span>' /* prior day needs no explanation (Mike, Oct 27) */ : hint(k === 'mom' && comps.mom && comps.mom.custom ? 'vs your range' : k === 'yoy' ? 'vs LY' /* short header, detail on hover (Mike, Oct 28) */ : kcol(k, comps), 'soft chh', CHT[k] || '')) + (k === 'pd' && comps[k] ? '<small>' + cmpShort(comps[k], k) + '</small>' : !comps[k] ? '<small>no match</small>' : '') + '</button></span>';
  return '<section class="score' + (hasLY ? '' : ' nly') + '"><h2 class="title">📊 Scorecard</h2><div class="colhead"><span>Metric</span><span>' + short(d) + '</span>' + ch('bs') + '<span>Last 90 days</span>' + KINDS(b).filter(k => k !== 'bs' && k !== 'pd').map(ch).join('') + '<span>Sessions</span><span>Seen on ' + ob + '?</span><span></span></div>' +
    Object.keys(SECS).map(sec => groupHtml(b, sec)).join('') + '</section>';
}

/* ---------- A/B tests: its own page, because it is a weekly decision review, not the daily pulse ---------- */
const EXPS_AS_OF = '2026-10-31';
const testDays = t => Math.round((parse(EXPS_AS_OF) - parse(t.start)) / DAY) + 1;
const siteImp = (rel, reach) => rel * reach;
// Where a test's whole-site number comes from, for every hover that shows one.
const impTip = t => '<b>Whole-site impact, from Amplitude Experiment</b><br>The test measured ' + sgn(t.cvr.rel, 1) + ' CVR for people who see the change. They make up about ' + Math.round(t.reach * 100) + '% of orders, so the whole-site effect is about ' + sgn(siteImp(t.cvr.rel, t.reach), 1) + '.' + (rpuOf(t) ? '<br>Revenue per visitor in the test: ' + sgn(rpuOf(t).rel, 1) + '.' : '');
const sp = (x, d) => (x < 0 ? MINUS : '+') + Math.abs(x * 100).toFixed(d == null ? 2 : d) + '%';
const METHOD = '<b>How whole-site impact is worked out</b><br>A test only changes things for the people who see it. So we take its lift in sitewide CVR among those people and multiply by <b>reach</b>, the share of all site orders that come from them.<br><i>Example:</i> a +1.4% lift that reaches 69% of orders moves the whole site by about +1.0%.<br>Reach is estimated from exposed buyers over site orders for the same days, adjusted for repeat buyers and capped at 100%.';
const rpuOf = t => (t.sec || []).find(x => x.f === 'usd');
const fmtM = (x, v) => x.f === 'usd' ? '$' + v.toFixed(2) : pct(v, v < 0.01 ? 3 : v < 0.1 ? 2 : 1);
// Confidence = 1 − p: how sure we are the difference is real. 95% is the bar for calling a winner.
const conf = t => Math.max(0, Math.min(99, Math.floor((1 - t.p) * 100)));
// Confidence in plain words: how sure we are the difference is real. Direction comes from the primary metric.
const sigWord = t => { const c = conf(t), up = (t.primary ? t.primary.rel : t.cvr.rel) >= 0; if (c >= 95) return up ? 'Clear winner' : 'Clear loser'; if (c >= 80) return 'Likely ' + (up ? 'up' : 'down'); if (c >= 50) return 'Leaning ' + (up ? 'up' : 'down'); return t.status === 'running' ? 'Too early to tell' : 'No clear difference'; };
const sigChip = t => t.p == null ? '' : '<span class="sig ' + (conf(t) >= 95 ? 'yes' : conf(t) >= 80 ? 'mid' : 'no') + '" title="How sure we are the difference is real, not noise: ' + conf(t) + '%. We call a winner at 95%. Under 50% the results so far look like noise.">' + '<span class="cbar"><i style="width:' + Math.max(3, Math.round(conf(t) / 95 * 100)) + '%"></i></span>' + sigWord(t) + (conf(t) >= 50 ? ' · ' + conf(t) + '% confidence' : '') + '</span>';
const TESTE = [[/return to cart/i, '🔙'], [/topics/i, '🧭'], [/countdown/i, '⏳'], [/swatch/i, '🎨'], [/trust badge/i, '🛡️'], [/flat-lay/i, '👕'], [/image first/i, '📸'], [/express/i, '⚡'], [/price/i, '🏷️'], [/shipping/i, '📦']];
// Tests get the same line icons as Roadmap projects (Mike, Oct 27); the goal is read from the primary metric.
const testObj = t => /revenue|order value|aov|items per/i.test((t.primary && t.primary.name) || '') ? 'AOV' : 'CVR';
const testE = n => (TESTE.find(x => x[0].test(n)) || [0, '🧪'])[1];
// Which site a test runs on (from its Amplitude project) and which team owns it.
const testSite = t => /\/774278\//.test(t.url || '') ? 'RB' : /\/499673\//.test(t.url || '') ? 'TP' : t.site || 'RB';
const TEST_TEAM = { Oliver: 'customer', Allison: 'customer', Jon: 'customer', James: 'customer', Wendy: 'search', Matz: 'artist', Grace: 'dashery' };
const testTeam = t => t.team || (Object.keys(TEST_TEAM).find(n => (t.owners || '').indexOf(n) >= 0) ? TEST_TEAM[Object.keys(TEST_TEAM).find(n => (t.owners || '').indexOf(n) >= 0)] : 'customer');
// Rough time to 95% confidence if the effect holds: z grows with the square root of sample, so days scale with (1.96 / z)².
const qz = q => { const u = Math.sqrt(-2 * Math.log(q)); return u - (2.515517 + 0.802853 * u + 0.010328 * u * u) / (1 + 1.432788 * u + 0.189269 * u * u + 0.001308 * u * u * u); };
function ttc(t) {
  if (t.status !== 'running' || t.p == null) return '';
  if (conf(t) >= 95) return 'Ready to call';
  const z = t.p >= 0.98 ? 0 : qz(t.p / 2), days = testDays(t);
  if (z < 0.15) return 'Effect too small to reach 95%';
  const more = Math.round(days * Math.pow(1.96 / z, 2) - days);
  return more > 90 ? 'Months from 95% at this effect size' : '~' + Math.max(1, more) + ' more day' + (more === 1 ? '' : 's') + ' to 95%, if it holds';
}
// A/B table built around the exec questions (Sam, standup Oct 30): revenue per visitor, CVR, add to cart, AOV and engagement side by side,
// each marked proven or not, plus how long it has run, the call, what's next and who decides. Color only when a result is proven (Mike, Oct 30).
const ABK = [['rpv', 'Revenue per user', 'What each user in the test group spends on average.'], ['cvr', 'CVR', 'Share of visitors in the test who order. Some tests measure a narrower step (product page, cart or checkout); the hover names it.'], ['atc', 'Add to cart', 'Share of visitors in the test who add something to their cart.'], ['aov', 'AOV', 'Average order value: revenue ÷ orders. Not Amplitude\'s per-visitor "AOV".'], ['eng', 'Engagement', 'Only for tests built to change how people browse, like the nav.']];
const ABO = ['rpv', 'cvr'];
const abRd = t => (EXPS.reads || {})[t.id] || { goal: t.kind === 'aov' ? 'rpv' : 'cvr', verdict: t.status === 'shipped' ? ['ship', 'Shipped'] : t.status === 'running' ? ['early', 'Running'] : ['none', 'Kept control'], next: t.call || '', m: { cvr: { v: t.cvr.rel, s: t.p != null && t.p < 0.05 ? 'sig' : 'ns', a: t.cvr.a, b: t.cvr.b, name: 'Sitewide CVR' }, rpv: rpuOf(t) ? { v: rpuOf(t).rel, s: 'nb', a: rpuOf(t).a, b: rpuOf(t).b, f: 'usd' } : null } };
const abVal = (x, v) => x.f === 'usd' ? '$' + (v >= 10 ? v.toFixed(2) : v.toFixed(v < 1 ? 3 : 2)) : pct(v, v < 0.01 ? 3 : v < 0.1 ? 2 : 1);
const abSure = x => x.s === 'sig' ? '✓ Significant' : x.s === 'nb' ? 'No error bar' : x.s === 'early' ? 'Too early' : x.c ? x.c + '% confidence' : 'Could be noise';
const abSureL = x => x.s === 'sig' ? '<b class="b">Statistically significant:</b> at least 95% confidence of a true difference, not noise.' : x.s === 'nb' ? '<b>No error bar:</b> Amplitude can\'t calculate how sure it is for this metric, so read it as a direction only.' : x.s === 'early' ? '<b>Too early:</b> too few days of data to trust yet.' : x.c ? '<b>' + x.c + '% confidence</b> this is a true difference. We call it at 95%.' : '<b>Not significant yet:</b> this could still be random noise.';
function abCell(t, k) {
  const r = abRd(t), x = (r.m || {})[k], goal = r.goal === k;
  if (!x) return '<span class="abtbd"><b>TBD</b><small>not measured</small></span>';
  const cls = x.s === 'sig' ? (x.v >= 0 ? 'b' : 'w') : 'ns', nm = x.name || (k === 'cvr' ? 'Sitewide CVR' : ABK.find(z => z[0] === k)[1]), scope = (!x.name || /sitewide/i.test(x.name)) ? 'sitewide' : x.name.toLowerCase().replace(/ cvr$/, '');
  const tip = '<b class="tiph nosrc">' + esc(nm) + (goal ? ' · 🎯 what the test is built to move' : '') + '</b><span class="tipv"><b>' + sgn(x.v, 1) + '</b> for the test group</span><ul class="hul nrul"><li>📊 <b>Control → test:</b> ' + abVal(x, x.a) + ' → ' + abVal(x, x.b) + '</li><li>🧪 ' + abSureL(x) + '</li>' + (x.note ? '<li>📝 ' + esc(x.note) + '</li>' : '') + '</ul>';
  return hint('<span class="abv ' + cls + '">' + (goal ? '<i class="abgoal" aria-label="Goal metric">🎯</i>' : '') + sgn(x.v, 1) + '</span>' + (k === 'cvr' ? '<small class="abs ' + x.s + '">' + (x.s === 'sig' ? '✓ ' : '') + esc(scope) + '</small>' : x.s === 'sig' || (x.c && x.c >= 80) ? '<small class="abs ' + x.s + '">' + abSure(x) + '</small>' : ''), 'abm', tip);
}
const abSig = t => { const r = abRd(t), g = (r.m || {})[r.goal], nm = (g && g.name) || ABK.find(z => z[0] === r.goal)[1];
  const o = !g ? ['na', '–', '', ''] : g.s === 'sig' ? ['yes', 'Yes', '95%+ confidence', 'At least 95% confidence of a true difference.'] : g.s === 'early' ? ['early', 'Too early', 'few days of data', 'Not enough days to say anything yet.'] : g.s === 'nb' ? ['nb', 'Can\'t tell', 'no error bar', 'Amplitude gives no error bar for this metric.'] : g.c ? ['not', 'Not yet', g.c + '% confidence', 'Needs 95% before we call it.'] : ['not', 'Not yet', 'could be noise', 'Under 95% confidence, so it could still be noise.'];
  return '<span class="abst ' + o[0] + '">' + o[1] + '</span>';
};
const abImp = t => { const v = siteImp(t.cvr.rel, t.reach); return hint('<span class="abv big lite ' + (v >= 0 ? 'b' : 'w') + '">' + sp(v, 1) + '</span><small class="abs">' + Math.round(t.reach * 100) + '% reach</small>', 'abm', '<span class="nosrc">In the test group: ' + pct(t.cvr.a, t.cvr.a < 0.1 ? 2 : 1) + ' → ' + pct(t.cvr.b, t.cvr.b < 0.1 ? 2 : 1) + ' CVR (' + sgn(t.cvr.rel, 1) + ').</span>'); };
const abRpu = t => { const x = (abRd(t).m || {}).rpv; if (!x) return '<span class="abtbd"><b>TBD</b><small>not measured</small></span>'; return hint('<span class="abv big ' + (x.v >= 0 ? 'b' : 'w') + '">' + sgn(x.v, 1) + '</span><small class="abs">in test group</small>', 'abm', '<span class="nosrc">' + abVal(x, x.a) + ' → ' + abVal(x, x.b) + ' per user.</span>'); };
const abDay = t => t.status === 'running' ? '<span class="abday"><b>Day ' + testDays(t) + '</b><small>since ' + short(t.start) + '</small></span>' : '<span class="abday"><b>' + (Math.round((parse(t.end) - parse(t.start)) / DAY) + 1) + ' days</b><small>ended ' + short(t.end) + '</small></span>';
const abCall = t => { const r = abRd(t), pill = '<span class="abv2 v-' + r.verdict[0] + '">' + esc(r.verdict[1]) + '</span>'; return r.next && t.status === 'running' ? hint(pill, 'abcall', '<span class="nosrc">' + esc(r.next) + '</span>') : '<span class="abcall">' + pill + '</span>'; };
const abHeadSort = () => {
  const S = state.abSort || { k: 'days', dir: 1 }, c = (k, inner) => '<span class="abh" role="button" tabindex="0" data-absort="' + k + '">' + inner + (S.k === k ? '<i class="sa" aria-hidden="true">' + (S.dir > 0 ? '↑' : '↓') + '</i>' : '') + '</span>';
  return '<div class="tcols abcols">' + c('test', 'Test') + c('days', 'Running') + c('sig', 'Stat sig') + c('cvr', hint('Sitewide CVR impact', 'soft', '<span class="nosrc"><b>Sitewide CVR impact</b><br>The test group\'s CVR change, scaled by the share of orders it reaches: what it would do to the whole site.</span>')) + c('rpu', hint('Revenue per user', 'soft', '<span class="nosrc"><b>Revenue per user</b><br>Revenue per user in the test group vs control.</span>')) + c('call', 'The call') + '<span></span></div>';
};
const ABHEAD = '<div class="tcols abcols"><span>Test</span><span>Running</span>' + hint('Stat sig', 'soft', '<span class="nosrc"><b>Stat sig</b><br>Is there 95% confidence the main metric moved, not noise?</span>') + hint('Sitewide CVR impact', 'soft', '<span class="nosrc"><b>Sitewide CVR impact</b><br>The test group\'s CVR change, scaled by the share of orders it reaches: what it would do to the whole site.</span>') + hint('Revenue per user', 'soft', '<span class="nosrc"><b>Revenue per user</b><br>Revenue per user in the test group vs control.</span>') + '<span>The call</span><span></span></div>';
function testDetailModal(id) {
  const t = [].concat(EXPS.live, EXPS.done).find(x => String(x.id) === String(id)); if (!t) return;
  const R = abRd(t), days = t.status === 'running' ? testDays(t) : Math.round((parse(t.end) - parse(t.start)) / DAY) + 1;
  const cols = ABK.filter(k => (R.m || {})[k[0]] && k[0] !== 'rpv').concat(ABK.filter(k => (R.m || {})[k[0]] && k[0] === 'rpv')), lab = k => R.m[k[0]].name || k[1];
  const ch = (v, main) => '<span class="chn ' + (v >= 0 ? 'b' : 'w') + (main ? ' main' : '') + '">' + sgn(v, 1) + '</span>';
  const sureOf = x => x.s === 'sig' ? '<span class="abst yes">Yes</span>' : x.s === 'early' ? '<span class="abst early">Too early</span>' : x.s === 'nb' ? '<span class="abst nb">Can\'t tell</span>' : '<span class="abst">' + (x.c ? 'Not yet · ' + x.c + '%' : 'Not yet') + '</span>';
  const tbl = R.vrows
    ? '<table class="abt"><thead><tr><th>Version</th>' + cols.map(k => '<th>' + esc(lab(k)) + '</th>').join('') + '</tr></thead><tbody>' + [['Overall', Object.fromEntries(cols.map(k => [k[0], R.m[k[0]].v])), 'All versions combined']].concat(R.vrows.map(v => [v[0], v[1], (R.vdef || {})[v[0]] || ''])).map(v => '<tr><td><b>' + esc(v[0]) + '</b>' + (v[2] ? '<small>' + esc(v[2]) + '</small>' : '') + '</td>' + cols.map(k => { const x = v[1][k[0]]; return x == null ? '<td class="na">–</td>' : '<td>' + ch(x, k[0] === 'rpv') + '</td>'; }).join('') + '</tr>').join('') + '</tbody></table>'
    : '<table class="abt"><thead><tr><th>Metric</th><th>Control</th><th>Test</th><th>Change</th><th>Stat sig</th></tr></thead><tbody>' + cols.map(k => { const x = R.m[k[0]]; return '<tr><td>' + esc(lab(k)) + '</td><td>' + abVal(x, x.a) + '</td><td>' + abVal(x, x.b) + '</td><td>' + ch(x.v, k[0] === 'rpv') + '</td><td>' + sureOf(x) + '</td></tr>'; }).join('') + '</tbody></table>';
  const pill = '<span class="abv2 v-' + R.verdict[0] + '">' + esc(R.verdict[1]) + '</span>';
  openModal('<div class="mhead"><h3 id="mtitle">' + esc(t.name) + '</h3></div><div class="mtags"><span class="rtag">' + siteDot(testSite(t)) + '</span><span class="rtag">' + esc(t.where) + '</span><span class="rtag">' + (t.status === 'running' ? 'Day ' + days + ', since ' + short(t.start) : days + ' days, ended ' + short(t.end)) + '</span>' + pill + '</div>' +
    '<div class="abwhat2"><h4 class="ph">🧪 What we are testing</h4><p>' + esc(t.hyp) + '</p>' + (R.flag ? '<p class="abflag">⚠️ ' + esc(R.flag) + '</p>' : '') + '</div>' + tbl + '<div class="abfoot2">' + srcBtn('test:' + t.id) + '</div>');
}
function testRow(t) {
  const site = siteImp(t.cvr.rel, t.reach), open = state.open.has('x' + t.id), r = Math.round(t.reach * 100);
  const st = t.status === 'running' ? 'Running' : t.status === 'shipped' ? 'Shipped' : 'Kept control';
  const more = (ttc(t).match(/~(\d+) more day/) || [])[1], dates = t.status === 'running' ? short(t.start) + ' → ' + (more ? '~' + short(addDays(EXPS_AS_OF, +more)) : 'open') + '<small>Day ' + testDays(t) + (more ? ' · result in ~' + more + ' days' : '') + '</small>' : short(t.start) + ' → ' + short(t.end) + '<small>' + (Math.round((parse(t.end) - parse(t.start)) / DAY) + 1) + ' days</small>';
  const fv = t.primary.name.indexOf('per') > -1 ? v => v.toFixed(3) : v => pct(v, v < 0.01 ? 3 : v < 0.05 ? 2 : 1);
  let h = '<div class="rowwrap"><div class="trow abrow" role="button" tabindex="0" aria-expanded="' + open + '" data-xrow="' + t.id + '"><span class="tname tnico"><span class="ge gico g-' + esc(testObj(t)) + '" aria-hidden="true">' + projIco({ t: t.name, obj: testObj(t) }) + '</span><b>' + esc(t.name) + '</b><span class="cap tmeta">' + sitePill(testSite(t)) + '<span class="tloc">' + esc(t.where) + '</span></span></span>' +
    abDay(t) + abSig(t) + abImp(t) + abRpu(t) + abCall(t) + '<span class="chev" aria-hidden="true">▾</span></div>';
  return h + '</div>';
}
// One takeaway sentence for the tab: the running test that matters most, what is close to a call, and what was decided lately.
function testsLead() {
  const imp = t => siteImp(t.cvr.rel, t.reach);
  const nm = t => hint(esc(t.name), 'verd ' + (t.status === 'running' ? 'n2' : imp(t) < 0 ? 'w' : 'b'), '<b>' + esc(t.name) + '</b><br>' + esc(t.primary.name) + ' ' + sp(t.primary.rel, 1) + ' · whole-site ' + sp(imp(t)) + '<br>' + (t.p == null ? 'No read yet' : esc(sigWord(t)) + ' · ' + conf(t) + '% confidence') + '<br><span class="cap">' + esc(t.where || '') + '</span>');
  const lc = w => w.charAt(0).toLowerCase() + w.slice(1);
  const live = EXPS.live.slice().sort((a, z) => Math.abs(imp(z)) * (conf(z) || 1) - Math.abs(imp(a)) * (conf(a) || 1)), out = [];
  const headT = live[0] ? '<p class="verdict rmverd">A/B tests: ' + nm(live[0]) + ' is the one to watch.</p>' : '';
  if (live[0]) { const t = live[0]; out.push('It is at ' + '<span class="' + (imp(t) < 0 ? 'bad' : 'good') + '">' + sp(imp(t)) + ' whole-site CVR</span>, ' + (t.p == null ? 'no read yet' : lc(sigWord(t)) + (conf(t) >= 50 ? ' (' + conf(t) + '% confidence)' : '')) + (ttc(t) ? ', ' + lc(ttc(t)) : '')); }
  const close = live.slice(1).filter(t => conf(t) >= 80)[0];
  if (close) out.push(nm(close) + ' is close to a call at ' + conf(close) + '%');
  const sh = EXPS.done.filter(t => t.status === 'shipped'), kc = EXPS.done.length - sh.length;
  if (EXPS.done.length) out.push('In the last three weeks, ' + (sh.length ? sh.length + ' shipped' + (sh[0] ? ' (' + nm(sh.slice().sort((a, z) => imp(z) - imp(a))[0]) + ')' : '') : 'none shipped') + (kc ? ' and ' + kc + ' kept control' : ''));
  if (!out.length) return headT;
  return headT + '<p class="sulead">' + out.join('. ') + '.</p>';
}
// Quiet facts after a section heading: how many, how close to a call, the net whole-site effect.
function abFacts(list, live) {
  if (!list.length) return '';
  const near = list.filter(t => t.p != null && conf(t) >= 80).length, sh = list.filter(t => t.status === 'shipped').length;
  const f = live ? [list.length + ' running', 'longest: day ' + Math.max(...list.map(testDays))] : [sh + ' shipped', (list.length - sh) + ' kept control'];
  return '<span class="sfacts">' + f.map(x => '<span>' + esc(x) + '</span>').join('<span aria-hidden="true">·</span>') + '</span>';
}
/* detail pop-ups for queued and earlier tests: the three facts first, then what it is and where to look */
const rmMatch = name => { const w = name.toLowerCase().split(/\W+/).filter(x => x.length > 3); let best = null, bs = 1; COMING.teams.forEach(T => T.items.forEach((it, i) => { const t = it.t.toLowerCase(), sc = w.filter(x => t.indexOf(x) >= 0).length; if (sc > bs) { bs = sc; best = T.key + '|' + i; } })); return best; };
function testModal(kind, i) {
  const fact = (l, v, sub) => '<div class="mfact"><span class="lbl">' + l + '</span><b>' + v + '</b>' + (sub ? '<span class="cap">' + sub + '</span>' : '') + '</div>';
  if (kind === 'soon') {
    const x = EXPS.soon[+i], rm = rmMatch(x.name);
    return openModal('<div class="mhead"><h3 id="mtitle">' + x.e + ' ' + esc(x.name) + '</h3></div>' +
      '<div class="mfacts">' + fact('Expected start', esc(x.when)) + fact('Status', 'Queued', 'Not live in Amplitude Experiment yet') + fact('Where', esc(x.where), esc(x.site)) + '</div>' +
      '<div class="pbox"><h4 class="ph">🧪 What it tests</h4><p>' + esc(x.what) + '</p></div>' +
      (rm ? '<div class="pbox"><h4 class="ph">🗺️ On the Roadmap</h4><p>This test is part of <b>' + esc(lbItem2(rm).t) + '</b>.</p><button type="button" class="actbtn" data-lbm2="' + rm + '">See it on the Roadmap</button></div>' : '') +
      (x.refs && x.refs.length ? '<div class="pbox"><h4 class="ph">🔗 Links</h4>' + refsHtml(x.refs) + '</div>' : ''));
  }
  const o = EXPS.older[+i], wu = typeof WU !== 'undefined' && WU[o.name];
  return openModal('<div class="mhead"><h3 id="mtitle">' + testE(o.name) + ' ' + esc(o.name) + '</h3></div><div class="mtags"><span class="rtag">Redbubble</span></div>' +
    '<div class="mfacts">' + fact('Ended', short(o.end)) + fact('Decision', o.status === 'shipped' ? 'Shipped' : 'Kept control') + fact('Impact', o.status === 'shipped' ? 'Positive' : 'No measurable impact') + '</div>' +
    '<div class="pbox"><h4 class="ph">📝 What happened</h4>' + (wu && wu[1] ? '<p>' + esc(wu[1]) + '</p>' : '') + '<p>' + esc(o.note) + '</p></div>' +
    '<div class="pbox"><h4 class="ph">🔗 Links</h4><p><a href="' + esc(o.url) + '" target="_blank" rel="noopener">Open the test in Amplitude Experiment ↗</a></p>' + (wu && /^https?:/.test(wu[0]) ? '<p><a href="' + esc(wu[0]) + '" target="_blank" rel="noopener">Read the write-up in Confluence ↗</a></p>' : '') + '</div>');
}
const abSiteOk = s => { const f = state.abSite || 'both'; if (f === 'both') return true; const c = /dashery|^da$/i.test(s || '') ? 'DA' : /tee|^tp$/i.test(s || '') ? 'TP' : /both/i.test(s || '') ? 'B' : 'RB'; return f === 'DA' ? c === 'DA' : (c === 'B' || c === f); };
const tpDays = x => Math.round((parse(EXPS_AS_OF) - parse(x.start)) / DAY) + 1;
function tpRow(x, i) {
  const best = x.variants.reduce((m, v) => Math.max(m, v.conf || 0), 0), dash = '<span class="abtbd"><b>TBD</b><small>not in Split</small></span>';
  const chip = best >= 95 ? '<span class="abst yes">Yes</span>' : '<span class="abst">' + (best >= 80 ? 'Not yet · ' + best + '%' : 'Not yet') + '</span>';
  const tip = best >= 95 ? 'At least 95% confidence of a true difference.' : best >= 80 ? 'The best version has ' + best + '% confidence. It needs 95%.' : 'No version is close to 95% yet.';
  return '<div class="rowwrap"><div class="trow abrow" role="button" tabindex="0" data-tpx="' + i + '"><span class="tname tnico"><span class="ge gico g-CVR" aria-hidden="true">' + projIco({ t: x.name, obj: 'CVR' }) + '</span><b>' + esc(x.name) + '</b><span class="cap tmeta">' + sitePill('TP') + '<span class="tloc">' + esc(x.where) + '</span></span></span><span class="abday"><b>Day ' + tpDays(x) + '</b><small>since ' + short(x.start) + '</small></span>' + chip + dash + dash + '<span class="abcall"><span class="abv2 v-' + x.call[0] + '">' + esc(x.call[1]) + '</span></span><span class="chev" aria-hidden="true">▾</span></div></div>';
}
function tpDetailModal(i) {
  const x = typeof TPEXPS !== 'undefined' ? TPEXPS.items[i] : null; if (!x) return;
  const rows = [{ n: 'Control', p: x.control.p, c: x.control.conv, rel: null }].concat(x.variants.map(v => ({ n: v.n, p: v.p, c: v.conv, rel: v.rel, conf: v.conf })));
  const mtip = 'This is still measured in an old Ruby gem, so we can\'t say which metric it is. Ask Jon or Mike. We\'ll pull these tests into Amplitude soon.', mh = t => hint(t + ' <span class="thi" aria-hidden="true">ⓘ</span>', 'thhint', mtip);
  const tbl = '<table class="abt tpv"><thead><tr><th>Version</th><th>Participants</th><th>' + mh('Metric') + '</th><th>' + mh('Metric change') + '</th><th>Confidence</th></tr></thead><tbody>' + rows.map(r => '<tr><td>' + esc(r.n) + '</td><td>' + int(r.p) + '</td><td>' + pct(r.c, r.c < 0.1 ? 2 : 1) + '</td><td>' + (r.rel == null ? '–' : '<span class="chn ' + (r.rel >= 0 ? 'b' : 'w') + '">' + sgn(r.rel, 1) + '</span>') + '</td><td>' + (r.rel == null ? '–' : r.conf ? r.conf + '% confidence' : 'Not enough yet') + '</td></tr>').join('') + '</tbody></table>';
  openModal('<span class="tipsrc" hidden></span><div class="mhead"><h3 id="mtitle">' + esc(x.name) + '</h3></div><div class="mtags"><span class="rtag">' + siteDot('TP') + '</span><span class="rtag">' + esc(x.where) + '</span><span class="rtag">Day ' + tpDays(x) + ', since ' + short(x.start) + '</span><span class="abv2 v-' + x.call[0] + '">' + esc(x.call[1]) + '</span></div><div class="abwhat2"><h4 class="ph">🧪 About this test</h4><p>Read from the Split dashboard on ' + short(TPEXPS.asOf) + '. Split reports each test\'s own conversion goal, so these rates are not comparable across tests and none of them is sitewide CVR.</p></div>' + tbl + '<div class="abfoot2"><a class="srclink" href="' + esc(TPEXPS.url) + '" target="_blank" rel="noopener">Open in Split\u00a0↗</a></div>');
}
function testsHtml() {
  const f = state.abSite || 'both';
  const sigVal = t => { const r = abRd(t), g = (r.m || {})[r.goal]; return !g ? 0 : g.s === 'sig' ? 100 : g.c ? g.c : g.s === 'nb' ? -1 : g.s === 'early' ? -2 : 0; };
  const rb = (EXPS.live || []).filter(t => abSiteOk(testSite(t))).map(t => ({ start: t.start, html: testRow(t), n: testDays(t), name: t.name, sig: sigVal(t), cvr: siteImp(t.cvr.rel, t.reach), rpu: ((abRd(t).m || {}).rpv || {}).v, call: abRd(t).verdict[1] }));
  const tp = typeof TPEXPS !== 'undefined' && abSiteOk('TP') ? TPEXPS.items.map((x, i) => ({ start: x.start, html: tpRow(x, i), n: tpDays(x), name: x.name, sig: x.variants.reduce((m, v) => Math.max(m, v.conf || 0), 0), cvr: null, rpu: null, call: x.call[1] })) : [];
  const S = state.abSort || { k: 'days', dir: 1 }, key = { test: 'name', days: 'n', sig: 'sig', cvr: 'cvr', rpu: 'rpu', call: 'call' }[S.k] || 'n';
  const rows = rb.concat(tp).sort((p, q) => { const x = p[key], y = q[key]; if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return (typeof x === 'string' ? x.localeCompare(y) : x - y) * S.dir; });
  const facts = rows.length ? '<span class="sfacts"><span>' + rows.length + ' running</span><span aria-hidden="true">·</span><span>longest: day ' + Math.max(...rows.map(r => r.n)) + '</span></span>' : '';
  const seg = '<div class="abfilter"><span class="lbl">Filter by</span><div class="segs" role="group" aria-label="Site">' + [['both', 'RBO + TPO'], ['RB', 'RBO'], ['TP', 'TPO'], ['DA', 'Dashery']].map(o => '<button type="button" data-absite="' + o[0] + '" aria-pressed="' + (f === o[0]) + '">' + o[1] + '</button>').join('') + '</div></div>';
  return '<section class="sview"><div class="vhead vhl">' + abHeadline() + '</div>' +
    '<div class="group trun"><div class="ghead"><h3>Running</h3>' + facts + seg + '</div>' + abHeadSort() + '<div class="rows">' + (rows.length ? rows.map(r => r.html).join('') : '<p class="cap">No tests running here right now.</p>') + '</div></div>' +
    shippedHtml() +
    (EXPS.soon && EXPS.soon.some(x => abSiteOk(x.site)) ? soonHtml() : '') + '</section>';
}

/* ---------- Coming soon: what each product team is working on, what's next, and what moved ---------- */
const MOVE = m => !m || m === 'steady' ? '<span class="mvp flat" title="Steady">·</span>' : m === 'new' ? '<span class="mvp new">★ New</span>' : /^up/.test(m) ? '<span class="mvp up">▲ Moved up</span>' : '<span class="mvp dn">▼ Moved down</span>';
const MOVEL = { up: 'Moved up', down: 'Moved down', new: 'New this week', steady: 'Holding its place' };
const STC = st => { const x = (st || '').toLowerCase(); return /ship|live|launch(ed)?$|done/.test(x) ? 'done' : /block|delay|paus/.test(x) ? 'blocked' : /dev|qa|review|launching|flight|ready/.test(x) ? 'soon' : 'open'; };
const TEAMN = k => { const t = COMING.teams.find(x => x.key === k); return t ? t.icon + ' ' + t.name : k; };
const SITEN = x => x === 'TP' ? 'TeePublic' : x === 'RB' ? 'Redbubble' : x;
const PROG = it => {
  if (!it.pts) return { short: '–', long: 'No Jira progress yet: this is not broken into pointed tickets.' };
  const [a, z] = it.pts, p = z ? Math.round(a / z * 100) : 0, iss = it.ptsUnit === 'issues';
  return { p, short: p + '%', sub: a + ' of ' + z + (iss ? ' tickets' : ' pts'), long: iss ? a + ' of ' + z + ' Jira tickets done. This epic has no story points, so progress counts tickets.' : a + ' of ' + z + ' story points done in Jira. Points are the team\'s effort estimate, so this is share of the work, not share of tickets.' };
};
const OBJS = ['CVR', 'AOV', 'Revenue', 'Retention', 'Traffic', 'Ops', 'Compliance', 'Data'];
const OBJN = o => o === 'Data' ? 'Data foundation' : o;
const OBJE = { CVR: '🎯', AOV: '🛒', Revenue: '💵', Retention: '🔁', Traffic: '🚦', Ops: '⚙️', Compliance: '⚖️', Data: '🧮' };
const STAGE = it => { const x = (it.s || '').toLowerCase(); return /launched|results|^live$/.test(x) && !/test/.test((it.t || '').toLowerCase()) ? 'live' : /dev|qa|review|launching|flight|ready to ship|block|delay|live|paus/.test(x) ? 'flight' : 'next'; };
const STAGEN = { flight: '🛠️ In flight', next: '⏭️ Up next', live: '🚀 Launched' };
const keep = it => (state.obj === 'all' || it.obj === state.obj) && (state.stage === 'all' || STAGE(it) === state.stage);
const objChip = it => it.obj ? '<span class="chip obj" title="Objective">' + OBJE[it.obj] + ' ' + it.obj + '</span>' : '';
const lbItem = (scope, i) => scope === 'org' ? COMING.board[i] : COMING.teams.find(t => t.key === scope).items[i];
function lbRow(it, scope, i) {
  const g = PROG(it);
  return '<div class="lbrow" role="button" tabindex="0" data-lbm="' + scope + '|' + i + '"><span class="lbn">' + (i + 1) + '</span>' +
    '<span class="lbname"><span class="lbe" aria-hidden="true">' + it.e + '</span><span><b>' + esc(it.t) + '</b><span class="lbmeta">' + objChip(it) + (scope === 'org' ? '<span class="chip" title="Team">' + esc(TEAMN(it.team)) + '</span>' : it.site ? '<span class="chip" title="Site">' + esc(SITEN(it.site)) + '</span>' : '') + (it.tags || []).map(tg => '<span class="chip tg" title="Needs work from the ' + (tg === 'Data' ? 'Data Engineering' : 'Search') + ' team">needs ' + (tg === 'Data' ? 'Data Eng' : 'Search') + '</span>').join('') + '</span></span></span>' +
    '<span class="sstat ' + STC(it.s) + '">' + esc(it.s) + '</span><span class="lbeta">' + esc(it.eta || '') + '</span>' +
    '<span class="lbpts">' + (g.p != null ? '<span class="pbar"><i style="width:' + g.p + '%"></i></span><span class="cap"><b>' + g.short + '</b> · ' + g.sub + '</span>' + burnShort(it) : '<span class="cap">–</span>') + '</span>' + MOVE(it.move) + '<span class="chev" aria-hidden="true">›</span></div>';
}
const LBHEAD = '<div class="lbhead"><span>#</span><span>Project</span><span>Status</span><span>ETA</span><span>' + hint('Jira progress ⓘ', 'soft', '<b>Jira progress</b><br>Share of story points done on the project\'s Jira epic. Where an epic has no points, it counts tickets instead. A dash means there is no single epic to track.') + '</span><span>Priority</span><span></span></div>';
function lbModal(scope, i) {
  const it = lbItem(scope, i), g = PROG(it), mv = it.move || 'steady', team = scope === 'org' ? it.team : scope;
  openModal('<div class="mhead"><span class="lbl">' + esc(TEAMN(team)) + (it.site ? ' · ' + esc(SITEN(it.site)) : '') + '</span><h3 id="mtitle">' + it.e + ' ' + esc(it.t) + '</h3></div>' +
    '<div class="pmeta"><div><span class="lbl">Status</span><span class="sstat ' + STC(it.s) + '">' + esc(it.s) + '</span></div><div><span class="lbl">ETA</span><b>' + esc(it.eta || 'TBD') + '</b></div><div><span class="lbl">Priority</span>' + MOVE(mv) + '</div>' + ((it.tags || []).length ? '<div><span class="lbl">Touches</span>' + it.tags.map(tg => '<span class="chip tg">' + (tg === 'Data' ? '🧮 ' : '🔎 ') + tg + '</span>').join(' ') + '</div>' : '') + '</div>' +
    '<p class="pdesc">' + esc(it.d || '') + '</p>' +
    '<div class="pbox imp"><span class="lbl">' + (it.obj ? OBJE[it.obj] + ' Moves ' + it.obj + ' · ' : '') + 'Estimated impact</span><p>' + (it.imp ? '<b>' + esc(it.imp) + '</b><span class="cap"> · Source: ' + esc(it.impSrc || 'roadmap sheet') + '</span>' : 'No estimate yet. Ask the team to size it in the roadmap sheet.') + '</p></div>' +
    '<div class="pbox ' + (/^up/.test(mv) ? 'up' : mv === 'down' ? 'dn' : '') + '"><span class="lbl">' + MOVEL[/^up/.test(mv) ? 'up' : mv] + '</span><p>' + esc(it.why || (mv === 'steady' ? 'No change in priority since the last read.' : 'Raised in the latest planning.')) + '</p></div>' +
    '<div class="pbox"><span class="lbl">Progress</span>' + (g.p != null ? '<div class="pbar big"><i style="width:' + g.p + '%"></i></div><p><b>' + g.p + '%</b> · ' + esc(g.long) + '</p>' : '<p>' + esc(g.long) + '</p>') + '</div>' +
    refsHtml((it.refs || []).concat(it.link ? [{ jira: it.link.split('/').pop() }] : [])));
}
function teamRow(t) {
  const its = t.items.map((it, i) => [it, i]).filter(x => keep(x[0])), filt = state.obj !== 'all' || state.stage !== 'all';
  const open = state.open.has('tm:' + t.key) || (filt && its.length > 0), n = t.items.length, up = t.items.filter(x => /^up/.test(x.move) || x.move === 'new').length, bl = t.items.filter(x => STC(x.s) === 'blocked').length, live = t.items.filter(x => STC(x.s) === 'done').length;
  const stats = '<span class="tstat">' + (filt ? its.length + ' of ' + n : n) + ' projects</span>' + (up ? '<span class="tstat up">▲ ' + up + ' moved up or new</span>' : '') + (bl ? '<span class="tstat bl">' + bl + ' blocked or delayed</span>' : '') + (live ? '<span class="tstat ok">' + live + ' live</span>' : '');
  return '<div class="rowwrap"><div class="tmrow" role="button" tabindex="0" aria-expanded="' + open + '" data-tm="' + t.key + '"><span class="tmic" aria-hidden="true">' + t.icon + '</span><span class="tmt"><b>' + esc(t.name) + '</b><span>' + esc(t.tagline) + '</span></span><span class="tmstats">' + stats + '</span><span class="chev" aria-hidden="true">▾</span></div>' +
    (open ? '<div class="tmbody">' + LBHEAD + '<div class="lbrows">' + (its.length ? its.map(x => lbRow(x[0], t.key, x[1])).join('') : '<p class="cap empty1">Nothing on this team matches the filters.</p>') + '</div>' + (t.dropped ? '<p class="cap dropped"><b>Moved out:</b> ' + t.dropped.map(x => esc(x[0]) + ' (' + esc(x[1]) + ')').join(' · ') + '</p>' : '') + '</div>' : '') + '</div>';
}
const IMPS = { 'PayPlus offer at checkout': '$840K/yr', 'Cart and cart-tray cross-sell': '$500K–1M/yr', 'Redbubble quick wins': '+5% RB CVR', 'Learn to Rank rerun': '+2% search CTR', 'Checkout email opt-in and hashing': '+5–10% tracked', 'Delivery-issue resolution queue': 'More CS time', 'iOS native checkout test': 'A$1.3M/yr', 'Android native checkout': 'A$500K/yr', 'Feed fixes, incl. new iPhone case': '$960K/yr', 'Search cluster migration': 'Keeps search up', 'Let shoppers browse off TeePublic artist stores': '+2% CVR on 5%', 'SEO: 20 results per search page': '+1–2% crawl', 'Automated licensing and royalty reporting': '$2–2.5M/yr' };
const ORDER = ['PayPlus offer at checkout', 'Cart and cart-tray cross-sell', 'Search cluster migration', 'Thank-you page upsell, 6 slots', 'Sticker quick-add with quantity on search', 'Real-time Amplitude', 'Learn to Rank rerun', 'Checkout email opt-in and hashing', 'Beam conversion test', 'Shirt Monkey integration', 'T-shirt style pills on product pages', 'Redbubble quick wins', 'Feed fixes, incl. new iPhone case', 'Apple Pay buy-now on product pages', 'Delivery-issue resolution queue', 'Trucker hat fulfillment'];
const annual = b => { const v = R[b].filter(x => x != null).slice(-28); return sum(v) / v.length * 365; };
const fmtY = v => v >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : '$' + Math.round(v / 1e3) + 'K';
// Claude's rough sizing where no one has sized a project: assumed lift × the share of revenue it touches × that site's revenue run rate.
const CEST = {
  'T-shirt style pills on product pages': ['rb', 0.01, 0.4, '+1% CVR, about what TeePublic saw, on the ~40% of Redbubble orders that are T-shirts'],
  // Anchored on what the same feature did on TeePublic (Mike, Oct 27): sticker quick-add ≈ $0.76M/yr there (0.6% of revenue) and
  // cross-sell ≈ $1.56M/yr (1.2%), per the "TP - CVR Resource Results" Sigma dashboard.
  'Show the lowest-priced T-shirt style first in Redbubble search': ['rb', 0.006, 0.6, '+0.6% CVR on the ~60% of Redbubble orders that start in search, from opening on the cheaper classic tee'],
  'Trending tag on product pages test': ['tp', 0.003, 0.7, '+0.3% CVR on the ~70% of orders that pass through a product page, if the social proof wins its test'],
  'Fix sale prices in Google Shopping': ['rb', 0.01, 0.25, 'recovering about 1% of Google Shopping traffic lost to rejected listings, on the ~25% of revenue that comes from Shopping'],
  'Sign in with Google': ['rb', 0.002, 1, '+0.2% CVR from faster sign-in at checkout'],
  'Product scoping in search autocomplete': ['both', 0.002, 0.6, '+0.2% CVR on the ~60% of orders that start in search'],
  'Learn to Rank rerun': ['rb', 0.004, 0.6, '+0.4% CVR on the ~60% of Redbubble orders that start in search, from better-ranked results'],
  'SEO: 20 results per search page': ['both', 0.003, 0.3, '+0.3% revenue on the ~30% that arrives from organic search'],
  'Standardized wall art sizes': ['rb', 0.01, 0.1, '+1% revenue on wall art, about 10% of Redbubble revenue'],
  'Let shoppers browse off TeePublic artist stores': ['tp', 0.01, 0.1, '+1% CVR on the ~10% of orders that come through artist stores'],
  'Better sticker quick-add on Redbubble search': ['rb', 0.0059, 0.7, 'the same 0.6% of revenue that sticker quick-add brings TeePublic (about $0.76M a year), cut to 70% because adding a sticker raises Redbubble shipping costs'],
  'Cross-sell module on the checkout landing page': ['tp', 0.0122, 0.2, 'a new cross-sell spot adds about a fifth of what TeePublic\'s existing cross-sell earns (1.2% of revenue, about $1.56M a year)'],
  'A/B/C/D test of cross-sell placements': ['tp', 0.0122, 0.1, 'the best placement lifts TeePublic cross-sell (1.2% of revenue, about $1.56M a year) by about 10%'],
  'Product page badges': ['tp', 0.005, 0.7, '+0.5% CVR on the ~70% of orders that pass through a product page'],
  'Cart redesign (DoorDash-style)': ['tp', 0.004, 1, '+0.4% CVR across all orders from a clearer, faster cart'],
  'Quick shop': ['tp', 0.003, 0.6, '+0.3% CVR on the ~60% of orders that start from search or browse pages'],
  'Apple Pay buy-now on product pages': ['rb', 0.005, 0.5, '+0.5% CVR on the ~50% of Redbubble orders from shoppers who can use Apple Pay'],
  'Cart tray vs cart page test': ['both', 0.003, 1, '+0.3% CVR from putting cross-sell where it works best, across all orders'],
  'Premium tee upsell in cart': ['tp', 0.003, 1, 'a $3 upgrade taken by about 3% of Classic Tee carts, about +0.3% of TeePublic revenue'],
  'Sticker quick-add with quantity on search': ['tp', 0.005, 0.6, '+0.5% order value on the ~60% of orders that start from search'],
  'Thank-you page upsell, 6 slots': ['tp', 0.003, 1, 'post-purchase attach rising from about 0.5% to 0.8% of orders'],
  'Feed images at 1260px': ['tp', 0.02, 0.15, '+2% CVR on Google Shopping traffic, about 15% of TeePublic revenue'],
  'Sticker cross-sell on add to cart': ['tp', 0.004, 1, 'about +0.4% order value from stickers added at add to cart'],
  'Ranking test for 3+ word queries': ['rb', 0.01, 0.15, '+1% CVR on longer searches, about 15% of Redbubble orders'],
  'More prominent Redbubble search bar': ['rb', 0.003, 1, '+0.3% CVR from more shoppers starting with search'],
  'Greeting card and postcard search': ['rb', 0.1, 0.01, 'card sales up 10% in card season, with cards about 1% of Redbubble orders'],
  'Trucker hat fulfillment': ['tp', 0.003, 1, 'a new product adding about 0.3% to TeePublic revenue']
};
function cest(it) {
  const c = CEST[it.t]; if (!c) return null;
  const base = c[0] === 'both' ? annual('tp') + annual('rb') : annual(c[0]), v = base * c[1] * c[2], who = c[0] === 'both' ? 'TeePublic and Redbubble' : BR[c[0]].name;
  return { short: fmtY(v) + '/yr est.', how: 'Assumes ' + c[3] + '. ' + who + ' revenue runs at about ' + fmtY(base) + ' a year (last 28 days, annualized), so ' + (c[1] * 100).toFixed(1).replace('.0', '') + '% × ' + Math.round(c[2] * 100) + '% of ' + fmtY(base) + ' ≈ ' + fmtY(v) + ' a year. Rough, for ranking only.' };
}
// Latest update per project, from standups and Jira comments (read Oct 22).
const UPD = {
  'PayPlus offer at checkout': 'Launched Oct 22 as an A/B test on the confirmation and payment pages. The team and Rokt are watching payment to order-complete closely.',
  'Sign in with Google': 'Not live yet: the build is done and switching it on waits for Google to approve the sign-in app (resubmitted Oct 23).',
  'Apple Pay buy-now on product pages': 'Fast scoping started Oct 22, hoping to finish Tue Oct 27. Open questions: which product types show it, and agreeing that it checks out the whole cart.',
  'T-shirt style pills on product pages': 'Blocked: waiting on a fix in the apps; launch planned for Tue Oct 27. The "Filter Clicked" tracking event is also missing, so the test baseline is flagged. The size-guide bug found in QA is fixed.',
  'Print Logistics integration': 'Live in production but with no products yet: non-apparel uploads failed on missing print placement settings. Launch narrowed to TeePublic t-shirts, pillows and totes (Jira, Oct 22).',
  'Sub Dimension integration': 'Signed off Oct 22 after weeks waiting on the partner\'s shipping methods. Production release is planned.',
  'Shirt Monkey integration': 'Signed off Oct 22; production release is planned. Orders count as sent when the partner\'s webhook fires. Invoicing is still being worked out.',
  'Simon AI profile attributes': 'Consent fields shipped Oct 20 and match Simon with no mismatches. Waiting on Simon to import the new fields before they can be used in segments. SMS opt-in is deferred.',
  'Search cluster migration': 'Traffic is off the old cluster and in a bake period; decommissioning slipped a week. About 11 new index tickets opened Oct 21 are still in backlog with the Nov 7 deadline close.',
  'Learn to Rank rerun': 'Model work is nearly done in Jira; the production rerun is next.',
  'Thank-you page upsell, 6 slots': 'Code is ready (PR up Oct 20); shipping this week.',
  'Beam conversion test': 'Live in Statsig until about Nov 18; trending positively so far, but still very early (Oct 23).',
  'Cart and cart-tray cross-sell': 'Live on TeePublic; Redbubble version (stickers, cart page only) is in final QA for Oct 27 to 28. Before launch: tracking for carousel adds and an API caching question. Runs as an A/B on cart-to-checkout CVR.',
  'Delivery-issue resolution queue': 'Code is up for review for the self-service flow and the agent queue (Oct 20 to 21); email templates are ready.',
  'Trucker hat fulfillment': 'Prices aren\'t final, but that doesn\'t block the fulfillment launch (it can start at baseball-cap prices). Packaging is settled.',
  'Greeting card and postcard search': 'Ranking borrows sticker sales signals for cards for now. Card synonyms and exclusions set Oct 20 to 22; the final sitemap list is still pending.',
  'New iPhone cases in the feed': 'Tank-top feed fix is live. iPhone 18 Pro Max dropped from the new phone-case feed work (it still needs a larger image).',
  'Seller verification compliance': 'Technical discovery slipped a sprint and was split into three tickets.',
  'Products on order events in Amplitude': 'Fix widened to the cart add and remove events too, in the same pull request.',
  'Bad-art detection research': 'Test set built: about 10k Redbubble works (top sellers, likely AI and random).',
  'Fix Redbubble channel tracking': 'Not started; queued for the Customer team. Analytics wrote a UTM comparison doc.'
};
// Fresher notes from the project channels and Jira replace the hand-written ones (Mike, Oct 27).
if (typeof LATEST !== 'undefined') Object.keys(LATEST).forEach(t => { UPD[t] = LATEST[t].text; });
const siteDot = x => !x ? '<span class="faint">–</span>' : x === 'Both' ? '<i style="background:var(--tp)"></i><i style="background:var(--rb)"></i>RBO + TPO' : x === 'Dashery' ? '<i style="background:var(--ds)"></i>Dashery' : '<i style="background:var(--' + (x === 'TP' ? 'tp' : 'rb') + ')"></i>' + SITEN(x);
const PHASES = ['Discovery', 'Sizing', 'Building', 'Testing', 'Launching', 'Live'];
const phaseIx = st => { const x = (st || '').toLowerCase(); return /discovery/.test(x) ? 0 : /scop|siz|plan|next sprint|ready for dev/.test(x) ? 1 : /qa|review/.test(x) ? 3 : /launch|ready to ship/.test(x) ? 4 : /^live$|launched/.test(x) ? 5 : 2; };
const phaseBar = st => { const k = phaseIx(st), bad = STC(st) === 'blocked'; return '<span class="phb' + (bad ? ' bad' : '') + '" title="' + PHASES.map((p, i) => (i === k ? '▸ ' : '') + p).join(' · ') + '"><span class="phs">' + PHASES.map((p, i) => '<i class="' + (i <= k ? 'on' : '') + '"></i>').join('') + '</span><span class="phl">' + esc(st) + '</span></span>'; };
const LATE = it => /2027|Q1|Jan /.test(it.eta || '');
// Who may reorder each team: its Product Manager(s) and director, plus Mike everywhere. Names resolve to ids at view time.
const EDITORS = { customer: ['Jon Tan'], tiger: ['Jeff Cooper', 'Jon Tan'], plc: ['Revin Wade'], search: ['Matz Edstrom', 'Wendy Fullam', 'Imène Drir'], artist: ['Matz Edstrom', 'Imène Drir'], dashery: ['Grace Russell'], de: ['Amelia Cacchione', 'Imène Drir'], org: [] };
const ADMIN = 'Mike Carafa';
const REVIEWER = 'Matt Swope';
// Reviewed changes: acks/<item> holds the change signature someone cleared. A new change after that shows again.
const ACK = {};
const ackId = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80);
const chgSig = (it, prev) => chgOf(it, prev).map(c => c.k + ':' + (c.txt || '')).join('|');
const canAck = () => !!RT.db && RT.canWrite !== false && (OR.owner || (!!RT.me && RT.me === OR.ids[REVIEWER]));
const liveChg = (it, prev) => chgOf(it, prev);
const isRev = (it, prev) => { const a = ACK[ackId(it.t)]; return !!(a && a.on !== false && chgOf(it, prev).length && a.sig === chgSig(it, prev)); };
// Team colors: one hue per team, used for team tags everywhere on the Roadmap.
const teamKey = k => PARENT(k) || k;
// Who to ask: the Product Manager on a project (from PEOPLE), else the Product Manager who owns most of that team's roadmap.
let TEAM_PM = null;
const teamPm = k => { if (!TEAM_PM) { TEAM_PM = {}; const tally = {}; (typeof COMING !== 'undefined' ? COMING.teams : []).forEach(t => (t.items || []).forEach(it => { const p = typeof PEOPLE !== 'undefined' && PEOPLE[it.t] && PEOPLE[it.t].pm; if (!p) return; const key = teamKey(t.key); tally[key] = tally[key] || {}; tally[key][p] = (tally[key][p] || 0) + 1; })); Object.keys(tally).forEach(key => { TEAM_PM[key] = Object.entries(tally[key]).sort((a, z) => z[1] - a[1])[0][0]; }); } return TEAM_PM[teamKey(k)] || null; };
const pmOf = (title, team) => (typeof PEOPLE !== 'undefined' && PEOPLE[title] && PEOPLE[title].pm) || (team ? teamPm(team) : null);
const pmChip = (title, team) => { const n = pmOf(title, team); return n ? '<span class="pmc" title="Product Manager to contact"><svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="5.5" r="2.6"/><path d="M3 13.5c.8-2.4 2.7-3.6 5-3.6s4.2 1.2 5 3.6"/></svg>' + esc(n) + '</span>' : ''; };
const teamTag = k => '<span class="ttag tt-' + teamKey(k) + '">' + esc(TEAMS(k)) + '</span>';
const OR = { docs: [], ids: {}, owner: false, ready: false };
const allowed = team => (EDITORS[team] || []).concat([ADMIN]).map(n => OR.ids[n]).filter(Boolean);
const canEdit = team => !!RT.me && (OR.owner || allowed(team).indexOf(RT.me) > -1);
function effOrder(team) {
  const ok = allowed(team); let best = null;
  OR.docs.forEach(d => { const o = (d.orders || {})[team]; if (o && ok.indexOf(d.id) > -1 && (!best || o.at > best.at)) best = o; });
  return best ? best.list : null;
}
function applyTeamOrders(list) {
  const out = list.slice();
  Object.keys(EDITORS).filter(t => t !== 'org').forEach(team => {
    const ord = effOrder(team); if (!ord) return;
    const slots = out.map((it, i) => it.team === team ? i : -1).filter(i => i > -1), items = slots.map(i => out[i]);
    items.sort((a, z) => { const x = ord.indexOf(a.t), y = ord.indexOf(z.t); return (x < 0 ? 999 : x) - (y < 0 ? 999 : y); });
    slots.forEach((s, k) => { out[s] = items[k]; });
  });
  return out;
}
async function saveOrder(team, list) {
  const mine = OR.docs.find(d => d.id === RT.me) || { id: RT.me, orders: {} };
  const orders = Object.assign({}, mine.orders, { [team]: { list, at: Date.now() } });
  mine.orders = orders; if (OR.docs.indexOf(mine) < 0) OR.docs.push(mine);
  renderKeep();
  try { await RT.db.collection('order').doc(RT.me).set({ orders }); } catch (e) { alert && 0; const b = document.querySelector('.p-org .shead p'); if (b) b.textContent = 'Could not save the new order. You may only have view access.'; }
}
function moveItem(ref, dir) {
  const L = phaseList().filter(keep2), i = L.findIndex(x => x.ref === ref); if (i < 0) return;
  const it = L[i], scope = reorderScope(it), peers = scope === 'org' ? L : L.filter(x => x.team === it.team), k = peers.indexOf(it), j = k + dir;
  if (j < 0 || j >= peers.length) return;
  const list = peers.map(x => x.t); [list[k], list[j]] = [list[j], list[k]];
  saveOrder(scope, scope === 'org' ? list : list);
}
const reorderScope = it => state.fteam === 'all' && state.phase === 'pre' && OR.owner ? 'org' : it.team;
// Dashery is part of the Roadmap like every other team (Mike, Oct 27: leaving it out was a mistake).
const allItems = () => [].concat(...COMING.teams.map(t => t.items.map((it, i) => Object.assign({ team: t.key, ref: t.key + '|' + i }, it))));
function preList() {
  const all = allItems().filter(it => !LATE(it) && STAGE(it) !== 'live');
  const base = effOrder('org') || ORDER, rk = it => { const k = base.indexOf(it.t); return k < 0 ? 99 + ORDER.indexOf(it.t) : k; };
  return applyTeamOrders(all.sort((a, z) => rk(a) - rk(z)));
}
const postList = () => (COMING.post || []).map((it, i) => Object.assign({ ref: 'post|' + i, s: 'Post-peak', eta: it.when }, it));
const phaseList = () => state.phase === 'dashery' ? applyTeamOrders(COMING.teams.find(t => t.key === 'dashery').items.map((it, i) => Object.assign({ team: 'dashery', ref: 'dashery|' + i }, it))) : state.phase === 'post' ? postList() : preList();
const PB = it => { const g = PROG(it); return STC(it.s) === 'blocked' ? 'blocked' : g.p != null && g.p >= 75 ? 'almost' : /dev|qa|review|launching|ready to ship|flight|live/i.test(it.s || '') ? 'building' : 'early'; };
const PBN = { early: '🌱 Early: discovery or sizing', building: '🛠️ Building', almost: '🏁 Almost done (75%+)', blocked: '⛔ Blocked or delayed' };
const PSTAGE = s => { const x = (s || '').toLowerCase(); return /discovery/.test(x) ? '🌱 In discovery' : /scop|siz/.test(x) ? '📐 Being sized' : /plan|next sprint|ready for dev/.test(x) ? '🗓️ Not started' : /qa|review/.test(x) ? '🧪 Testing' : /dev|flight/.test(x) ? '🛠️ Building' : /launch|ready to ship/.test(x) ? '🚀 Ready to ship' : /live/.test(x) ? '✅ Live' : /block|delay|paus/.test(x) ? '⛔ Stuck' : '–'; };
const teamOk = it => state.fteam === 'all' || it.team === state.fteam || PARENT(it.team) === state.fteam || (state.fteam.endsWith(':core') && it.team === state.fteam.split(':')[0]);
// Search matches the project name, description, team, objective, status and site.
const qOk = it => { const q = (state.q || '').trim().toLowerCase(); if (!q) return true; const hay = [it.t, it.sheet, it.d, TEAMS(it.team), it.obj, it.s, it.site, it.eta].join(' ') /* the sheet's own title is searchable too (Wendy, Oct 28) */.toLowerCase(); return q.split(/\s+/).every(w => hay.indexOf(w) >= 0); };
const keep2 = it => qOk(it) && (!state.chg || (state.chg === 'risk' ? atRisk(it) : chgOf(it).some(c => c.k === state.chg))) && (state.obj === 'all' || it.obj === state.obj) && teamOk(it) && (state.prog === 'all' || state.phase === 'post' || PB(it) === state.prog);
const lbItem2 = ref => { const [k, i] = ref.split('|'); if (k === 'dashery') return Object.assign({ team: 'dashery' }, COMING.teams.find(t => t.key === 'dashery').items[+i]); if (k === 'post') return Object.assign({ s: 'Post-peak', eta: COMING.post[+i].when }, COMING.post[+i]); if (k === 'wins') return COMING.wins[+i]; return Object.assign({ team: k }, COMING.teams.find(t => t.key === k).items[+i]); };
const TEAMS = k => { const t = COMING.teams.find(x => x.key === k); if (!t) return k; const p = t.parent && COMING.teams.find(x => x.key === t.parent); return p ? p.icon + ' ' + p.name + ' › ' + t.icon + ' ' + t.name : t.icon + ' ' + t.name; };
const PARENT = k => { const t = COMING.teams.find(x => x.key === k); return t && t.parent; };
function lbRow2(it, n) {
  const g = PROG(it), wins = state.phase === 'wins';
  return '<div class="lbrow' + (wins ? ' win' : '') + (!wins && state.phase !== 'post' && burnRisk(it) ? ' risk' : n <= 3 && state.phase !== 'wins' ? ' top top' + n : '') + '" role="button" tabindex="0" data-lbm2="' + it.ref + '"><span class="lbn">' + (n <= 3 && !state.chg && !(state.q || '').trim() && state.fteam === 'all' && state.obj === 'all' && state.prog === 'all' ? ['🥇', '🥈', '🥉'][n - 1] : n) + '' + '</span>' +
    '<span class="lbname"><span class="lbe" aria-hidden="true">' + it.e + '</span><span><b>' + esc(it.t) + '</b>' + (!wins && it.inj ? ' <span class="injp" title="' + esc(it.for ? 'Added mid-cycle; displaced ' + it.for : 'Added mid-cycle') + '">Injected</span>' : '') + (!wins && state.phase === 'pre' ? chgOf(it).map(c => ' <span class="chgp ' + c.k + '">' + esc(c.txt) + '</span>').join('') : '') + (!wins && STC(it.s) === 'blocked' ? '<span class="lbblk">⛔ ' + esc(UPD[it.t] || it.why || it.s) + '</span>' : '<span class="lbd">' + esc(wins ? it.imp : it.d || '') + '</span>') + '</span></span>' +
    '<span class="lbteam">' + esc(TEAMS(it.team)) + '</span>' + (wins ? '' : '<span class="lbsite">' + siteDot(it.site) + '</span>') +
    (wins ? '<span class="lbeta">' + esc(it.when) + '</span><span class="lbsrc cap">' + esc(it.src || '') + '</span>' :
      (state.phase === 'post' ? '' : '<span>' + phaseBar(it.s) + '</span>') + '<span class="lbeta">' + esc(it.eta || 'TBD') + (() => { const c = state.phase === 'pre' ? chgOf(it).find(x => x.k === 'date') : null; return c ? '<span class="cap was">was ' + esc(c.was || 'TBD') + '</span>' : ''; })() + '</span><span class="lbimp">' + (IMPS[it.t] ? hint('👤 ' + esc(IMPS[it.t]), 'soft', '<b>Estimated by people</b><br>From ' + esc(it.impSrc || 'the roadmap sheet') + '.') : cest(it) ? hint(cest(it).short, 'ce', '<b>🤖 Claude\'s estimate, not the team\'s</b><br>' + esc(cest(it).how)) : '<span class="faint">–</span>') + '</span>' +
      (state.phase === 'post' ? '' : '<span class="lbpts">' + burnCell(it) + '</span>')) +
    (state.reord && !wins && state.phase !== 'post' && canEdit(reorderScope(it)) ? '<span class="rmv"><button type="button" data-mv="' + it.ref + '|-1" aria-label="Move up">▲</button><button type="button" data-mv="' + it.ref + '|1" aria-label="Move down">▼</button></span>' : '<span class="chev" aria-hidden="true">›</span>') + '</div>';
}
function lbHead2() {
  const H = state.phase === 'wins' ? ['#', 'Shipped', 'Team', 'When', 'Impact source'] : state.phase === 'post' ? ['#', 'Project', 'Team', 'Site', 'Timing', 'Est. impact'] : ['#', 'Project', 'Team', 'Site', 'Status', 'Launch ETA', 'Est. impact', hint('Burn-down ⓘ', 'soft', '<b>Burn-down</b><br>Work left in Jira and days left to launch. The bar shows the weekly pace that launch date needs, as a share of what the team delivered per week over its last two sprints (Matt Swope\'s sprint metrics). Red means it needs more than half the team\'s pace, or the project is blocked. Open a project for the full chart. Hover any cell for its math.')];
  return '<div class="lbhead ' + state.phase + '">' + H.map(h => '<span>' + h + '</span>').join('') + '<span></span></div>';
}
// Burn-down: work left against the time left before launch, so a team can see the pace it needs.
const MONI = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
function etaDate(eta) {
  const e = eta || '', m = e.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w* (\d{1,2})/);
  if (m) return Date.UTC(2026, MONI[m[1]], +m[2]);
  if (/this week/i.test(e)) { const t = parse(D.asOf); return t + (5 - new Date(t).getUTCDay() + 7) % 7 * DAY + DAY; }
  if (/end of oct/i.test(e)) return Date.UTC(2026, 9, 31);
  return null;
}
const teamVel = k => typeof VEL === 'undefined' ? null : VEL[k] || (PARENT(k) && VEL[PARENT(k)]) || null;
// Burn-down cell: work left, the pace the launch date needs, and that pace against what the team delivers.
function burnCell(it) {
  if (!it.pts) return '<span class="pstage">' + PSTAGE(it.s) + '</span>';
  const g = PROG(it), [done, total] = it.pts, left = total - done, end = etaDate(it.eta), v = teamVel(it.team), unit = it.ptsUnit === 'issues' ? 'tickets' : 'pts';
  if (!left) return '<span class="bcell ok"><b>✓ Done in Jira</b><span class="cap">' + g.sub + '</span></span>';
  if (!end) return '<span class="bcell"><b>' + left + ' ' + unit + ' left</b><span class="cap">' + g.p + '% done · no launch date</span></span>';
  const days = Math.max(1, Math.round((end - parse(D.asOf) - DAY) / DAY)), pace = left / Math.max(days / 7, 1 / 7), share = v && it.ptsUnit !== 'issues' ? pace / v.wk : null;
  const w = Math.min(100, Math.round((share != null ? share : pace / total) * 100)), hot = burnRisk(it);
  const pc = pace >= 10 ? Math.round(pace) : pace.toFixed(1), tn = (COMING.teams.find(t => t.key === it.team) || {}).name || 'team';
  const tip = '<b>' + left + ' ' + unit + ' left, ' + days + ' day' + (days === 1 ? '' : 's') + ' to launch (' + esc(it.eta) + ')</b><br>' + (share != null ? 'Finishing on time needs about ' + pc + ' points a week. The ' + esc(tn) + ' team delivers about ' + v.wk + ' a week, so this one project needs <b>' + Math.round(share * 100) + '% of the whole team\'s pace</b>.<br>' + (hot ? '<b class="w">Red</b> means over 50%: the team has other work too, so this launch date is at risk.' : 'Under 50% of the team\'s pace, so it looks on track.') : 'Needs about ' + pc + ' tickets a week. Counted in tickets, so there is no team pace to compare with and it is not graded.');
  return hint('<span class="bcell' + (hot ? ' hot' : '') + '"><b>' + left + ' ' + unit + ' left · ' + days + 'd</b><span class="bbar"><i style="width:' + w + '%"></i></span><span class="cap">' + (share != null ? Math.round(share * 100) + '% of team pace' : 'needs ' + (pace >= 10 ? Math.round(pace) : pace.toFixed(1)) + '/wk') + '</span></span>', 'soft bhint', tip);
}
// A row is a concern if it is blocked, or its launch date needs more than half its team's weekly output.
function burnRisk(it) {
  if (STC(it.s) === 'blocked') return true;
  if (!it.pts) return false; const [done, total] = it.pts, left = total - done, end = etaDate(it.eta), v = teamVel(it.team);
  if (!left || !end) return false; const dl = Math.round((end - parse(D.asOf) - DAY) / DAY);
  // Points only burn when a ticket closes, so a short window always looks behind (Mike, Oct 28: "5 points left in 1 day" on a ticket about to ship).
  // Only grade the pace when at least two weeks remain; closer in, the status and latest update decide.
  if (dl < 14) return false; const pace = left / (dl / 7);
  // Red only when the pace needed is more than half of what the whole team delivers a week. Ticket counts have no team pace to compare with, so they are not graded.
  return !!(v && it.ptsUnit !== 'issues' && pace / v.wk > 0.5);
}
function burnShort(it) {
  if (!it.pts) return ''; const [done, total] = it.pts, left = total - done, end = etaDate(it.eta);
  if (!left || !end) return '';
  const wk = Math.max(1, Math.round((end - parse(D.asOf) - DAY) / DAY)) / 7, pace = left / Math.max(wk, 1 / 7), steep = pace > total / 2;
  const v = teamVel(it.team), hot = burnRisk(it);
  return '<span class="bsh' + (hot ? ' hot' : '') + '" title="Burn-down: ' + left + ' left before ' + esc(it.eta) + (v ? '. The team delivers about ' + v.wk + ' points a week.' : '') + '">🔥 needs ' + (pace >= 10 ? Math.round(pace) : pace.toFixed(1)) + '/wk' + (share != null ? ' · ' + Math.round(share * 100) + '% of team pace' : '') + '</span>';
}
function burnHtml(it) {
  if (!it.pts) return '';
  const [done, total] = it.pts, left = total - done, unit = it.ptsUnit === 'issues' ? 'tickets' : 'points', end = etaDate(it.eta), now = parse(D.asOf) + DAY;
  if (!left) return '<div class="burn ok"><b>🔥 Burn-down:</b> nothing left in Jira. Launch is the next step.</div>';
  if (!end) return '<div class="burn"><b>🔥 Burn-down:</b> ' + left + ' ' + unit + ' left. Add a launch date to see the pace needed.</div>';
  const days = Math.max(1, Math.round((end - now) / DAY)), wk = days / 7, pace = left / Math.max(wk, 1 / 7);
  const sv = '<svg class="bsv" viewBox="0 0 120 36" aria-hidden="true"><line x1="4" y1="6" x2="116" y2="30" class="bl"/><circle cx="4" cy="' + (6 + 24 * done / total).toFixed(1) + '" r="3" class="bd"/></svg>';
  return '<div class="burn' + (burnRisk(it) ? ' hot' : '') + '">' + sv + '<span><b>🔥 Burn-down:</b> ' + left + ' of ' + total + ' ' + unit + ' left with ' + days + ' day' + (days === 1 ? '' : 's') + ' to launch (' + esc(it.eta) + '). That needs about <b>' + (pace >= 10 ? Math.round(pace) : pace.toFixed(1)) + ' ' + unit + ' a week</b>' + (pace > total / 2 ? ', which is a steep pace.' : '.') + (teamVel(it.team) && it.ptsUnit !== 'issues' ? ' The team delivers about <b>' + teamVel(it.team).wk + ' points a week</b>, so this needs ' + Math.round(pace / teamVel(it.team).wk * 100) + '% of its pace.' : '') + '</span></div>';
}
// Burndown from the project's Jira epic (src/burn.json), with the team's latest sprint read from the sprint metrics channels (src/swope.json).
function burnChart(it) {
  const B = typeof BURN !== 'undefined' && BURN[it.t]; if (!B || !B.series || !B.series.length) return '';
  const t0 = parse(B.start), now = parse(B.asOf || D.asOf), eta = etaDate(it.eta), t1 = Math.max(now, eta || 0) + 2 * DAY;
  const top = Math.max(B.total || 0, ...B.series.map(p => p[1]), ...(B.scope || []).map(p => p[1])) || 1;
  const W = 560, H = 190, m = { l: 34, r: 12, t: 12, b: 26 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
  const x = t => m.l + iw * Math.max(0, Math.min(1, (t - t0) / Math.max(DAY, t1 - t0))), y = v => m.t + ih * (1 - v / top);
  const step = pts => { let d = ''; pts.forEach((p, i) => { const X = x(parse(p[0])).toFixed(1), Y = y(p[1]).toFixed(1); d += i ? 'H' + X + 'V' + Y : 'M' + X + ' ' + Y; }); const last = pts[pts.length - 1]; return d + 'H' + x(now).toFixed(1) + (last ? '' : ''); };
  let g = '<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y(0) + '" y2="' + y(0) + '" style="stroke:var(--line-2)"/><line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y(top) + '" y2="' + y(top) + '" style="stroke:var(--line)"/>' +
    '<text x="' + (m.l - 6) + '" y="' + (y(top) + 4) + '" text-anchor="end">' + Math.round(top * 10) / 10 + '</text><text x="' + (m.l - 6) + '" y="' + (y(0) + 4) + '" text-anchor="end">0</text>';
  if (B.scope && B.scope.length) g += '<path d="' + step(B.scope) + '" style="fill:none;stroke:var(--faint);stroke-width:1.5;stroke-dasharray:4 3"/>';
  const remNow = B.series[B.series.length - 1][1];
  if (eta && eta > t0) { g += (eta > now && remNow > 0 ? '<line x1="' + x(now) + '" y1="' + y(remNow) + '" x2="' + x(eta) + '" y2="' + y(0) + '" style="stroke:var(--good);stroke-width:1.5;stroke-dasharray:2 4"/>' : '') + '<line x1="' + x(eta) + '" x2="' + x(eta) + '" y1="' + m.t + '" y2="' + y(0) + '" style="stroke:var(--muted);stroke-dasharray:2 3"/><text x="' + x(eta) + '" y="' + (H - 8) + '" text-anchor="end" style="fill:var(--ink);font-weight:600">Launch ' + esc(rng(it.eta)) + '</text>'; }
  g += '<path d="' + step(B.series) + '" style="fill:none;stroke:var(--accent);stroke-width:2.5;stroke-linejoin:round"/>';
  const rem = B.series[B.series.length - 1][1];
  g += '<circle cx="' + x(now) + '" cy="' + y(rem) + '" r="4" style="fill:var(--accent);stroke:var(--surface);stroke-width:2"/><text x="' + x(t0) + '" y="' + (H - 8) + '">' + esc(short(B.start)) + '</text>' + (!eta || x(eta) - x(now) > 7.5 * ('Launch ' + rng(it.eta)).length + 30 || x(now) > x(eta) + 40 ? '<text x="' + x(now) + '" y="' + (H - 8) + '" text-anchor="middle">Today</text>' : '');
  const u = B.unit === 'issues' ? 'tickets' : 'pts', wks = eta ? Math.max(.5, (eta - now) / (7 * DAY)) : null, need = wks ? rem / wks : null;
  const S = typeof SWOPE !== 'undefined' && SWOPE[teamKey(it.team)], note = S && S.projects && S.projects[it.t];
  return '<div class="pbox mburn"><h4 class="ph">📉 Burndown from Jira <span class="cap">' + esc(B.epic) + '</span></h4>' +
    '<svg class="burnsvg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Work remaining over time">' + g + '</svg>' +
    '<div class="burnkey"><span><i class="bk rem"></i>Work left</span>' + (B.scope && B.scope.length ? '<span><i class="bk scope"></i>Total scope</span>' : '') + (eta ? '<span><i class="bk ideal"></i>Pace needed from today</span>' : '') + '</div>' +
    '<p class="burnsum"><b>' + Math.round(rem * 10) / 10 + ' of ' + Math.round((B.total || top) * 10) / 10 + ' ' + u + ' left</b>' + (B.lastDone ? ' · last done ' + esc(short(B.lastDone)) : '') + (need != null && rem > 0 ? ' · needs about ' + (Math.round(need * 10) / 10) + ' ' + u + ' a week to land ' + esc(rng(it.eta)) : rem === 0 ? ' · all Jira work done' : '') + '.</p>' +
    (S ? '<div class="sprintread"><span class="lbl">Sprint read · ' + esc(TEAMS(teamKey(it.team))) + (S.date ? ' · ' + esc(short(S.date)) : '') + '</span><p>' + (note ? '<b>' + esc(note) + '</b> ' : '') + esc(S.summary || '') + (S.completed != null && S.committed != null ? ' (' + S.completed + ' of ' + S.committed + ' committed done' + (S.carryover ? ', ' + S.carryover + ' carried over' : '') + ')' : '') + '</p>' + (S.link ? '<a class="ref ext" href="' + esc(S.link) + '" target="_blank" rel="noopener">Sprint metrics post ↗</a>' : '') + '</div>' : '') + '</div>';
}
// Latest update, always shown: newest note from the project's channel, the sprint metrics channels or Jira, dated and linked (Mike, Oct 27).
function latestBox(it, L, upd) {
  const fd = d => { const x = new Date(d + 'T12:00:00Z'); return WD[x.getUTCDay()] + ' ' + MON[x.getUTCMonth()] + ' ' + x.getUTCDate(); };
  const over = [it.sheetS ? 'status ' + esc(it.sheetS) + ' → ' + esc(it.s) : '', it.sheetEta ? 'launch ' + esc(it.sheetEta) + ' → ' + esc(it.eta) : ''].filter(Boolean);
  const body = L ? '<p>' + esc(L.text) + '</p><p class="cap">' + fd(L.date) + ' · ' + (L.url ? '<a href="' + esc(L.url) + '" target="_blank" rel="noopener">' + esc(L.src) + ' ↗</a>' : esc(L.src)) + (over.length ? ' · Newer than the roadmap sheet, so it updates the ' + over.join(' and ') : '') + '</p>'
    : upd ? '<p>' + esc(upd) + '</p><p class="cap">From standups and Jira comments, Oct 22</p>' : '<p class="cap">Nothing new in its project channel, the sprint metrics channels or Jira since the roadmap sheet was synced (' + esc(COMING.asOf) + ').</p>';
  return '<div class="pbox upd"><h4 class="ph">🔔 Latest update</h4>' + body + '</div>';
}
function lbModal2(ref) {
  const it = lbItem2(ref), g = PROG(it), wins = ref.indexOf('wins') === 0;
  if (wins) { const meta = [['Shipped', '<b>' + esc(it.when) + '</b>'], ['Team', esc(TEAMS(it.team))], ['Site', esc(SITEN(it.site))]]; return openModal('<div class="mhead"><h3 id="mtitle">' + it.e + ' ' + esc(it.t) + '</h3></div><div class="pmeta">' + meta.map(m => '<div><span class="lbl">' + m[0] + '</span>' + m[1] + '</div>').join('') + '</div>' + (it.d ? '<div class="pbox"><p>' + esc(it.d) + '</p></div>' : '') + refsHtml(it.refs || [])); }
  const c = confOf(it), k = stepIx(it.s), ce = cest(it), imp = IMPS[it.t] || it.imp, upd = UPD[it.t] || (g.p === 100 ? 'All Jira work is done; it is waiting to launch.' : ''), LT = typeof LATEST !== 'undefined' && LATEST[it.t];
  const P = (typeof PEOPLE !== 'undefined' && PEOPLE[it.t]) || {}, prev = typeof COMING_PREV !== 'undefined' ? COMING_PREV : null, chg = prev ? liveChg(it, prev) : [];
  const fact = (l, v, sub, cls) => '<div class="mfact' + (cls ? ' ' + cls : '') + '"><span class="lbl">' + l + '</span><b>' + v + '</b>' + (sub ? '<span class="cap">' + sub + '</span>' : '') + '</div>';
  const cD = chg.find(x => x.k === 'date'), cP = chg.find(x => x.k === 'phase' || x.k === 'blocked');
  const facts = '<div class="mfacts">' + fact('Estimated launch', esc(rng(it.eta)), cD ? 'Was ' + esc(rng(cD.was)) + ' at the ' + esc(prev.asOf.replace(/^the /, '')) + (it.why ? '. ' + esc(it.why) : '') : '', cD ? 'chg' : '') +
    fact('Estimated impact', imp ? esc(imp) : ce ? '<span class="ceval">' + ce.short + '</span>' : /^(Ops|Data|Compliance)$/.test(it.obj || '') ? 'No direct revenue' : 'Not sized yet', imp ? 'From ' + esc(it.impSrc || 'the roadmap sheet') : ce ? 'Claude\'s estimate. ' + esc(ce.how) : '') +
    fact('Status', stuck(it.s) ? esc(it.s) : STEPS[k], (cP && cP.k === 'phase' ? 'Was ' + esc(lcx(cP.txt.split(' → ')[0].replace(/^\S+ /, ''))) + '. ' : '') + (stuck(it.s) ? 'Was ' + lcx(STEPS[k]) : k < 6 ? 'Next: ' + STEPS[k + 1] : ''), cP ? 'chg' : stuck(it.s) ? 'bad' : k === 6 ? 'good' : '') + '</div>';
  const steps = '<ol class="mstep" aria-label="Progress">' + STEPS.map((p, i) => '<li class="' + (i < k ? 'd' : i === k ? 'c' + (stuck(it.s) ? ' bad' : '') : '') + '">' + (i === k && stuck(it.s) && k !== 6 ? hint('!', 'dot dhint', '<b>' + esc(c.l) + ' at ' + esc(lcx(p)) + '</b><br>' + c.why.map(esc).join('<br>')) : '<span class="dot" aria-hidden="true">' + (i < k || (i === k && k === 6) ? '✓' : '') + '</span>') + '<span class="lb">' + p + '</span></li>').join('') + '</ol>';
  const tags = '<div class="mtags">' + (it.site ? '<span class="rtag">' + siteDot(it.site) + '</span>' : '') + (it.inj ? '<span class="rtag inj">Injected' + (it.for ? ': displaced ' + esc(it.for) : '') + '</span>' : '') + chg.map(x => chgTag(it, x, prev)).join('') + '</div>';
  const conf = '<div class="pbox mconf ' + c.k + '"><h4 class="ph">' + (c.k === 'bad' ? '🔴' : c.k === 'warn' ? '🟡' : c.k === 'live' ? '🟢' : '⚪') + ' Launch confidence: ' + c.l + '</h4>' + (c.why.filter(w => !LT || w !== LT.text).map(w => '<p>' + esc(w) + '</p>').join('') || '<p>Based on the latest update below.</p>') + '</div>';
  const who = [['Product Manager', P.pm], ['Tech lead', P.lead], ['Engineers', (P.eng || []).join(', ')], ['Looped in', (P.looped || []).join(', ')], ['Exec sponsor', P.sponsor]].filter(x => x[1]);
  const people = '<div class="pbox"><h4 class="ph">👥 Who\'s on it</h4>' + (who.length ? '<dl class="mwho">' + who.map(x => '<dt>' + x[0] + '</dt><dd>' + esc(x[1]) + '</dd>').join('') + '</dl>' : '<p class="cap">Not listed in Jira or the roadmap sheet yet.</p>') + '</div>';
  const docs = (P.docs || []).map(d => ({ url: d.url, l: d.l })).concat(((typeof UXL !== 'undefined' && UXL[it.t]) || []).map(d => ({ url: d.url, l: d.l })));
  const bc = burnChart(it);
  openModal('<div class="mhead"><h3 id="mtitle">' + it.e + ' ' + esc(it.t) + '</h3></div>' + tags +
    // What the project is comes first and says so (Mike, Oct 26), then the three facts.
    '<div class="mrow2">' + (it.d ? '<div class="pbox mdesc"><h4 class="ph">📝 Description</h4><p>' + esc(it.d) + '</p></div>' : '') + people + '</div>' + facts + steps + bc +
    (g.p != null && !bc ? '<details class="pbox mjira"><summary><h4 class="ph">📈 Progress in Jira: ' + g.p + '%</h4></summary><div class="pbar big"><i style="width:' + g.p + '%"></i></div><p class="cap">' + esc(g.long) + '</p>' + burnHtml(it) + '</details>' : '') +
    (ph => ph.indexOf('<div class="pbox prov"><h4 class="ph">🔎 Where this comes from</h4>') === 0 && /<\/div>$/.test(ph) ? '<details class="pbox prov"><summary><h4 class="ph">🔎 Where this comes from</h4></summary>' + ph.slice('<div class="pbox prov"><h4 class="ph">🔎 Where this comes from</h4>'.length, -6) + '</details>' : ph)(provHtml(it, LT, P)) +
    linksHtml((it.refs || []).concat(docs).concat(it.link ? [{ jira: it.link.split('/').pop() }] : []), it));
}
// Where every fact in the pop-up came from (Mike, Oct 28: after the first exec roadmap review, teams asked "why is Claude saying X?").
// A source recorded by the refresh (src/sources.json) wins; otherwise the default says where that field is read from.
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1fbxp4eAXZe1JNmhxsiDJTeSRhOdAOeblmOiVbU0yNkU';
// Same "Where this comes from" box for tests and recent impact (Mike, Oct 28). rows: [label, value, source html].
const provLnk = (txt, url) => url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(txt) + ' ↗</a>' : esc(txt);
const provBox = rows => '<div class="pbox prov"><h4 class="ph">🔎 Where this comes from</h4><dl class="provl">' + rows.filter(Boolean).map(r => '<dt>' + r[0] + '</dt><dd>' + (r[1] ? '<b>' + r[1] + '</b> · ' : '') + '<span class="cap">' + r[2] + '</span></dd>').join('') + '</dl></div>';
function testProv(t) {
  const R = (typeof SRCS !== 'undefined' && SRCS[t.name]) || {}, pick = (k, d) => R[k] ? provLnk(R[k].from || R[k].where || 'Source', R[k].url) : d, amp = provLnk('Amplitude Experiment', t.url), tm = testTeam(t), tk = COMING.teams.find(x => x.key === tm) || {}, pm = pmOf(t.name, tm), site = testSite(t);
  return provBox([
    ['🧪 The test', esc(t.name), pick('origin', 'Running or decided in ' + amp + (t.id ? ' (experiment ' + esc(t.id) + ')' : '') + ', read ' + esc(short(EXPS_AS_OF)))],
    ['👥 Team', esc(tk.name || TEAMS(tm) || '–'), pick('team', 'Worked out from the test\'s owners in ' + amp + ', matched to the team they work on')],
    ['👤 Product Manager', esc(pm || 'Not listed'), pick('pm', (typeof PEOPLE !== 'undefined' && PEOPLE[t.name] && PEOPLE[t.name].pm) ? 'Listed for this test in Jira or the roadmap sheet' : 'Not listed for this test, so this is the Product Manager who owns most of ' + esc(tk.name || 'that team') + '\'s roadmap')],
    ['🌐 Site', esc(SITEN(site)), pick('site', 'The Amplitude project the test runs in (' + (site === 'TP' ? 'TeePublic' : 'Redbubble') + ')')],
    ['📅 Dates', esc(short(t.start)) + (t.end ? ' to ' + esc(short(t.end)) : ', still running'), pick('dates', 'Start and end dates in ' + amp)],
    t.primary ? ['🎯 Primary metric', esc(t.primary.name) + ' ' + sp(t.primary.rel, 1), pick('primary', 'The test\'s primary metric in ' + amp + ', test vs control')] : null,
    ['🌍 Whole-site impact', sp(siteImp(t.cvr.rel, t.reach)), pick('site_imp', 'Calculated: the CVR lift for people in the test × the share of site traffic the test reaches (' + Math.round((t.reach || 1) * 100) + '%), both from ' + amp)],
    ['📏 Confidence', t.p == null ? 'Not available' : conf(t) + '%', pick('conf', t.p == null ? 'Amplitude Experiment has no significance reading for this test yet' : 'From the significance (p-value) ' + amp + ' reports for the primary comparison')],
    t.call ? ['📣 The call', '', pick('call', 'Claude\'s read of the numbers above; the team makes the decision')] : null
  ]);
}
function impProv(it) {
  const R = (typeof SRCS !== 'undefined' && SRCS[it.t]) || {}, pick = (k, d) => R[k] ? provLnk(R[k].from || R[k].where || 'Source', R[k].url) : d, tk = COMING.teams.find(x => x.key === it.team) || {}, pm = pmOf(it.t, it.team), rv = revEst(it);
  return provBox([
    ['📋 Why it\'s here', '', pick('origin', 'Shipped or decided in the last 30 days, from release announcements in #released, Jira releases and the roadmap\'s wins list')],
    ['👥 Team', esc(tk.name || TEAMS(it.team) || '–'), pick('team', 'The team that owns it on the roadmap sheet or in Jira')],
    ['👤 Product Manager', esc(pm || 'Not listed'), pick('pm', (typeof PEOPLE !== 'undefined' && PEOPLE[it.t] && PEOPLE[it.t].pm) ? 'Listed for this project in Jira or the roadmap sheet' : 'Not listed for this project, so this is the Product Manager who owns most of ' + esc(tk.name || 'that team') + '\'s roadmap')],
    ['🌐 Site', esc(SITEN(it.site) || '–'), pick('site', 'Where it shipped, from the release post or Jira')],
    ['📅 Shipped or decided', esc(it.when || '–'), pick('when', 'The release post in #released or the Jira release date')],
    ['📊 Result', esc((IMPSH[it.t] || [''])[0] || OUTN[it.out][1]), pick('result', esc(it.src || 'The team\'s readout'))],
    rv ? ['💵 Annual revenue', esc(rv.short), pick('rev', 'Claude\'s estimate: ' + esc(rv.how))] : null
  ]);
}
function provHtml(it, LT, P) {
  // Design agency pass 4 (Mike, Oct 28): the source tag IS the link; Slack says who posted it; sheet rows say tab and row;
  // confidence names its rule and the exact record behind it, plus the team's pace from the sprint metrics posts.
  const R = (typeof SRCS !== 'undefined' && SRCS[it.t]) || {}, DT = (typeof DATES !== 'undefined' && DATES[it.t]) || {}, tk = COMING.teams.find(t => t.key === it.team) || {}, tn = tk.name || TEAMS(it.team);
  const JU = k => 'https://articore.atlassian.net/browse/' + k;
  const KIND = { slack: 'Slack', jira: 'Jira', sheet: 'Roadmap sheet', calc: 'Claude\'s rule', claude: 'Claude\'s estimate', meeting: 'Meeting notes', release: '#released', metrics: 'Sprint metrics', none: 'Not found' };
  const A = (txt, url, cls) => url ? '<a class="' + (cls || '') + '" href="' + esc(url) + '" target="_blank" rel="noopener">' + txt + '</a>' : '<span class="' + (cls || '') + '">' + txt + '</span>';
  const src = x => { if (!x) return ''; const k = x.kind || (/^#/.test(x.where || '') ? 'slack' : /DEAP-/.test(x.where || '') ? 'jira' : 'x');
    let where = String(x.where || '').replace(/^Roadmap sheet,\s*/i, '').replace(/^Jira\s+/i, '').replace(/^Slack\s+/i, '');
    return '<span class="pvs">' + A(esc(KIND[k] || 'Source'), x.url, 'pvk k-' + esc(k)) + (where && where.toLowerCase() !== String(KIND[k] || '').toLowerCase() ? ' ' + A(esc(where), x.url, 'pvwhere') : '') +
      (x.who && k !== 'sheet' ? ' · ' + (k === 'slack' || k === 'metrics' ? 'posted by ' : k === 'jira' ? 'changed by ' : '') + '<b>' + esc(x.who) + '</b>' : '') + (x.date ? ' · ' + esc(short(x.date)) : '') +
      (x.what ? '<br><span class="pvw">' + (k === 'slack' || k === 'meeting' ? 'What they said, in short: ' : 'What it shows: ') + esc(x.what) + '</span>' : '') + '</span>'; };
  const sheet = () => ({ kind: 'sheet', where: 'Active Work tab', url: SHEET_URL });
  const ltSrc = () => { if (!LT) return null; const m = (LT.src || '').match(/^(Slack|Jira)\s+(.*)$/i), k = m ? m[1].toLowerCase() : /Roadmap Review|standup/i.test(LT.src) ? 'meeting' : /DEAP-/.test(LT.src) ? 'jira' : 'slack'; return { kind: k, where: m ? m[2] : LT.src, date: LT.date, url: LT.url, what: LT.text, who: LT.who }; };
  const notFound = { kind: 'none', where: 'Not found in the roadmap sheet, Jira or the project\'s Slack channels' };
  const pm = pmOf(it.t, it.team), hasPm = typeof PEOPLE !== 'undefined' && PEOPLE[it.t] && PEOPLE[it.t].pm;
  const st = (DT.startSrc || '').match(/(DEAP-\d+)/), B = typeof BURN !== 'undefined' && BURN[it.t], v = teamVel(it.team), c = confOf(it), ce = cest(it);
  const statusSrc = R.s || (it.sheetS ? ltSrc() : sheet());
  const SW = typeof SWOPE !== 'undefined' && (SWOPE[it.team] || SWOPE[PARENT(it.team)]);
  const WATCHRE = /slipp|slipped|\bslips?\b|delayed|\bdelay\b|behind schedule|pushed (back|out)|moved (out|back)|at risk|\bblocked\b|waiting on|carried over|won't make|will miss|missed (the |its )?(date|deadline)/i, upd0 = (LT && LT.text) || UPD[it.t] || '';
  const trig = c.k === 'warn' ? (upd0.split(/(?<=[.!?])\s/).find(x => WATCHRE.test(x)) || '') : '', word = trig ? (trig.match(WATCHRE) || [''])[0] : '';
  const rule = { ok: 'On track means nothing in its sources says it\'s late or blocked, and its launch date is before the Nov 20 freeze.', warn: trig ? 'Watch, because its latest update says: "' + trig + '"' : 'Watch: its latest update says it\'s slipping, delayed or blocked.', bad: 'At risk: ' + (c.why[0] || ''), none: 'No date yet: no launch date in the sources.', live: 'Launched.' }[c.k] || '';
  const rows = [
    ['Why it\'s on the roadmap', it.inj ? 'Added since the Oct 13 roadmap review' : 'On the roadmap sheet', R.origin || (it.inj ? notFound : sheet())],
    ['Product Manager', pm || 'Not listed', R.pm || (hasPm ? notFound : { kind: 'calc', where: 'None listed for this project, so this shows who owns most of ' + tn + '\'s roadmap' }), R.pm_also],
    ['Team', tn, R.team || sheet()],
    ['Goal', OBJN(it.obj) || 'None set', R.obj || sheet()],
    ['Site', SITEN(it.site) || 'Both', R.site || sheet()],
    ['Status', it.s || 'TBD', statusSrc, R.s_sheet || (it.sheetS ? Object.assign(sheet(), { what: 'Still says ' + it.sheetS }) : null)],
    ['Launch date', rng(it.eta) || 'TBD', R.eta || (it.sheetEta ? ltSrc() : sheet()), R.eta_sheet || (it.sheetEta ? Object.assign(sheet(), { what: 'Still says ' + it.sheetEta }) : null)],
    DT.start ? ['Work started', short(DT.start), R.start || (st ? { kind: 'jira', where: st[1], url: JU(st[1]), what: 'The first ticket moved to In Progress on ' + short(DT.start) } : { kind: 'jira', where: DT.startSrc || '' })] : null,
    ['Confidence', c.l, { kind: 'calc', where: rule }, c.k === 'live' ? null : c.k === 'warn' && trig && LT ? Object.assign(ltSrc(), { pre: 'Based on', what: null }) : /points left/.test(c.why[0] || '') && B ? { pre: 'Based on', kind: 'jira', where: B.epic + ', points left on its tickets', url: JU(B.epic), date: B.asOf, what: (B.total - B.done) + ' of ' + B.total + ' points left, against the team pace below' } : Object.assign({}, statusSrc || {}, { pre: 'Based on' })],
    v && SW ? ['Team pace', 'About ' + Math.round(v.wk * 2) + ' points a sprint', { kind: 'metrics', where: '#team-deap-metrics-' + ({ customer: 'customer', plc: 'plc', de: 'data-engineering', dashery: 'dashery', search: 'search', artist: 'artist' }[PARENT(it.team) || it.team] || it.team), who: 'Matt Swope', date: SW.date, url: SW.link, what: SW.sprint + ': ' + (SW.summary || '').split(/(?<=[.!?])\s/)[0] }] : null,
    ['Estimated impact', IMPS[it.t] || it.imp || (ce ? ce.short : 'Not sized'), R.imp || (IMPS[it.t] || it.imp ? (it.impSrc && !/roadmap sheet/i.test(it.impSrc) ? { kind: 'x', where: it.impSrc } : sheet()) : ce ? { kind: 'claude', where: ce.how } : Object.assign(sheet(), { what: 'No impact entered' }))]
  ].filter(Boolean);
  const line = (lbl, x) => x ? '<br><span class="pvlbl">' + (x.pre || lbl) + ':</span> ' + src(x) : '';
  // Say so when this page shows something different from what its source says (Oct 28 trace: goals, sites and teams often differ from the sheet).
  const differs = (val, x) => x && x.what && val && !new RegExp(String(val).replace(/[^A-Za-z]/g, '.').slice(0, 6), 'i').test(x.what);
  const sheetSays = x => String(x.what || '').replace(/^(Goal|Brand|Team|Platform):\s*/i, '');
  return '<div class="pbox prov"><h4 class="ph">🔎 Where this comes from</h4><dl class="provl">' + rows.map(r => '<dt>' + esc(r[0]) + '</dt><dd><b>' + esc(r[1]) + '</b>' + (/^(Goal|Site|Team)$/.test(r[0]) && differs(r[1], r[2]) && !(r[0] === 'Team' && (/artist|app/i.test(r[1]) && /artist|app/i.test(sheetSays(r[2])) || PARENT(it.team) && new RegExp(TEAMS(PARENT(it.team)), 'i').test(sheetSays(r[2])))) ? '<br><span class="pvflag">⚠️ This dashboard shows ' + esc(r[1]) + ', but the roadmap sheet says ' + esc(sheetSays(r[2])) + '.</span>' : '') + line('Source', r[2]) + line('Also', r[3]) + '</dd>').join('') + '</dl></div>';
}
// The pop-up's links section: every place to read more, labeled by what you get.
function linksHtml(r, it) {
  const team = COMING.teams.find(t => t.key === teamKey(it.team)) || {};
  const out = r.map(x => x.jira ? ['🎫', 'Jira ' + x.jira, 'https://articore.atlassian.net/browse/' + x.jira] : x.url ? [/atlassian\.net\/wiki/.test(x.url) ? '📄' : /docs\.google/.test(x.url) ? '📝' : /slack\.com/.test(x.url) ? '💬' : '🔗', x.l, x.url] : null).filter(Boolean);
  const inner = r.filter(x => x.go || x.test || x.soon);
  if (!out.length && !inner.length) return '<div class="pbox mlinks"><h4 class="ph">🔗 Links</h4><p class="cap">No Jira epic or docs linked yet.</p></div>';
  return '<div class="pbox mlinks"><h4 class="ph">🔗 Links</h4><ul>' + out.map(x => '<li><a href="' + esc(x[2]) + '" target="_blank" rel="noopener"><span aria-hidden="true">' + x[0] + '</span>' + esc(x[1]) + ' <span class="ext" aria-hidden="true">↗</span></a></li>').join('') + '</ul>' + (inner.length ? refsHtml(inner) : '') + '</div>';
}
function filtersHtml() {
  const base = phaseList(), objs = OBJS.filter(o => base.some(i => i.obj === o)), teams = COMING.teams.filter(t => base.some(i => i.team === t.key)), progs = ['early', 'building', 'almost', 'blocked'].filter(p => state.phase !== 'post' && base.some(i => PB(i) === p));
  if (state.obj !== 'all' && objs.indexOf(state.obj) < 0) state.obj = 'all';
  const tops = COMING.teams.filter(t => !t.parent && (teams.some(x => x.key === t.key) || teams.some(x => x.parent === t.key)));
  const topts = [].concat(...tops.map(t => { const kids = teams.filter(x => x.parent === t.key); return kids.length ? [[t.key, t.icon + ' ' + t.name + ' (all)'], [t.key + ':core', '\u00a0\u00a0\u00a0' + t.icon + ' ' + t.name + ' core']].concat(kids.map(k => [k.key, '\u00a0\u00a0\u00a0↳ ' + k.icon + ' ' + k.name])) : [[t.key, t.icon + ' ' + t.name]]; }));
  if (state.fteam !== 'all' && !topts.some(o => o[0] === state.fteam)) state.fteam = 'all';
  if (state.prog !== 'all' && progs.indexOf(state.prog) < 0) state.prog = 'all';
  const any = state.obj !== 'all' || state.fteam !== 'all' || state.prog !== 'all' || !!(state.q || '').trim();
  const sel = (k, opts, lab) => '<label class="fsel"><span class="flbl">' + lab + '</span><select data-fs="' + k + '">' + opts.map(o => '<option value="' + o[0] + '"' + (state[k] === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></label>';
  return '<div class="filters2"><span class="fhead">⚲ Filter</span><label class="fsel fsearch"><span class="flbl">Search</span><input type="search" data-fq="1" placeholder="Project, team, status…" value="' + esc(state.q || '') + '" aria-label="Search projects"></label>' + sel('fteam', [['all', 'All teams']].concat(topts), 'Team') +
    (objs.length > 1 ? sel('obj', [['all', 'All objectives']].concat(objs.map(o => [o, OBJE[o] + ' ' + OBJN(o)])), 'Objective') : '') +
    (progs.length > 1 ? sel('prog', [['all', 'Any progress']].concat(progs.map(p => [p, PBN[p]])), 'Progress') : '') +
    (any ? '<button type="button" class="linkbtn" data-fclear="1">Clear filters</button>' : '') + '</div>';
}
function soonSummary() {
  const L = preList(), lk = it => '<button type="button" class="inl" data-lbm2="' + it.ref + '">' + esc(it.t) + '</button>', list = a => a.slice(0, 3).map(lk).join(', ');
  const up = L.filter(i => /^up/.test(i.move) || i.move === 'new'), bl = L.filter(i => STC(i.s) === 'blocked'), wk = L.filter(i => /this week/i.test(i.eta || ''));
  return '<div class="ssum"><p><b>' + L.length + ' projects</b> are lined up before the Nov 20 code freeze.</p><ul>' +
    (wk.length ? '<li><span>🚀 Launching this week</span><span>' + list(wk) + '</span></li>' : '') + (up.length ? '<li><span>▲ Moved up or new</span><span>' + list(up) + (up.length > 3 ? ' and ' + (up.length - 3) + ' more' : '') + '</span></li>' : '') + (bl.length ? '<li><span>⛔ Blocked or delayed</span><span>' + list(bl) + '</span></li>' : '') + '</ul></div>';
}
// Write-ups: readouts with results get the gold link; specs and design docs are ordinary links.
const WU = { 'Remove shipping options from cart': ['https://articore.atlassian.net/wiki/spaces/EC1/pages/5056036893/RB+A+B+Cart+Shipping+Options+Test+-+Post-Project+Analysis', 'Cart-to-order CVR up 2.0% (48.3% to 49.2%) and cart-to-checkout up 19%. Shipped to 100% Sep 8.'] };
const SPECS = { 'Dashery cart sticker upsell': ['https://articore.atlassian.net/wiki/spaces/EDTP/pages/5076320263/2609+Cart+Upsell+TDD', 'Technical design'], 'Exact US sales tax at Redbubble checkout': ['https://articore.atlassian.net/wiki/spaces/PL/pages/5112266767/PLC-5977+Tax+Amount+Based+on+Full+Address', 'Design doc'], 'Sign in with Google': ['https://articore.atlassian.net/wiki/spaces/EC1/pages/4959797251/C26TP+Product+Spec+Google+Sign-In+for+TeePublic', 'Product spec'], 'Marketing opt-in on Express Pay': ['https://articore.atlassian.net/wiki/spaces/EC1/pages/5047943343/RB2609+Product+Spec+Marketing+Opt-In+for+Express+Payment+Purchasers', 'Product spec'] };
const wuLink = it => WU[it.t] ? '<a class="wugold" href="' + WU[it.t][0] + '" target="_blank" rel="noopener">🏅 Read the write-up ↗</a>' : '';
const IMPSH = { 'Bug fix: men\'s tee images back in the Shopping feed': ['Fixed', 'bug fix'], 'Sign in with Google': ['Live', 'feature shipped'], 'Marketing opt-in on Express Pay': ['Working', 'feature shipped'], 'Flat-lay T-shirt thumbnails in search': ['+1.0% CVR', 'whole-site'], 'Product image first on all apparel': ['+1.2% CVR', 'in the test'], 'Dashery cart sticker upsell': ['17% → 30%', 'sticker attach'], 'Exact US sales tax at Redbubble checkout': ['82%', 'of US orders covered'], 'Remove shipping options from cart': ['+2.0% CVR', 'cart to order'] };
// Annual revenue impact. Every figure here is Claude's estimate: lift × share of revenue it touches × that site's run rate.
const REVEST = {
  'Flat-lay T-shirt thumbnails in search': ['rb', 0.0097, 1, 'about +1% whole-site CVR from the A/B test (1.4% lift × 69% of orders reached)'],
  'Product image first on all apparel': ['rb', 0.012, 0.38, '+1.2% CVR for people in the test, who make up about 38% of Redbubble orders'],
  'Remove shipping options from cart': ['rb', 0.02, 0.9, '+2.0% cart-to-order CVR, applied to the ~90% of orders that pass through the cart'],
  'Bug fix: men\'s tee images back in the Shopping feed': ['tp', 0.1, 0.045, 'men\'s images convert about 10% better, on roughly 30% of T-shirt listings in Shopping, which drive about 15% of TeePublic revenue']
};
const revEst = it => { const c = REVEST[it.t]; if (!c) return null; const base = annual(c[0]), v = base * c[1] * c[2]; return { v, short: '+' + fmtY(v) + '/yr est.', how: 'Assumes ' + c[3] + '. ' + BR[c[0]].name + ' revenue runs at about ' + fmtY(base) + ' a year (last 28 days, annualized), so the estimate is about ' + fmtY(v) + ' a year. Rough, for comparison only.' }; };
const impShort = it => IMPSH[it.t] || (it.test && it.rel != null ? [sgn(it.rel, 1), it.metric] : it.out === 'measuring' ? ['Measuring', ''] : it.out === 'flat' ? ['No change', ''] : ['–', '']);
function impactList() {
  const W = (COMING.wins || []).map(w => Object.assign({ out: w.out || (/^measuring|watching/i.test(w.imp) ? 'measuring' : 'win') }, w)), ids = new Set([].concat(...W.map(w => (w.refs || []).map(r => r.test).filter(Boolean))));
  const T = EXPS.done.map(t => ({ e: testE(t.name), t: t.name, team: 'customer', site: 'RB', when: short(t.end), out: t.status === 'shipped' ? 'win' : t.cvr.rel < -0.002 ? 'loss' : 'flat', imp: (t.status === 'shipped' ? 'Shipped. ' : 'Kept control. ') + esc(t.primary.name) + ' ' + sgn(t.primary.rel, 1) + ' in the test', src: 'Amplitude Experiment', refs: [{ test: t.id, l: 'The test' }], test: true, rel: t.primary.rel, metric: t.primary.name }));
  const O = EXPS.older.map(o => ({ e: testE(o.name), t: o.name, team: 'customer', site: 'RB', when: short(o.end), out: o.status === 'shipped' ? 'win' : 'flat', imp: WU[o.name] ? WU[o.name][1] : o.note, src: 'Amplitude Experiment', refs: [{ url: o.url, l: 'The test' }] }));
  const seen = new Set(W.map(w => w.t.toLowerCase()));
  return W.concat(T.filter(x => !seen.has(x.t.toLowerCase()) && !ids.has(x.refs[0].test)), O);
}
const OUTN = { win: ['🟢', 'Win'], flat: ['⚪', 'No change'], loss: ['🔴', 'Didn\'t work'], measuring: ['🟡', 'Measuring'] };
// Flags on Claude's estimates: anyone can mark one inaccurate or helpful, with a note, so Mike can fix the numbers.
let FLAGS = {};
const flagKey = it => it.t.replace(/[^A-Za-z0-9]+/g, '-').slice(0, 60);
const flagCount = it => { let off = 0, good = 0; Object.values(FLAGS).forEach(m => { const f = m[flagKey(it)]; if (f) f.v === 'off' ? off++ : good++; }); return { off, good }; };
const flagBtn = it => { const n = flagCount(it), mine = RT.me && FLAGS[RT.me] && FLAGS[RT.me][flagKey(it)]; return '<button type="button" class="flagb' + (n.off ? ' has' : '') + (mine ? ' mine' : '') + '" data-flag="' + esc(it.t) + '" aria-label="Flag this estimate" title="' + (n.off || n.good ? n.off + ' flagged inaccurate · ' + n.good + ' marked helpful' : 'Flag this estimate') + '"><svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 14V2.5"/><path d="M3.5 3h8l-1.6 3 1.6 3h-8"/></svg>' + (n.off ? '<span>' + n.off + '</span>' : '') + '</button>'; };
function flagModal(t) {
  const it = impactList().find(x => x.t === t); if (!it || !revEst(it)) return;
  const mine = (RT.me && FLAGS[RT.me] && FLAGS[RT.me][flagKey(it)]) || {}, can = RT.db && RT.me && RT.canWrite !== false, n = flagCount(it);
  openModal('<div class="mhead"><span class="lbl">Claude\'s estimate</span><h3 id="mtitle">' + it.e + ' ' + esc(it.t) + '</h3></div>' +
    '<div class="pbox"><b>' + esc(revEst(it).short) + '</b><p class="cap">' + esc(revEst(it).how) + '</p></div>' +
    (can ? '<form class="flagf" data-flagf="' + esc(it.t) + '"><div class="flagv" role="radiogroup" aria-label="Your read"><label><input type="radio" name="fv" value="off"' + (mine.v !== 'good' ? ' checked' : '') + '> ⚑ Looks inaccurate</label><label><input type="radio" name="fv" value="good"' + (mine.v === 'good' ? ' checked' : '') + '> 👍 This was helpful</label></div>' +
      '<label class="flagn"><span class="lbl">Why? What would make it right?</span><textarea name="note" rows="3" maxlength="600" placeholder="e.g. the lift only applies to Redbubble apparel, not the whole site">' + esc(mine.note || '') + '</textarea></label>' +
      '<div class="flagact"><button type="submit" class="btn pri">' + (mine.v ? 'Update' : 'Send') + '</button>' + (mine.v ? '<button type="button" class="linkbtn" data-flagdel="' + esc(it.t) + '">Remove my flag</button>' : '') + '<span class="cap">' + (n.off || n.good ? n.off + ' flagged inaccurate · ' + n.good + ' marked helpful so far' : 'Mike reviews these and updates the numbers.') + '</span></div></form>'
      : ''));
}
async function flagSave(t, v, note) {
  const it = impactList().find(x => x.t === t); if (!it || !RT.db || !RT.me) return;
  const cur = Object.assign({}, FLAGS[RT.me] || {}); if (v) cur[flagKey(it)] = { v, note: (note || '').slice(0, 600), at: new Date().toISOString(), est: revEst(it).short, item: it.t }; else delete cur[flagKey(it)];
  try { await RT.db.collection('flags').doc(RT.me).set({ items: cur }); FLAGS[RT.me] = cur; closeModal && closeModal(); renderKeep(); } catch (e) { const f = document.querySelector('.flagf .cap'); if (f) f.textContent = 'Could not save. You may need edit access to this page.'; }
}
function impModal(i) {
  const it = impactList()[i], o = OUTN[it.out];
  openModal('<div class="mhead"><h3 id="mtitle">' + it.e + ' ' + esc(it.t) + '</h3></div><div class="pmeta"><div><span class="lbl">Result</span><b>' + o[0] + ' ' + o[1] + '</b></div><div><span class="lbl">Shipped or decided</span><b>' + esc(it.when) + '</b></div><div><span class="lbl">Team</span>' + esc(TEAMS(it.team)) + '</div>' + (it.site ? '<div><span class="lbl">Site</span>' + esc(SITEN(it.site)) + '</div>' : '') + '</div>' +
    (revEst(it) ? '<div class="pbox"><h4 class="ph">💵 Projected annual revenue</h4><p><b>' + revEst(it).short + '</b></p><p class="cap">Claude\'s estimate. ' + esc(revEst(it).how) + '</p></div>' : '') + '<div class="pbox imp"><h4 class="ph">📊 What happened</h4><p><b>' + it.imp + '</b></p><p class="cap">Source: ' + esc(it.src || '') + '</p>' + wuLink(it) + (!WU[it.t] ? '<p class="cap">📝 No results write-up in Confluence yet.' + (SPECS[it.t] ? ' <a class="ref ext" href="' + SPECS[it.t][0] + '" target="_blank" rel="noopener">' + SPECS[it.t][1] + ' ↗</a>' : '') + '</p>' : '') + '</div>' +
    '<div class="pbox"><h4 class="ph">💡 What it means</h4><p>' + (it.out === 'win' ? 'Keep it, and look for the next version of the same idea.' : it.out === 'loss' ? 'We kept the old version. The learning feeds the next test in this area.' : it.out === 'measuring' ? 'Too early to call. This updates when enough data is in.' : 'No measurable difference, so we kept the simpler option.') + '</p></div>' + impProv(it) + refsHtml(it.refs));
}
// Headline: the biggest win in one short line. Subhead: the next two, with their numbers.
function impHead(rk, lbl) {
  const r = w => (IMPSH[w.t] || [''])[0], nm = w => hint(esc(ucf(w.t.replace(/^Bug fix: /, ''))), 'verd b', '<b>' + esc(w.t) + '</b><br>' + esc(r(w) || '') + (revEst(w) ? ' · ' + esc(revEst(w).short) : '') + '<br>' + esc(w.when || '') + (w.site ? ' · ' + esc(SITEN(w.site)) : '') + (w.imp ? '<br><span class="cap">' + w.imp + '</span>' : ''));
  if (!rk.length) return '';
  const res = w => r(w) && !/^fixed$/i.test(r(w)) ? '<span class="b">' + esc(r(w)) + '</span>' : 'fixed';
  return '<p class="verdict rmverd">Recent impact: ' + nm(rk[0]) + ' won ' + res(rk[0]) + '.</p>' + (rk.length > 1 ? '<p class="sulead">' + rk.slice(1, 3).map(w => nm(w) + ' ' + (res(w) === 'fixed' ? 'fixed' : res(w)) + (revEst(w) ? ' (' + revEst(w).short + ')' : '')).join('. ') + '.</p>' : '');
}
// The filter row for Recent impact: one chip per site and team that appears in the list, plus whatever is selected.
function impFilters(L) {
  const sites = [...new Set(L.map(x => x.site).filter(x => x && x !== 'Both'))], teams = [...new Set(L.map(x => x.team).filter(Boolean))];
  const chip = (attr, v, on, html) => '<button type="button" class="gpill' + (on ? ' on' : '') + '" ' + attr + '="' + esc(v) + '">' + html + '</button>';
  const sel = state.sites.length + state.teams.length + state.goals.length + state.pms.length;
  return '<div class="ifilt rmpills"><span class="flbl">Filter</span>' + sites.map(x => chip('data-ssel', x, state.sites.indexOf(x) >= 0, siteDot(x))).join('') + '<span class="ifsep"></span>' +
    teams.map(x => { const tk = COMING.teams.find(t => t.key === x) || {}; return chip('data-tmsel', x, state.teams.indexOf(x) >= 0, (tk.icon || '') + ' ' + esc(tk.name || TEAMS(x))); }).join('') +
    state.pms.map(x => chip('data-psel', x, true, '👤 ' + esc(x) + ' ✕')).join('') + (sel ? '<button type="button" class="linkbtn" data-fclear2="1">Clear all</button>' : '') + '</div>';
}
function impactHtml() {
  // Labels filter the table: site, team, goal and Product Manager, shared with the Roadmap's filters (Mike, Oct 27).
  ['sites', 'teams', 'goals', 'pms'].forEach(k => { if (!Array.isArray(state[k])) state[k] = []; });
  const L0 = impactList(), fOk = it => (!state.sites.length || state.sites.indexOf(it.site) >= 0 || it.site === 'Both') && (!state.teams.length || state.teams.indexOf(it.team) >= 0 || state.teams.indexOf(PARENT(it.team)) >= 0) && (!state.goals.length || state.goals.indexOf(it.obj) >= 0) && (!state.pms.length || state.pms.indexOf(pmOf(it.t, it.team)) >= 0);
  const L = L0, cnt = k => L.filter(x => x.out === k).length, decided = L.filter(x => x.out !== 'measuring');
  const wins = L.filter(x => x.out === 'win'), recent = wins.filter(x => { const t = etaDate(x.when); return t && t >= parse(D.asOf) - 6 * DAY; }), pool = recent.length ? recent : wins, best = pool.slice().sort((a, z) => ((revEst(z) || {}).v || 0) - ((revEst(a) || {}).v || 0))[0], bestLbl0 = 'Biggest recent win', wu = L.filter(x => WU[x.t]).length;
  const teams = [...new Set(L.map(x => x.team))];
  const card = (e, k, big, sub, cls, at) => '<' + (at ? 'button type="button" ' + at : 'div') + ' class="ist ' + (cls || '') + '"><span class="istk">' + e + ' ' + k + '</span><b>' + big + '</b><span class="cap">' + sub + '</span>' + (at ? '<span class="istgo">Details →</span></button>' : '</div>');
  // The biggest win leads in gold; the next three wins sit beside it as equals. Ranked by Claude's annual revenue estimate, then recency.
  // Top row: wins from the last 30 days only, rolling (Mike, Oct 26: a Sep 8 win was too old to headline). Fewer than four means fewer cards.
  const win30 = wins.filter(x => { const t = etaDate(x.when); return t && t >= parse(D.asOf) - 30 * DAY; });
  const ranked = win30.slice().sort((a, z) => ((revEst(z) || {}).v || 0) - ((revEst(a) || {}).v || 0) || (etaDate(z.when) || 0) - (etaDate(a.when) || 0));
  const wcard = (w, gold) => { const sh = IMPSH[w.t] || ['', ''], rv = revEst(w); return '<button type="button" class="wcard' + (gold ? ' gold' : '') + '" data-imp="' + L.indexOf(w) + '">' + (gold ? '<span class="wck">🏆 ' + esc(bestLbl) + '</span>' : '') + '<span class="wct"><span aria-hidden="true">' + w.e + '</span> ' + esc(ucf(w.t.replace(/^Bug fix: /, ''))) + '</span><span class="wcn">' + esc(sh[0] || 'Win') + (sh[1] ? ' <small>' + esc(sh[1]) + '</small>' : '') + '</span><span class="cap">' + (rv ? rv.short + ' · ' : '') + esc(w.when) + (w.site ? ' · ' + esc(SITEN(w.site)) : '') + '</span></button>'; };
  // The gold card is always the biggest win on the page (Mike, Oct 23: a smaller "this week" win in gold next to bigger ones read as wrong).
  const lead = ranked[0], others = ranked.filter(w => w !== lead).slice(0, 3);
  const bestLbl = lead && recent.indexOf(lead) >= 0 ? 'Biggest win this week' : bestLbl0;
  // Same four-card row as before (Mike, Oct 22): only the content changed, biggest win first in gold, then the next three wins.
  const res = w => esc((IMPSH[w.t] || ['–'])[0]), meta = w => [revEst(w) ? revEst(w).short : '', esc(w.when || ''), w.site ? SITEN(w.site) : ''].filter(Boolean).join(' · ');
  const summary = lead ? '<div class="isum">' + card('🏆', bestLbl, res(lead), esc(ucf(lead.t.replace(/^Bug fix: /, ''))) + ' · ' + meta(lead), 'gold', 'data-imp="' + L.indexOf(lead) + '"') +
    others.map(w => card(w.e, esc(ucf(w.t.replace(/^Bug fix: /, ''))), res(w), meta(w), 'good', 'data-imp="' + L.indexOf(w) + '"')).join('') + '</div>' : '';
  const head = '<div class="ihead"><span>Shipped</span><span>Site, team and Product Manager</span><span>Result</span><span>Impact</span><span>' + hint('Est. revenue / yr ⓘ', 'soft', '<b>Projected annual revenue impact</b><br>Claude\'s estimate: the measured lift × the share of revenue it touches × that site\'s revenue run rate. Click a row to see the math, the source and any write-up.') + '</span><span>When</span><span></span></div>';
  const order = ['win', 'measuring', 'flat', 'loss'];
  const rows = L.map((it, i) => [it, i]).filter(x => fOk(x[0])).sort((a, z) => order.indexOf(a[0].out) - order.indexOf(z[0].out)).map(([it, i]) => { const sh = impShort(it); return '<div class="irow ' + it.out + '" role="button" tabindex="0" data-imp="' + i + '">' +
    '<span class="lbname"><span class="ge gico g-' + esc(it.obj || 'x') + '" aria-hidden="true">' + projIco(it) + '</span><span><b>' + esc(ucf(it.t.replace(/^Bug fix: /, ''))) + srcBtn('imp:' + i) + '</b><span class="lbd">' + it.imp + '</span></span></span>' +
    '<span class="itm rmpills">' + labelPills(Object.assign({}, it, { obj: null, ref: null })) + '</span>' +
    '<span><span class="ires ' + it.out + '">' + (it.out === 'win' && (it.bug || /^Bug fix/i.test(it.t)) ? '🔧 Fixed' : OUTN[it.out][0] + ' ' + OUTN[it.out][1]) + '</span></span>' +
    '' + hint('<b>' + esc(sh[0]) + '</b>' + (sh[1] ? '<span class="cap">' + esc(sh[1]) + '</span>' : ''), 'iimp ' + it.out, '<b>Where this number comes from</b><br>' + esc(it.src || 'Team readout') + '.<br><br>' + it.imp) + '' +
    '<span class="lbimp">' + (revEst(it) ? hint(revEst(it).short, 'ce', '<b>🤖 Claude\'s estimate, not the team\'s</b><br>' + esc(revEst(it).how)) + flagBtn(it) : '<span class="faint">–</span>') + '</span>' +
    '<span class="lbeta">' + esc(it.when) + (WU[it.t] ? ' <span class="goldb" title="Has a results write-up">🏅</span>' : '') + '</span><span class="chev" aria-hidden="true">›</span></div>'; }).join('');
  // A sentence instead of a title, with context tags above it, like every other page (Mike, Oct 27).
  const lw = lead ? esc(midCase(ucf(lead.t.replace(/^Bug fix: /, '')))) : '';
  const ihead = '<p class="verdict">' + (lead ? 'We shipped ' + win30.length + ' win' + (win30.length === 1 ? '' : 's') + ' in the last 30 days, led by ' + hint(lw, 'verd b', '<b>' + esc(lead.t) + '</b><br>' + esc(lead.imp ? String(lead.imp).replace(/<[^>]+>/g, '') : '')) + '.' : 'Nothing shipped in the last 30 days has a measured win yet.') + '</p>' +
    '<p class="sulead">' + [cnt('measuring') ? cnt('measuring') + ' more ' + (cnt('measuring') === 1 ? 'is' : 'are') + ' still being measured' : '', cnt('flat') + cnt('loss') ? (cnt('flat') + cnt('loss')) + ' showed no change or missed' : ''].filter(Boolean).join(', and ').replace(/^./, c => c.toUpperCase()) + (cnt('measuring') + cnt('flat') + cnt('loss') ? '.' : '') + '</p>';
  return '<section class="sview"><div class="vhead vhl">' + ihead + '</div>' +
    summary +
    panel('📦', 'Shipped and decided', 'Wins first, then still measuring, then no change or misses.', impFilters(L0) + '<div class="lbt"><div class="itbl">' + head + (rows || '<p class="cap" style="padding:16px">Nothing shipped matches these filters.</p>') + '</div></div>', 'p-imp') + '</section>';
}
function reorderBtn(L) {
  // Only people who can both edit this team's order and actually save to the shared database see the button.
  if (state.phase === 'post' || !RT.me || RT.canWrite === false || !L.some(it => canEdit(reorderScope(it)))) return '';
  const who = OR.owner ? 'You can reorder every team' + (state.fteam === 'all' && state.phase === 'pre' ? ', and the org-wide order' : '') : 'You can reorder your team\'s projects';
  return '<div class="sact"><button type="button" class="btn sm' + (state.reord ? ' pri' : '') + '" data-reord="1" title="' + who + '.">' + (state.reord ? '✓ Done' : '↕ Reorder') + '</button>' + (state.reord ? '<span class="cap">' + who + '. Use ▲ ▼ on a row.</span>' : '') + '</div>';
}
// What changed since the last exec review (execs only discuss changed rows), plus what is at risk for the code freeze.
const FREEZE = Date.UTC(2026, 10, 20);
function chgOf(it, prev) {
  prev = prev || (typeof COMING_PREV !== 'undefined' ? COMING_PREV : null);
  if (!prev) return [];
  const p = prev.items[it.t]; if (!p) return [{ k: 'new', txt: 'Newly added' }];
  const out = [];
  if (STC(it.s) === 'blocked' && STC(p.s) !== 'blocked') out.push({ k: 'blocked', txt: 'Now ' + String(it.s).toLowerCase() });
  if (PSTAGE(p.s) !== PSTAGE(it.s)) out.push({ k: 'phase', txt: PSTAGE(p.s).replace(/^\S+ /, '') + ' → ' + PSTAGE(it.s).replace(/^\S+ /, '') });
  if ((p.eta || '') !== (it.eta || '')) out.push({ k: 'date', txt: 'Launch ' + (p.eta || 'TBD') + ' → ' + (it.eta || 'TBD'), was: p.eta });
  return out;
}
const atRisk = it => STAGE(it) !== 'live' && (STC(it.s) === 'blocked' || /delay|paused/i.test(it.s || '') || burnRisk(it) || (etaDate(it.eta) && etaDate(it.eta) > FREEZE && !/post/i.test(it.eta || '')));
function chgBar() {
  if (state.phase !== 'pre' || typeof COMING_PREV === 'undefined') return '';
  const L = preList(), n = k => L.filter(it => chgOf(it).some(c => c.k === k)).length, cur = new Set([].concat(...COMING.teams.map(t => (t.items || []).map(i => i.t))));
  const gone = Object.keys(COMING_PREV.items).filter(t => !cur.has(t)), shipped = gone.filter(t => (COMING.wins || []).some(w => w.t === t));
  const chip = (k, lab, v, tip) => v ? '<button type="button" class="chgc' + (state.chg === k ? ' on' : '') + (k === 'risk' ? ' risk' : '') + '" data-chg="' + k + '" title="' + esc(tip) + '">' + lab + ' <b>' + v + '</b></button>' : '';
  const chips = chip('new', '🆕 New', n('new'), 'Added to the board since the last review') + chip('date', '📅 Date moved', n('date'), 'Launch date changed since the last review') + chip('phase', '🔁 Phase moved', n('phase'), 'Moved to a new phase since the last review') + chip('blocked', '⛔ Newly blocked or delayed', n('blocked'), 'Became blocked or delayed since the last review') +
    (gone.length ? hint('↪️ Off the board <b>' + gone.length + '</b>', 'chgc', '<b>Off the board since ' + esc(COMING_PREV.asOf) + '</b><br>' + gone.map(t => esc(t) + (shipped.indexOf(t) >= 0 ? ' (shipped)' : '')).join('<br>')) : '');
  return '<div class="chgbar"><span class="chgt">🟨 Since the last review, ' + esc(COMING_PREV.asOf) + '</span>' + (chips || '<span class="cap">Nothing changed.</span>') + '<span class="chgsep"></span>' + chip('risk', '⚠️ At risk for the Nov 20 freeze', L.filter(atRisk).length, 'Blocked, delayed, paused, needs over half its team\'s pace, or launches after the code freeze') + (state.chg ? '<button type="button" class="linkbtn" data-chg="">Show all</button>' : '') + '</div>';
}
// Team meetings: each product team's fortnightly 30-minute exec session, laid out in Jon's agenda order
// (sprint priorities, new asks, experiments, up next), grouped by objective inside each section.
const MEETS = [['customer', 'Customer'], ['plc', 'Purchase Lifecycle'], ['search', 'Search & Content'], ['artist', 'Artist and Apps'], ['core', 'Core'], ['de', 'Data Engineering'], ['martech', 'MarTech'], ['dashery', 'Dashery']];
// Impact: people's estimates show as written; Claude's own estimates carry the robot so nobody mistakes them for the team's.
const impCell = it => { const p = IMPS[it.t] || it.imp; return p ? hint(esc(p), 'rmimp', '<b>From ' + esc(it.impSrc ? (/^(roadmap sheet|the roadmap sheet)/i.test(it.impSrc) ? it.impSrc.replace(/^the /i, '') : it.impSrc) : 'Roadmap sheet estimate') + '</b>') : cest(it) ? hint(cest(it).short, 'rmimp ce', '<b>Claude\'s estimate, not the team\'s</b><br>Shown in purple so it is not mistaken for a team number.<br><br>' + esc(cest(it).how)) : ''; };
const impVal = it => { const c = cest(it), s = String(IMPS[it.t] || it.imp || (c ? c.short : '')), m = s.match(/([\d.]+)\s*([KkMm])/); if (!m) return -1; const v = parseFloat(m[1]) * (/m/i.test(m[2]) ? 1e6 : 1e3); return /month/i.test(s) ? v * 12 : v; };
// Seven steps from idea to live. The status cell shows where a project is now and what comes next.
const STEPS = ['Discovery', 'Sizing', 'Coding', 'Review', 'QA', 'Launch', 'Live'];
const stepIx = st => { const x = (st || '').toLowerCase(); return /discovery|research/.test(x) ? 0 : /scop|siz|plan|ready for dev|next sprint|tdd/.test(x) ? 1 : /review/.test(x) ? 3 : /qa|uat|test/.test(x) && !/^live/.test(x) ? 4 : /launching|ready to ship|launch/.test(x) && !/launched/.test(x) ? 5 : /^live|launched|done/.test(x) ? 6 : 2; };
const stuck = st => /block|delay|paus/i.test(st || '');
function stepCell(it) {
  const k = stepIx(it.s), bad = stuck(it.s), why = UPD[it.t] || it.why || '';
  const dots = '<span class="stp" aria-hidden="true">' + STEPS.map((p, i) => '<i class="' + (i < k ? 'd' : i === k ? 'c' + (bad ? ' bad' : '') : '') + '"></i>').join('') + '</span>';
  const now = bad ? esc(it.s) : STEPS[k], next = k < 6 && !bad ? STEPS[k + 1] : '';
  return hint(dots + '<span class="stt' + (bad ? ' bad' : k === 6 ? ' live' : '') + '"><b>' + now + '</b>' + (next ? '<small>Next: ' + next + '</small>' : bad ? '<small>was ' + STEPS[k] + '</small>' : '') + '</span>', 'stcell',
    '<b>' + esc(it.s || 'TBD') + '</b><br>' + STEPS.map((p, i) => i === k ? '<b>▸ ' + p + '</b>' : p).join(' → ') + (bad && why ? '<br><br><b>Why:</b> ' + esc(why) : ''));
}
// Launch confidence: the burn-down math plus what Jira comments, standups and Slack say. Red always says why.
const rng = d => String(d || 'TBD').replace(/(\w{3} \d{1,2}) to (\d{1,2})\b/, '$1–$2').replace(/ to /g, '–');
const launchedOn = it => { const dl = typeof DATES !== 'undefined' && DATES[it.t] && DATES[it.t].launched; if (dl) return short(dl); const m = ((it.d || '') + ' ' + (UPD[it.t] || '')).match(/\b(?:launched|went live|shipped|live since|released)\s+(?:on\s+)?(Sep|Oct|Nov|Dec) (\d{1,2})\b/i); if (m) return m[1] + ' ' + m[2]; const e = etaDate(it.eta); return e && e <= parse(D.asOf) + DAY && /^(Sep|Oct|Nov|Dec) \d{1,2}$/.test(it.eta || '') ? it.eta : ''; };
// Projected finish: points left at half the team's weekly output (the most one project usually gets), or a "likely" date someone wrote down.
// Not for work in QA or ready to ship: its points close at release, so the burn pace says nothing (Mike, Oct 28: "on track" next to a projected slip).
function projOf(it) {
  const dt = (typeof DATES !== 'undefined' && DATES[it.t]) || {}; if (dt.likely) return { t: parse(dt.likely), src: dt.likelySrc };
  if (stepIx(it.s) >= 4) return null;
  const v = teamVel(it.team); if (!it.pts || it.ptsUnit === 'issues' || !v) return null; const left = it.pts[1] - it.pts[0]; if (left <= 0) return null;
  const pc = v.wk * 0.5 * (v.planned || 1), wks = left / pc; return { t: parse(D.asOf) + DAY + Math.round(wks * 7) * DAY, left, pace: pc, wks, planned: v.planned };
}
const mdOf = t => MON[new Date(t).getUTCMonth()] + ' ' + new Date(t).getUTCDate();
const projWhy = pj => pj.src ? String(pj.src) : pj.left + ' point' + (pj.left === 1 ? '' : 's') + ' left in Jira at about ' + (Math.round(pj.pace * 10) / 10) + ' a week (half the team\'s pace' + (pj.planned && pj.planned < 1 ? ', after unplanned work' : '') + ')';
function confOf(it) {
  const k = stepIx(it.s), why = [], upd = UPD[it.t] || '', end = etaDate(it.eta);
  if (k === 6 && !stuck(it.s)) { const w = launchedOn(it); return { k: 'live', l: w ? 'Launched ' + w : 'Launched', why: [w ? 'Live since ' + w + '.' : 'Live.'] }; }
  if (stuck(it.s)) return { k: 'bad', l: /delay/i.test(it.s) ? 'Delayed' : /paus/i.test(it.s) ? 'Paused' : 'Blocked', why: [upd || it.why || it.d || 'Marked ' + it.s + ' in the roadmap sheet.'] };
  if (end && end > FREEZE && !/post|2027|Q1/i.test(it.eta || '')) why.push('Launch date (' + it.eta + ') is after the Nov 20 code freeze.');
  if (burnRisk(it)) { const [d, t] = it.pts, v = teamVel(it.team), days = Math.max(1, Math.round((end - parse(D.asOf) - DAY) / DAY)), pace = (t - d) / Math.max(days / 7, 1 / 7); why.push((t - d) + ' points left in ' + days + ' day' + (days === 1 ? '' : 's') + ' needs ' + Math.round(pace / v.wk * 100) + '% of the team\'s weekly pace.'); }
  if (why.length) return { k: 'bad', l: 'At risk', why: why.concat(upd ? [upd] : []) };
  // A projection past the launch date means it can't be "On track" (Mike, Oct 28).
  const pj0 = projOf(it); if (end && pj0 && pj0.t > end + DAY) return { k: 'warn', l: 'Watch', why: ['Projected to finish ' + mdOf(pj0.t) + ', after its ' + (it.eta || mdOf(end)) + ' launch date: ' + projWhy(pj0) + '.'].concat(upd ? [upd] : []) };
  // Watch only on clear slip or blocker language, never a single loose word like "still" (Mike, Oct 28).
  if (/slipp|slipped|\bslips?\b|delayed|\bdelay\b|behind schedule|pushed (back|out)|moved (out|back)|at risk|\bblocked\b|waiting on|carried over|won't make|will miss|missed (the |its )?(date|deadline)/i.test(upd)) return { k: 'warn', l: 'Watch', why: [upd].concat((teamVel(it.team) || {}).ctx ? [teamVel(it.team).ctx] : []) };
  if (!end && !/before|pre-peak|this week|peak|rolling/i.test(it.eta || '')) return { k: 'none', l: 'No date yet', why: ['No launch date in Jira or the roadmap sheet.'].concat(upd ? [upd] : []) };
  const vc = (teamVel(it.team) || {}).ctx;
  return { k: 'ok', l: 'On track', why: (upd ? [upd] : []).concat(it.pts ? ['Burn-down pace is within the team\'s normal output.'] : ['Nothing in Jira, standups or Slack says otherwise.']).concat(vc ? [vc] : []) };
}
const CONFR = { bad: 0, warn: 1, none: 2, ok: 3, live: 4 };
function confCell(it) {
  const c = confOf(it), p = it.pts && it.pts[1] - it.pts[0] > 0 ? (it.pts[1] - it.pts[0]) + ' of ' + it.pts[1] + ' ' + (it.ptsUnit === 'issues' ? 'tickets' : 'pts') + ' left' : it.pts ? 'Done in Jira' : '';
  return hint('<span class="cf ' + c.k + '">' + c.l + '</span>' + (p ? '<small>' + p + '</small>' : ''), 'cfcell', '<b>' + c.l + '</b><br>' + c.why.map(esc).join('<br>') + (it.pts ? '<br><br><span class="cap">Burn-down: ' + esc(p) + (teamVel(it.team) ? '; the team delivers about ' + teamVel(it.team).wk + ' points a week.' : '.') + '</span>' : ''));
}
// What changed since the last exec roadmap review, leading with where it is now.
function chgTag(it, c, prev, box) {
  // Short on the row (current state only); the hover says what it was and why.
  const now = STEPS[stepIx(it.s)], was = c.k === 'phase' ? c.txt.split(' → ')[0] : c.was || 'TBD';
  const txt = c.k === 'new' ? 'Changed since ' + prev.asOf.replace(/^the /, '').replace(/ roadmap review$/, '') : c.k === 'date' ? 'Launch moved: ' + rng(was) + ' → ' + rng(it.eta) : c.k === 'phase' ? was.replace(/^\S+ /, '') + ' → ' + now : c.k === 'blocked' ? 'Newly ' + String(it.s || 'blocked').toLowerCase() : c.txt;
  return hint((box || '') + esc(txt), 'chgp ' + c.k, (box ? '<i>Click to mark reviewed (greys it for everyone; click again to undo).</i><br><br>' : '') + '<b>Changed since ' + esc(prev.asOf) + '</b><br>' + (c.k === 'new' ? 'Added to the roadmap.' : c.k === 'date' ? 'Launch ' + esc(it.eta || 'TBD') + ', was ' + esc(was) + '.' : c.k === 'phase' ? 'Now ' + esc(lcx(now)) + ', was ' + esc(was.toLowerCase()) + '.' : esc(c.txt)) + (c.k === 'date' && it.why ? '<br>Why: ' + esc(it.why) : '') + (UPD[it.t] ? '<br><br>' + esc(UPD[it.t]) : ''));
}
// Timeline view. Bars run from the Jira start date (or today when there is none) to the committed launch date, colored by launch confidence.
// Launched work is a green diamond on its launch day. Markers: today, the next executive roadmap review, the Nov 20 code freeze, Black Friday.
// Timeline hover (design agency, Oct 27): where it stands at a glance (stage bar, dates, confidence), then impact, owner and a mini burn-down.
// The first sentence of the confidence reason, without repeating the label ("Blocked, blocked: …"), capped so the hover stays short.
const confWhy = c => { let w = String(c.why[0] || '').replace(new RegExp('^' + c.l.replace(/[.*+?^${}()|[\]\\]/g, '') + '\\W*', 'i'), '').split(/;|\.\s/)[0].replace(/\.$/, '').trim(); if (w.length > 110) w = w.slice(0, 107).replace(/\s\S*$/, '') + '…'; return w ? ': ' + esc(w.charAt(0).toLowerCase() + w.slice(1)) : ''; };
// Line icons by goal for project rows (Mike, Oct 27: fewer emojis, the pills already carry some).
const GICO = { CVR: '<circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="2.5"/>', AOV: '<path d="M2 3h2l1.6 7h7l1.4-5H5"/><circle cx="6.5" cy="13" r="1"/><circle cx="12" cy="13" r="1"/>', Revenue: '<circle cx="8" cy="8" r="6"/><path d="M10 5.8C9.5 5.2 8.8 5 8 5c-1.2 0-2 .6-2 1.5S6.8 8 8 8s2 .6 2 1.5S9.2 11 8 11c-.8 0-1.6-.3-2-.9M8 4v8"/>', Retention: '<path d="M13 8a5 5 0 1 1-1.6-3.7"/><path d="M13 2.5v3h-3"/>', Traffic: '<path d="M2.5 12.5 6.5 8l3 2.5 4-6"/><path d="M10.5 4.5h3v3"/>', Ops: '<circle cx="8" cy="8" r="2"/><path d="M8 1.8v2M8 12.2v2M1.8 8h2M12.2 8h2M3.6 3.6l1.4 1.4M11 11l1.4 1.4M3.6 12.4 5 11M11 5l1.4-1.4"/>', Compliance: '<path d="M8 2.5v11M4 13.5h8M3 5h10M3 5l-1.5 4h3zM13 5l-1.5 4h3z"/>', Data: '<ellipse cx="8" cy="4" rx="5" ry="2"/><path d="M3 4v8c0 1.1 2.2 2 5 2s5-.9 5-2V4M3 8c0 1.1 2.2 2 5 2s5-.9 5-2"/>' };
// A specific icon for what each project is about (Mike, Oct 27: a trucker hat should be a hat, wall art a framed picture,
// retiring products a sunset). First keyword match on the title wins; the goal icon is only the fallback.
const PICO = [
  // Cart icon for the cart sticker cross-sell test, ahead of the generic sticker icon (Oct 30).
  [/sticker cross-sell/i, '<path d="M1.5 2.5h2l1.6 7.5h7l1.4-5.5H4.3"/><circle cx="6" cy="13" r="1"/><circle cx="11.5" cy="13" r="1"/>'],
  // Clock with a back arrow for "Recently viewed" (Oct 29).
  [/recently viewed/i, '<path d="M3 8a5 5 0 1 0 1.5-3.6"/><path d="M3 3v2.5h2.5"/><path d="M8 5.5V8l1.8 1.2"/>'],
  // Star for reviews (Oct 29, Trustpilot product reviews win).
  [/trustpilot|reviews?\b/i, '<path d="M8 2.2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.4l-3.6 1.9.7-4L2.2 6.5l4-.6z"/>'],
  // Tote bag: body plus two handles (Oct 28, canvas totes and the cards/bags/mugs row).
  [/tote|bags\b|bags,|mugs\b/i, '<path d="M3 5.5h10l-1 8H4z"/><path d="M5.8 5.5V4a2.2 2.2 0 0 1 4.4 0v1.5"/>'],
  [/hosting|\becs\b|\beks\b/i, '<rect x="2" y="2.5" width="12" height="4.5" rx="1"/><rect x="2" y="9" width="12" height="4.5" rx="1"/><path d="M4.5 4.8h.01M4.5 11.3h.01"/>'],
  // Globe for routing orders to local printers (Product localization 2.0).
  [/locali[sz]ation/i, '<circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c1.8 1.8 2.6 3.8 2.6 6s-.8 4.2-2.6 6c-1.8-1.8-2.6-3.8-2.6-6S6.2 3.8 8 2z"/>'],
  // A cap seen from the side: crown, panel seam, button, and a brim sticking out front (Mike, Oct 27: the old one read as a bell).
  [/trucker|hat\b|hats\b/i, '<path d="M1.8 10.8C1.8 7 4.2 4.6 7.4 4.6s5.6 2.4 5.6 5.6"/><path d="M1.8 10.8h9.4c1.7 0 3.1-.4 3.9-1.1-.6-.5-1.3-.7-2.1-.7"/><path d="M7.4 4.6V3.5"/><path d="M7.4 4.6c-1.4 1.6-2 3.7-2 6.2"/>'],
  [/wall art|poster|canvas|print size|framed/i, '<rect x="3" y="3.5" width="10" height="9" rx="1"/><path d="M3 10.5 6.3 7.5 9 10l1.8-1.6L13 10.5"/><circle cx="10.3" cy="6.3" r=".9"/><path d="M8 3.5 8 1.8"/>'],
  [/retire|sunset|deprecat|remove|stop mailing/i, '<path d="M1.5 11.5h13"/><path d="M4 11.5a4 4 0 0 1 8 0"/><path d="M8 4.5V3M3.2 6.7l-1-1M12.8 6.7l1-1M3.5 14h9"/>'],
  [/iphone|phone case|case\b/i, '<rect x="4.5" y="1.5" width="7" height="13" rx="1.8"/><path d="M7 12.5h2"/>'],
  [/android|ios|app\b|apps|native/i, '<rect x="4.5" y="1.5" width="7" height="13" rx="1.8"/><path d="M6.5 4h3"/><circle cx="8" cy="12" r=".6"/>'],
  [/apple pay|payplus|pay\b|express pay/i, '<rect x="1.5" y="4" width="13" height="8.5" rx="1.5"/><path d="M1.5 7h13M4 10h3"/>'],
  [/sticker/i, '<path d="M3 3h7l3 3v7H3z"/><path d="M10 3v3h3"/>'],
  [/t-shirt|tee\b|tees\b|apparel|shirt/i, '<path d="M5.5 2.5 2 4.5l1.3 2.6L5 6.4V13.5h6V6.4l1.7.7L14 4.5l-3.5-2c-.4 1-1.4 1.6-2.5 1.6S5.9 3.5 5.5 2.5z"/>'],
  [/greeting card|postcard/i, '<rect x="2" y="3.5" width="12" height="9" rx="1"/><path d="m2.5 4.5 5.5 4 5.5-4"/>'],
  [/email|opt-in|mailing|newsletter/i, '<rect x="2" y="3.5" width="12" height="9" rx="1"/><path d="m2.5 4.5 5.5 4 5.5-4"/>'],
  [/thank-you|thank you|gift/i, '<rect x="2.5" y="6.5" width="11" height="7" rx="1"/><path d="M1.8 4.5h12.4v2H1.8zM8 4.5v9M8 4.5C6.5 2 4.5 2.6 5 4.5M8 4.5c1.5-2.5 3.5-1.9 3-0"/>'],
  [/cross-sell|upsell|cart|basket|quick shop|quick-add|add to cart/i, '<path d="M1.5 2.5h2l1.6 7.5h7l1.4-5.5H4.3"/><circle cx="6" cy="13" r="1"/><circle cx="11.5" cy="13" r="1"/>'],
  [/search|query|rank|autocomplete/i, '<circle cx="7" cy="7" r="4.5"/><path d="m10.4 10.4 3.6 3.6"/>'],
  [/tax|finance|month-end|invoice|royalt/i, '<path d="M4 1.5h8v13l-2-1.2-2 1.2-2-1.2-2 1.2z"/><path d="M6 5h4M6 7.5h4M6 10h2"/>'],
  [/price|pricing|discount|sale/i, '<path d="M2.5 2.5h5l6 6-5 5-6-6z"/><circle cx="5.5" cy="5.5" r="1"/>'],
  [/feed|shopping feed|google shopping|merchant/i, '<path d="M3 13a0 0 0 0 1 0 0"/><circle cx="3.5" cy="12.5" r="1"/><path d="M2.5 7.5a6 6 0 0 1 6 6M2.5 3a10.5 10.5 0 0 1 10.5 10.5"/>'],
  [/image|thumbnail|photo|gallery|crop/i, '<rect x="2" y="3" width="12" height="10" rx="1.5"/><circle cx="6" cy="6.5" r="1.2"/><path d="m2.5 12 3.5-3.5 2.5 2.5 2-2 3 3"/>'],
  [/blanks/i, '<path d="M5.5 2.5 2 4.5l1.3 2.6L5 6.4V13.5h6V6.4l1.7.7L14 4.5l-3.5-2c-.4 1-1.4 1.6-2.5 1.6S5.9 3.5 5.5 2.5z"/>'],
  [/quick wins/i, '<path d="M9 1.5 3.5 9H8l-1 5.5L12.5 7H8z"/>'],
  [/fulfil|delivery|shipping|ship\b|logistics|monkey|horsham|dimension|omafs|integration/i, '<path d="M1.5 4h8v7h-8zM9.5 6.5h3l2 2.5v2h-5"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="11.5" cy="12" r="1.2"/>'],
  [/takedown|dmca|verification|compliance|consent|security|bot/i, '<path d="M8 1.6 3 3.6v4c0 3 2.1 5.3 5 6.4 2.9-1.1 5-3.4 5-6.4v-4z"/><path d="m5.8 8 1.5 1.5 3-3"/>'],
  [/sign in|login|identity|shopper id/i, '<circle cx="8" cy="5.5" r="2.8"/><path d="M2.8 14c.6-2.8 2.7-4.3 5.2-4.3s4.6 1.5 5.2 4.3"/>'],
  [/simon|\bai\b|profile attribute/i, '<path d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3M3.4 3.4l2.1 2.1M10.5 10.5l2.1 2.1M3.4 12.6l2.1-2.1M10.5 5.5l2.1-2.1"/>'],
  [/amplitude|analytics|tracking|event|reporting|dashboard|data\b|sigma/i, '<path d="M2.5 13.5h11"/><path d="M4 11V8M7 11V5M10 11V7M13 11V3.5"/>'],
  [/postgres|cluster|server|migration|infrastructure|warehouse/i, '<rect x="2" y="2.5" width="12" height="4.5" rx="1"/><rect x="2" y="9" width="12" height="4.5" rx="1"/><path d="M4.5 4.8h.01M4.5 11.3h.01"/>'],
  [/test|experiment|a\/b/i, '<path d="M6.5 1.5h3M7 1.5v4.5L3.4 12.5a1 1 0 0 0 .9 1.5h7.4a1 1 0 0 0 .9-1.5L9 6V1.5"/><path d="M4.8 10h6.4"/>'],
  [/badge|trending tag|label/i, '<circle cx="8" cy="6" r="4"/><path d="m5.5 9.3-1 5 3.5-2 3.5 2-1-5"/>'],
  [/ads\b|meta|tiktok|social|affiliate|marketing/i, '<path d="M2 6.5v3h2.5l5 3v-9l-5 3z"/><path d="M12 5.5a3.5 3.5 0 0 1 0 5"/>'],
  [/creator|artist|seller/i, '<path d="M11 2.5 13.5 5 6 12.5 3 13l.5-3z"/><path d="M9.5 4l2.5 2.5"/>'],
  [/notification/i, '<path d="M4 11V7a4 4 0 0 1 8 0v4l1.5 1.5h-11z"/><path d="M6.5 13.5a1.5 1.5 0 0 0 3 0"/>'],
  [/nav|navigation|menu|topics/i, '<path d="M2.5 4h11M2.5 8h11M2.5 12h7"/>'],
  [/address|checkout/i, '<path d="M8 14.5s5-4.6 5-8.5a5 5 0 0 0-10 0c0 3.9 5 8.5 5 8.5z"/><circle cx="8" cy="6" r="1.8"/>'],
];
// Specific icons first, so a title gets the icon for what it is, not the first loose keyword it contains (Mike, Oct 27: "make sure you're making the right kind of icons").
(() => { const ico = re => (PICO.find(p => p[0].test(re)) || [0, ''])[1];
  PICO.unshift(
    [/faster|speed|load time|performance|latency/i, '<path d="M9.2 1.5 3.5 9h4l-1 5.5L12.5 7h-4z"/>'],
    [/shipping (up|cost|price|fee)|heavier carts/i, ico('shipping')],
    [/^remove\b/i, '<circle cx="8" cy="8" r="5.5"/><path d="M5.5 8h5"/>'],
    [/countdown|timer/i, '<circle cx="8" cy="9" r="5"/><path d="M8 9V6.5M6.5 1.8h3M12.2 4.8l1-1"/>'],
    [/cluster|keep sigma|uptime|postgres|server(?!-side)/i, '<rect x="2" y="2.5" width="12" height="4.5" rx="1"/><rect x="2" y="9" width="12" height="4.5" rx="1"/><path d="M4.6 4.75h.01M4.6 11.25h.01"/>'],
    [/shared product data|data model|warehouse/i, '<ellipse cx="8" cy="3.8" rx="5" ry="1.8"/><path d="M3 3.8v8.4c0 1 2.2 1.8 5 1.8s5-.8 5-1.8V3.8M3 8c0 1 2.2 1.8 5 1.8s5-.8 5-1.8"/>'],
    [/dashboard/i, '<rect x="2" y="2" width="5" height="6" rx="1"/><rect x="9" y="2" width="5" height="3.5" rx="1"/><rect x="9" y="7.5" width="5" height="6.5" rx="1"/><rect x="2" y="10" width="5" height="4" rx="1"/>'],
    [/shopper id|identity/i, '<rect x="1.5" y="3.5" width="13" height="9" rx="1.5"/><circle cx="5.5" cy="8" r="1.6"/><path d="M9 7h3.5M9 9.5h2.5"/>'],
    [/consent|preference/i, '<path d="M2 4.5h12M2 11.5h12"/><circle cx="5.5" cy="4.5" r="1.5"/><circle cx="10.5" cy="11.5" r="1.5"/>'],
    [/ai shopping|ready for ai/i, '<path d="M8 2l1.4 3.6L13 7l-3.6 1.4L8 12l-1.4-3.6L3 7l3.6-1.4z"/><path d="M12.5 11.2l.45 1.2 1.2.45-1.2.45-.45 1.2-.45-1.2-1.2-.45 1.2-.45z"/>'],
    [/from \$x|standard price/i, ico('pricing')]); })();
const projIco = it => { const h = PICO.find(p => p[0].test(it.t)); return '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + (h ? h[1] : GICO[it.obj] || '<circle cx="8" cy="8" r="2.5"/>') + '</svg>'; };
const goalIco = o => '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + (GICO[o] || '<circle cx="8" cy="8" r="2.5"/>') + '</svg>';
function gTip(it, e, live, pj, sd) {
  // Laid out as a small key/value card (Mike, Oct 27: easier to scan than sentences): stage on top, then rows with a muted label column.
  const c = confOf(it), md = t => MON[new Date(t).getUTCMonth()] + ' ' + new Date(t).getUTCDate(), B = typeof BURN !== 'undefined' && BURN[it.t], today = parse(D.asOf) + DAY;
  const late = !live && e && e < today, row = (k, v, cls) => '<span class="gk">' + k + '</span><span class="gv' + (cls ? ' ' + cls : '') + '">' + v + '</span>';
  let mini = '';
  if (B && B.series && B.series.length > 1) { const S2 = B.series, top = Math.max(...S2.map(p => p[1]), B.total || 0) || 1, t0 = parse(S2[0][0]), t1 = Math.max(parse(S2[S2.length - 1][0]), t0 + DAY), X = t => 4 + 232 * (parse(t) - t0) / (t1 - t0), Y = v => 6 + 30 * (1 - v / top);
    mini = '<svg viewBox="0 0 240 40" width="100%" height="40" aria-hidden="true"><polyline points="' + S2.map(p => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ') + '" style="fill:none;stroke:var(--accent);stroke-width:2;stroke-linejoin:round"/><line x1="4" x2="236" y1="36" y2="36" style="stroke:var(--line-2)"/></svg><span class="cap">' + (B.total - B.done) + ' of ' + B.total + ' ' + (B.unit === 'pts' ? 'points' : 'tickets') + ' left in Jira</span>'; }
  else if (it.pts) mini = '<span class="cap">' + (it.pts[1] - it.pts[0]) + ' of ' + it.pts[1] + ' ' + (it.ptsUnit === 'issues' ? 'tickets' : 'points') + ' left in Jira</span>';
  const who = pmOf(it.t, it.team), conf = late ? ['🔴', 'Past its launch date', 'bad'] : [c.k === 'bad' ? '🔴' : c.k === 'warn' ? '🟡' : c.k === 'ok' ? '🟢' : '⚪', esc(c.l) + confWhy(c), c.k === 'bad' ? 'bad' : ''];
  return '<div class="gtipc"><b class="gtt">' + esc(it.t) + '</b><span class="gts">' + phaseBar(it.s) + '</span><div class="gkv">' +
    row('Launch', live ? '✅ ' + esc(launchedOn(it) || it.eta || '') : late ? '<b class="bad">was ' + md(e) + '</b>' : esc(rng(it.eta || 'TBD')) + (pj && pj.t > (e || 0) + DAY ? '<br><span class="bad">likely ' + md(pj.t) + '</span><br><span class="cap">' + esc(projWhy(pj)) + '</span>' : '')) +
    (sd ? row('Started', md(sd)) : '') + row('Confidence', conf[0] + ' ' + conf[1], conf[2]) +
    (impVal(it) > 0 ? row('Impact', esc(IMPS[it.t] || it.imp || (cest(it) ? cest(it).short + ' (Claude\'s estimate)' : ''))) : '') +
    row('Team', esc(TEAMS(it.team))) + (who ? row('Product Manager', esc(who)) : '') + (mini ? row('Burn-down', '<span class="gburn">' + mini + '</span>') : '') + '</div><span class="segmore">Click for the full project →</span>' + (it.ref ? '<div class="tipsrcw"><button type="button" class="srcbtn tipsrc" data-srcbox="rm:' + esc(it.ref) + '">ⓘ Sources: where every fact on this project comes from →</button></div>' : '') /* same sources as the full box (Mike, Oct 28) */ + '</div>';
}
function ganttHtml(list, all, keep) {
  const today = parse(D.asOf) + DAY, w0 = today - 7 * DAY, start = w0 - ((new Date(w0).getUTCDay() + 6) % 7) * DAY, end = Date.UTC(2026, 11, 1), span = end - start, /* through Black Friday week, so the next six weeks fill the width (Mike, Oct 27) */ x = t => Math.max(0, Math.min(100, (t - start) / span * 100));
  const rv = typeof ROADMAP_REVIEW !== 'undefined' ? ROADMAP_REVIEW.last : null; let nx = rv; while (nx && parse(nx) < today) nx = addDays(nx, 14);
  const marks = [[today, 'Today', 'now'], nx ? [parse(nx), 'Exec Roadmap Review', 'rev'] : null, [FREEZE, 'Code freeze', 'frz'], [Date.UTC(2026, 10, 27), 'Black Friday', 'bf']].filter(Boolean);
  const weeks = []; for (let t = start; t <= end; t += 7 * DAY) weeks.push(t);
  const md = t => MON[new Date(t).getUTCMonth()] + ' ' + new Date(t).getUTCDate();
  const dated = [], undated = [];
  const DT = it => (typeof DATES !== 'undefined' && DATES[it.t]) || {};
  const notStarted = it => DT(it).notStarted || STAGE(it) === 'next';
  list.forEach(it => { const live = stepIx(it.s) === 6 && !stuck(it.s), lo = live ? launchedOn(it) : '', e = live ? (lo ? etaDate(lo) : null) : softDate(it) ? null : (etaDate(it.eta) || (DT(it).due ? parse(DT(it).due) : null)); (e ? dated : undated).push([it, e, live]); });
  // Projected finish: points left at half the team's weekly output (the most one project usually gets). Only for work with its own epic and a team pace.
  const proj = projOf; // shared with confidence so the two never disagree (Mike, Oct 28)
  // Sort by when it will likely land: the projected date when it runs past the committed one (Mike, Oct 27).
  dated.forEach(d => { const p = d[2] ? null : proj(d[0]); d[3] = p && p.t > d[1] ? p.t : d[1]; });
  const bar = ([it, e, live]) => { const c = confOf(it), pj = live ? null : proj(it), sd = DT(it).start ? parse(DT(it).start) : null, st = sd && sd < e ? Math.max(sd, start) : today, tip = '<b>' + esc(it.t) + '</b><br>' + esc(it.s || '') + ' · launch ' + esc(it.eta || 'TBD') + '<br>' + c.l + (c.why[0] ? ': ' + esc(c.why[0]) : '') + (sd ? '<br>Started ' + esc(md(sd)) + (DT(it).startSrc ? ' (' + esc(DT(it).startSrc) + ')' : '') : '<br>No start date in Jira yet, so the bar starts today.') + (pj ? '<br><br><b>Projected finish ' + esc(md(pj.t)) + '</b><br>' + (pj.src ? esc(pj.src) : pj.left + ' points left at about ' + (Math.round(pj.pace * 10) / 10) + ' a week (half the team\'s pace' + (pj.planned ? ', less the share of each sprint that goes to work added mid-sprint' : '') + ') is about ' + (Math.round(pj.wks * 10) / 10) + ' weeks.') + (pj.t > e + DAY ? ' The light blue extension shows how far past the committed date that is.' : ' That is on or before the committed date.') : '');
    const track = live ? '<span class="gdia" style="left:' + x(e) + '%"></span>' : e < today ? '<span class="gbar late" style="left:' + x(e) + '%;width:6px"></span><span class="glbl" style="left:calc(' + x(e) + '% + 10px)">Past due · was ' + esc(md(e)) + '</span>' : '<span class="gbar ' + c.k + (pj && pj.t > e + DAY ? ' stk' : '') + (sd && sd < start ? ' cut' : '') + '" style="left:' + x(st) + '%;width:' + Math.max(0.8, x(e) - x(st)) + '%">' + (e > today ? '<i class="gfut" style="left:' + (today > st ? Math.round((today - st) / (e - st) * 1000) / 10 : 0) + '%"></i>' : '') + '</span>' + (pj && pj.t > e + DAY ? '<span class="gproj" style="left:' + x(e) + '%;width:' + Math.max(0.6, x(pj.t) - x(e)) + '%"></span>' : '') + '<span class="glbl" style="left:calc(' + x(Math.max(e, pj ? pj.t : 0)) + '% + 8px)">' + esc(md(e)) + (pj && pj.t > e + 2 * DAY ? ' · projected ' + esc(md(pj.t)) : '') + '</span>';
    // Two-line names (project, then team and goal in full) and a richer hover (design agency, Oct 27).
    // Team and goal as small pills; click one to filter the page by it (Mike, Oct 27).
    const tk = COMING.teams.find(t => t.key === it.team) || {}, meta = '<span class="gmeta">' + (it.flagged ? '<span class="gpill gflag" title="Highlighted yellow by the team in the roadmap sheet for the next exec roadmap review">🟨 Flagged by the team</span>' : '') /* the team's own change signal (Exec Roadmap Review, Oct 27) */ + (it.site ? '<button type="button" class="gpill gsite" data-ssel="' + esc(it.site) + '" title="Show only ' + esc(SITEN(it.site)) + '">' + siteDot(it.site) + '</button>' : '') /* site first, so TeePublic / Redbubble / both reads at a glance (Allison, Oct 28) */ + '</span>' +
      // Filtered to "Changed", each row says what changed (Mike, Oct 27); unfiltered rows stay quiet.
      ((state.views || []).indexOf('chg') >= 0 && typeof COMING_PREV !== 'undefined' && COMING_PREV ? (ch => { const t = ch.map(x => x.k === 'new' ? 'New since the ' + COMING_PREV.asOf.replace(/^the /, '').replace(/ roadmap review$/, ' review') : x.txt).join(' · '); return ch.length ? '<span class="gchg" title="' + esc(t) + '">' + esc(t) + '</span>' : ''; })(liveChg(it, COMING_PREV)) : '');
    return '<div class="grow' + (meta.indexOf('gchg') >= 0 ? ' hasch' : '') + '" role="button" tabindex="0" data-lbm2="' + it.ref + '"><span class="gname"><span class="ge gico g-' + esc(it.obj || 'x') + '" aria-hidden="true">' + projIco(it) + '</span><span class="gnt"><b class="gtl"><span class="gtx">' + esc(it.t) + '</span></b>' + meta + '</span></span><span class="gtrack">' + hint(track, 'gtip', gTip(it, e, live, pj, sd)) + '</span></div>'; };
  const S = state.tsort, SK = { t: d => d[0].t.toLowerCase(), eta: d => d[3], imp: d => -impVal(d[0]), c: d => CONFR[confOf(d[0]).k], s: d => stepIx(d[0].s) };
  // Sections (Mike, Oct 27): by stage by default, or by team or goal. Rows inside keep the chosen sort.
  const srt = rows => rows.slice().sort((a, b) => { if (rows.every(d => !d[2] && d[1] < today)) return a[1] - b[1]; if (!(S && SK[S.k])) return a[3] - b[3]; const p = SK[S.k](a), q = SK[S.k](b); return (p < q ? -1 : p > q ? 1 : 0) * S.dir || a[3] - b[3]; });
  const G = state.gGroup || 'stage', soon = today + 14 * DAY;
  const STG = [['soon', 'Launching in the next 2 weeks', 'Due on or before ' + md(soon) + '.', d => !d[2] && d[1] >= today && d[1] <= soon && !notStarted(d[0])],
    ['late', 'Past their launch date', 'Launch date has passed and it isn\'t marked launched yet.', d => !d[2] && d[1] < today],
    ['prog', 'In progress, launching later', 'Being built; launching after ' + md(soon) + ', or no date yet.', d => !d[2] && d[1] > soon && !notStarted(d[0])],
    ['start', 'Just getting started', 'Planned, in discovery or not started yet.', d => !d[2] && notStarted(d[0]) && d[1] >= today],
    ['live', 'Launched', 'Shipped in this window.', d => d[2]]];
  const U = undatedPool(keep), inObj = (it, o) => (it.obj || '') === o || (!o && OBJS.indexOf(it.obj) < 0);
  const UND = G === 'team' ? k => U.pool.filter(it => teamKey(it.team) === k) : G === 'goal' ? k => U.pool.filter(it => inObj(it, k === 'other' ? '' : k)) : k => k === 'prog' ? U.pool.filter(it => !U.notStarted(it)) : k === 'start' ? U.pool.filter(U.notStarted) : [];
  const groups = (G === 'team' ? MEETS.map(m => [[m[0], m[1], ''], srt(dated.filter(d => teamKey(d[0].team) === m[0]))])
    : G === 'goal' ? OBJS.concat(['']).map(o => [[o || 'other', o ? OBJN(o) : 'Other', ''], srt(dated.filter(d => inObj(d[0], o)))])
    : STG.map(g => [[g[0], g[1], g[2]], srt(dated.filter(g[3]))])).filter(g => g[1].length || UND(g[0][0]).length);
  // The undated block: last in its section, hatched so it reads as "not on the timeline", with the reason in words.
  const nod = k => { const a = UND(k); return a.length ? '<div class="gnod"><div class="gnodh"><b>🗓️ No launch date yet</b><span class="ggn">' + a.length + '</span><span class="cap">Not enough in Jira or the roadmap sheet to put on the timeline.</span></div>' + U.byTeam(a) + '</div>' : ''; };
  const MTIP = { now: 'Today. Everything left of this line is the past.', rev: 'The next Executive Roadmap Review. Changes since the last one show as yellow tags.', frz: 'Code freeze: nothing new ships after this until after peak.', bf: 'Black Friday, the biggest sales day of the year.' };
  // Flags close together (Today and the review are a day apart) sit side by side instead of on top of each other.
  const near = (i, j) => marks[j] && Math.abs(x(marks[i][0]) - x(marks[j][0])) < 7;
  const flags = marks.map((m, i) => hint(m[1], 'gflag ' + m[2] + (near(i, i + 1) ? ' gfl' : near(i, i - 1) ? ' gfr' : '') + '" style="left:' + x(m[0]) + '%', '<b>' + m[1] + ' · ' + md(m[0]) + '</b><br>' + (MTIP[m[2]] || ''))).join('');
  const axis = '<div class="gaxis"><span></span><span class="gtrack"><span class="gwks">' + weeks.map(t => '<span class="gwk" style="left:' + x(t) + '%">' + md(t) + '</span>').join('') + '</span><span class="gflags">' + flags + '</span></span></div>';
  const lines = '<div class="glines" aria-hidden="true"><span></span><span class="gtrack">' + weeks.map(t => '<i class="gwl" style="left:' + x(t) + '%"></i>').join('') + marks.map(m => '<i class="gm ' + m[2] + '" style="left:' + x(m[0]) + '%"></i>').join('') + '</span></div>';
  // Labels start at their line; one that would collide with the label before it drops to a second row.
  // One line of milestone labels; a label that would run into the next one is cut short with "…" (full name on hover).
  const ml = marks.map((m, i) => { const px = x(m[0]), nxt = marks[i + 1] ? x(marks[i + 1][0]) : 100; return '<span class="gml ' + m[2] + '" style="left:' + px + '%;max-width:calc(' + (nxt - px) + '% - 6px)" title="' + m[1] + ' · ' + md(m[0]) + '">' + m[1] + '</span>'; }).join('');
  const mrow = '<div class="gmrow"><span></span><span class="gtrack">' + ml + '</span></div>';
  return '<section class="sec2 tmsec"><div class="shead"><div><p class="cap gkeys"><span class="gkey ok"></span>On track <span class="gkey warn"></span>Watch <span class="gkey bad"></span>At risk <span class="gkey proj"></span>Likely to run late <span class="gkeysep"></span><span class="gkey ok"></span>Before today <span class="gkey ok fut"></span>Still to go</p></div><div class="ggsel" role="group" aria-label="Group the timeline by"><span class="flbl">Group by</span>' + [['stage', '🚦', 'Stage'], ['team', '👥', 'Team'], ['goal', '🎯', 'Goal']].map(o => '<button type="button" data-ggroup="' + o[0] + '" aria-pressed="' + ((state.gGroup || 'stage') === o[0]) + '"><span aria-hidden="true">' + o[1] + '</span> ' + o[2] + '</button>').join('') + '</div></div><div class="pbody gantt">' + axis + '<div class="gbody">' + lines +
    // Stage sections fold: past due and the next 2 weeks open, the rest closed until you open them (Mike, Oct 27: work through it in order).
    groups.map(([m, rows]) => { const key = G + ':' + m[0], open = state.gOpen && key in state.gOpen ? state.gOpen[key] : G !== 'stage' || m[0] === 'soon';
      return '<div class="ggrp gg-' + esc(m[0]) + (open ? '' : ' shut') + '"><button type="button" class="ggh2" data-gfold="' + esc(key) + '" aria-expanded="' + open + '"><span class="ggcar" aria-hidden="true">▸</span><b>' + m[1] + '</b><span class="ggn">' + (rows.length + UND(m[0]).length) + '</span>' + (m[2] ? '<span class="cap">' + m[2] + '</span>' : '') + '</button>' + (open ? rows.map(bar).join('') + nod(m[0]) : '') + '</div>'; }).join('') + '</div>' +
    '</div></section>';
}
// Roadmap takeaway: the three biggest things happening now, as one sentence. "Biggest" = dollar estimate (or a modest default),
// boosted when it launches this week or is at risk. Project names open their pop-up.
function rmLeadHtml(list) {
  const today = parse(D.asOf) + DAY, soon = it => { const e = etaDate(it.eta); return e && e <= today + 7 * DAY; };
  const score = it => Math.max(impVal(it), 150e3) * (soon(it) ? 2.2 : 1) * (confOf(it).k === 'bad' ? 1.8 : 1) * (/nov 7|deadline|end of life/i.test((it.eta || '') + ' ' + (it.d || '')) ? 1.6 : 1);
  const top = list.filter(it => stepIx(it.s) < 6).sort((a, b) => score(b) - score(a)).slice(0, 3);
  if (!top.length) return '';
  const nm = it => '<button type="button" class="inl" data-lbm2="' + it.ref + '">' + esc(it.t) + '</button>';
  const money = it => impVal(it) > 0 ? ' <span class="soft">(' + esc(IMPS[it.t] || it.imp || (cest(it) ? cest(it).short : '')) + ')</span>' : '';
  const lc = t => t ? t.charAt(0).toLowerCase() + t.slice(1) : t;
  const why = it => { const c = confOf(it), w0 = c.why[0] || '', m = w0.match(/needs (\d+)% of the team/), w = m ? 'needs ' + m[1] + '% of the team\'s weekly pace' : /after the Nov 20 code freeze/.test(w0) ? 'lands after the code freeze' : lc((UPD[it.t] || it.why || '').replace(/^(blocked|delayed)\s*[:,-]?\s*/i, '').split(/[.;]/)[0]); return w && w.length < 80 ? ' (' + esc(w) + ')' : ''; };
  const say = it => { const c = confOf(it); return c.k === 'bad' ? nm(it) + ' is <span class="bad">' + (/block/i.test(c.l) ? 'blocked' : /delay/i.test(c.l) ? 'delayed' : 'at risk') + '</span>' + why(it) : soon(it) ? nm(it) + ' launches ' + esc(lc(rng(it.eta))) + money(it) : nm(it) + ' is ' + lcx(STEPS[stepIx(it.s)]) + ', due ' + esc(rng(it.eta)) + money(it); };
  // The story in about 1.6 lines (Mike, Oct 22): what peak is betting on, then what could miss the freeze. Names link to each project.
  const SHORTN = { 'Cart and cart-tray cross-sell': 'cart cross-sell', 'PayPlus offer at checkout': 'PayPlus', 'Learn to Rank rerun': 'Learn to Rank', 'T-shirt style pills on product pages': 'T-shirt style pills', 'Redbubble quick wins': 'Redbubble quick wins' };
  const ptip = it => { const c = confOf(it); return '<b>' + esc(it.t) + '</b><br>' + esc(it.s || '') + (it.eta ? ' · launch ' + esc(rng(it.eta)) : '') + (impVal(it) > 0 ? '<br>Impact: ' + esc(IMPS[it.t] || it.imp || (cest(it) ? cest(it).short : '')) : '') + '<br>Confidence: ' + esc(c.l) + (c.why && c.why[0] ? '<br><span class="cap">' + esc(c.why[0]) + '</span>' : ''); };
  const sn = (it, cap) => { const t = SHORTN[it.t] || it.t, u = cap ? t.charAt(0).toUpperCase() + t.slice(1) : t; return hint(esc(u), 'verd ' + (confOf(it).k === 'bad' ? 'w' : 'n2'), ptip(it)); };
  const F = t => list.find(it => it.t === t), fm = t => F(t) ? sn(F(t)) : '';
  const aov = ['Cart and cart-tray cross-sell', 'PayPlus offer at checkout'].map(fm).filter(Boolean), cvr = ['Learn to Rank rerun', 'Redbubble quick wins'].map(fm).filter(Boolean).slice(0, 1);
  const bads = list.filter(it => confOf(it).k === 'bad').sort((x, y) => score(y) - score(x)), state2 = it => /block/i.test(confOf(it).l) ? 'blocked' : /delay/i.test(confOf(it).l) ? 'delayed' : 'at risk';
  const days = Math.max(0, Math.round((FREEZE - parse(D.asOf)) / DAY)), reason = it => why(it).replace(/^ \(|\)$/g, '');
  const tag = '<div class="rmtop"><span class="vsale">Peak prep · ' + days + ' days to the Nov 20 code freeze</span><span class="cap">As of ' + esc(COMING.asOf) + '</span></div>';
  const head = '<p class="verdict rmverd">Roadmap: ' + (bads.length ? hint(bads.length + ' projects', 'verd w', '<b>At risk for the Nov 20 freeze</b><br>' + bads.map(it => esc(it.t) + ' · ' + state2(it)).join('<br>')) + ' could miss the Nov 20 freeze.' : 'everything is on track for the Nov 20 freeze.') + '</p>';
  const launch = list.filter(it => soon(it) && confOf(it).k !== 'bad' && stepIx(it.s) < 6).sort((x, y) => impVal(y) - impVal(x))[0];
  const subs = (aov.length && cvr.length ? ['Peak bets: ' + aov.join(' and ') + ' for order value, ' + cvr[0] + ' for CVR'] : []).concat(launch ? [sn(launch, true) + ' launches ' + esc(lc(rng(launch.eta)))] : []);
  const sub = subs.length ? '<p class="sulead">' + subs.join('. ').replace(/\. ([a-z])/g, (m, c) => '. ' + c.toUpperCase()) + '.</p>' : '';
  const pill = it => '<button type="button" class="mv big" data-lbm2="' + it.ref + '"><span class="mvl"><span aria-hidden="true">' + (it.e || '') + '</span><b>' + esc(SHORTN[it.t] ? SHORTN[it.t].charAt(0).toUpperCase() + SHORTN[it.t].slice(1) : it.t) + '</b><span class="d">' + state2(it) + '</span></span>' + (reason(it) ? '<span class="mvr">' + esc(reason(it).charAt(0).toUpperCase() + reason(it).slice(1)) + '</span>' : '') + '</button>';
  const pills = bads.length ? '<div class="moved inhead"><div class="mvlist"><span class="mvlbl">At risk:</span>' + bads.slice(0, 2).map(pill).join('') + (bads.length > 2 ? '<button type="button" class="linkbtn mvmore" data-rmrisk="1">+' + (bads.length - 2) + ' more at risk</button>' : '') + '</div></div>' : '';
  return '<div class="rmhead2">' + tag + head + sub + pills + '</div>';
  const risk = list.filter(it => confOf(it).k === 'bad').length;
  return '<p class="rmlead">' + top.map(say).join('; ') + '.' + (risk > top.filter(it => confOf(it).k === 'bad').length ? ' <span class="soft">' + risk + ' projects in all are at risk for the Nov 20 freeze.</span>' : '') + '</p>';
}
// A project's labels in one row: site, goal, team, Product Manager. Each one filters the page by it (Mike, Oct 27).
// A small "ⓘ Sources" button after a row's labels opens just the sources for that row (Mike, Oct 28: PMs need to get there quickly).
const srcBtn = key => '<button type="button" class="srcbtn" data-srcbox="' + esc(key) + '" title="Where every fact on this row comes from">ⓘ Sources</button>';
function srcBox(key) {
  const [k, v] = [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)];
  if (k === 'rm') { const it = lbItem2(v); return openModal('<div class="mhead"><span class="lbl">Where this comes from</span><h3 id="mtitle">' + esc(it.t) + '</h3></div>' + provHtml(it, typeof LATEST !== 'undefined' && LATEST[it.t], (typeof PEOPLE !== 'undefined' && PEOPLE[it.t]) || {}) + '<button type="button" class="linkbtn" data-lbm2="' + esc(v) + '">More project info →</button>'); }
  if (k === 'imp') { const it = impactList()[+v]; return openModal('<div class="mhead"><span class="lbl">Where this comes from</span><h3 id="mtitle">' + esc(it.t) + '</h3></div>' + impProv(it)); }
  if (k === 'test') { const t = [].concat(EXPS.live || [], EXPS.done || []).find(x => String(x.id) === v); if (t) return openModal('<div class="mhead"><span class="lbl">Where this comes from</span><h3 id="mtitle">' + esc(t.name) + '</h3></div>' + testProv(t)); }
}
function labelPills(it) {
  const tk = COMING.teams.find(t => t.key === it.team) || {}, pm = pmOf(it.t, it.team), on = (a, v) => (a || []).indexOf(v) >= 0 ? ' on' : '';
  return (it.site ? '<button type="button" class="gpill' + on(state.sites, it.site) + '" data-ssel="' + esc(it.site) + '" title="Show only ' + esc(SITEN(it.site)) + '">' + siteDot(it.site) + '</button>' : '') +
    (it.obj ? '<button type="button" class="gpill' + on(state.goals, it.obj) + '" data-gsel="' + esc(it.obj) + '" title="Show only ' + esc(OBJN(it.obj)) + '">' + (OBJE[it.obj] || '') + ' ' + esc(OBJN(it.obj)) + '</button>' : '') +
    '<button type="button" class="gpill' + on(state.teams, it.team) + '" data-tmsel="' + esc(it.team) + '" title="Show only ' + esc(tk.name || it.team) + '">' + (tk.icon || '') + ' ' + esc(tk.name || TEAMS(it.team)) + '</button>' +
    (pm ? '<button type="button" class="gpill' + on(state.pms, pm) + '" data-psel="' + esc(pm) + '" title="Show only ' + esc(pm) + '\'s projects">👤 ' + esc(pm) + '</button>' : '') + '';
}
function comingHtml() {
  // Multi-select filters: teams OR teams, views OR views, and the two together AND. A single-team link (state.fteam) seeds the team list.
  if (!Array.isArray(state.teams)) state.teams = [];
  if (!Array.isArray(state.views)) state.views = [];
  if (!Array.isArray(state.goals)) state.goals = [];
  if (!Array.isArray(state.sites)) state.sites = [];
  if (!Array.isArray(state.pms)) state.pms = [];
  if (state.fteam && state.fteam !== 'all') { const f0 = state.fteam.split(':')[0], f = MEETS.some(m => m[0] === f0) || PARENT(f0) ? f0 : null; state.teams = f ? [f] : []; state.fteam = 'all'; }
  const TS = state.teams, k = TS.length === 1 ? TS[0] : 'all', all = TS.length !== 1, wide = state.rmScope === 'all', prev = typeof COMING_PREV !== 'undefined' ? COMING_PREV : null;
  const inT = team => !TS.length || TS.indexOf(team) >= 0 || TS.indexOf(PARENT(team)) >= 0;
  // Goal is its own filter next to Team and Show (Mike, Oct 27); "sort by goal" stays too.
  const GS = state.goals, goalOk = it => !GS.length || GS.indexOf(it.obj) >= 0;
  // Site and Product Manager filters, set by clicking a project's labels (Mike, Oct 27). "Both" counts for either site.
  const SS = state.sites, PS = state.pms, siteOk = it => !SS.length || SS.indexOf(it.site) >= 0 || (it.site === 'Both' && SS.length > 0), pmOk = it => !PS.length || PS.indexOf(pmOf(it.t, it.team)) >= 0;
  const mineT = it => inT(it.team) && goalOk(it) && siteOk(it) && pmOk(it);
  const dashAll = ((COMING.teams.find(t => t.key === 'dashery') || {}).items || []).map((it, i) => Object.assign({ team: 'dashery', ref: 'dashery|' + i }, it));
  if (state.pmsRaw) { const names = [...new Set(preList().map(it => pmOf(it.t, it.team)).filter(Boolean))]; state.pms = state.pmsRaw.map(r => names.find(n => n.replace(/[^A-Za-z0-9]+/g, '.') === r)).filter(Boolean); state.pmsRaw = null; }
  const mine = preList().filter(mineT).filter(qOk);
  const isLaunched = it => stepIx(it.s) === 6 && !stuck(it.s);
  const VIEWS = { live: isLaunched, chg: it => liveChg(it, prev).length > 0, risk: it => confOf(it).k === 'bad', launch: it => /launch|ready to ship|this week/i.test((it.s || '') + ' ' + (it.eta || '')) && !stuck(it.s) };
  const VS = state.views.filter(v => VIEWS[v]), vk = VS.length ? VS.join(',') : null, keepV = it => VS.length ? VS.some(v => (v === 'live' || !isLaunched(it)) && VIEWS[v](it)) : !isLaunched(it);
  const now = mine.filter(it => STAGE(it) !== 'next').filter(keepV), next = mine.filter(it => STAGE(it) === 'next').filter(keepV);
  const later = !vk ? postList().filter(mineT).filter(qOk).concat(allItems().filter(LATE).filter(mineT).filter(qOk)) : [];
  const tests = vk || GS.length ? [] : [].concat((EXPS.live || []).map(t => [t, 'live']), (EXPS.done || []).map(t => [t, 'done'])).filter(x => inT(testTeam(x[0]))).filter(x => qOk({ t: x[0].name, d: x[0].where, team: testTeam(x[0]) }));
  const pill = (cls, t) => '<span class="rtag ' + cls + '">' + t + '</span>';
  const tagsOf = it => { const rv = prev && isRev(it, prev), ack = prev && canAck(); return (it.inj ? hint('Injected', 'chgp inj', '<b>Injected</b><br>Added mid-cycle' + (it.for ? '; it displaced ' + esc(it.for) : '') + '.') : '') + (prev ? liveChg(it, prev).map(c => { let h = chgTag(it, c, prev, ack ? '<span class="tck' + (rv ? ' on' : '') + '" aria-hidden="true">' + (rv ? '✓' : '') + '</span>' : '').replace('class="hint chgp', 'class="hint chgp' + (rv ? ' rev' : '')); return ack ? h.replace('class="hint ', 'data-ack="' + esc(it.t) + '" class="hint ') : h; }).join('') : ''); };
  const status = it => { const k = phaseIx(it.s), why = UPD[it.t] || it.why || ''; return hint(phaseBar(it.s), 'stcell', '<b>' + esc(it.s || 'TBD') + '</b><br>' + PHASES.map((p, i) => i === k ? '<b>▸ ' + p + '</b>' : p).join(' → ') + (k < 5 && !stuck(it.s) ? '<br>Next: ' + PHASES[k + 1] : '') + (stuck(it.s) && why ? '<br><br><b>Why:</b> ' + esc(why) : '')); };
  // UX column: the project's Figma or design spec, when there is one (Mike, Oct 26: people like seeing the UX).
  const hasUX = () => typeof UXL !== 'undefined' && Object.keys(UXL).length > 0; // the column only shows once there are links
  const uxCell = it => { const L = (typeof UXL !== 'undefined' && UXL[it.t]) || []; return L.length ? '<a class="uxl" href="' + esc(L[0].url) + '" target="_blank" rel="noopener" title="' + esc(L[0].l) + '">' + (/figma/i.test(L[0].url) ? 'Figma' : 'Design') + ' ↗</a>' : '<span class="faint">–</span>'; };
  const row = it => { const tg = tagsOf(it); return '<div class="rmrow' + (prev && liveChg(it, prev).length ? ' chg' + (isRev(it, prev) ? ' rev' : '') : '') + '" role="button" tabindex="0" data-lbm2="' + it.ref + '"><span class="lbe" aria-hidden="true">' + it.e + '</span><span class="tmn"><b class="rmt">' + esc(it.t) + '</b>' +
    '<span class="lbd rmd">' + esc(it.d || '') + '</span>' + (tg ? '<span class="rmchg">' + tg + '</span>' : '') + '<span class="rmpills">' + labelPills(it) + '</span></span>' +
    '<span' + (prev && liveChg(it, prev).some(c => c.k === 'phase' || c.k === 'blocked') ? ' class="chgv' + (isRev(it, prev) ? ' rev' : '') + '"' : '') + '>' + status(it) + '</span><span class="lbeta' + (prev && liveChg(it, prev).some(c => c.k === 'date') ? ' chgv' + (isRev(it, prev) ? ' rev' : '') : '') + '">' + esc(rng(it.eta)) + '</span><span>' + (impCell(it) || '<span class="faint">' + (/^(Ops|Data|Compliance)$/.test(it.obj || '') ? 'No direct revenue' : 'Not sized') + '</span>') + '</span><span>' + confCell(it) + '</span>' + (hasUX() ? '<span class="rmux">' + uxCell(it) + '</span>' : '') + '</div>'; };
  const S = state.tsort, SORT = { t: it => it.t.toLowerCase(), s: it => stepIx(it.s), eta: it => etaDate(it.eta) || 9e15, imp: it => -impVal(it), c: it => CONFR[confOf(it).k] };
  // Ties (e.g. two launches "This week") go to the project further along, then the bigger impact.
  const sorted = list => list.slice().sort((a, b) => { const x = SORT[S.k](a), y = SORT[S.k](b); return ((x < y ? -1 : x > y ? 1 : 0) * S.dir) || (stepIx(b.s) - stepIx(a.s)) || (impVal(b) - impVal(a)); });
  const hot = it => (confOf(it).k === 'bad' ? 2 : 0) + (prev && liveChg(it, prev).length ? 1 : 0);
  const body = list => S && SORT[S.k] ? sorted(list).map(row).join('') : OBJS.concat(['']).map(o => { const g = list.filter(it => (it.obj || '') === o || (!o && OBJS.indexOf(it.obj) < 0)).sort((a, b) => hot(b) - hot(a)); return g.length ? '<div class="tmobj rmgrp"><div class="rmgh"><span>' + (o ? OBJE[o] + ' ' + OBJN(o) : 'Other') + '</span><span class="rmgn">' + g.length + '</span></div>' + g.map(row).join('') + '</div>' : ''; }).join('');
  const th = (key, lab) => '<button type="button" class="chbtn" data-tsort="' + key + '">' + lab + (S && S.k === key ? ' ' + (S.dir > 0 ? '▲' : '▼') : '') + '</button>';
  const head = '<div class="rmhead"><span></span>' + th('t', 'Project') +  th('s', 'Status') + th('eta', 'Launch') + th('imp', 'Est. impact') + th('c', 'Confidence') + (hasUX() ? '<span>UX</span>' : '') + '</div>';
  // Quiet facts on the right of each section heading: what an exec would ask next about that group.
  const sumImp = l => { const v = l.reduce((a, it) => a + Math.max(0, impVal(it)), 0); return v ? '$' + (v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : Math.round(v / 1e3) + 'K') : ''; };
  const facts = (l, kind) => { const f = [], n = l.length; if (!n) return ''; const risk = l.filter(it => confOf(it).k === 'bad').length, wk = l.filter(it => { const e = etaDate(it.eta); return e && e <= parse(D.asOf) + 8 * DAY; }).length, pre = l.filter(it => { const e = etaDate(it.eta); return e && e <= FREEZE; }).length, sized = l.filter(it => impVal(it) > 0).length, imp = sumImp(l);
    // Plain facts with hovers that read as short lists (Mike, Oct 27: "13 this week" isn't needed; the overlays weren't approachable).
    const bl = (em, its, why) => '<ul class="hul nrul">' + its.slice(0, 8).map(it => '<li>' + em + ' <b>' + esc(it.t) + '</b>' + (why ? ': ' + why(it) : '') + '</li>').join('') + (its.length > 8 ? '<li>…and ' + (its.length - 8) + ' more</li>' : '') + '</ul>';
    if (kind === 'now') { const bad = l.filter(it => confOf(it).k === 'bad'), late = l.filter(it => { const e = etaDate(it.eta); return !e || e > FREEZE; });
      if (risk) f.push(hint('🔴 ' + risk + ' at risk', 'sfact bad', '<b>At risk of missing their date</b>' + bl('🔴', bad, it => esc(lcx((confOf(it).why[0] || confOf(it).l)).split(/[.;]/)[0]))));
      f.push(hint('🧊 ' + pre + ' of ' + n + ' launch before the Nov 20 freeze', 'sfact', '<b>' + (n - pre) + ' don\'t yet</b> (launch after Nov 20, or no date)' + bl('📅', late, it => esc(it.eta || 'no date')))); }
    if (kind === 'next') { f.push(hint((n - sized) + ' need an ROI', 'sfact', '<b>No impact estimate yet</b><br>' + l.filter(it => !(impVal(it) > 0)).map(it => esc(it.t)).join('<br>'))); if (pre) f.push(hint(pre + ' still aimed pre-peak', 'sfact', '<b>Not started, but dated before Nov 20</b><br>' + l.filter(it => { const e = etaDate(it.eta); return e && e <= FREEZE; }).map(it => esc(it.t) + ': ' + esc(it.eta)).join('<br>'))); }
    if (imp && kind !== 'tests') f.push(hint('~' + imp + '/yr est.', 'sfact', '<b>Estimated annual impact, added up</b><br>' + sized + ' of ' + n + ' projects have a dollar estimate (from the roadmap sheet or Claude\'s). Rough: estimates overlap and are not all measured the same way.'));
    return f.length ? '<div class="sfacts">' + f.join('<span class="sdot" aria-hidden="true">·</span>') + '</div>' : ''; };
  const sec = (e, t, n, html, fx) => n ? '<section class="sec2 tmsec"><div class="shead"><div><h2>' + e + ' ' + t + ' <span class="tmcount">' + n + '</span></h2></div>' + (fx || '') + '</div><div class="pbody">' + html + '</div></section>' : '';
  const trow = ([t, st]) => '<div class="rmrow tmt"><span class="lbe" aria-hidden="true">' + testE(t.name) + '</span><span class="tmn"><b class="rmt">' + esc(t.name) + '</b><span class="lbd rmd">' + esc(t.where || '') + '</span></span><span class="rmsite">' + siteDot(testSite(t)) + '</span><span class="tst ' + t.status + '">' + (st === 'live' ? 'Running · day ' + testDays(t) : t.status === 'shipped' ? 'Shipped ' + short(t.end) : 'Kept control ' + short(t.end)) + '</span><span>' + sigChip(t) + '</span>' + hint(sp(siteImp(t.cvr.rel, t.reach)) + '<small class="treach2">whole site</small>', 'timp ' + (siteImp(t.cvr.rel, t.reach) < 0 ? 'w' : 'b'), impTip(t)) + '<span></span></div>';
  const base = mine.filter(it => !isLaunched(it)).length;
  const cnt = key => mine.filter(it => (key === 'live' || !isLaunched(it)) && VIEWS[key](it)).length;
  // Filters: two compact dropdowns (Team, Show) and a search icon that opens a box. One row.
  const VL = { chg: ['Changed since last executive roadmap review' + (prev ? ' (' + prev.asOf.replace(/^the /, '').replace(/ roadmap review$/, '') + ')' : ''), cnt('chg'), 'chg'], risk: ['At risk', cnt('risk'), 'risk'], launch: ['Launching', cnt('launch'), ''], live: ['Launched', cnt('live'), 'live'] };
  // Sub-teams (Jeff's Tiger team) are their own option under their parent; the parent still includes them (Mike, Oct 27).
  const TL = [].concat(...MEETS.map(m => [[m[0], m[1], (COMING.teams.find(t => t.key === m[0]) || {}).icon || '']].concat(COMING.teams.filter(t => t.parent === m[0]).map(t => [t.key, '↳ ' + t.name, t.icon, true])))) ;
  const dd = (key, lab, cur, items) => '<div class="dd"><button type="button" class="ddbtn" data-ddopen="' + key + '" aria-haspopup="true" aria-expanded="' + (state.ddOpen === key) + '"><span class="nlbl">' + lab + '</span>' + cur + '<span class="ddcar" aria-hidden="true">▾</span></button><div class="ddmenu" data-ddmenu="' + key + '" role="menu"' + (state.ddOpen === key ? '' : ' hidden') + '>' + items + '</div></div>';
  const badge = (n, c) => '<span class="ddn ' + c + '">' + n + '</span>';
  const box = on => '<span class="ddck' + (on ? ' on' : '') + '" aria-hidden="true">' + (on ? '✓' : '') + '</span>';
  const qOpen = (state.q || '').trim();
  const tools = '<div class="rmtools">' +
    dd('team', 'Team', '<b>' + (TS.length ? TS.length === 1 ? esc((TL.find(x => x[0] === TS[0]) || ['', ''])[1]) : TS.length + ' teams' : 'All teams') + '</b>',
      '<button type="button" role="menuitemcheckbox" aria-checked="' + !TS.length + '" data-tmsel="">' + box(!TS.length) + 'All teams</button>' + TL.map(x => '<button type="button" role="menuitemcheckbox"' + (x[3] ? ' class="ddsub"' : '') + ' aria-checked="' + (TS.indexOf(x[0]) >= 0) + '" data-tmsel="' + x[0] + '">' + box(TS.indexOf(x[0]) >= 0) + (x[2] ? x[2] + ' ' : '') + esc(x[1]) + '</button>').join('')) +
    dd('view', 'Show', '<b>' + (VS.length ? VS.length === 1 ? esc(VL[VS[0]][0]) : VS.length + ' filters' : 'Everything') + '</b>' + (VS.length ? '' : badge(base, '')),
      '<button type="button" role="menuitemcheckbox" aria-checked="' + !VS.length + '" data-vsel="">' + box(!VS.length) + 'Everything' + badge(base, '') + '</button>' + Object.keys(VL).map(key => '<button type="button" role="menuitemcheckbox" aria-checked="' + (VS.indexOf(key) >= 0) + '" data-vsel="' + key + '">' + box(VS.indexOf(key) >= 0) + esc(VL[key][0]) + badge(VL[key][1], VL[key][2]) + '</button>').join('')) +
    (() => { const GL = OBJS.filter(o => preList().concat(postList()).some(it => it.obj === o)); return dd('goal', 'Goal', '<b>' + (GS.length ? GS.length === 1 ? (OBJE[GS[0]] || '') + ' ' + esc(OBJN(GS[0])) : GS.length + ' goals' : 'All goals') + '</b>',
      '<button type="button" role="menuitemcheckbox" aria-checked="' + !GS.length + '" data-gsel="">' + box(!GS.length) + 'All goals</button>' + GL.map(o => '<button type="button" role="menuitemcheckbox" aria-checked="' + (GS.indexOf(o) >= 0) + '" data-gsel="' + o + '">' + box(GS.indexOf(o) >= 0) + (OBJE[o] || '') + ' ' + esc(OBJN(o)) + '</button>').join('')); })() +
    '<span class="rmqwrap"><input type="search" class="rmq" data-fq="1" placeholder="🔍 Search projects" value="' + esc(state.q || '') + '" aria-label="Search projects">' + (qOpen ? '<span class="qn">' + (now.length + next.length) + ' match' + (now.length + next.length === 1 ? '' : 'es') + '</span><button type="button" class="qx" data-qclose="1" aria-label="Clear search">✕</button>' : '') + '</span>' + (() => { const SO = [['eta', 'Launch date'], ['', state.rmGantt ? 'By team' : 'By goal'], ['c', 'Riskiest first'], ['imp', 'Biggest impact'], ['s', 'Furthest along'], ['t', 'Project name']], cur = state.tsort ? state.tsort.k : '';
    return '<div class="rmend">' + dd('sort', '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M5 2.5v11M2.5 11 5 13.5 7.5 11M11 13.5v-11M8.5 5 11 2.5 13.5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'Sort by <b>' + (SO.find(o => o[0] === cur) || SO[0])[1].toLowerCase() + '</b>', SO.map(o => '<button type="button" role="menuitemradio" aria-checked="' + (o[0] === cur) + '" data-tsortpick="' + o[0] + '"><span class="ddck rad' + (o[0] === cur ? ' on' : '') + '" aria-hidden="true"></span>' + o[1] + '</button>').join('') + '<p class="cap ddnote">No start dates are tracked yet, so there is no start-date sort.</p>').replace('<div class="dd">', '<div class="dd ddsort">'); })() + '<div class="vtog" role="group" aria-label="View"><button type="button" data-rmview="gantt" aria-pressed="' + !!state.rmGantt + '"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2.5 4h6M5 8h7.5M3.5 12h5"/></svg>Timeline</button><button type="button" data-rmview="list" aria-pressed="' + !state.rmGantt + '"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M5.5 4h8M5.5 8h8M5.5 12h8"/><circle cx="2.6" cy="4" r=".6"/><circle cx="2.6" cy="8" r=".6"/><circle cx="2.6" cy="12" r=".6"/></svg>List</button></div></div>' +
    '<div class="fpills">' + TS.map(x => { const t = TL.find(y => y[0] === x) || [x, x, '']; return '<span class="fpill tt-' + x + '">' + (t[2] ? t[2] + ' ' : '') + esc(t[1].replace('↳ ', '')) + '<button type="button" data-tmsel="' + x + '" aria-label="Remove ' + esc(t[1]) + '">✕</button></span>'; }).join('') + VS.map(v => '<span class="fpill v ' + VL[v][2] + '">' + esc(VL[v][0]) + '<button type="button" data-vsel="' + v + '" aria-label="Remove ' + esc(VL[v][0]) + '">✕</button></span>').join('') + GS.map(o => '<span class="fpill g">' + (OBJE[o] || '') + ' ' + esc(OBJN(o)) + '<button type="button" data-gsel="' + o + '" aria-label="Remove ' + esc(OBJN(o)) + '">✕</button></span>').join('') + SS.map(x => '<span class="fpill g">' + siteDot(x) + '<button type="button" data-ssel="' + esc(x) + '" aria-label="Remove ' + esc(SITEN(x)) + '">✕</button></span>').join('') + PS.map(x => '<span class="fpill g">👤 ' + esc(x) + '<button type="button" data-psel="' + esc(x) + '" aria-label="Remove ' + esc(x) + '">✕</button></span>').join('') +
    (TS.length || VS.length || GS.length || SS.length || PS.length ? '<button type="button" class="linkbtn" data-fclear2="1">Clear all</button>' : '') + '</div></div>';
  return '<section class="sview"><div class="vhead rmvh vhl">' + rmHeadline() + '</div>' + tools + (S && S.k !== 'eta' ? '<p class="cap rmsorted">Sorted by ' + ({ t: 'project', s: 'status', eta: 'launch date', imp: 'impact', c: 'confidence' })[S.k] + '. <button type="button" class="linkbtn" data-tsort="">Group by objective again</button></p>' : '') +
    (state.rmGantt ? ganttHtml(now.concat(next), all, it => mineT(it) && qOk(it)) + '</section>' : '' +
    sec('🏁', 'In Progress', now.length, head + body(now), facts(now, 'now')) +
    sec('🗓️', 'Not Started Yet', next.length, head + body(next), facts(next, 'next')) +
    sec('🧪', 'Experiments', tests.length, '<div class="rmhead"><span></span><span>Test</span><span>Site</span><span>Status</span><span>Confidence</span><span>Whole-site impact</span><span></span></div>' + tests.map(trow).join('')) +
    (later.length ? '<section class="sec2 tmsec"><div class="shead"><div><h2>⏭️ Next Half <span class="tmcount">' + later.length + '</span></h2><p class="cap">Queued for after the Nov 20 code freeze. Not committed yet.</p></div><button type="button" class="btn sm" data-rmwide="1">' + (wide ? 'Hide' : 'Show ' + later.length + ' projects') + '</button></div>' + (wide ? '<div class="pbody">' + head + body(later) + '</div>' : '') + '</section>' : '') +
    (!now.length && !next.length && !tests.length && !later.length ? '<p class="cap empty1">Nothing matches.</p>' : '') + '</section>');
}
// Customer service: only topics that are above normal; otherwise say plainly that all is quiet.
function dasheryHtml() {
  return '<section class="sview"><div class="vhead"><h1>🛍️ Dashery CVR</h1><span class="tag">Under construction</span></div>' +
    '<div class="dsbox"><span class="dsbig" aria-hidden="true">🚧</span><div><h3>Coming soon: CVR for stores that are selling</h3><p>Most Dashery stores get little traffic, so an all-store number mostly measures quiet stores. This page will track CVR only for stores with at least one order that day, compared with the same weekday last week and last month.</p>' +
    '<div class="dsnum"><div><span class="lbl">First look · all stores, product page</span><b>0.36%</b><span class="cap">Oct 20 · up from 0.26% Oct 19, down from 0.44% Oct 13</span></div><div><span class="lbl">Selling stores only</span><b class="faint">Not built yet</b><span class="cap">Needs a store-level Amplitude dashboard</span></div></div>' +
    '<p class="cap">Next step: build the selling-store dashboard in Amplitude (project 665060), then this tab gets the same scorecard as TeePublic and Redbubble.</p>' + refsHtml([{ soon: 'dashery', l: 'Dashery priorities' }]) + '</div></div></section>';
}
const csTag = l => l === 'high' ? '<span class="cstag ask">💬 Worth raising with CS</span>' : l === 'watch' ? '<span class="cstag watch">👀 Worth watching</span>' : '<span class="cstag ok">✅ Normal, no action</span>';
function csCvr(b) {
  if (typeof CS === 'undefined' || !CS[b]) return '';
  const x = CS[b];
  return '<section class="cscvr"><div class="ghead"><div class="gt"><h3>🎧 What customer service is seeing</h3><p class="gsub">Only patterns that could trip us up. ' + esc(CS.window) + '.</p></div></div>' +
    (!x.topics.length ? '<div class="csok"><span aria-hidden="true">✅</span><div><b>All good over here.</b><p>' + esc(x.note || 'Normal volume, nothing trending.') + '</p></div></div>' :
    '<div class="csok soft"><span aria-hidden="true">👀</span><div><b>Mostly normal, ' + (x.topics.length > 1 ? x.topics.length + ' things' : 'one thing') + ' worth knowing.</b><p>Volume is at or below the usual level.</p></div></div><ul class="cslist">' + x.topics.slice(0, 2).map(t => '<li><span aria-hidden="true">' + t.e + '</span><div><b>' + esc(t.t) + '</b>' + csTag(t.level) + '<p>' + esc(t.note) + '</p>' + refsHtml(t.refs) + '</div></li>').join('') + '</ul>') + '</section>';
}
function csHtml() {
  // Glance first (Mike, Oct 26): one status line per site, then one compact card per issue with a colored edge for how serious it is.
  // Full width, both sites mixed, a small site tag on each card; details stay in one or two short lines.
  const items = [];
  ['rb', 'tp'].forEach(b => (CS[b].topics || []).slice(0, 4).forEach(t => items.push(Object.assign({ b }, t))));
  items.sort((a, z) => (a.level === 'high' ? 0 : 1) - (z.level === 'high' ? 0 : 1));
  // Per site: the site name stays neutral; each count is its own colored badge (red above normal, yellow worth watching, green all good) (Mike, Oct 26).
  const stat = b => { const ts = CS[b].topics || [], hi = ts.filter(t => t.level === 'high').length, wa = ts.length - hi;
    const badges = hi || wa ? (hi ? '<span class="csb bad">' + hi + ' above normal</span>' : '') + (wa ? '<span class="csb warn">' + wa + ' worth watching</span>' : '') : '<span class="csb good">✓ All good</span>';
    return '<span class="csst2"><i style="background:var(--' + b + ')"></i><b>' + BR[b].name + '</b>' + badges + '</span>'; };
  const card = t => '<article class="cs2 ' + (t.level === 'high' ? 'bad' : 'warn') + '"><div class="cs2h"><span class="cs2e" aria-hidden="true">' + t.e + '</span><b>' + esc(t.t) + '</b><span class="cs2lev">' + (t.level === 'high' ? 'Above normal' : 'Worth watching') + '</span></div>' +
    '<p>' + esc(t.note) + '</p><div class="cs2f"><span class="cssite"><i style="background:var(--' + t.b + ')"></i>' + BR[t.b].name + '</span>' + (t.refs && t.refs.length ? refsHtml(t.refs) : '') + '</div></article>';
  // Both sites quiet: one green banner, like the payment mix's (Mike, Oct 27).
  if (!items.length) return '<div class="cs2wrap"><div class="pstatbar ok"><span class="psi" aria-hidden="true">✓</span><span>Customer service isn\'t seeing anything unusual on Redbubble or TeePublic.</span></div></div>';
  return '<div class="cs2wrap"><p class="cs2sum">' + stat('rb') + stat('tp') + '</p>' + (items.length ? '<div class="cs2grid">' + items.map(card).join('') + '</div>' : '') + '</div>';
}
function vibeHtml() {
  const L = preList(), up = L.filter(i => /^up/.test(i.move) || i.move === 'new').length, dn = L.filter(i => i.move === 'down' || /paus/i.test(i.s)).length, wk = L.filter(i => /this week/i.test(i.eta || '')).length, bl = L.filter(i => STC(i.s) === 'blocked').length;
  const tiles = [['🔥', 'Pace', VIBE.pace, 'hot', wk + ' launches this week, ' + L.length + ' projects before the freeze.', '<b>Pace: ' + esc(VIBE.pace) + '</b><br>Counted from the Roadmap: projects due before the Nov 20 code freeze and how many launch this week. High means more launches than usual are landing at once.'],
    ['🔀', 'Priorities', VIBE.churn, 'warm', up + ' moved up or new, ' + dn + ' moved down or paused.', '<b>Priorities: ' + esc(VIBE.churn) + '</b><br>How much the priority order changed this week, from the roadmap sheet, standup notes and team channels. Some shifting before peak is normal.'],
    ['🚒', 'Firefighting', VIBE.fire, 'warm', VIBE.fireNote, '<b>Firefighting: ' + esc(VIBE.fire) + '</b><br>Live issues that pulled people off planned work, from incident channels. ' + esc(VIBE.teamNote)]];
  return '<div class="vibe2"><p class="vlead"><span aria-hidden="true">' + VIBE.e + '</span> <b>' + esc(VIBE.mood) + '.</b> ' + esc(VIBE.summary) + '</p><div class="vtiles">' + tiles.map(r => '<div class="vt"><span class="vtl"><span aria-hidden="true">' + r[0] + '</span> ' + r[1] + '</span>' + hint(esc(r[2]), 'vtv ' + r[3], r[5]) + '<p>' + esc(r[4]) + '</p></div>').join('') + '</div></div>';
}
// Shout-out "what" reads as 2 to 4 bullets (pts: [emoji, label, text]) when given (Mike, Oct 27). **phrase** in shout-out copy renders bold, so the key moments stand out at a glance.
const mdb = t => esc(t || '').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
// Shout-out, two columns again, full width (Mike, Oct 27). Left: who, the headline as the main thing, and why it stood out as its
// second line. Right: what they did as plain bullets (no bold labels), then the links.
function shoutCard() {
  const x = SHOUTS, ini = x.name.split(' ').map(w => w[0]).join('').slice(0, 2);
  const pt = p => '<li><span aria-hidden="true">' + p[0] + '</span><span>' + (p.length > 2 ? '<b>' + esc(p[1]) + ':</b> ' + mdb(p[2]).replace(/<\/?b>/g, '') : mdb(p[1]).replace(/<\/?b>/g, '')) + '</span></li>';
  return '<article class="shout5"><div class="s5l"><div class="s4head"><div class="sav" aria-hidden="true">' + (x.img ? '<img src="' + x.img + '" alt="">' : esc(ini)) + '<span>' + x.e + '</span></div><div class="s4who"><span class="skick">' + esc(x.when) + ' · ' + esc(x.where) + '</span><b class="s4name">' + esc(x.name) + '</b></div></div>' +
    '<p class="s5h1">' + esc(x.headline) + '</p>' + (x.why ? '<p class="s5h2">' + mdb(x.why) + '</p>' : '') + '</div>' +
    '<div class="s5r">' + (x.pts && x.pts.length ? '<ul class="s3pts s5pts">' + x.pts.map(pt).join('') + '</ul>' : '<p class="s3what">' + mdb(x.what) + '</p>') + '<div class="s5foot">' + refsHtml(x.refs) + '</div></div></article>';
}
function shoutsHtml() {
  const x = SHOUTS, ini = x.name.split(' ').map(w => w[0]).join('').slice(0, 2);
  return '<article class="shout2"><div class="sav" aria-hidden="true">' + (x.img ? '<img src="' + x.img + '" alt="">' : esc(ini)) + '<span>' + x.e + '</span></div><div class="sbody"><span class="skick">' + esc(x.when) + '</span><h3>' + esc(x.headline) + '</h3>' +
    '<div class="sgrid"><div><span class="lbl">What happened</span><p>' + mdb(x.what) + '</p></div><div><span class="lbl">Why it stood out</span><p>' + mdb(x.why) + '</p></div></div>' +
    '<div class="sfoot"><span class="cap">' + esc(x.where) + '</span>' + refsHtml(x.refs) + '</div></div></article>';
}
function shoutsOld() {
  const x = SHOUTS;
  return '<div class="shout1"><span class="sbig" aria-hidden="true">' + x.e + '</span><div><span class="lbl">Shout-out · ' + esc(x.when) + '</span><h3>' + esc(x.name) + ': ' + esc(x.headline) + '</h3><p>' + esc(x.what) + '</p>' + (x.why ? '<p class="swhy"><b>Why this one:</b> ' + esc(x.why) + '</p>' : '') + '<span class="cap">' + esc(x.where) + '</span>' + refsHtml(x.refs) + '</div></div>';
}

/* ---------- charts: one line; sale days as light vertical bands plus a strip; sessions optional ---------- */
const niceStep = (max, steps, maxTicks) => { for (const s of steps) if (max / s <= maxTicks) return s; return steps[steps.length - 1]; };
const compact = (v, usdp) => (usdp ? '$' : '') + (v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? Math.round(v / 1e3) + 'k' : Math.round(v));
function bandRects(b, S, mg, iw, n, top, h) {
  let g = '';
  for (let i = 0; i < n; i++) { const d = S.dates[i], con = isContam(b, d); if (infoNow(b, d).sale || con) g += '<rect x="' + (mg.l + iw * i / n).toFixed(1) + '" y="' + top + '" width="' + (iw / n + 0.4).toFixed(1) + '" height="' + h + '" style="fill:' + (con ? 'var(--band-x)' : BR[b].band) + '"/>'; }
  return g;
}
function drawChart(host, spec) {
  if (!host) return;
  const m = spec.m, b = m.b, S = SER[b], n = S.dates.length, mini = !!spec.mini, showS = !!spec.sess && m.sess && !m.isSess;
  const hcs = getComputedStyle(host), W = Math.max(280, Math.floor(host.clientWidth - (parseFloat(hcs.paddingLeft) || 0) - (parseFloat(hcs.paddingRight) || 0))), narrow = W < 560 || mini;
  // Full-size charts always keep room for the right-hand sessions axis, so switching layers or metrics never resizes the plot (Mike, Oct 26).
  const mg = { l: narrow ? 44 : 52, r: showS || !mini ? (narrow ? 44 : 56) : 14, t: mini ? 8 : 34, b: mini ? 34 : 68 }, ph = mini ? (spec.tall ? 170 : 130) : (narrow ? 210 : 260), H = mg.t + ph + mg.b, iw = W - mg.l - mg.r;
  const x = i => mg.l + iw * (i + 0.5) / n;
  // Comparison line: same weekday last year by default; the CVR chart can switch it to the prior day or comparable days.
  const cmpK = spec.cmp || 'yoy', CMPN = { yoy: 'Same weekday last year', mom: 'MoM', pd: 'Prior day', bs: 'Comparable days', sim: 'DoD' } /* DoD and MoM, no '4 weeks earlier' wording (Mike, Oct 28) */;
  const OM = spec.other ? metricsFor(BR[b].other).overall[spec.mi || 0] : null, MN = spec.mi ? 'sessions' : 'CVR';
  // Most recent similar day (Mike, Oct 28: instead of 4 weeks earlier): the latest earlier day of the same kind, i.e. the same point in a sale, or the same weekday with no sale.
  const simD = [];
  const lyv = S.dates.map((d, i) => { if (cmpK === 'sim') { const st = infoNow(b, d), pk = st.sale ? posKey(st) : null, wd = dow(d); for (let k = 1; k <= 120; k++) { const x = addDays(d, -k), j = S.idx[x]; if (j === undefined) break; if (isContam(b, x) || m.v[j] == null) continue; const xi = infoNow(b, x); if (st.sale ? xi.sale && posKey(xi) === pk : !xi.sale && sameKind(b, d, x)) { simD[i] = x; return m.v[j]; } } return null; } if (cmpK === 'mom') return i >= 28 ? m.v[i - 28] : null; if (cmpK === 'pd') return i ? m.v[i - 1] : null; if (cmpK === 'bs') { const st = infoNow(b, d), pk = posKey(st), wd = dow(d), vs = []; for (let k = 1; k <= 56; k++) { const x = addDays(d, -k), j = S.idx[x]; if (j === undefined || isContam(b, x) || m.v[j] == null) continue; const xi = infoNow(b, x); if (st.sale ? posKey(xi) === pk && sameTier(b, d, x) : !xi.sale && dow(x) === wd) vs.push(m.v[j]); } return vs.length ? sum(vs) / vs.length : null; } if (!m.ly) return null; const k = lyIndex(addDays(d, -364)); return k >= 0 ? m.ly[k] : null; });
  const all = m.v.concat(lyv.filter(v => v != null), OM ? OM.v.filter(v => v != null) : []), mn0 = Math.min(...all), mx0 = Math.max(...all);
  const steps = isNum(m) ? [500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000, 2000000] : [0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2];
  const st = niceStep((mx0 - mn0) * 1.15 || mx0, steps, 5);
  const yMin = Math.max(0, Math.floor(mn0 * 0.95 / st) * st), yMax = Math.ceil(mx0 * 1.04 / st) * st, ticks = Math.max(1, Math.round((yMax - yMin) / st));
  const y1 = v => mg.t + ph * (1 - (v - yMin) / (yMax - yMin));
  const fmtT = v => isNum(m) ? compact(v, m.fmt === 'usd') : (v * 100).toFixed(st < 0.01 ? 1 : 0) + '%';
  let sMax = 0; if (showS) { const smx = Math.max(...m.sess) * 1.05; const s0 = smx / ticks, mag = Math.pow(10, Math.floor(Math.log10(s0))); sMax = [1, 2, 2.5, 5, 10].map(k => k * mag).find(v => v >= s0) * ticks; }
  const y2 = v => mg.t + ph * (1 - v / sMax), bottom = mg.t + ph;
  let g = bandRects(b, S, mg, iw, n, mg.t, ph);
  for (let k = 0; k <= ticks; k++) {
    const y = mg.t + ph * (1 - k / ticks);
    g += '<line x1="' + mg.l + '" x2="' + (W - mg.r) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" style="stroke:var(--line);stroke-width:1"/><text x="' + (mg.l - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end">' + fmtT(yMin + k * st) + '</text>';
    if (showS) g += '<text x="' + (W - mg.r + 8) + '" y="' + (y + 4).toFixed(1) + '" style="fill:var(--sess)">' + compact(sMax * k / ticks) + '</text>';
  }
  if (!mini) { g += '<text x="' + mg.l + '" y="14" style="fill:var(--ink);font-weight:600;font-size:12px">' + esc(m.axis) + '</text>'; if (showS) g += '<text x="' + (W - mg.r) + '" y="14" text-anchor="end" style="fill:var(--sess);font-weight:600;font-size:12px">Sessions per day</text>'; }
  if (showS) {
    let area = 'M' + x(0).toFixed(1) + ' ' + y2(0).toFixed(1); m.sess.forEach((v, i) => { area += 'L' + x(i).toFixed(1) + ' ' + y2(v).toFixed(1); }); area += 'L' + x(n - 1).toFixed(1) + ' ' + y2(0).toFixed(1) + 'Z';
    // Stronger sessions fill with a top edge, so it reads as its own layer (Allison, Oct 28).
    g += '<path d="' + area + '" style="fill:var(--sess);opacity:.26"/>';
    { let top = ''; m.sess.forEach((v, i) => { top += (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y2(v).toFixed(1); }); g += '<path d="' + top + '" style="fill:none;stroke:var(--sess);stroke-width:1.2;opacity:.6"/>'; }
  }
  for (let i = 0; i < n; i++) { const d = S.dates[i], con = isContam(b, d); if (infoNow(b, d).sale || con) g += '<rect x="' + (mg.l + iw * i / n).toFixed(1) + '" y="' + (bottom + 5) + '" width="' + Math.max(1, iw / n - 0.6).toFixed(1) + '" height="5" rx="1" style="fill:' + (con ? 'var(--strip-x)' : BR[b].strip) + '"/>'; }
  for (let i = n - 1; i >= 0; i -= (mini ? 28 : 14)) g += '<text x="' + x(i).toFixed(1) + '" y="' + (H - (mini ? 4 : 14)) + '" text-anchor="middle">' + short(S.dates[i]) + '</text>';
  const path = vals => { let d = '', pen = false; vals.forEach((v, i) => { if (v == null) { pen = false; return; } d += (pen ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y1(v).toFixed(1); pen = true; }); return d; };
  if (lyv.some(v => v != null)) g += '<path d="' + path(lyv) + '" style="fill:none;stroke:' + (spec.cmp ? 'var(--muted)' : 'var(--faint)') + ';stroke-width:' + (spec.cmp ? '1.75' : '1.5') + ';' + 'stroke-dasharray:4 3' + ';stroke-linejoin:round"/>';
  if (OM) g += '<path d="' + path(OM.v) + '" style="fill:none;stroke:' + BR[BR[b].other].color + ';stroke-width:1.75;stroke-dasharray:5 3;stroke-linejoin:round;opacity:.9"/>';
  g += '<path d="' + path(m.v) + '" style="fill:none;stroke:' + BR[b].color + ';stroke-width:2.25;stroke-linejoin:round;stroke-linecap:round"/>';
  if (!mini && spec.cmp && !narrow) {
    const li = n - 1, yv = y1(m.v[li]), yc = lyv[li] != null ? y1(lyv[li]) : null, up = yc == null || yv <= yc;
    const lab = (txt, yy, col) => '<text x="' + (x(li) - 8).toFixed(1) + '" y="' + yy.toFixed(1) + '" text-anchor="end" class="dlab" style="fill:' + col + '">' + txt + '</text>';
    g += lab(esc(BR[b].name + ' ' + MN), yv + (up ? -10 : 18), BR[b].color);
    if (yc != null) g += lab(esc(CMPN[cmpK]), yc + (up ? 18 : -10), 'var(--muted)');
    if (OM && OM.v[li] != null) g += lab(esc(BR[BR[b].other].name + ' ' + MN), y1(OM.v[li]) + (y1(OM.v[li]) > yv ? 16 : -8), BR[BR[b].other].color);
  }
  const bots = mini ? [] : botFor(m);
  // Key releases ride the same lane as Bot Squad notes, as blue diamonds (design agency, Oct 27): same place to look, different shape and color.
  const rels = mini ? [] : relFor(m.b);
  // Releases and Bot Squad notes sit in rows under the sale strip, next to the dates (Allison, Oct 28).
  bots.forEach(e => { const i0 = S.idx[e.date] != null ? S.idx[e.date] : 0, i1 = e.end && S.idx[e.end] != null ? S.idx[e.end] : i0, xa = mg.l + iw * i0 / n, xb = mg.l + iw * (i1 + 1) / n; g += '<rect class="botmk" x="' + xa.toFixed(1) + '" y="' + (bottom + 19.5) + '" width="' + Math.max(4, xb - xa).toFixed(1) + '" height="4" rx="2"/>'; });
  rels.forEach(r => { const i0 = S.idx[r.date]; if (i0 == null) return; const xc = mg.l + iw * (i0 + 0.5) / n, yc = bottom + 21.5; g += '<path class="relmk" d="M' + xc.toFixed(1) + ' ' + (yc - 4.5) + 'l4.5 4.5-4.5 4.5-4.5-4.5z"/>'; });
  // Baseline days: ringed on the line, with the baseline level as a dotted line from the first of them to today (Mike, Oct 28: "it looks like it's been going up").
  if (spec.base && spec.base.dates && spec.base.dates.length) { const bi = spec.base.dates.map(z => S.idx[z]).filter(i => i !== undefined && m.v[i] != null), si0 = S.idx[state.day];
    if (bi.length && spec.base.v != null && si0 !== undefined) { const yb = y1(spec.base.v).toFixed(1), x0 = x(Math.min(...bi)).toFixed(1), xe = x(si0).toFixed(1); g += '<line x1="' + x0 + '" x2="' + xe + '" y1="' + yb + '" y2="' + yb + '" style="stroke:var(--ctl);stroke-width:1.5;stroke-dasharray:1 3;stroke-linecap:round"/>'; }
    let lastX = -1e9, flip = false; bi.slice().sort((a, z) => a - z).forEach(i => { const cx = +x(i).toFixed(1), cy = +y1(m.v[i]).toFixed(1), lx = Math.max(mg.l + 46, Math.min(W - mg.r - 46, cx)); flip = cx - lastX < 104 ? !flip : false; lastX = cx; /* labels that would collide take turns above and below their dot (Mike, Oct 28) */ g += '<circle class="cmpglow" cx="' + cx + '" cy="' + cy + '" r="11"/><circle cx="' + cx + '" cy="' + cy + '" r="6" style="fill:var(--ctl);stroke:var(--surface);stroke-width:2.5"/><text x="' + lx + '" y="' + (flip ? cy + 26 : cy - 16) + '" text-anchor="middle" class="dlab blab cmplab" style="fill:var(--ctl)">Comparison day</text>'; });
    { const labs = []; g = g.replace(/<text[^>]*class="dlab blab[^"]*"[^>]*>[^<]*<\/text>/g, s => { labs.push(s); return ''; }); g += labs.join(''); } }
  const si = S.idx[state.day];
  // The comparison line gets its own dot on the selected day, so you can see which point it's compared with (Allison, Oct 28).
  if (si !== undefined && lyv[si] != null && !spec.base) g += '<circle cx="' + x(si).toFixed(1) + '" cy="' + y1(lyv[si]).toFixed(1) + '" r="4.5" style="fill:var(--surface);stroke:var(--muted);stroke-width:2"/>';
  if (si !== undefined) g += '<line x1="' + x(si).toFixed(1) + '" x2="' + x(si).toFixed(1) + '" y1="' + mg.t + '" y2="' + bottom + '" style="stroke:var(--muted);stroke-width:1;stroke-dasharray:2 3"/><circle cx="' + x(si).toFixed(1) + '" cy="' + y1(m.v[si]).toFixed(1) + '" r="4.5" style="fill:' + BR[b].color + ';stroke:var(--surface);stroke-width:2"/>';
  g += '<g class="hov" style="display:none"><line class="hl" y1="' + mg.t + '" y2="' + bottom + '" style="stroke:var(--faint);stroke-width:1"/><circle class="hd" r="3.5" style="fill:' + BR[b].color + '"/></g><rect class="hit" x="' + mg.l + '" y="' + mg.t + '" width="' + iw + '" height="' + (ph + 12) + '" style="fill:transparent;cursor:pointer"/>';
  host.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + esc(BR[b].name + ' ' + m.axis + ', last 90 days') + '">' + g + '</svg><div class="tip"></div>';
  const svg = host.querySelector('svg'), hit = host.querySelector('.hit'), tip = host.querySelector('.tip'), hov = host.querySelector('.hov');
  const idxAt = ev => { const r = svg.getBoundingClientRect(); const px = (ev.clientX - r.left) * (W / r.width); return Math.max(0, Math.min(n - 1, Math.floor((px - mg.l) / iw * n))); };
  hit.addEventListener('pointermove', ev => {
    const i = idxAt(ev), d = S.dates[i];
    hov.style.display = ''; hov.querySelector('.hl').setAttribute('x1', x(i)); hov.querySelector('.hl').setAttribute('x2', x(i)); hov.querySelector('.hd').setAttribute('cx', x(i)); hov.querySelector('.hd').setAttribute('cy', y1(m.v[i]));
    let h = '<b>' + label(d) + '</b><div class="r2"><span>' + (isContam(b, d) ? 'Sale, price test, bot spike' : infoNow(b, d).label) + '</span><span></span></div><div class="r2"><span>' + esc(m.axis) + '</span><span>' + fmtVal(m, m.v[i]) + '</span></div>';
    if (spec.base && spec.base.dates && spec.base.dates.indexOf(d) >= 0) h += '<div class="tcmp">🎯 <b>Comparison day</b>' + (infoNow(b, d).sale && infoNow(b, state.day).sale && posKey(infoNow(b, d)) === posKey(infoNow(b, state.day)) && POSN[posKey(infoNow(b, d))] ? ': a ' + POSN[posKey(infoNow(b, d))] + ', like ' + short(state.day) : ' for ' + short(state.day)) + '</div>';
    else if (spec.base && d === state.day) h += '<div class="tcmp">📍 <b>The day you\'re reading</b></div>';
    if (lyv[i] != null) h += '<div class="r2"><span>' + CMPN[cmpK] + (cmpK === 'sim' && simD[i] ? ' (' + short(simD[i]) + ')' : '') + '</span><span>' + fmtVal(m, lyv[i]) + ' (' + sgn(m.v[i] / lyv[i] - 1, 0) + ')</span></div>';
    if (OM && OM.v[i] != null) h += '<div class="r2"><span>' + BR[BR[b].other].name + ' ' + MN + '</span><span>' + fmtVal(m, OM.v[i]) + '</span></div>';
    if (m.sess && !m.isSess) h += '<div class="r2"><span>Sessions</span><span>' + int(m.sess[i]) + '</span></div>';
    rels.filter(r => r.date === d).forEach(r => { h += '<div class="trel">🚀 <b>Release: ' + esc(r.t) + '</b>' + (r.imp ? '<br>' + esc(r.imp) : '') + '</div>'; });
    bots.filter(e => botOn(e, d)).forEach(e => { h += '<div class="tbot">' + bIcon(e) + ' <b>' + esc(e.short || e.title) + '</b>' + (e.sum ? '<br>' + esc(e.sum) : '') + '</div>'; }); // plain title and sentence, never the Bot Squad's jargon title (Mike, Oct 26)
    tip.innerHTML = h; tip.style.display = 'block';
    const tw = tip.offsetWidth, px = x(i) * (svg.getBoundingClientRect().width / W);
    tip.style.left = (px + 14 + tw > host.clientWidth ? px - tw - 14 : px + 14) + 'px'; tip.style.top = (mg.t + 4) + 'px';
  });
  hit.addEventListener('pointerleave', () => { hov.style.display = 'none'; tip.style.display = 'none'; });
  if (!mini) hit.addEventListener('click', ev => { const d = S.dates[idxAt(ev)]; if (d >= LEDGER_START) setDay(d); });
}
/* both sites on one axis, each indexed to its own 90-day average = 100 */
function drawOverlay(host, mt, mr) {
  if (!host) return;
  const n = SER.tp.dates.length, W = Math.max(280, Math.floor(host.clientWidth)), mg = { l: 44, r: 14, t: 10, b: 34 }, ph = 220, H = mg.t + ph + mg.b, iw = W - mg.l - mg.r;
  const idxOf = v => { const a = sum(v) / v.length; return v.map(x => x / a * 100); };
  const it = idxOf(mt.v), ir = idxOf(mr.v), all = it.concat(ir), lo = Math.floor(Math.min(...all) / 10) * 10, hi = Math.ceil(Math.max(...all) / 10) * 10;
  const x = i => mg.l + iw * (i + 0.5) / n, y = v => mg.t + ph * (1 - (v - lo) / (hi - lo)), bottom = mg.t + ph, S = SER.tp;
  let g = bandRects('tp', S, mg, iw, n, mg.t, ph) + bandRects('rb', S, mg, iw, n, mg.t, ph);
  const ticks = Math.max(1, Math.round((hi - lo) / 10)); for (let k = 0; k <= ticks; k++) { const v = lo + (hi - lo) * k / ticks, yy = y(v); g += '<line x1="' + mg.l + '" x2="' + (W - mg.r) + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '" style="stroke:' + (Math.abs(v - 100) < 0.01 ? 'var(--line-2)' : 'var(--line)') + ';stroke-width:1"/><text x="' + (mg.l - 8) + '" y="' + (yy + 4).toFixed(1) + '" text-anchor="end">' + Math.round(v) + '</text>'; }
  for (let i = n - 1; i >= 0; i -= 14) g += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 4) + '" text-anchor="middle">' + short(S.dates[i]) + '</text>';
  const path = vals => vals.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join('');
  g += '<path d="' + path(ir) + '" style="fill:none;stroke:var(--rb);stroke-width:2.25;stroke-linejoin:round"/><path d="' + path(it) + '" style="fill:none;stroke:var(--tp);stroke-width:2.25;stroke-linejoin:round"/>';
  const si = SER.tp.idx[state.day]; if (si !== undefined) g += '<line x1="' + x(si).toFixed(1) + '" x2="' + x(si).toFixed(1) + '" y1="' + mg.t + '" y2="' + bottom + '" style="stroke:var(--muted);stroke-width:1;stroke-dasharray:2 3"/>';
  g += '<g class="hov" style="display:none"><line class="hl" y1="' + mg.t + '" y2="' + bottom + '" style="stroke:var(--faint);stroke-width:1"/></g><rect class="hit" x="' + mg.l + '" y="' + mg.t + '" width="' + iw + '" height="' + (ph + 12) + '" style="fill:transparent"/>';
  host.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="TeePublic and Redbubble ' + esc(mt.label) + ' overlaid, indexed to each site\'s 90-day average">' + g + '</svg><div class="tip"></div>';
  const svg = host.querySelector('svg'), hit = host.querySelector('.hit'), tip = host.querySelector('.tip'), hov = host.querySelector('.hov');
  hit.addEventListener('pointermove', ev => {
    const r = svg.getBoundingClientRect(), px = (ev.clientX - r.left) * (W / r.width), i = Math.max(0, Math.min(n - 1, Math.floor((px - mg.l) / iw * n))), d = S.dates[i];
    hov.style.display = ''; hov.querySelector('.hl').setAttribute('x1', x(i)); hov.querySelector('.hl').setAttribute('x2', x(i));
    tip.innerHTML = '<b>' + label(d) + '</b><div class="r2"><span>TeePublic</span><span>' + fmtVal(mt, mt.v[i]) + ' (index ' + Math.round(it[i]) + ')</span></div><div class="r2"><span>Redbubble</span><span>' + fmtVal(mr, mr.v[i]) + ' (index ' + Math.round(ir[i]) + ')</span></div><div class="r2"><span>TP / RB</span><span>' + infoNow('tp', d).label + ' / ' + infoNow('rb', d).label + '</span></div>';
    tip.style.display = 'block'; const tw = tip.offsetWidth, ppx = x(i) * (r.width / W);
    tip.style.left = (ppx + 14 + tw > host.clientWidth ? ppx - tw - 14 : ppx + 14) + 'px'; tip.style.top = (mg.t + 4) + 'px';
  });
  hit.addEventListener('pointerleave', () => { hov.style.display = 'none'; tip.style.display = 'none'; });
}
function drawPayChart(host, b) {
  if (!host) return;
  const P = D.pay[b], names = Object.keys(P), n = 30, W = Math.max(280, Math.floor(host.clientWidth)), H = 150, m = { l: 40, r: 8, t: 6, b: 20 }, iw = W - m.l - m.r, ih = H - m.t - m.b, bw = iw / n;
  const tot = i => sum(names.map(k => P[k][i]));
  let g = '';
  [0, .5, 1].forEach(v => { const y = m.t + ih * (1 - v); g += '<text x="' + (m.l - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + Math.round(v * 100) + '%</text>'; });
  for (let i = 0; i < n; i++) { let acc = 0; const T = tot(i); names.forEach((k, j) => { const s = P[k][i] / T, y = m.t + ih * (1 - acc - s); g += '<rect x="' + (m.l + i * bw + 1).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + Math.max(1, bw - 2).toFixed(1) + '" height="' + (ih * s).toFixed(1) + '" style="fill:' + PAYC[j] + ';stroke:var(--surface);stroke-width:1"/>'; acc += s; }); }
  for (let i = n - 1; i >= 0; i -= 7) g += '<text x="' + (m.l + (i + .5) * bw).toFixed(1) + '" y="' + (H - 4) + '" text-anchor="middle">' + short(addDays(D.pay.start, i)) + '</text>';
  host.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Payment method share of orders, last 30 days">' + g + '</svg>';
}

/* ---------- ticker: one line of headlines from every section, TV style ---------- */
let TKOFF = (() => { try { return localStorage.getItem('pod.tk9') === 'off'; } catch (e) { return false; } })();
// Menu items read as plain links: no leading emoji or arrows (Mike, Oct 22).
const SMI = { chart: '<path d="M2.5 13.5h11"/><path d="M4 11V8M7 11V5M10 11V7M13 11V3.5"/>', ticket: '<path d="M2.5 5.5h11v2a1.5 1.5 0 0 0 0 3v2h-11v-2a1.5 1.5 0 0 0 0-3z"/>', refresh: '<path d="M13 8a5 5 0 1 1-1.6-3.7"/><path d="M13 2.5v3h-3"/>', funnel: '<path d="M2.5 3h11l-4.2 5v4.5l-2.6 1.2V8z"/>', book: '<path d="M3 3.5h4a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 0 7 12H3zM13 3.5H9.5A1.5 1.5 0 0 0 8 5"/><path d="M13 3.5V12H9.5"/>', grid: '<rect x="2.5" y="2.5" width="11" height="11" rx="1.5"/><path d="M2.5 6.5h11M2.5 10h11M6.5 2.5v11"/>', doc: '<path d="M4 2.5h5.5L12 5v8.5H4z"/><path d="M6 8h4M6 10.5h4"/>', flask: '<path d="M6.5 2.5h3M7 2.5v4L3.5 12.5a1 1 0 0 0 .9 1.5h7.2a1 1 0 0 0 .9-1.5L9 6.5v-4"/>' };
const smIco = t => { const k = /refresh/i.test(t) ? 'refresh' : /driver/i.test(t) ? 'funnel' : /read this page/i.test(t) ? 'book' : /jira/i.test(t) ? 'ticket' : /sheet|roadmap/i.test(t) ? 'grid' : /write-up|confluence/i.test(t) ? 'doc' : /experiment|test/i.test(t) ? 'flask' : 'chart'; return '<svg class="smi" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + SMI[k] + '</svg>'; };
// Menu items: plain links with a small line icon each (Mike, Oct 22: icons back, regular weight).
const srcMenu = cvr => srcMenu0(cvr).replace(/>(?:\p{Extended_Pictographic}|[↻↗])\uFE0F?\s*/gu, '>').replace(/\s*↗</g, '<').replace(/(<(?:a|button) role="menuitem"[^>]*>)([^<]+)</g, (m, open, txt) => open + smIco(txt) + '<span>' + txt + '</span><');
function srcMenu0(cvr) {
  const a = (u, l) => '<a role="menuitem" href="' + u + '" target="_blank" rel="noopener">' + l + ' ↗</a>', SHEET = 'https://docs.google.com/spreadsheets/d/1fbxp4eAXZe1JNmhxsiDJTeSRhOdAOeblmOiVbU0yNkU/edit?gid=579410268#gid=579410268';
  const how = '<button role="menuitem" data-act="refresh">↻ How this refreshes</button>';
  if (cvr) return a('https://app.amplitude.com/analytics/tpub/dashboard/lm29400h', '📊 CVR data in Amplitude') + how + '<button role="menuitem" data-act="drivers">📉 How drivers are picked</button><button role="menuitem" data-act="guide">📖 How to read this page</button>';
  const v = state.view;
  if (v === 'tests') return a('https://app.amplitude.com/experiment/tpub/774278', '🧪 All tests in Amplitude Experiment') + a('https://articore.atlassian.net/browse/DEAP-6266', '🎫 Next test in Jira') + how;
  if (v === 'soon') return a(SHEET, '🗂️ Product org roadmap sheet') + a('https://articore.atlassian.net/jira/software/c/projects/DEAP/issues', '🎫 DEAP project in Jira') + how;
  if (v === 'impact') return a('https://articore.atlassian.net/wiki/spaces/EC1/pages/5056036893/RB+A+B+Cart+Shipping+Options+Test+-+Post-Project+Analysis', '🏅 Latest results write-up') + a('https://app.amplitude.com/experiment/tpub/774278', '🧪 Test results in Amplitude Experiment') + how;
  if (v === 'trending') return a('https://www.teepublic.com/t-shirts?query=brewers', '🛍️ Brewers designs on TeePublic') + a('https://app.amplitude.com/analytics/tpub/dashboard/lm29400h', '📊 Orders data in Amplitude') + how;
  return a(SHEET, '🗂️ Product org roadmap sheet') + how;
}
function tickerItems() {
  const out = [], d = D.asOf;
  // CVR by normal range (Mike, Oct 27): both sites inside it → one item; otherwise one per site. Carets only outside the range.
  const cv = ['tp', 'rb'].map(b => { const m = metricsFor(b).overall[0], c = cellsFor(m, d, compsDefault(b, d)); return { b, m, c, r: nrOf(m, c.bs) }; });
  // Every ticker item hovers (Mike, Oct 27): the same cards the page uses, so a glance at the ticker can go one level deeper.
  const cvTip = x => { const bd = baseDays(x.b, d); return '<b>' + BR[x.b].name + ' CVR · ' + pct(x.c.val) + '</b>' + (x.c.bs != null ? nrTip(x.m, x.c.bs, x.c.bsV, x.c.val, bd) : ''); };
  if (cv.every(x => x.r && x.r.st === 'in')) out.push({ e: '✅', tone: '', t: 'TeePublic and Redbubble CVR are both within their normal range', go: 'w:tp|overall', tip: '<div class="tktip2">' + cv.map(cvTip).join('<hr>') + '</div>' });
  else cv.forEach(x => out.push({ e: x.b === 'tp' ? '🔵' : '🔴', tone: !x.r ? '' : x.r.st === 'hi' ? 'up' : x.r.st === 'lo' ? 'dn' : '', tip: cvTip(x), t: BR[x.b].name + ' CVR ' + pct(x.c.val) + (x.c.bs != null ? ', ' + sgn(x.c.bs, 0) + (x.r.st === 'in' ? ', within its normal range' : x.r.st === 'lo' ? ', below its normal range' : ', above its normal range') : ''), go: 'w:' + x.b + '|overall' }));
  // Then what is furthest below its own normal range, across both sites (never a segment set aside as likely bots).
  const far = [], keepBS = { tp: BOTSET.tp, rb: BOTSET.rb }; // movedFor rewrites BOTSET; put the viewed day's back after
  ['tp', 'rb'].forEach(b => { movedFor(b, d); const skip = new Set((BOTSET[b] || []).map(z => z.m.key)), cd = compsDefault(b, d);
    ['device', 'funnel', 'channel', 'geo'].forEach(sec => metricsFor(b)[sec].forEach(m => { if (skip.has(m.key)) return; const c = cellsFor(m, d, cd), r = nrOf(m, c.bs); if (r && r.st === 'lo') far.push({ b, m, c, k: c.bs / r.w }); })); });
  BOTSET = keepBS;
  far.sort((a, z) => a.k - z.k).slice(0, 2).forEach(f => out.push({ e: em(f.m.label), tone: 'dn', t: BR[f.b].name + ' ' + inSent(f.m.label, true) + ' ' + sgn(f.c.bs, 0) + ', below its normal range', go: 'w:' + f.b + '|' + f.m.key, tip: '<b>' + BR[f.b].name + ' · ' + esc(f.m.label) + '</b>' + nrTip(f.m, f.c.bs, f.c.bsV, f.c.val, baseDays(f.b, d)) + '<span class="segmore">Click for its row in the scorecard →</span>' }));
  const bt = [].concat(EXPS.live).sort((a, z) => z.cvr.rel * z.reach - a.cvr.rel * a.reach)[0];
  if (bt) out.push({ e: '🧪', tone: bt.p != null && conf(bt) >= 80 ? (siteImp(bt.cvr.rel, bt.reach) >= 0 ? 'up' : 'dn') : '', t: bt.name + ': ' + sgn(siteImp(bt.cvr.rel, bt.reach), 1) + ' whole-site so far, not significant yet', go: 'j:' + bt.id, tip: '<b>' + esc(bt.name) + '</b><div class="gkv"><span class="gk">Status</span><span class="gv">Running · day ' + testDays(bt) + '</span><span class="gk">Whole site</span><span class="gv">' + sgn(siteImp(bt.cvr.rel, bt.reach), 1) + '</span><span class="gk">In the test</span><span class="gv">' + sgn(bt.cvr.rel, 1) + ' CVR</span><span class="gk">Confidence</span><span class="gv">' + (bt.p != null ? conf(bt) + '% (needs 95%)' : 'too early') + '</span></div><span class="segmore">Click for the test →</span>' });
  preList().slice(0, 2).forEach(it => { const DT = (typeof DATES !== 'undefined' && DATES[it.t]) || {}; out.push({ e: it.e, t: it.t + ': ' + lcx(it.s) + (/^(this|next) /i.test(it.eta || '') ? ' ' + it.eta.toLowerCase() : ', launch ' + it.eta), go: 'g:soon|.p-org', tip: gTip(it, etaDate(it.eta), false, null, DT.start ? parse(DT.start) : null).replace('Click for the full project →', 'Click for the Roadmap →') }); });
  if (typeof SELLCALL !== 'undefined') out.push({ e: SELLCALL.e, tone: '', t: SELLCALL.tk || SELLCALL.title, go: 'g:trending|.callcard', tip: '<b>' + esc(SELLCALL.title) + '</b><br>' + esc(sents(SELLCALL.body)[0] || '') + '<span class="segmore">Click for the full read →</span>' }); // tk: a short ticker line (Mike, Oct 26: the full title is too wordy there). Neutral: a suggestion, not a result, so no caret.
  return out;
}
let TKN = 0, CDTOP = '';
// The address bar carries the page and its filters, e.g. #soon~t_tiger~g_AOV~gb_team, so copying the URL shares the filtered view (Mike, Oct 27).
function viewToken() {
  const v = state.view === 'daily' ? (HASHOUT[state.tab] || state.tab) : state.view, p = [v];
  if (state.view === 'soon' || state.view === 'impact') { (state.teams || []).forEach(t => p.push('t_' + t)); (state.goals || []).forEach(g => p.push('g_' + g)); (state.sites || []).forEach(x => p.push('s_' + x)); (state.pms || []).forEach(x => p.push('p_' + x.replace(/[^A-Za-z0-9]+/g, '.'))); (state.views || []).forEach(x => p.push('v_' + x)); if (state.gGroup && state.gGroup !== 'stage') p.push('gb_' + state.gGroup); if (state.rmGantt === false) p.push('list'); }
  if (state.view === 'daily') { if (state.day && state.day !== D.asOf) p.push('d_' + state.day.replace(/-/g, '')); if (state.botf && state.botf !== 'max') p.push('bf_' + state.botf); }
  if (SHARE) p.push(SHARE);
  return p.join('~');
}
function tickerHtml() {
  const one = x => { const g = x.go, at = g.indexOf('w:') === 0 ? 'data-watch="' + esc(g.slice(2)) + '"' : g.indexOf('j:') === 0 ? 'data-jt="' + esc(g.slice(2)) + '"' : 'data-goto="' + esc(g.slice(2)) + '"'; return '<button type="button" class="tki" ' + at + '>' + (x.tone === 'up' ? '<span class="tkc up" aria-label="up">▲</span>' : x.tone === 'dn' ? '<span class="tkc dn" aria-label="down">▼</span>' : '') + '<span aria-hidden="true">' + x.e + '</span> ' + esc(x.t) + '</button>'; };
  const it = tickerItems().map(one).join('<span class="tksep" aria-hidden="true">◆</span>');
  return '<div class="tk-in"><span class="tklbl">Today</span><div class="tk-view"><div class="tk-track">' + it + '<span class="tksep" aria-hidden="true">◆</span><span aria-hidden="true" class="tkdup">' + it + '<span class="tksep">◆</span></span></div></div><button type="button" class="tkx" data-act="ticker" title="Hide the ticker. Bring it back from the Product Org Dashboard menu.">Hide ✕</button></div>';
}

/* ---------- render ---------- */
// One highlight that slides between nav tabs instead of each tab lighting up on its own.
// Filter groups get the nav's sliding pill: it starts where the last selection was and glides to the new one.
const SEGPOS = {};
function segPills() {
  document.querySelectorAll('.segs[data-seg]').forEach(g => {
    const sel = g.querySelector('[aria-selected="true"], [aria-pressed="true"]'); if (!sel) return;
    const p = document.createElement('span'); p.className = 'segpill'; p.setAttribute('aria-hidden', 'true'); g.appendChild(p); g.classList.add('haspill');
    const to = [sel.offsetLeft, sel.offsetTop, sel.offsetWidth, sel.offsetHeight], from = SEGPOS[g.dataset.seg] || to;
    const put = r => { p.style.transform = 'translate(' + r[0] + 'px,' + r[1] + 'px)'; p.style.width = r[2] + 'px'; p.style.height = r[3] + 'px'; };
    p.style.transition = 'none'; put(from); void p.offsetWidth; p.style.transition = ''; put(to); SEGPOS[g.dataset.seg] = to;
  });
}
function pillTo(sel) {
  const wrap = document.querySelector('.bar-in'), p = document.getElementById('navpill'); if (!wrap || !p || !p._bw || !sel) return;
  const w = wrap.getBoundingClientRect(), r = sel.getBoundingClientRect();
  p.style.setProperty('--c', getComputedStyle(sel).getPropertyValue('--c') || 'var(--accent)');
  p.style.transform = 'translate(' + (r.left - w.left) + 'px,' + (r.top - w.top) + 'px) scale(' + (r.width / p._bw) + ',' + (r.height / p._bh) + ')';
}
function navRender(sel) {
  const root = document.documentElement; try { pillTo(sel); } catch (e) {}
  root.classList.add('navbusy');
  requestAnimationFrame(() => requestAnimationFrame(() => { render(); setTimeout(() => root.classList.remove('navbusy'), 500); }));
}
function movePill() {
  const wrap = document.querySelector('.bar-in'), sel = document.querySelector('#tabs [aria-selected="true"]'); if (!wrap) return;
  let p = document.getElementById('navpill'), fresh = false; if (!p) { p = document.createElement('span'); p.id = 'navpill'; p.setAttribute('aria-hidden', 'true'); p.style.transition = 'none'; wrap.appendChild(p); fresh = true; }
  if (!sel) { p.style.opacity = '0'; return; }
  const w = wrap.getBoundingClientRect(), r = sel.getBoundingClientRect();
  if (!p._bw) { p._bw = r.width; p._bh = r.height; p.style.width = r.width + 'px'; p.style.height = r.height + 'px'; p.style.transformOrigin = '0 0'; p.style.willChange = 'transform'; }
  p.style.opacity = '1';
  p.style.transform = 'translate(' + (r.left - w.left) + 'px,' + (r.top - w.top) + 'px) scale(' + (r.width / p._bw) + ',' + (r.height / p._bh) + ')';
  p.style.setProperty('--c', getComputedStyle(sel).getPropertyValue('--c') || 'var(--accent)');
  if (fresh) { void p.offsetWidth; p.style.transition = ''; }
}
addEventListener("resize", () => setTimeout(movePill, 0));
const setBarH = () => { const bar = document.querySelector('.bar'); if (bar) document.documentElement.style.setProperty('--barh', bar.offsetHeight + 'px'); };
function drawOpenCharts() {
  setBarH();
  document.querySelectorAll('[data-chart]').forEach(host => { let m = findMetric(state.tab, host.dataset.chart); if (!m) return; const g = (state.pgeo || {})[m.key];
    if (m.pgeo && g && g !== 'all' && m.pgeo[g]) m = Object.assign({}, m, { v: m.pgeo[g].v, sess: m.pgeo[g].s, axis: m.label + ' CVR, ' + g });
    drawChart(host, { m, sess: !state.sessOff.has(m.key) }); });
  if (state.payChart) drawPayChart($('#paychart'), state.tab);
  const cc = $('#cvrc'); if (cc) drawChart(cc, { m: metricsFor(state.tab).overall[state.ccm === 'sess' ? 1 : 0], mi: state.ccm === 'sess' ? 1 : 0, sess: !state.ccOff, other: !!state.ccOth, cmp: ccmpOf(state.tab) });
}
// Full-width CVR chart under What moved: CVR, a switchable comparison line, and sessions behind it.
// TeePublic: Prior day, MoM, YoY. Redbubble has no last year yet, so Prior day and MoM; a YoY pick shows MoM there (Mike, Oct 26).
// No prior-day line: it's the same line moved one day, so it traces the solid line exactly (Allison and Mike, Oct 28). Default: last year on TeePublic, 4 weeks earlier on Redbubble.
const ccmpOf = b => state.ccmp === 'mom' ? 'mom' : state.ccmp === 'sim' || b !== 'tp' ? 'sim' : 'yoy';
// Sources under the 90-day chart, bottom-left, expanding in place (Mike, Oct 28).
function chartSrc(b) {
  const bf = state.botf === 'strong' ? 'strong' : 'max', L = [
    '📊 <b>CVR and sessions:</b> ' + LNK('https://app.amplitude.com/analytics/tpub/dashboard/' + AMPD[bf], 'Amplitude, CVR Pacer dashboard (' + BOTF[bf].l + ' bot filter)') + '; the comparison line is the same charts run 364 days back (last year) or 28 days back',
    '🏷️ <b>Sale days:</b> ' + SLK('CBHK9E864', 'promotions'),
    '🚀 <b>Key releases:</b> ' + SLK('C0V4PM9DW', 'released'),
    '🤖 <b>Bot Squad notes:</b> ' + SLK('C095R5DPN3H', 'ask-deap-bot-squad')];
  return '<div class="tipsrcw csrc"><button type="button" class="srcbtn tipsrc" data-tipsrc="1">ⓘ Sources</button><div class="tipsrcbox" hidden><ul class="hul nrul">' + L.map(x => '<li>' + x + '</li>').join('') + '</ul></div></div>';
}
function cvrChartHtml(b) {
  // Prior day or YoY only: a recent-baseline line doesn't read on a 90-day chart (Mike, Oct 26). The other site's line starts off.
  const k = ccmpOf(b), opts = (b === 'tp' ? [['yoy', 'Last year']] : []).concat([['sim', 'DoD'], ['mom', 'MoM']]), on = !state.ccOff, oth = !!state.ccOth, obn = BR[BR[b].other].name, isS = state.ccm === 'sess', mn = isS ? 'sessions' : 'CVR';
  // Each key mark is drawn the way it appears in the chart, so the match is obvious at a glance.
  const mk = inner => '<svg width="26" height="14" viewBox="0 0 26 14" aria-hidden="true">' + inner + '</svg>';
  const contam = SER[b].dates.some(d => isContam(b, d));
  const leg = '<div class="legend ckey">' +
    '<span>' + mk('<line x1="1" y1="7" x2="25" y2="7" style="stroke:' + BR[b].color + ';stroke-width:3;stroke-linecap:round"/>') + '<b>' + BR[b].name + ' ' + mn + '</b></span>' +
    '<span>' + mk('<line x1="1" y1="7" x2="25" y2="7" style="stroke:' + 'var(--muted)' + ';stroke-width:2;stroke-dasharray:4 3"/>') + (k === 'yoy' ? 'Same weekday last year' : k === 'sim' ? 'DoD' : k === 'mom' ? 'MoM' : 'Prior day') + '</span>' + (oth ? '<span>' + mk('<line x1="1" y1="7" x2="25" y2="7" style="stroke:' + BR[BR[b].other].color + ';stroke-width:2;stroke-dasharray:5 3"/>') + obn + ' ' + mn + '</span>' : '') +
    (on && !isS ? '<span>' + mk('<path d="M1 13 L7 7 L13 9 L19 4 L25 6 L25 13 Z" style="fill:var(--sess);opacity:.45"/>') + 'Sessions per day</span>' : '') +
    '<span>' + mk('<rect x="5" y="0" width="16" height="14" rx="2" style="fill:' + BR[b].band + ';stroke:' + BR[b].strip + '"/>') + 'Sale days</span>' +
    (contam ? '<span>' + mk('<rect x="5" y="0" width="16" height="14" rx="2" style="fill:var(--band-x);stroke:var(--faint)"/>') + 'Price test or bot spike</span>' : '') + (botFor(metricsFor(b).overall[0]).length ? '<span>' + mk('<rect x="2" y="5" width="22" height="4" rx="2" style="fill:var(--muted);opacity:.55"/>') + 'Bot Squad note</span>' : '') + (relFor(b).length ? '<span>' + mk('<path d="M13 2.5l4.5 4.5-4.5 4.5-4.5-4.5z" style="fill:var(--ctl)"/>') + 'Key release</span>' : '') + '</div>';
  return '<section class="cvrchart"><div class="cchead"><h2>📈 ' + (isS ? 'Sessions' : 'CVR') + ', last 90 days</h2><div class="ccctl"><div class="seg" role="group" aria-label="Metric">' + [['cvr', 'CVR'], ['sess', 'Sessions']].map(o => '<button type="button" data-ccm="' + o[0] + '" aria-pressed="' + ((isS ? 'sess' : 'cvr') === o[0]) + '">' + o[1] + '</button>').join('') + '</div><div class="seg" role="group" aria-label="Compare with">' + opts.map(o => '<button type="button" data-ccmp="' + o[0] + '" aria-pressed="' + (k === o[0]) + '"' + '' + '>' + o[1] + '</button>').join('') + '</div><button type="button" class="swtog" role="switch" data-ccoth="1" aria-checked="' + oth + '" style="--c:' + BR[BR[b].other].color + '"><span class="trk"><span class="knb"></span></span>' + obn + '</button><button type="button" class="swtog" role="switch" data-ccsess="1" aria-checked="' + (on && !isS) + '"' + (isS ? ' disabled title="The chart already shows sessions"' : '') + '><span class="trk"><span class="knb"></span></span>Sessions</button></div></div>' + leg + '<div class="ccbox"><div class="chart" id="cvrc"></div>' + chartSrc(b) + '</div><p class="cap">' + (k === 'mom' ? 'The 4-weeks-earlier line starts ' + short(SER[b].dates[28] || SER[b].dates[0]) + ': the first 4 weeks have nothing 4 weeks before them in this data. ' : '') + (k === 'sim' ? 'The dotted line is the most recent earlier day of the same kind: the same point in a sale, or the same weekday with no sale. Hover a day to see which. ' : '') + (k === 'yoy' ? 'Last year starts Aug 31: bot-filtered data for 2025 begins Sep 1, 2025. ' + (state.botf === 'max' ? 'Under Maximum, read the last-year line loosely: this year\'s audience shrank sharply from Sep 22. ' : '') : '') + 'Hover for each day. Click a day to jump the page to it.</p></section>'; /* Sources sit inside the chart box, bottom left (Mike, Oct 28) */
}
/* ---------- Bot watch: one line between the stat cards and the 90-day chart (Mike, Oct 26) ---------- */
function botNotesFor(b) { return (typeof BOTN === 'undefined' ? [] : BOTN).filter(e => e.site === b || e.site === 'both').slice().sort((a, z) => z.date < a.date ? -1 : 1); }
function botWatch(b) {
  const d = state.day, all = botNotesFor(b).filter(e => e.date <= d), wk = all.filter(e => (e.end || e.date) >= addDays(d, -7)), set = BOTSET[b] || [], latest = all[0];
  const recent = all.some(e => (e.end || e.date) >= addDays(d, -3)), elev = set.length > 0 || recent;
  const st = '<span class="bwst ' + (elev ? 'elev' : 'calm') + '">' + hint(elev ? 'Elevated' : 'Calm', 'bwsth', elev ? '<b>Elevated</b><br>' + (set.length ? 'Some of today\'s moves look like bot traffic, so they are set aside below instead of named as drivers. ' : '') + (recent ? 'The Bot Squad posted about this site in the last three days.' : '') : '<b>Calm</b><br>No Bot Squad notes for this site in the last three days, and no segment shows the bot pattern (traffic up 50%+ while CVR falls).') + '</span>';
  const lt = latest ? '<span class="bwl">Latest: ' + hint(esc(latest.title), 'bwlh', '<b>' + esc(latest.title) + '</b> (' + short(latest.date) + (latest.end ? ' to ' + short(latest.end) : '') + ')<br>' + esc(latest.note)) + ' <span class="cap">' + short(latest.date) + '</span></span>' : '';
  const sa = set.length ? '<span class="bwset">Set aside as likely bots: ' + set.map((x, k) => hint(esc(inSent(x.m.label, k > 0)), 'bwseg', '<b>' + esc(x.m.label) + ' is not named as a driver</b><br>' + esc(x.why) + '.')).join(', ') + '</span>' : '';
  return '<section class="botwatch" aria-label="Bot watch"><span class="bwh">🤖 Bot watch</span>' + st + lt + sa +
    (all.length ? '<button type="button" class="linkbtn bwall" data-botwatch="' + b + '">' + (wk.length ? wk.length + ' note' + (wk.length > 1 ? 's' : '') + ' this week' : 'All ' + all.length + ' notes') + ' →</button>' : '') + '</section>';
}
/* Likely bots: a second row under Potential drivers, so bot-skewed segments read as "ignore these" at a glance (Mike, Oct 26).
   Set-aside segments are quiet grey items with the reason on hover; the Bot Squad's latest updates sit in one hover at the end. */
// Bots get their own small section between the day summary and the 90-day chart (Mike, Oct 27: less prominent than the headline).
const botSec = b => '<section class="botsec" id="g-bots"><div class="bothead"><h2>🤖 Bot Squad updates</h2>' + (botNotesFor(b).length ? '<button type="button" class="linkbtn bmore" data-botwatch="' + b + '">All bot notes →</button>' : '') + '</div>' + botRow(b) + '</section>';
// The hover on a Bot Squad card: what was found, when, and the thread.
// Design agency, Oct 27: the card already has the bullets, so the hover adds only what the card doesn't say (when, where, what it touches)
// as a short key/value card, plus the thread. No pasted Slack paragraph.
const botTipOf = (e, x) => { if (!e) return x ? '<b>' + esc(x.m.label) + '</b><br>' + esc(x.why) + '.' : '';
  const aff = [...new Set((e.metrics || []).map(k => k === 'overall' ? 'Overall CVR' : k.split('/').pop()))].slice(0, 5).join(', ');
  const kv = [['When', short(e.date) + (e.end ? ' to ' + short(e.end) : ' onward')], ['Site', e.site === 'both' ? 'Both sites' : SITEN(String(e.site || '').toUpperCase())], aff ? ['Affects', aff] : null].filter(Boolean);
  return '<div class="gtipc"><b class="gtt">' + (e.emoji || '🤖') + ' ' + esc(e.short || e.title) + '</b><div class="gkv">' + kv.map(r => '<span class="gk">' + r[0] + '</span><span class="gv">' + esc(r[1]) + '</span>').join('') + '</div>' + (e.link ? '<a class="segmore" href="' + esc(e.link) + '" target="_blank" rel="noopener">Open the Bot Squad thread ↗</a>' : '') + '</div>'; };
function botRow(b, flat) {
  // A short bot report in plain words (Mike, Oct 26): what looks skewed today, then what the Bot Squad found or changed this week.
  // Only the key words hover (each with a small tip); the full notes sit behind "More info".
  const d = state.day, set = BOTSET[b] || [], upto = d === D.asOf ? addDays(d, 2) : d, comps = compsFor(b, d);
  const recent = botNotesFor(b).filter(e => e.brief && e.date <= upto && (e.end || e.date) >= addDays(d, -7)).slice(0, 2), lines = [];
  // Regions keep their capitals; devices, channels and funnel steps are lowercase mid-sentence ("direct", "desktop").
  const nm = (x, first) => { const l = x.m.label.replace(/\s*\(.*\)$/, ''); return first || x.m.sec === 'geo' ? l.charAt(0).toUpperCase() + l.slice(1) : l.charAt(0).toLowerCase() + l.slice(1); };
  // Two kinds of set-aside, said differently: a traffic spike shows its session jump; a Bot Squad flag says who flagged it.
  const join = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0];
  const tip = x => { const c = cellsFor(x.m, d, comps); return '<b>' + esc(x.m.label) + '</b><br>' + esc(x.why) + '.' + (c.sessBs != null ? '<br>Sessions ' + sgn(c.sessBs, 0) + ' and CVR ' + sgn(c.bs, 0) + ' vs comparable days.' : ''); };
  const spikes = set.filter(x => !/^Bot Squad/.test(x.why)), flagged = set.filter(x => /^Bot Squad/.test(x.why));
  // Bullets, emoji + bold label + colon (Mike, Oct 27: easier to read than sentences).
  // Cards, not lines (design agency, Oct 27): an emoji in a soft circle, a bold title, one short sentence. Today's set-asides carry an amber edge.
  // {word|tip} in a brief becomes a hoverable word.
  const brief = t => esc(t).replace(/\{([^|}]+)\|([^}]+)\}/g, (_, w, tip) => hint(w, 'brl', tip));
  // One card per finding, each point its own bullet (Mike, Oct 27). A segment set aside today absorbs the Bot Squad note about it, so the two never repeat.
  const segs = (a, mid) => join(a.map((x, k) => hint(esc(nm(x, !mid && k === 0).replace(/^usa$/i, 'USA')), 'brl', tip(x))));
  const used = new Set();
  const noteFor = x => recent.find(e => botHas(e, x.m.key) && e.metrics.length && !used.has(e));
  const stat = x => { const c = cellsFor(x.m, d, comps); return c.sessBs != null ? esc(ucf(nm(x, true))) + ' visits are ' + sgn(c.sessBs, 0) + ' vs comparable days' + (c.bs != null ? ', CVR ' + sgn(c.bs, 0) : '') + '.' : ''; };
  if (spikes.length) lines.push({ e: '📈', t: 'Likely bot traffic on ' + segs(spikes, true), pts: spikes.map(stat).filter(Boolean).concat(['Visits jumped while CVR fell, the pattern bots leave.', 'Not counted as a reason CVR moved today.']), k: 'now', tip: spikes.map(tip).join('<br><br>') });
  flagged.forEach(x => { const n = noteFor(x); if (n) used.add(n);
    const cx = cellsFor(x.m, d, comps), up = cx.sessBs != null && cx.sessBs > 0;
    lines.push({ e: n && n.emoji || '🚩', t: (up ? 'More bot traffic on ' : 'Bots still in ') + segs([x], true) + (up ? '' : ' traffic'), pts: [up ? stat(x) : ''].concat(n && n.pts ? n.pts.map(brief) : n ? [brief(n.brief || n.sum)] : []).concat(['Not counted as a reason CVR moved today.']).filter(Boolean), k: 'now', tip: botTipOf(n, x) }); });
  recent.filter(e => !used.has(e)).forEach(e => lines.push({ e: e.emoji || '🤖', t: esc(e.short || 'Latest finding'), pts: e.pts ? e.pts.map(brief) : [brief(e.brief)], k: e.tone === 'good' || e.bot === false ? 'ok' : '', tip: botTipOf(e) }));
  if (!lines.length) lines.push({ e: '✅', t: 'All clear', pts: ['Nothing bot-related flagged this week.'], k: 'ok', tip: '<b>All clear</b><br>No Bot Squad findings for this site in the last week, and no segment looks skewed today.' });
  const more = botNotesFor(b).length ? ' <button type="button" class="linkbtn bmore" data-botwatch="' + b + '">More info →</button>' : '';
  // One or two sentences, not bullets (Mike, Oct 26).
  const tn = l => l.k === 'now' ? 'bad' : l.k === 'ok' ? 'good' : 'warn';
  const card = l => hint('<article class="scard ' + tn(l) + '"><div class="schd"><h4><span class="scic" aria-hidden="true">' + l.e + '</span><span>' + l.t + '</span></h4><span class="sctags"><span class="stat-chip ' + tn(l) + '">' + (l.k === 'now' ? 'Handling' : l.k === 'ok' ? 'All clear' : 'Update') + '</span><span class="scmeta">' + BR[b].name + '</span></span></div><ul class="botpts">' + l.pts.slice(0, 2).map(p => '<li>' + p + '</li>').join('') + '</ul></article>', 'botcard2' + (l.k ? ' ' + l.k : ''), l.tip || '');
  if (flat) return lines.slice(0, 3).map(card).join('');
  return '<div class="botgrid">' + lines.slice(0, 3).map(l => hint((l.k === 'now' ? '<b class="botalert" aria-label="Needs attention">!</b>' : '') + '<span class="bote" aria-hidden="true">' + l.e + '</span><span class="botbody"><b class="bott">' + l.t + '</b><ul class="botpts">' + l.pts.map(p => '<li>' + p + '</li>').join('') + '</ul></span>', 'botcard' + (l.k ? ' ' + l.k : ''), l.tip || '')).join('') + '</div>';
}
function botWatchModal(b) {
  // Scannable at a glance: emoji + short title, one sentence, a quiet Slack link (Mike, Oct 26).
  const all = botNotesFor(b).filter(e => e.date <= addDays(D.asOf, 2));
  const row = e => '<li><span class="bnd">' + short(e.date) + (e.end ? '–' + short(e.end) : '') + '</span><div><b>' + (e.emoji || bIcon(e)) + ' ' + esc(e.short || e.title) + ':</b> ' + esc(e.sum || e.note) + (e.link ? ' <a href="' + esc(e.link) + '" target="_blank" rel="noopener">Slack ↗</a>' : '') + '</div></li>';
  openModal('<div class="mhead"><h3 id="mtitle">🤖 Bot watch: ' + BR[b].name + '</h3></div><p class="cap">From the Bot Squad, newest first.</p><div class="botnotes bwlist"><ul>' + all.map(row).join('') + '</ul></div>');
}
function paint() {
  const b = state.tab;
  HINTS = []; hideHint();
  MOVED = movedFor(b, state.day); LIFTS = liftsFor(b, state.day); ALERTS = alertsFor(b, state.day);
  $('#main').innerHTML = topHtml(b) + cvrChartHtml(b) + '<section>' + payHtml(b) + '</section>' + scoreHtml(b); // What people are saying lives on the Trending tab only (Mike, Oct 26)
  drawOpenCharts();
}
// The sale pill lives next to the logo on every page (Mike, Oct 28): the selected day's sale on the CVR pages, today's for both sites elsewhere.
// The sale pill: the sale on the day the dashboard is reading, for both sites. On the CVR tabs it sits above the headline; elsewhere in the header (Mike, Oct 28).
function salePill() {
  const iso = state.day || D.asOf, sites = ['tp', 'rb'].map(b => ({ b, st: infoNow(b, iso), tr: tierOf(b, iso) })).filter(x => x.st.sale);
  if (!sites.length) return '<span class="hsale off"><span class="hsdate">' + short(iso) + '</span>No sale</span>';
  const offer = sites.every(x => x.tr === sites[0].tr) && sites[0].tr ? 'Up to ' + sites[0].tr + '% off' : sites.map(x => BR[x.b].abbr + (x.tr ? ' up to ' + x.tr + '%' : ' sale')).join(' · ');
  const day = x => { const dots = Array.from({ length: Math.min(x.st.len, 10) }, (_, k) => '<i class="' + (k < x.st.pos ? 'on' : '') + '"></i>').join(''); return '<span class="hsd">' + (sites.length > 1 ? '<b>' + BR[x.b].abbr + '</b> ' : '') + 'Day ' + x.st.pos + ' of ' + x.st.len + '<span class="hsdots" aria-hidden="true">' + dots + '</span></span>'; };
  return '<span class="hsale" title="The sale on ' + esc(label(iso)) + ', the day this dashboard is reading"><span class="hsk">Sale</span><span class="hsv">' + offer + '<span class="hsdate">' + short(iso) + '</span></span>' + sites.map(day).join('') + '</span>';
}
function saleHdr() {
  let el = document.getElementById('hsale'); if (!el) { el = document.createElement('span'); el.id = 'hsale'; const br = document.getElementById('brand'); if (br) br.insertAdjacentElement('afterend', el); }
  el.innerHTML = ''; el.hidden = true; // no header sale pill on any page: the CVR tabs show it above the H1 (Mike, Oct 30)
}
function render() {
  const b = state.tab;
  try { saleHdr(); } catch (e) {}
  try { localStorage.setItem('pod.lastv', state.view === 'daily' ? b : state.view); history.replaceState(null, '', '#' + viewToken()); } catch (e) {}
  document.documentElement.dataset.brand = state.view !== 'daily' || b === 'ds' ? 'art' : b === 'rb' ? 'rb' : 'tp';
  document.documentElement.style.setProperty('--accent', state.view !== 'daily' ? 'var(--art)' : b === 'rb' ? 'var(--rb)' : b === 'ds' ? 'var(--ds)' : 'var(--tp)');
  const dv = state.view === 'daily';
  const sec = { daily: ['pacer', 'CVR Pacer'], tests: ['tests', 'A/B tests'], soon: ['soon', 'Roadmap'], impact: ['soon', 'Recent impact'], trending: ['trend', 'Trending at Articore'], standup: ['standup', 'Daily peak standup'] }[state.view], cvr = dv && b !== 'ds';
 $('#ticker').hidden = TKOFF;
  if (!$('#ticker').innerHTML) { $('#ticker').innerHTML = tickerHtml(); $('#ticker').querySelectorAll('.tkdup button').forEach(x => x.tabIndex = -1); const tr = $('#ticker .tk-track'); if (tr) tr.style.animationDelay = '-' + Math.round(Math.random() * 90) + 's'; }
  document.documentElement.dataset.sect = dv ? b : state.view;
  const now = parse(D.asOf) + DAY, BF = Date.UTC(2026, 10, 27), dleft = t => Math.max(0, Math.round((t - now) / DAY));
  // A ticking countdown (Mike, Oct 27): days, hours, minutes, seconds to the code freeze (Sep and Oct), then to Black Friday. Midnight ET.
  const tgt = now <= FREEZE && new Date(now).getUTCMonth() >= 8 ? [Date.UTC(2026, 10, 20, 5), '🧊 Code freeze', 'Nov 20'] : now <= BF ? [Date.UTC(2026, 10, 27, 5), '🛍️ Black Friday', 'Nov 27'] : null;
  const cd = tgt ? '<div class="cdbox"><b class="cdt">' + tgt[1] + '</b><span class="cdclock" data-to="' + tgt[0] + '"></span><span class="cap">' + tgt[2] + '</span></div>' : '';
  // A catchier countdown (Mike, Oct 27): an emoji, the event, then ticking digit tiles.
  const frz = tgt && tgt[1].indexOf('freeze') >= 0;
  CDTOP = tgt ? '<span class="cdtop' + (frz ? ' frz' : ' bf') + '" title="' + (frz ? 'Code freeze' : 'Black Friday') + ', ' + tgt[2] + ' (midnight ET)"><span class="cdl">' + (frz ? '🚨 Code freeze in' : '🚨 Black Friday in') + '</span><span class="cdlive" data-to="' + tgt[0] + '"></span></span>' : '';
  const vt = (v, l) => '<button class="vtab" role="tab" aria-selected="' + (state.view === v) + '" data-view="' + v + '">' + l + '</button>';
  $('#tabs').innerHTML = '<span class="ngrp"><span class="nlbl" aria-hidden="true">CVR</span>' + [['rb', 'Redbubble', 'var(--rb)'], ['tp', 'TeePublic', 'var(--tp)']].map(t =>
    '<button role="tab" aria-selected="' + (dv && b === t[0]) + '" data-tab="' + t[0] + '" style="--c:' + t[2] + '"><i></i>' + t[1] + '</button>').join('') + '</span>' +
    '<span class="ngrp"><span class="nlbl" aria-hidden="true">Work</span>' + vt('soon', '🗺️ Roadmap') + vt('tests', '🧪 A/B tests') + vt('impact', '🚀 Recent impact') + '</span>' +
    '<span class="ngrp">' + vt('trending', '🔥 Trending at Articore') + '</span>' +
    // Daily peak standup tab retired Oct 22 (standupHtml and its data are kept; add this back to restore it):
    // + '<span class="ngrp">' + vt('standup', '📋 Daily peak standup') + '</span>'
    '';
  setTimeout(() => { movePill(); setBarH(); segPills(); }, 0);
  // Clicking the logo goes home: the Redbubble CVR page.
  const br = $('#brand'); if (br && !br.dataset.tab) { br.dataset.tab = 'rb'; br.setAttribute('role', 'link'); br.setAttribute('tabindex', '0'); br.setAttribute('title', 'Back to Redbubble CVR'); }
  if (!$('#brand').innerHTML) $('#brand').innerHTML = '<svg class="slogo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="40" height="40" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#14202e"/><rect x="7" y="17" width="4.6" height="8" rx="1.6" fill="#34465a"/><rect x="13.7" y="12" width="4.6" height="13" rx="1.6" fill="#34465a"/><rect x="20.4" y="7" width="4.6" height="18" rx="1.6" fill="#4fd18b"/></svg>' + '<span class="bstack"><span class="beyebrow">Articore</span><span class="btitle">Product Org Dashboard</span></span>';
  $('#meta').innerHTML = 
    (TKOFF ? '<button type="button" class="tkshow" data-act="ticker" title="Show the headline ticker"><span class="tkdot" aria-hidden="true"></span>Show today\'s headlines</button>' : '');
  $('#meta').insertAdjacentHTML('beforeend', '<span class="util' + (CDTOP ? ' quiet' : '') + '">' + '<div class="about"><button type="button" class="linkbtn" id="aboutbtn" aria-haspopup="true" aria-expanded="false">' + '<svg class="abico" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><ellipse cx="8" cy="3.6" rx="5.5" ry="2.1" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 3.6v8.8c0 1.2 2.5 2.1 5.5 2.1s5.5-.9 5.5-2.1V3.6M2.5 8c0 1.2 2.5 2.1 5.5 2.1s5.5-.9 5.5-2.1" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>About this data' + ' <span aria-hidden="true">▾</span></button><div class="amenu" id="amenu" hidden role="menu">' + srcMenu(cvr) + '</div></div>' + (CDTOP || '') + hint('↻ <span class="rfll">Last refreshed </span><b>' + esc(REFRESH.last) + '</b>', 'rfl rflnav', '<b class="tiph nosrc">How often this page refreshes</b><ul class="hul nrul"><li>🔄 <b>Three times a day:</b> about 8:30 AM, 2:30 PM and 4:30 PM ET</li><li>🌅 <b>8:30 AM:</b> yesterday\'s full numbers and overnight Slack</li><li>📣 <b>2:30 PM:</b> fresh for the daily peak standup</li><li>🗺️ <b>Before each exec roadmap review:</b> a full refresh 30 minutes ahead (Tuesdays, every two weeks)</li><li>📅 <b>Numbers cover full days:</b> the CVR pages show yesterday at the latest</li></ul>') /* how often it refreshes, on hover (Mike, Oct 28) */  + '</span>')
  tickCD(); // fill the countdown tiles right away, so it never flashes empty between tab clicks (Mike, Oct 27)
  const main = $('#main');
  if (state.view !== 'daily') { HINTS = []; hideHint(); main.innerHTML = state.view === 'tests' ? testsHtml() : state.view === 'impact' ? impactHtml() : state.view === 'soon' ? comingHtml() : state.view === 'trending' ? trendingHtml() : standupHtml(); return; }
  if (b === 'ds') { HINTS = []; hideHint(); main.innerHTML = dasheryHtml(); return; }
  if (b === 'app') { main.innerHTML = '<div class="empty"><b>Redbubble app is not in Amplitude yet</b>App CVR lives in the app metrics sheet, fed weekly from BigQuery. When app events land in Amplitude, this tab gets the same scorecard as the other two.</div>'; return; }
  paint();
}
function renderKeep() { const y = window.scrollY; render(); window.scrollTo(0, y); }
function setDay(d) { if (SER.tp.idx[d] === undefined || d > D.asOf || d < LEDGER_START) return; state.popMon = null; state.day = d; state.days[state.tab] = d; renderKeep(); }

// The hover box stays open while the mouse travels from the number into it, so its switches can be used (Mike, Oct 25).
let hintT = null, hintSrc = null;
const inHintBox = el => !!(el && el.closest && el.closest('#hintbox'));
const hintLater = () => { clearTimeout(hintT); hintT = setTimeout(() => { if (!pinned) hideHint(); }, 220); };
document.addEventListener('pointerover', ev => { const h = ev.target.closest && ev.target.closest('.hint, .mv[data-hint]'); if (h || inHintBox(ev.target)) clearTimeout(hintT); if (h && !pinned && h !== hintSrc) { hintSrc = h; showHint(h); } });
document.addEventListener('pointerout', ev => { if (pinned) return; const h = ev.target.closest && ev.target.closest('.hint, .mv[data-hint]'), to = ev.relatedTarget; if ((h || inHintBox(ev.target)) && !inHintBox(to) && !(to && to.closest && to.closest('.hint') === hintSrc)) hintLater(); });
document.addEventListener('focusin', ev => { const h = ev.target.closest && ev.target.closest('.hint, .mv[data-hint]'); if (h && !pinned) showHint(h); });
document.addEventListener('focusout', ev => { const h = ev.target.closest && ev.target.closest('.hint, .mv[data-hint]'); if (h && !pinned) hideHint(); });
document.addEventListener('click', ev => {
  const t = ev.target;
  const so = t.closest('[data-absort]'); if (so) { const k = so.dataset.absort, S = state.abSort || { k: 'days', dir: 1 }; state.abSort = S.k === k ? { k, dir: -S.dir } : { k, dir: k === 'cvr' || k === 'rpu' || k === 'sig' ? -1 : 1 }; return renderKeep(); }
  const tsb = t.closest('[data-tipsrc]'); if (tsb) { ev.stopImmediatePropagation(); ev.preventDefault(); const w = tsb.closest('.tipsrcw'), bx = w && w.querySelector('.tipsrcbox'); if (bx) { bx.hidden = !bx.hidden; tsb.setAttribute('aria-expanded', String(!bx.hidden)); } pinned = pinned || $('#hintbox'); const hb = $('#hintbox'), r = hb.getBoundingClientRect(); if (r.bottom > innerHeight - 8) hb.style.top = Math.max(8, innerHeight - 8 - r.height) + 'px'; return; }
  const jsx = t.closest('[data-jumpsec]'); if (jsx) { if (typeof hideHint === 'function') hideHint(); const el = document.getElementById('g-' + jsx.dataset.jumpsec); if (el) { const bar = document.querySelector('.bar'); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (bar ? bar.offsetHeight : 60) - 80, behavior: 'smooth' }); } return; }
  const ddo = t.closest('[data-ddopen]'); if (ddo) { const m = document.querySelector('[data-ddmenu="' + ddo.dataset.ddopen + '"]'), was = m.hidden; document.querySelectorAll('.ddmenu').forEach(x => { x.hidden = true; }); m.hidden = !was; ddo.setAttribute('aria-expanded', String(was)); state.ddOpen = was ? ddo.dataset.ddopen : null; return; }
  const sbx = t.closest('[data-srcbox]'); if (sbx) { ev.stopPropagation(); return srcBox(sbx.dataset.srcbox); }
  const tsl = t.closest('[data-tmsel]'); if (tsl) { const v = tsl.dataset.tmsel; state.teams = !v ? [] : (state.teams || []).indexOf(v) >= 0 ? state.teams.filter(x => x !== v) : (state.teams || []).concat(v); state.ddOpen = tsl.closest('.ddmenu') ? 'team' : null; return renderKeep(); }
  const ssl = t.closest('[data-ssel]'); if (ssl) { const v = ssl.dataset.ssel; state.sites = (state.sites || []).indexOf(v) >= 0 ? state.sites.filter(x => x !== v) : (state.sites || []).concat(v); return renderKeep(); }
  const psl = t.closest('[data-psel]'); if (psl) { const v = psl.dataset.psel; state.pms = (state.pms || []).indexOf(v) >= 0 ? state.pms.filter(x => x !== v) : (state.pms || []).concat(v); return renderKeep(); }
  const gsl = t.closest('[data-gsel]'); if (gsl) { const v = gsl.dataset.gsel; state.goals = !v ? [] : (state.goals || []).indexOf(v) >= 0 ? state.goals.filter(x => x !== v) : (state.goals || []).concat(v); state.ddOpen = gsl.closest('.ddmenu') ? 'goal' : null; return renderKeep(); }
  const vsl = t.closest('[data-vsel]'); if (vsl) { const v = vsl.dataset.vsel; state.views = !v ? [] : (state.views || []).indexOf(v) >= 0 ? state.views.filter(x => x !== v) : (state.views || []).concat(v); state.ddOpen = vsl.closest('.ddmenu') ? 'view' : null; return renderKeep(); }
  if (t.closest('[data-rmrisk]')) { state.views = ['risk']; state.ddOpen = null; renderKeep(); const g = document.querySelector('.rmgrp, .rmhead'); if (g) g.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
  if (t.closest('[data-saymore]')) { state.sayAll = true; return renderKeep(); }
  if (t.closest('[data-fclear2]')) { state.teams = []; state.views = []; state.goals = []; state.sites = []; state.pms = []; state.ddOpen = null; return renderKeep(); }
  if (!t.closest('.ddmenu')) { state.ddOpen = null; document.querySelectorAll('.ddmenu').forEach(x => { x.hidden = true; }); }
  if (t.closest('[data-qopen]')) { state.qOpen = true; renderKeep(); const n = document.querySelector('[data-fq]'); if (n) n.focus(); return; }
  if (t.closest('[data-qclose]')) { state.qOpen = false; state.q = ''; return renderKeep(); }
  if (t.closest('[data-rmwide]')) { state.rmScope = state.rmScope === 'all' ? 'now' : 'all'; return renderKeep(); }
  const ak = t.closest('[data-ack]'); if (ak) { ev.stopPropagation(); hideHint(); if (!canAck()) return; const prev = typeof COMING_PREV !== 'undefined' ? COMING_PREV : null, it = [].concat(...COMING.teams.map(x => x.items || [])).find(x => x.t === ak.dataset.ack); if (!it || !prev) return; const id = ackId(it.t), doc = { t: it.t, sig: chgSig(it, prev), on: !isRev(it, prev), at: Date.now(), by: RT.me }; ACK[id] = doc; renderKeep(); RT.db.collection('acks').doc(id).set(doc).catch(() => { delete ACK[id]; renderKeep(); }); return; }
  const gfd = t.closest('[data-gfold]'); if (gfd) { state.gOpen = state.gOpen || {}; state.gOpen[gfd.dataset.gfold] = gfd.getAttribute('aria-expanded') !== 'true'; return renderKeep(); }
  const hmo = t.closest('[data-hmore]'); if (hmo) { const o = hmo.previousElementSibling, open = o.classList.toggle('open'); hmo.textContent = open ? 'Show fewer' : 'Show ' + o.querySelectorAll('.hx').length + ' more'; return; }
  const gmo = t.closest('[data-gmore]'); if (gmo) { const c = gmo.parentElement.querySelector('.gchips'); const shut = c.classList.toggle('clamp'); gmo.textContent = shut ? 'See more' : 'Hide'; return; }
  const ggp = t.closest('[data-ggroup]'); if (ggp) { state.gGroup = ggp.dataset.ggroup; return renderKeep(); }
  const rvw = t.closest('[data-rmview]'); if (rvw) { state.rmGantt = rvw.dataset.rmview === 'gantt'; return renderKeep(); }
  const tsp = t.closest('[data-tsortpick]'); if (tsp) { const k = tsp.dataset.tsortpick; state.tsort = k ? { k, dir: k === 's' ? -1 : 1 } : null; state.ddOpen = null; return renderKeep(); }
  const tso = t.closest('[data-tsort]'); if (tso) { const key = tso.dataset.tsort; state.tsort = !key ? null : state.tsort && state.tsort.k === key ? { k: key, dir: -state.tsort.dir } : { k: key, dir: 1 }; return renderKeep(); }
  const dsc = t.closest('[data-disc]'); if (dsc) { hideHint(); state.disc = dsc.dataset.disc || null; return renderKeep(); }
  const dop = t.closest('[data-dayopen]'); if (dop) { state.dayOpen = !state.dayOpen; const p = document.querySelector('.daypop'); if (p) p.hidden = !state.dayOpen; dop.setAttribute('aria-expanded', String(!!state.dayOpen)); return; }
  if (state.dayOpen && !t.closest('.daypop') && !t.closest('#hintbox') && !t.closest('.modal')) { state.dayOpen = false; const p = document.querySelector('.daypop'); if (p) p.hidden = true; }
  const bfo = t.closest('[data-botf]'); if (bfo) { ev.stopPropagation(); hideHint(); try { localStorage.setItem('pod.botf', bfo.dataset.botf); } catch (e) {} applyBotFilter(bfo.dataset.botf);
    // The ticker's numbers change with the filter, so it's rebuilt, but it keeps scrolling from the same spot (Mike, Oct 26: never jump).
    const otr = $('#ticker .tk-track'), tkd = otr ? otr.style.animationDelay : '', tka = otr && otr.getAnimations()[0], tkt = tka ? tka.currentTime : null;
    $('#ticker').innerHTML = ''; renderKeep();
    const ntr = $('#ticker .tk-track'); if (ntr) { ntr.style.animationDelay = tkd; const nka = ntr.getAnimations()[0]; if (nka && tkt != null) nka.currentTime = tkt; }
    return; }
  const bwo = t.closest('[data-botwatch]'); if (bwo) return botWatchModal(bwo.dataset.botwatch);
  const kct = t.closest('[data-kctip]'); if (kct) { ev.stopPropagation(); const [kb, kd, kk, km, ko] = kct.dataset.kctip.split('|'), hb = document.getElementById('hintbox'); if (ko) { state.tipOther = !state.tipOther; try { localStorage.setItem('pod.tipo', state.tipOther ? '1' : ''); } catch (e) {} } if (hb) hb.innerHTML = cmpTip(kb, kd, kk, km); return; }
  const ht = t.closest('.hint');
  // A hover-able name that also links (segLink) jumps on click instead of pinning its tip (Mike, Oct 27).
  if (ht && ht.dataset.watch) { hideHint(); const [wb, wk] = ht.dataset.watch.split('|'); state.view = 'daily'; state.tab = wb; state.open.add(wk); render(); const el = document.querySelector('[data-row="' + CSS.escape(wk) + '"]'); if (el) { window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 110 }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 2600); } return; }
  // A hover that is also a link (project, test or topic named in a page headline) opens it on click instead of pinning.
  if (ht && (ht.dataset.moved != null || ht.dataset.lift != null)) hideHint();
  else if (ht && (ht.dataset.lbm2 || ht.dataset.jt || ht.dataset.say || ht.dataset.told || ht.dataset.watch || ht.dataset.goto || ht.dataset.view)) hideHint();
  else if (ht) { ev.stopPropagation(); if (pinned === ht) { hideHint(); } else { showHint(ht); pinned = ht; } return; }
  if (pinned && !t.closest('#hintbox')) hideHint();
  if (t.closest('.mclose') || t.id === 'modal') return closeModal();
  const tab = t.closest('[data-tab]'); if (tab) { if (state.tab === 'tp' || state.tab === 'rb') state.days[state.tab] = state.day; state.tab = tab.dataset.tab; state.day = state.days[state.tab] || D.asOf; state.view = 'daily'; state.cmpEdit = false; state.open.clear(); state.full.clear(); state.payChart = false; window.scrollTo(0, 0); return navRender(tab); }
  if (t.closest('#guide')) return guideModal();
  if (t.closest('#refresh')) return refreshModal();
  if (t.closest('#salecal')) { state.calSite = null; state.calDay = null; return saleCalModal(); }
  const cs = t.closest('[data-calsite]'); if (cs) { state.calSite = cs.dataset.calsite; return saleCalModal(); }
  const cdy = t.closest('[data-calday]'); if (cdy) { state.calDay = cdy.dataset.calday; return saleCalModal(); }
  const tx = t.closest('[data-teamx]'); if (tx) { const k = 'team:' + tx.dataset.teamx; state.open.has(k) ? state.open.delete(k) : state.open.add(k); return renderKeep(); }
  if (t.closest('#cmpedit')) { state.cmpEdit = !state.cmpEdit; return renderKeep(); }
  if (t.closest('#cmpreset')) { state.cust[state.tab] = null; state.cmpEdit = false; return renderKeep(); }
  if (t.closest('#cmpapply')) { let a = $('#cfrom').value, z = $('#cto').value; if (!a || !z) return; if (a > z) [a, z] = [z, a]; state.cust[state.tab] = { from: a, to: z }; state.cmpEdit = false; return renderKeep(); }
  const dt = t.closest('[data-deftog]'); if (dt) { const k = dt.dataset.deftog; state.defOn.has(k) ? state.defOn.delete(k) : state.defOn.add(k); return renderKeep(); }
  const ccm = t.closest('[data-ccmp]'); if (ccm) { state.ccmp = ccm.dataset.ccmp; return renderKeep(); }
  if (t.closest('[data-ccoth]')) { state.ccOth = !state.ccOth; try { localStorage.setItem('pod.ccoth2', state.ccOth ? 'on' : ''); } catch (e) {} return renderKeep(); }
  const ccmm = t.closest('[data-ccm]'); if (ccmm) { state.ccm = ccmm.dataset.ccm; return renderKeep(); }
  if (t.closest('[data-ccsess]')) { state.ccOff = !state.ccOff; return renderKeep(); }
  const stg = t.closest('[data-sesstog]'); if (stg) { const k = stg.dataset.sesstog; state.sessOff.has(k) ? state.sessOff.delete(k) : state.sessOff.add(k); return renderKeep(); }
  const vw = t.closest('[data-view]'); if (vw) { state.view = vw.dataset.view; window.scrollTo(0, 0); try { history.replaceState(null, '', '#' + (state.view === 'daily' ? state.tab : state.view)); } catch (e) { /* ignore */ } return navRender(vw); }
  const tk = t.closest('[data-tick]'); if (tk && TKSH && RT.db) { const [dt, k] = tk.dataset.tick.split(':'), cur = Object.assign({}, SHT[dt] || {}); cur['k' + k] = !cur['k' + k]; SHT[dt] = cur; renderKeep(); RT.db.collection('ticks').doc(dt).set(cur).catch(() => { TKSH = false; renderKeep(); }); return; }
  if (tk) { const k = tk.dataset.tick; TICKS.has(k) ? TICKS.delete(k) : TICKS.add(k); try { localStorage.setItem('pod.ticks', JSON.stringify([...TICKS])); } catch (e) { /* ignore */ } return renderKeep(); }
  const gt = t.closest('[data-goto]'); if (gt) { let [v, sel] = gt.dataset.goto.split('|'); if (v === 'standuplast') { v = 'standup'; state.su = 'last'; state.view = ''; } if (state.view !== v) { state.view = v; render(); } const el = document.querySelector(sel); if (el) { window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 110 }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 2600); } return; }
  const jt = t.closest('[data-jt]'); if (jt) { if (state.view !== 'tests') { state.view = 'tests'; render(); } return testDetailModal(jt.dataset.jt); }
  const bw = t.closest('[data-basewhy]'); if (bw) return baseModal(bw.dataset.basewhy);
  const js = t.closest('[data-js]'); if (js) { closeModal(); state.view = 'soon'; state.fteam = js.dataset.js; render(); window.scrollTo({ top: 0 }); const el = document.querySelector('.tmpick [aria-selected="true"]'); if (el) { el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 2600); } return; }
  const rd = t.closest('[data-rtdel]'); if (rd) { rtSave(myItems().filter(x => String(x.at) !== rd.dataset.rtdel)); return; }
  if (t.closest('[data-mvmore]')) { state.mvAll = !state.mvAll; return renderKeep(); }
  const flb = t.closest('[data-flag]'); if (flb) { ev.stopPropagation(); hideHint(); return flagModal(flb.dataset.flag); }
  const fdl = t.closest('[data-flagdel]'); if (fdl) return flagSave(fdl.dataset.flagdel, null);
  const io = t.closest('[data-imp]'); if (io) return impModal(+io.dataset.imp);
  const sy = t.closest('[data-say]'); if (sy && !t.closest('a, button')) return sayModal(+sy.dataset.say);
  if (t.closest('[data-suall]')) { state.suAll = !state.suAll; return renderKeep(); }
  const su = t.closest('[data-su]'); if (su) { state.su = su.dataset.su; return renderKeep(); }
  const cd = t.closest('[data-card]'); if (cd) return cardModal(+cd.dataset.card);
  const mvb = t.closest('[data-mv]'); if (mvb) { ev.stopPropagation(); const p = mvb.dataset.mv.split('|'); moveItem(p[0] + '|' + p[1], +p[2]); return; }
  if (t.closest('[data-reord]')) { state.reord = !state.reord; return renderKeep(); }
  const ph = t.closest('[data-phase]'); if (ph) { state.phase = ph.dataset.phase; return renderKeep(); }
  const tsn = t.closest('[data-tsoon]'); if (tsn && !t.closest('a')) return testModal('soon', tsn.dataset.tsoon);
  const tol = t.closest('[data-told]'); if (tol && !t.closest('a')) return testModal('old', tol.dataset.told);
  if (t.closest('a.uxl')) return; // the UX link opens Figma, not the project pop-up
  const l2 = t.closest('[data-lbm2]'); if (l2) { if (state.reord) return; return lbModal2(l2.dataset.lbm2); }
  if (t.closest('[data-fclear]')) { state.obj = 'all'; state.fteam = 'all'; state.prog = 'all'; state.q = ''; return renderKeep(); }
  const fb = t.closest('[data-f]'); if (fb) { const [k, v] = fb.dataset.f.split('|'); state[k] = v; return renderKeep(); }
  const lm = t.closest('[data-lbm]'); if (lm) { const [sc, i] = lm.dataset.lbm.split('|'); return lbModal(sc, +i); }
  const tm = t.closest('[data-tm]'); if (tm) { const k = 'tm:' + tm.dataset.tm; state.open.has(k) ? state.open.delete(k) : state.open.add(k); return renderKeep(); }
  const ma = t.closest('[data-act]'); if (ma) { if ($('#amenu')) $('#amenu').hidden = true; const a = ma.dataset.act; if (a === 'drivers') return openModal('<div class="mhead"><h3 id="mtitle">📉 How drivers are picked</h3></div><div class="pbox"><p>A device, region, channel or funnel step only shows under the headline when it moved clearly differently from the rest of its group: about 8 or more points worse (or better) than its peers on the same comparison. Moving with everyone else does not count; if nothing stands out, the move is broad-based.</p><p><b>Red</b> pills are the biggest drags on total CVR, weighted by how much traffic each carries. <b>Yellow</b> ones are smaller. <b>Green</b> ones lifted CVR on an up day.</p><p>Each pill shows the segment\'s change and, in grey, its peers\' change. Click one for the full read.</p></div>'); if (a === 'ticker') { TKOFF = !TKOFF; try { localStorage.setItem('pod.tk9', TKOFF ? 'off' : 'on'); } catch (e) { /* ignore */ } renderKeep(); if (!TKOFF) { const tk = $('#ticker'); tk.classList.remove('reveal'); void tk.offsetWidth; tk.classList.add('reveal'); } setBarH(); return; }
    if (a === 'guide') return guideModal(); if (a === 'refresh') return refreshModal(); state.view = a === 'tp' || a === 'rb' ? 'daily' : a; if (state.view === 'daily') state.tab = a; window.scrollTo(0, 0); try { history.replaceState(null, '', '#' + (state.view === 'daily' ? state.tab : state.view)); } catch (e) { /* ignore */ } return render(); }
  if (t.closest('#aboutbtn')) { const m = $('#amenu'); m.hidden = !m.hidden; $('#aboutbtn').setAttribute('aria-expanded', String(!m.hidden)); return; }
  if (!t.closest('#amenu') && $('#amenu')) $('#amenu').hidden = true;
  const wt = t.closest('[data-watch]'); if (wt) { const [wb, wk] = wt.dataset.watch.split('|'); state.view = 'daily'; state.tab = wb; if (wk !== 'pay') state.open.add(wk); render(); const el = wk === 'pay' ? document.getElementById('g-pay') : document.querySelector('[data-row="' + CSS.escape(wk) + '"]'); if (el) { window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 110 }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 2600); } return; }
  const abs = t.closest('[data-absite]'); if (abs) { const v = abs.dataset.absite; state.abSite = abs.classList.contains('sitepill') && state.abSite === v ? 'both' : v; return renderKeep(); }
  const tpx = t.closest('[data-tpx]'); if (tpx) return tpDetailModal(+tpx.dataset.tpx);
  const xr = t.closest('[data-xrow]'); if (xr) return testDetailModal(xr.dataset.xrow);
  const why = t.closest('[data-why]'); if (why) { ev.stopPropagation(); return whyModal(why.dataset.why); }
  const mode = t.closest('[data-cmpmode]'); if (mode) { state.cmpMode = mode.dataset.cmpmode; const [cb, ck] = state.cmp.split('|'); const m = findMetric(cb, state.cmp.slice(cb.length + 1)); if (m) compareModal(m); return; }
  const pgb = t.closest('[data-pgeo]'); if (pgb) { const [k, g] = pgb.dataset.pgeo.split('|'); state.pgeo = state.pgeo || {}; state.pgeo[k] = g; return renderKeep(); }
  const mvbk = t.closest('[data-mvback]'); if (mvbk) { ev.stopPropagation(); const [bb, kk] = mvbk.dataset.mvback.split('|'); const m = findMetric(bb, kk); if (m) movedModal(movedFor1(m)); return; }
  const cmp = t.closest('[data-cmp]'); if (cmp) { ev.stopPropagation(); const m = findMetric(cmp.dataset.from || state.tab, cmp.dataset.cmp); if (m) compareModal(m); return; }
  const sud = t.closest('[data-suday]'); if (sud) { state.suDay = +sud.dataset.suday; return renderKeep(); }
  const tmb = t.closest('[data-tmteam]'); if (tmb) { state.fteam = tmb.dataset.tmteam; return renderKeep(); }
  const cg = t.closest('[data-chg]'); if (cg) { state.chg = state.chg === cg.dataset.chg ? '' : cg.dataset.chg; return renderKeep(); }
  const sk = t.closest('[data-segkey]'); if (sk) { hideHint(); const k = sk.dataset.segkey, f = [].concat(FLAGGED || [], MOVED || [], LIFTS || []).find(x => x.m.key === k); if (f) movedModal(f); return; }
  const lf = t.closest('[data-lift]'); if (lf) { hideHint(); const f = LIFTS[+lf.dataset.lift]; if (f) movedModal(f); return; }
  const fl = t.closest('[data-fl]'); if (fl) { hideHint(); const f = FLAGGED[+fl.dataset.fl]; if (f) { state.open.add(f.m.key); renderKeep(); const el = document.querySelector('[data-row="' + CSS.escape(f.m.key) + '"]'); if (el) { const bar = document.querySelector('.bar'); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (bar ? bar.offsetHeight : 60) - 90, behavior: 'smooth' }); } } return; }
  const flm = t.closest('[data-flmore]'); if (flm) { state.flAll = !state.flAll; return renderKeep(); }
  const mv = t.closest('[data-moved]'); if (mv) { hideHint(); const f = MOVED[+mv.dataset.moved]; if (f) movedModal(f); return; }
  const go = t.closest('[data-goto]'); if (go) { const el = document.getElementById(go.dataset.goto); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' }); return; }
  const show = t.closest('[data-show]'); if (show) { closeModal(); state.open.add(show.dataset.show); renderKeep(); const row = document.querySelector('[data-row="' + CSS.escape(show.dataset.show) + '"]'); if (row) window.scrollTo({ top: row.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' }); return; }
  const pmo = t.closest('[data-popmon]'); if (pmo) { state.popMon = pmo.dataset.popmon; return renderKeep(); }
  const pdy = t.closest('[data-popday]'); if (pdy) { state.popMon = null; return setDay(pdy.dataset.popday); }
  if (t.closest('#prev')) return setDay(addDays(state.day, -1));
  if (t.closest('#next')) return setDay(addDays(state.day, 1));
  if (t.closest('#latest')) return setDay(D.asOf);
  const full = t.closest('[data-full]'); if (full) { const s = full.dataset.full; state.full.has(s) ? state.full.delete(s) : state.full.add(s); return renderKeep(); }
  if (t.closest('[data-paychart]')) { state.payChart = !state.payChart; return renderKeep(); }
  if (t.closest('.thr') || t.closest('#pick') || t.closest('.na') || t.closest('.cmpedit')) return;
  const tr = t.closest('tr[data-date]'); if (tr) return setDay(tr.dataset.date);
  const row = t.closest('[data-row]'); if (row) { const k = row.dataset.row; state.open.has(k) ? state.open.delete(k) : state.open.add(k); return renderKeep(); }
});
document.addEventListener('change', ev => {
  const pk = ev.target.closest('#pick'); if (pk) { if (pk.value) setDay(pk.value); return; }
  if (ev.target.closest('.cmpedit')) return;
  const s = ev.target.closest('[data-sess]'); if (s) { const k = s.dataset.sess; s.checked ? state.sessOff.delete(k) : state.sessOff.add(k); const host = document.querySelector('[data-chart="' + CSS.escape(k) + '"]'); const m = findMetric(state.tab, k); drawChart(host, { m, sess: s.checked }); return; }
  const inp = ev.target.closest('[data-thr]'); if (inp) { state.thr[inp.dataset.thr][inp.dataset.k] = parseFloat(inp.value) || 0; saveThr(); const y = window.scrollY; paint(); window.scrollTo(0, y); }
});
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape') { if (pinned) return hideHint(); if (!$('#modal').hidden) return closeModal(); }
  if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches && ev.target.matches('[data-absort], [data-row], [data-xrow], [data-lb], [data-lbm], [data-tm], [data-lbm2], [data-imp], [data-say], .hint')) { ev.preventDefault(); ev.target.click(); }
});
let rz = 0;
window.addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(drawOpenCharts); });

// Rolling cells in What moved: each one shows its facts in turn.
setInterval(() => { if (document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) return; document.querySelectorAll('.roll.multi').forEach(r => { const f = [...r.children], i = f.findIndex(x => x.classList.contains('on')), o = f[i], n = f[(i + 1) % f.length]; o.classList.remove('on'); o.classList.add('out'); n.classList.remove('out'); n.classList.add('on'); setTimeout(() => o.classList.remove('out'), 500); }); }, 4500);
let lastY = window.scrollY;
window.addEventListener('scroll', () => {
  if (pinned) hideHint();
  const y = window.scrollY, bar = document.querySelector('.bar'), tuck = y > 90 && y > lastY + 4, show = y < lastY - 4 || y < 90;
  if (bar && (tuck || show) && bar.classList.contains('tuck') !== tuck) { bar.classList.toggle('tuck', tuck); if (tuck && $('#amenu')) $('#amenu').hidden = true; setTimeout(setBarH, 220); }
  if (Math.abs(y - lastY) > 4) lastY = y;
}, { passive: true });

{ const hb = document.createElement('div'); hb.id = 'hintbox'; hb.className = 'hintbox'; hb.hidden = true; hb.setAttribute('role', 'tooltip'); document.body.appendChild(hb); }
// One footer for every page: what this is, when it refreshes, where the data comes from, who to ask.
$('#foot').innerHTML = '<div class="fin"><div class="fbrand"><b>' + LOGO('pod', 22) + ' Product Org Dashboard</b>How the Articore product org is doing: CVR, what is shipping, what we are testing and what changed.<p class="fsmall">Built by Mike Carafa with Claude. Updates at 8:30 AM, 2:30 PM and 4:30 PM ET.</p></div>' +
  '<div><h4>Feedback or ideas for this dashboard</h4><a href="https://grid-articore.enterprise.slack.com/team/U2XU2NP7T" target="_blank" rel="noopener">Ask Mike in Slack ↗</a></div></div>';
try { state.tipOther = localStorage.getItem('pod.tipo') === '1'; state.ccOth = localStorage.getItem('pod.ccoth2') === 'on'; } catch (e) {}
// The viewer never updates the address bar, so a link's #tab sticks after clicking around. On a reload of the same link,
// go back to the tab last viewed; a different (or new) link still opens its own tab (Mike, Oct 26).
const VIEWS_OK = ['rb', 'tp', 'tests', 'trending', 'soon', 'impact', 'standup'];
applyBotFilter((() => { try { return localStorage.getItem('pod.botf') || 'max'; } catch (e) { return 'max'; } })());
// CVR page links read #rbo and #tpo; old #rb and #tp links still work (Mike, Oct 26).
const HASHIN = { rbo: 'rb', tpo: 'tp' }, HASHOUT = { rb: 'rbo', tp: 'tpo' };
let h0 = (location.hash || '').slice(1);
// A shared view link carries its filters after the page, e.g. #soon~t_tiger~g_AOV~gb_team (Mike, Oct 27: filtered links should open filtered).
const HPARTS = h0.split('~'); h0 = HASHIN[HPARTS[0]] || HPARTS[0];
if (HPARTS.length > 1) { state.teams = []; state.goals = []; state.views = []; state.sites = []; state.pms = [];
  HPARTS.slice(1).forEach(p => { const [k, v] = [p.slice(0, p.indexOf('_')), p.slice(p.indexOf('_') + 1)];
    if (k === 'mv' || k === 'cmp') state.openTok = [k, v]; else if (k === 's') state.sites.push(v); else if (k === 'p') state.pmsRaw = (state.pmsRaw || []).concat(v); else if (k === 't') state.teams.push(v); else if (k === 'g') state.goals.push(v); else if (k === 'v') state.views.push(v); else if (k === 'gb') state.gGroup = v; else if (p === 'list') state.rmGantt = false; else if (k === 'bf') state.botf = v; else if (k === 'd') state.day = v.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'); }); }
try {
  const lastH = localStorage.getItem('pod.lasth') || '', lastV = localStorage.getItem('pod.lastv') || '';
  localStorage.setItem('pod.lasth', h0);
  if (h0 === lastH && VIEWS_OK.indexOf(lastV) >= 0 && HPARTS.length < 2) h0 = lastV;
} catch (e) {}
if (h0 === 'rb' || h0 === 'ds' || h0 === 'tp') state.tab = h0;
if (h0 === 'tests' || h0 === 'trending' || h0 === 'soon' || h0 === 'impact') state.view = h0;
if (h0 === 'standup') state.view = 'soon';
render();
// Reopen a shared pop-up: find the metric whose key encodes to the token.
if (state.openTok) { const [k, v] = state.openTok, M = metricsFor(state.tab); let m = null; Object.keys(M).forEach(sec => M[sec].forEach(x => { if (!m && encK(x.key) === v) m = x; })); state.openTok = null; if (m) setTimeout(() => k === 'cmp' ? compareModal(m) : movedModal(movedFor1(m)), 300); }


// A steady, constant dusting of sparkles drifts off "About this data" from random edges.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const COLORS = ['#f5c542', '#ff7ab8', '#7ad7ff', '#b49bff', '#ffffff'];
  const puff = () => {
    const b = document.getElementById('aboutbtn'), w = b && b.parentElement; if (!b || document.hidden || b.closest('.quiet')) return; // no sparkles while the countdown has the spotlight
    const n = 1, W = b.offsetWidth, H = b.offsetHeight;
    for (let i = 0; i < n; i++) {
      const sp = document.createElement('span'), side = Math.floor(Math.random() * 4), t = Math.random();
      const x = side === 0 ? t * W : side === 1 ? W : side === 2 ? t * W : 0, y = side === 0 ? 0 : side === 1 ? t * H : side === 2 ? H : t * H;
      const ang = Math.atan2(y - H / 2, x - W / 2), dist = 8 + Math.random() * 10;
      sp.className = 'absp'; sp.style.left = (x - 3) + 'px'; sp.style.top = (y - 3) + 'px'; sp.style.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      sp.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(1) + 'px'); sp.style.setProperty('--dy', (Math.sin(ang) * dist).toFixed(1) + 'px'); sp.style.animationDelay = (i * 0.18) + 's';
      w.appendChild(sp); setTimeout(() => sp.remove(), 1600);
    }
  };
  setInterval(puff, 233); // a steady stream: one sparkle every 0.268s (about 3.7 a second), never in bursts
})();

/* ---------- easter eggs: Konami code → Matrix; the ◐ in the corner → colour themes ---------- */
(() => {
  const K = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let pos = 0, raf = 0;
  const root = document.documentElement;
  function rain(on) {
    let c = document.getElementById('mxrain');
    if (!on) { cancelAnimationFrame(raf); if (c) c.remove(); return; }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    c = document.createElement('canvas'); c.id = 'mxrain'; c.setAttribute('aria-hidden', 'true'); document.body.prepend(c);
    const x = c.getContext('2d'), chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789$%CVR', fs = 16;
    let cols, drops;
    const size = () => { c.width = innerWidth; c.height = innerHeight; cols = Math.ceil(c.width / fs); drops = Array.from({ length: cols }, () => Math.random() * (c.height / fs)); };
    size(); addEventListener('resize', size);
    let last = 0;
    const tick = t => { raf = requestAnimationFrame(tick); if (t - last < 50) return; last = t;
      x.fillStyle = 'rgba(0,0,0,0.08)'; x.fillRect(0, 0, c.width, c.height); x.font = fs + 'px monospace';
      drops.forEach((d, i) => { x.fillStyle = Math.random() > 0.96 ? '#d8ffe0' : '#22e05a'; x.fillText(chars[Math.floor(Math.random() * chars.length)], i * fs, d * fs); drops[i] = d * fs > c.height && Math.random() > 0.975 ? 0 : d + 1; }); };
    raf = requestAnimationFrame(tick);
  }
  function matrix(on) {
    root.classList.toggle('matrix', on); rain(on);
    let b = document.getElementById('mxexit');
    if (on && !b) { b = document.createElement('button'); b.id = 'mxexit'; b.type = 'button'; b.innerHTML = '&gt; follow the white rabbit<span class="cur"></span> <kbd>Esc</kbd> exit'; b.setAttribute('aria-label', 'Leave the Matrix theme'); b.addEventListener('click', ev => { ev.stopPropagation(); leaveMatrix(); }); document.body.appendChild(b); }
    if (!on && b) b.remove();
  }
  document.addEventListener('keydown', ev => {
    if (ev.target.closest && ev.target.closest('input, textarea, select')) return;
    if (root.classList.contains('matrix') && ev.key === 'Escape') { leaveMatrix(); return; }
    const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
    pos = k === K[pos] ? pos + 1 : k === K[0] ? 1 : 0;
    if (pos === K.length) { pos = 0; if (root.classList.contains('matrix')) leaveMatrix(); else setTheme('matrix'); }
  });
  // Colour themes: a quiet ◐ in the corner opens a tiny picker. Colours only, remembered per viewer.
  // Basic (the plain token set, no theme class) is retired from the menu as of Oct 22. To bring it back, add ['basic', 'Basic'] after Articore; setTheme and the swatch already handle it.
  const TH = [['articore', 'Articore Light <span class="thdef">(Default)</span>'], ['dark', 'Articore Dark'], ['elegant', 'Elegant'], ['noir', 'Neo noir'], ['spooky', 'Spooky']];
  const THX = TH.concat([['matrix', 'Matrix']]);
  let beforeMx = 'articore';
  // Where the viewer is comes from their browser's time zone (no need to ask); each zone maps to a city for sunrise and sunset.
  const ZONES = { 'America/New_York': [40.71, -74.01, 'New York'], 'America/Chicago': [41.88, -87.63, 'Chicago'], 'America/Denver': [39.74, -104.99, 'Denver'], 'America/Los_Angeles': [34.05, -118.24, 'Los Angeles'], 'Europe/London': [51.51, -0.13, 'London'], 'Asia/Kolkata': [28.61, 77.21, 'Delhi'], 'Australia/Melbourne': [-37.81, 144.96, 'Melbourne'], 'Australia/Sydney': [-33.87, 151.21, 'Sydney'] };
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } };
  const myTz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return 'America/New_York'; } })();
  const AUTO = { on: lsGet('pod.auto3', '1') === '1', tz: lsGet('pod.tz', myTz) };
  const place = tz => ZONES[tz] || [40, -new Date().getTimezoneOffset() / 4, tz.split('/').pop().replace(/_/g, ' ')];
  // NOAA sunrise/sunset approximation, good to a few minutes.
  function sunDark(now = Date.now()) {
    const [lat, lon] = place(AUTO.tz), d = new Date(now), y0 = Date.UTC(d.getUTCFullYear(), 0, 0), n = Math.floor((now - y0) / 864e5), g = 2 * Math.PI / 365 * (n - 1), r = Math.PI / 180;
    const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    const ha = Math.acos(Math.max(-1, Math.min(1, Math.cos(90.833 * r) / (Math.cos(lat * r) * Math.cos(dec)) - Math.tan(lat * r) * Math.tan(dec)))) / r;
    const mid = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()), rise = mid + (720 - 4 * (lon + ha) - eq) * 6e4, set = mid + (720 - 4 * (lon - ha) - eq) * 6e4;
    const m = ((now - mid) % 864e5 + 864e5) % 864e5 + mid; return m < rise || m > set;
  }
  function leaveMatrix() { setTheme(beforeMx === 'matrix' ? 'articore' : beforeMx); }
  // Like iOS: with Automatic on, picking Light or Dark holds until the next sunrise or sunset, then Automatic takes over again (Mike, Oct 26).
  const ovrGet = () => { try { return JSON.parse(lsGet('pod.ovr', 'null')); } catch (e) { return null; } };
  const setTheme = k => { if ((k === 'articore' || k === 'dark') && AUTO.on) { const o = ovrGet(), sd = sunDark(); if (o && o.sd === sd) k = o.mode; else { if (o) lsSet('pod.ovr', 'null'); k = sd ? 'dark' : 'articore'; } } const want = k; const cur = THX.map(t => t[0]).find(t => root.classList.contains('th-' + t)) || 'articore'; if (k === 'matrix' && cur !== 'matrix') beforeMx = cur; matrix(k === 'matrix'); THX.forEach(t => root.classList.remove('th-' + t[0])); root.classList.remove('th-articore'); if (k && k !== 'basic') root.classList.add('th-' + k); if (k === 'dark') root.classList.add('th-articore'); lsSet('pod.theme2', want); document.querySelectorAll('#thpick [data-th]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.th === want))); const ac = document.getElementById('thauto'); if (ac) ac.checked = AUTO.on; const ab = document.querySelector('#thpick .thauto'); if (ab) ab.hidden = want !== 'articore' && want !== 'dark'; const tl = document.querySelector('#thpick .thloc'); if (tl) tl.hidden = !AUTO.on; };
  // Re-check every few minutes so the switch happens at sunset or sunrise without a reload.
  setInterval(() => { const t = lsGet('pod.theme2', 'articore'); if ((t === 'articore' || t === 'dark') && AUTO.on) setTheme(t); }, 5 * 60 * 1000);
  const w = document.createElement('div'); w.id = 'thwrap';
  w.innerHTML = '<button type="button" id="thbtn" aria-label="Theme" title="Theme"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path class="pal" d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.7 1.7-1.7H16a5 5 0 0 0 5-5C21 6.6 17 3 12 3z"/><circle class="pd p1" cx="7.5" cy="11" r="1.3"/><circle class="pd p2" cx="10" cy="7" r="1.3"/><circle class="pd p3" cx="14.5" cy="7" r="1.3"/><circle class="pd p4" cx="17" cy="10.5" r="1.3"/></svg></button><div id="thpick" hidden role="menu"><div class="thapp"><span class="thlbl">Appearance</span><div class="thmodes">' + [['articore', 'Articore Light'], ['dark', 'Articore Dark']].map(t => '<button type="button" role="menuitemradio" class="thm" data-th="' + t[0] + '"><i class="thprev thp-' + t[0] + '"><b></b><b></b><b></b></i>' + t[1] + '</button>').join('') + '</div>' + '<div class="thauto"><label><input type="checkbox" id="thauto"' + (AUTO.on ? ' checked' : '') + '> Automatic</label><span class="cap">Light by day, dark from sunset to sunrise.</span><span class="thloc"><span class="cap">Near</span><select id="thtz" aria-label="Location for sunset">' + Object.keys(ZONES).concat(ZONES[AUTO.tz] ? [] : [AUTO.tz]).map(z => '<option value="' + z + '"' + (z === AUTO.tz ? ' selected' : '') + '>' + place(z)[2] + '</option>').join('') + '</select></span></div></div><span class="thlbl">More themes</span>' + TH.filter(t => t[0] !== 'articore' && t[0] !== 'dark').map(t => '<button type="button" role="menuitemradio" data-th="' + t[0] + '"><i class="sw sw-' + t[0] + '"></i>' + t[1] + '</button>').join('') + '</div>';
  document.body.appendChild(w);
  w.addEventListener('change', ev => { if (ev.target.id === 'thauto') { AUTO.on = ev.target.checked; lsSet('pod.auto3', AUTO.on ? '1' : '0'); lsSet('pod.ovr', 'null'); if (AUTO.on) { const t = lsGet('pod.theme2', 'articore'); if (t !== 'articore' && t !== 'dark') lsSet('pod.theme2', 'articore'); } } if (ev.target.id === 'thtz') { AUTO.tz = ev.target.value; lsSet('pod.tz', AUTO.tz); } setTheme(lsGet('pod.theme2', 'articore')); });
  // One bat swoops by half a second after Spooky is picked; the regular cadence takes over after that.
  const welcomeBat = () => { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; setTimeout(() => { const b1 = document.createElement('span'); b1.className = 'ghostonce'; b1.textContent = '👻'; b1.style.top = (15 + Math.random() * 55).toFixed(0) + '%'; b1.setAttribute('aria-hidden', 'true'); document.body.appendChild(b1); setTimeout(() => b1.remove(), 6000); }, 500); };
  const bats = document.createElement('div'); bats.className = 'bats'; bats.setAttribute('aria-hidden', 'true'); bats.innerHTML = '<span>🦇</span><span>🦇</span><span>👻</span>'; document.body.appendChild(bats);
  // A new height on every pass, so they don't trace the same line each time.
  const hop = el => { el.style.top = (12 + Math.random() * 66).toFixed(0) + '%'; };
  bats.querySelectorAll('span').forEach(el => { hop(el); el.addEventListener('animationiteration', () => hop(el)); });
  w.addEventListener('click', ev => { ev.stopPropagation(); const b = ev.target.closest('[data-th]'); if (b) { if (b.classList.contains('thm') && AUTO.on) lsSet('pod.ovr', JSON.stringify({ mode: b.dataset.th, sd: sunDark() })); const was = root.classList.contains('th-spooky'); setTheme(b.dataset.th); $('#thpick').hidden = true; if (b.dataset.th === 'spooky' && !was) welcomeBat(); return; } if (ev.target.closest('#thbtn')) $('#thpick').hidden = !$('#thpick').hidden; if (ev.target.closest('.thauto')) return; });
  document.addEventListener('click', () => { const p = $('#thpick'); if (p) p.hidden = true; });
  try { const t = localStorage.getItem('pod.theme2'); setTheme(TH.some(x => x[0] === t) ? t : 'articore'); } catch (e) { setTheme('articore'); }
})();

/* ---------- Section rail: a slim nav to the right of the CVR pages that tracks where you are and jumps on click (Mike, Oct 22) ---------- */
(function () {
  const ICO = {
    overall: '<path d="M2.5 3h2l1.6 7.2h7l1.4-5H5.2" /><circle cx="7" cy="13" r="1"/><circle cx="12.5" cy="13" r="1"/>',
    device: '<rect x="2" y="3" width="9" height="7" rx="1"/><path d="M5 12.5h3"/><rect x="11.5" y="5.5" width="3" height="7" rx=".8"/>',
    funnel: '<path d="M2.5 3h11l-4.2 5v4.5l-2.6 1.2V8z"/>',
    channel: '<path d="M3 8a5 5 0 0 1 10 0"/><path d="M5.5 8a2.5 2.5 0 0 1 5 0"/><circle cx="8" cy="8.5" r=".9"/><path d="M8 9.5V13"/>',
    geo: '<circle cx="8" cy="8" r="5.5"/><path d="M2.5 8h11M8 2.5c1.7 1.6 2.4 3.4 2.4 5.5S9.7 11.9 8 13.5C6.3 11.9 5.6 10.1 5.6 8S6.3 4.1 8 2.5z"/>',
    product: '<path d="M5.5 2.5 3 4v2.5l1.5.5V13.5h7V7l1.5-.5V4l-2.5-1.5C10 3.6 9.1 4.2 8 4.2S6 3.6 5.5 2.5z"/>',
    pay: '<rect x="2" y="4" width="12" height="8.5" rx="1.5"/><path d="M2 7h12M4.5 10.2h2.5"/>',
    chart: '<path d="M2.5 13.5h11"/><path d="M3.5 11l3-3.5 2.5 2 4-5"/>',
    dot: '<circle cx="8" cy="8" r="2.2"/>',
    late: '<path d="M8 2.2 14 13H2z"/><path d="M8 6.5v3M8 11.3v.01"/>', rocket: '<path d="M9.5 2.5c2.5.5 4 2 4 4L8 12 4 8z"/><path d="M5.5 9.5 3 13M6.5 10.5 4.5 13.5M3 9l1-2.5h2.5M10 12.5 9.5 10"/>', build: '<path d="M9.5 3.5 12.5 6.5 6 13 3 13 3 10z"/><path d="M8 5l3 3"/>', sprout: '<path d="M8 14V8"/><path d="M8 8C8 5 6 3.5 3 3.5 3 6.5 5 8 8 8zM8 9.5c0-2.5 1.7-4 4.5-4 0 2.7-1.7 4-4.5 4z"/>',
    bots: '<rect x="3" y="5" width="10" height="8" rx="2"/><path d="M8 5V2.8M6 9h.01M10 9h.01M1.5 9v1.5M14.5 9v1.5"/>',
    flask: '<path d="M6.5 2.5h3M7 2.5v4L3.5 12.5a1 1 0 0 0 .9 1.5h7.2a1 1 0 0 0 .9-1.5L9 6.5v-4"/>',
    cal: '<rect x="2.5" y="3.5" width="11" height="10" rx="1.5"/><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3"/>',
    chat: '<path d="M2.5 4a1.5 1.5 0 0 1 1.5-1.5h8A1.5 1.5 0 0 1 13.5 4v5.5A1.5 1.5 0 0 1 12 11H6.5L3.5 13.5V11h0A1 1 0 0 1 2.5 10z"/>',
    help: '<path d="M3 9.5V8a5 5 0 0 1 10 0v1.5"/><rect x="2.5" y="9" width="2.5" height="4" rx="1"/><rect x="11" y="9" width="2.5" height="4" rx="1"/>',
    tag: '<path d="M2.5 2.5h5l6 6-5 5-6-6z"/><circle cx="5.5" cy="5.5" r="1"/>',
    bulb: '<path d="M6 12h4M6.5 14h3M8 2a4 4 0 0 0-2.4 7.2c.5.4.9 1 .9 1.8h3c0-.8.4-1.4.9-1.8A4 4 0 0 0 8 2z"/>',
    star: '<path d="M8 2.2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.4l-3.6 1.9.7-4-2.9-2.8 4-.6z"/>',
    heart: '<path d="M8 13.5S2.5 10.2 2.5 6.3A2.8 2.8 0 0 1 8 5a2.8 2.8 0 0 1 5.5 1.3C13.5 10.2 8 13.5 8 13.5z"/>',
    run: '<path d="M5.5 3.8v8.4L12 8z"/>', done: '<path d="M3.5 8.5l3 3 6-7"/>', soon: '<circle cx="8" cy="8" r="5.5"/><path d="M8 5v3.2l2 1.3"/>', past: '<rect x="2.5" y="3" width="11" height="3" rx="1"/><path d="M3.5 6v7h9V6M6.5 8.5h3"/>',
    overview: '<path d="M2.5 7.5 8 3l5.5 4.5"/><path d="M4 6.5V13h8V6.5"/><path d="M6.8 13V9.5h2.4V13"/>'
  };
  const svg = k => k.startsWith('L:') ? '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><rect x="1.5" y="1.5" width="13" height="13" rx="4" fill="none" stroke="currentColor" stroke-width="1.3"/><text x="8" y="' + (k.length > 4 ? 10.6 : 11.2) + '" text-anchor="middle" font-size="' + (k.length > 4 ? 5.4 : k.length > 3 ? 6.6 : 8.5) + '" font-weight="700" fill="currentColor" font-family="system-ui,sans-serif">' + esc(k.slice(2).toUpperCase()) + '</text></svg>' : k.startsWith('e:') ? '<i class="sre" aria-hidden="true">' + k.slice(2) + '</i>' : '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + ICO[k] + '</svg>';
  const rail = document.createElement('nav'); rail.id = 'srail'; rail.setAttribute('aria-label', 'Sections on this page'); rail.hidden = true; document.body.appendChild(rail);
  let items = [], active = -1, ticking = false;
  const offset = () => (document.querySelector('.bar') ? document.querySelector('.bar').offsetHeight : 60) + 90;
  const RAILI = [[/bot squad/i, 'bots'], [/^past their/i, 'late'], [/^launching in/i, 'rocket'], [/^in progress, launching/i, 'build'], [/^just getting/i, 'sprout'], [/^launched$/i, 'done'], [/^running|in progress/i, 'run'], [/^decided|shipped/i, 'done'], [/^coming|not started/i, 'soon'], [/^earlier/i, 'past'], [/experiment/i, 'flask'], [/next half/i, 'cal'], [/people are saying/i, 'chat'], [/customer service/i, 'help'], [/what is selling/i, 'tag'], [/double down/i, 'bulb'], [/top designs/i, 'star'], [/shout-out/i, 'heart']];
  function targets() {
    const out = [];
    // Other pages: Overview plus each top-level section heading (Mike, Oct 26: a rail on every page).
    if (state.view !== 'daily') {
      const top = document.querySelector('#main > section, #main > div'); if (top) out.push(['overview', 'Overview', top]);
      // Timeline: the rail lists its sections, whichever way it's grouped (Mike, Oct 27).
      const gg = [...document.querySelectorAll('.gantt .ggrp')];
      if (gg.length) { gg.forEach(g => { const b = g.querySelector('.ggh2 b'); if (!b) return; const label = b.textContent.replace(/^[^\p{L}]+/u, '').trim(); const AB = { 'Customer': 'C', 'Purchase Lifecycle': 'PLC', 'Search & Content': 'S&C', 'Search': 'S&C', 'Artist and Apps': 'A&A', 'Core': 'CO', 'Data Engineering': 'DE', 'MarTech': 'MT', 'Dashery': 'D', 'CVR': 'CVR', 'AOV': 'AOV', 'Revenue': '$', 'Retention': 'RET', 'Traffic': 'TRF', 'Ops': 'OPS', 'Compliance': 'LAW', 'Data foundation': 'DAT', 'Other': '•' };
        out.push([(RAILI.find(r => r[0].test(label)) || [0, 'L:' + (AB[label] || label.charAt(0))])[1], label, g]); }); return out.length > 1 ? out : []; }
      [...document.querySelectorAll('#main h2, #main .ghead h3')].filter(h => h.offsetParent && !h.closest('.modal')).forEach(h => {
        const t = h.cloneNode(true); t.querySelectorAll('small, .cap, .gcount, .pill, .lbd').forEach(x => x.remove());
        const raw = t.textContent.replace(/\s+/g, ' ').trim().replace(/\s*\d+$/, ''), em = (raw.match(/^\p{Extended_Pictographic}\uFE0F?/u) || [''])[0];
        const label = raw.slice(em.length).trim(); // Line icons only, never the heading's emoji, so every page's rail looks the same (Mike, Oct 26).
        const ik = (RAILI.find(r => r[0].test(label)) || [0, 'dot'])[1]; if (label) out.push([ik, label, h.closest('.ghead') || h]);
      });
      return out.length > 1 ? out : [];
    }
    // Overview first: the top of the page (headline, drivers and the stat cards) (Mike, Oct 26).
    const top = document.querySelector('#main > section'); if (top) out.push(['overview', 'Overview', top]);
    const bots = document.getElementById('g-bots'); if (bots) out.push(['bots', 'Bot Squad updates', bots]);
    const chart = document.querySelector('.cvrchart'); if (chart) out.push(['chart', 'CVR, 90 days', chart]);
    const pay = [...document.querySelectorAll('.ghead h3')].find(h => /Payment mix/.test(h.textContent)); if (pay) out.push(['pay', 'Payment mix', pay.closest('section, .group, .paysec') || pay]);
    ['overall', 'device', 'funnel', 'channel', 'geo', 'product'].forEach(k => { const el = document.getElementById('g-' + k); if (el) out.push([k, SECS[k], el]); });
    return out;
  }
  // Chip rows that wrap past one line get a "See more" (Mike, Oct 27). Checked after each render, once the chips have a width.
  function fitChips() { document.querySelectorAll('.gcw').forEach(w => { const c = w.querySelector('.gchips'), b = w.querySelector('.gmore'); if (!c || !b) return; const open = !c.classList.contains('clamp'); b.hidden = open ? false : c.scrollHeight <= c.clientHeight + 2; }); }
  window.fitChips = fitChips;
  function build() {
    fitChips();
    const dv = state.view === 'daily';
    items = dv && state.tab === 'ds' ? [] : targets();
    if (!items.length) { rail.hidden = true; return; }
    // A section holding a row below its normal range gets a small red "!" on its icon (design agency, Oct 27), so you know where to scroll.
    const bad = t => !t[2].querySelectorAll ? 0 : t[2].classList && t[2].classList.contains('gg-late') ? +((t[2].querySelector('.ggn') || {}).textContent || 1) : t[2].querySelectorAll('.row.nrbad').length;
    // CVR pages: two groups, "At a glance" (overview, bots, chart, payments) then "Split CVR by" (the scorecard sections) (design agency, Oct 27).
    const SPLITK = ['overall', 'device', 'funnel', 'channel', 'geo', 'product'], firstSplit = items.findIndex(t => SPLITK.indexOf(t[0]) >= 0);
    const grp = (t, i) => !dv ? '' : i === 0 && SPLITK.indexOf(t[0]) < 0 ? '<span class="srgrp">At a glance</span>' : i === firstSplit ? '<span class="srgrp sep">Split CVR by</span>' : '';
    rail.innerHTML = '<span class="srlbl">On this page</span><div class="srlist"><span class="srpill" aria-hidden="true"></span>' + items.map((t, i) => { const n = bad(t); return grp(t, i) + '<button type="button" data-sr="' + i + '"' + (n ? ' class="hasbad" title="' + n + (t[2].classList && t[2].classList.contains('gg-late') ? ' past their launch date' : ' below normal range') + '"' : '') + '><i class="sric">' + svg(t[0]) + (n ? '<b class="sralert" aria-hidden="true">' + n + '</b>' : '') /* the count lives in the badge itself, no separate tag (Mike, Oct 27) */ + '</i><span>' + esc(t[1]) + '</span></button>'; }).join('') + '</div>';
    rail.hidden = false; active = -1; place(); spy();
  }
  function setActive(i) {
    if (i === active) return; active = i;
    rail.querySelectorAll('[data-sr]').forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
    const b = rail.querySelector('[data-sr="' + i + '"]'), p = rail.querySelector('.srpill');
    if (!b || !p) { if (p) p.style.opacity = 0; return; }
    p.style.opacity = 1; p.style.transform = 'translateY(' + b.offsetTop + 'px)'; p.style.height = b.offsetHeight + 'px';
  }
  // The group labels change height when the rail opens and closes, so re-place the highlight on the row it belongs to (Mike, Oct 27).
  const repin = () => requestAnimationFrame(() => { const a = active; active = -1; setActive(a); });
  ['mouseenter', 'mouseleave', 'focusin', 'focusout'].forEach(ev => rail.addEventListener(ev, repin));
  function spy() {
    ticking = false; if (rail.hidden || !items.length) return;
    const line = offset() + 40; let cur = -1;
    items.forEach((t, i) => { if (t[2].getBoundingClientRect().top <= line) cur = i; });
    rail.classList.toggle('dim', cur < 0);
    setActive(cur < 0 ? 0 : cur);
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
  // Sticky in the margin right next to the page content, like a table of contents; only when there's no room does it fall back
  // to the window edge, with a comfortable gap from the scrollbar (design agency, Oct 26).
  function place() {
    if (rail.hidden) return; const m = document.getElementById('main'); if (!m) return;
    const r = m.getBoundingClientRect(), w = rail.offsetWidth, gap = 16, edge = 20;
    const x = r.right + gap + w <= window.innerWidth - edge ? r.right + gap : window.innerWidth - w - edge;
    // Pinned by its right edge, so the labels slide out to the left on hover instead of running off screen.
    rail.style.right = Math.round(window.innerWidth - x - w) + 'px'; rail.style.left = 'auto';
  }
  window.addEventListener('resize', () => requestAnimationFrame(() => { place(); spy(); }));
  rail.addEventListener('click', ev => { const b = ev.target.closest('[data-sr]'); if (!b) return; const t = items[+b.dataset.sr]; if (!t) return; setActive(+b.dataset.sr); if (ev.detail) b.blur(); /* a mouse click lets go of focus, so the rail folds back when the mouse leaves (Mike, Oct 26) */ window.scrollTo({ top: t[2].getBoundingClientRect().top + window.scrollY - offset() + 10, behavior: 'smooth' }); });
  // Rebuild after every render (the page is redrawn from scratch).
  const mo = new MutationObserver(() => { clearTimeout(mo.t); mo.t = setTimeout(build, 60); });
  const main = document.getElementById('main'); if (main) mo.observe(main, { childList: true });
  setTimeout(build, 200);
})();
// A clicked ticker item drops focus once its jump runs, so the ticker keeps moving (Mike, Oct 26).
document.addEventListener('click', ev => { const tb = ev.target.closest && ev.target.closest('#ticker button'); if (tb) setTimeout(() => tb.blur(), 0); });
