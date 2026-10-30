
// Coming soon: what each product team is working on, from the Product Org Dashboard sheet (Active Work tabs), Jira DEAP,
// team and project Slack channels, the Pre-Peak standup canvas, and Mike's Meeting notes, notes (Oct 7 to 21). Shareable: no people, comp, HR or budget items.
// Snapshot of the leaderboard at the last review, so the page can show what changed since. The refresh re-takes it on each Executive Roadmap Review Tuesday.
// Each team's last fortnightly exec meeting (from the calendar). The refresh updates these.
// COMING_PREV is the board as of the last Executive Roadmap Review; it resets the day after each review.
// Matt Swope's Executive Roadmap Review: every other Tuesday, 6 PM ET. The refresh updates `last` after each one.
const ROADMAP_REVIEW = { last: '2026-10-27' };
const TEAM_MEETINGS = { customer: { last: '2026-10-19' }, de: { last: '2026-10-19' }, artist: { last: '2026-10-19' } };
const COMING_PREV = {"asOf": "the Oct 27 roadmap review", "items": {"Checkout email opt-in and hashing": {"s": "In dev", "eta": "End of Oct", "team": "customer"}, "PayPlus offer at checkout": {"s": "Live", "eta": "Oct 22", "team": "customer"}, "Beam conversion test": {"s": "Live", "eta": "To ~Nov 18", "team": "customer"}, "Cart and cart-tray cross-sell": {"s": "In QA", "eta": "Oct 27 to 28", "team": "customer"}, "T-shirt style pills on product pages": {"s": "Live", "eta": "Oct 27", "team": "customer"}, "Apple Pay buy-now on product pages": {"s": "Paused", "eta": "After peak", "team": "customer"}, "Redbubble quick wins": {"s": "Planned", "eta": "Before Nov 20", "team": "customer"}, "Fix Redbubble channel tracking": {"s": "Next sprint", "eta": "Next sprint", "team": "customer"}, "Sign in with Google": {"s": "Launching", "eta": "TBD", "team": "customer"}, "Trending tag on product pages test": {"s": "Live", "eta": "Oct 23", "team": "customer"}, "Sticker quick-add with quantity on search": {"s": "In dev", "eta": "Before Nov 20", "team": "tiger"}, "Thank-you page upsell, 6 slots": {"s": "In dev", "eta": "Before Nov 20", "team": "tiger"}, "Feed images at 1260px": {"s": "Discovery", "eta": "Before Nov 20", "team": "tiger"}, "Sticker cross-sell on add to cart": {"s": "Planned", "eta": "Before Nov 20", "team": "tiger"}, "Cart tray vs cart page test": {"s": "Planned", "eta": "After cross-sell", "team": "tiger"}, "Premium tee upsell in cart": {"s": "Ready for dev", "eta": "TBD", "team": "tiger"}, "Cross-sell module on the checkout landing page": {"s": "Planned", "eta": "TBD", "team": "tiger"}, "A/B/C/D test of cross-sell placements": {"s": "Planned", "eta": "TBD", "team": "tiger"}, "Product page badges": {"s": "In dev", "eta": "TBD", "team": "tiger"}, "Better sticker quick-add on Redbubble search": {"s": "Discovery", "eta": "TBD", "team": "tiger"}, "Cart redesign (DoorDash-style)": {"s": "Discovery", "eta": "TBD", "team": "tiger"}, "Quick shop": {"s": "Discovery", "eta": "TBD", "team": "tiger"}, "Shirt Monkey integration": {"s": "Launched", "eta": "Oct 26", "team": "plc"}, "Print Logistics integration": {"s": "Launched", "eta": "Oct 27", "team": "plc"}, "Sub Dimension integration": {"s": "Launching", "eta": "Before peak", "team": "plc"}, "Delivery-issue resolution queue": {"s": "Code review", "eta": "Nov 1", "team": "plc"}, "Trucker hat fulfillment": {"s": "In dev", "eta": "Nov 2", "team": "plc"}, "Precise USA sales tax by address": {"s": "Launched", "eta": "Oct 20", "team": "plc"}, "OMAFS phases 2 to 5": {"s": "Paused", "eta": "2027", "team": "plc"}, "Search cluster migration": {"s": "In dev", "eta": "Nov 7", "team": "search"}, "Learn to Rank rerun": {"s": "Ready for dev", "eta": "Before Nov 20", "team": "search"}, "Ranking test for 3+ word queries": {"s": "Live", "eta": "~2 weeks", "team": "search"}, "Greeting card and postcard search": {"s": "Code review", "eta": "Before peak", "team": "search"}, "Show the lowest-priced T-shirt style first in Redbubble search": {"s": "Planned", "eta": "After ranking test", "team": "search"}, "More prominent Redbubble search bar": {"s": "Planned", "eta": "Before peak", "team": "search"}, "Bad-art detection research": {"s": "Discovery", "eta": "Nov 9", "team": "search"}, "Trucker hats on Redbubble": {"s": "In dev", "eta": "Nov 3", "team": "core"}, "Standardized wall art sizes": {"s": "In dev", "eta": "Nov 3", "team": "core"}, "Retire 8 low-value Redbubble products": {"s": "Launching", "eta": "Oct 26", "team": "core"}, "Shared product data, phase 2": {"s": "In dev", "eta": "TBD", "team": "core"}, "Server-side tag security and monitoring": {"s": "In dev", "eta": "Pre-peak", "team": "martech"}, "Amazon Ads tracking on TeePublic": {"s": "Launched", "eta": "Oct 15", "team": "martech"}, "Creator affiliate tag on Redbubble": {"s": "In QA", "eta": "Before peak", "team": "martech"}, "Meta tracking follow-ups": {"s": "Code review", "eta": "Pre-peak", "team": "martech"}, "App store dashboard": {"s": "Blocked", "eta": "TBD", "team": "martech"}, "Self-serve artist tax reports": {"s": "Live", "eta": "Oct 22", "team": "artist"}, "iOS native checkout test": {"s": "Live", "eta": "Oct 19", "team": "artist"}, "App eventing (purchase event first)": {"s": "Planned", "eta": "After native checkout", "team": "artist"}, "Android native checkout": {"s": "Delayed", "eta": "Oct 30", "team": "artist"}, "Takedown (DMCA) tool": {"s": "In dev", "eta": "November", "team": "artist"}, "Seller verification compliance": {"s": "Discovery", "eta": "Jan 2027", "team": "artist"}, "Cart upsell results": {"s": "Launched", "eta": "Live", "team": "dashery"}, "Creator Dashboard v2": {"s": "In QA", "eta": "Before freeze", "team": "dashery"}, "Creator behavior data in Amplitude": {"s": "In dev", "eta": "Oct 31", "team": "dashery"}, "Notification system MVP": {"s": "In dev", "eta": "Nov 6", "team": "dashery"}, "Meta Shopping": {"s": "Planned", "eta": "Q1 2027", "team": "dashery"}, "TikTok Shop": {"s": "Discovery", "eta": "TBD", "team": "dashery"}, "Simon event matching": {"s": "In dev", "eta": "Before peak", "team": "de"}, "New iPhone cases in the feed": {"s": "Code review", "eta": "End of Oct", "team": "de"}, "Feed fixes": {"s": "In dev", "eta": "End of Oct", "team": "de"}, "Greeting cards and postcards in the feeds": {"s": "Planned", "eta": "After the site launch", "team": "de"}, "Stop mailing about 80K contacts": {"s": "Code review", "eta": "Before peak", "team": "de"}, "Lifecycle reporting fixes": {"s": "In dev", "eta": "Before peak", "team": "de"}, "Keep Sigma up through peak": {"s": "Planned", "eta": "Before peak", "team": "de"}, "Products on order events in Amplitude": {"s": "Launched", "eta": "Oct 26", "team": "de"}, "Fix sale prices in Google Shopping": {"s": "Code review", "eta": "End of Oct", "team": "de"}, "Analytics data for the pricing test": {"s": "Planned", "eta": "Pre-peak", "team": "de"}, "Real-time Amplitude": {"s": "In dev", "eta": "2027", "team": "de"}, "Simon AI profile attributes": {"s": "Launched", "eta": "Oct 27", "team": "de"}}};
const COMING = {
  asOf: 'Fri Oct 30, 4:30 PM ET',
  tagline: 'Three weeks to the Nov 20 code freeze: Sign in with Google and Creator Dashboard v2 went live Oct 29, the Redbubble cart cross-sell A/B test is running, trucker hats are in QA, and longer bets like OMAFS wait for 2027.',
  peak: [
    { e: '💰', t: 'Pre-peak revenue work first', team: 'Customer' },
    { e: '🐯', t: 'Tiger team quick wins', obj: 'AOV', team: 'Tiger team' },
    { e: '📡', t: 'Real-time Amplitude', obj: 'Data', team: 'Data Eng' },
    { e: '✉️', t: 'Checkout opt-in and email hashing', team: 'Customer + Data Eng' },
    { e: '🖼️', t: 'Feed health', team: 'Marketing + Data Eng' }
  ],
  board: [
    { e: '💳', t: 'Cart and checkout revenue', obj: 'Revenue', team: 'customer', s: 'In flight', eta: 'Before Nov 20', move: 'up', why: 'Top pre-peak priority', d: 'PayPlus at checkout, the Beam conversion test, and cart cross-sell and upsell across both sites.' },
    { e: '🐯', t: 'Tiger team quick wins', obj: 'AOV', team: 'tiger', s: 'In flight', eta: 'Before Nov 20', move: 'up', why: 'Fast revenue before the freeze', d: 'Sticker quick-add, the thank-you page upsell and the feed image fix.' },
    { e: '🔎', t: 'Search cluster migration', obj: 'Ops', imp: 'Keeps search running past the Nov 7 end of life', impSrc: 'Roadmap sheet estimate', team: 'search', s: 'In dev', eta: 'Nov 7', move: 'steady', pts: [31, 58], link: 'https://articore.atlassian.net/browse/DEAP-5324', d: 'Hard deadline: the old cluster reaches end of life on Nov 7.' },
    { e: '📡', t: 'Real-time Amplitude', obj: 'Data', team: 'de', s: 'In dev', eta: '2027', why: 'Oct 21 MarTech meeting: true real-time streaming is a next-year goal', move: 'steady', tags: ['Data'], d: 'So we can diagnose CVR during peak instead of a day later.' },
    { e: '🧠', t: 'Learn to Rank before the freeze', obj: 'CVR', imp: '+2% search click-through', impSrc: 'Roadmap sheet estimate',  pts: [79.5, 80.5], link: 'https://articore.atlassian.net/browse/DEAP-2622', team: 'search', s: 'Ready for dev', eta: 'Before Nov 20', move: 'up', why: 'Back on after pausing since May', tags: ['Search'], d: 'A production rerun of the ranking model that improves search results.' },
    { e: '🏭', t: 'New TeePublic fulfillers', obj: 'Ops', team: 'plc', s: 'In QA', eta: 'Rolling', move: 'steady', d: 'Shirt Monkey, Print Logistics and Sub Dimension, for more print capacity at peak.' },
    { e: '✉️', t: 'Checkout email opt-in and hashing', obj: 'Retention', imp: '5 to 10% more shoppers tracked, +2% daily new subscribers', impSrc: 'Roadmap sheet estimate', team: 'customer', s: 'In dev', eta: 'End of Oct', move: 'steady', tags: ['Data'], d: 'Grows the lifecycle email list before peak; needs email on server-side events.' },
    { e: '🍎', t: 'Apple Pay buy-now on Redbubble', obj: 'CVR', team: 'customer', s: 'Scoping', eta: 'Scoping ends Oct 27', move: 'up', inj: true, why: 'Fast-tracked at the Oct 22 standup', d: 'The Customer team is scoping it fast for peak. It would check out the whole cart and ship behind a switch that can be turned off during peak; if it goes ahead, something else comes off the Customer list.' }
  ],
  wins: [
    { e: '🔐', t: 'Sign up with Google on TeePublic', team: 'customer', site: 'TP', when: 'Oct 29', out: 'win', feature: true, imp: 'Live. Shoppers can create an account with Google instead of email and a password, to cut sign-up friction; sign-up method now shows in Amplitude', src: '#released', refs: [{ url: 'https://grid-articore.enterprise.slack.com/archives/C0V4PM9DW', l: '#released post' }, { jira: 'DEAP-4840' }] },
    { e: '📊', t: 'Dashery Creator Dashboard v2', team: 'dashery', site: 'Dashery', when: 'Oct 29', out: 'win', feature: true, imp: 'Live for every creator. Earnings and total sales are shown separately, fees and shipping are clearer, and empty trend lines are hidden', src: '#released', refs: [{ url: 'https://grid-articore.enterprise.slack.com/archives/C0V4PM9DW', l: '#released post' }, { jira: 'DEAP-6623' }] },
    { e: '🛒', t: 'Redbubble cart cross-sell A/B test', team: 'customer', site: 'RB', when: 'Oct 29', out: 'win', feature: true, imp: 'Live as an A/B test since 2:38 PM ET: a cross-sell carousel with full trust badges, or with fewer badges, against no cross-sell', src: '#released', refs: [{ url: 'https://grid-articore.enterprise.slack.com/archives/C0V4PM9DW', l: '#released post' }, { jira: 'DEAP-6266' }] },
    { e: '✉️', t: 'Shopper email on Redbubble client-side events', team: 'de', site: 'RB', when: 'Oct 28', out: 'win', feature: true, imp: 'Live. Simon can match browsing to shoppers in real time; Abandon Browse went from about 0 to about 1.7K contacts a day, and event volume into Simon is about 90 times higher. Server-side events are next', src: '#released', refs: [{ url: 'https://grid-articore.enterprise.slack.com/archives/C0V4PM9DW', l: '#released post' }, { jira: 'DEAP-6477' }] },
    { e: '💸', t: 'Bigger Redbubble quantity discounts', team: 'customer', site: 'RB', when: 'Oct 29', out: 'win', feature: true, imp: 'Live ahead of peak. Sticker bundles of 10+ go from 40% to 50% off and art print quantity discounts from 15% to 20% off, to lift bundle CVR', src: '#released', refs: [{ url: 'https://grid-articore.enterprise.slack.com/archives/C0V4PM9DW', l: '#released post' }] },
    { e: '⭐', t: 'Trustpilot product reviews on TeePublic', team: 'martech', site: 'TP', when: 'Oct 28', out: 'win', feature: true, imp: 'Released. Delivery emails now ask for product reviews as well as service reviews, which can feed star ratings in Google Shopping; rolling out to every delivered order by Oct 30', src: '#released', refs: [{ url: 'https://grid-articore.enterprise.slack.com/archives/C0V4PM9DW/p1793221540359769', l: '#released post' }] },
    { e: '🏭', t: 'Purepack live as a TeePublic fulfiller', team: 'plc', site: 'TP', when: 'Oct 28', out: 'win', feature: true, imp: 'Live. Posters and socks first from New Jersey, for domestic peak capacity; more products later', src: '#released', refs: [{ url: 'https://grid-articore.enterprise.slack.com/archives/C0V4PM9DW/p1793215062374939', l: '#released post' }] },
    { e: '👜', t: 'Canvas totes on TeePublic', team: 'core', site: 'TP', when: 'Oct 28', out: 'win', feature: true, imp: 'Launched. Expected to add about $153K a year in revenue (merchandising estimate in the launch post); a cotton tote was added the same day', src: '#released', refs: [{ url: 'https://grid-articore.enterprise.slack.com/archives/C0V4PM9DW/p1793219866560329', l: '#released post' }, { url: 'https://grid-articore.enterprise.slack.com/archives/C0C1AGRQZ3J/p1793218679950779', l: 'Launch thread' }] },
    { e: '🧹', t: 'Stopped mailing about 80K contacts', team: 'de', site: 'Both', when: 'Oct 28', out: 'win', feature: true, imp: 'Released. Removes contacts we should not be emailing, ahead of peak sends', src: 'Jira', refs: [{ jira: 'DEAP-5869' }] },
    { e: '🧹', t: 'Retired 8 low-value Redbubble products', team: 'core', site: 'RB', when: 'Oct 28', out: 'win', feature: true, imp: 'Done. Products retired Oct 26 to 27 and removed from the feeds Oct 28; Support is fielding shopper questions', src: 'Jira', refs: [{ jira: 'DEAP-6421' }] },
    { e: '📦', t: 'TeePublic delivery-issue self-service flow', team: 'plc', site: 'TP', when: 'Oct 28', out: 'win', feature: true, imp: 'Released. Shoppers can report a delivery problem themselves; customer emails and the agent queue are next', src: 'Jira', refs: [{ jira: 'DEAP-5143' }] },
    { e: '🏭', t: 'Print Logistics live as a TeePublic fulfiller', team: 'plc', site: 'TP', when: 'Oct 27', out: 'win', feature: true, imp: 'Live. Starting with totes and pillows; more print capacity for peak', src: 'Jira', refs: [{ jira: 'DEAP-4484' }] },
    { e: '🏭', t: 'Shirt Monkey live as a TeePublic fulfiller', team: 'plc', site: 'TP', when: 'Oct 26', out: 'win', feature: true, imp: 'Live in production. More print capacity for peak; the partner is still finalizing its shipping setup', src: 'Jira', refs: [{ jira: 'DEAP-5105' }] },
    { e: '⚡', t: 'Faster Redbubble product pages', team: 'customer', site: 'RB', when: 'Oct 27', out: 'win', feature: true, imp: 'Live. Product pages load about 30% faster at the slow end and 15% faster on a typical visit, after a year of cleanup by the Customer and Core teams', src: '#released', refs: [{ go: 'rb|funnel/Add to cart rate', l: 'Redbubble add to cart' }, { url: 'https://grid-articore.enterprise.slack.com/archives/C0V4PM9DW/p1793125526175319', l: '#released post' }] },
    { e: '📦', t: 'TeePublic standard shipping up $1 on heavier carts', team: 'plc', site: 'TP', when: 'Oct 23', out: 'measuring', imp: 'Live. +$1 standard shipping on orders over 11 oz; a single shirt still ships for $6.99. Not an A/B test; watching checkout completion and CVR', src: '#released', refs: [{ go: 'tp|funnel/Checkout completion rate', l: 'TeePublic checkout completion' }, { url: 'https://grid-articore.enterprise.slack.com/archives/C0V4PM9DW/p1793037301090969', l: '#released post' }] },
    { e: '🖼️', t: 'Flat-lay T-shirt thumbnails in search', team: 'customer', site: 'RB', when: 'Oct 19', imp: '+1.5% search page CVR in the A/B test, about +1% whole-site', src: 'Amplitude Experiment', refs: [{ test: '1427597', l: 'The test' }] },
    { e: '📸', t: 'Product image first on all apparel', team: 'customer', site: 'RB', when: 'Oct 5', imp: '+1.2% CVR for people in the test', src: 'Amplitude Experiment', refs: [{ test: '1431889', l: 'The test' }] },
    { e: '🧷', t: 'Dashery cart sticker upsell', team: 'dashery', site: 'Dashery', when: 'Oct 15', imp: 'Sticker attach rose from about 17% to 30%', src: 'Measured after launch' },
    { e: '🛍️', t: 'Bug fix: men\'s tee images back in the Shopping feed', team: 'de', site: 'TP', when: 'Oct 21', out: 'win', bug: true, imp: 'Fixed. Women\'s images had been showing on about 30% of TeePublic T-shirt listings; the men\'s image converts about 10% better', src: 'Oct 21 standup', refs: [{ go: 'tp|channel/Paid Search', l: 'TeePublic Paid Search' }] },
    { e: '🧾', t: 'Exact USA sales tax at Redbubble checkout', team: 'plc', site: 'RB', when: 'Oct 20', imp: 'Covers about 82% of USA orders', src: '#released', refs: [{ go: 'rb|funnel/Checkout completion rate', l: 'Redbubble checkout completion' }] },
    { e: '🏠', t: 'Address Line 2 always shown at checkout', team: 'customer', site: 'TP', when: 'Oct 22', out: 'win', feature: true, imp: 'Live. Fewer wrong-address deliveries and less friction at the shipping step', src: '#released', refs: [{ go: 'tp|funnel/Checkout completion rate', l: 'TeePublic checkout completion' }] },
    { e: '🏪', t: 'Simpler TeePublic artist shop pages', team: 'customer', site: 'TP', when: 'Oct 23', out: 'win', feature: true, imp: 'Live. Artist shop menus now lead back to the whole marketplace instead of trapping shoppers in one shop', src: '#released', refs: [{ url: 'https://grid-articore.enterprise.slack.com/archives/C0V4PM9DW', l: '#released' }] },
    { e: '✉️', t: 'Marketing opt-in on Express Pay', team: 'customer', site: 'RB', when: 'Oct 16', out: 'win', feature: true, imp: 'Working. Apple Pay and Google Pay buyers can now opt in to marketing email', src: '#released', refs: [{ jira: 'DEAP-5509' }] },
    { e: '📈', t: 'Beam conversion test in cart', team: 'customer', site: 'TP', when: 'Oct 19', out: 'measuring', imp: 'Conversion test live until about Nov 18; reading revenue per session and funnel completion', src: '#released', refs: [{ jira: 'DEAP-6282' }] }
  ],
  post: [
    { e: '🤝', t: 'Simon AI profile attributes, phase 2', team: 'de', obj: 'Retention', when: '2027', d: 'The P2 attributes, after phase 1 (P0 and P1) shipped in October.' },
    { e: '🪪', t: 'One shopper ID across both sites', team: 'martech', obj: 'Data', when: 'After peak', d: 'Stable identity and stitching across brands, and replacing Redbubble\'s cookie banner tool.' },
    { e: '🧭', t: 'Let shoppers browse off TeePublic artist stores', team: 'customer', obj: 'CVR', when: 'Next up', imp: 'About +2% CVR on 5% of traffic', d: 'Today artist stores trap shoppers; open navigation to the rest of the site.' },
    { e: '🧪', t: 'TeePublic on Amplitude Experiment, plus holdout groups', team: 'de', obj: 'Data', when: 'Next half', d: 'One testing tool across both sites, and a clean read of cumulative impact.' },
    { e: '🔎', t: 'Product scoping in search autocomplete', team: 'search', obj: 'CVR', when: 'After peak', d: 'Paused so Learn to Rank could ship before the freeze.' },
    { e: '🏭', t: 'Horsham as a TeePublic fulfiller', team: 'plc', obj: 'Ops', when: 'Next up', d: 'More print capacity after peak.' },
    { e: '🛒', t: 'Meta Shopping feed', team: 'dashery', obj: 'Revenue', when: 'Q1 2027', d: 'Dashery products in Facebook and Instagram shopping.' },
    { e: '✅', t: 'Seller verification', team: 'artist', obj: 'Compliance', when: 'Jan 2027', d: 'Regulatory checks on sellers.' },
    { e: '📜', t: 'Automated licensing and royalty reporting', team: 'artist', obj: 'Revenue', when: 'Mar 2027', imp: '$2M to $2.5M a year', d: 'Licensing partners get reports without manual work.' },
    { e: '🔁', t: 'OMAFS phases 2 to 5', team: 'plc', obj: 'Ops', when: '2027', d: 'Resumes in small steps after Nov 20; most of it moves to 2027.' }
  ],
  teams: [
    { key: 'customer', name: 'Customer', icon: '🛒', tagline: 'Revenue tests on cart and checkout across both sites, racing the Nov 20 freeze.',
      items: [
        { e: '✉️', t: 'Checkout email opt-in and hashing', site: 'Both', obj: 'Retention', imp: '5 to 10% more shoppers tracked, +2% daily new subscribers', impSrc: 'Roadmap sheet estimate', s: 'In dev', eta: 'End of Oct', move: 'steady', tags: ['Data'], d: 'Grows the lifecycle email list before peak; needs email on server-side events.' },
        { e: '💳', t: 'PayPlus offer at checkout', obj: 'Revenue', imp: 'About $840K a year at launch', impSrc: 'Oct 21 standup', refs: [{ go: 'tp|funnel/Checkout completion rate', l: 'TeePublic checkout completion' }],  pts: [7, 7], link: 'https://articore.atlassian.net/browse/DEAP-4816', site: 'TP', s: 'Live', eta: 'Oct 22', move: 'up', why: 'Launched Oct 22 as an A/B test', d: 'Launched Oct 22 as an A/B test of a Rokt offer on the confirmation and payment pages. Watch checkout completion (payment to order complete) closely.' },
        { e: '📈', t: 'Beam conversion test', obj: 'CVR', imp: '+3.7% revenue per session (assumed lift)', impSrc: 'Beam business case', refs: [{ go: 'tp|funnel/Funnel completion rate', l: 'TeePublic funnel completion' }],  pts: [3, 3], link: 'https://articore.atlassian.net/browse/DEAP-6282', site: 'TP', s: 'Live', eta: 'To ~Nov 18', move: 'up', why: 'Came in as top priority Oct 9', d: 'A/B/C conversion test in Statsig: a give-back message (1% to a nonprofit) in cart and on product pages, aimed at lifting CVR. Primary metric: revenue per session.' },
        { e: '🛍️', t: 'Cart and cart-tray cross-sell', obj: 'AOV', imp: '$500K to $1M a year', impSrc: 'Roadmap sheet estimate',  pts: [0, 5], link: 'https://articore.atlassian.net/browse/DEAP-6266', site: 'RB', s: 'Live', eta: 'Oct 29', move: 'up', why: 'A/B test switched on Oct 29, 2:38 PM ET (was Oct 27 to 28)', d: 'Redbubble first version: stickers only, on the cart page only. Replaces the Contentful front end, now January.' },
        { e: '👕', t: 'T-shirt style pills on product pages', obj: 'AOV', site: 'RB', s: 'Blocked', eta: 'Oct 27', move: 'steady', why: 'Waiting on an apps fix; launch now planned for Tue Oct 27', pts: [12.5, 15], link: 'https://articore.atlassian.net/browse/DEAP-5915', d: 'Pills instead of the style picker pop-up, as on TeePublic. Waiting on an apps fix; launch planned for Oct 27.' },
        { e: '🧭', t: 'Topics-first navigation on Redbubble', sheet: 'RB Nav Redesign (Topics-First)', obj: 'CVR', imp: 'About $350K AUD a year', impSrc: 'Roadmap sheet estimate', site: 'RB', s: 'Live', eta: 'Testing', move: 'new', refs: [{ test: '1409398', l: 'The test' }], d: 'Live as an A/B test. The Oct 28 standup said it lowers CVR but lifts engagement a lot; the team is looking at a trending or regional angle.' },
        { e: '🧭', t: 'Topics-first navigation, version 2', sheet: 'RB V2 Nav Redesign (Topics-First) ', obj: 'CVR', site: 'RB', s: 'In QA', eta: 'TBD', move: 'new', d: 'The next version of the topics-first menu; development is done per the roadmap sheet.' },
        { e: '🍎', t: 'Apple Pay buy-now on product pages', obj: 'CVR', site: 'RB', s: 'Scoping', eta: 'Scoping ends Oct 27', move: 'up', inj: true, why: 'Fast-tracked at the Oct 22 standup; Customer takes it on since Purchase Lifecycle has no room', d: 'Fast scoping for peak. It would check out the whole cart (not just the one item) and ship behind a switch that can be turned off during peak. Open questions: which product types show it.' },
        { e: '🎄', t: 'Redbubble quick wins', obj: 'CVR', imp: '+5% CVR across the Redbubble A/B program', impSrc: 'Roadmap sheet estimate', site: 'RB', s: 'Planned', eta: 'Before Nov 20', move: 'up', why: 'Pre-peak list, Oct 19', d: 'All shipping fields up front, "Guaranteed by Christmas", recently viewed, smaller category tiles.' },
        { e: '🧭', t: 'Fix Redbubble channel tracking', obj: 'Data', refs: [{ go: 'rb|channel/Paid Search', l: 'Redbubble channels' }], site: 'RB', s: 'In dev', eta: 'Before Nov 20', move: 'up', why: 'Work started Oct 28 (DEAP-5099 moved to In Development)', tags: ['Data'], pts: [0, 3], link: 'https://articore.atlassian.net/browse/DEAP-5099', d: 'campaign_medium is missing on most Redbubble events, so channel reporting is rough.' },
        { e: '🔐', t: 'Sign in with Google', obj: 'Retention', site: 'TP', s: 'Launched', eta: 'Oct 29', move: 'up', why: 'Live on TeePublic Oct 29 at about 1 PM ET, after Google approved the sign-in app', pts: [17, 23], link: 'https://articore.atlassian.net/browse/DEAP-4840', d: 'Shoppers can sign up with Google from the default sign-up flow; favoriting and designer sign-up are not covered yet.' },
        { e: '🔥', t: 'Trending tag on product pages test', obj: 'CVR', site: 'TP', s: 'Live', eta: 'Oct 23', move: 'new', why: 'Launched Oct 23 as an A/B/C test', refs: [{ go: 'tp|funnel/Add to cart rate', l: 'TeePublic add to cart' }], d: 'Launched Oct 23: a trending tag in the product image gallery or above the design title, against no tag. A small first test of social proof on product pages, built to extend to other tags.' }
      ],
      dropped: [['Contentful front end', 'Moved to January'], ['Express Pay at top of checkout', 'On hold'], ['Redbubble shipping-threshold test', 'Pushed to 2027']] },
    { key: 'tiger', parent: 'customer', name: 'Tiger team', icon: '🐯', tagline: 'Jeff\'s quick revenue wins inside Customer, in priority order for peak.',
      items: [
        { e: '🧷', t: 'Sticker quick-add with quantity on search', obj: 'AOV', site: 'TP', s: 'Planned', eta: 'Before Nov 20', move: 'down', why: 'Back in the backlog Oct 30 while two design options are compared', d: 'Add multiple stickers straight from search results.' },
        { e: '🎁', t: 'Thank-you page upsell, 6 slots', obj: 'AOV',  pts: [0, 2], link: 'https://articore.atlassian.net/browse/DEAP-6558', site: 'TP', s: 'In dev', eta: 'Before Nov 20', move: 'down', why: 'Was marked ready to ship Oct 20, but the move from 3 to 6 slots is still being built (Jira, Oct 27); small mobile tweaks shipped Oct 22', d: 'More slots, higher on mobile; drops slow sellers for peak. Post-purchase attach is about 0.5% today.' },
        { e: '🖼️', t: 'Feed images at 1260px', obj: 'Traffic', site: 'TP', s: 'Discovery', eta: 'Before Nov 20', move: 'steady', tags: ['Data'], d: 'Sharper product images in Google Shopping.' },
        { e: '➕', t: 'Sticker cross-sell on add to cart', obj: 'AOV', site: 'TP', s: 'Planned', eta: 'Before Nov 20', move: 'steady', d: 'Offer a sticker in the add-to-cart overlay.' },
        { e: '🧪', t: 'Cart tray vs cart page test', obj: 'CVR', site: 'Both', s: 'Planned', eta: 'After cross-sell', move: 'new', d: 'A/B/C test of where cross-sell converts best.' },
        { e: '⭐', t: 'Premium tee upsell in cart', obj: 'AOV', site: 'TP', s: 'Ready for dev', eta: 'TBD', move: 'steady', d: 'A $3 upgrade offer for Classic Tee carts.' },
        { e: '🧾', t: 'Cross-sell module on the checkout landing page', obj: 'AOV', site: 'TP', s: 'Planned', eta: 'TBD', move: 'new', d: 'A cross-sell block where shoppers land in checkout. From the roadmap sheet (Customer, Tiger).' },
        { e: '🧪', t: 'A/B/C/D test of cross-sell placements', obj: 'AOV', site: 'TP', s: 'Planned', eta: 'TBD', move: 'new', d: 'Tests where cross-sell converts best. From the roadmap sheet (Customer, Tiger).' },
        { e: '🏷️', t: 'Product page badges', obj: 'CVR', site: 'TP', s: 'In dev', eta: 'TBD', move: 'new', d: 'Badges on product pages. From the roadmap sheet (Customer, Tiger).' },
        { e: '⚡', t: 'Better sticker quick-add on Redbubble search', obj: 'AOV', site: 'RB', s: 'Discovery', eta: 'TBD', move: 'new', d: 'A better quick add-to-cart for stickers in Redbubble search results. From the roadmap sheet (Customer, Tiger).' },
        { e: '🛒', t: 'Cart redesign (DoorDash-style)', obj: 'CVR', site: 'TP', s: 'Discovery', eta: 'TBD', move: 'new', d: 'A cart experience modeled on DoorDash. From the roadmap sheet (Customer, Tiger).' },
        { e: '👀', t: 'Quick shop', obj: 'CVR', site: 'TP', s: 'Discovery', eta: 'TBD', move: 'new', d: 'Shop a design without leaving the page. From the roadmap sheet (Customer, Tiger).' }
      ] },
    { key: 'plc', name: 'Purchase Lifecycle', icon: '📦', tagline: 'More TeePublic fulfillers and delivery self-service; OMAFS waits until after peak.',
      items: [
        { e: '🏭', t: 'Shirt Monkey integration', obj: 'Ops', site: 'TP', s: 'Launching', eta: 'Before peak', move: 'steady', link: 'https://articore.atlassian.net/browse/DEAP-5105', d: 'New TeePublic fulfiller for peak capacity.' },
        { e: '🏭', t: 'Print Logistics integration', obj: 'Ops', site: 'TP', s: 'Blocked', eta: 'UAT', move: 'steady', link: 'https://articore.atlassian.net/browse/DEAP-4484', d: 'In production with no products yet; launch narrowed to t-shirts, pillows and totes.' },
        { e: '🏭', t: 'Sub Dimension integration', obj: 'Ops', site: 'TP', s: 'Launching', eta: 'Before peak', move: 'up', link: 'https://articore.atlassian.net/browse/DEAP-4485', d: 'Signed off; release to production planned.' },
        { e: '📬', t: 'Delivery-issue resolution queue', obj: 'Ops', imp: 'Frees up customer service time', impSrc: 'Roadmap sheet estimate', site: 'Both', s: 'Code review', eta: 'Nov 1', move: 'steady', pts: [1, 5], ptsUnit: 'issues', link: 'https://articore.atlassian.net/browse/DEAP-5046', d: 'Self-service for shipping and delivery problems.' },
        { e: '🏭', t: 'Bestol integration', sheet: 'Printer Integration: Bestol', obj: 'Ops', site: 'TP', s: 'In dev', eta: 'TBD', move: 'new', d: 'Another TeePublic fulfiller. The roadmap sheet phase end (Oct 15) has passed without an update.' },
        { e: '🏭', t: 'Purepack integration', sheet: 'Printer Integration: Purepack', obj: 'Ops', site: 'TP', s: 'Launched', eta: 'Oct 28', move: 'new', d: 'New TeePublic fulfiller (already prints for Redbubble), starting with posters and socks.' },
        { e: '🌍', t: 'Product localization 2.0', sheet: 'Product Localization 2.0', obj: 'Ops', site: 'Both', s: 'In dev', eta: 'TBD', move: 'new', d: 'Routes more orders to printers near the shopper. The roadmap sheet phase end (Sep 15) has passed without an update.' },
        { e: '🔢', t: 'Rounded prices on Redbubble', sheet: 'Rounding Prices on RBO', obj: 'CVR', site: 'RB', s: 'Blocked', eta: 'TBD', why: 'Marked Blocked on the roadmap sheet; no reason recorded there yet', move: 'new', d: 'Support for the round-price product setup used by Operations.' },
        { e: '🧢', t: 'Trucker hat fulfillment', obj: 'Revenue', site: 'TP', s: 'In dev', eta: 'Nov 2', move: 'steady', pts: [0, 7], link: 'https://articore.atlassian.net/browse/DEAP-6261', d: 'Launch support for the new trucker hat.' },
        { e: '🧾', t: 'Precise USA sales tax by address', obj: 'Compliance', site: 'RB', s: 'Launched', eta: 'Oct 20', move: 'steady', d: 'Live on Redbubble for 82% of orders; PayPal after peak.' },
        { e: '🔁', t: 'OMAFS phases 2 to 5', obj: 'Ops', site: 'Both', s: 'Paused', eta: '2027', move: 'down', why: 'Too much scope before Black Friday', d: 'Resumes in small steps around Nov 20; the bulk moves to 2027.' },
        { e: '🧱', t: 'Selling blanks on TeePublic', sheet: 'Selling Blanks', obj: 'Revenue', site: 'TP', s: 'Discovery', eta: 'After the freeze', move: 'steady', link: 'https://articore.atlassian.net/browse/DEAP-5975', why: 'The MVP was not worth it before peak', d: 'Sell plain (blank) products on TeePublic. Discovery tickets for a cross-sell MVP and a product page MVP opened Oct 29; build tickets wait in backlog. Moved from Up next because it is an Active Work row on the roadmap sheet.' }
      ] },
    { key: 'search', name: 'Search & Content', icon: '🔎', tagline: 'Cluster migration by Nov 7 and better ranking before the freeze.',
      items: [
        { e: '🗄️', t: 'Search cluster migration', obj: 'Ops', imp: 'Keeps search running past the Nov 7 end of life', impSrc: 'Roadmap sheet estimate', site: 'Both', s: 'In dev', eta: 'Nov 7', move: 'steady', pts: [31, 58], link: 'https://articore.atlassian.net/browse/DEAP-5324', d: 'Hard deadline; one decommission step still open.' },
        { e: '🧠', t: 'Learn to Rank rerun', obj: 'CVR', imp: '+2% search click-through', impSrc: 'Roadmap sheet estimate',  pts: [79.5, 80.5], link: 'https://articore.atlassian.net/browse/DEAP-2622', site: 'RB', s: 'Ready for dev', eta: 'Before Nov 20', move: 'up', why: 'Back on after pausing since May', d: 'Ranking model refresh in production.' },
        { e: '🧪', t: 'Ranking test for 3+ word queries', obj: 'CVR', site: 'RB', s: 'Live', eta: '~2 weeks', move: 'new', d: 'Launched Oct 20.' },
        { e: '💌', t: 'Greeting card and postcard search', obj: 'CVR', site: 'RB', s: 'Code review', eta: 'Before peak', move: 'steady', pts: [9.5, 15.5], link: 'https://articore.atlassian.net/browse/DEAP-2523', d: 'Ahead of November card season.' },
        { e: '💲', t: 'Show the lowest-priced T-shirt style first in Redbubble search', obj: 'CVR', site: 'RB', s: 'Scoping', eta: 'TBD', move: 'new', inj: true, why: 'Added Oct 23 from the peak standup', d: 'Many T-shirts in search open on pricier styles that stay above $20 on sale. Search is checking whether results can default to the cheapest style, on what timeline and with what trade-offs.' },
        { e: '🔍', t: 'More prominent Redbubble search bar', obj: 'CVR', site: 'RB', s: 'Code review', eta: 'Before peak', move: 'new', why: 'Asked for before peak', d: 'Owner still being decided between Search and Customer.' },
        { e: '👀', t: 'Recently viewed on Redbubble search and product pages', obj: 'CVR', site: 'RB', s: 'Planned', eta: 'Before Nov 20', move: 'new', link: 'https://articore.atlassian.net/browse/DEAP-6870', why: 'Proposed Oct 28 in peak planning for before the freeze; ticket and product spec written', d: 'A recently viewed row at the bottom of Redbubble search results and product pages. On TeePublic about 1% of sessions use it daily and 17% of people who click it buy. It was part of the Customer team\'s quick-wins list; Search and Content is picking it up, likely without an A/B test. A design mock is still needed.' },
        // Every active Content & Search row in the roadmap sheet (Wendy, Oct 28: rows in the sheet were missing here). sheet = the sheet's own title.
        { e: '📄', t: 'SEO: 20 results per search page', sheet: 'SEO: Increase Pagination from 10 to 20', obj: 'Traffic', imp: 'Recover lost organic traffic (about 30%)', impSrc: 'Roadmap sheet estimate', site: 'RB', s: 'Code review', eta: 'Before Nov 20', move: 'up', d: 'In code review as of Oct 28 (DEAP-6285); technical design runs Oct 28 to Nov 11, and it ships before the code freeze. More products per page for search engines to find.' },
        { e: '🔗', t: 'SEO: trending links in the footer', sheet: 'SEO: Trending links in footer', obj: 'Traffic', imp: 'Better Google indexing of trending topics', impSrc: 'Roadmap sheet estimate', site: 'RB', s: 'Scoping', eta: 'TBD', move: 'new', d: 'Technical design runs Oct 28 to Nov 11.' },
        { e: '🏷️', t: 'More branded search result pages', sheet: 'PATHWAYS: Enable more branded IP SRPs', obj: 'CVR', site: 'RB', s: 'Scoping', eta: 'TBD', move: 'new', d: 'Technical design runs Oct 28 to Nov 11.' },
        { e: '🔎', t: 'Product filtering in search', sheet: 'PATHWAYS:  Product Filtering (Scoping)', obj: 'CVR', imp: '+2% search click-through', impSrc: 'Roadmap sheet estimate', site: 'RB', s: 'Discovery', eta: 'TBD', move: 'new', d: 'Scoping; discovery set to end Nov 1.' },
        { e: '✍️', t: 'AI content for tag pages', sheet: 'AI: Content Enrichment for Tag Pages', obj: 'Traffic', site: 'RB', s: 'Discovery', eta: 'TBD', move: 'new', d: 'Discovery runs to Nov 18. Aimed at more search and AI-assistant traffic.' },
        { e: '✍️', t: 'AI content for product pages', sheet: 'AI:  Content Enrichment for pdp Pages', obj: 'Traffic', site: 'RB', s: 'Not started', eta: 'TBD', move: 'new', d: 'Discovery planned Nov 2 to 16.' },
        { e: '📧', t: 'Product recommendations in Simon emails', sheet: 'RETENTION: Simon email recommendations', obj: 'Retention', site: 'RB', s: 'Discovery', eta: 'TBD', move: 'new', d: 'Discovery planned Nov 2 to 16.' },
        { e: '🏷️', t: 'Related tag improvements', sheet: 'PATHWAYS: Related Tag improvements', obj: 'CVR', imp: 'Related tags on 70% of pages, +10% click-through', impSrc: 'Roadmap sheet estimate', site: 'RB', s: 'Paused', eta: 'TBD', move: 'new', d: 'Paused in the sheet; ready for development, planned Nov 9 to Dec 20.' },
        { e: '💤', t: 'Dormant designs test', sheet: 'QUALITY: Dormancy ', obj: 'CVR', imp: '+2% click-through', impSrc: 'Roadmap sheet estimate', site: 'RB', s: 'Not started', eta: 'After the holidays', move: 'new', d: 'Not enough time to test it before the code freeze, so it runs after the holiday lift.' },
        { e: '💸', t: 'Vector and lexical search consolidation', sheet: 'Cost Savings: Vector and Lexical Consolidation', obj: 'Ops', imp: '$24K a year in savings', impSrc: 'Roadmap sheet estimate', site: 'RB', s: 'Not started', eta: 'Dec 9', move: 'new', d: 'Technical design planned Nov 25 to Dec 9.' },
        { e: '🚫', t: 'Bad-art detection research', obj: 'Revenue', site: 'Both', s: 'Discovery', eta: 'Nov 9', move: 'steady', pts: [7, 17], link: 'https://articore.atlassian.net/browse/DEAP-6064', d: 'AI screening for low-quality art.' }
      ],
      dropped: [['Assign categories to designs', 'Waiting on topic-nav testing'], ['Autocomplete scoping', 'Ranking first']] },
    { key: 'core', name: 'Core', icon: '🧱', tagline: 'Adds and retires products, and runs the shared product model across both sites.',
      items: [
        { e: '🧢', t: 'Trucker hats on Redbubble', obj: 'Revenue', imp: 'About $90K a month', impSrc: 'Product Marketing, Oct 7', site: 'RB', s: 'In dev', eta: 'Nov 3', why: 'Launch Nov 3 USA (Nov 4 AU), per Slack', move: 'steady', link: 'https://articore.atlassian.net/browse/DEAP-6578', d: 'New product. Rollout in dev; navigation and search work not started.' },
        { e: '🖼️', t: 'Standardized wall art sizes', obj: 'Revenue', site: 'RB', s: 'In dev', eta: 'Nov 3', move: 'steady', pts: [10, 21], link: 'https://articore.atlassian.net/browse/DEAP-5328', d: 'One consistent set of wall art sizes.' },
        { e: '🧹', t: 'Retire 8 low-value Redbubble products', obj: 'Ops', site: 'RB', s: 'Launched', eta: 'Oct 28', why: 'Products retired Oct 26 to 27; feed removal released Oct 28 (DEAP-6421)', move: 'up', link: 'https://articore.atlassian.net/browse/DEAP-6198', d: 'Sunset products that sell too little to keep.' },
        { e: '🧬', t: 'Shared product data, phase 2', obj: 'Data', site: 'Both', s: 'In dev', eta: 'TBD', move: 'steady', d: 'One product model for TeePublic and Redbubble.' },
        { e: '🏷️', t: 'Sticker sizes and finishes on TeePublic', sheet: 'Product Extension: Sticker Sizes & Finishes', obj: 'Revenue', site: 'TP', s: 'Launched', eta: 'Aug 28', move: 'new', d: 'More sticker sizes and finishes. The roadmap sheet has it in impact analysis.' },
        { e: '👕', t: 'Vintage tee on Redbubble', sheet: 'Product Addition: Vintage Tee', obj: 'Revenue', site: 'RB', s: 'Launched', eta: 'Aug 25', move: 'new', d: 'New product. The roadmap sheet has it in impact analysis.' },
        { e: '💌', t: 'Cards, bags and mugs on TeePublic', sheet: 'Product Addition: Cards, Bags, Mugs', obj: 'Revenue', site: 'TP', s: 'In dev', eta: 'TBD', move: 'new', d: 'Greeting cards and postcards, and canvas totes (the latte mug was dropped Oct 21). The card launch was expected Oct 28; feed and search work follow it.' },
        { e: '🖼️', t: 'More poster inventory on Redbubble', sheet: 'Product Merchandising: Increase Posters Inventory', obj: 'Revenue', site: 'RB', s: 'Ready for dev', eta: 'TBD', move: 'new', d: 'Offer more posters. The roadmap sheet phase dates (Oct 14 to 16) have passed without an update.' },
        { e: '☁️', t: 'Move hosting from ECS to EKS', sheet: 'Platform Consolidation: ECS -> EKS', obj: 'Ops', site: 'Both', s: 'In dev', eta: 'Apr 30', move: 'new', d: 'Infrastructure move for all three sites; the roadmap sheet targets Apr 30, 2027.' }
      ],
      dropped: [['Latte mug', 'Dropped Oct 21']] },
    { key: 'martech', name: 'MarTech', icon: '📡', tagline: 'Marketing tracking: ad pixels, conversion APIs, consent and identity. A new team; Vaibhav Soni is Product Manager, and its Engineering Manager starts Nov 10.',
      items: [
        { e: '🛡️', t: 'Server-side tag security and monitoring', obj: 'Ops', site: 'Both', s: 'Planned', eta: 'Pre-peak', move: 'steady', link: 'https://articore.atlassian.net/browse/DEAP-4278', d: 'Move ad-platform keys into secure storage and add health checks before peak.' },
        { e: '🛒', t: 'Amazon Ads tracking on TeePublic', obj: 'Traffic', site: 'TP', s: 'Launched', eta: 'Oct 15', move: 'steady', why: 'Launched Oct 15: tracking fully works; campaigns are up to marketing', pts: [3, 3], link: 'https://articore.atlassian.net/browse/DEAP-4853', d: 'Pixel and purchase tag are live; next step is creating campaigns.' },
        { e: '🤳', t: 'Creator affiliate tag on Redbubble', obj: 'Traffic', site: 'RB', s: 'In QA', eta: 'Before peak', move: 'steady', link: 'https://articore.atlassian.net/browse/DEAP-6042', d: 'TeePublic\'s affiliate tag on Redbubble for the holiday influencer campaign.' },
        { e: '📶', t: 'Meta tracking follow-ups', obj: 'Revenue', site: 'Both', s: 'In dev', eta: 'Pre-peak', move: 'steady', link: 'https://articore.atlassian.net/browse/DEAP-6160', d: 'Close the server vs browser event gap on Redbubble (likely bots) after the main Meta work went live.' },
        { e: '📲', t: 'App store dashboard', obj: 'Data', site: 'RB', s: 'Blocked', eta: 'TBD', move: 'steady', d: 'App Store and Play Store numbers in one place. Waiting on legal, then about 3 to 4 days of work.' },
        { e: '🤳', t: 'TeePublic GRIN webhook tracking', sheet: 'TP: GRIN webhook eventing instrumentation', obj: 'Traffic', site: 'TP', s: 'In dev', eta: 'TBD', move: 'new', why: 'Added to the roadmap sheet Oct 28 to 29', d: 'Track TeePublic creator affiliate (GRIN) activity as events. The roadmap sheet lists it In Dev, On Track, with no dates yet.' },
        { e: '🔎', t: 'Redbubble search tracking', sheet: 'RB: Search eventing instrumentation', obj: 'Data', site: 'RB', s: 'In dev', eta: 'TBD', move: 'new', why: 'Added to the roadmap sheet Oct 28 to 29', d: 'Tracking events for Redbubble search, so search use and its CVR can be measured. The roadmap sheet lists it In Dev, On Track, with no dates yet.' },
        { e: '🧩', t: 'One data layer across Redbubble and TeePublic', sheet: 'Unified data layer across RB and TP', obj: 'Data', site: 'Both', s: 'In dev', eta: 'TBD', move: 'new', why: 'Added to the roadmap sheet Oct 28 to 29', d: 'The same tracking data layer on both sites, so tags and reports work the same way. The roadmap sheet lists it In Dev, On Track, with no dates yet.' },
        { e: '🧮', t: 'Redbubble GA4 purchase tracking fix', sheet: 'RB: GA4 null user_pseudo_id', obj: 'Data', site: 'RB', s: 'In dev', eta: 'TBD', move: 'new', why: 'Added to the roadmap sheet Oct 28 to 29', d: 'Some Redbubble GA4 purchases arrive without a user ID and drop out of reports. The roadmap sheet has it in impact analysis; the Data Engineering ticket for the dropped purchases (DEAP-5542) is still in backlog.' },
        { e: '🏷️', t: 'Tracking on search and remaining pages', sheet: 'Eventing SRP + remaining pages (First MarTech-owned delivery)', obj: 'Data', site: 'Both', s: 'Not started', eta: 'Q1 2027', move: 'new', why: 'Added to the roadmap sheet Oct 28 to 29', d: 'The first tracking project MarTech owns end to end: events on search results and the remaining pages. The roadmap sheet targets Mar 31.' },
        { e: '🧪', t: 'Automated tracking QA', sheet: 'QA + automated testing', obj: 'Data', site: 'Both', s: 'Not started', eta: 'Q2 2027', move: 'new', why: 'Added to the roadmap sheet Oct 28 to 29', d: 'Automated tests so tracking breaks get caught before they reach the data. The roadmap sheet targets Jun 30.' },
        { e: '📱', t: 'Redbubble app analytics', sheet: 'Mobile app analytics — Redbubble', obj: 'Data', site: 'RB', s: 'Not started', eta: 'Q2 2027', move: 'new', why: 'Moved from Up next: now a roadmap sheet row', d: 'Beyond the purchase event: full tracking in the Redbubble app. The roadmap sheet targets Jun 30.' },
        { e: '✉️', t: 'One consent platform across all brands', sheet: 'unified consent management platform across all brands.', obj: 'Compliance', site: 'Both', s: 'Not started', eta: 'Dec 31', move: 'new', why: 'Moved from Up next: now a roadmap sheet row', d: 'One consent tool on every site, replacing the separate cookie and consent setups. The roadmap sheet targets Dec 31.' },
        { e: '📬', t: 'Communication preference management', sheet: 'Comms preference management infrastructure', obj: 'Compliance', site: 'Both', s: 'Not started', eta: 'Q2 2027', move: 'new', why: 'Moved from Up next: now a roadmap sheet row', d: 'One place for shoppers to manage which marketing messages they get. The roadmap sheet targets Jun 30.' },
        { e: '🎨', t: 'Artist tracking and audiences', sheet: 'Artist-based tracking', obj: 'Data', site: 'Both', s: 'Not started', eta: 'TBD', move: 'new', why: 'Moved from Up next: now a roadmap sheet row', d: 'Track artist behavior and build marketing audiences from it. No dates on the roadmap sheet yet.' },
        { e: '🤖', t: 'Make the sites ready for AI shopping', sheet: 'Agentic readiness', obj: 'Traffic', site: 'Both', s: 'Not started', eta: 'TBD', move: 'new', why: 'Moved from Up next: now a MarTech row on the roadmap sheet', d: 'So AI assistants can find and recommend our products. No dates on the roadmap sheet yet.' }
      ] },
    { key: 'artist', name: 'Artist and Apps', icon: '🎨', tagline: 'Tax and compliance tooling for sellers, plus native checkout in the apps.',
      items: [
        { e: '🧾', t: 'Self-serve artist tax reports', obj: 'Compliance', site: 'RB', s: 'Live', eta: 'Oct 22', move: 'up', why: 'EU tax compliance takes most of Q4', d: 'Artists pull their own tax reports.' },
        { e: '📱', t: 'iOS native checkout test', obj: 'Retention', imp: 'About A$1.3M a year', impSrc: 'Roadmap sheet estimate', site: 'RB', s: 'Live', eta: 'Oct 19', move: 'steady', d: 'A/B test in iOS 6.1.1.' },
        { e: '📊', t: 'App eventing (purchase event first)', obj: 'Data', imp: 'Unlocks app CVR in Amplitude', impSrc: 'Matz, Oct 21', site: 'RB', s: 'Planned', eta: 'After native checkout', move: 'steady', d: 'Lite eventing for the Redbubble app (purchase first) so app CVR can be read in Amplitude. Next up after native checkout ships on iOS and Android.' },
        { e: '🤖', t: 'Android native checkout', obj: 'Retention', imp: 'About A$500K a year', impSrc: 'Roadmap sheet estimate', site: 'RB', s: 'Delayed', eta: 'Oct 30', move: 'down', why: 'Roadmap sheet moved launch from Oct 19 to Oct 30; no reason given yet', d: 'Same as iOS, on Android.' },
        { e: '⚖️', t: 'Takedown (DMCA) tool', obj: 'Compliance', site: 'Both', s: 'In dev', eta: 'November', why: 'Roadmap sheet: build ends Oct 30, launch in November (was end of October at the Oct 13 review)', move: 'steady', d: 'Faster takedown handling.' },
        { e: '✅', t: 'Seller verification compliance', obj: 'Compliance', site: 'Both', s: 'Discovery', eta: 'Jan 2027', move: 'steady', pts: [6, 12], link: 'https://articore.atlassian.net/browse/DEAP-5914', d: 'Regulatory seller checks.' }
      ],
      dropped: [['Uploader unification', 'Out of H2']] },
    { key: 'dashery', name: 'Dashery', icon: '🛍️', tagline: 'Creator tools and notifications on the Shopify app, with new channels lined up for 2027.',
      items: [
        { e: '🧷', t: 'Cart upsell results', obj: 'AOV', imp: 'Sticker attach up from about 17% to 30%', impSrc: 'Measured after launch', site: 'Dashery', s: 'Launched', eta: 'Live', move: 'steady', d: 'Sticker attach rose from about 17% to 30%.' },
        { e: '📊', t: 'Creator Dashboard v2', obj: 'Data', site: 'Dashery', s: 'Launched', eta: 'Oct 29', move: 'up', why: 'Live for all creators Oct 29', pts: [0, 9], link: 'https://articore.atlassian.net/browse/DEAP-6623', d: 'Better creator reporting.' },
        { e: '📈', t: 'Creator behavior data in Amplitude', obj: 'Data', site: 'Dashery', s: 'In dev', eta: 'Oct 31', move: 'steady', tags: ['Data'], pts: [8, 10], link: 'https://articore.atlassian.net/browse/DEAP-4918', d: 'Admin eventing for creator analytics.' },
        { e: '🔔', t: 'Notification system MVP', obj: 'Retention', site: 'Dashery', s: 'In dev', eta: 'Nov 6', move: 'steady', why: 'Roadmap sheet: build runs Oct 26 to Nov 3, launch Nov 6 (was Nov 1)', pts: [0, 4], ptsUnit: 'issues', link: 'https://articore.atlassian.net/browse/DEAP-6604', d: 'Alerts for creators.' },
        { e: '🛒', t: 'Meta Shopping', obj: 'Revenue', site: 'Dashery', s: 'Planned', eta: 'Q1 2027', move: 'steady', d: 'Kickoff next week.' },
        { e: '🎵', t: 'TikTok Shop', obj: 'Revenue', site: 'Dashery', s: 'Discovery', eta: 'TBD', move: 'new', d: 'Early exploration.' }
      ] },
    { key: 'de', name: 'Data Engineering', icon: '🧮', tagline: 'Peak-ready data: lifecycle email, product feeds, new products and reporting that holds up at peak. In Data Engineering priority order.',
      items: [
        { e: '🎯', t: 'Simon event matching', obj: 'Retention', imp: 'Lifecycle email reaches more people', impSrc: "Data Engineering priority list", site: 'Both', s: 'In dev', eta: 'Before peak', why: 'The event-matching tickets ship before peak; the Jira epic is larger and holds other work (Data Engineering lead, Oct 27)', move: 'steady', tags: ['Data'], d: 'Matches site events to contacts so abandoned-cart and other lifecycle emails reach more shoppers.' },
        { e: '📱', t: 'New iPhone cases in the feed', obj: 'Revenue', imp: 'About $960K a year', impSrc: 'Roadmap sheet estimate', refs: [{ go: 'tp|channel/Paid Search', l: 'TeePublic Paid Search' }], site: 'Both', s: 'Code review', eta: 'End of Oct', move: 'up', why: 'In review (Data Engineering lead, Oct 27)', tags: ['Data'], d: 'Adds the newest iPhone cases to the Shopping feeds.' },
        { e: '🖼️', t: 'Feed fixes', obj: 'Revenue', impSrc: 'Roadmap sheet estimate', site: 'Both', s: 'In dev', eta: 'End of Oct', move: 'steady', why: 'Tied to the Google Shopping sale price fix (Data Engineering lead, Oct 27)', tags: ['Data'], link: 'https://articore.atlassian.net/browse/DEAP-318', d: 'Healthier Shopping feeds after the image bug; goes with the sale price fix.' },
        { e: '💌', t: 'Greeting cards and postcards in the feeds', obj: 'Revenue', imp: 'Shopping ads for the new card products', impSrc: "Data Engineering priority list", site: 'TP', s: 'In dev', eta: 'After the site launch', move: 'up', why: 'Greeting cards feed ticket moved to In Development Oct 28 (DEAP-6499). Feed work follows the TeePublic site launch, which is not Data Engineering work (Data Engineering lead, Oct 27)', d: 'Adds greeting cards and postcards to the Shopping feeds once they are live on TeePublic.' },
        { e: '🧹', t: 'Stop mailing about 80K contacts', obj: 'Compliance', site: 'Both', s: 'Launched', eta: 'Oct 28', move: 'up', why: 'Released Oct 28 (DEAP-5869); one confirmation from the email platform still pending', d: 'Removes contacts we should not be emailing.' },
        { e: '📈', t: 'Lifecycle reporting fixes', obj: 'Retention', imp: 'Lets Marketing measure Simon impact', impSrc: "Data Engineering priority list", site: 'Both', s: 'In dev', eta: 'Before peak', why: 'On track to deliver before peak; the Jira epic now also holds new QA tickets, so its dates and progress overstate the work left (Data Engineering lead, Oct 27)', move: 'steady', tags: ['Data'], link: 'https://articore.atlassian.net/browse/DEAP-6445', d: 'A 3 to 14 day lookback, every Redbubble order in the orders table, and gifted orders credited to the buyer.' },
        { e: '❄️', t: 'Keep Sigma up through peak', obj: 'Data', imp: 'Keeps Sigma from timing out during Black Friday and Cyber Monday', impSrc: "Data Engineering priority list", site: 'Both', s: 'Planned', eta: 'Before peak', move: 'steady', tags: ['Data'], d: 'Snowflake warehouse changes for Sigma.' },
        { e: '🧾', t: 'Products on order events in Amplitude', obj: 'Data', site: 'TP', s: 'Launched', eta: 'Oct 26', why: 'Launched Oct 26 (Data Engineering lead, Oct 27)', move: 'steady', tags: ['Data'], pts: [4, 8], ptsUnit: 'issues', link: 'https://articore.atlassian.net/browse/DEAP-1603', d: 'Powers top-seller and category reporting.' },
        { e: '🏷️', t: 'Fix sale prices in Google Shopping', obj: 'Revenue', imp: 'Protects strikethrough sale prices in Shopping ads', impSrc: "Data Engineering priority list", site: 'Both', s: 'Code review', eta: 'End of Oct', why: 'Ticket in review in Jira (Data Engineering lead, Oct 27)', move: 'steady', d: 'Price updates to Google Merchant Center need fixing; each promo needs 5 days of lead time.' },
        { e: '💲', t: 'Analytics data for the pricing test', obj: 'Data', imp: 'Requested by Pricing for the pricing test', impSrc: "Data Engineering priority list", site: 'Both', s: 'Planned', eta: 'Pre-peak', move: 'steady', tags: ['Data'], d: 'A data model change needs review, then a backfill.' },
        { e: '📡', t: 'Real-time Amplitude', obj: 'Data', site: 'Both', refs: [{ go: 'tp|overall', l: 'TeePublic CVR' }], s: 'In dev', eta: '2027', why: 'Oct 21 MarTech meeting: true real-time streaming is a next-year goal', move: 'steady', tags: ['Data'], d: 'Diagnose CVR during peak, not a day later.' },
        { e: '🤝', t: 'Simon AI profile attributes', obj: 'Retention', site: 'Both', s: 'Launched', eta: 'Oct 27', why: 'Phase 1 (the P0 and P1 attributes) is delivered; P2 comes next year as its own phase (Data Engineering lead, Oct 27)', move: 'up', tags: ['Data'], pts: [40, 50], link: 'https://articore.atlassian.net/browse/DEAP-2807', d: 'Lifecycle personalization data.' }
      ],
      dropped: [['Marketing data foundation', 'Paused'], ['ChatGPT and Reddit feeds', 'Static feed covers it; window missed'], ['Tote bags on TeePublic', 'Not planned'], ['Trucker hats on Redbubble', 'Not planned'], ['Flat-lay images in the feed', 'Marketing covers it with a supplemental feed until after peak'], ['Beam order IDs in the warehouse', 'Not planned; Analytics may work around it'], ['More Shopify data in the warehouse', 'After code freeze']] }
  ]
};

// Shout-outs for the Trending tab: public, positive, specific. From #released and project channels, Oct 28 to 30.
// One person, new every day. Criterion: drove something through (triaged, unblocked, pushed it over the line), not just "it launched".
// recent: the last 14 days of names, so the refresh never repeats someone inside two weeks.
const SHOUTS = { when: 'Fri Oct 30', e: '⭐', name: 'James Jeges', img: '', headline: 'Got Redbubble shoppers\' browsing into email automation, from almost nothing to about 1.7K contacts a day', what: 'Redbubble\'s lifecycle email tool could not match most browsing to a person, so "abandon browse" emails barely ran. James **helped ship client-side events that carry a logged-in shopper\'s email, encrypted in the browser** and only decrypted in the data pipeline, so no plain-text email is exposed. On **Oct 28 the abandon-browse audience went from about 0 to about 1.7K contacts a day**, on par with abandon cart, and the same event path now sends **90x the previous event volume** into the tool on TeePublic.', why: 'Browse intent is the strongest signal for win-back email, and it is flowing just ahead of peak.', pts: [['🔐', 'How', 'sent the shopper\'s email on client-side events, encrypted in the browser, decrypted only in the pipeline'], ['📬', 'Result', 'abandon browse went from about 0 to about 1.7K contacts a day, on par with abandon cart'], ['➡️', 'Next', 'server-side events are the next step']], where: '#released', refs: [{ url: 'https://grid-articore.enterprise.slack.com/archives/C0V4PM9DW', l: '#released post' }, { go: 'rb|overall', l: 'Redbubble CVR' }], recent: ['James Jeges', 'Josh Geiser', 'Oliver Belmont', 'Will Smith', 'Dustin Chen', 'Joshua Hassara', 'Anthony Ishkan'] };


// A/B tests page: key discussions and decisions about testing, from Amplitude Experiment, Slack and meeting notes.
const TESTTALK = [
  { icon: '👀', title: 'Redbubble "Recently viewed" row: ship it without an A/B test?', refs: [{ soon: 'search', l: 'Search & Content priorities' }, { jira: 'DEAP-6870' }, { url: 'https://grid-articore.enterprise.slack.com/archives/C0CAD7Q83B8/p1793239498250889', l: 'Peak planning thread' }], status: 'Proposed', tone: 'warn', channel: '#cfx-deap-peak-2026-planning', when: 'Oct 29',
    body: 'The Search & Content team wants to add a "Recently viewed" row at the bottom of Redbubble search results and product pages before peak. On TeePublic about 1% of sessions use it daily and 17% of shoppers who click it go on to buy. With little time left to test, the proposal is to just ship it, since it sits at the bottom of the page and is an industry standard, and a second team agreed it looks low risk. No objections so far.',
    why: 'Skipping the test saves about two weeks before the freeze, but means its effect on Redbubble CVR can only be read loosely against comparable days.' },
  { icon: '🛒', title: 'Redbubble cart test now combines sticker cross-sell with trust badges', refs: [{ test: '1580138', l: 'Cart cross-sell test' }, { soon: 'customer', l: 'Customer priorities' }, { url: 'https://grid-articore.enterprise.slack.com/archives/C0V4PM9DW', l: '#released post' }], status: 'Running', tone: 'good', channel: '#released', when: 'Oct 29',
    body: "The cart test went live Oct 29 at 2:38 PM ET with three groups: today's cart, a cross-sell carousel with the full trust badges, and the carousel with only two badges. The carousel offers stickers first, then postcards, greeting cards, magnets, pins and coasters. It replaces the earlier test that removed the badges to make room, which lost on CVR. After one day it is far too early to read.",
    why: "Testing the two changes together shows whether cross-sell raises order value without the badge removal that hurt CVR." },
  { icon: '🤖', title: 'T-shirt style picker test restarted after bot traffic skewed desktop', refs: [{ test: '1569370', l: 'Style picker test' }], status: 'Restarted', tone: 'warn', channel: 'Amplitude Experiment', when: 'Oct 30',
    body: "Early desktop add-to-cart rates looked far too low because most desktop visitors in the test had bot scores between 30 and 79, behaved like bots and showed phone-sized screens. The test now uses a stricter bot filter and the count restarted, so only Oct 27 to 29 is in. Amplitude flags uneven group sizes and a changed audience, and the team plans to report desktop and mobile separately over about four weeks.",
    why: "Without the filter, bot traffic would have made a sound design look like it hurt desktop CVR." },
  { icon: '🧭', title: 'Topics-first navigation: settings edited, rollback advised, nothing significant', refs: [{ test: '1409398', l: 'Topics-first navigation test' }], status: 'Running', tone: 'warn', channel: 'Amplitude Experiment', when: 'Oct 30',
    body: "The test settings were edited today. Amplitude now flags uneven group sizes and recommends rolling back to no change. All three variants sit slightly below no change on Sitewide CVR (topics nav -0.6%, defaults to T-shirts -0.6%, runs a search -1.0%) and none is significant, so no one has called it yet.",
    why: "A rollback is cheap before peak, but a flat result is not proof the variants hurt." },
  { icon: '🏷️', title: 'Sale messaging: copy test 35% vs 40% off for the first three sale days?', refs: [{ url: 'https://grid-articore.enterprise.slack.com/archives/C0V4PM9DW', l: '#released' }], status: 'Open', tone: 'warn', channel: '#team-marketing-lifecycle', when: 'Oct 30',
    body: "Lifecycle marketing is deciding whether messaging should match the actual offer (up to 35% or 40% off). One view is to align where possible; another is that flipping between the two changes little, since the lift comes from on-site tools like the timer. A click-rate test of 35% versus 40% copy is set up for the first three sale days, with an SMS copy test also offered, and a question remains whether a shopper can see both versions in the SMS tool.",
    why: "It settles whether one discount message can run across all channels in the peak sale." }
];

// What is selling: outside signals, checked against the web.
const SELLCALL = {"e":"📈","tk":"Brewers designs ~4 to 37× usual. Push them?","title":"Brewers designs are still selling at several times usual. Keep pushing them?","body":"All seven top TeePublic designs on Oct 29 were Brewers, led by one at 64 orders. The series may end Oct 31.","ask":"Keep them in paid social, email and on-site through the last game, then move Halloween placements to Thanksgiving and holidays.","src":""};

// Vibe check: patterns across Slack and meetings. Never names, never complaints about people.
const VIBE = { e: '🌤️', mood: 'Busy but steady', summary: 'Pre-peak crunch with Cyber promos now scheduled. Teams are trading small items to protect bigger ones, and a World Series bump on TeePublic is cooling. Energy is good; the risk is launches stacking up before the freeze.',
  pace: 'High', churn: 'Moderate', fire: 'Some', fireNote: 'One unstable data-jobs incident is stabilizing, and one scraper hit Redbubble hard for three days; each had an owner within a day.', team: 'Strong', teamNote: 'Quick tradeoffs and cross-team help are keeping peak work moving.' };

// What customer service is saying: only above-normal topics; everything else reads as "all good".
const CS = { window: 'Customer service channels, Oct 23 to 30',
  tp: { topics: [], note: 'All good over here: normal volume, nothing trending.' },
  rb: { topics: [], note: 'All good over here: normal volume. Agents have a few one-off questions: a shopper on a landline could not get a checkout text code, one first-order discount promise from an email, and shipping to Argentina is not available.' } };

// Team velocity from Matt Swope's #team-deap-metrics-* posts (two-week sprints, last two closed sprints, through Oct 15).
const VEL = {
  customer: { wk: 20, done: 42, trend: 'flat', note: 'About 40 points a sprint. Kick-off completion has been under 70% for five sprints.' },
  plc: { wk: 17, done: 68, trend: 'down', note: 'About 34 points a sprint; the latest sprint delivered 37.5 points but finished 68% of a kick-off that was a third above forecast.' },
  // planned/ctx: background from the Data Engineering Planning Health analysis (Jira changelogs, sprints 10 to 21, pulled Oct 22). Team-level only.
  de: { wk: 28, done: 75, trend: 'up', planned: 0.6, ctx: 'The latest Data Engineering sprint finished 75% of what it committed, up from 34%, but work added after kick-off equaled 72% of the plan, so dates here assume less room for planned work.', note: 'About 56 points last sprint, the most in six sprints; completion rebounded, though mid-sprint adds stay high.' },
  dashery: { wk: 23, done: 81, trend: 'down', note: 'About 45 points a sprint, down from a record sprint; completion still above 80%.' },
  search: { wk: 25, done: 71, trend: 'flat', note: 'About 50 points a sprint; the latest sprint finished 71% of kick-off, with only 2 points added mid-sprint.' },
  artist: { wk: 19, done: 86, trend: 'up', note: 'About 38 points a sprint, though large tickets closing at sprint end inflate it.' }
};

// Who works on each roadmap project, from Jira assignees and the roadmap sheet. Filled by the refresh.
const PEOPLE = {
"Beam conversion test": {
"pm": "Jonathan Tan",
"sponsor": "Vivek Kumar",
"eng": [
"Shylah Banach-Chiera"
]
},
"Beam conversion test in cart": {
"pm": "Jonathan Tan",
"sponsor": "Vivek Kumar",
"eng": [
"Shylah Banach-Chiera"
]
},
"PayPlus offer at checkout": {
"pm": "Jonathan Tan",
"eng": [
"Shylah Banach-Chiera"
]
},
"Cart and cart-tray cross-sell": {
"pm": "Jonathan Tan",
"sponsor": "Vivek Kumar",
"lead": "James Jeges",
"eng": [
"James Jeges"
],
"looped": [
"Oliver Belmont (Engineering Manager, tagged)",
"Allison Cassara (tagged)",
"Amelia Cacchione (tagged)"
],
"docs": [
{
"l": "Product spec (draft)",
"url": "https://articore.atlassian.net/wiki/pages/viewpage.action?pageId=5150343266"
}
]
},
"T-shirt style pills on product pages": {
"pm": "Jonathan Tan",
"sponsor": "Jerzy Shustin",
"eng": [
"Kashish Bhutani"
],
"looped": [
"Oliver Belmont (reporter)"
],
"docs": [
{
"l": "TDD",
"url": "https://articore.atlassian.net/wiki/pages/viewpage.action?pageId=5094080521"
}
]
},
"Sign in with Google": {
"pm": "Jonathan Tan",
"sponsor": "Jerzy Shustin",
"eng": [
"Milan Sacher"
],
"docs": [
{
"l": "Milestones and work spec",
"url": "https://articore.atlassian.net/wiki/pages/viewpage.action?pageId=5052104849"
}
]
},
"Redbubble quick wins": {
"pm": "Jonathan Tan",
"sponsor": "Vivek Kumar"
},
"Fix Redbubble channel tracking": {
"pm": "Jonathan Tan",
"looped": [
"Oliver Belmont (commented)",
"Milan Sacher (commented)",
"Amelia Cacchione (commented)"
],
"docs": [
{
"l": "UTM parameter comparison (Analytics)",
"url": "https://articore.atlassian.net/wiki/spaces/AN/pages/5173116930/UTM+parameter+comparision"
}
]
},
"Marketing opt-in on Express Pay": {
"pm": "Jonathan Tan",
"sponsor": "Sam Nam",
"eng": [
"Efren Aguirre"
],
"looped": [
"Shylah Banach-Chiera (reporter)"
],
"docs": [
{
"l": "TDD",
"url": "https://articore.atlassian.net/wiki/pages/viewpage.action?pageId=5075828997"
}
]
},
"Thank-you page upsell, 6 slots": {
"lead": "Jeff Cooper",
"eng": [
"Jeff Cooper"
]
},
"Shirt Monkey integration": {
"pm": "Revin Wade",
"sponsor": "Jerzy Shustin",
"lead": "Nicholas Cheong",
"eng": [
"Palina Matskevich"
],
"looped": [
"Umidjon Ustabaev (commented)",
"Matthew Wills (tagged)"
]
},
"Print Logistics integration": {
"pm": "Revin Wade",
"sponsor": "Jerzy Shustin",
"lead": "Nicholas Cheong",
"eng": [
"Danila Hlazau"
],
"looped": [
"Umidjon Ustabaev (commented)"
]
},
"Sub Dimension integration": {
"pm": "Revin Wade",
"sponsor": "Jerzy Shustin",
"lead": "Danila Hlazau",
"eng": [
"Palina Matskevich"
],
"looped": [
"Umidjon Ustabaev (commented)"
]
},
"New TeePublic fulfillers": {
"pm": "Revin Wade",
"sponsor": "Jerzy Shustin",
"eng": [
"Palina Matskevich",
"Nicholas Cheong",
"Danila Hlazau"
],
"looped": [
"Umidjon Ustabaev (commented)",
"Matthew Wills (tagged)"
]
},
"Delivery-issue resolution queue": {
"pm": "Revin Wade",
"sponsor": "Jerzy Shustin",
"lead": "Chris",
"eng": [
"Danila Hlazau",
"Palina Matskevich"
],
"looped": [
"Matthew Wills (reporter)"
],
"docs": [
{
"l": "Product spec",
"url": "https://articore.atlassian.net/wiki/pages/viewpage.action?pageId=4888297473"
}
]
},
"Trucker hat fulfillment": {
"pm": "Revin Wade",
"sponsor": "Jerzy Shustin",
"lead": "Chris",
"eng": [
"Nitin Srivastava"
],
"looped": [
"Nicholas Cheong (reporter)",
"Matthew Wills (commented)"
],
"docs": [
{
"l": "Launch page: RBO Trucker Hat",
"url": "https://articore.atlassian.net/wiki/pages/viewpage.action?pageId=5095882929"
}
]
},
"OMAFS phases 2 to 5": {
"pm": "Revin Wade",
"sponsor": "Aron Vaughan",
"lead": "Chris",
"docs": [
{
"l": "OMAFS Phase 3 spec",
"url": "https://articore.atlassian.net/wiki/x/swDJIQE"
}
]
},
"Search cluster migration": {
"pm": "Wendy Fullam",
"sponsor": "Aron Vaughan",
"lead": "Lili Molloy",
"eng": [
"Vlad",
"Lili Molloy",
"Jessie Liu",
"Antonio Arce",
"Mohit Bansal"
],
"looped": [
"Imene Drir (reporter)"
]
},
"Learn to Rank before the freeze": {
"pm": "Wendy Fullam",
"sponsor": "Vivek Kumar",
"lead": "Yulia Perunovskaia",
"eng": [
"Lili Molloy",
"Yulia Perunovskaia"
],
"looped": [
"Emery Finkelstein (reporter)"
],
"docs": [
{
"l": "Product spec (draft)",
"url": "https://articore.atlassian.net/wiki/spaces/ESAC/pages/4627824653/DRAFT+Prod+Spec+Rank+Optimisation+for+Redbubble"
}
]
},
"Learn to Rank rerun": {
"pm": "Wendy Fullam",
"sponsor": "Vivek Kumar",
"lead": "Yulia Perunovskaia",
"eng": [
"Lili Molloy",
"Yulia Perunovskaia"
],
"looped": [
"Emery Finkelstein (reporter)"
],
"docs": [
{
"l": "Product spec (draft)",
"url": "https://articore.atlassian.net/wiki/spaces/ESAC/pages/4627824653/DRAFT+Prod+Spec+Rank+Optimisation+for+Redbubble"
}
]
},
"Greeting card and postcard search": {
"eng": [
"Antonio Arce",
"Mohit Bansal",
"Ayush Yadav",
"Jessie Liu"
],
"looped": [
"Emery Finkelstein (reporter)"
]
},
"Bad-art detection research": {
"pm": "Wendy Fullam",
"sponsor": "Sam Nam",
"lead": "Matt I.",
"eng": [
"Yulia Perunovskaia",
"Matt I."
],
"looped": [
"Imene Drir (reporter)"
]
},
"Product scoping in search autocomplete": {
"pm": "Wendy Fullam",
"sponsor": "Aron Vaughan",
"lead": "Jessie Liu"
},
"SEO: 20 results per search page": {
"pm": "Wendy Fullam",
"sponsor": "Sam Nam",
"lead": "Mohit Bansal"
},
"Trucker hats on Redbubble": {
"pm": "Bishal Shrestha",
"sponsor": "Jerzy Shustin",
"lead": "Kieren McDevitt",
"eng": [
"Kieren McDevitt"
]
},
"Standardized wall art sizes": {
"pm": "Bishal Shrestha",
"sponsor": "Jerzy Shustin",
"lead": "Blake Williams",
"eng": [
"Bishal Shrestha",
"Blake Williams"
],
"docs": [
{
"l": "Discovery notes",
"url": "https://articore.atlassian.net/wiki/pages/viewpage.action?pageId=5025431571"
}
]
},
"Retire 8 low-value Redbubble products": {
"pm": "Bishal Shrestha",
"sponsor": "Jerzy Shustin",
"lead": "Kieren McDevitt",
"eng": [
"Kieren McDevitt"
],
"looped": [
"Matty Boyles (reporter)"
],
"docs": [
{
"l": "Sunset Phase 4 (RBO)",
"url": "https://articore.atlassian.net/wiki/pages/viewpage.action?pageId=5095882791"
}
]
},
"Shared product data, phase 2": {
"pm": "Tom Sommer",
"sponsor": "Aron Vaughan",
"lead": "Blake Williams",
"docs": [
{
"l": "Rollout strategy",
"url": "https://articore.atlassian.net/wiki/spaces/DTP/pages/4407066630/Product+Domain+Consolidation+Project+Phases+Rollout+Strategy+2026-27"
}
]
},
"Server-side tag security and monitoring": {
"eng": [
"Nishant Chauhan"
],
"looped": [
"Arvind Patil (reporter)",
"Amelia Cacchione (tagged)"
],
"docs": [
{
"l": "Credential audit",
"url": "https://docs.google.com/spreadsheets/d/13Y9LB3Hua5hdI4YzOYIt3KSrPv90SN9RmNjP9G6JMSM/edit"
}
]
},
"Amazon Ads tracking on TeePublic": {
"eng": [
"Achal",
"Nishant Chauhan"
],
"looped": [
"Arvind Patil (reporter)"
],
"docs": [
{
"l": "Pixel and measurement setup",
"url": "https://articore.atlassian.net/wiki/pages/viewpage.action?pageId=4949835790"
}
]
},
"Creator affiliate tag on Redbubble": {
"pm": "Vaibhav Soni",
"eng": [
"Nishant Chauhan"
],
"looped": [
"Matthew Mayback (tagged)"
]
},
"Meta tracking follow-ups": {
"pm": "Vaibhav Soni",
"eng": [
"Nishant Chauhan"
]
},
"Self-serve artist tax reports": {
"pm": "Matz Edstrom",
"sponsor": "Vivek Kumar",
"lead": "Patrick",
"docs": [
{
"l": "Product spec",
"url": "https://articore.atlassian.net/wiki/x/B4ABLQE"
}
]
},
"iOS native checkout test": {
"pm": "Matz Edstrom",
"sponsor": "Aron Vaughan",
"lead": "Ross",
"docs": [
{
"l": "Native checkout docs",
"url": "https://articore.atlassian.net/wiki/spaces/MT/folder/4676812812/Native+Checkout"
}
]
},
"Android native checkout": {
"pm": "Matz Edstrom",
"sponsor": "Aron Vaughan",
"lead": "Ross",
"docs": [
{
"l": "Native checkout docs",
"url": "https://articore.atlassian.net/wiki/spaces/MT/folder/4676812812/Native+Checkout"
}
]
},
"Takedown (DMCA) tool": {
"pm": "Tom Sommer",
"sponsor": "Jerzy Shustin"
},
"Seller verification compliance": {
"pm": "Matz Edstrom",
"sponsor": "Vivek Kumar",
"lead": "Patrick",
"eng": [
"Kelsey Scott"
]
},
"Seller verification": {
"pm": "Matz Edstrom",
"sponsor": "Vivek Kumar",
"lead": "Patrick",
"eng": [
"Kelsey Scott"
]
},
"Automated licensing and royalty reporting": {
"pm": "Matz Edstrom",
"sponsor": "Sam Nam",
"lead": "Patrick"
},
"Cart upsell results": {
"pm": "Grace Russell",
"sponsor": "Vivek Kumar",
"lead": "Tony",
"docs": [
{
"l": "Product spec",
"url": "https://articore.atlassian.net/wiki/spaces/EDTP/pages/4963008630"
}
]
},
"Dashery cart sticker upsell": {
"pm": "Grace Russell",
"sponsor": "Vivek Kumar",
"lead": "Tony",
"docs": [
{
"l": "Product spec",
"url": "https://articore.atlassian.net/wiki/spaces/EDTP/pages/4963008630"
}
]
},
"Creator Dashboard v2": {
"pm": "Grace Russell",
"eng": [
"Drew Reynolds",
"Jason Chan"
]
},
"Creator behavior data in Amplitude": {
"pm": "Grace Russell",
"sponsor": "Vivek Kumar",
"lead": "Tony",
"eng": [
"Pankaj Gupta"
],
"looped": [
"Amelia Cacchione (commented)"
],
"docs": [
{
"l": "Admin eventing spec",
"url": "https://articore.atlassian.net/wiki/pages/viewpage.action?pageId=5030576224"
},
{
"l": "Questions to answer with admin data",
"url": "https://articore.atlassian.net/wiki/pages/viewpage.action?pageId=4939251747"
}
]
},
"Notification system MVP": {
"pm": "Grace Russell",
"sponsor": "Vivek Kumar",
"lead": "Tony",
"docs": [
{
"l": "Product spec (draft)",
"url": "https://articore.atlassian.net/wiki/spaces/EDTP/pages/5055938623/2610+Product+Notifications+MVP+draft"
}
]
},
"Meta Shopping": {
"pm": "Grace Russell",
"sponsor": "Vivek Kumar",
"lead": "Tony",
"docs": [
{
"l": "Product spec",
"url": "https://articore.atlassian.net/wiki/x/LwA8LgE"
}
]
},
"Meta Shopping feed": {
"pm": "Grace Russell",
"sponsor": "Vivek Kumar",
"lead": "Tony",
"docs": [
{
"l": "Product spec",
"url": "https://articore.atlassian.net/wiki/x/LwA8LgE"
}
]
},
"Feed fixes, incl. new iPhone case": {
"pm": "Amelia Cacchione",
"sponsor": "Sam Nam",
"lead": "Ayush Yadav",
"eng": [
"Sangil Mun",
"Ayush Yadav",
"Imene Drir"
],
"looped": [
"Justin Evans (reporter)"
]
},
"Lifecycle reporting fixes": {
"pm": "Amelia Cacchione",
"sponsor": "Sam Nam",
"lead": "Dasha",
"docs": [
{
"l": "Product spec",
"url": "https://articore.atlassian.net/wiki/spaces/DE1/pages/4857791204/RB+Lifecycle+Marketing+Reporting+Product+Spec"
}
]
},
"Simon AI profile attributes": {
"pm": "Amelia Cacchione",
"sponsor": "Sam Nam",
"eng": [
"Will Soupcoff",
"Dasha",
"Muhammad Tariq"
],
"docs": [
{
"l": "Segmentation properties",
"url": "https://articore.atlassian.net/wiki/spaces/MARTP/pages/4604625018/Properties+for+Segmentation+Content"
}
]
},
"Products on order events in Amplitude": {
"eng": [
"Amelia Cacchione"
],
"looped": [
"Imene Drir (reporter)"
]
},
"Cart and checkout revenue": {
"pm": "Jonathan Tan",
"sponsor": "Vivek Kumar",
"eng": [
"Shylah Banach-Chiera",
"James Jeges"
],
"docs": [
{
"l": "Product spec (draft)",
"url": "https://articore.atlassian.net/wiki/pages/viewpage.action?pageId=5150343266"
}
]
},
"Tiger team quick wins": {
"lead": "Jeff Cooper",
"eng": [
"Jeff Cooper"
]
}
};

// Start, committed and likely dates per project, from Jira epics, Slack and meeting notes. Filled by the refresh.
const DATES = {"More prominent Redbubble search bar": {"start": "2026-10-29", "startSrc": "Jira DEAP-6615: moved to In Development Oct 29", "notStarted": false}, "PayPlus offer at checkout": {"start": "2026-08-25", "startSrc": "Jira DEAP-4816: first In Progress child (DEAP-4896)", "due": "2026-10-16", "dueSrc": "Meeting notes, CVR readout Oct 13: kickoff Oct 14, end-of-week launch (earlier target Oct 13, Slack Oct 7)", "notStarted": false}, "Beam conversion test": {"start": "2026-10-14", "startSrc": "Jira DEAP-6282: first In Development", "launched": "2026-10-19", "launchedSrc": "Jira DEAP-6282 Released Oct 19; Meeting notes, Exec/Customer Oct 19 (live)", "notStarted": false}, "Beam conversion test in cart": {"start": "2026-10-14", "startSrc": "Jira DEAP-6282: first In Development", "launched": "2026-10-19", "launchedSrc": "Jira DEAP-6282 Released Oct 19; Meeting notes, Exec/Customer Oct 19 (live)", "notStarted": false}, "Cart and cart-tray cross-sell": {"start": "2026-10-09", "startSrc": "Jira DEAP-6266: first In Development (Code Review since Oct 20)", "notStarted": false, "launched": "2026-10-29", "launchedSrc": "Slack #released Oct 29 (Jon: A/B test live 2:38 PM ET)"}, "T-shirt style pills on product pages": {"start": "2026-10-09", "startSrc": "Jira DEAP-5915: first In Development", "notStarted": false}, "Apple Pay buy-now on product pages": {"notStarted": true, "notStartedSrc": "Meeting notes, Peak standup Oct 21: feasibility still being assessed, no build"}, "Apple Pay buy-now on Redbubble": {"notStarted": true, "notStartedSrc": "Meeting notes, Peak standup Oct 21: feasibility still being assessed, no build"}, "Cart tray vs cart page test": {"notStarted": true, "notStartedSrc": "Meeting notes, CVR readout Oct 13: blocked on tray cross-sell implementation"}, "Premium tee upsell in cart": {"notStarted": true, "notStartedSrc": "Meeting notes, CVR readout Oct 13: tracked but not resourced"}, "Fix Redbubble channel tracking": {"notStarted": true, "notStartedSrc": "Jira DEAP-5099: Backlog, never moved"}, "Sign in with Google": {"start": "2026-08-04", "startSrc": "Jira DEAP-4840: first In Progress child (DEAP-4481)", "launched": "2026-10-29", "launchedSrc": "Slack #released Oct 29 (Allison: sign-up with Google live about 1 PM ET)"}, "Thank-you page upsell, 6 slots": {"start": "2026-10-20", "startSrc": "Jira DEAP-6558: first In Development", "notStarted": false}, "Marketing opt-in on Express Pay": {"start": "2026-09-16", "startSrc": "Jira DEAP-5509: first In Progress child", "launched": "2026-10-16", "launchedSrc": "Jira DEAP-5825 (opt-in checkbox) Released Oct 16"}, "Cart upsell results": {"start": "2026-09-18", "startSrc": "Jira DEAP-5747: first In Progress child", "launched": "2026-10-08", "launchedSrc": "Slack #released Oct 8 (Grace: Cart Upsell v1; Tony: fully enabled via flipper)"}, "Dashery cart sticker upsell": {"start": "2026-09-18", "startSrc": "Jira DEAP-5747: first In Progress child", "launched": "2026-10-08", "launchedSrc": "Slack #released Oct 8 (Grace: Cart Upsell v1; Tony: fully enabled via flipper)"}, "Creator Dashboard v2": {"start": "2026-10-19", "startSrc": "Jira DEAP-6623: first In Progress child (DEAP-6463)", "notStarted": false, "launched": "2026-10-29", "launchedSrc": "Slack #released Oct 29 (Grace: Creator Dashboard v2 is live); Jira DEAP-6623 Released"}, "Creator behavior data in Amplitude": {"start": "2026-10-08", "startSrc": "Jira DEAP-4918: first In Development", "due": "2026-10-31", "dueSrc": "Meeting notes, Exec Roadmap Review Oct 13 (extended to Oct 31)", "notStarted": false}, "Meta Shopping": {"notStarted": true, "notStartedSrc": "Slack #ask-deap-dashery Sep 28: kicks off Nov/Dec; Meeting notes, Dashery Sync Oct 16: discovery Q4, launch Q1 2027"}, "Meta Shopping feed": {"notStarted": true, "notStartedSrc": "Slack #ask-deap-dashery Sep 28: kicks off Nov/Dec; Meeting notes, Dashery Sync Oct 16: discovery Q4, launch Q1 2027"}, "Shirt Monkey integration": {"start": "2026-08-21", "startSrc": "Jira DEAP-5105: first In Development (Release Pending Oct 22)", "notStarted": false}, "Print Logistics integration": {"start": "2026-08-06", "startSrc": "Jira DEAP-4484: first In Development (UAT since Oct 5)", "notStarted": false}, "Sub Dimension integration": {"start": "2026-07-23", "startSrc": "Jira DEAP-4485: first In Development (Release Pending Oct 22)", "notStarted": false}, "New TeePublic fulfillers": {"start": "2026-07-23", "startSrc": "Jira DEAP-4485 (Sub Dimension): earliest In Development of the three", "notStarted": false}, "Delivery-issue resolution queue": {"start": "2026-09-30", "startSrc": "Jira DEAP-5046: first In Progress child (DEAP-5142)", "notStarted": false}, "Trucker hat fulfillment": {"due": "2026-10-23", "dueSrc": "Jira DEAP-6261 due date (issue still Backlog, never moved)"}, "Precise USA sales tax by address": {"start": "2026-09-28", "startSrc": "Jira DEAP-5972: first In Development", "launched": "2026-10-20", "launchedSrc": "Slack #released Oct 20 (Vitalija)"}, "Exact USA sales tax at Redbubble checkout": {"start": "2026-09-28", "startSrc": "Jira DEAP-5972: first In Development", "launched": "2026-10-20", "launchedSrc": "Slack #released Oct 20 (Vitalija)"}, "Selling blanks on TeePublic": {"start": "2026-09-28", "startSrc": "Jira DEAP-5975 (TP Sell Blanks Onsite): In Development since Sep 28"}, "Search cluster migration": {"start": "2026-09-08", "startSrc": "Jira DEAP-5324: first In Progress children (DEAP-5454/5455)", "due": "2026-11-07", "dueSrc": "Jira DEAP-5324 description (Nov 7 end of life); Meeting notes, Exec Roadmap Review Oct 13", "notStarted": false}, "Learn to Rank rerun": {"start": "2026-09-22", "startSrc": "Jira DEAP-2622: first In Progress child of the rerun work (DEAP-5874); epic itself began Apr 16", "due": "2026-10-25", "dueSrc": "Meeting notes, Exec Roadmap Review Oct 13 (dashboard date; ship in last two weeks before freeze)", "notStarted": false}, "Learn to Rank before the freeze": {"start": "2026-09-22", "startSrc": "Jira DEAP-2622: first In Progress child of the rerun work (DEAP-5874); epic itself began Apr 16", "due": "2026-10-25", "dueSrc": "Meeting notes, Exec Roadmap Review Oct 13 (dashboard date; ship in last two weeks before freeze)", "notStarted": false}, "Ranking test for 3+ word queries": {"launched": "2026-10-20", "launchedSrc": "Slack #released Oct 20 (Wendy: 50/50 test started, ~2 weeks); Jira DEAP-6326 'Release LTR V2 Experiment' Released Oct 19"}, "Greeting card and postcard search": {"start": "2026-10-16", "startSrc": "Jira DEAP-5964 (TP card search and feed validation): first In Development", "due": "2026-10-20", "dueSrc": "Jira DEAP-5964 due date (in Code Review)", "likely": "2026-10-26", "likelySrc": "Slack #temp-tpo-greeting-card-postcard-launch Oct 21 (Ashley: TP card launch delayed from Oct 19, aim early next week)", "notStarted": false}, "Bad-art detection research": {"start": "2026-10-01", "startSrc": "Jira DEAP-6064: first In Progress child (DEAP-5967)", "due": "2026-11-09", "dueSrc": "Meeting notes, Exec Roadmap Review Oct 13 (dashboard phase end)", "notStarted": false}, "Trucker hats on Redbubble": {"start": "2026-10-21", "startSrc": "Jira DEAP-6578: first In Development", "due": "2026-11-03", "dueSrc": "Slack #temp-rbo-trucker-hat-line-extension Oct 19 (Ashley: on track 3-Nov US / 4-Nov AU)", "notStarted": false}, "Standardized wall art sizes": {"start": "2026-09-28", "startSrc": "Jira DEAP-5328: first In Development", "due": "2026-11-03", "dueSrc": "Meeting notes, Exec Roadmap Review Oct 13", "notStarted": false}, "Retire 8 low-value Redbubble products": {"start": "2026-10-15", "startSrc": "Jira DEAP-6198: first In Development", "due": "2026-10-26", "dueSrc": "Slack #temp-product-sunsets-2026 Oct 19 (Ashley: sunset 26-Oct US / 27-Oct AU); Jira DEAP-6421 due Oct 27", "notStarted": false}, "Server-side tag security and monitoring": {"start": "2026-08-19", "startSrc": "Jira DEAP-4278: first In Development (moved back to Backlog Sep 1)"}, "Amazon Ads tracking on TeePublic": {"start": "2026-08-25", "startSrc": "Jira DEAP-4853: first In Progress child", "notStarted": false}, "Creator affiliate tag on Redbubble": {"start": "2026-09-29", "startSrc": "Jira DEAP-6042: first In Development (In QA since Oct 12)", "notStarted": false}, "Meta tracking follow-ups": {"start": "2026-10-12", "startSrc": "Jira DEAP-6160: first In Development", "notStarted": false}, "Self-serve artist tax reports": {"start": "2026-09-08", "startSrc": "Jira DEAP-5348: first In Progress child (DEAP-5347)", "launched": "2026-10-22", "launchedSrc": "Slack #released Oct 22 (Matz: Artist Self-Serve Tax Reports are live)"}, "iOS native checkout test": {"start": "2026-07-06", "startSrc": "Jira DEAP-3840 (iOS native checkout spike): first In Development", "launched": "2026-10-19", "launchedSrc": "Slack #released Oct 19 (Matz: iOS A/B test kicked off this morning)"}, "Android native checkout": {"start": "2026-08-06", "startSrc": "Jira DEAP-4744: first activity", "due": "2026-10-19", "dueSrc": "Meeting notes, Exec Roadmap Review Oct 13 (Android launch Oct 19)", "notStarted": false}, "App eventing (purchase event first)": {"notStarted": true, "notStartedSrc": "Slack 21: next up after native checkout ships; Meeting notes, Martech roadmap Oct 21: ~2 weeks of work"}, "Takedown (DMCA) tool": {"due": "2026-10-31", "dueSrc": "Meeting notes, Exec Roadmap Review Oct 13 (targeting end of October)"}, "Seller verification compliance": {"start": "2026-10-13", "startSrc": "Jira DEAP-5914: first In Progress child (DEAP-6302)", "notStarted": false}, "Seller verification": {"start": "2026-10-13", "startSrc": "Jira DEAP-5914: first In Progress child (DEAP-6302)", "notStarted": false}, "Feed fixes, incl. new iPhone case": {"due": "2026-10-26", "dueSrc": "Jira DEAP-6548 (fix offsite feed products not updating) due date; in dev since Oct 20"}, "Greeting cards and postcards on TeePublic": {"due": "2026-10-19", "dueSrc": "Slack #temp-tpo-greeting-card-postcard-launch Oct 13 (launch 19-Oct US / 20-Oct AU)", "likely": "2026-10-26", "likelySrc": "Slack same channel Oct 19 (DELAYED) and Oct 21 (Ashley: aim early next week); TP feed tickets DEAP-6499/6613 still Backlog"}, "Lifecycle reporting fixes": {"notStarted": false, "notStartedSrc": "Data Engineering lead, Oct 27: in progress and delivering before peak; the epic's Backlog QA tickets don't mean it hasn't started"}, "Keep Sigma up through peak": {"due": "2026-11-17", "dueSrc": "Jira DEAP-6468 due date", "notStarted": true, "notStartedSrc": "Jira DEAP-6468: Backlog"}, "Postgres upgrade risk check": {"notStarted": true, "notStartedSrc": "Jira DEAP-6532 (created Oct 20): Backlog"}, "Products on order events in Amplitude": {"start": "2026-10-14", "startSrc": "Jira DEAP-5894: first moved to Code Review (no In Development logged)", "due": "2026-11-17", "dueSrc": "Jira DEAP-5894 due date", "notStarted": false}, "Simon AI profile attributes": {"start": "2026-07-21", "startSrc": "Jira DEAP-2807: first In Development", "notStarted": false}, "Address Line 2 always shown at checkout": {"launched": "2026-10-22", "launchedSrc": "Slack #released Oct 22 (TP Address Line 2 launch)"}};

// Hourly CVR, sessions and revenue for the day under review and its comparison days, from Amplitude. Filled by the refresh. Last pulled 2026-10-30 from Amplitude (ET, hourly funnel and sessions under the Strong filter: TP score >=70 and not a verified bot; RB score >=70 and not JA4 t13d1517h2_8daaf6152771_cb7bf5808d99; revenue is all orders, hourly sum of total_revenue_usd for TP and transaction_amount_usd for RB). Day under review 2026-10-29; comparison days 2026-10-08 (TP) and 2026-10-01, 2026-10-15 (RB), plus 2026-10-28 and 2025-10-30 (TP last year). Revenue by hour exists only for the days listed with a rev array.
const HOURLY = {"tzLabel":"ET","tp":{"2025-10-08":{"cvr":[0.02538,0.02161,0.01816,0.01276,0.01,0.01294,0.01847,0.02098,0.02389,0.02806,0.0357,0.03235,0.03634,0.03622,0.03539,0.03356,0.03165,0.03171,0.03565,0.03749,0.03564,0.02976,0.03949,0.03025],"sess":[11410,9941,9546,8211,8017,8299,9153,10664,12773,15251,15626,16608,18675,17817,17030,17968,17427,19240,18562,25885,23900,28302,18980,17823]},"2025-10-17":{"cvr":[0.02403,0.02171,0.02134,0.02195,0.0181,0.01946,0.02839,0.03304,0.03818,0.03723,0.03804,0.03808,0.03599,0.03711,0.0366,0.03019,0.03764,0.03676,0.03528,0.03631,0.03722,0.03742,0.036,0.03187],"sess":[10773,7492,7563,6201,6111,5848,6960,8578,11290,13050,14577,15448,15816,16996,17241,19007,16893,18255,17875,22070,21454,20091,18146,14607]},"2025-10-22":{"cvr":[0.02619,0.02305,0.01713,0.01875,0.01742,0.01949,0.02306,0.02655,0.03218,0.03681,0.03389,0.02622,0.03084,0.03903,0.03936,0.03796,0.03727,0.03612,0.03711,0.0372,0.03534,0.03806,0.03715,0.01545],"sess":[9672,7734,6919,5691,5127,5553,6676,8633,10429,12497,14042,14826,16152,17210,16081,15953,15678,17235,17552,22737,22398,20975,18448,33036]},"2025-10-29":{"cvr":[0.01494,0.01457,0.0104,0.01099,0.01074,0.01159,0.01217,0.01286,0.01659,0.02319,0.02,0.02105,0.02226,0.02135,0.01945,0.00771,0.01431,0.02299,0.02318,0.02266,0.02063,0.01806,0.01939,0.01595],"sess":[8658,15559,7528,8796,9814,6893,5596,6866,8342,9677,10390,10823,11491,11532,11285,31142,18467,11552,12065,13670,14761,15095,13312,11234]},"2025-10-30":{"cvr":[0.01423,0.01273,0.01368,0.01039,0.01388,0.01325,0.01507,0.01983,0.02105,0.01852,0.02242,0.02164,0.02494,0.01982,0.02248,0.01937,0.02258,0.023,0.0232,0.0265,0.02444,0.01878,0.01879,0.01884],"sess":[8176,6400,5283,4564,4398,4447,6053,7737,9085,10192,11006,11667,11636,11437,11495,14750,11602,11469,12835,13209,12970,14435,12642,10328],"rev":[7088.16,3803.07,3387.39,2370.96,2313.08,3178.98,3283.42,6147.32,6891.59,8476.93,9925.92,10596.42,14467.96,11385.14,12267.44,13488.7,12419.51,11093.35,11701.8,14779.72,13525.87,12495.52,11041.15,10557.17]},"2026-09-03":{"cvr":[0.02456,0.01391,0.02096,0.0168,0.01915,0.01872,0.02021,0.02594,0.02622,0.03427,0.03424,0.03739,0.03934,0.04151,0.0422,0.04223,0.04107,0.03827,0.04114,0.04655,0.04539,0.04111,0.03662,0.03775],"sess":[15166,19424,9330,9199,8726,9248,11667,13487,15682,16645,17729,18132,19351,19123,17995,18348,18955,20351,20727,24590,22456,22604,21379,17713]},"2026-09-15":{"cvr":[0.02019,0.0186,0.01479,0.01696,0.01637,0.01924,0.0201,0.02422,0.02774,0.02498,0.03047,0.03112,0.03566,0.03874,0.0369,0.04058,0.02675,0.02888,0.03454,0.03956,0.04048,0.03683,0.03121,0.02981],"sess":[14787,12944,13176,8694,8379,8482,11050,13343,14513,19744,18082,19050,18850,17718,17244,17111,24740,26766,23683,25062,24870,25063,23300,18654]},"2026-09-25":{"cvr":[0.02611,0.0249,0.02268,0.01565,0.01369,0.0148,0.01655,0.01825,0.02373,0.02579,0.02994,0.03266,0.03756,0.02987,0.02406,0.02707,0.03256,0.03344,0.0388,0.03814,0.03805,0.03508,0.03257,0.02611],"sess":[13082,10257,9542,9439,10312,10085,12013,14602,19170,19112,19002,19056,19087,18500,25071,24280,20400,19525,22158,20520,20218,19899,19156,18705]},"2026-10-08":{"cvr":[0.02652,0.0264,0.01977,0.01484,0.01742,0.02036,0.01885,0.02064,0.02174,0.02588,0.02101,0.0246,0.02772,0.03037,0.02521,0.02638,0.03016,0.02551,0.02342,0.02596,0.02833,0.03405,0.03311,0.0251],"sess":[7449,5805,4636,4184,4180,4551,5348,6913,8840,9818,11803,12653,10906,10945,11752,11828,11893,13090,14193,14952,14589,13700,11839,10337],"rev":[9321.68,6119.36,4183.36,3628.13,3551,3928.43,4303.64,5764.93,6954.21,10083.03,12993.07,12536.28,12247.63,12882.53,13901.47,14808.08,15616.39,14278.87,12672.57,15747.6,16457.97,17577.95,16087.32,10087.14]},"2026-10-13":{"cvr":[0.03023,0.02352,0.02413,0.0156,0.01749,0.01683,0.0202,0.02572,0.02414,0.03487,0.03648,0.02329,0.0271,0.03966,0.04195,0.03866,0.04696,0.04297,0.04452,0.05081,0.04898,0.04733,0.04276,0.03936],"sess":[11187,9468,7997,7632,7008,9117,11512,10494,15092,13116,14647,22051,22599,16936,15752,16875,17183,17240,21210,20455,20676,19370,18694,14392]},"2026-10-20":{"cvr":[0.01603,0.01629,0.01395,0.01144,0.00945,0.01295,0.01231,0.01733,0.02086,0.02166,0.02545,0.02414,0.02474,0.02462,0.02875,0.02471,0.02697,0.02905,0.02798,0.02693,0.02936,0.02744,0.02728,0.02919],"sess":[15768,10004,9252,8333,9594,8897,11940,11262,12323,13951,14032,15355,15050,13765,12454,14285,13544,13849,15033,15771,15878,15595,14145,11503]},"2026-10-21":{"cvr":[0.03342,0.03508,0.03072,0.02455,0.01977,0.02119,0.02483,0.0305,0.03213,0.03957,0.03931,0.03936,0.04302,0.04229,0.03501,0.03351,0.03164,0.03721,0.04006,0.0422,0.04256,0.04379,0.04051,0.03696],"sess":[9277,7378,6052,5633,6432,5861,6810,8658,10748,12164,13315,15410,15305,14980,15977,18621,19476,18860,20082,18059,18129,17938,16793,13916]},"2026-10-27":{"cvr":[0.0183,0.01886,0.0139,0.01165,0.00906,0.00822,0.01473,0.01434,0.01505,0.02008,0.02009,0.02221,0.01757,0.01919,0.01877,0.01947,0.02033,0.01953,0.01975,0.02138,0.02323,0.02402,0.02361,0.01974],"sess":[8904,6985,6540,6322,6318,6681,7801,9185,11285,11787,15034,13748,15575,16229,15999,15056,14883,15416,16335,16110,14369,13762,13301,10804]},"2026-10-28":{"cvr":[0.02045,0.01389,0.01214,0.01172,0.01503,0.01548,0.01312,0.01675,0.01813,0.01984,0.02349,0.02296,0.0246,0.02439,0.02571,0.02345,0.02178,0.0203,0.0239,0.02226,0.01963,0.01941,0.02077,0.02913],"sess":[9064,6915,5203,4635,4482,5237,6688,7008,8664,9778,10393,10401,10463,10206,10292,10361,11100,11810,11952,13366,14270,13814,13685,17305],"rev":[7708.97,4827.6,2806.24,2799.92,2551.78,3097.4,4261.07,4853.52,7134.97,9330.55,11181.9,11261.85,10684.86,10674.11,13571.03,10959,11303.65,10539.81,13072.49,13809.03,14528.35,13955.04,12357.97,25305.55]},"2026-10-29":{"cvr":[0.0267,0.01706,0.01707,0.00985,0.01122,0.01431,0.01911,0.01909,0.02412,0.02337,0.02761,0.02545,0.02247,0.02341,0.02748,0.02302,0.02433,0.02225,0.02426,0.0236,0.02133,0.02417,0.01959,0.01854],"sess":[10496,7476,5791,7551,7240,5791,6564,9006,10277,12689,12580,13626,14296,15006,12662,13433,14741,15024,15207,15287,15812,15728,14452,12634],"rev":[15978.43,5996.6,4358.2,2860.63,3825.43,3588.24,5207.63,6608.06,9801.09,12448.9,14263.34,15979.2,14645.59,15475.53,17352.34,13642.27,16363.1,13255.7,15571.31,15041.12,15291.51,17910.15,14459.85,11295.45]}},"rb":{"2026-09-23":{"cvr":[0.00436,0.00399,0.00486,0.00681,0.00729,0.00626,0.00671,0.00621,0.00743,0.00654,0.007,0.00813,0.00806,0.00812,0.00866,0.00874,0.00907,0.01042,0.01118,0.01169,0.0098,0.00644,0.00745,0.00744],"sess":[62380,56994,43838,33193,35343,45979,48352,56572,52408,61904,63878,60803,65672,68255,60991,58433,52583,48778,43426,42908,53528,80960,63942,49662]},"2026-10-01":{"cvr":[0.01123,0.01342,0.01399,0.01383,0.01329,0.01127,0.0127,0.01528,0.01661,0.01508,0.01714,0.01828,0.01658,0.01813,0.01892,0.01989,0.02024,0.01991,0.01933,0.01779,0.01687,0.01454,0.01536,0.01414],"sess":[13020,12981,14238,16693,19295,24775,21820,21273,22679,22170,23258,22227,24761,23441,19527,17681,16725,19345,19882,19769,17586,14035,12425,12545],"rev":[7032.64,7451.83,8937.79,9647.14,9729.67,10542.84,12651.39,12655.3,15400.16,14462.71,14878.96,16617.83,17036.41,16947.91,16737.57,12290.9,10331.65,12966.29,11312.71,9813.2,11307.71,6120.06,7484.19,6786.37]},"2026-10-04":{"cvr":[0.01251,0.01029,0.00888,0.01245,0.0109,0.01258,0.00712,0.00829,0.01173,0.01653,0.01826,0.02024,0.01826,0.01764,0.01937,0.02136,0.02011,0.02036,0.01598,0.01589,0.01466,0.01459,0.01257,0.01163],"sess":[22112,23364,23934,22053,22380,20835,41964,36216,28297,22913,23603,24379,29113,30106,29421,27733,27608,30089,32447,34586,36833,38044,35446,35071]},"2026-10-15":{"cvr":[0.02353,0.02347,0.02075,0.02353,0.0208,0.02277,0.02253,0.02518,0.02519,0.02449,0.02457,0.02243,0.02568,0.02491,0.02275,0.02189,0.01903,0.02183,0.02127,0.01936,0.01979,0.01733,0.02096,0.0223],"sess":[7897,7928,8587,9345,10825,11650,12290,12410,13010,13388,14929,15179,15941,16736,16300,16222,16894,17382,17728,16249,13601,10918,9045,7857],"rev":[6555.16,8248.73,7425.12,8572.95,8791.67,12366,11067.71,12985.94,12690.76,12371.83,14875.92,12519.71,16062.06,15307.67,16766.92,12364.51,11779.47,12808.31,12236.44,11828.22,9041.06,7003.33,6660.78,6413.08]},"2026-10-20":{"cvr":[0.01254,0.01495,0.01306,0.01719,0.017,0.02201,0.01309,0.01762,0.01357,0.02111,0.02058,0.0207,0.01853,0.0224,0.02285,0.02065,0.0213,0.01868,0.02,0.01722,0.01416,0.01457,0.01108,0.01024],"sess":[18709,13815,11596,10152,10550,11278,17749,14533,19814,15028,15943,16823,17138,16121,16903,21556,20347,22758,20454,24492,27444,28616,31808,31885]},"2026-10-21":{"cvr":[0.00937,0.01219,0.0127,0.01324,0.01566,0.01312,0.01381,0.01772,0.01604,0.0155,0.01979,0.016,0.0133,0.01592,0.01984,0.01991,0.01631,0.0166,0.01117,0.0109,0.01046,0.011,0.01255,0.01247],"sess":[28594,20756,18661,20129,16360,21540,20813,19217,21278,23373,20685,27854,30519,26441,21411,23320,29566,27371,36652,39759,43595,40275,29830,26345]},"2026-10-27":{"cvr":[0.02311,0.02121,0.0192,0.01623,0.01615,0.01398,0.01511,0.01922,0.01669,0.01865,0.01787,0.02114,0.0207,0.01977,0.02003,0.02042,0.01939,0.01979,0.01933,0.02118,0.02034,0.01417,0.01212,0.01111],"sess":[12629,9615,8382,10381,11101,14376,14731,11996,12872,14848,15810,15232,16391,14913,15867,17073,19340,19431,17630,15855,15658,20590,21745,17963]},"2026-10-28":{"cvr":[0.01272,0.01693,0.01802,0.02132,0.02208,0.02656,0.02155,0.02033,0.01962,0.02158,0.01641,0.02218,0.02205,0.02364,0.022,0.02335,0.02186,0.02206,0.02131,0.0211,0.01777,0.0155,0.0141,0.01402],"sess":[14180,10103,7051,7899,7557,8106,9063,10925,11584,12156,15632,13899,13074,13295,13773,14200,15154,14710,14000,13516,15495,16165,16336,14301],"rev":[5825.3,7044.39,8383.65,8512.46,8550.31,9510.82,11090.93,11031.58,12099.95,15099.4,12540.36,12376.46,13056.9,13679.95,16835.38,12964.95,10427.25,11738.56,10063.19,9827.45,8350.2,6204,6025.58,5756.99]},"2026-10-29":{"cvr":[0.02018,0.02143,0.02258,0.02189,0.02239,0.01584,0.01759,0.01442,0.01955,0.01468,0.01961,0.0158,0.01756,0.01719,0.01715,0.01679,0.01717,0.01589,0.01413,0.01067,0.00918,0.00943,0.00954,0.01172],"sess":[7555,8187,9206,9848,10333,13264,14031,19275,14816,20130,16359,17656,18170,18694,18404,19337,17184,18042,19979,23245,21759,18432,12772,8557],"rev":[5469.56,8764.87,8426.79,9806.97,11344.62,8820.65,12048.4,10631.93,12211.09,12482.62,12846.05,14826.39,15796.55,13365.59,13891.45,13308.28,10769.22,11291.36,10520.8,9134.81,8913.46,8123.9,6450.2,5523.88]}}};

// Key releases since Jul 28 that likely moved shopper numbers, from #released (Oct 30). Shown on the 90-day chart with COMING.wins.
const RELN = [
 {
  "date": "2026-10-29",
  "site": "rb",
  "t": "Bigger sticker bundle and art print quantity discounts",
  "imp": "Stickers 10+ went from 40% to 50% off and art prints from 15% to 20% off, to lift bundle CVR ahead of peak."
 },
 {
  "date": "2026-10-29",
  "site": "tp",
  "t": "Sign up with Google",
  "imp": "A faster sign-up option on the default flow, aimed at more signed-in shoppers who convert better."
 },
 {
  "date": "2026-10-29",
  "site": "tp",
  "t": "Sticker and hoodie price adjustments",
  "imp": "Modest increases on larger sticker sizes and new substrates, and slightly higher hoodie sale prices; 35% offer moves from Zip Hoodies to Trucker Hats."
 },
 {
  "date": "2026-10-28",
  "site": "tp",
  "t": "Product reviews to Trustpilot",
  "imp": "Product reviews now flow to Google Shopping star ratings; all delivered orders by Oct 30."
 },
 {
  "date": "2026-10-28",
  "site": "tp",
  "t": "Canvas tote bags launched",
  "imp": "New product on TeePublic, expected to add about $153K a year."
 },
 {
  "date": "2026-10-27",
  "site": "rb",
  "t": "Redbubble product page loads faster",
  "imp": "Page latency down about 30% at p95 and 15% at p50 after a year of data cleanup."
 },
 {
  "date": "2026-10-23",
  "site": "tp",
  "t": "Standard shipping +$1 on orders over 11 oz",
  "imp": "Two-tee orders pay $7.99 standard shipping instead of $6.99; single tees and mugs unchanged."
 },
 {
  "date": "2026-10-22",
  "site": "tp",
  "t": "Checkout always shows Address Line 2",
  "imp": "The hidden field caused friction and misdeliveries for apartment addresses."
 },
 {
  "date": "2026-10-21",
  "site": "rb",
  "t": "More designs eligible for posters",
  "imp": "Lower image-resolution bar adds about 6.8M designs to Posters (+5% overall) ahead of peak."
 },
 {
  "date": "2026-10-20",
  "site": "rb",
  "t": "USA sales tax from the full address",
  "imp": "Some USA shoppers now pay less tax; covers 82% of orders (PayPal later)."
 },
 {
  "date": "2026-10-12",
  "site": "rb",
  "t": "Base price recalibration, about 2% net up",
  "imp": "About 1,300 prices cut and 1,600 raised, mostly USA; shipping moves with price."
 },
 {
  "date": "2026-10-09",
  "site": "tp",
  "t": "Customer self-cancellation removed before peak",
  "imp": "Cancel option removed from the order status page to cut lost revenue."
 },
 {
  "date": "2026-10-01",
  "site": "tp",
  "t": "Cheaper Ground and Expedited shipping in the USA",
  "imp": "Ground $2 cheaper and a day faster, Expedited $5 cheaper, Oct 1 to 19."
 },
 {
  "date": "2026-09-23",
  "site": "tp",
  "t": "Free shipping threshold back to $70",
  "imp": "Test showed revenue +5.5% and GP +2.5% on affected orders."
 },
 {
  "date": "2026-09-23",
  "site": "tp",
  "t": "Email audience grows from 2.5M to 6.7M",
  "imp": "The move to Simon nearly tripled the contacts mailed."
 },
 {
  "date": "2026-09-22",
  "site": "rb",
  "t": "iPhone 18 Pro and Pro Max cases",
  "imp": "New phone cases, about $1.1M AUD a year expected."
 },
 {
  "date": "2026-09-17",
  "site": "rb",
  "t": "Product image first on T-shirt pages",
  "imp": "The test lifted CVR 4.5% and add to cart 3.1%; now testing on all apparel."
 },
 {
  "date": "2026-09-02",
  "site": "tp",
  "t": "Material info moved up on product pages",
  "imp": "Fabric, description and returns info sit near the options, mainly for mobile."
 },
 {
  "date": "2026-08-21",
  "site": "rb",
  "t": "Vintage Wash T-shirt",
  "imp": "New tee style, about $1.5M AUD a year expected."
 },
 {
  "date": "2026-08-21",
  "site": "tp",
  "t": "Trending products ad catalog on Meta",
  "imp": "Ad CVR +35%, revenue +19%, ROAS +17% vs the standard catalog."
 },
 {
  "date": "2026-08-13",
  "site": "rb",
  "t": "Sticker bundle discount on all stickers",
  "imp": "25% off at 4+ and 40% off at 10+ now applies to every size and finish."
 },
 {
  "date": "2026-08-04",
  "site": "tp",
  "t": "New sticker sizes and finishes",
  "imp": "Medium and Large plus Glossy and Transparent, opening upsell."
 },
 {
  "date": "2026-08-04",
  "site": "rb",
  "t": "Faster artist shop pages",
  "imp": "Shop pages now load on the new platform for all traffic."
 }
];

