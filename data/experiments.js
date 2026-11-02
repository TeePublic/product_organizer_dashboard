// A/B tests from Amplitude Experiment (Redbubble project 774278), pulled Nov 2 2026, 7:30 AM ET (Nov 1 the last complete day).
// cvr = Sitewide CVR (h1f2lfvq, pageview to order in a day) among exposed users. reach = estimated share of all site orders
// that come from users the test touches (exposed converters / site orders over the same days, with a 0.6 repeat-buyer factor
// calibrated on the two site-wide tests, capped at 100%). site = cvr lift x reach = what the variant does to whole-site CVR.
const EXPS = { metricNote: 'Each test has a primary metric (what it was built to move) and secondary metrics. The number that matters most is the whole-site impact. Conversion tests are judged on whole-site CVR; cross-sell and upsell tests on revenue per visitor and order value, since they aim to grow the basket, not the number of buyers.', asOf: 'Nov 2', tpNote: 'TeePublic\'s live tests (Beam in cart, Rokt Pay+ at checkout, the product-page trending tag and post-purchase cross-sell layouts) are not run in Amplitude Experiment, so this list is Redbubble only.',
  live: [
    { id: '1580138', kind: 'aov', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.4580, b: 0.4511, rel: -0.0152, f: 'pct' }, { name: 'Order value', a: 40.68, b: 41.49, rel: 0.0199, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: null, name: 'Sticker cross-sell in the cart', where: 'Cart page', start: '2026-10-29', status: 'running', owners: 'Jon',
      hyp: 'Offering stickers to add in the cart grows the basket. A second version also trims the trust badges to make room.',
      primary: { name: 'Revenue per user', a: 19.25, b: 19.26, rel: 0.0004 }, cvr: { a: 0.4580, b: 0.4511, rel: -0.0152 }, reach: 0.57,
      variants: [['Cross-sell, all badges', 0.0004], ['Cross-sell, fewer badges', -0.0122]],
      n: 30331, sig: false, call: 'Four days (Oct 29 to Nov 1, about 30,300 cart visitors): revenue per visitor is +0.0% with all badges and -1.2% with fewer badges, and Sitewide CVR is -1.5% and -2.2%; none is significant (under 50% confidence for both). Order value is up about 2.0% with all badges and 1.1% with fewer badges, but Amplitude can\'t put a reliable error bar on it. Too early to tell (under 50%); no time to 95% estimate yet.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1580138' },
    { id: '1529803', kind: 'cvr', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.6196, b: 0.6203, rel: 0.0011, f: 'pct' }], rpuNote: 'Revenue per user is not tracked on this test.', p: 1.0, name: 'Remove "Return to cart" on checkout', where: 'Checkout', start: '2026-10-14', status: 'running', owners: 'Oliver, Allison',
      hyp: 'Taking the exit link off checkout keeps people moving to the order.',
      primary: { name: 'Orders per checkout visitor', a: 0.6523, b: 0.6523, rel: -0.0001 }, cvr: { a: 0.6196, b: 0.6203, rel: 0.0011 }, reach: 0.68,
      n: 89424, sig: false, call: 'Still flat after 19 days (Oct 14 to Nov 1, about 89,400 checkout visitors): orders per checkout visitor -0.0% and Sitewide CVR +0.1%, neither significant (under 50% confidence, no group imbalance). Revenue per visitor is -0.5%, but Amplitude can\'t put a reliable error bar on it. Amplitude puts it at about 19 more days on average (17 to 39), which lands at or past the Nov 20 code freeze, so it is unlikely to give a clear answer before peak.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1529803' },
    { id: '1409398', kind: 'cvr', sec: [{ name: 'Revenue per user', a: 0.4937, b: 0.4891, rel: -0.0093, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: 1.0, name: 'Topics-first navigation', where: 'Site nav, every page', start: '2026-10-07', status: 'running', owners: 'Jon',
      hyp: 'Shopping by topic instead of product type gets more people into the catalog and buying.',
      primary: { name: 'Sitewide CVR', a: 0.01288, b: 0.01276, rel: -0.0095 }, cvr: { a: 0.01288, b: 0.01276, rel: -0.0095 }, reach: 1,
      variants: [['Topics nav', -0.0095], ['Topic defaults to T-shirts', -0.0047], ['Topic runs a search', -0.0116]],
      n: 7859445, sig: false, call: 'Day 26: all three variants sit slightly below no change on CVR (-0.9%, -0.5%, -1.2%; none significant) and on revenue per user (-0.9% for the topics nav, -0.2% for the T-shirt default, -1.5% for the search variant, which stays the weakest). Nav engagement is up 13% to 15% in all three, significant. Amplitude suggests rolling back and says about 40 more days to read CVR. It still flags uneven group sizes, so read it loosely.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1409398' },
    { id: '1492400', kind: 'cvr', sec: [{ name: 'Revenue per user', a: 0.3437, b: 0.3507, rel: 0.0204, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: 1.0, name: 'Sale banner countdown timer', where: 'Sale banner, every page', start: '2026-10-06', status: 'running', owners: 'Milan, Jon',
      hyp: 'A fresher banner with a timer beats banner blindness. Testing how long the timer should show.',
      primary: { name: 'Sitewide CVR', a: 0.00846, b: 0.00864, rel: 0.0209 }, cvr: { a: 0.00846, b: 0.00864, rel: 0.0209 }, reach: 1,
      variants: [['Timer all sale', 0.0092], ['Timer last 48 hours', 0.0209], ['Timer last 72 hours', 0.0145]],
      n: 8459319, sig: false, call: 'Only collects during sales; the last sale ended Oct 26, and Amplitude shows exposures picking back up on Nov 1 (about 22,000 per group) as Redbubble\'s Pre-Cyber sale starts. All three timers sit ahead of no timer, with the 48-hour timer leading at about +2.1% CVR and +2.0% revenue per user. CVR is not significant (under 50% confidence); Amplitude says about 21 more sale days to read the 48-hour timer (12 to 32).',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1492400' },
    { id: '1569370', kind: 'aov', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.018636, b: 0.018138, rel: -0.0267, f: 'pct' }, { name: 'Revenue per user', a: 0.9872, b: 0.9973, rel: 0.0103, f: 'usd' }], p: null, name: 'T-shirt style pills on product pages', where: 'PDP', start: '2026-10-27', status: 'running', owners: 'Jon, Allison, Oliver',
      hyp: 'Showing every T-shirt style up front with fit labels, instead of the style picker pop-up, makes choosing easier and nudges people to premium styles.',
      primary: { name: 'Revenue per user', a: 0.9872, b: 0.9973, rel: 0.0103 }, cvr: { a: 0.018636, b: 0.018138, rel: -0.0267 }, reach: 0.34,
      n: 416280, sig: false, call: 'Six days (Oct 27 to Nov 1, about 416,300 visitors): style pills lead on revenue per visitor (+1.0%) and order value (+3.9%), but neither is significant, and add to cart on the PDP is down 7.1% with over 99% confidence. Sitewide CVR is -2.7%, not significant. Amplitude flags a sample ratio mismatch (51% of visitors in the test group, 49% in control) and targeting edits during the test, so read it loosely. Amplitude can\'t estimate time to 95% yet.',
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
// "AOV". Pulled from Amplitude Experiment, Nov 2 (Nov 1 the last complete day).
EXPS.reads = {
  '1569370': { goal: 'rpv', verdict: ['mixed', 'Order value up, add to cart down'], next: 'Read again Wed Nov 4, after 2 more days. If add to cart stays down at 95%+ while revenue per visitor stays flat, the pills cost more orders than they add in order value. Finance to check the extra order value isn\'t lower-margin tees.', decides: 'Customer team, with Finance on margin', flag: 'Uneven group sizes (Amplitude flags a sample ratio mismatch, 51% to 49%) and targeting edits on Oct 27 and late Oct 30, so read it loosely.',
    m: { rpv: { v: 0.0103, s: 'ns', a: 0.9872, b: 0.9973, f: 'usd', note: 'Revenue per visitor. Amplitude\'s headline +1.0% "roll out" comes from a revenue metric with a broken error bar; this is the version with a working one, and it could still be noise.' },
         cvr: { v: -0.0270, s: 'ns', a: 0.018288, b: 0.017794, name: 'PDP to order rate', note: 'Sitewide CVR for people in the test is -2.7%, also not significant.' },
         atc: { v: -0.0713, s: 'sig', c: 99, a: 0.0471, b: 0.0438, name: 'Add to cart rate (PDP)', note: 'Over 99% confidence it\'s lower. Steering people to pricier styles can lower add to cart while raising order value, which is what TeePublic saw.' },
         aov: { v: 0.0389, s: 'nb', a: 51.61, b: 53.62, f: 'usd', note: 'Revenue ÷ orders. Amplitude\'s own "AOV" divides by everyone in the test.' } } },
  '1409398': {vdef: { 'Topics nav': 'The nav is organized by topic instead of product type.', 'T-shirt default': 'Clicking a topic opens the regular T-shirt results for it, whatever the mix would be.', 'Topic runs a search': 'Clicking a topic runs a normal search for it, so results mix product types (more stickers show up) and the system picks the style.' },  goal: 'cvr', verdict: ['mixed', 'Engagement up, CVR flat'], next: 'Decide whether +13% engagement is worth flat CVR (more engaged visitors feed retargeting). Check revenue per buyer on the T-shirt default.', decides: 'Exec team (the board asked for this test)', flag: 'Uneven group sizes, so read it loosely.',
    m: { rpv: { v: -0.0093, s: 'nb', a: 0.4937, b: 0.4891, f: 'usd', note: 'Topics nav −0.9%, T-shirt default −0.2%, topic runs a search −1.5%.' },
         cvr: { v: -0.0095, s: 'ns', a: 0.01288, b: 0.01276, name: 'Sitewide CVR', note: 'Topics nav −0.9%, T-shirt default −0.5%, topic runs a search −1.2%. None is significant.' },
         atc: { v: -0.0090, s: 'ns', a: 0.03288, b: 0.03259, name: 'Add to cart rate (sitewide)', note: 'Topics nav −0.9%, T-shirt default −1.1%, topic runs a search −0.7%.' },
         aov: { v: 0.0001, s: 'nb', a: 38.33, b: 38.34, f: 'usd', name: 'Revenue per buyer', note: 'Revenue ÷ buyers (this test doesn\'t count orders). Topics nav +0.0%, T-shirt default +0.3%, topic runs a search −0.3%. So the T-shirt default does not raise order value by much.' },
         eng: { v: 0.1293, s: 'sig', a: 0.01376, b: 0.01554, name: 'Nav engagement', note: 'Share of visitors who click the nav. All three versions are up 13% to 15%, all significant.' } },
    vrows: [['Topics nav', { cvr: -0.0095, eng: 0.1293, rpv: -0.0093, aov: 0.0001 }], ['T-shirt default', { cvr: -0.0047, eng: 0.1339, rpv: -0.0017, aov: 0.0029 }], ['Topic runs a search', { cvr: -0.0116, eng: 0.1501, rpv: -0.0146, aov: -0.0031 }]] },
  '1580138': { goal: 'rpv', verdict: ['early', 'Too early'], next: 'Read again Thu Nov 5, after a full week. Daily results keep swinging between the versions, so expect more swings.', decides: 'Customer team',
    m: { rpv: { v: 0.0004, s: 'early', a: 19.25, b: 19.26, f: 'usd', note: 'Revenue per visitor, about 30,300 cart visitors over four days. Fewer badges: −1.2%. Not significant, and Amplitude\'s own revenue metric has a broken error bar.' },
         cvr: { v: -0.0165, s: 'ns', a: 0.4538, b: 0.4462, name: 'Cart to order rate', note: 'All badges −1.7%, fewer badges −2.3%. Neither is significant.' },
         aov: { v: 0.0199, s: 'nb', a: 40.68, b: 41.49, f: 'usd', note: 'Revenue ÷ orders. All badges +2.0%, fewer badges +1.1%.' } },
    vrows: [['Cross-sell, all badges', { rpv: 0.0004, cvr: -0.0165, aov: 0.0199 }], ['Cross-sell, fewer badges', { rpv: -0.0122, cvr: -0.0228, aov: 0.0108 }]] },
  '1492400': { goal: 'cvr', verdict: ['early', 'Collecting again with the sale'], next: 'Collects on sale days only. Exposures picked back up on Nov 1 as Redbubble\'s Pre-Cyber sale starts; Amplitude needs about 21 more sale days (12 to 32) to read the 48-hour timer.', decides: 'Customer team',
    m: { rpv: { v: 0.0204, s: 'nb', a: 0.3437, b: 0.3507, f: 'usd', note: '48-hour timer. Whole sale +2.2%, 72-hour +1.6%.' },
         cvr: { v: 0.0209, s: 'ns', a: 0.00846, b: 0.00864, name: 'Sitewide CVR', note: '48-hour timer +2.1%, 72-hour +1.5%, whole sale +0.9%. Not significant (under 50% confidence).' },
         aov: { v: 0.0011, s: 'nb', a: 38.14, b: 38.19, f: 'usd', note: 'Revenue ÷ orders. 48-hour timer +0.1%, whole sale +0.5%, 72-hour +0.0%.' } },
    vrows: [['Timer all sale', { cvr: 0.0092, rpv: 0.0216, aov: 0.0053 }], ['Timer last 48 hours', { cvr: 0.0209, rpv: 0.0204, aov: 0.0011 }], ['Timer last 72 hours', { cvr: 0.0145, rpv: 0.0160, aov: 0.0001 }]] },
  '1529803': { goal: 'cvr', verdict: ['none', 'No difference'], next: 'Needs about 19 more days (17 to 39), landing at or past the Nov 20 freeze. Ship whichever version is simpler.', decides: 'Customer team',
    m: { rpv: { v: -0.0054, s: 'nb', a: 26.14, b: 26.00, f: 'usd', note: 'Per checkout visitor. Amplitude can\'t put a reliable error bar on it.' },
         cvr: { v: 0.0013, s: 'ns', a: 0.6171, b: 0.6180, name: 'Checkout completion rate', note: 'Orders per checkout visitor -0.0%. About 44,800 checkout visitors per group, evenly split.' },
         aov: { v: -0.0053, s: 'nb', a: 40.04, b: 39.82, f: 'usd', note: 'Revenue ÷ orders.' } } }
};

// Set by the daily refresh task.
EXPS.soon = [
  { e: '🧪', name: 'Cart tray vs cart page (A/B/C)', where: 'Cart', site: 'Both', when: 'After cross-sell ships', what: 'Where cross-sell converts best, with fewer trust signals.', refs: [{ soon: 'customer', l: 'Customer priorities' }] },
  { e: '🍎', name: 'Apple Pay buy-now on product pages', where: 'PDP', site: 'Redbubble', when: 'Scoping ends about Oct 27', what: 'One-tap checkout from product pages for peak; it would check out the whole cart and can be switched off.' }
];
// Tests Mike asked to drop from the dashboard even though they are still enabled in Amplitude.
EXPS.hide = ['1434686'];
EXPS.live = EXPS.live.filter(t => EXPS.hide.indexOf(t.id) < 0);
const REFRESH = { last: 'Mon Nov 2' };

// Search tests from Sigma ("[GA4] Search Experiments", read only through the Sigma connector). Read per the Search and Content
// team's guide: all search types combined by default; a KPI without stat sig is "inconclusive", never "no effect"; stat sig is not a
// decision; check the test plan before quoting numbers. Set by the daily refresh.
const SEXP = { url: 'https://app.sigmacomputing.com/teepublic/workbook/GA4-Search-Experiments-7wRanD8z9Oa0ZcLIk3FW7T', asOf: '2026-11-02',
  items: [
    { id: 'sc_autocomplete', e: '⌨️', name: 'Search autocomplete changes', site: 'TeePublic', start: '2026-06-29', end: '2026-07-14',
      what: 'More popular-search suggestions, no trending or popular labels, smaller results, and no product suggestions when no product is picked.',
      metric: 'User add-to-cart rate', base: 0.0770, users: 1353776,
      vars: [['Variant A', -0.0176, 0.127], ['Variant B', -0.0007, 1], ['Variant C', 0.0066, 1]],
      second: [['Session add-to-cart rate', [['Variant A', -0.0156], ['Variant B', 0.0042], ['Variant C', 0.0085]]], ['Search engagement rate', [['Variant A', -0.0021], ['Variant B', 0.0000], ['Variant C', 0.0170]]], ['User CVR', [['Variant A', 0.0071], ['Variant B', 0.0036], ['Variant C', -0.0142]]]],
      verdict: 'inconclusive' }
  ] };


// TeePublic A/B tests, read from the Split dashboard (https://www.teepublic.com/manage/split) on Nov 2 2026 (7:35 AM ET). Only tests launched in the last 30 days
// that have numbers (Mike and Jon, Oct 30): the date beside each experiment name is its launch date. Older tests and tests with no completed
// conversions are left out. Split reports each test's own conversion goal, so these rates are not sitewide CVR. conf is Split's confidence, null for "Insufficient".
const TPEXPS = { asOf: '2026-11-02', url: 'https://www.teepublic.com/manage/split', items: [
  { id: 'pdp_bestseller_badge', name: 'Bestseller badge on product pages', start: '2026-10-27', where: 'PDP', control: { p: 9045, conv: 0.1095 }, variants: [{ n: 'Title badge', p: 9239, conv: 0.1059, rel: -0.0329, conf: null }, { n: 'Gallery badge', p: 9168, conv: 0.1090, rel: -0.0044, conf: null }], call: ['early', 'Both within about 3% of control, too early to tell'] },
  { id: 'pdp_trending_badge', name: 'Trending badge on product pages', start: '2026-10-23', where: 'PDP', control: { p: 546462, conv: 0.0128 }, variants: [{ n: 'Title badge', p: 545815, conv: 0.0130, rel: 0.0175, conf: null }, { n: 'Gallery badge', p: 545333, conv: 0.0130, rel: 0.0219, conf: null }], call: ['early', 'Too early'] },
  { id: 'thankyou_mobile_layout', name: 'Thank-you page layout on mobile', start: '2026-10-23', where: 'Thank-you page', control: { p: 13254, conv: 0.0176 }, variants: [{ n: 'Layout A', p: 13113, conv: 0.0184, rel: 0.0455, conf: null }, { n: 'Layout B', p: 13281, conv: 0.0180, rel: 0.0237, conf: null }, { n: 'Layout C', p: 13143, conv: 0.0200, rel: 0.1383, conf: null }], call: ['early', 'Too early'] }
] };
