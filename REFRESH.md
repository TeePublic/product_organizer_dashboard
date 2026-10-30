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


## Tips to keep token use low
- Start a fresh Claude session for each refresh, and only give it what changed since last time.
- The data files are large (`sources.js` alone is about 160 KB). Ask for targeted edits, never whole-file rewrites.
- For a UI change, name the part of the page (for example "the scorecard header") so Claude can grep for it.

## Each refresh
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