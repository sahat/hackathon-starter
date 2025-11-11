<!-- IMPORTANT: maintainers may close PRs that fail the checks below without review. -->

## Checklist

- [ ] I acknowledge that submissions that include copy-paste of AI-generated content taken at face value (PR text, code, commit message, documentation, etc.) most likely have errors and hence will be rejected entirely and marked as spam or invalid
- [ ] I manually tested the change with a running instance, DB, and valid API keys where applicable
- [ ] Added/updated tests if the existing tests do not cover this change
- [ ] README or other relevant docs are updated
- [ ] `--no-verify` was not used for the commit(s)
- [ ] `npm run lint` passed locally without any errors
- [ ] `npm test` passed locally without any errors
- [ ] `npm run test:e2e:replay` passed locally without any errors
- [ ] `npm run test:e2e:custom -- --project=chromium-nokey-live` passed locally without any errors
- [ ] PR diff does not include unrelated changes
- [ ] PR title follows Conventional Commits — https://www.conventionalcommits.org/en

## Description

<!-- A short summary (Conventional Commits-style preferred).  -->

<!-- Fixes: issue link -->

## Screenshots of UI changes (browser) and logs/test results (console, terminal, shell, cmd)
