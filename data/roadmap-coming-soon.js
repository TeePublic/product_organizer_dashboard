
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
  asOf: 'Wed Oct 28, 8:44 AM ET',
  tagline: 'Everything bends toward peak: cart and checkout revenue wins ship before the Nov 20 code freeze, and longer bets like OMAFS wait for 2027.',
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
    { e: '✉️', t: 'Consent and preference center', team: 'martech', obj: 'Compliance', when: 'After peak', d: 'One place for shoppers to manage marketing consent.' },
    { e: '📱', t: 'Fuller app analytics', team: 'martech', obj: 'Data', when: 'After peak', d: 'Beyond the purchase event: full tracking in the Redbubble app.' },
    { e: '🎨', t: 'Artist tracking and audiences', team: 'martech', obj: 'Data', when: 'After peak', d: 'Track artist behavior and build marketing audiences from it.' },
    { e: '🧭', t: 'Let shoppers browse off TeePublic artist stores', team: 'customer', obj: 'CVR', when: 'Next up', imp: 'About +2% CVR on 5% of traffic', d: 'Today artist stores trap shoppers; open navigation to the rest of the site.' },
    { e: '🧪', t: 'TeePublic on Amplitude Experiment, plus holdout groups', team: 'de', obj: 'Data', when: 'Next half', d: 'One testing tool across both sites, and a clean read of cumulative impact.' },
    { e: '🔎', t: 'Product scoping in search autocomplete', team: 'search', obj: 'CVR', when: 'After peak', d: 'Paused so Learn to Rank could ship before the freeze.' },
    { e: '🧱', t: 'Selling blanks on TeePublic', team: 'plc', obj: 'Revenue', when: 'After the freeze', d: 'The MVP was not worth it before peak.' },
    { e: '🏭', t: 'Horsham as a TeePublic fulfiller', team: 'plc', obj: 'Ops', when: 'Next up', d: 'More print capacity after peak.' },
    { e: '📄', t: 'SEO: 20 results per search page', team: 'search', obj: 'Traffic', when: 'Discovery', imp: '+1 to 2% product pages crawled', d: 'More products per page for search engines to find.' },
    { e: '🤖', t: 'Make the sites ready for AI shopping', team: 'customer', obj: 'Traffic', when: 'Discovery', d: 'So AI assistants can find and recommend our products.' },
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
        { e: '🛍️', t: 'Cart and cart-tray cross-sell', obj: 'AOV', imp: '$500K to $1M a year', impSrc: 'Roadmap sheet estimate',  pts: [0, 5], link: 'https://articore.atlassian.net/browse/DEAP-6266', site: 'RB', s: 'In QA', eta: 'Oct 27 to 28', move: 'up', why: 'Final QA; launch moved from this week to Oct 27 to 28', d: 'Redbubble first version: stickers only, on the cart page only. Replaces the Contentful front end, now January.' },
        { e: '👕', t: 'T-shirt style pills on product pages', obj: 'AOV', site: 'RB', s: 'Blocked', eta: 'Oct 27', move: 'steady', why: 'Waiting on an apps fix; launch now planned for Tue Oct 27', pts: [12.5, 15], link: 'https://articore.atlassian.net/browse/DEAP-5915', d: 'Pills instead of the style picker pop-up, as on TeePublic. Waiting on an apps fix; launch planned for Oct 27.' },
        { e: '🍎', t: 'Apple Pay buy-now on product pages', obj: 'CVR', site: 'RB', s: 'Scoping', eta: 'Scoping ends Oct 27', move: 'up', inj: true, why: 'Fast-tracked at the Oct 22 standup; Customer takes it on since Purchase Lifecycle has no room', d: 'Fast scoping for peak. It would check out the whole cart (not just the one item) and ship behind a switch that can be turned off during peak. Open questions: which product types show it.' },
        { e: '🎄', t: 'Redbubble quick wins', obj: 'CVR', imp: '+5% CVR across the Redbubble A/B program', impSrc: 'Roadmap sheet estimate', site: 'RB', s: 'Planned', eta: 'Before Nov 20', move: 'up', why: 'Pre-peak list, Oct 19', d: 'All shipping fields up front, "Guaranteed by Christmas", recently viewed, smaller category tiles.' },
        { e: '🧭', t: 'Fix Redbubble channel tracking', obj: 'Data', refs: [{ go: 'rb|channel/Paid Search', l: 'Redbubble channels' }], site: 'RB', s: 'Next sprint', eta: 'Next sprint', move: 'up', why: 'Moved to top of next sprint', tags: ['Data'], pts: [0, 3], link: 'https://articore.atlassian.net/browse/DEAP-5099', d: 'campaign_medium is missing on most Redbubble events, so channel reporting is rough.' },
        { e: '🔐', t: 'Sign in with Google', obj: 'Retention', site: 'TP', s: 'Blocked', eta: 'TBD', move: 'down', why: 'Not live yet: build is done, waiting on Google to approve the sign-in app (resubmitted Oct 23)', pts: [17, 23], link: 'https://articore.atlassian.net/browse/DEAP-4840', d: 'Build is done; switching it on waits for Google to approve the sign-in app.' },
        { e: '🔥', t: 'Trending tag on product pages test', obj: 'CVR', site: 'TP', s: 'Live', eta: 'Oct 23', move: 'new', why: 'Launched Oct 23 as an A/B/C test', refs: [{ go: 'tp|funnel/Add to cart rate', l: 'TeePublic add to cart' }], d: 'Launched Oct 23: a trending tag in the product image gallery or above the design title, against no tag. A small first test of social proof on product pages, built to extend to other tags.' }
      ],
      dropped: [['Contentful front end', 'Moved to January'], ['Express Pay at top of checkout', 'On hold'], ['Redbubble shipping-threshold test', 'Pushed to 2027']] },
    { key: 'tiger', parent: 'customer', name: 'Tiger team', icon: '🐯', tagline: 'Jeff\'s quick revenue wins inside Customer, in priority order for peak.',
      items: [
        { e: '🧷', t: 'Sticker quick-add with quantity on search', obj: 'AOV', site: 'TP', s: 'In dev', eta: 'Before Nov 20', move: 'steady', d: 'Add multiple stickers straight from search results.' },
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
        { e: '🧢', t: 'Trucker hat fulfillment', obj: 'Revenue', site: 'TP', s: 'In dev', eta: 'Nov 2', move: 'steady', pts: [0, 7], link: 'https://articore.atlassian.net/browse/DEAP-6261', d: 'Launch support for the new trucker hat.' },
        { e: '🧾', t: 'Precise USA sales tax by address', obj: 'Compliance', site: 'RB', s: 'Launched', eta: 'Oct 20', move: 'steady', d: 'Live on Redbubble for 82% of orders; PayPal after peak.' },
        { e: '🔁', t: 'OMAFS phases 2 to 5', obj: 'Ops', site: 'Both', s: 'Paused', eta: '2027', move: 'down', why: 'Too much scope before Black Friday', d: 'Resumes in small steps around Nov 20; the bulk moves to 2027.' }
      ] },
    { key: 'search', name: 'Search', icon: '🔎', tagline: 'Cluster migration by Nov 7 and better ranking before the freeze.',
      items: [
        { e: '🗄️', t: 'Search cluster migration', obj: 'Ops', imp: 'Keeps search running past the Nov 7 end of life', impSrc: 'Roadmap sheet estimate', site: 'Both', s: 'In dev', eta: 'Nov 7', move: 'steady', pts: [31, 58], link: 'https://articore.atlassian.net/browse/DEAP-5324', d: 'Hard deadline; one decommission step still open.' },
        { e: '🧠', t: 'Learn to Rank rerun', obj: 'CVR', imp: '+2% search click-through', impSrc: 'Roadmap sheet estimate',  pts: [79.5, 80.5], link: 'https://articore.atlassian.net/browse/DEAP-2622', site: 'RB', s: 'Ready for dev', eta: 'Before Nov 20', move: 'up', why: 'Back on after pausing since May', d: 'Ranking model refresh in production.' },
        { e: '🧪', t: 'Ranking test for 3+ word queries', obj: 'CVR', site: 'RB', s: 'Live', eta: '~2 weeks', move: 'new', d: 'Launched Oct 20.' },
        { e: '💌', t: 'Greeting card and postcard search', obj: 'CVR', site: 'RB', s: 'Code review', eta: 'Before peak', move: 'steady', pts: [9.5, 15.5], link: 'https://articore.atlassian.net/browse/DEAP-2523', d: 'Ahead of November card season.' },
        { e: '💲', t: 'Show the lowest-priced T-shirt style first in Redbubble search', obj: 'CVR', site: 'RB', s: 'Scoping', eta: 'TBD', move: 'new', inj: true, why: 'Added Oct 23 from the peak standup', d: 'Many T-shirts in search open on pricier styles that stay above $20 on sale. Search is checking whether results can default to the cheapest style, on what timeline and with what trade-offs.' },
        { e: '🔍', t: 'More prominent Redbubble search bar', obj: 'CVR', site: 'RB', s: 'Planned', eta: 'Before peak', move: 'new', why: 'Asked for before peak', d: 'Owner still being decided between Search and Customer.' },
        { e: '🚫', t: 'Bad-art detection research', obj: 'Revenue', site: 'Both', s: 'Discovery', eta: 'Nov 9', move: 'steady', pts: [7, 17], link: 'https://articore.atlassian.net/browse/DEAP-6064', d: 'AI screening for low-quality art.' }
      ],
      dropped: [['Assign categories to designs', 'Waiting on topic-nav testing'], ['Autocomplete scoping', 'Ranking first']] },
    { key: 'core', name: 'Core', icon: '🧱', tagline: 'Adds and retires products, and runs the shared product model across both sites.',
      items: [
        { e: '🧢', t: 'Trucker hats on Redbubble', obj: 'Revenue', imp: 'About $90K a month', impSrc: 'Product Marketing, Oct 7', site: 'RB', s: 'In dev', eta: 'Nov 3', why: 'Launch Nov 3 USA (Nov 4 AU), per Slack', move: 'steady', link: 'https://articore.atlassian.net/browse/DEAP-6578', d: 'New product. Rollout in dev; navigation and search work not started.' },
        { e: '🖼️', t: 'Standardized wall art sizes', obj: 'Revenue', site: 'RB', s: 'In dev', eta: 'Nov 3', move: 'steady', pts: [10, 21], link: 'https://articore.atlassian.net/browse/DEAP-5328', d: 'One consistent set of wall art sizes.' },
        { e: '🧹', t: 'Retire 8 low-value Redbubble products', obj: 'Ops', site: 'RB', s: 'In dev', eta: 'Oct 26', why: 'Sunset set for Oct 26 USA (Oct 27 AU), per Slack', move: 'steady', link: 'https://articore.atlassian.net/browse/DEAP-6198', d: 'Sunset products that sell too little to keep.' },
        { e: '🧬', t: 'Shared product data, phase 2', obj: 'Data', site: 'Both', s: 'In dev', eta: 'TBD', move: 'steady', d: 'One product model for TeePublic and Redbubble.' }
      ],
      dropped: [['Latte mug', 'Dropped Oct 21']] },
    { key: 'martech', name: 'MarTech', icon: '📡', tagline: 'Marketing tracking: ad pixels, conversion APIs, consent and identity. A new team; Vaibhav Soni is Product Manager, and its Engineering Manager starts Nov 10.',
      items: [
        { e: '🛡️', t: 'Server-side tag security and monitoring', obj: 'Ops', site: 'Both', s: 'Planned', eta: 'Pre-peak', move: 'steady', link: 'https://articore.atlassian.net/browse/DEAP-4278', d: 'Move ad-platform keys into secure storage and add health checks before peak.' },
        { e: '🛒', t: 'Amazon Ads tracking on TeePublic', obj: 'Traffic', site: 'TP', s: 'Launched', eta: 'Oct 15', move: 'steady', why: 'Launched Oct 15: tracking fully works; campaigns are up to marketing', pts: [3, 3], link: 'https://articore.atlassian.net/browse/DEAP-4853', d: 'Pixel and purchase tag are live; next step is creating campaigns.' },
        { e: '🤳', t: 'Creator affiliate tag on Redbubble', obj: 'Traffic', site: 'RB', s: 'In QA', eta: 'Before peak', move: 'steady', link: 'https://articore.atlassian.net/browse/DEAP-6042', d: 'TeePublic\'s affiliate tag on Redbubble for the holiday influencer campaign.' },
        { e: '📶', t: 'Meta tracking follow-ups', obj: 'Revenue', site: 'Both', s: 'In dev', eta: 'Pre-peak', move: 'steady', link: 'https://articore.atlassian.net/browse/DEAP-6160', d: 'Close the server vs browser event gap on Redbubble (likely bots) after the main Meta work went live.' },
        { e: '📲', t: 'App store dashboard', obj: 'Data', site: 'RB', s: 'Blocked', eta: 'TBD', move: 'steady', d: 'App Store and Play Store numbers in one place. Waiting on legal, then about 3 to 4 days of work.' }
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
        { e: '📊', t: 'Creator Dashboard v2', obj: 'Data', site: 'Dashery', s: 'In QA', eta: 'Before freeze', move: 'new', pts: [0, 9], link: 'https://articore.atlassian.net/browse/DEAP-6623', d: 'Better creator reporting.' },
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
        { e: '💌', t: 'Greeting cards and postcards in the feeds', obj: 'Revenue', imp: 'Shopping ads for the new card products', impSrc: "Data Engineering priority list", site: 'TP', s: 'Planned', eta: 'After the site launch', move: 'steady', why: 'Feed work follows the TeePublic site launch, which is not Data Engineering work (Data Engineering lead, Oct 27)', d: 'Adds greeting cards and postcards to the Shopping feeds once they are live on TeePublic.' },
        { e: '🧹', t: 'Stop mailing about 80K contacts', obj: 'Compliance', site: 'Both', s: 'Code review', eta: 'Before peak', move: 'up', why: 'In review; launches before peak (Data Engineering lead, Oct 27)', d: 'Removes contacts we should not be emailing.' },
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

// Shout-outs for the Trending tab: public, positive, specific. From #released and project channels, Oct 20 to 21.
// One person, new every day. Criterion: drove something through (triaged, unblocked, pushed it over the line), not just "it launched".
// recent: the last 14 days of names, so the refresh never repeats someone inside two weeks.
const SHOUTS = { when: 'Wed Oct 28', e: '👕', name: 'Oliver Belmont', img: 'data:image/jpeg;base64,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', headline: 'Caught a setup bug that would have left the Redbubble style picker test empty, then got it live', what: 'Before the Redbubble T-shirt style picker test went out, Oliver **found that its audience rule pointed at the wrong bot score field**, which would have enrolled no one, and that it had no fallback. He **fixed the targeting and switched the test to local evaluation**, then **started it on Oct 27** with bot filtering in place. He also shared the groundwork behind it: **Redbubble product pages now load about 30% faster** at the slow end.', why: 'A test that enrolls nobody wastes the few weeks left before the Nov 20 freeze; this one is collecting clean data from day one.', pts: [['🔍', 'What', 'spotted that the test\'s audience rule used the wrong bot score field, so it would have enrolled no one'], ['🛠️', 'Fix', 'corrected the targeting, added a fallback and moved the test to local evaluation'], ['🚀', 'Result', 'the style picker test went live Oct 27, on top of product pages that load about 30% faster']], where: '#temp-pdp-t-shirt-styles-display-test', refs: [{ jira: 'DEAP-5915' }, { url: 'https://grid-articore.enterprise.slack.com/archives/C0BLC006TA9', l: 'Project channel' }, { url: 'https://grid-articore.enterprise.slack.com/archives/C0V4PM9DW/p1793125526175319', l: '#released post' }], recent: ['Oliver Belmont', 'Will Smith', 'Dustin Chen', 'Joshua Hassara', 'Anthony Ishkan'] };


// A/B tests page: key discussions and decisions about testing, from Amplitude Experiment, Slack and meeting notes.
const TESTTALK = [
  { icon: '🛍️', title: 'Redbubble cart cross-sell will test two designs, not one', refs: [{ soon: 'customer', l: 'Customer priorities' }, { jira: 'DEAP-6266' }, { url: 'https://app.amplitude.com/experiment/tpub/774278/config/1574129', l: 'Amplitude Experiment' }], status: 'Set up, not on yet', tone: 'warn', channel: 'Jira and Amplitude Experiment', when: 'Oct 28',
    body: 'The Redbubble cart cross-sell carousel was approved for release, and its A/B test was set up overnight with three groups: no cross-sell, the carousel as built, and the carousel with fewer badges. Testing a trimmed version alongside answers whether extra badges help or crowd the cart, without a second test later.',
    why: 'With the Nov 20 freeze close, one three-way test is faster than two in a row; it is judged on revenue per user, since cross-sell mostly moves order value.' },
  { icon: '🧪', title: 'Beam conversion test keeps running on a daily file instead of a full integration', refs: [{ soon: 'customer', l: 'Customer priorities' }, { jira: 'DEAP-6470' }], status: 'Decided', tone: 'warn', channel: '#temp-beam-internal', when: 'Oct 27',
    body: 'Sending order-level data to Beam through its API is a 3 to 4 week build that cannot ship and be checked before the code freeze, and the event-based shortcut would miss purchases. So Beam will send a daily export that Data Engineering loads into the warehouse next sprint, with the give-back amount estimated from revenue.',
    why: 'The TeePublic conversion test itself is unaffected (it is read on revenue per session); the trade-off is a slower, estimated read on what the give-back costs.' }
];

// What is selling: outside signals, checked against the web.
const SELLCALL = { e: '📈', tk: 'Will Stein Kentucky tees ~4× usual. Push them?', title: 'Kentucky football Will Stein designs are selling at about four times their usual share on TeePublic. Market them now?', body: 'On Oct 27, TeePublic designs tagged Will Stein Two Finger sold to 35 buyers, about 3.9 times their usual share, and the Kentucky Football Will Stein Two Finger tee was the day\'s top seller with 39 orders. Milwaukee Brewers designs ran at about 1.2 times their usual share (82 buyers, the most of any tag) with the World Series on, and Star Wars at about 1.2 times. Black Nerd Problems designs cooled off after leading on Oct 26 and dropped out of the top tags.', ask: 'Put the Will Stein design in paid social and on-site placements aimed at college football fans while the interest lasts, and keep Brewers World Series designs in rotation through the series.', src: '' };

// Vibe check: patterns across Slack and meetings. Never names, never complaints about people.
const VIBE = { e: '🌤️', mood: 'Busy but steady', summary: 'Heavy pre-peak load, a few late fixes during the sale, and lots of cross-team help. Energy is good; the risk is too many launches landing in the same week.',
  pace: 'High', churn: 'Moderate', fire: 'Some', fireNote: 'Two live issues during the sale (feed images and $0 shipping on stickers) were each triaged within a day.', team: 'Strong', teamNote: 'Fixes are getting picked up across teams quickly, often outside working hours.' };

// What customer service is saying: only above-normal topics; everything else reads as "all good".
const CS = { window: 'Customer service channels, Oct 22 to 27',
  tp: { topics: [], note: 'Normal volume, nothing trending. A handful of orders that went through twice were refunded on Oct 27; agents are watching for more.' },
  rb: { topics: [], note: 'Normal volume, nothing trending. One size chart correction is ticketed.' } };

// Team velocity from Matt Swope's #team-deap-metrics-* posts (two-week sprints, last two closed sprints, through Oct 15).
const VEL = {
  customer: { wk: 20, done: 42, trend: 'flat', note: 'About 40 points a sprint. Kick-off completion has been under 70% for five sprints.' },
  plc: { wk: 17, done: 80, trend: 'up', note: 'About 34 points a sprint, trending up; best completion in six sprints.' },
  // planned/ctx: background from the Data Engineering Planning Health analysis (Jira changelogs, sprints 10 to 21, pulled Oct 22). Team-level only.
  de: { wk: 13.5, done: 34, trend: 'down', planned: 0.6, ctx: 'Recent Data Engineering sprints finished 54%, 46% and 34% of what they committed, and about 40% of each sprint\'s points were added after kick-off, so dates here assume less room for planned work.', note: 'About 27 points a sprint; completion down three sprints in a row, so plans now cover 50 to 60% of capacity.' },
  dashery: { wk: 23, done: 81, trend: 'down', note: 'About 45 points a sprint, down from a record sprint; completion still above 80%.' },
  search: { wk: 25, done: 74, trend: 'up', note: 'About 50 points a sprint, trending up.' },
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
const DATES = {"PayPlus offer at checkout": {"start": "2026-08-25", "startSrc": "Jira DEAP-4816: first In Progress child (DEAP-4896)", "due": "2026-10-16", "dueSrc": "Meeting notes, CVR readout Oct 13: kickoff Oct 14, end-of-week launch (earlier target Oct 13, Slack Oct 7)", "notStarted": false}, "Beam conversion test": {"start": "2026-10-14", "startSrc": "Jira DEAP-6282: first In Development", "launched": "2026-10-19", "launchedSrc": "Jira DEAP-6282 Released Oct 19; Meeting notes, Exec/Customer Oct 19 (live)", "notStarted": false}, "Beam conversion test in cart": {"start": "2026-10-14", "startSrc": "Jira DEAP-6282: first In Development", "launched": "2026-10-19", "launchedSrc": "Jira DEAP-6282 Released Oct 19; Meeting notes, Exec/Customer Oct 19 (live)", "notStarted": false}, "Cart and cart-tray cross-sell": {"start": "2026-10-09", "startSrc": "Jira DEAP-6266: first In Development (Code Review since Oct 20)", "notStarted": false}, "T-shirt style pills on product pages": {"start": "2026-10-09", "startSrc": "Jira DEAP-5915: first In Development", "notStarted": false}, "Apple Pay buy-now on product pages": {"notStarted": true, "notStartedSrc": "Meeting notes, Peak standup Oct 21: feasibility still being assessed, no build"}, "Apple Pay buy-now on Redbubble": {"notStarted": true, "notStartedSrc": "Meeting notes, Peak standup Oct 21: feasibility still being assessed, no build"}, "Cart tray vs cart page test": {"notStarted": true, "notStartedSrc": "Meeting notes, CVR readout Oct 13: blocked on tray cross-sell implementation"}, "Premium tee upsell in cart": {"notStarted": true, "notStartedSrc": "Meeting notes, CVR readout Oct 13: tracked but not resourced"}, "Fix Redbubble channel tracking": {"notStarted": true, "notStartedSrc": "Jira DEAP-5099: Backlog, never moved"}, "Sign in with Google": {"start": "2026-08-04", "startSrc": "Jira DEAP-4840: first In Progress child (DEAP-4481)"}, "Thank-you page upsell, 6 slots": {"start": "2026-10-20", "startSrc": "Jira DEAP-6558: first In Development", "notStarted": false}, "Marketing opt-in on Express Pay": {"start": "2026-09-16", "startSrc": "Jira DEAP-5509: first In Progress child", "launched": "2026-10-16", "launchedSrc": "Jira DEAP-5825 (opt-in checkbox) Released Oct 16"}, "Cart upsell results": {"start": "2026-09-18", "startSrc": "Jira DEAP-5747: first In Progress child", "launched": "2026-10-08", "launchedSrc": "Slack #released Oct 8 (Grace: Cart Upsell v1; Tony: fully enabled via flipper)"}, "Dashery cart sticker upsell": {"start": "2026-09-18", "startSrc": "Jira DEAP-5747: first In Progress child", "launched": "2026-10-08", "launchedSrc": "Slack #released Oct 8 (Grace: Cart Upsell v1; Tony: fully enabled via flipper)"}, "Creator Dashboard v2": {"start": "2026-10-19", "startSrc": "Jira DEAP-6623: first In Progress child (DEAP-6463)", "notStarted": false}, "Creator behavior data in Amplitude": {"start": "2026-10-08", "startSrc": "Jira DEAP-4918: first In Development", "due": "2026-10-31", "dueSrc": "Meeting notes, Exec Roadmap Review Oct 13 (extended to Oct 31)", "notStarted": false}, "Meta Shopping": {"notStarted": true, "notStartedSrc": "Slack #ask-deap-dashery Sep 28: kicks off Nov/Dec; Meeting notes, Dashery Sync Oct 16: discovery Q4, launch Q1 2027"}, "Meta Shopping feed": {"notStarted": true, "notStartedSrc": "Slack #ask-deap-dashery Sep 28: kicks off Nov/Dec; Meeting notes, Dashery Sync Oct 16: discovery Q4, launch Q1 2027"}, "Shirt Monkey integration": {"start": "2026-08-21", "startSrc": "Jira DEAP-5105: first In Development (Release Pending Oct 22)", "notStarted": false}, "Print Logistics integration": {"start": "2026-08-06", "startSrc": "Jira DEAP-4484: first In Development (UAT since Oct 5)", "notStarted": false}, "Sub Dimension integration": {"start": "2026-07-23", "startSrc": "Jira DEAP-4485: first In Development (Release Pending Oct 22)", "notStarted": false}, "New TeePublic fulfillers": {"start": "2026-07-23", "startSrc": "Jira DEAP-4485 (Sub Dimension): earliest In Development of the three", "notStarted": false}, "Delivery-issue resolution queue": {"start": "2026-09-30", "startSrc": "Jira DEAP-5046: first In Progress child (DEAP-5142)", "notStarted": false}, "Trucker hat fulfillment": {"due": "2026-10-23", "dueSrc": "Jira DEAP-6261 due date (issue still Backlog, never moved)"}, "Precise USA sales tax by address": {"start": "2026-09-28", "startSrc": "Jira DEAP-5972: first In Development", "launched": "2026-10-20", "launchedSrc": "Slack #released Oct 20 (Vitalija)"}, "Exact USA sales tax at Redbubble checkout": {"start": "2026-09-28", "startSrc": "Jira DEAP-5972: first In Development", "launched": "2026-10-20", "launchedSrc": "Slack #released Oct 20 (Vitalija)"}, "Selling blanks on TeePublic": {"start": "2026-09-28", "startSrc": "Jira DEAP-5975 (TP Sell Blanks Onsite): In Development since Sep 28"}, "Search cluster migration": {"start": "2026-09-08", "startSrc": "Jira DEAP-5324: first In Progress children (DEAP-5454/5455)", "due": "2026-11-07", "dueSrc": "Jira DEAP-5324 description (Nov 7 end of life); Meeting notes, Exec Roadmap Review Oct 13", "notStarted": false}, "Learn to Rank rerun": {"start": "2026-09-22", "startSrc": "Jira DEAP-2622: first In Progress child of the rerun work (DEAP-5874); epic itself began Apr 16", "due": "2026-10-25", "dueSrc": "Meeting notes, Exec Roadmap Review Oct 13 (dashboard date; ship in last two weeks before freeze)", "notStarted": false}, "Learn to Rank before the freeze": {"start": "2026-09-22", "startSrc": "Jira DEAP-2622: first In Progress child of the rerun work (DEAP-5874); epic itself began Apr 16", "due": "2026-10-25", "dueSrc": "Meeting notes, Exec Roadmap Review Oct 13 (dashboard date; ship in last two weeks before freeze)", "notStarted": false}, "Ranking test for 3+ word queries": {"launched": "2026-10-20", "launchedSrc": "Slack #released Oct 20 (Wendy: 50/50 test started, ~2 weeks); Jira DEAP-6326 'Release LTR V2 Experiment' Released Oct 19"}, "Greeting card and postcard search": {"start": "2026-10-16", "startSrc": "Jira DEAP-5964 (TP card search and feed validation): first In Development", "due": "2026-10-20", "dueSrc": "Jira DEAP-5964 due date (in Code Review)", "likely": "2026-10-26", "likelySrc": "Slack #temp-tpo-greeting-card-postcard-launch Oct 21 (Ashley: TP card launch delayed from Oct 19, aim early next week)", "notStarted": false}, "Bad-art detection research": {"start": "2026-10-01", "startSrc": "Jira DEAP-6064: first In Progress child (DEAP-5967)", "due": "2026-11-09", "dueSrc": "Meeting notes, Exec Roadmap Review Oct 13 (dashboard phase end)", "notStarted": false}, "Trucker hats on Redbubble": {"start": "2026-10-21", "startSrc": "Jira DEAP-6578: first In Development", "due": "2026-11-03", "dueSrc": "Slack #temp-rbo-trucker-hat-line-extension Oct 19 (Ashley: on track 3-Nov US / 4-Nov AU)", "notStarted": false}, "Standardized wall art sizes": {"start": "2026-09-28", "startSrc": "Jira DEAP-5328: first In Development", "due": "2026-11-03", "dueSrc": "Meeting notes, Exec Roadmap Review Oct 13", "notStarted": false}, "Retire 8 low-value Redbubble products": {"start": "2026-10-15", "startSrc": "Jira DEAP-6198: first In Development", "due": "2026-10-26", "dueSrc": "Slack #temp-product-sunsets-2026 Oct 19 (Ashley: sunset 26-Oct US / 27-Oct AU); Jira DEAP-6421 due Oct 27", "notStarted": false}, "Server-side tag security and monitoring": {"start": "2026-08-19", "startSrc": "Jira DEAP-4278: first In Development (moved back to Backlog Sep 1)"}, "Amazon Ads tracking on TeePublic": {"start": "2026-08-25", "startSrc": "Jira DEAP-4853: first In Progress child", "notStarted": false}, "Creator affiliate tag on Redbubble": {"start": "2026-09-29", "startSrc": "Jira DEAP-6042: first In Development (In QA since Oct 12)", "notStarted": false}, "Meta tracking follow-ups": {"start": "2026-10-12", "startSrc": "Jira DEAP-6160: first In Development", "notStarted": false}, "Self-serve artist tax reports": {"start": "2026-09-08", "startSrc": "Jira DEAP-5348: first In Progress child (DEAP-5347)", "launched": "2026-10-22", "launchedSrc": "Slack #released Oct 22 (Matz: Artist Self-Serve Tax Reports are live)"}, "iOS native checkout test": {"start": "2026-07-06", "startSrc": "Jira DEAP-3840 (iOS native checkout spike): first In Development", "launched": "2026-10-19", "launchedSrc": "Slack #released Oct 19 (Matz: iOS A/B test kicked off this morning)"}, "Android native checkout": {"start": "2026-08-06", "startSrc": "Jira DEAP-4744: first activity", "due": "2026-10-19", "dueSrc": "Meeting notes, Exec Roadmap Review Oct 13 (Android launch Oct 19)", "notStarted": false}, "App eventing (purchase event first)": {"notStarted": true, "notStartedSrc": "Slack 21: next up after native checkout ships; Meeting notes, Martech roadmap Oct 21: ~2 weeks of work"}, "Takedown (DMCA) tool": {"due": "2026-10-31", "dueSrc": "Meeting notes, Exec Roadmap Review Oct 13 (targeting end of October)"}, "Seller verification compliance": {"start": "2026-10-13", "startSrc": "Jira DEAP-5914: first In Progress child (DEAP-6302)", "notStarted": false}, "Seller verification": {"start": "2026-10-13", "startSrc": "Jira DEAP-5914: first In Progress child (DEAP-6302)", "notStarted": false}, "Feed fixes, incl. new iPhone case": {"due": "2026-10-26", "dueSrc": "Jira DEAP-6548 (fix offsite feed products not updating) due date; in dev since Oct 20"}, "Greeting cards and postcards on TeePublic": {"due": "2026-10-19", "dueSrc": "Slack #temp-tpo-greeting-card-postcard-launch Oct 13 (launch 19-Oct US / 20-Oct AU)", "likely": "2026-10-26", "likelySrc": "Slack same channel Oct 19 (DELAYED) and Oct 21 (Ashley: aim early next week); TP feed tickets DEAP-6499/6613 still Backlog"}, "Lifecycle reporting fixes": {"notStarted": false, "notStartedSrc": "Data Engineering lead, Oct 27: in progress and delivering before peak; the epic's Backlog QA tickets don't mean it hasn't started"}, "Keep Sigma up through peak": {"due": "2026-11-17", "dueSrc": "Jira DEAP-6468 due date", "notStarted": true, "notStartedSrc": "Jira DEAP-6468: Backlog"}, "Postgres upgrade risk check": {"notStarted": true, "notStartedSrc": "Jira DEAP-6532 (created Oct 20): Backlog"}, "Products on order events in Amplitude": {"start": "2026-10-14", "startSrc": "Jira DEAP-5894: first moved to Code Review (no In Development logged)", "due": "2026-11-17", "dueSrc": "Jira DEAP-5894 due date", "notStarted": false}, "Simon AI profile attributes": {"start": "2026-07-21", "startSrc": "Jira DEAP-2807: first In Development", "notStarted": false}, "Address Line 2 always shown at checkout": {"launched": "2026-10-22", "launchedSrc": "Slack #released Oct 22 (TP Address Line 2 launch)"}};

// Hourly CVR, sessions and revenue for the day under review and its comparison days, from Amplitude. Filled by the refresh.
const HOURLY = {"tzLabel":"ET","tp":{"2025-10-08":{"cvr":[0.02538,0.02161,0.01816,0.01276,0.01,0.01294,0.01847,0.02098,0.02389,0.02806,0.0357,0.03235,0.03634,0.03622,0.03539,0.03356,0.03165,0.03171,0.03565,0.03749,0.03564,0.02976,0.03949,0.03025],"sess":[11410,9941,9546,8211,8017,8299,9153,10664,12773,15251,15626,16608,18675,17817,17030,17968,17427,19240,18562,25885,23900,28302,18980,17823]},"2025-10-17":{"cvr":[0.02403,0.02171,0.02134,0.02195,0.0181,0.01946,0.02839,0.03304,0.03818,0.03723,0.03804,0.03808,0.03599,0.03711,0.0366,0.03019,0.03764,0.03676,0.03528,0.03631,0.03722,0.03742,0.036,0.03187],"sess":[10773,7492,7563,6201,6111,5848,6960,8578,11290,13050,14577,15448,15816,16996,17241,19007,16893,18255,17875,22070,21454,20091,18146,14607]},"2025-10-22":{"cvr":[0.02619,0.02305,0.01713,0.01875,0.01742,0.01949,0.02306,0.02655,0.03218,0.03681,0.03389,0.02622,0.03084,0.03903,0.03936,0.03796,0.03727,0.03612,0.03711,0.0372,0.03534,0.03806,0.03715,0.01545],"sess":[9672,7734,6919,5691,5127,5553,6676,8633,10429,12497,14042,14826,16152,17210,16081,15953,15678,17235,17552,22737,22398,20975,18448,33036]},"2026-09-03":{"cvr":[0.02456,0.01391,0.02096,0.0168,0.01915,0.01872,0.02021,0.02594,0.02622,0.03427,0.03424,0.03739,0.03934,0.04151,0.0422,0.04223,0.04107,0.03827,0.04114,0.04655,0.04539,0.04111,0.03662,0.03775],"sess":[15166,19424,9330,9199,8726,9248,11667,13487,15682,16645,17729,18132,19351,19123,17995,18348,18955,20351,20727,24590,22456,22604,21379,17713]},"2026-09-15":{"cvr":[0.02019,0.0186,0.01479,0.01696,0.01637,0.01924,0.0201,0.02422,0.02774,0.02498,0.03047,0.03112,0.03566,0.03874,0.0369,0.04058,0.02675,0.02888,0.03454,0.03956,0.04048,0.03683,0.03121,0.02981],"sess":[14787,12944,13176,8694,8379,8482,11050,13343,14513,19744,18082,19050,18850,17718,17244,17111,24740,26766,23683,25062,24870,25063,23300,18654]},"2026-09-25":{"cvr":[0.02611,0.0249,0.02268,0.01565,0.01369,0.0148,0.01655,0.01825,0.02373,0.02579,0.02994,0.03266,0.03756,0.02987,0.02406,0.02707,0.03256,0.03344,0.0388,0.03814,0.03805,0.03508,0.03257,0.02611],"sess":[13082,10257,9542,9439,10312,10085,12013,14602,19170,19112,19002,19056,19087,18500,25071,24280,20400,19525,22158,20520,20218,19899,19156,18705]},"2026-10-13":{"cvr":[0.03023,0.02352,0.02413,0.0156,0.01749,0.01683,0.0202,0.02572,0.02414,0.03487,0.03648,0.02329,0.0271,0.03966,0.04195,0.03866,0.04696,0.04297,0.04452,0.05081,0.04898,0.04733,0.04276,0.03936],"sess":[11187,9468,7997,7632,7008,9117,11512,10494,15092,13116,14647,22051,22599,16936,15752,16875,17183,17240,21210,20455,20676,19370,18694,14392]},"2026-10-20":{"cvr":[0.01603,0.01629,0.01395,0.01144,0.00945,0.01295,0.01231,0.01733,0.02086,0.02166,0.02545,0.02414,0.02474,0.02462,0.02875,0.02471,0.02697,0.02905,0.02798,0.02693,0.02936,0.02744,0.02728,0.02919],"sess":[15768,10004,9252,8333,9594,8897,11940,11262,12323,13951,14032,15355,15050,13765,12454,14285,13544,13849,15033,15771,15878,15595,14145,11503]},"2026-10-21":{"cvr":[0.03342,0.03508,0.03072,0.02455,0.01977,0.02119,0.02483,0.0305,0.03213,0.03957,0.03931,0.03936,0.04302,0.04229,0.03501,0.03351,0.03164,0.03721,0.04006,0.0422,0.04256,0.04379,0.04051,0.03696],"sess":[9277,7378,6052,5633,6432,5861,6810,8658,10748,12164,13315,15410,15305,14980,15977,18621,19476,18860,20082,18059,18129,17938,16793,13916]}},"rb":{"2026-09-23":{"cvr":[0.00436,0.00399,0.00486,0.00681,0.00729,0.00626,0.00671,0.00621,0.00743,0.00654,0.007,0.00813,0.00806,0.00812,0.00866,0.00874,0.00907,0.01042,0.01118,0.01169,0.0098,0.00644,0.00745,0.00744],"sess":[62380,56994,43838,33193,35343,45979,48352,56572,52408,61904,63878,60803,65672,68255,60991,58433,52583,48778,43426,42908,53528,80960,63942,49662]},"2026-10-04":{"cvr":[0.01251,0.01029,0.00888,0.01245,0.0109,0.01258,0.00712,0.00829,0.01173,0.01653,0.01826,0.02024,0.01826,0.01764,0.01937,0.02136,0.02011,0.02036,0.01598,0.01589,0.01466,0.01459,0.01257,0.01163],"sess":[22112,23364,23934,22053,22380,20835,41964,36216,28297,22913,23603,24379,29113,30106,29421,27733,27608,30089,32447,34586,36833,38044,35446,35071]},"2026-10-20":{"cvr":[0.01254,0.01495,0.01306,0.01719,0.017,0.02201,0.01309,0.01762,0.01357,0.02111,0.02058,0.0207,0.01853,0.0224,0.02285,0.02065,0.0213,0.01868,0.02,0.01722,0.01416,0.01457,0.01108,0.01024],"sess":[18709,13815,11596,10152,10550,11278,17749,14533,19814,15028,15943,16823,17138,16121,16903,21556,20347,22758,20454,24492,27444,28616,31808,31885]},"2026-10-21":{"cvr":[0.00937,0.01219,0.0127,0.01324,0.01566,0.01312,0.01381,0.01772,0.01604,0.0155,0.01979,0.016,0.0133,0.01592,0.01984,0.01991,0.01631,0.0166,0.01117,0.0109,0.01046,0.011,0.01255,0.01247],"sess":[28594,20756,18661,20129,16360,21540,20813,19217,21278,23373,20685,27854,30519,26441,21411,23320,29566,27371,36652,39759,43595,40275,29830,26345]}}};

// Key releases since Jul 28 that likely moved shopper numbers, from #released (Oct 27). Shown on the 90-day chart with COMING.wins.
const RELN = [
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

