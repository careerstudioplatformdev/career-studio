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

## Stripe safety

The connected Stripe account is in live mode. Use test-mode keys for
development and testing, and never create live charges, products or customers
unless the user explicitly asks.

## Secrets

Never commit API keys or `.env` files. Store secrets as Vercel environment
variables (and Supabase secrets for edge functions).
