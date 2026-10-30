// A/B tests from Amplitude Experiment (Redbubble project 774278), pulled Oct 30 2026 (Oct 29 a complete day).
// cvr = Sitewide CVR (h1f2lfvq, pageview to order in a day) among exposed users. reach = estimated share of all site orders
// that come from users the test touches (exposed converters / site orders over the same days, with a 0.6 repeat-buyer factor
// calibrated on the two site-wide tests, capped at 100%). site = cvr lift x reach = what the variant does to whole-site CVR.
const EXPS = { metricNote: 'Each test has a primary metric (what it was built to move) and secondary metrics. The number that matters most is the whole-site impact. Conversion tests are judged on whole-site CVR; cross-sell and upsell tests on revenue per visitor and order value, since they aim to grow the basket, not the number of buyers.', asOf: 'Oct 30', tpNote: 'TeePublic\'s live tests (Beam in cart, Rokt Pay+ at checkout, the product-page trending tag and post-purchase cross-sell layouts) are not run in Amplitude Experiment, so this list is Redbubble only.',
  live: [
    { id: '1580138', kind: 'aov', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.3980, b: 0.3854, rel: -0.0318, f: 'pct' }, { name: 'Order value', a: 41.00, b: 38.23, rel: -0.0674, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: null, name: 'Sticker cross-sell in the cart', where: 'Cart page', start: '2026-10-29', status: 'running', owners: 'Jon',
      hyp: 'Offering stickers to add in the cart grows the basket. A second version also trims the trust badges to make room.',
      primary: { name: 'Revenue per user', a: 16.60, b: 15.10, rel: -0.0907 }, cvr: { a: 0.3980, b: 0.3854, rel: -0.0318 }, reach: 0.57,
      variants: [['Cross-sell, all badges', -0.0907], ['Cross-sell, fewer badges', -0.0644]],
      n: 5326, sig: false, call: 'Day one (switched on the afternoon of Oct 29, about 5,300 cart visitors): both cross-sell versions trail no cross-sell on revenue per user (about -9% with all badges, -6% with fewer badges) and on order value, and Sitewide CVR is a few points lower but not significant. Amplitude suggests rolling back, but it can\'t put a reliable error bar on revenue per user and one partial day is too early to read.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1580138' },
    { id: '1529803', kind: 'cvr', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.6125, b: 0.6146, rel: 0.0034, f: 'pct' }], rpuNote: 'Revenue per user is not tracked on this test.', p: 1.0, name: 'Remove "Return to cart" on checkout', where: 'Checkout', start: '2026-10-14', status: 'running', owners: 'Oliver, Allison',
      hyp: 'Taking the exit link off checkout keeps people moving to the order.',
      primary: { name: 'Orders per checkout visitor', a: 0.6429, b: 0.6435, rel: 0.0010 }, cvr: { a: 0.6125, b: 0.6146, rel: 0.0034 }, reach: 0.68,
      n: 78214, sig: false, call: 'Still flat after 16 days: orders per checkout visitor +0.1% and Sitewide CVR +0.3%, neither significant (no group imbalance). Amplitude puts it at about 40 more days to read, well past the code freeze, so it is unlikely to give a clear answer before peak.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1529803' },
    { id: '1409398', kind: 'cvr', sec: [{ name: 'Revenue per user', a: 0.5004, b: 0.4991, rel: -0.0027, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: 1.0, name: 'Topics-first navigation', where: 'Site nav, every page', start: '2026-10-07', status: 'running', owners: 'Jon',
      hyp: 'Shopping by topic instead of product type gets more people into the catalog and buying.',
      primary: { name: 'Sitewide CVR', a: 0.013200, b: 0.013123, rel: -0.0058 }, cvr: { a: 0.013200, b: 0.013123, rel: -0.0058 }, reach: 1,
      variants: [['Topics nav', -0.0058], ['Topic defaults to T-shirts', -0.0063], ['Topic runs a search', -0.0103]],
      n: 6894619, sig: false, call: 'Day 23: all three variants still sit slightly below no change on CVR (none significant) and on revenue per user (about -0.3% for the topics nav, -1.8% for the search variant, which stays the weakest). Amplitude now suggests rolling back. Its visitor count fell to about 6.9M (15.8M on Oct 29) after the test was edited Oct 30, and it still flags uneven group sizes, so compare with earlier reads loosely.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1409398' },
    { id: '1492400', kind: 'cvr', sec: [{ name: 'Revenue per user', a: 0.3291, b: 0.3373, rel: 0.0251, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: 1.0, name: 'Sale banner countdown timer', where: 'Sale banner, every page', start: '2026-10-06', status: 'running', owners: 'Milan, Jon',
      hyp: 'A fresher banner with a timer beats banner blindness. Testing how long the timer should show.',
      primary: { name: 'Sitewide CVR', a: 0.00824, b: 0.00842, rel: 0.0223 }, cvr: { a: 0.00824, b: 0.00842, rel: 0.0223 }, reach: 1,
      variants: [['Timer all sale', 0.0105], ['Timer last 48 hours', 0.0223], ['Timer last 72 hours', 0.0143]],
      n: 8371467, sig: false, call: 'Only collects during sales, and the last sale ended Oct 26, so 0 new visitors since then; paused until the next one. All three timers finished ahead of no timer, with the 48-hour timer leading at about +2.2% CVR and +2.5% revenue per user. CVR is not significant yet; Amplitude says about 32 more sale days to read it.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1492400' },
    { id: '1569370', kind: 'aov', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.014326, b: 0.014160, rel: -0.0116, f: 'pct' }, { name: 'Revenue per user', a: 0.7521, b: 0.7688, rel: 0.0222, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: null, name: 'T-shirt style pills on product pages', where: 'Product page', start: '2026-10-27', status: 'running', owners: 'Jon, Allison, Oliver',
      hyp: 'Showing every T-shirt style up front with fit labels, instead of the style picker pop-up, makes choosing easier and nudges people to premium styles.',
      primary: { name: 'Revenue per user', a: 0.7521, b: 0.7688, rel: 0.0222 }, cvr: { a: 0.014326, b: 0.014160, rel: -0.0116 }, reach: 0.32,
      n: 241898, sig: false, call: 'Three days (Oct 27 to 29): style pills now lead on revenue per user (about +2.2%), reversing day one, while Sitewide CVR is slightly lower (-1.2%, not significant). Amplitude flags a targeting change and uneven group sizes, now counts about 242K visitors (643K on Oct 29) and can\'t put a reliable error bar on revenue per user, so treat the lead as early.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1569370' },
    { id: '1434686', kind: 'cvr', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.02267, b: 0.02267, rel: -0.0001, f: 'pct' }, { name: 'Revenue per user', a: 0.9671, b: 0.9647, rel: -0.0024, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: 0.67, name: 'Mobile color swatches shown by default', where: 'Product page, mobile', start: '2026-09-11', status: 'running', owners: 'Jon, Allison',
      hyp: 'Showing every color without the "+N colors" tap makes it easier to pick and buy.',
      primary: { name: 'Product page to order rate', a: 0.02239, b: 0.02233, rel: -0.0027 }, cvr: { a: 0.02267, b: 0.02267, rel: -0.0001 }, reach: 0.76,
      n: 6359340, sig: false, call: 'Six weeks in and dead flat. Call it: ship whichever is simpler to maintain.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1434686' }
  ],
  done: [
    { id: '1484334', kind: 'cvr', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.4807, b: 0.4765, rel: -0.0088, f: 'pct' }, { name: 'Revenue per user', a: 19.52, b: 19.59, rel: 0.0039, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: 0.61, name: 'Remove cart trust badges', where: 'Cart page', start: '2026-10-05', end: '2026-10-21', status: 'kept', owners: 'Efren, Jon',
      hyp: 'The trust badges are clutter at the cart and the space could hold cross-sell.',
      primary: { name: 'Cart to order rate', a: 0.4751, b: 0.4707, rel: -0.0093 }, cvr: { a: 0.4807, b: 0.4765, rel: -0.0088 }, reach: 1,
      n: 163456, sig: false, call: 'Kept the badges. A slight dip in CVR; retesting with cross-sell and fewer trust signals.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1484334' },
    { id: '1427597', kind: 'cvr', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.03249, b: 0.03294, rel: 0.0141, f: 'pct' }, { name: 'Revenue per user', a: 1.419, b: 1.435, rel: 0.0114, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: 0.25, name: 'Flat-lay T-shirt thumbnails in search', where: 'Search results', start: '2026-10-05', end: '2026-10-19', status: 'shipped', owners: 'Oliver, Efren, Jon',
      hyp: 'Leading with the product image, not the model, shows the design better in search results.',
      primary: { name: 'Search to order rate', a: 0.02975, b: 0.03020, rel: 0.0153 }, cvr: { a: 0.03249, b: 0.03294, rel: 0.0141 }, reach: 0.69,
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
// "AOV". Pulled from Amplitude Experiment, Oct 30.
EXPS.reads = {
  '1569370': { goal: 'rpv', verdict: ['lean', 'Promising, not proven'], next: 'Read again Tue Nov 3, after 4 to 5 more days. Finance to check the extra order value isn\'t lower-margin tees.', decides: 'Customer team, with Finance on margin', flag: 'Uneven group sizes and a targeting change on Oct 27, so read it loosely.',
    m: { rpv: { v: 0.0168, s: 'ns', a: 0.7415, b: 0.7539, f: 'usd', note: 'Amplitude\'s headline +2.2% "roll out" comes from a revenue metric with a broken error bar. This is the version with a working one: +1.7%, could still be noise.' },
         cvr: { v: -0.0149, s: 'ns', a: 0.014167, b: 0.013956, name: 'Product page to order rate' },
         atc: { v: -0.0679, s: 'ns', c: 93, a: 0.0386, b: 0.0360, name: 'Add to cart rate (product page)', note: '93% confidence it\'s lower; we call it at 95%. Steering people to pricier styles can lower add to cart while raising order value, which is what TeePublic saw.' },
         aov: { v: 0.0244, s: 'nb', a: 50.90, b: 52.14, f: 'usd', note: 'Revenue ÷ orders. Amplitude\'s own "AOV" divides by everyone in the test, which is why it showed about $0.74.' } } },
  '1409398': {vdef: { 'Topics nav': 'The nav is organized by topic instead of product type.', 'T-shirt default': 'Clicking a topic opens the regular T-shirt results for it, whatever the mix would be.', 'Topic runs a search': 'Clicking a topic runs a normal search for it, so results mix product types (more stickers show up) and the system picks the style.' },  goal: 'cvr', verdict: ['mixed', 'Engagement up, CVR flat'], next: 'Decide whether +13% engagement is worth flat CVR (more engaged visitors feed retargeting). Check revenue per buyer on the T-shirt default.', decides: 'Exec team (the board asked for this test)', flag: 'Uneven group sizes, so read it loosely.',
    m: { rpv: { v: -0.0027, s: 'nb', a: 0.5004, b: 0.4991, f: 'usd', note: 'Topics nav −0.3%, T-shirt default −0.3%, topic runs a search −1.8%.' },
         cvr: { v: -0.0058, s: 'ns', a: 0.013200, b: 0.013123, name: 'Sitewide CVR', note: 'Topics nav −0.6%, T-shirt default −0.6%, topic runs a search −1.0%. None is significant.' },
         atc: { v: -0.0063, s: 'ns', a: 0.03375, b: 0.03354, name: 'Add to cart rate (sitewide)', note: 'Topics nav −0.6%, T-shirt default −1.1%, topic runs a search −0.6%.' },
         aov: { v: 0.0032, s: 'nb', a: 37.91, b: 38.03, f: 'usd', name: 'Revenue per buyer', note: 'Revenue ÷ buyers (this test doesn\'t count orders). Topics nav +0.3%, T-shirt default +0.3%, topic runs a search −0.8%. So the T-shirt default does not raise order value.' },
         eng: { v: 0.129, s: 'sig', a: 0.01401, b: 0.01581, name: 'Nav engagement', note: 'Share of visitors who click the nav. All three versions are up 13% to 15%, all significant.' } },
    vrows: [['Topics nav', { cvr: -0.0058, eng: 0.129, rpv: -0.0027, aov: 0.0032 }], ['T-shirt default', { cvr: -0.0063, eng: 0.1321, rpv: -0.0032, aov: 0.0032 }], ['Topic runs a search', { cvr: -0.0103, eng: 0.1491, rpv: -0.0178, aov: -0.0077 }]] },
  '1580138': { goal: 'rpv', verdict: ['early', 'Too early'], next: 'Read again Wed Nov 4, after a full week.', decides: 'Customer team',
    m: { rpv: { v: -0.0907, s: 'early', a: 16.60, b: 15.10, f: 'usd', note: 'One partial day, about 5,300 cart visitors. Amplitude calls it significant, but its error bar is implausibly narrow this early. Fewer badges: −6.4%.' },
         cvr: { v: -0.0331, s: 'ns', a: 0.3951, b: 0.3820, name: 'Cart to order rate', note: 'All badges −3.3%, fewer badges −5.3%. Neither is significant.' },
         aov: { v: -0.0674, s: 'early', a: 41.00, b: 38.23, f: 'usd', note: 'Revenue ÷ orders. All badges −6.7%, fewer badges −2.5%.' } },
    vrows: [['Cross-sell, all badges', { rpv: -0.0907, cvr: -0.0331, aov: -0.0674 }], ['Cross-sell, fewer badges', { rpv: -0.0644, cvr: -0.0532, aov: -0.0247 }]] },
  '1492400': { goal: 'cvr', verdict: ['paused', 'Paused until the next sale'], next: 'Collects on sale days only, so it picks up again with the next sale.', decides: 'Customer team',
    m: { rpv: { v: 0.0251, s: 'nb', a: 0.3291, b: 0.3373, f: 'usd', note: '48-hour timer, the best of the three.' },
         cvr: { v: 0.0223, s: 'ns', a: 0.00824, b: 0.00842, name: 'Sitewide CVR', note: '48-hour timer +2.2%, 72-hour +1.4%, whole sale +1.1%. Amplitude needs about 32 more sale days to call it.' } },
    vrows: [['Timer all sale', { cvr: 0.0105 }], ['Timer last 48 hours', { cvr: 0.0223, rpv: 0.0251 }], ['Timer last 72 hours', { cvr: 0.0143 }]] },
  '1529803': { goal: 'cvr', verdict: ['none', 'No difference'], next: 'Needs 25 to 40 more days, past the Nov 20 freeze. Ship whichever version is simpler.', decides: 'Customer team',
    m: { rpv: { v: -0.0011, s: 'ns', a: 23.44, b: 23.42, f: 'usd', note: 'Per checkout visitor.' },
         cvr: { v: 0.0039, s: 'ns', a: 0.6100, b: 0.6124, name: 'Checkout completion rate', note: 'Orders per checkout visitor +0.1%. About 39,000 checkout visitors per group, evenly split.' },
         aov: { v: -0.0022, s: 'nb', a: 36.47, b: 36.39, f: 'usd', note: 'Revenue ÷ orders.' } } }
};

// Set by the daily refresh task.
EXPS.soon = [
  { e: '🧪', name: 'Cart tray vs cart page (A/B/C)', where: 'Cart', site: 'Both', when: 'After cross-sell ships', what: 'Where cross-sell converts best, with fewer trust signals.', refs: [{ soon: 'customer', l: 'Customer priorities' }] },
  { e: '🍎', name: 'Apple Pay buy-now on product pages', where: 'Product page', site: 'Redbubble', when: 'Scoping ends about Oct 27', what: 'One-tap checkout from product pages for peak; it would check out the whole cart and can be switched off.' }
];
// Tests Mike asked to drop from the dashboard even though they are still enabled in Amplitude.
EXPS.hide = ['1434686'];
EXPS.live = EXPS.live.filter(t => EXPS.hide.indexOf(t.id) < 0);
const REFRESH = { last: 'Fri Oct 30, 4:30 PM ET' };

// Search tests from Sigma ("[GA4] Search Experiments", read only through the Sigma connector). Read per the Search and Content
// team's guide: all search types combined by default; a KPI without stat sig is "inconclusive", never "no effect"; stat sig is not a
// decision; check the test plan before quoting numbers. Set by the daily refresh.
const SEXP = { url: 'https://app.sigmacomputing.com/teepublic/workbook/GA4-Search-Experiments-7wRanD8z9Oa0ZcLIk3FW7T', asOf: '2026-10-30',
  items: [
    { id: 'sc_autocomplete', e: '⌨️', name: 'Search autocomplete changes', site: 'TeePublic', start: '2026-06-29', end: '2026-07-14',
      what: 'More popular-search suggestions, no trending or popular labels, smaller results, and no product suggestions when no product is picked.',
      metric: 'User add-to-cart rate', base: 0.0770, users: 1353776,
      vars: [['Variant A', -0.0176, 0.127], ['Variant B', -0.0007, 1], ['Variant C', 0.0066, 1]],
      second: [['Session add-to-cart rate', [['Variant A', -0.0156], ['Variant B', 0.0042], ['Variant C', 0.0085]]], ['Search engagement rate', [['Variant A', -0.0021], ['Variant B', 0.0000], ['Variant C', 0.0170]]], ['User CVR', [['Variant A', 0.0071], ['Variant B', 0.0036], ['Variant C', -0.0142]]]],
      verdict: 'inconclusive' }
  ] };


// TeePublic A/B tests, read from the Split dashboard (https://www.teepublic.com/manage/split) on Oct 30 2026. Only tests launched in the last 30 days
// that have numbers (Mike and Jon, Oct 30): the date beside each experiment name is its launch date. Older tests and tests with no completed
// conversions are left out. Split reports each test's own conversion goal, so these rates are not sitewide CVR. conf is Split's confidence, null for "Insufficient".
const TPEXPS = { asOf: '2026-10-30', url: 'https://www.teepublic.com/manage/split', items: [
  { id: 'pdp_bestseller_badge', name: 'Bestseller badge on product pages', start: '2026-10-27', where: 'Product page', control: { p: 4753, conv: 0.0797 }, variants: [{ n: 'Title badge', p: 4991, conv: 0.0827, rel: 0.0377, conf: null }, { n: 'Gallery badge', p: 4932, conv: 0.0896, rel: 0.1239, conf: 90 }], call: ['lean', 'Leaning up'] },
  { id: 'pdp_trending_badge', name: 'Trending badge on product pages', start: '2026-10-23', where: 'Product page', control: { p: 452020, conv: 0.0119 }, variants: [{ n: 'Title badge', p: 451481, conv: 0.0121, rel: 0.0182, conf: null }, { n: 'Gallery badge', p: 450610, conv: 0.0121, rel: 0.017, conf: null }], call: ['early', 'Too early'] },
  { id: 'thankyou_mobile_layout', name: 'Thank-you page layout on mobile', start: '2026-10-23', where: 'Thank-you page', control: { p: 9492, conv: 0.0177 }, variants: [{ n: 'Layout A', p: 9475, conv: 0.0182, rel: 0.0256, conf: null }, { n: 'Layout B', p: 9610, conv: 0.0186, rel: 0.0524, conf: null }, { n: 'Layout C', p: 9504, conv: 0.0198, rel: 0.1176, conf: null }], call: ['early', 'Too early'] }
] };
