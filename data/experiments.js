// A/B tests from Amplitude Experiment (Redbubble project 774278), pulled Nov 2 2026, 2:40 PM ET (Nov 1 the last complete day).
// cvr = Sitewide CVR (h1f2lfvq, pageview to order in a day) among exposed users. reach = estimated share of all site orders
// that come from users the test touches (exposed converters / site orders over the same days, with a 0.6 repeat-buyer factor
// calibrated on the two site-wide tests, capped at 100%). site = cvr lift x reach = what the variant does to whole-site CVR.
const EXPS = { metricNote: 'Each test has a primary metric (what it was built to move) and secondary metrics. The number that matters most is the whole-site impact. Conversion tests are judged on whole-site CVR; cross-sell and upsell tests on revenue per visitor and order value, since they aim to grow the basket, not the number of buyers.', asOf: 'Nov 2', tpNote: 'TeePublic\'s live tests (Beam in cart, Rokt Pay+ at checkout, the product-page trending tag and post-purchase cross-sell layouts) are not run in Amplitude Experiment, so this list is Redbubble only.',
  live: [
    { id: '1580138', kind: 'aov', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.4521, b: 0.4448, rel: -0.0162, f: 'pct' }, { name: 'Order value', a: 41.09, b: 41.62, rel: 0.0128, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: null, name: 'Sticker cross-sell in the cart', where: 'Cart page', start: '2026-10-29', status: 'running', owners: 'Jon',
      hyp: 'Offering stickers to add in the cart grows the basket. A second version also trims the trust badges to make room.',
      primary: { name: 'Revenue per user', a: 19.17, b: 19.09, rel: -0.0042 }, cvr: { a: 0.4521, b: 0.4448, rel: -0.0162 }, reach: 0.57,
      variants: [['Cross-sell, all badges', -0.0042], ['Cross-sell, fewer badges', -0.0135]],
      n: 33065, sig: false, call: 'Four days (Oct 29 to Nov 1, about 33,100 cart visitors): revenue per visitor is -0.4% with all badges and -1.3% with fewer badges, and Sitewide CVR is -1.6% and -2.9%; none is significant. Order value is up about 1.3% with all badges and 1.7% with fewer badges, but Amplitude can\'t put a reliable error bar on it. Too early to tell (under 50%); no time to 95% estimate yet.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1580138' },
    { id: '1529803', kind: 'cvr', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.6220, b: 0.6222, rel: 0.0004, f: 'pct' }], rpuNote: 'Revenue per user is not tracked on this test.', p: 1.0, name: 'Remove "Return to cart" on checkout', where: 'Checkout', start: '2026-10-14', status: 'running', owners: 'Oliver, Allison',
      hyp: 'Taking the exit link off checkout keeps people moving to the order.',
      primary: { name: 'Orders per checkout visitor', a: 0.6597, b: 0.6551, rel: -0.0070 }, cvr: { a: 0.6220, b: 0.6222, rel: 0.0004 }, reach: 0.68,
      n: 96854, sig: false, call: 'Still flat after 19 days (Oct 14 to Nov 1, about 96,900 checkout visitors): orders per checkout visitor -0.7% and Sitewide CVR +0.0%, neither significant (no group imbalance). Revenue per visitor is -1.1%, but Amplitude can\'t put a reliable error bar on it. Amplitude now puts it at 40 or more days to read, well past the Nov 20 code freeze, so it will not give a clear answer before peak.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1529803' },
    { id: '1409398', kind: 'cvr', sec: [{ name: 'Revenue per user', a: 0.4090, b: 0.4039, rel: -0.0126, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: 1.0, name: 'Topics-first navigation', where: 'Site nav, every page', start: '2026-10-07', status: 'running', owners: 'Jon',
      hyp: 'Shopping by topic instead of product type gets more people into the catalog and buying.',
      primary: { name: 'Sitewide CVR', a: 0.010536, b: 0.010425, rel: -0.0105 }, cvr: { a: 0.010536, b: 0.010425, rel: -0.0105 }, reach: 1,
      variants: [['Topics nav', -0.0105], ['Topic defaults to T-shirts', -0.0041], ['Topic runs a search', -0.0119]],
      n: 10211806, sig: false, call: 'Day 26: all three variants sit slightly below no change on CVR (-1.1%, -0.4%, -1.2%; none significant) and on revenue per user (-1.3% for the topics nav, -0.7% for the T-shirt default, -1.9% for the search variant, which stays the weakest). Nav engagement is up 7% to 9% in all three, significant. Amplitude suggests rolling back and says about 40 more days to read CVR. It still flags uneven group sizes, so read it loosely.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1409398' },
    { id: '1569370', kind: 'aov', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.011126, b: 0.010961, rel: -0.0149, f: 'pct' }, { name: 'Revenue per user', a: 0.5874, b: 0.5961, rel: 0.0149, f: 'usd' }], p: null, name: 'T-shirt style pills on product pages', where: 'PDP', start: '2026-10-27', status: 'running', owners: 'Jon, Allison, Oliver',
      hyp: 'Showing every T-shirt style up front with fit labels, instead of the style picker pop-up, makes choosing easier and nudges people to premium styles.',
      primary: { name: 'Revenue per user', a: 0.5874, b: 0.5961, rel: 0.0149 }, cvr: { a: 0.011126, b: 0.010961, rel: -0.0149 }, reach: 0.34,
      n: 744867, sig: false, call: 'Six days (Oct 27 to Nov 1, about 744,900 visitors): style pills lead on revenue per visitor (+1.5%) and order value (+3.9%), but neither is significant, and add to cart on the PDP is down 6.3% with over 99% confidence. Sitewide CVR is -1.5%, not significant. Amplitude flags a sample ratio mismatch (51% of visitors in the test group, 49% in control) and targeting edits during the test, so read it loosely. Amplitude can\'t estimate time to 95% yet.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1569370' },
    { id: '1434686', kind: 'cvr', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.02267, b: 0.02267, rel: -0.0001, f: 'pct' }, { name: 'Revenue per user', a: 0.9671, b: 0.9647, rel: -0.0024, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: 0.67, name: 'Mobile color swatches shown by default', where: 'PDP, mobile', start: '2026-09-11', status: 'running', owners: 'Jon, Allison',
      hyp: 'Showing every color without the "+N colors" tap makes it easier to pick and buy.',
      primary: { name: 'PDP to order rate', a: 0.02239, b: 0.02233, rel: -0.0027 }, cvr: { a: 0.02267, b: 0.02267, rel: -0.0001 }, reach: 0.76,
      n: 6359340, sig: false, call: 'Six weeks in and dead flat. Call it: ship whichever is simpler to maintain.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1434686' }
  ],
  done: [
    { id: '1492400', kind: 'cvr', sec: [{ name: 'Revenue per user', a: 0.3437, b: 0.3507, rel: 0.0204, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: 1.0, name: 'Sale banner countdown timer', where: 'Sale banner, every page', start: '2026-10-06', end: '2026-11-02', status: 'shipped', owners: 'Milan, Jon',
      hyp: 'A fresher banner with a timer beats banner blindness. Testing how long the timer should show.',
      primary: { name: 'Sitewide CVR', a: 0.00846, b: 0.00864, rel: 0.0209 }, cvr: { a: 0.00846, b: 0.00864, rel: 0.0209 }, reach: 1,
      variants: [['Timer all sale', 0.0092], ['Timer last 48 hours', 0.0209], ['Timer last 72 hours', 0.0145]],
      n: 8459319, sig: false, call: 'Shipped the 48-hour timer: rolled out to everyone on Nov 2, on a positive but not significant read (+2.1% CVR and +2.0% revenue per user against no timer, under 50% confidence). It only collected on sale days.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1492400' },
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
// "AOV". Pulled from Amplitude Experiment, Nov 2, 2:40 PM ET (Nov 1 the last complete day).
EXPS.reads = {
  '1569370': {dev:{desktop:{n:[295777,306928],rpv:{v:-0.0085668,s:'nb',a:0.22789,b:0.22594,f:'usd'},atc:{v:-0.045615,s:'ns',a:0.0087735,b:0.0083733},cvr:{v:-0.013281,s:'ns',a:0.0036751,b:0.0036263},aov:{v:0.032027,s:'nb',a:59.069,b:60.961,f:'usd'}},mobile:{n:[69062,68024],rpv:{v:0.057216,s:'nb',a:2.0825,b:2.2017,f:'usd'},atc:{v:-0.032405,s:'ns',a:0.10887,b:0.10535},cvr:{v:0.014903,s:'ns',a:0.041238,b:0.041853},aov:{v:0.042472,s:'nb',a:49.329,b:51.424,f:'usd'}}},  goal: 'rpv', verdict: ['mixed', 'Order value up, add to cart down'], next: 'Read again Wed Nov 4, after 2 more days. If add to cart stays down at 95%+ while revenue per visitor stays flat, the pills cost more orders than they add in order value. Finance to check the extra order value isn\'t lower-margin tees.', decides: 'Customer team, with Finance on margin', flag: 'Uneven group sizes (Amplitude flags a sample ratio mismatch, 51% to 49%) and targeting edits on Oct 27 and late Oct 30, so read it loosely.',
    m: { rpv: { v: 0.0149, s: 'nb', a: 0.5874, b: 0.5961, f: 'usd', note: 'Revenue per visitor. Amplitude\'s headline +0.7% "roll out" comes from a revenue metric with a broken error bar; this is the version with a working one (+1.5%), and it could still be noise.' },
         cvr: { v: -0.0164, s: 'ns', a: 0.010925, b: 0.010746, name: 'PDP to order rate', note: 'Sitewide CVR for people in the test is -1.5%, also not significant.' },
         atc: { v: -0.0627, s: 'sig', c: 99, a: 0.0281, b: 0.0264, name: 'Add to cart rate (PDP)', note: 'Over 99% confidence it\'s lower. Steering people to pricier styles can lower add to cart while raising order value, which is what TeePublic saw.' },
         aov: { v: 0.0394, s: 'nb', a: 52.19, b: 54.25, f: 'usd', note: 'Revenue ÷ orders. Amplitude\'s own "AOV" divides by everyone in the test.' } } },
  '1409398': {dev:{desktop:{n:[1511258,1513085], vers:{'Topics nav':{cvr:-0.008858,rpv:-0.01508,atc:-0.002913,eng:-0.2254,aov:-0.009482},'T-shirt default':{cvr:-0.01779,rpv:-0.0279,atc:-0.01238,eng:-0.2308,aov:-0.01536},'Topic runs a search':{cvr:-0.02847,rpv:-0.04021,atc:-0.01255,eng:-0.2114,aov:-0.01434}},cvr:{v:-0.0088583,s:'ns',a:0.0045783,b:0.0045377},rpv:{v:-0.015084,s:'nb',a:0.20242,b:0.19937,f:'usd'},atc:{v:-0.0029131,s:'ns',a:0.010849,b:0.010818},eng:{v:-0.22542,s:'sig',a:0.010898,b:0.008441},aov:{v:-0.0062849,s:'nb',a:44.214,b:43.936,f:'usd'}},mobile:{n:[1033524,1035381], vers:{'Topics nav':{cvr:-0.01282,rpv:-0.01452,atc:-0.01366,eng:0.3513,aov:-0.007065},'T-shirt default':{cvr:-0.002551,rpv:-0.005458,atc:-0.01098,eng:0.3621,aov:-0.005829},'Topic runs a search':{cvr:-0.01024,rpv:-0.01528,atc:-0.01064,eng:0.3658,aov:-0.005497}},cvr:{v:-0.012815,s:'ns',a:0.019366,b:0.019118},rpv:{v:-0.014517,s:'nb',a:0.71497,b:0.70459,f:'usd'},atc:{v:-0.013657,s:'ns',a:0.050394,b:0.049705},eng:{v:0.35128,s:'sig',a:0.015007,b:0.020279},aov:{v:-0.0017280,s:'nb',a:36.920,b:36.856,f:'usd'}}}, vdef: { 'Topics nav': 'The nav is organized by topic instead of product type.', 'T-shirt default': 'Clicking a topic opens the regular T-shirt results for it, whatever the mix would be.', 'Topic runs a search': 'Clicking a topic runs a normal search for it, so results mix product types (more stickers show up) and the system picks the style.' },  goal: 'rpv', verdict: ['mixed', 'Engagement up, CVR flat'], next: 'Decide whether +7% to 9% engagement is worth flat CVR (more engaged visitors feed retargeting). Check revenue per buyer on the T-shirt default.', decides: 'Exec team (the board asked for this test)', flag: 'Uneven group sizes, so read it loosely.',
    m: { rpv: { v: -0.0126, s: 'nb', a: 0.4090, b: 0.4039, f: 'usd', note: 'Topics nav −1.3%, T-shirt default −0.7%, topic runs a search −1.9%.' },
         cvr: { v: -0.0105, s: 'ns', a: 0.010536, b: 0.010425, name: 'Sitewide CVR', note: 'Topics nav −1.1%, T-shirt default −0.4%, topic runs a search −1.2%. None is significant.' },
         atc: { v: -0.0103, s: 'ns', a: 0.02689, b: 0.02661, name: 'Add to cart rate (sitewide)', note: 'Topics nav −1.0%, T-shirt default −1.0%, topic runs a search −0.9%.' },
         aov: { v: -0.0021, s: 'nb', a: 38.82, b: 38.74, f: 'usd', name: 'Revenue per buyer', note: 'Revenue ÷ buyers (this test doesn\'t count orders). Topics nav −0.2%, T-shirt default −0.3%, topic runs a search −0.7%. So the T-shirt default does not raise order value.' },
         eng: { v: 0.0717, s: 'sig', a: 0.012496, b: 0.013392, name: 'Nav engagement', note: 'Share of visitors who click the nav. All three versions are up 7% to 9%, all significant.' } },
    vrows: [['Topics nav', { cvr: -0.0105, eng: 0.0717, rpv: -0.0126, aov: -0.0021 }], ['T-shirt default', { cvr: -0.0041, eng: 0.0776, rpv: -0.0074, aov: -0.0033 }], ['Topic runs a search', { cvr: -0.0119, eng: 0.0905, rpv: -0.0191, aov: -0.0073 }]] },
  '1580138': {dev:{desktop:{n:[3207,3293], vers:{'Cross-sell, all badges':{rpv:-0.04911,cvr:-0.02973,aov:-0.02152},'Cross-sell, fewer badges':{rpv:-0.0483,cvr:-0.06261,aov:0.02594}},rpv:{v:-0.049107,s:'nb',a:20.447,b:19.443,f:'usd'},cvr:{v:-0.029734,s:'ns',a:0.41971,b:0.40723},aov:{v:-0.021524,s:'nb',a:46.538,b:45.536,f:'usd'}},mobile:{n:[7514,7572], vers:{'Cross-sell, all badges':{rpv:0.01938,cvr:-0.01368,aov:0.03343},'Cross-sell, fewer badges':{rpv:0.01066,cvr:-0.01298,aov:0.0208}},rpv:{v:0.019379,s:'nb',a:18.503,b:18.861,f:'usd'},cvr:{v:-0.013681,s:'ns',a:0.46061,b:0.45431},aov:{v:0.033432,s:'nb',a:38.657,b:39.949,f:'usd'}}},  goal: 'rpv', verdict: ['early', 'Too early'], next: 'Read again Thu Nov 5, after a full week. Daily results keep swinging between the versions, so expect more swings.', decides: 'Customer team',
    m: { rpv: { v: -0.0042, s: 'nb', a: 19.17, b: 19.09, f: 'usd', note: 'Revenue per visitor, about 33,100 cart visitors over four days. Fewer badges: −1.3%. Not significant, and Amplitude\'s own revenue metric has a broken error bar.' },
         cvr: { v: -0.0175, s: 'ns', a: 0.4477, b: 0.4399, name: 'Cart to order rate', note: 'All badges −1.7%, fewer badges −2.9%. Neither is significant.' },
         aov: { v: 0.0128, s: 'nb', a: 41.09, b: 41.62, f: 'usd', note: 'Revenue ÷ orders. All badges +1.3%, fewer badges +1.7%.' } },
    vrows: [['Cross-sell, all badges', { rpv: -0.0042, cvr: -0.0175, aov: 0.0128 }], ['Cross-sell, fewer badges', { rpv: -0.0135, cvr: -0.0291, aov: 0.0166 }]] },
  '1492400': {dev:{desktop:{n:[1576608,1572321], vers:{'Timer all sale':{cvr:-0.006329,rpv:0.02883},'Timer last 48 hours':{cvr:-0.008087,rpv:-0.006275},'Timer last 72 hours':{cvr:-0.01173,rpv:-0.005037}},cvr:{v:-0.0080874,s:'ns',a:0.0029995,b:0.0029752},rpv:{v:-0.0062752,s:'nb',a:0.14097,b:0.14009,f:'usd'}},mobile:{n:[508582,508850], vers:{'Timer all sale':{cvr:0.01322,rpv:0.0205},'Timer last 48 hours':{cvr:0.02829,rpv:0.03251},'Timer last 72 hours':{cvr:0.02311,rpv:0.02619}},cvr:{v:0.028292,s:'ns',a:0.025504,b:0.026226},rpv:{v:0.032507,s:'nb',a:0.96372,b:0.99505,f:'usd'}}},  goal: 'rpv', verdict: ['ship', 'Shipped the 48-hour timer'], next: 'Rolled out to everyone on Nov 2. Next: the refreshed, larger banner in a new color.', decides: 'Customer team',
    m: { rpv: { v: 0.0204, s: 'nb', a: 0.3437, b: 0.3507, f: 'usd', note: '48-hour timer. Whole sale +2.2%, 72-hour +1.6%.' },
         cvr: { v: 0.0209, s: 'ns', a: 0.00846, b: 0.00864, name: 'Sitewide CVR', note: '48-hour timer +2.1%, 72-hour +1.5%, whole sale +0.9%. Not significant (under 50% confidence).' },
         aov: { v: 0.0011, s: 'nb', a: 38.14, b: 38.19, f: 'usd', note: 'Revenue ÷ orders. 48-hour timer +0.1%, whole sale +0.5%, 72-hour +0.0%.' } },
    vrows: [['Timer all sale', { cvr: 0.0092, rpv: 0.0216, aov: 0.0053 }], ['Timer last 48 hours', { cvr: 0.0209, rpv: 0.0204, aov: 0.0011 }], ['Timer last 72 hours', { cvr: 0.0145, rpv: 0.0160, aov: 0.0001 }]] },
  '1529803': {dev:{desktop:{n:[14488,14383],cvr:{v:-0.014307,s:'ns',a:0.70148,b:0.69144},rpv:{v:-0.016556,s:'nb',a:30.729,b:30.22,f:'usd'}},mobile:{n:[33188,33139],cvr:{v:-0.003272,s:'ns',a:0.64156,b:0.63946},rpv:{v:0.0034007,s:'nb',a:23.236,b:23.315,f:'usd'}}},  goal: 'rpv', verdict: ['none', 'No difference'], next: 'Needs 40 or more days, well past the Nov 20 freeze. Ship whichever version is simpler.', decides: 'Customer team',
    m: { rpv: { v: -0.0106, s: 'nb', a: 24.57, b: 24.31, f: 'usd', note: 'Per checkout visitor. Amplitude can\'t put a reliable error bar on it.' },
         cvr: { v: 0.0006, s: 'ns', a: 0.6196, b: 0.6199, name: 'Checkout completion rate', note: 'Orders per checkout visitor -0.7%. About 48,400 checkout visitors per group, evenly split.' },
         aov: { v: -0.0037, s: 'nb', a: 37.25, b: 37.11, f: 'usd', note: 'Revenue ÷ orders.' } } }
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


// TeePublic A/B tests, read from the Split dashboard (https://www.teepublic.com/manage/split) on Nov 2 2026 (2:45 PM ET). Only tests launched in the last 30 days
// that have numbers (Mike and Jon, Oct 30): the date beside each experiment name is its launch date. Older tests and tests with no completed
// conversions are left out. Split reports each test's own conversion goal, so these rates are not sitewide CVR. conf is Split's confidence, null for "Insufficient".
const TPEXPS = { asOf: '2026-11-02', url: 'https://www.teepublic.com/manage/split', items: [
  { id: 'pdp_bestseller_badge', name: 'Bestseller badge on product pages', start: '2026-10-27', where: 'PDP', control: { p: 9487, conv: 0.1130 }, variants: [{ n: 'Title badge', p: 9707, conv: 0.1083, rel: -0.0418, conf: null }, { n: 'Gallery badge', p: 9627, conv: 0.1124, rel: -0.0053, conf: null }], call: ['early', 'Both within about 4% of control, too early to tell'] },
  { id: 'pdp_trending_badge', name: 'Trending badge on product pages', start: '2026-10-23', where: 'PDP', control: { p: 567827, conv: 0.0129 }, variants: [{ n: 'Title badge', p: 567170, conv: 0.0131, rel: 0.0169, conf: null }, { n: 'Gallery badge', p: 566519, conv: 0.0132, rel: 0.0247, conf: null }], call: ['early', 'Too early'] },
  { id: 'thankyou_mobile_layout', name: 'Thank-you page layout on mobile', start: '2026-10-23', where: 'Thank-you page', control: { p: 13833, conv: 0.0175 }, variants: [{ n: 'Layout A', p: 13704, conv: 0.0180, rel: 0.0303, conf: null }, { n: 'Layout B', p: 13870, conv: 0.0180, rel: 0.0303, conf: null }, { n: 'Layout C', p: 13759, conv: 0.0201, rel: 0.1466, conf: null }], call: ['early', 'Too early'] }
  ,
  { id: 'beam_ab_test_live', name: 'Beam conversion test', start: '2026-10-19', where: 'Cart', control: null, variants: [{ n: 'Version A', conf: null }, { n: 'Version B', conf: null }], call: ['early', 'Too early to tell: every metric is inside its margin of error'],
    statsig: { url: 'https://console.statsig.com/shared_report/o5gEO9yaWHK?ref=pulse_public_share&experiment_name=beam_ab_test_live&custom_query_id=2uH7MYmCac7TZsUVzRLEcw', portal: 'https://partner-portal.beamimpact.com/overview', through: '2026-11-01', exposures: '9.78M', split: 'about a third of shoppers each in control, Version A and Version B', ci: 90,
      beam: { asOf: '2026-11-02', month: 'October', aovNo: 36.75, aovBeam: 44.02, aovLift: 0.198, ccrBeam: 0.583, ccrNo: 0.330, users: 210, redeemed: 1585, donated: 699, rate: 0.02 },
      metrics: [{ name: 'Total revenue', a: 0.017, aw: 0.033, b: -0.003, bw: 0.033 }, { name: 'Average order value', a: 0.013, aw: 0.021, b: 0.003, bw: 0.021 }, { name: 'Conversions', a: 0.005, aw: 0.025, b: -0.006, bw: 0.025 }, { name: 'Cart CVR', a: 0.006, aw: 0.022, b: 0.005, bw: 0.022 }] } }
] };
