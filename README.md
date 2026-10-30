# Product Org Dashboard

> This is a message from Mike to test a push.

Static dashboard (no build step) moved out of Mike's Claude artifact "Product Org Dashboard".
Source of truth for roadmap/active work is still the Product Org Dashboard Google Sheet.

## Updating the data
See `REFRESH.md` for what each data file holds and the steps. Updates are pushed straight to `master`; `npm run check` runs locally and on every push (GitHub Action).

## Layout
- `index.html`: shell, loads everything below in order (classic scripts share globals, so order matters)
- `styles.css`: all styling
- `data/*.js`: data snapshots the page reads as globals (`MAX`, `PROD`, `ORD`, `COMING`, `SRCS`, ...)
  - `sources.js` (`SRCS`): per-item origin links (Jira DEAP keys, Slack threads, Confluence, sheet rows). This is the map the agent can use.
  - `roadmap-coming-soon.js`: what each team is working on (sheet Active Work tabs, Jira, Slack)
  - the rest are Amplitude snapshots (CVR pacer, ledger, orders, experiments, bot-filtered metrics)
- `app.js`: rendering and behavior

## Deploy
1. Push to GitHub (private repo in the Articore org).
2. Vercel: add a new project, import the repo. Framework: Other, no build command, output directory `.`.
3. Connect the Neon database (Storage tab of the project). The integration adds `DATABASE_URL` to the project; nothing is pasted by hand.
4. Turn on Deployment Protection for production (the page links to internal Jira, Slack and sheet content and shows company metrics).
5. Open the site, pick a name in the bottom-right panel, add a topic and tick a standup item, then reload to confirm they stick.
Changes go through the repo first, then Vercel deploys.

## Shared state (replaces the claude.ai artifact database)
- `api/docs.js`: GET/PUT endpoint over one Postgres table (`schema.sql`; the route also creates it on first request).
  Collections: `order`, `flags`, `acks`, `ticks`, `topics`.
- `runtime-shim.js`: answers the page's existing `claude.use('db')` / `claude.use('user')` calls using that endpoint, so `app.js` is unchanged
  apart from three UI messages. It does nothing when the page runs inside claude.ai.
- Updates appear within about 15 seconds, and polling only runs while the tab is visible (keeps the free Neon compute asleep when nobody is looking).
- Identity is a name picker, not a login. Roles (Mike = owner, Matt Swope = reviewer, team editors) are enforced by the page only, so anyone who can open
  the site could choose any name. Fine behind Vercel login; replace with real auth before opening the site wider.
