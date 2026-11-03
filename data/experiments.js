// A/B tests from Amplitude Experiment (Redbubble project 774278), pulled Nov 3 2026, 8:30 AM ET (Nov 2 the last complete day).
// cvr = Sitewide CVR (h1f2lfvq, pageview to order in a day) among exposed users. reach = estimated share of all site orders
// that come from users the test touches (exposed converters / site orders over the same days, with a 0.6 repeat-buyer factor
// calibrated on the two site-wide tests, capped at 100%). site = cvr lift x reach = what the variant does to whole-site CVR.
const EXPS = { metricNote: 'Each test has a primary metric (what it was built to move) and secondary metrics. The number that matters most is the whole-site impact. Conversion tests are judged on whole-site CVR; cross-sell and upsell tests on revenue per visitor and order value, since they aim to grow the basket, not the number of buyers.', asOf: 'Nov 3', tpNote: 'TeePublic\'s live tests (Beam in cart, Rokt Pay+ at checkout, the product-page trending tag and post-purchase cross-sell layouts) are not run in Amplitude Experiment, so this list is Redbubble only.',
  live: [
    { id: '1580138', kind: 'aov', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.4642, b: 0.4583, rel: -0.0126, f: 'pct' }, { name: 'Order value', a: 40.38, b: 40.59, rel: 0.0053, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: null, name: 'Sticker cross-sell in the cart', where: 'Cart page', start: '2026-10-29', status: 'running', owners: 'Jon',
      hyp: 'Offering stickers to add in the cart grows the basket. A second version also trims the trust badges to make room.',
      primary: { name: 'Revenue per user', a: 19.33, b: 19.19, rel: -0.0074 }, cvr: { a: 0.4642, b: 0.4583, rel: -0.0126 }, reach: 0.57,
      variants: [['Cross-sell, all badges', -0.0074], ['Cross-sell, fewer badges', -0.0082]],
      n: 45835, sig: false, call: 'Five days (Oct 29 to Nov 2, about 45,800 cart visitors): revenue per visitor is -0.7% with all badges and -0.8% with fewer badges, and Sitewide CVR is -1.3% and -2.5%; none is significant. Order value is up about 0.5% with all badges and 1.6% with fewer badges, but Amplitude can\'t put a reliable error bar on it. On mobile the cross-sell leads (revenue per visitor +1.6% and +1.7%); on desktop it trails (-4.8% and -4.1%). Too early to tell (under 50%); no time to 95% estimate yet.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1580138' },
    { id: '1529803', kind: 'cvr', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.6254, b: 0.6250, rel: -0.0007, f: 'pct' }], rpuNote: 'Revenue per user is not tracked on this test.', p: 1.0, name: 'Remove "Return to cart" on checkout', where: 'Checkout', start: '2026-10-14', status: 'running', owners: 'Oliver, Allison',
      hyp: 'Taking the exit link off checkout keeps people moving to the order.',
      primary: { name: 'Orders per checkout visitor', a: 0.6642, b: 0.6588, rel: -0.0082 }, cvr: { a: 0.6254, b: 0.6250, rel: -0.0007 }, reach: 0.68,
      n: 103114, sig: false, call: 'Still flat after 20 days (Oct 14 to Nov 2, about 103,100 checkout visitors): orders per checkout visitor -0.8% and Sitewide CVR -0.1%, neither significant (too early to tell, under 50%; no group imbalance). Revenue per visitor is -1.2%, but Amplitude can\'t put a reliable error bar on it. Amplitude puts it at about 35 more days to read the primary metric, well past the Nov 20 code freeze, so it will not give a clear answer before peak.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1529803' },
    { id: '1409398', kind: 'cvr', sec: [{ name: 'Revenue per user', a: 0.3932, b: 0.3887, rel: -0.0114, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: 1.0, name: 'Topics-first navigation', where: 'Site nav, every page', start: '2026-10-07', status: 'running', owners: 'Jon',
      hyp: 'Shopping by topic instead of product type gets more people into the catalog and buying.',
      primary: { name: 'Sitewide CVR', a: 0.01013, b: 0.010034, rel: -0.0095 }, cvr: { a: 0.01013, b: 0.010034, rel: -0.0095 }, reach: 1,
      variants: [['Topics nav', -0.0095], ['Topic defaults to T-shirts', -0.0043], ['Topic runs a search', -0.0118]],
      n: 11152063, sig: false, call: 'Day 27 (Oct 7 to Nov 2, about 11.2M visitors): all three variants sit slightly below no change on CVR (-0.9%, -0.4%, -1.2%; none significant, too early to tell, under 50%) and on revenue per user (-1.1% for the topics nav, -0.7% for the T-shirt default, -2.0% for the search variant, which stays the weakest). Nav engagement is up 7% to 9% in all three, significant. Amplitude suggests rolling back and says 40 or more days to read CVR, so the effect is too small to reach 95% in a useful time. It still flags uneven group sizes, and the rollout weights were edited on Nov 2 to 3, so read it loosely.',
      url: 'https://app.amplitude.com/experiment/tpub/774278/config/1409398' },
    { id: '1569370', kind: 'aov', sec: [{ name: 'Sitewide CVR (people in test)', a: 0.010727, b: 0.010610, rel: -0.0109, f: 'pct' }, { name: 'Revenue per user', a: 0.5637, b: 0.5693, rel: 0.0101, f: 'usd', note: 'Amplitude can\'t put a reliable error bar on this one' }], p: null, name: 'T-shirt style pills on product pages', where: 'PDP', start: '2026-10-27', status: 'running', owners: 'Jon, Allison, Oliver',
      hyp: 'Showing every T-shirt style up front with fit labels, instead of the style picker pop-up, makes choosing easier and nudges people to premium styles.',
      primary: { name: 'Revenue per user', a: 0.5637, b: 0.5693, rel: 0.0101 }, cvr: { a: 0.010727, b: 0.010610, rel: -0.0109 }, reach: 0.34,
      n: 1026980, sig: false, call: 'Seven days (Oct 27 to Nov 2, about 1,027,000 visitors): style pills lead on revenue per visitor (+1.0%) and order value (+3.4%), but Amplitude can\'t put a reliable error bar on either. Add to cart on the PDP is down 4.9% with over 99% confidence (clear loser on that metric), and Sitewide CVR is -1.1%, not significant (too early to tell, under 50%). Amplitude flags a sample ratio mismatch on desktop (49% of visitors in control, 51% in the test group) and targeting edits on Oct 27 and Oct 30, so read it loosely. Amplitude can\'t estimate time to 95% yet.',
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
// "AOV". Pulled from Amplitude Experiment, Nov 3, 8:30 AM ET (Nov 2 the last complete day).
EXPS.reads = {
  '1569370': {dev:{desktop:{n:[422975,435096],rpv:{v:-0.0252,s:'nb',a:0.21971,b:0.21416,f:'usd'},atc:{v:-0.0417,s:'ns',a:0.0079957,b:0.0076627},cvr:{v:-0.0096,s:'ns',a:0.0035345,b:0.0035004},aov:{v:0.0315,s:'nb',a:57.65,b:59.466,f:'usd'}},mobile:{n:[82107,80829],rpv:{v:0.0533,s:'nb',a:2.2861,b:2.408,f:'usd'},atc:{v:-0.0199,s:'ns',a:0.11632,b:0.11401},cvr:{v:0.019,s:'ns',a:0.046829,b:0.047718},aov:{v:0.0344,s:'nb',a:47.584,b:49.221,f:'usd'}}},  goal: 'rpv', verdict: ['mixed', 'Order value up, add to cart down'], next: 'Read again Wed Nov 4, after 2 more days. If add to cart stays down at 95%+ while revenue per visitor stays flat, the pills cost more orders than they add in order value. Finance to check the extra order value isn\'t lower-margin tees.', decides: 'Customer team, with Finance on margin', flag: 'Uneven group sizes on desktop (Amplitude flags a sample ratio mismatch, 49% control to 51% test) and targeting edits on Oct 27 and Oct 30, so read it loosely.',
    m: { rpv: { v: 0.0101, s: 'nb', a: 0.5637, b: 0.5693, f: 'usd', note: 'Revenue per visitor. Amplitude\'s headline "roll out" (+1.0%) comes from a revenue metric with a broken error bar, so read it as a direction only.' },
         cvr: { v: -0.0105, s: 'ns', a: 0.010505, b: 0.010394, name: 'PDP to order rate', note: 'Sitewide CVR for people in the test is -1.1%, also not significant (too early to tell, under 50%).' },
         atc: { v: -0.0491, s: 'sig', c: 99, a: 0.025987, b: 0.024711, name: 'Add to cart rate (PDP)', note: 'Over 99% confidence it\'s lower across all visitors (desktop -4.2% and mobile -2.0% are each short of significance on their own). Steering people to pricier styles can lower add to cart while raising order value, which is what TeePublic saw.' },
         aov: { v: 0.0341, s: 'nb', a: 50.53, b: 52.26, f: 'usd', note: 'Revenue ÷ orders. Amplitude\'s own "AOV" divides by everyone in the test.' } } },
  '1409398': {dev:{desktop:{n:[1709752,1711198],vers:{'Topics nav':{cvr:-0.0047,rpv:-0.0085,atc:0.0003,eng:-0.2236,aov:-0.0077},'T-shirt default':{cvr:-0.0178,rpv:-0.0248,atc:-0.0094,eng:-0.2309,aov:-0.0118},'Topic runs a search':{cvr:-0.0286,rpv:-0.0391,atc:-0.0128,eng:-0.2151,aov:-0.0121}},cvr:{v:-0.0047,s:'ns',a:0.0042638,b:0.0042438},rpv:{v:-0.0085,s:'nb',a:0.18822,b:0.18662,f:'usd'},atc:{v:0.0003,s:'ns',a:0.010042,b:0.010045},eng:{v:-0.2236,s:'sig',a:0.010085,b:0.0078296},aov:{v:-0.0077,s:'nb',a:42.513,b:42.185,f:'usd'}},mobile:{n:[1068551,1070211],vers:{'Topics nav':{cvr:-0.0128,rpv:-0.0152,atc:-0.0139,eng:0.3541,aov:-0.0078},'T-shirt default':{cvr:-0.0011,rpv:-0.0043,atc:-0.0118,eng:0.3628,aov:-0.0058},'Topic runs a search':{cvr:-0.0077,rpv:-0.0141,atc:-0.0126,eng:0.3648,aov:-0.0069}},cvr:{v:-0.0128,s:'ns',a:0.019605,b:0.019353},rpv:{v:-0.0152,s:'nb',a:0.72384,b:0.71281,f:'usd'},atc:{v:-0.0139,s:'ns',a:0.050909,b:0.050202},eng:{v:0.3541,s:'sig',a:0.015167,b:0.020538},aov:{v:-0.0078,s:'nb',a:35.528,b:35.251,f:'usd'}}}, vdef: { 'Topics nav': 'The nav is organized by topic instead of product type.', 'T-shirt default': 'Clicking a topic opens the regular T-shirt results for it, whatever the mix would be.', 'Topic runs a search': 'Clicking a topic runs a normal search for it, so results mix product types (more stickers show up) and the system picks the style.' },  goal: 'rpv', verdict: ['mixed', 'Engagement up, CVR flat'], next: 'Decide whether +7% to 9% engagement is worth flat CVR (more engaged visitors feed retargeting). Check revenue per buyer on the T-shirt default.', decides: 'Exec team (the board asked for this test)', flag: 'Uneven group sizes, and the rollout weights were edited on Nov 2 to 3, so read it loosely.',
    m: { rpv: { v: -0.0114, s: 'nb', a: 0.3932, b: 0.3887, f: 'usd', note: 'Topics nav −1.1%, T-shirt default −0.7%, topic runs a search −2.0%.' },
         cvr: { v: -0.0095, s: 'ns', a: 0.01013, b: 0.010034, name: 'Sitewide CVR', note: 'Topics nav −0.9%, T-shirt default −0.4%, topic runs a search −1.2%. None is significant (too early to tell, under 50%).' },
         atc: { v: -0.0097, s: 'ns', a: 0.025762, b: 0.025511, name: 'Add to cart rate (sitewide)', note: 'Topics nav −1.0%, T-shirt default −1.1%, topic runs a search −1.2%.' },
         aov: { v: -0.0068, s: 'nb', a: 37.35, b: 37.09, f: 'usd', name: 'Revenue per buyer', note: 'Revenue ÷ buyers (this test doesn\'t count orders). Topics nav −0.7%, T-shirt default −0.6%, topic runs a search −0.8%. So the T-shirt default does not raise order value.' },
         eng: { v: 0.0733, s: 'sig', a: 0.011982, b: 0.012861, name: 'Nav engagement', note: 'Share of visitors who click the nav. All three versions are up 7% to 9%, all significant.' } },
    vrows: [['Topics nav', { cvr: -0.0095, eng: 0.0733, rpv: -0.0114, aov: -0.0068 }], ['T-shirt default', { cvr: -0.0043, eng: 0.0765, rpv: -0.0068, aov: -0.0058 }], ['Topic runs a search', { cvr: -0.0118, eng: 0.0868, rpv: -0.0195, aov: -0.0084 }]] },
  '1580138': {dev:{desktop:{n:[4675,4636],vers:{'Cross-sell, all badges':{rpv:-0.0481,cvr:-0.0105,aov:-0.0393},'Cross-sell, fewer badges':{rpv:-0.0412,cvr:-0.0465,aov:0.0081}},rpv:{v:-0.0481,s:'nb',a:20.895,b:19.89,f:'usd'},cvr:{v:-0.0105,s:'ns',a:0.4338,b:0.42925},aov:{v:-0.0393,s:'nb',a:46.262,b:44.444,f:'usd'}},mobile:{n:[10272,10415],vers:{'Cross-sell, all badges':{rpv:0.0163,cvr:-0.016,aov:0.0321},'Cross-sell, fewer badges':{rpv:0.0168,cvr:-0.0144,aov:0.029}},rpv:{v:0.0163,s:'nb',a:18.475,b:18.777,f:'usd'},cvr:{v:-0.016,s:'ns',a:0.47177,b:0.46423},aov:{v:0.0321,s:'nb',a:37.68,b:38.891,f:'usd'}}},  goal: 'rpv', verdict: ['early', 'Too early'], next: 'Read again Thu Nov 5, after a full week. Daily results keep swinging between the versions, so expect more swings.', decides: 'Customer team',
    m: { rpv: { v: -0.0074, s: 'nb', a: 19.33, b: 19.19, f: 'usd', note: 'Revenue per visitor, about 45,800 cart visitors over five days. Fewer badges: −0.8%. Not significant, and Amplitude\'s own revenue metric has a broken error bar.' },
         cvr: { v: -0.0134, s: 'ns', a: 0.4596, b: 0.4534, name: 'Cart to order rate', note: 'All badges −1.3%, fewer badges −2.5%. Neither is significant (too early to tell, under 50%).' },
         aov: { v: 0.0053, s: 'nb', a: 40.38, b: 40.59, f: 'usd', note: 'Revenue ÷ orders. All badges +0.5%, fewer badges +1.6%.' } },
    vrows: [['Cross-sell, all badges', { rpv: -0.0074, cvr: -0.0134, aov: 0.0053 }], ['Cross-sell, fewer badges', { rpv: -0.0082, cvr: -0.0251, aov: 0.0162 }]] },
  '1492400': {dev:{desktop:{n:[1576608,1572321], vers:{'Timer all sale':{cvr:-0.006329,rpv:0.02883},'Timer last 48 hours':{cvr:-0.008087,rpv:-0.006275},'Timer last 72 hours':{cvr:-0.01173,rpv:-0.005037}},cvr:{v:-0.0080874,s:'ns',a:0.0029995,b:0.0029752},rpv:{v:-0.0062752,s:'nb',a:0.14097,b:0.14009,f:'usd'}},mobile:{n:[508582,508850], vers:{'Timer all sale':{cvr:0.01322,rpv:0.0205},'Timer last 48 hours':{cvr:0.02829,rpv:0.03251},'Timer last 72 hours':{cvr:0.02311,rpv:0.02619}},cvr:{v:0.028292,s:'ns',a:0.025504,b:0.026226},rpv:{v:0.032507,s:'nb',a:0.96372,b:0.99505,f:'usd'}}},  goal: 'rpv', verdict: ['ship', 'Shipped the 48-hour timer'], next: 'Rolled out to everyone on Nov 2. Next: the refreshed, larger banner in a new color.', decides: 'Customer team',
    m: { rpv: { v: 0.0204, s: 'nb', a: 0.3437, b: 0.3507, f: 'usd', note: '48-hour timer. Whole sale +2.2%, 72-hour +1.6%.' },
         cvr: { v: 0.0209, s: 'ns', a: 0.00846, b: 0.00864, name: 'Sitewide CVR', note: '48-hour timer +2.1%, 72-hour +1.5%, whole sale +0.9%. Not significant (under 50% confidence).' },
         aov: { v: 0.0011, s: 'nb', a: 38.14, b: 38.19, f: 'usd', note: 'Revenue ÷ orders. 48-hour timer +0.1%, whole sale +0.5%, 72-hour +0.0%.' } },
    vrows: [['Timer all sale', { cvr: 0.0092, rpv: 0.0216, aov: 0.0053 }], ['Timer last 48 hours', { cvr: 0.0209, rpv: 0.0204, aov: 0.0011 }], ['Timer last 72 hours', { cvr: 0.0145, rpv: 0.0160, aov: 0.0001 }]] },
  '1529803': {dev:{desktop:{n:[15566,15441],cvr:{v:-0.0144,s:'ns',a:0.70429,b:0.69413},rpv:{v:-0.0259,s:'nb',a:29.814,b:29.041,f:'usd'}},mobile:{n:[35174,35191],cvr:{v:-0.0047,s:'ns',a:0.64647,b:0.64343},rpv:{v:-0.0038,s:'nb',a:22.369,b:22.285,f:'usd'}}},  goal: 'rpv', verdict: ['none', 'No difference'], next: 'Needs 40 or more days, well past the Nov 20 freeze. Ship whichever version is simpler.', decides: 'Customer team',
    m: { rpv: { v: -0.0118, s: 'nb', a: 24.69, b: 24.4, f: 'usd', note: 'Per checkout visitor. Amplitude can\'t put a reliable error bar on it.' },
         cvr: { v: -0.0006, s: 'ns', a: 0.62297, b: 0.62258, name: 'Checkout completion rate', note: 'Orders per checkout visitor -0.8%. About 51,600 checkout visitors per group, evenly split.' },
         aov: { v: -0.0035, s: 'nb', a: 37.17, b: 37.04, f: 'usd', note: 'Revenue ÷ orders.' } } }
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
const SEXP = { url: 'https://app.sigmacomputing.com/teepublic/workbook/GA4-Search-Experiments-7wRanD8z9Oa0ZcLIk3FW7T', asOf: '2026-11-03',
  items: [
    { id: 'sc_autocomplete', e: '⌨️', name: 'Search autocomplete changes', site: 'TeePublic', start: '2026-06-29', end: '2026-07-14',
      what: 'More popular-search suggestions, no trending or popular labels, smaller results, and no product suggestions when no product is picked.',
      metric: 'User add-to-cart rate', base: 0.0770, users: 1353776,
      vars: [['Variant A', -0.0176, 0.127], ['Variant B', -0.0007, 1], ['Variant C', 0.0066, 1]],
      second: [['Session add-to-cart rate', [['Variant A', -0.0156], ['Variant B', 0.0042], ['Variant C', 0.0085]]], ['Search engagement rate', [['Variant A', -0.0021], ['Variant B', 0.0000], ['Variant C', 0.0170]]], ['User CVR', [['Variant A', 0.0071], ['Variant B', 0.0036], ['Variant C', -0.0142]]]],
      verdict: 'inconclusive' }
  ] };


// TeePublic A/B tests, read from the Split dashboard (https://www.teepublic.com/manage/split) on Nov 3 2026 (8:30 AM ET). Only tests launched in the last 30 days
// that have numbers (Mike and Jon, Oct 30): the date beside each experiment name is its launch date. Older tests and tests with no completed
// conversions are left out. Split reports each test's own conversion goal, so these rates are not sitewide CVR. conf is Split's confidence, null for "Insufficient".
const TPEXPS = { asOf: '2026-11-03', url: 'https://www.teepublic.com/manage/split', items: [
  { id: 'pdp_bestseller_badge', name: 'Bestseller badge on product pages', start: '2026-10-27', where: 'PDP', control: { p: 11081, conv: 0.1206 }, variants: [{ n: 'Title badge', p: 11376, conv: 0.1135, rel: -0.0587, conf: 90 }, { n: 'Gallery badge', p: 11363, conv: 0.1164, rel: -0.0343, conf: null }], call: ['early', 'Title badge is -5.9% with 90% confidence (likely down); gallery badge -3.4%, insufficient confidence. Short of the 95% bar, so too early to call'] },
  { id: 'pdp_trending_badge', name: 'Trending badge on product pages', start: '2026-10-23', where: 'PDP', control: { p: 624350, conv: 0.0131 }, variants: [{ n: 'Title badge', p: 624038, conv: 0.0134, rel: 0.0206, conf: null }, { n: 'Gallery badge', p: 623663, conv: 0.0135, rel: 0.0286, conf: 90 }], call: ['early', 'Gallery badge is +2.9% with 90% confidence (likely up); title badge +2.1%, insufficient confidence. Short of the 95% bar, so too early to call'] },
  { id: 'thankyou_mobile_layout', name: 'Thank-you page layout on mobile', start: '2026-10-23', where: 'Thank-you page', control: { p: 15195, conv: 0.0180 }, variants: [{ n: 'Layout A', p: 15035, conv: 0.0177, rel: -0.0153, conf: null }, { n: 'Layout B', p: 15281, conv: 0.0180, rel: 0.0017, conf: null }, { n: 'Layout C', p: 15137, conv: 0.0201, rel: 0.1215, conf: null }], call: ['early', 'Layout C leads at +12.2% but Split shows insufficient confidence (under 90%), so too early to tell'] }
  ,
  { id: 'beam_ab_test_live', name: 'Beam conversion test', start: '2026-10-19', where: 'Cart', control: null, variants: [{ n: 'Version A', conf: null }, { n: 'Version B', conf: null }], call: ['early', 'Too early to tell: every metric is inside its margin of error'],
    statsig: { url: 'https://console.statsig.com/shared_report/o5gEO9yaWHK?ref=pulse_public_share&experiment_name=beam_ab_test_live&custom_query_id=2uH7MYmCac7TZsUVzRLEcw', portal: 'https://partner-portal.beamimpact.com/overview', through: '2026-11-01', exposures: '9.78M', split: 'about a third of shoppers each in control, Version A and Version B', ci: 90,
      beam: { asOf: '2026-11-02', month: 'October', aovNo: 36.75, aovBeam: 44.02, aovLift: 0.198, ccrBeam: 0.583, ccrNo: 0.330, users: 210, redeemed: 1585, donated: 699, rate: 0.02 },
      metrics: [{ name: 'Total revenue', a: 0.017, aw: 0.033, b: -0.003, bw: 0.033 }, { name: 'Average order value', a: 0.013, aw: 0.021, b: 0.003, bw: 0.021 }, { name: 'Conversions', a: 0.005, aw: 0.025, b: -0.006, bw: 0.025 }, { name: 'Cart CVR', a: 0.006, aw: 0.022, b: 0.005, bw: 0.022 }] } }
] };
