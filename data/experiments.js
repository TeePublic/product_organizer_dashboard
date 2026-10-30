
// A/B tests from Amplitude Experiment (Redbubble project 774278), pulled Oct 29 2026 (Oct 28 a complete day).
// cvr = Sitewide CVR (h1f2lfvq, pageview to order in a day) among exposed users. reach = estimated share of all site orders
// that come from users the test touches (exposed converters / site orders over the same days, with a 0.6 repeat-buyer factor
// calibrated on the two site-wide tests, capped at 100%). site = cvr lift x reach = what the variant does to whole-site CVR.
const EXPS = { metricNote: 'Each test has a primary metric (what it was built to move) and secondary metrics. The number that matters most is the whole-site impact. Conversion tests are judged on whole-site CVR; cross-sell and upsell tests on revenue per visitor and order value, since they aim to grow the basket, not the number of buyers.', asOf: 'Oct 29', tpNote: 'TeePublic\'s live tests (Beam in cart, Rokt Pay+ at checkout, the product-page trending tag and post-purchase cross-sell layouts) are not run in Amplitude Experiment, so this list is Redbubble only.',
  live: [
    { id: '1529803', kind: 'cvr', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.6147, b: 0.6169, rel: 0.0035, f: 'pct' }], rpuNote: 'Revenue per user is not tracked on this test.', p: 1.0, name: 'Remove "Return to cart" on checkout', where: 'Checkout', start: '2026-10-14', status: 'running', owners: 'Oliver, Allison',
      hyp: 'Taking the exit link off checkout keeps people moving to the order.',
      primary: { name: 'Orders per checkout visitor', a: 0.6505, b: 0.6476, rel: -0.0044 }, cvr: { a: 0.6147, b: 0.6169, rel: 0.0035 }, reach: 0.76,
      n: 82100, sig: false, call: 'Still flat after 15 days with sale traffic in it: orders per checkout visitor -0.4% and Sitewide CVR +0.4%, neither significant (no group imbalance). Amplitude puts it at 40+ more days to read, well past the code freeze, so it is unlikely to give a clear answer before peak.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1529803' },
    { id: '1409398', kind: 'cvr', sec: [{ name: 'Revenue per user', a: 0.2289, b: 0.2266, rel: -0.0103, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: 1.0, name: 'Topics-first navigation', where: 'Site nav, every page', start: '2026-10-07', status: 'running', owners: 'Jon',
      hyp: 'Shopping by topic instead of product type gets more people into the catalog and buying.',
      primary: { name: 'Sitewide CVR', a: 0.005942, b: 0.005914, rel: -0.0048 }, cvr: { a: 0.005942, b: 0.005914, rel: -0.0048 }, reach: 1,
      variants: [['Topics nav', -0.0048], ['Topic defaults to T-shirts', -0.0033], ['Topic runs a search', -0.0095]],
      n: 15802495, sig: false, call: 'Day 22: all three variants still sit slightly below no change on CVR (none significant), and revenue per user is lower in each (about -1% for the topics nav, -2.2% for the search variant). The search variant is still the weakest. Amplitude flags uneven group sizes because two variants started later, so read the split with care.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1409398' },
    { id: '1492400', kind: 'cvr', sec: [{ name: 'Revenue per user', a: 0.3291, b: 0.3373, rel: 0.0251, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: 1.0, name: 'Sale banner countdown timer', where: 'Sale banner, every page', start: '2026-10-06', status: 'running', owners: 'Milan, Jon',
      hyp: 'A fresher banner with a timer beats banner blindness. Testing how long the timer should show.',
      primary: { name: 'Sitewide CVR', a: 0.00824, b: 0.00842, rel: 0.0223 }, cvr: { a: 0.00824, b: 0.00842, rel: 0.0223 }, reach: 1,
      variants: [['Timer all sale', 0.0105], ['Timer last 48 hours', 0.0223], ['Timer last 72 hours', 0.0143]],
      n: 8371467, sig: false, call: 'Only collects during sales, and the last sale ended Oct 26, so 0 new visitors since then; paused until the next one. All three timers finished ahead of no timer, with the 48-hour timer leading at about +2.2% CVR and +2.5% revenue per user. CVR is not significant yet; Amplitude says about 32 more sale days to read it.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1492400' },
    { id: '1569370', kind: 'aov', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.003682, b: 0.003675, rel: -0.0019, f: 'pct' }, { name: 'Revenue per user', a: 0.2103, b: 0.1999, rel: -0.0494, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: null, name: 'T-shirt style pills on product pages', where: 'Product page', start: '2026-10-27', status: 'running', owners: 'Jon, Allison, Oliver',
      hyp: 'Showing every T-shirt style up front with fit labels, instead of the style picker pop-up, makes choosing easier and nudges people to premium styles.',
      primary: { name: 'Revenue per user', a: 0.2103, b: 0.1999, rel: -0.0494 }, cvr: { a: 0.003682, b: 0.003675, rel: -0.0019 }, reach: 0.30,
      n: 643245, sig: false, call: 'Two days of data (Oct 27 to 28). Style pills are behind on revenue per user (about -4.9%), while Sitewide CVR is level (-0.2%, not significant). Oct 28 on its own came out even on both, so the gap is mostly from day one. Amplitude suggests rolling back, but it can\'t put a reliable error bar on revenue per user, so give it a few more days before reading anything.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1569370' },
    { id: '1434686', kind: 'cvr', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.02267, b: 0.02267, rel: -0.0001, f: 'pct' }, { name: 'Revenue per user', a: 0.9671, b: 0.9647, rel: -0.0024, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: 0.67, name: 'Mobile color swatches shown by default', where: 'Product page, mobile', start: '2026-09-11', status: 'running', owners: 'Jon, Allison',
      hyp: 'Showing every color without the "+N colors" tap makes it easier to pick and buy.',
      primary: { name: 'Product page CVR', a: 0.02239, b: 0.02233, rel: -0.0027 }, cvr: { a: 0.02267, b: 0.02267, rel: -0.0001 }, reach: 0.76,
      n: 6359340, sig: false, call: 'Six weeks in and dead flat. Call it: ship whichever is simpler to maintain.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1434686' }
  ],
  done: [
    { id: '1484334', kind: 'cvr', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.4807, b: 0.4765, rel: -0.0088, f: 'pct' }, { name: 'Revenue per user', a: 19.52, b: 19.59, rel: 0.0039, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: 0.61, name: 'Remove cart trust badges', where: 'Cart page', start: '2026-10-05', end: '2026-10-21', status: 'kept', owners: 'Efren, Jon',
      hyp: 'The trust badges are clutter at the cart and the space could hold cross-sell.',
      primary: { name: 'Cart page CVR', a: 0.4751, b: 0.4707, rel: -0.0093 }, cvr: { a: 0.4807, b: 0.4765, rel: -0.0088 }, reach: 1,
      n: 163456, sig: false, call: 'Kept the badges. A slight dip in CVR; retesting with cross-sell and fewer trust signals.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1484334' },
    { id: '1427597', kind: 'cvr', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.03249, b: 0.03294, rel: 0.0141, f: 'pct' }, { name: 'Revenue per user', a: 1.419, b: 1.435, rel: 0.0114, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: 0.25, name: 'Flat-lay T-shirt thumbnails in search', where: 'Search results', start: '2026-10-05', end: '2026-10-19', status: 'shipped', owners: 'Oliver, Efren, Jon',
      hyp: 'Leading with the product image, not the model, shows the design better in search results.',
      primary: { name: 'Search page CVR', a: 0.02975, b: 0.03020, rel: 0.0153 }, cvr: { a: 0.03249, b: 0.03294, rel: 0.0141 }, reach: 0.69,
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

// Set by the daily refresh task.
EXPS.soon = [
  { e: '🛍️', name: 'Cart cross-sell carousel', where: 'Cart and cart tray', site: 'Redbubble', when: 'Set up in Amplitude Oct 28 and edited Oct 29, not switched on yet', what: 'Stickers only, on the cart page only, as a first version. Two versions against no cross-sell: the carousel as built, and one with fewer badges.', refs: [{ jira: 'DEAP-6266' }, { url: 'https://app.amplitude.com/experiment/tpub/774278/config/1574129', l: 'Amplitude Experiment' }] },
  { e: '🧪', name: 'Cart tray vs cart page (A/B/C)', where: 'Cart', site: 'Both', when: 'After cross-sell ships', what: 'Where cross-sell converts best, with fewer trust signals.', refs: [{ soon: 'customer', l: 'Customer priorities' }] },
  { e: '🍎', name: 'Apple Pay buy-now on product pages', where: 'Product page', site: 'Redbubble', when: 'Scoping ends about Oct 27', what: 'One-tap checkout from product pages for peak; it would check out the whole cart and can be switched off.' }
];
// Tests Mike asked to drop from the dashboard even though they are still enabled in Amplitude.
EXPS.hide = ['1434686'];
EXPS.live = EXPS.live.filter(t => EXPS.hide.indexOf(t.id) < 0);
const REFRESH = { last: 'Thu Oct 29, 9:20 AM ET' };

// Search tests from Sigma ("[GA4] Search Experiments", read only through the Sigma connector). Read per the Search and Content
// team's guide: all search types combined by default; a KPI without stat sig is "inconclusive", never "no effect"; stat sig is not a
// decision; check the test plan before quoting numbers. Set by the daily refresh.
const SEXP = { url: 'https://app.sigmacomputing.com/teepublic/workbook/GA4-Search-Experiments-7wRanD8z9Oa0ZcLIk3FW7T', asOf: '2026-10-29',
  items: [
    { id: 'sc_autocomplete', e: '⌨️', name: 'Search autocomplete changes', site: 'TeePublic', start: '2026-06-29', end: '2026-07-14',
      what: 'More popular-search suggestions, no trending or popular labels, smaller results, and no product suggestions when no product is picked.',
      metric: 'User add-to-cart rate', base: 0.0770, users: 1353776,
      vars: [['Variant A', -0.0176, 0.127], ['Variant B', -0.0007, 1], ['Variant C', 0.0066, 1]],
      second: [['Session add-to-cart rate', [['Variant A', -0.0156], ['Variant B', 0.0042], ['Variant C', 0.0085]]], ['Search engagement rate', [['Variant A', -0.0021], ['Variant B', 0.0000], ['Variant C', 0.0170]]], ['User CVR', [['Variant A', 0.0071], ['Variant B', 0.0036], ['Variant C', -0.0142]]]],
      verdict: 'inconclusive' }
  ] };

