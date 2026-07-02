# AGENTS.md

This file is for coding agents (and anyone doing a quick pass with one). It is a
**dependency map**, not a tutorial — for narrative setup instructions, API key
registration links, and "how it works" walkthroughs, see [README.md](README.md)
and [test/TESTING.md](test/TESTING.md).

Hackathon Starter is boilerplate. Most people who clone it will delete large
parts of it — most `/api/*` and `/ai/*` examples, and most OAuth providers —
and keep only what their project needs. That deletion is the single most
common task an agent will be asked to do in this repo, and it's easy to do
incompletely: routes, views, config blocks, env vars, npm packages, and tests
are declared in five different files per feature, and nothing enforces that
they're removed together. The tables below exist so an agent (or a human)
doesn't have to reverse-engineer those relationships from scratch, feature by
feature, and doesn't leave orphaned code behind.

**If you can't verify a claim below against the current code, don't trust it
— re-derive it.** This file can drift out of date; the code is ground truth.

## Core vs. optional, in one paragraph

Core = auth, account management, session/security middleware, the base
layout. Removing or breaking this makes the app not work. Optional = every
individual OAuth provider and every `/api/*` and `/ai/*` example — each one
is a self-contained demo of integrating some third-party service, included so
you can copy the pattern, then delete the ones you don't need. A few
providers are **cross-cutting** (used for both login and an API example) —
those are flagged explicitly below because deleting them breaks more than one
feature.

## Core system (edit carefully, don't delete)

| Area                                                               | Files                                                                                                                                                 |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry point / route table                                          | `app.js` — every route in the app is registered here, in one file, on purpose (see README "Why do you have all routes defined in app.js?")            |
| Session, CSRF, rate limiting, redirect-back-after-login            | `app.js` middleware stack (top of file)                                                                                                               |
| Local auth + session + 2FA + account CRUD                          | `controllers/user.js`, `models/User.js`, `models/Session.js`                                                                                          |
| Passport strategy registration, OAuth linking logic, token refresh | `config/passport.js`                                                                                                                                  |
| OAuth token revocation on unlink/delete                            | `config/token-revocation.js`                                                                                                                          |
| Passkey / WebAuthn login and registration                          | `controllers/webauthn.js`                                                                                                                             |
| Flash messages                                                     | `config/flash.js`, `views/partials/flash.pug`                                                                                                         |
| Request logging                                                    | `config/morgan.js`                                                                                                                                    |
| Email sending                                                      | `config/nodemailer.js`                                                                                                                                |
| Cache-busted static asset URLs                                     | `config/cacheBust.js`, used via `app.locals.getFileHash` in `views/layout.pug`                                                                        |
| Base layout, nav, footer                                           | `views/layout.pug`, `views/partials/header.pug`, `views/partials/footer.pug`                                                                          |
| Auth views                                                         | `views/account/login.pug`, `signup.pug`, `forgot.pug`, `reset.pug`, `two-factor.pug`, `totp-setup.pug`, `webauthn-login.pug`, `webauthn-register.pug` |
| Account management view                                            | `views/account/profile.pug` — **also lists every OAuth provider's link/unlink block**; see OAuth table below                                          |
| Contact form                                                       | `controllers/contact.js`, `views/contact.pug` — technically optional (SMTP-dependent), but small/self-contained enough that most projects keep it     |

`views/account/login.pug` and `views/account/profile.pug` are **shared,
hand-edited files**, not generated from a list — each OAuth provider has a
hardcoded button/link block in one or both of these templates. Removing a
provider means deleting its specific block, not deleting the file.

## OAuth providers

Every provider follows the same shape in `config/passport.js`: a
`passport.use(...)` call under a `/** Sign in with X */`-style comment,
registered under a **provider key** (the string passed to `passport.use` /
`passport.authorize`, and the field name stored on `User.tokens[].kind` and
`User[providerKey]`). That provider key is what to grep for across the repo
when removing a provider — it appears in `app.js` routes, `passport.js`,
`config/token-revocation.js`, and both account views.

| Provider key  | Env vars                                           | Sign-in button (`login.pug`)                | Link/unlink block (`profile.pug`) | Revocation configured | Also used for an API example?                                                                                                                                                                                                                                       |
| ------------- | -------------------------------------------------- | ------------------------------------------- | --------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `google`      | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`         | yes                                         | yes                               | yes                   | **Yes — Drive (`/api/google/drive`) and Sheets (`/api/google/sheets`) reuse the same Google OAuth token/scopes.** Removing Google login breaks those two API examples too; removing just those two examples doesn't affect login.                                   |
| `facebook`    | `FACEBOOK_ID`, `FACEBOOK_SECRET`                   | yes                                         | yes                               | yes                   | **Yes — `/api/facebook`** reuses the Facebook login token. Don't confuse `FACEBOOK_ID`/`FACEBOOK_SECRET` (OAuth) with `FACEBOOK_PIXEL_ID` (analytics, unrelated, keep — see below).                                                                                 |
| `twitch`      | `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`         | yes                                         | yes                               | yes                   | **Yes — `/api/twitch`** reuses the Twitch login token.                                                                                                                                                                                                              |
| `github`      | `GITHUB_ID`, `GITHUB_SECRET`                       | yes                                         | yes                               | yes                   | No — `/api/github` (GitHub search example) is unauthenticated and uses `@octokit/rest` independently; it is a _different feature_ that happens to share a name. Removing "Sign in with GitHub" does not require removing the `/api/github` example, and vice versa. |
| `microsoft`   | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`   | yes                                         | yes                               | no                    | No                                                                                                                                                                                                                                                                  |
| `linkedin`    | `LINKEDIN_ID`, `LINKEDIN_SECRET`                   | yes                                         | yes                               | yes                   | No                                                                                                                                                                                                                                                                  |
| `x` (Twitter) | `X_KEY`, `X_SECRET`                                | yes                                         | yes                               | yes                   | No                                                                                                                                                                                                                                                                  |
| `discord`     | `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`       | yes                                         | yes                               | yes                   | No                                                                                                                                                                                                                                                                  |
| `tumblr`      | `TUMBLR_KEY`, `TUMBLR_SECRET`                      | no (link-only, from `/api/tumblr` view)     | yes                               | no                    | This _is_ the API example — `/api/tumblr` (`apiController.getTumblr`) is the only reason this provider exists.                                                                                                                                                      |
| `steam`       | `STEAM_KEY`                                        | no (link-only, from `/api/steam` view)      | yes                               | no                    | Same pattern — `/api/steam` is the feature.                                                                                                                                                                                                                         |
| `trakt`       | `TRAKT_ID`, `TRAKT_SECRET`                         | no (link-only, from `/api/trakt` view)      | yes                               | yes                   | Same pattern — `/api/trakt` is the feature.                                                                                                                                                                                                                         |
| `quickbooks`  | `QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET` | no (link-only, from `/api/quickbooks` view) | yes                               | yes                   | Same pattern — `/api/quickbooks` is the feature.                                                                                                                                                                                                                    |

Notes:

- "Link/unlink block" for all twelve providers lives in `views/account/profile.pug`; only eight of them (the ones marked "yes" in the sign-in column) also get a button in `views/account/login.pug`.
- `passport-oauth2-refresh` (`refresh.use(...)` calls in `passport.js`) is only wired up for providers with a refresh token: `google`, `linkedin`, `microsoft`, `twitch`, `quickbooks`, `trakt`, `discord`. Removing one of those providers means removing its `refresh.use(...)` call too, not just `passport.use(...)`.
- `config/token-revocation.js` is driven entirely by `passport.js`'s exported `providerRevocationConfig` object — removing a provider's entry there is enough; there's no separate per-provider file.
- `/auth/failure` (`app.js`) is a single shared failure-redirect route for _all_ providers — never remove it while any provider remains.

## API examples (`/api/*`)

Every route below is registered in `app.js` under `/** API examples routes. */`,
implemented in `controllers/api.js`, and rendered from `views/api/<name>.pug`
unless noted. Feature tokens match the e2e test/fixture naming convention
(`test/e2e/<token>.e2e.test.js`, `test/fixtures/*<token>*` — fixtures are
named after the sanitized outbound request URL, so the token match is
substring, not exact).

| Feature                          | Route(s)                                                   | Controller export                                     | Env vars                                           | npm package(s)                       | e2e test                                                                                                     |
| -------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| API browser index                | `/api`                                                     | `getApi`                                              | —                                                  | —                                    | —                                                                                                            |
| Last.fm                          | `/api/lastfm`                                              | `getLastfm`                                           | `LASTFM_KEY`, `LASTFM_SECRET`                      | `lastfm`                             | `test/e2e-nokey/lastfm.e2e.test.js`                                                                          |
| New York Times                   | `/api/nyt`                                                 | `getNewYorkTimes`                                     | `NYT_KEY`                                          | —                                    | `test/e2e/nyt.e2e.test.js`                                                                                   |
| Stripe                           | `/api/stripe` (GET/POST)                                   | `getStripe`, `postStripe`                             | `STRIPE_SKEY`, `STRIPE_PKEY`                       | `stripe`                             | none                                                                                                         |
| Web scraping                     | `/api/scraping`                                            | `getScraping`                                         | —                                                  | `cheerio`                            | `test/e2e-nokey/scraping.e2e.test.js`                                                                        |
| Twilio                           | `/api/twilio` (GET/POST)                                   | `getTwilio`, `postTwilio`                             | `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_FROM_NUMBER` | `twilio`                             | `test/e2e/twilio.e2e.test.js`                                                                                |
| Foursquare                       | `/api/foursquare`                                          | `getFoursquare`                                       | `FOURSQUARE_APIKEY`                                | —                                    | `test/e2e/foursquare.e2e.test.js`                                                                            |
| PayPal                           | `/api/paypal`, `/api/paypal/success`, `/api/paypal/cancel` | `getPayPal`, `getPayPalSuccess`, `getPayPalCancel`    | `PAYPAL_ID`, `PAYPAL_SECRET`                       | —                                    | none                                                                                                         |
| File upload                      | `/api/upload` (GET/POST)                                   | `getFileUpload`, `postFileUpload`, `uploadMiddleware` | —                                                  | `multer`                             | `test/e2e-nokey/upload.e2e.test.js`                                                                          |
| HERE Maps                        | `/api/here-maps`                                           | `getHereMaps`                                         | `HERE_API_KEY`                                     | —                                    | `test/e2e/here-maps.e2e.test.js`                                                                             |
| Google Maps                      | `/api/google-maps`                                         | `getGoogleMaps`                                       | `GOOGLE_MAP_API_KEY`                               | —                                    | `test/e2e/google-maps.e2e.test.js`                                                                           |
| Chart (Alpha Vantage + Chart.js) | `/api/chart`                                               | `getChart`                                            | `ALPHA_VANTAGE_KEY`                                | `chart.js`                           | `test/e2e/chart.e2e.test.js` — also remove the `/js/lib/chart.umd.min.js` entry in `app.js`'s `libFiles` map |
| Lob                              | `/api/lob`                                                 | `getLob`                                              | `LOB_KEY`                                          | `@lob/lob-typescript-sdk`            | `test/e2e/lob.e2e.test.js`                                                                                   |
| Trakt                            | `/api/trakt`                                               | `getTrakt`                                            | see OAuth table (`trakt`)                          | —                                    | `test/e2e/trakt.e2e.test.js`                                                                                 |
| PubChem                          | `/api/pubchem`                                             | `getPubChem`                                          | —                                                  | —                                    | `test/e2e-nokey/pubchem.e2e.test.js`                                                                         |
| Wikipedia                        | `/api/wikipedia`                                           | `getWikipedia`                                        | —                                                  | —                                    | `test/e2e-nokey/wikipedia.e2e.test.js`                                                                       |
| GIPHY                            | `/api/giphy`                                               | `getGiphy`                                            | `GIPHY_API_KEY`                                    | —                                    | `test/e2e/giphy.e2e.test.js`                                                                                 |
| GitHub search                    | `/api/github`                                              | `getGithub`                                           | `GITHUB_ID`, `GITHUB_SECRET`*                      | `@octokit/rest`                      | `test/e2e-nokey/github-api.e2e.test.js`                                                                      |
| Google Drive                     | `/api/google/drive`                                        | `getGoogleDrive`                                      | see OAuth table (`google`)                         | `@googleapis/drive`                  | none (needs live user OAuth session)                                                                         |
| Google Sheets                    | `/api/google/sheets`                                       | `getGoogleSheets`                                     | see OAuth table (`google`)                         | `@googleapis/sheets`                 | none                                                                                                         |
| Tumblr                           | `/api/tumblr`                                              | `getTumblr`                                           | see OAuth table (`tumblr`)                         | —                                    | none                                                                                                         |
| Facebook                         | `/api/facebook`                                            | `getFacebook`                                         | see OAuth table (`facebook`)                       | —                                    | none                                                                                                         |
| Twitch                           | `/api/twitch`                                              | `getTwitch`                                           | see OAuth table (`twitch`)                         | `twitch-passport` (also OAuth)       | none                                                                                                         |
| Steam                            | `/api/steam`                                               | `getSteam`                                            | see OAuth table (`steam`)                          | `passport-steam-openid` (also OAuth) | none                                                                                                         |
| QuickBooks                       | `/api/quickbooks`                                          | `getQuickbooks`                                       | see OAuth table (`quickbooks`)                     | —                                    | none                                                                                                         |

\* `/api/github` (unauthenticated search) and "Sign in with GitHub" both read
`GITHUB_ID`/`GITHUB_SECRET` from env, but for different purposes — verify
which one(s) a given project still needs before removing these vars.

## AI examples (`/ai/*`)

Registered in `app.js` under `/** AI Integrations and Boilerplate example
routes. */`, implemented across `controllers/ai.js` and
`controllers/ai-agent.js`, views under `views/ai/`.

| Feature                                    | Route(s)                                                  | Controller                                                       | Env vars                                                                                               | npm package(s)                                                                                                  | e2e test                                                         |
| ------------------------------------------ | --------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| AI examples index                          | `/ai`                                                     | `ai.js: getAi`                                                   | —                                                                                                      | —                                                                                                               | —                                                                |
| LLM text classifier                        | `/ai/llm-classifier` (GET/POST)                           | `ai.js: getLLMClassifier`, `postLLMClassifier`                   | `GROQ_API_KEY`, `GROQ_MODEL_PROMPT_GUARD`                                                              | `@langchain/groq`, `langchain`                                                                                  | `test/e2e/llm-classifier.e2e.test.js`                            |
| LLM camera / image                         | `/ai/llm-camera` (GET/POST)                               | `ai.js: getLLMCamera`, `postLLMCamera`, `imageUploadMiddleware`  | `GROQ_API_KEY`, `GROQ_VISION`                                                                          | `@langchain/groq`, `multer`                                                                                     | none                                                             |
| RAG (retrieval-augmented generation)       | `/ai/rag`, `/ai/rag/ingest`, `/ai/rag/ask`                | `ai.js: getRag`, `postRagIngest`, `postRagAsk`                   | `HUGGINGFACE_KEY`, `HUGGINGFACE_EMBEDDING_MODEL`, `HUGGINGFACE_PROVIDER`, `GROQ_API_KEY`, `GROQ_MODEL` | `@langchain/textsplitters`, `@langchain/mongodb`, `@huggingface/inference`, `pdfjs-dist`, `keyv`, `@keyv/mongo` | `test/e2e/rag.e2e.test.js`                                       |
| AI Agent (ReAct, tool calling, guardrails) | `/ai/ai-agent`, `/ai/ai-agent/chat`, `/ai/ai-agent/reset` | `ai-agent.js: getAIAgent`, `postAIAgentChat`, `postAIAgentReset` | `GROQ_API_KEY`, `GROQ_MODEL`                                                                           | `@langchain/groq`, `@langchain/core`, `langchain`, `@langchain/langgraph-checkpoint-mongodb`, `zod`             | none (see `test/*.test.js` for unit coverage of session cleanup) |

Notes:

- `ai-agent.js` also exports `cleanupOrphanedTempSessions`, called once from
  `app.js` on Mongo connection open, and `deleteUserAIAgentData`, called from
  `controllers/user.js` on account deletion — **both are cross-links from
  core account code into this "optional" feature.** If you remove the AI
  Agent, remove those two call sites too, not just the routes/controller.
- `OPENAI_API_KEY` is present in `.env.example` but **not referenced by any
  current code path** — don't assume it maps to a feature; verify with grep
  before acting on it either way.
- `MongoDBAtlasVectorSearch`/`MongoDBAtlasSemanticCache` (RAG) and
  `MongoDBSaver` (AI Agent) both write to MongoDB collections beyond the
  `User`/`Session` models — check `controllers/ai.js` / `controllers/ai-agent.js`
  for the exact collection names if you need to also drop data, not just code.

## Removing a feature: checklist

For any feature (an OAuth provider, an `/api/*` example, an `/ai/*` example):

1. Route(s) in `app.js`.
2. Controller export(s) in `controllers/*.js` (delete the function; delete the file only if nothing else in it is still used).
3. View(s) in `views/`.
4. Any hardcoded block in a _shared_ view — check `views/account/login.pug`, `views/account/profile.pug`, `views/partials/header.pug` by grepping the provider key or feature name; don't assume there's a clean per-feature file to delete.
5. `config/passport.js` — `passport.use(...)`, matching `refresh.use(...)` if present, and its entry in `providerRevocationConfig` at the bottom of the file.
6. Env vars in `.env.example` and `test/.env.test` — **verify with grep that nothing else references the var before removing it** (see the `GITHUB_ID`/`OPENAI_API_KEY` notes above for why this matters).
7. npm packages — remove with `npm uninstall <package>` (don't hand-edit `package.json`/`package-lock.json`), and only after confirming via grep that no other retained feature imports the same package (several packages, e.g. `passport-steam-openid`, `twitch-passport`, do double duty as both the OAuth strategy and the API example).
8. Static lib mapping in `app.js`'s `libFiles` map, if the feature has a dedicated client-side library entry (currently only `chart.js`, for the Chart/Alpha Vantage example).
9. Tests: unit test file if one exists (`test/*.test.js`), the whole `test/e2e/<feature>.e2e.test.js` or `test/e2e-nokey/<feature>.e2e.test.js` file, and its fixtures — fixtures are named after the _outbound request URL_, so match by substring (e.g. everything containing `trakt.tv`), not by an exact feature-name filename.
10. Run the checks in the next section before considering the removal done — an incomplete removal usually shows up as a lint error (unused import), a failing test (missing fixture / removed route still referenced), or a broken view (undefined local).

## Commands

- `npm run lint` — ESLint + Prettier, should pass with zero warnings.
- `npm test` — Mocha unit/integration tests (`test/*.test.js`), runs against an in-memory MongoDB.
- `npm run test:e2e:replay` — Playwright e2e tests against recorded fixtures (no live API keys needed).
- `npm run test:e2e:custom -- --project=chromium-nokey-live` — Playwright e2e tests that hit live APIs not requiring keys.
- `npm run test:e2e:live` — full Playwright e2e suite against live third-party APIs (needs real keys in `.env`/`test/.env.test`).
- `npm start` — builds SCSS then runs the app.

## Testing conventions

See [test/TESTING.md](test/TESTING.md) for the full picture. Short version:
`test/*.test.js` are **core** tests (auth, security, session) and must always
pass — they're what protects you from breaking the framework while
customizing it. `test/e2e/` and `test/e2e-nokey/` are **per-integration**
tests; each one only matters if you're keeping that integration, and should
be deleted alongside it.
