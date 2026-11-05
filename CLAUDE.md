# Career Studio

## Connected services

| Service  | Account / project | IDs |
|----------|-------------------|-----|
| GitHub   | `careerstudioplatformdev/career-studio` | — |
| Vercel   | Team "CareerStudio" (`career-studio1`), project `career-studio` | team `team_kHh3iYGTtopbqP6rVDRLCMLm`, project `prj_yYhBuYuUNTwQzn1DA2yJJiqld9iW` |
| Supabase | Project "Career Studio" (us-east-2) | ref `plojuxwrndvtexplnohu` |
| Stripe   | "Career Studio" account (**live mode**) | `acct_1UYYXJGSGR090nIQ` |

Use the Vercel, Supabase, Stripe and GitHub MCP tools for these services.

## Push checklist (required every time the user says "push")

Do all of these steps, in order. Don't report a push as done until every step
passes, and report any step that fails or gets skipped.

1. **Tests first.** Run the full test suite and any lint/type-check/build
   scripts in `package.json` (or the project's equivalent). If anything fails,
   fix it before pushing. Never skip, disable or delete a test to get green.
   If there are no tests yet, say so.
2. **Supabase up to date.**
   - All schema changes live as SQL files in `supabase/migrations/`
     (timestamped, one change per file). Never change the schema by hand
     without also adding a migration file.
   - Compare `supabase/migrations/` with `list_migrations` on project
     `plojuxwrndvtexplnohu`, and apply any missing ones with `apply_migration`.
   - Run `get_advisors` (security and performance) and fix or report any
     issues, especially missing RLS policies.
   - If the schema changed, regenerate TypeScript types
     (`generate_typescript_types`) and commit them.
3. **Push to GitHub.** Commit with a clear message and push to the session's
   designated branch with `git push -u origin <branch>`.
4. **Vercel redeploy.** Confirm Vercel picked up the push: use
   `list_deployments` for project `prj_yYhBuYuUNTwQzn1DA2yJJiqld9iW`, filtered
   by the pushed commit SHA. Wait for it to reach `READY`. If it hits `ERROR`,
   read the build logs, fix the problem, and push again. If no deployment
   appears, check that the Vercel project is still linked to the GitHub repo.
5. **Report.** Tell the user the commit, test results, migrations applied,
   advisor findings, and the Vercel deployment URL and status.

## How this environment is wired

- **Cloud sandbox network:** can reach `plojuxwrndvtexplnohu.supabase.co` and
  `api.stripe.com`, plus package registries. A Stripe **test-mode** secret key
  is injected by the network proxy for `api.stripe.com`. Code that reads
  `STRIPE_SECRET_KEY` should get the placeholder `proxy-injected` when it runs
  in the sandbox. Never put a real key in code or `.env`.
- **Running the app in the sandbox:** Node's built-in `fetch` ignores the proxy, so
  start the server with `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt npm start`.
  Launch Playwright's Chromium with `proxy: { server: process.env.HTTPS_PROXY, bypass: "localhost,127.0.0.1" }`.
  A pre-confirmed test login exists for previews: `preview-tester@careerstudio-preview.dev`
  (ask the user for the password; delete the account before real launch).
- **Supabase admin work** (migrations, SQL, advisors, types, edge functions,
  logs) goes through the Supabase MCP tools, not the Supabase CLI. Direct
  Postgres connections (port 5432) aren't available from the sandbox.
- **Vercel** is linked to the GitHub repo. Every push to any branch deploys
  automatically. Deployments are behind Vercel Authentication, so fetch them
  with the `web_fetch_vercel_url` MCP tool, not curl.
- **Vercel env vars already set** (all environments):
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Secrets
  still to add in the Vercel dashboard are listed in `.env.example`.
- **Supabase:** free plan, so no database branching. The `ensure_rls` event
  trigger turns on RLS automatically for every new table in `public`. Every
  table still needs explicit policies.
- **Branches:** develop on feature branches (preview deploys). `main` becomes
  production when the user says the dev run is done.

## App structure

- Next.js 16 (App Router, TypeScript, Tailwind) on Vercel; Supabase for auth and Postgres (RLS on every table).
  This replaces the Django/DigitalOcean stack in the original blueprint.
- `src/lib/resume/`: pure, unit-tested logic (types, scoring, red flags, JD match, parser, DOCX/PDF export).
- `src/components/resume/`: builder (guided Q&A), studio (edit/check/match/download), editors, panels.
- Scripts: `npm test` (vitest), `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- Product rule: never invent facts. Unknown stays empty, every entry has a source and a confirmed flag,
  and export requires every fact confirmed plus a final attestation.

## Stripe safety

The connected Stripe account is in live mode. Use test-mode keys for
development and testing, and never create live charges, products or customers
unless the user explicitly asks.

## Secrets

Never commit API keys or `.env` files. Store secrets as Vercel environment
variables (and Supabase secrets for edge functions).
