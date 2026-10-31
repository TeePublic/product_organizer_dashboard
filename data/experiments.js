// A/B tests from Amplitude Experiment (Redbubble project 774278), pulled Oct 31 2026 (Oct 30 the last complete day).
// cvr = Sitewide CVR (h1f2lfvq, pageview to order in a day) among exposed users. reach = estimated share of all site orders
// that come from users the test touches (exposed converters / site orders over the same days, with a 0.6 repeat-buyer factor
// calibrated on the two site-wide tests, capped at 100%). site = cvr lift x reach = what the variant does to whole-site CVR.
const EXPS = { metricNote: 'Each test has a primary metric (what it was built to move) and secondary metrics. The number that matters most is the whole-site impact. Conversion tests are judged on whole-site CVR; cross-sell and upsell tests on revenue per visitor and order value, since they aim to grow the basket, not the number of buyers.', asOf: 'Oct 31', tpNote: 'TeePublic\'s live tests (Beam in cart, Rokt Pay+ at checkout, the product-page trending tag and post-purchase cross-sell layouts) are not run in Amplitude Experiment, so this list is Redbubble only.',
  live: [
    { id: '1580138', kind: 'aov', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.4240, b: 0.4347, rel: 0.0253, f: 'pct' }, { name: 'Order value', a: 40.48, b: 40.59, rel: 0.0029, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: null, name: 'Sticker cross-sell in the cart', where: 'Cart page', start: '2026-10-29', status: 'running', owners: 'Jon',
      hyp: 'Offering stickers to add in the cart grows the basket. A second version also trims the trust badges to make room.',
      primary: { name: 'Revenue per user', a: 17.31, b: 17.78, rel: 0.0270 }, cvr: { a: 0.4240, b: 0.4347, rel: 0.0253 }, reach: 0.57,
      variants: [['Cross-sell, all badges', 0.0270], ['Cross-sell, fewer badges', 0.0148]],
      n: 13566, sig: false, call: 'Two days (Oct 29 and 30, about 13,600 cart visitors): day one looked down about 9%, but with day two both cross-sell versions lead no cross-sell on revenue per visitor (+2.7% with all badges, +1.5% with fewer badges) and Sitewide CVR is +2.5% with all badges, none significant (under 50% confidence). Too early to tell; Amplitude\'s roll-out suggestion rests on revenue metrics with a broken error bar. No time to 95% estimate yet.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1580138' },
    { id: '1529803', kind: 'cvr', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.6151, b: 0.6165, rel: 0.0023, f: 'pct' }], rpuNote: 'Revenue per user is not tracked on this test.', p: 1.0, name: 'Remove "Return to cart" on checkout', where: 'Checkout', start: '2026-10-14', status: 'running', owners: 'Oliver, Allison',
      hyp: 'Taking the exit link off checkout keeps people moving to the order.',
      primary: { name: 'Orders per checkout visitor', a: 0.6460, b: 0.6463, rel: 0.0004 }, cvr: { a: 0.6151, b: 0.6165, rel: 0.0023 }, reach: 0.68,
      n: 81812, sig: false, call: 'Still flat after 17 days: orders per checkout visitor +0.0% and Sitewide CVR +0.2%, neither significant (no group imbalance). Amplitude puts it at about 40 more days to read, well past the code freeze, so it is unlikely to give a clear answer before peak.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1529803' },
    { id: '1409398', kind: 'cvr', sec: [{ name: 'Revenue per user', a: 0.5008, b: 0.4972, rel: -0.0071, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: 1.0, name: 'Topics-first navigation', where: 'Site nav, every page', start: '2026-10-07', status: 'running', owners: 'Jon',
      hyp: 'Shopping by topic instead of product type gets more people into the catalog and buying.',
      primary: { name: 'Sitewide CVR', a: 0.01315, b: 0.01304, rel: -0.0089 }, cvr: { a: 0.01315, b: 0.01304, rel: -0.0089 }, reach: 1,
      variants: [['Topics nav', -0.0089], ['Topic defaults to T-shirts', -0.0058], ['Topic runs a search', -0.0111]],
      n: 7171153, sig: false, call: 'Day 24: all three variants sit slightly below no change on CVR (-0.9%, -0.6%, -1.1%; none significant) and on revenue per user (-0.7% for the topics nav, -0.2% for the T-shirt default, -1.9% for the search variant, which stays the weakest). Nav engagement is up 13% to 15% in all three, significant. Amplitude suggests rolling back and says about 40 more days to read CVR. It still flags uneven group sizes, so read it loosely.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1409398' },
    { id: '1492400', kind: 'cvr', sec: [{ name: 'Revenue per user', a: 0.3372, b: 0.3439, rel: 0.0200, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: 1.0, name: 'Sale banner countdown timer', where: 'Sale banner, every page', start: '2026-10-06', status: 'running', owners: 'Milan, Jon',
      hyp: 'A fresher banner with a timer beats banner blindness. Testing how long the timer should show.',
      primary: { name: 'Sitewide CVR', a: 0.00837, b: 0.00853, rel: 0.0194 }, cvr: { a: 0.00837, b: 0.00853, rel: 0.0194 }, reach: 1,
      variants: [['Timer all sale', 0.0082], ['Timer last 48 hours', 0.0194], ['Timer last 72 hours', 0.0131]],
      n: 8371531, sig: false, call: 'Only collects during sales and the last sale ended Oct 26, so it is paused until the next one. All three timers sit ahead of no timer, with the 48-hour timer leading at about +1.9% CVR and +2.0% revenue per user. CVR is not significant (under 50% confidence); Amplitude says about 33 more sale days to read the 48-hour timer.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1492400' },
    { id: '1569370', kind: 'aov', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.015943, b: 0.015619, rel: -0.0203, f: 'pct' }, { name: 'Revenue per user', a: 0.8228, b: 0.8413, rel: 0.0225, f: 'usd' }], p: null, name: 'T-shirt style pills on product pages', where: 'PDP', start: '2026-10-27', status: 'running', owners: 'Jon, Allison, Oliver',
      hyp: 'Showing every T-shirt style up front with fit labels, instead of the style picker pop-up, makes choosing easier and nudges people to premium styles.',
      primary: { name: 'Revenue per user', a: 0.8228, b: 0.8413, rel: 0.0225 }, cvr: { a: 0.015943, b: 0.015619, rel: -0.0203 }, reach: 0.32,
      n: 302503, sig: false, call: 'Four days (Oct 27 to 30): style pills lead on revenue per visitor (+2.3%) and order value (+4.7%), but neither is significant, and add to cart on the PDP is down 6.7% with 99% confidence. Sitewide CVR is -2.0%, not significant. Amplitude flags a sample ratio mismatch (51% of visitors in the test group, 49% in control) and the bot filter was edited late Oct 30, so read it loosely. Amplitude can\'t estimate time to 95% yet.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1569370' },
    { id: '1434686', kind: 'cvr', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.02267, b: 0.02267, rel: -0.0001, f: 'pct' }, { name: 'Revenue per user', a: 0.9671, b: 0.9647, rel: -0.0024, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: 0.67, name: 'Mobile color swatches shown by default', where: 'PDP, mobile', start: '2026-09-11', status: 'running', owners: 'Jon, Allison',
      hyp: 'Showing every color without the "+N colors" tap makes it easier to pick and buy.',
      primary: { name: 'PDP to order rate', a: 0.02239, b: 0.02233, rel: -0.0027 }, cvr: { a: 0.02267, b: 0.02267, rel: -0.0001 }, reach: 0.76,
      n: 6359340, sig: false, call: 'Six weeks in and dead flat. Call it: ship whichever is simpler to maintain.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1434686' }
  ],
  done: [
    { id: '1484334', kind: 'cvr', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.4807, b: 0.4765, rel: -0.0088, f: 'pct' }, { name: 'Revenue per user', a: 19.52, b: 19.59, rel: 0.0039, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: 0.61, name: 'Remove cart trust badges', where: 'Cart page', start: '2026-10-05', end: '2026-10-21', status: 'kept', owners: 'Efren, Jon',
      hyp: 'The trust badges are clutter at the cart and the space could hold cross-sell.',
      primary: { name: 'Cart to order rate', a: 0.4751, b: 0.4707, rel: -0.0093 }, cvr: { a: 0.4807, b: 0.4765, rel: -0.0088 }, reach: 1,
      n: 163456, sig: false, call: 'Kept the badges. A slight dip in CVR; retesting with cross-sell and fewer trust signals.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1484334' },
    { id: '1427597', kind: 'cvr', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.03249, b: 0.03294, rel: 0.0141, f: 'pct' }, { name: 'Revenue per user', a: 1.419, b: 1.435, rel: 0.0114, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: 0.25, name: 'Flat-lay T-shirt thumbnails in search', where: 'SRP', start: '2026-10-05', end: '2026-10-19', status: 'shipped', owners: 'Oliver, Efren, Jon',
      hyp: 'Leading with the product image, not the model, shows the design better in search results.',
      primary: { name: 'SRP to order rate', a: 0.02975, b: 0.03020, rel: 0.0153 }, cvr: { a: 0.03249, b: 0.03294, rel: 0.0141 }, reach: 0.69,
      n: 1443475, sig: false, call: 'Shipped on a positive but not significant read.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1427597' }
  ],
  older: [
    { name: 'Product image first, all apparel', end: '2026-10-05', status: 'shipped', note: 'Shipped on a positive but not significant read (+1.2% Sitewide CVR for people in the test).', url: 'https://app.amplitude.com/experiment/tpub/774278/config/1431889' },
    { name: 'Express payments first in checkout', end: '2026-09-11', status: 'kept', note: 'Kept control: no impact.', url: 'https://app.amplitude.com/experiment/tpub/774278/config/1387659' },
    { name: 'Standard price vs "From $X" in search', end: '2026-09-10', status: 'kept', note: 'Kept control.', url: 'https://app.amplitude.com/experiment/tpub/774278/config/1384666' },
    { name: 'Remove shipping options from cart', end: '2026-09-08', status: 'shipped', note: 'Shipped. Checkout completion is not comparable across Aug 17 to Sep 8 because of it.', url: 'https://app.amplitude.com/experiment/tpub/774278/config/1382930' }
  ]
};

// Every metric the exec team asks about, per running test (Sam, standup Oct 30: revenue per visitor, CVR, add to cart, AOV, engagement,
// is it proven, when did it start, who decides). s: 'sig' = 95%+ confidence, 'ns' = could be noise (c = % sure when known), 'nb' = Amplitude
// can't put an error bar on it, 'early' = too little data to trust. a = control, b = test. AOV is revenue ÷ orders, not Amplitude's per-visitor
// "AOV". Pulled from Amplitude Experiment, Oct 31 (Oct 30 the last complete day).
EXPS.reads = {
  '1569370': { goal: 'rpv', verdict: ['mixed', 'Order value up, add to cart down'], next: 'Read again Tue Nov 3, after 3 to 4 more days. If add to cart stays down at 95%+ while revenue per visitor stays flat, the pills cost more orders than they add in order value. Finance to check the extra order value isn\'t lower-margin tees.', decides: 'Customer team, with Finance on margin', flag: 'Uneven group sizes (Amplitude flags a sample ratio mismatch) and targeting edits on Oct 27 and late Oct 30, so read it loosely.',
    m: { rpv: { v: 0.0225, s: 'ns', a: 0.8228, b: 0.8413, f: 'usd', note: 'Revenue per visitor. Amplitude\'s headline +2.5% "roll out" comes from a revenue metric with a broken error bar; this is the version with a working one, and it could still be noise.' },
         cvr: { v: -0.0251, s: 'ns', a: 0.015748, b: 0.015353, name: 'PDP to order rate', note: 'Sitewide CVR for people in the test is -2.0%, also not significant.' },
         atc: { v: -0.0668, s: 'sig', c: 99, a: 0.0415, b: 0.0388, name: 'Add to cart rate (PDP)', note: '99% confidence it\'s lower. Steering people to pricier styles can lower add to cart while raising order value, which is what TeePublic saw.' },
         aov: { v: 0.0468, s: 'nb', a: 51.38, b: 53.78, f: 'usd', note: 'Revenue ÷ orders. Amplitude\'s own "AOV" divides by everyone in the test.' } } },
  '1409398': {vdef: { 'Topics nav': 'The nav is organized by topic instead of product type.', 'T-shirt default': 'Clicking a topic opens the regular T-shirt results for it, whatever the mix would be.', 'Topic runs a search': 'Clicking a topic runs a normal search for it, so results mix product types (more stickers show up) and the system picks the style.' },  goal: 'cvr', verdict: ['mixed', 'Engagement up, CVR flat'], next: 'Decide whether +13% engagement is worth flat CVR (more engaged visitors feed retargeting). Check revenue per buyer on the T-shirt default.', decides: 'Exec team (the board asked for this test)', flag: 'Uneven group sizes, so read it loosely.',
    m: { rpv: { v: -0.0071, s: 'nb', a: 0.5008, b: 0.4972, f: 'usd', note: 'Topics nav −0.7%, T-shirt default −0.2%, topic runs a search −1.9%.' },
         cvr: { v: -0.0089, s: 'ns', a: 0.01315, b: 0.01304, name: 'Sitewide CVR', note: 'Topics nav −0.9%, T-shirt default −0.6%, topic runs a search −1.1%. None is significant.' },
         atc: { v: -0.0074, s: 'ns', a: 0.03355, b: 0.03330, name: 'Add to cart rate (sitewide)', note: 'Topics nav −0.7%, T-shirt default −1.0%, topic runs a search −0.6%.' },
         aov: { v: 0.0013, s: 'nb', a: 38.08, b: 38.13, f: 'usd', name: 'Revenue per buyer', note: 'Revenue ÷ buyers (this test doesn\'t count orders). Topics nav +0.1%, T-shirt default +0.3%, topic runs a search −0.8%. So the T-shirt default does not raise order value.' },
         eng: { v: 0.1296, s: 'sig', a: 0.01396, b: 0.01577, name: 'Nav engagement', note: 'Share of visitors who click the nav. All three versions are up 13% to 15%, all significant.' } },
    vrows: [['Topics nav', { cvr: -0.0089, eng: 0.1296, rpv: -0.0071, aov: 0.0013 }], ['T-shirt default', { cvr: -0.0058, eng: 0.1332, rpv: -0.0020, aov: 0.0034 }], ['Topic runs a search', { cvr: -0.0111, eng: 0.1507, rpv: -0.0187, aov: -0.0081 }]] },
  '1580138': { goal: 'rpv', verdict: ['early', 'Too early'], next: 'Read again Wed Nov 4, after a full week. Day one was down about 9% and day two flipped up, so expect swings.', decides: 'Customer team',
    m: { rpv: { v: 0.0270, s: 'early', a: 17.31, b: 17.78, f: 'usd', note: 'Revenue per visitor, about 13,600 cart visitors over two days. Fewer badges: +1.5%. Not significant, and Amplitude\'s own revenue metric has a broken error bar.' },
         cvr: { v: 0.0257, s: 'ns', a: 0.4206, b: 0.4314, name: 'Cart to order rate', note: 'All badges +2.6%, fewer badges −1.0%. Neither is significant.' },
         aov: { v: 0.0029, s: 'nb', a: 40.48, b: 40.59, f: 'usd', note: 'Revenue ÷ orders. All badges +0.3%, fewer badges +1.9%.' } },
    vrows: [['Cross-sell, all badges', { rpv: 0.0270, cvr: 0.0257, aov: 0.0029 }], ['Cross-sell, fewer badges', { rpv: 0.0148, cvr: -0.0098, aov: 0.0188 }]] },
  '1492400': { goal: 'cvr', verdict: ['paused', 'Paused until the next sale'], next: 'Collects on sale days only, so it picks up again with the next sale.', decides: 'Customer team',
    m: { rpv: { v: 0.0200, s: 'nb', a: 0.3372, b: 0.3439, f: 'usd', note: '48-hour timer. Whole sale +2.3%, 72-hour +1.5%.' },
         cvr: { v: 0.0194, s: 'ns', a: 0.00837, b: 0.00853, name: 'Sitewide CVR', note: '48-hour timer +1.9%, 72-hour +1.3%, whole sale +0.8%. Amplitude needs about 33 more sale days to call it.' } },
    vrows: [['Timer all sale', { cvr: 0.0082, rpv: 0.0228 }], ['Timer last 48 hours', { cvr: 0.0194, rpv: 0.0200 }], ['Timer last 72 hours', { cvr: 0.0131, rpv: 0.0150 }]] },
  '1529803': { goal: 'cvr', verdict: ['none', 'No difference'], next: 'Needs about 40 more days, past the Nov 20 freeze. Ship whichever version is simpler.', decides: 'Customer team',
    m: { rpv: { v: -0.0018, s: 'ns', a: 24.77, b: 24.72, f: 'usd', note: 'Per checkout visitor.' },
         cvr: { v: 0.0031, s: 'ns', a: 0.6125, b: 0.6144, name: 'Checkout completion rate', note: 'Orders per checkout visitor +0.0%. About 41,000 checkout visitors per group, evenly split.' },
         aov: { v: -0.0018, s: 'nb', a: 38.34, b: 38.25, f: 'usd', note: 'Revenue per visitor ÷ orders per visitor.' } } }
};

// Set by the daily refresh task.
EXPS.soon = [
  { e: '🧪', name: 'Cart tray vs cart page (A/B/C)', where: 'Cart', site: 'Both', when: 'After cross-sell ships', what: 'Where cross-sell converts best, with fewer trust signals.', refs: [{ soon: 'customer', l: 'Customer priorities' }] },
  { e: '🍎', name: 'Apple Pay buy-now on product pages', where: 'PDP', site: 'Redbubble', when: 'Scoping ends about Oct 27', what: 'One-tap checkout from product pages for peak; it would check out the whole cart and can be switched off.' }
];
// Tests Mike asked to drop from the dashboard even though they are still enabled in Amplitude.
EXPS.hide = ['1434686'];
EXPS.live = EXPS.live.filter(t => EXPS.hide.indexOf(t.id) < 0);
const REFRESH = { last: 'Sat Oct 31' };

// Search tests from Sigma ("[GA4] Search Experiments", read only through the Sigma connector). Read per the Search and Content
// team's guide: all search types combined by default; a KPI without stat sig is "inconclusive", never "no effect"; stat sig is not a
// decision; check the test plan before quoting numbers. Set by the daily refresh.
const SEXP = { url: 'https://app.sigmacomputing.com/teepublic/workbook/GA4-Search-Experiments-7wRanD8z9Oa0ZcLIk3FW7T', asOf: '2026-10-31',
  items: [
    { id: 'sc_autocomplete', e: '⌨️', name: 'Search autocomplete changes', site: 'TeePublic', start: '2026-06-29', end: '2026-07-14',
      what: 'More popular-search suggestions, no trending or popular labels, smaller results, and no product suggestions when no product is picked.',
      metric: 'User add-to-cart rate', base: 0.0770, users: 1353776,
      vars: [['Variant A', -0.0176, 0.127], ['Variant B', -0.0007, 1], ['Variant C', 0.0066, 1]],
      second: [['Session add-to-cart rate', [['Variant A', -0.0156], ['Variant B', 0.0042], ['Variant C', 0.0085]]], ['Search engagement rate', [['Variant A', -0.0021], ['Variant B', 0.0000], ['Variant C', 0.0170]]], ['User CVR', [['Variant A', 0.0071], ['Variant B', 0.0036], ['Variant C', -0.0142]]]],
      verdict: 'inconclusive' }
  ] };


// TeePublic A/B tests, read from the Split dashboard (https://www.teepublic.com/manage/split) on Oct 31 2026. Only tests launched in the last 30 days
// that have numbers (Mike and Jon, Oct 30): the date beside each experiment name is its launch date. Older tests and tests with no completed
// conversions are left out. Split reports each test's own conversion goal, so these rates are not sitewide CVR. conf is Split's confidence, null for "Insufficient".
const TPEXPS = { asOf: '2026-10-31', url: 'https://www.teepublic.com/manage/split', items: [
  { id: 'pdp_bestseller_badge', name: 'Bestseller badge on product pages', start: '2026-10-27', where: 'PDP', control: { p: 5726, conv: 0.0809 }, variants: [{ n: 'Title badge', p: 5962, conv: 0.0889, rel: 0.0994, conf: null }, { n: 'Gallery badge', p: 5851, conv: 0.0916, rel: 0.1329, conf: 95 }], call: ['lean', 'Gallery badge up at 95%, early'] },
  { id: 'pdp_trending_badge', name: 'Trending badge on product pages', start: '2026-10-23', where: 'PDP', control: { p: 464084, conv: 0.0120 }, variants: [{ n: 'Title badge', p: 463599, conv: 0.0123, rel: 0.0204, conf: null }, { n: 'Gallery badge', p: 462830, conv: 0.0122, rel: 0.0194, conf: null }], call: ['early', 'Too early'] },
  { id: 'thankyou_mobile_layout', name: 'Thank-you page layout on mobile', start: '2026-10-23', where: 'Thank-you page', control: { p: 10136, conv: 0.0178 }, variants: [{ n: 'Layout A', p: 10100, conv: 0.0188, rel: 0.0593, conf: null }, { n: 'Layout B', p: 10175, conv: 0.0181, rel: 0.0183, conf: null }, { n: 'Layout C', p: 10151, conv: 0.0202, rel: 0.1372, conf: null }], call: ['early', 'Too early'] }
] };
