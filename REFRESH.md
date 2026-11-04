# Refreshing the dashboard data

The page is static: it shows whatever is in `data/` at deploy time. Updating it means changing those files and pushing to `master`.
Vercel redeploys automatically (about a minute). Shared features (ticks, topics, flags) live in the database and are not affected.
Mike pushes straight to `master`: there is no pull request or approval step.

## What each file holds

| File | Datasets | Comes from | Notes |
|---|---|---|---|
| `data/roadmap-coming-soon.js` | `COMING` (teams and their items), `COMING_PREV`, `ROADMAP_REVIEW`, `TEAM_MEETINGS`, `PEOPLE`, `SHOUTS`, `TESTTALK`, `SELLCALL`, `VIBE`, `CS`, `VEL`, `DATES`, `HOURLY`, `RELN` | Roadmap sheet (Active Work tabs), Jira DEAP, Slack, calendar, meeting notes | Main file Mike touches. Header comments say how each dataset is refreshed |
| `data/sources.js` | `SRCS`: for each roadmap item, where each field came from (Jira key, Slack thread, sheet row) | Same as above | One entry per roadmap item title. Keys must match `COMING` item titles exactly |
| `data/cvr-pacer-snapshot.js`, `data/cvr-ledger.js`, `data/max-bot-filter-and-products.js` | `D`, `L`, `MAX`, `UXL`, `PROD`... | Amplitude dashboards | Header comment names the dashboard and date pulled |
| `data/orders-slack-standups.js` | `ORD`, revenue, standup notes | Amplitude order_completed, Slack | |
| `data/experiments.js` | `EXPS` | Amplitude Experiment | |

For data, edit the existing file and keep its shape: change values, keep every field name, do not rename fields or change the file structure.
`app.js` reads these datasets by name, so renaming or restructuring a dataset can break the page, even when `npm run check` passes.

## Dates to update on every refresh
- `COMING.asOf`, `D.asOf`, `PROD.asOf` and the pull date in each file's header comment.
- After each Executive Roadmap Review (every other Tuesday): set `ROADMAP_REVIEW.last`, copy the current board into `COMING_PREV`, and update `TEAM_MEETINGS.<team>.last`.

## Rules for the content
- Shareable only: no people-performance, compensation, HR or budget items.
- Every roadmap item in `COMING` should have a matching entry in `SRCS` with at least one origin link. `npm run check` lists the ones that do not.
- Keep the source of every claim (Jira key, Slack thread link, sheet row) so it can be traced.
- **The Active Work tab decides what is on the roadmap** (Product Managers, Oct 30). Slack and Jira add the latest update to a project that is already on the sheet; they never create a project, and a project that is only in a Slack thread does not go on the roadmap.
- **Titles are verbatim from the sheet** (tidied for spaces only), and the **Team column on the sheet decides the team**. Do not rephrase a title or infer a team.
- **Goals come from the sheet only.** Dashery has not broken its goal into OKRs, so Dashery projects show no goal.
- **A result appears only after the Product Manager has posted it.** A test going live is not a result; do not put it on Recent impact.
- **Dashery's roadmap also lives on a Confluence whiteboard, "Roadmap CY2027"** (https://articore.atlassian.net/wiki/x/MADaLAE; it is temporary until Dashery moves to Jira and a spreadsheet). It is a reference point only: the Active Work tab stays the source of truth. Read it each refresh (Confluence `getConfluenceContent` with `content_format: svg`; bars are labeled DISCOVERY, DESIGN or DEV, laid out by month, in Pillar 1 and Pillar 2 lanes) and use it to cross-check Dashery phases and dates. If it disagrees with the sheet, keep the sheet and mention the difference in the refresh summary. Never add a project that is only on the whiteboard.
- **Data Engineering's tracker wins for Data Engineering status and dates until code freeze (Nov 20)** (Amelia and Mike, Nov 3). It is the Google Sheet "DE work Oct-Nov 2026" (https://docs.google.com/spreadsheets/d/1RIl96d3Pmj6kBkRwoD1Ex4oAic5cPsVh7I5T3n7LwJg; README and Sheet1; columns Project, Piece of work, Est. completion date, Impact, Notes, Status; ordered by priority, color-coded by epic). Read it each refresh. For Data Engineering items, its status, estimated completion date and whether it is committed for peak override the Active Work tab and Jira wording. The Active Work tab still decides which projects are on the roadmap, their titles and their team: a row only in the tracker is not added. Name every item it changed or disagrees on in the refresh summary. After code freeze, Active Work is the only source again.
- **Jira epics count only when they are OKR work (Amelia, #team-pms Nov 2 and 3).** Use an epic's dates and progress only when `Capacity Category = OKR`: those are the projects that belong on the roadmap and they have clear start and end dates. Ad hoc and engineering-initiative epics are long-running, so their epic dates and progress make work look late or stuck: for that work read the individual tickets and their due dates instead, and never treat the epic's dates or burn-down as the project's. A Jira epic with no matching Active Work row is never added (it can be named in the refresh summary).
- **One source per fact; conflicts are named, not blended (Amelia, #team-pms Nov 3: "conflicting sources are throwing it off").** The order is: for Data Engineering, its tracker (until code freeze); otherwise the Active Work tab; then Jira (OKR epics, or tickets); then Slack for the latest update. When two sources disagree, show the winner's value and say in the item's source note and the refresh summary that the other source differs. Do not average, merge or pick whichever is newest.
- **Titles verbatim and the sheet's Team column wins (Bishal, #team-pms Oct 30).** A project owned by Infra and listed as Infra on Active Work stays Infra even if Jira or Slack suggests Core; a project is never retitled because Jira calls it something else.
- **The roadmap spreadsheet has to be up to date (Mike, #team-pms Nov 2).** When a project is in Jira or the old artifact but not on the Active Work tab, the answer is to ask its Product Manager to add it to the sheet, not to add it from Jira. Say so in the refresh summary.
- **Roadmap sources, from the Nov 3 Executive Continuous Planning meeting (Mike):** the roadmap sheet is the source of truth and the page is an aggregator of it; it is meant to adapt to each team's process, not the other way round. Slack no longer feeds roadmap fields (status, dates, latest update): Slack is for Trending, What people are saying and incidents. **Data Engineering is not read from Jira at all** (Amelia): use the DE tracker and the sheet. Jira is read per Product Manager, only for the tickets tagged to them, and only the way that team uses it (a ticket column on the sheet is optional; Grace's teams use initiatives above epics, Amelia's work spans epics, so do not infer links). Teams may be told to be read differently: ask Jay Arora's 15-minute sessions to define each team's rule, then record it here. Jay is also checking why the page showed 129 roadmap items while the sheet had 147: name any count gap in the refresh summary.
- **Audience:** the page is for Mike and Vivek-level questions, not team-level tracking; teams keep their own Jira boards and side sheets. Do not add granularity for its own sake.
- **Estimates by Claude get a 👍/👎 with a reason** (restored Nov 3): a flag button sits next to every purple Claude estimate on Roadmap and Recent impact. Do not edit the `flags` data from a refresh.
- **Incidents (Nov 3, Bishal):** `INCIDENTS` in `data/orders-slack-standups.js`, shown in Trending under Bot Squad updates. Each refresh: search Slack for public `#inc-*` channels (Report Emergency creates `#inc-<number>`; engineers add `#inc-<name>`; skip `#inc-test-*`), read each, keep those with activity in the last 14 days, newest first, one plain line each (what broke, impact, status, what is next), no individuals' names, link the channel. tone: good = resolved, warn = contained with follow-ups, bad = still hurting something. Log reads in `sweep-state.md`.
- **Top designs and What is selling are Amplitude order data** (`order_completed` grouped by design, last 24 hours), not TeePublic admin's top sellers (Grace asked). Orders are never described as bot-filtered in page text: bots do not place orders (Mike, Nov 3). Every panel on Trending carries the standard ⓘ Sources link, left-aligned under the panel (`psrc()` in app.js), never a pill link.
- **Trending layout (Mike, Nov 3):** Incidents come before Bot Squad updates; Incidents show one row of four with Show N more, and a click opens an overlay (headline, What we know, Still open, Sources), never Slack. The Bot Squad note links sit left-aligned under the cards. Top designs stack TeePublic then Redbubble in one panel (no switch), with topic tags on both. The Should we double down? section and `SELLCALL` are retired; do not refresh them.
- **Incidents data:** each item in `INCIDENTS` carries `know` (2 to 4 plain bullets) and `open` (what is still to do) for the overlay, besides the one-line `body`.
- **`TOPS_RB` (Redbubble top designs, the Redbubble option on the Top designs switch):** same method as `TOPS` against Amplitude project 774278 (`order_completed` grouped by `products.design_id` + `products.design_title`, event totals), for the same complete day as `TOPS`. Copy the Strong filter from the Redbubble charts on dashboard `lm29400h` each refresh (read with `get_amplitude_charts include=typed`; today: `gp:cloudflare_bot_score` >= 70 and `gp:cloudflare_ja4` is not `t13d1517h2_8daaf6152771_cb7bf5808d99`, no country list). Top 7, ties broken by Amplitude order and noted; leave out and note any design whose orders come from one buyer (check with unique users). Links: take the most-ordered `products.url` per design (Redbubble product page); if none, `https://www.redbubble.com/shop/?query=<title>`. Images: `products.image_url` from the same grouping (the sticker or product shot), downloaded and shrunk with `sips -Z 260`, embedded as base64; empty `img` shows a title tile. No topic tags for Redbubble. The page hides the switch if `TOPS_RB` is missing.
- **Moderate bot filter (built Nov 3, first called Standard; renamed at Mike's request):** Cloudflare score 30 or higher and nothing else dropped (no verified-crawler, JA4 or country exclusion), because some humans score 30 to 70 (Amelia and Jon). Amplitude dashboard `bsjj5vr9` is a clone of Strong `lm29400h` with only that filter. `STD` in `data/standard-bot-filter.js` has the same shape as `MAX` (`D` and `L`, same dates and array lengths) and is refreshed the same way as MAX, from the same charts' Moderate clones, every run. Jon's extra screen-size filter goes into Moderate and up once he sends it: then update the clones on `bsjj5vr9`, `5ec1pe2j` and `lm29400h` as he says and record the spec. Redbubble at Moderate reads very low (CVR about 0.4%) because the scraper fingerprint is no longer excluded; that is expected.
- **Still to build, from the Nov 3 meeting (not done yet):** (1) a TeePublic vs Redbubble trending-terms comparison once Redbubble's trending page ships in its footer (Wendy); (2) PLC KPIs from Revin, payments and devices, when he sends prompts; (3) Dashery CVR next week and the app once eventing lands, Dashery needing its own measures (Grace); (4) alerts to the Product Manager channel when a metric falls below its range (Jay and Imène); (5) contributors for everyone on the Nov 3 call (Jay sets up branches), plus Allison and Kathleen; (6) a heads-up to the Analytics team that the page exists (Imène).
- **TeePublic tests come from the Split dashboard** (teepublic.com/manage/split, sign in through the browser pane): only tests launched in the last 30 days that have completed conversions. The date beside the experiment name is the launch date.


## Tips to keep token use low
- Start a fresh Claude session for each refresh, and only give it what changed since last time.
- The data files are large (`sources.js` alone is about 160 KB). Ask for targeted edits, never whole-file rewrites.
- For a UI change, name the part of the page (for example "the scorecard header") so Claude can grep for it.

## Automatic refreshes
One scheduled task refreshes the whole board once a day at 8:00 AM ET (Mike, Nov 3). The 2:30 PM and 4:30 PM runs and the Tuesday pre-review run are retired. Each run checks every source, runs `npm run check`, and **commits to `master` locally. It never pushes.** You get a notification; open GitHub Desktop and click **Push origin**. A run stops without committing if you have uncommitted changes in this folder (it will not touch your work), and the computer has to be awake and the Claude app open for a run to happen. If GitHub Desktop shows nothing to push, the run did not commit: look at the Refresh log in `work/projects/cvr-pacer.md` in the AI Mike folder.

## Each refresh (by hand)
1. In GitHub Desktop, click Fetch origin, then Pull if it offers one, so you start from the latest version.
2. Paste the prompt below into Claude with the folder open.
3. When Claude is done, read its summary. It should say which files changed and the check result.
4. In GitHub Desktop you will see the changed files. Type a short message (for example "Refresh Nov 4"), click Commit to master, then Push origin. The site updates in about a minute.
5. Open the site and look at it. You will be asked to sign in with Okta first. If you pushed a bad update, see "If something looks wrong".

## Prompt for Claude (paste with the repo folder open)
> Read REFRESH.md. I may ask for data updates, UI changes, or both.
> - Data: edit the files in `data/`, keeping every field name and structure exactly as it is now. Update the as-of dates and header comments. Keep to the shareable-only rule.
> - UI: you may edit `app.js`, `styles.css` and `index.html`. Make small targeted edits, keep the existing code style, and tell me which files you touched.
> - Never touch the files listed under "Do not edit" in REFRESH.md.
> - Save tokens: do not read or print whole files. Use grep, or a short node snippet, to look at only the part you need, and change things with targeted edits rather than rewriting a file.
> Then run `npm run check`, fix any FAIL, and tell me in plain language what changed, which items still have no source link, and whether the check passed. Do not commit or push if anything fails.

If Node is not installed on your computer, `npm run check` will not run. Tell Claude to skip it: GitHub runs the same check after you push and emails you if it fails.

## Branch rules (read before committing)
- Always work on `master`. Before any commit, run `git branch --show-current` and confirm it prints `master`. If it doesn't, stop and tell the user.
- Run `git pull origin master` before making changes, so you start from the latest version.
- Never check out, commit to, merge, or push to the `okta-auth` branch.
- Never force-push, and never rewrite history.
## Do not edit
- `middleware.js`, `lib/auth.js`, anything under `api/auth/` (Okta sign-in, managed separately).
- `runtime-shim.js`, `api/docs.js`, `schema.sql`, `migrations/` and `vercel.json` (shared features and database).
- Everything else, including `app.js`, `styles.css` and `data/`, is fine to change.

## If something looks wrong
- **GitHub emailed you "Check dashboard data failed":** the last update has a problem. Ask Claude to read the failed check and fix it, then commit and push again. The site may be showing the broken version until you do.
- **The site looks wrong or empty:** in GitHub Desktop, open History, right-click your last commit, choose Revert Changes in Commit, then Push origin. That puts the previous data back.
- **Fastest rollback:** someone with Vercel access (Jay or Tom) can open the project's Deployments tab and promote the previous deployment. That restores the last good version immediately.
## Desktop vs mobile in A/B test detail views (Nov 2)
Each running Redbubble test's detail view shows desktop and mobile side by side (no toggle on the tab). The numbers live in `EXPS.reads['<id>'].dev = { desktop: { n: [control, test], rpv: { v, s, a, b, f? }, cvr, atc, aov, eng }, mobile: {...} }` (`s` is 'sig', 'ns' or 'nb'), plus (first version listed for multi-version tests).
**How to pull:** `use_amp_experiments` action `analyze` on the test id with `groupBy: [{ type: 'user', value: 'gp:cloudflare_device_type', group_type: 'User' }]` and the test's `metricIds`. It returns one result per device (desktop, mobile, tablet). Plain `platform` or `device_type` do not work. Match each Amplitude metric to the dashboard metric by comparing ungrouped numbers. Revenue per user and AOV have no reliable error bar in Amplitude: store them as `s: 'nb'`, never 'sig'. A group under 2,000 users per version is never significant. Say "uneven group sizes" in notes when Amplitude flags a sample ratio mismatch.
TeePublic tests cannot be split (Split does not report devices).

## By product (Mike, Oct 27; restored to this file Nov 3)
**Every daily refresh must extend `PROD` to the same last day as `D.asOf`.** On Nov 3 it still ended Oct 31 while the page showed Nov 2, so the By product table on both CVR tabs read "No value" (Emma Feldman flagged it). The page aligns `PROD` dates to the site dates and shows "No value" for any day missing.
- **Morning run:** refresh `PROD` in `data/max-bot-filter-and-products.js` (shape: {asOf, def, tp|rb: {dates, items: {name: {v, s, geo: {US|GB|AU|CA|DE: {v, s}}}}}}), the last 90 days ending D.asOf, Maximum filter. Product CVR = people who viewed a product page of type X, then ordered type X within 24 hours, ÷ those viewers. TeePublic: `pageview` with request_controller = product_pages by `product_canvas`, matched on `products.product_canvas` (Kids T-shirt was renamed "Baby & Kids T-Shirt" on Oct 15; count both). Redbubble: `page` with page_type = pdp by `product_type_id`, matched on `products.product_type_id` from Oct 26, 2026 (Redbubble's `order_completed` stopped filling `products.product_id` that day; use `products.product_id` only for days before Oct 26), grouped by `blank`. Item mapping: Stickers = sticky-runners, overland-bikkies, lofty-lifesavers, glitzy-clinger; T-shirts = the 17 adult tee types (kids tee chewy-drongo left out); Posters = beaut-flannel; Wall art prints = photographic, art, canvas, framed, gallery board, acrylic block; Hoodies & sweatshirts = 7 adult types (kids hoodie left out); Phone cases = 7 iPhone and Galaxy case types; Greeting cards = greeting card + postcard; Throw pillows = bush-fizzer. A product CVR of 0 across every item means the match property broke, not that sales stopped. Same 8 product types per site unless the 90-day viewer ranking changes.
- Caveats on the page: Redbubble product CVRs before about Sep 22 carry leftover bot traffic; small countries (under ~100 daily viewers) swing a lot.
