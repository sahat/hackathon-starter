# Changelog
---------

### 5.2.0 (July 28, 2019)
- Added API example: Google Drive (thanks to @tanaydin)
- Added Google Sheets API example (thanks to @clarkngo)
- Added HERE Maps API example
- Added support for Intuit Quickbooks API
- Improved Lob.com API example
- Added support for email verification
- Added support for refreshing OAuth tokens
- Fixed bug when users attempt to login by email for accounts that are created with a sign in provider
- Fixed bug in the password reset
- Added CSRF check to the File Upload API example -- security improvement -- breaking change
- Added validation check to password reset token -- security improvement
- Fixed missing await in the Foursquare API example
- Fixed Google Oauth2 profile picture (thanks to @tanaydin)
- Removed deprecated Instagram API calls -- breaking change
- Upgrade to login by LinkedIn v2, remove LinkedIn API example -- breaking change
- Removed express-validator in favor of validator.js -- breaking change
- Removed Aviary API example since the service has been shutdown
- Added additional unit tests for the user model (thanks to @Tolsee)
- Updated Steam's logo
- Updated dependencies
- Updated documentation (thanks in part to @TheMissingNTLDR, @Coteh)

### 5.1.4 (May 14, 2019)
- Migrate from requestjs to axios (thanks to @FX-Wood)
- Enable page templates to add items to the HTML head element
- Fix bold font issue on macs (thanks to @neighlyd)
- Use BASE_URL for github
- Update min node engine to require Feb 2019 NodeJS security release
- Add Node.js 12 to the travis build
- Update dependencies
- Update documentation (thanks in part to @anubhavsrivastava, @Fullchee, @luckymurari)

### 5.1.3 (April 7, 2019)
- Update Steam API Integration
- Upgrade flatly theme files to 4.3.1
- Migrate from bcrypt-nodejs to bcrypt
- Use BASE_URL for twitter and facebook callbacks
- Add a ChartJS example in combination with Alpha Vantage API usage (thanks to @T-travis)
- Improve Github integration – use the user’s private email address if there is no public email listed (thanks to @danielhunt)
- Improve the error handling for the NYT API Example
- Add lodash 4.7
- Fixed gender radio buttons spacing
- Fixed alignment Issue for login / sign in buttons at certain screen widths. (thanks to @eric-sciberras)
- Remove Mozilla Persona information from README since it has been deprecated
- Remove utils
- Remove GSDK since it does not support Bootstrap 4(thanks to @laurenquinn5924)
- Adding additional tests to cover some of the API examples
- Add prod-checklist.md
- Update dependencies
- Update documentation (thanks in part to @GregBrimble)

### 5.1.2 (January 13, 2019)
- Added Login by Snapchat (thanks to @nicholasgonzalezsc)
- Migrate the Foursquare API example to use Axios calls instead of the npm library.
- Fixed minor visual issue in the web scraping example.
- Fixed issue with Popper.js integration (thanks to @binarymax and @Furchin)
- Fixed wrapping issues in the navbar and logo indentation (thanks to @estevanmaito)
- Fixed MongoDB deprecation warnings
- Add production error handler middleware that returns 500 to handle errors.  Also, handle server errors in the lastfm API example (thanks to @jagatfx)
- Added autocomplete properties to the views to address Chrome warnings (thanks to @peterblazejewicz)
- Fixed issues in the unit tests.
- Fixed issues in the modern theme variables and imports to be consistent (thanks to @monkeywithacupcake)
- Upgraded to Fontawesome to the latest version (thanks in part to @gesa)
- Upgraded eslint to v5.
- Updated dependencies
- Updated copyright year to include 2019
- Minor code formatting improvements
- Replaced mLab instructions with MongoDB Atlas instructions (thanks to @mgautam98)
- Fixed issues in the readme (thanks to @nero-adaware , @empurium, @aschwtzr)

### 5.1.1 (July 5, 2018)
- Upgraded FontAwesome to FontAwesome v5.1 - FontAwsome is now integrated using its npm package
- Fixed bug with JS libraries missing in Windows Dev envs
- Enabled autofocus in the Contact view when the user is logged in
- Fixed Home always being active (@dkimot)
- Modified Lob example to address recent API changes
- Updated Twilio API (@garretthogan)
- Fixed Twitter API (@garretthogan)
- Dependency updates

### 5.1.0 (May 9, 2018)
- Bootstrap 4.1 upgrade (breaking change)
- Addition of popper.js
- jQuery and Bootstrap will be pulled in the project using their npm packages
- Dockerfile will use development instead of production
- Security improvement by removing X-Powered-By header
- Express errorhandler will only be used in development to match its documentation
- Removed deprecated Instagram popular images API call from the Instagram example (@nacimgoura)
- Removed `mongoose global.Promise` as it is no longer needed (@nacimgoura)
- Refactoring of GitHub, last.fm api, twitter examples and code improvements to use ES6/ES7 features (@nacimgoura)
- Add NodeJS 10 in travis.yml (@nacimgoura)
- Improvements to the Steam API example (@nacimgoura)
- Readme and documentation improvements (thanks in part to @nacimgoura)
- Dependency updates

### 5.0.0 (April 1, 2018)
- NodeJS 8.0+ is now required
- Removed dependency on Bluebird in favor of native NodeJS promisify support
- Font awesome 5 Upgrade
- Fix console warning about Foursquare API version
- Added environment configs to eslint configs and cleaned up code (Thanks to @nacimgoura)
- Fixed eslint rules to better match the project
- Fixed Instagram API example view (@nacimgoura)
- Adding additional code editor related files to .gitignore (@nacimgoura)
- Upgraded syntax at various places to use ES6 syntax (Thanks to @nacimgoura)
- Re-added travis-ci.yml (Thanks to @nacimgoura)
- Fixed bug in Steam API when the user had no achievements (Thanks to @nacimgoura)
- Readme and documentation improvements
- Dependency updates

### 4.4.0 (March 23, 2018)
- Added Docker support (Thanks to @gregorysobotka, @praveenweb, @ryanhanwu).  The initial integration has also been upgraded to use NodeJS 8 and Mongo 3.6.
- Removed dependency on async in favor of using promises (@fmcarvalho). Note that the promise support will be upgraded in the upcoming releases to remove the use of Bluebird.
- The contact form will no longer ask for the user's name and email address if they have logged-in already
- Adding a confirmation prompt when a user asks for their account to be deleted
- Fixed Steam Oauth and API integration
- Fixed Last.fm API example (@JonLim)
- Fixed Google Map integration example (@whmsysu)
- Fixed Twitter API integration (@shahzeb1)
- Fixed Facebook integration/request scope (@RobTS)
- Removed MONGOLAB_URI env var, use MONGODB_URI instead
- Preserve the query parameters during authentication session returns (@shreedharshetty)
- normalizeEmail options key remove_dots changed to gmail_remove_dots (@amakhnev)
- Fixed Heroku re-deploy issue (@gballet)
- Migrated from Jade to Pug
- Migrated from GitHub npm package to @octokit/rest to address the related deprecation warning. See https://git.io/vNB11
- Dependency update and upgrades
- Updated left over port 3000 to the current default of port of 8080
- Removed bitgo.pug since bitgo has not been supported by hackathon-starter since v4.1.0
- Removed bitgo from api/index view (@JonLim)
- Fixed unsecure external content by switching them to https
- New address for the Live Demo site
- Code formatting, text prompt, and Readme improvements

### 4.3.0 (November 6, 2016)
- [Added new theme](http://demos.creative-tim.com/get-shit-done/index.html) by Creative Tim (Thanks @conacelelena)
- Added ESLint configuration to *package.json*
- Added *yarn.lock* (Thanks @niallobrien)
- Added **express-status-monitor** (to see it in action: `/status`)
- Added missing error handling checks (Thanks @dskrepps)
- Server address during the app startup is now clickable (⌘ + LMB) (Thanks @niallobrien)
- Fixed redirect issue in the account page (Thanks @YasharF)
- Fixed `Mongoose.promise` issue (Thanks @starcharles)
- Removed "My Friends" from Facebook API example due to Graph API changes
- Removed iOS7 theme
- `User` model unit tests improvements (Thanks @andela-rekemezie)
- Switched from **github-api** to the more popular **github** NPM module
- Updated Yarn and NPM dependencies

### 4.2.1 (September 6, 2016)
- User model minor code refactoring
- Fixed gravatar display issue on the profile page
- Pretty terminal logs for database connection and app server
- Added compiled *main.css* to *.gitignore*

### 4.2.0 (August 21, 2016)
- Converted templates from jade to pug (See [Rename from "Jade"](https://github.com/pugjs/pug#rename-from-jade))

### 4.1.1 (August 20, 2016)
- Updated dependencies

### 4.1.0 (July 23, 2016)
- Improved redirect logic after login [#435](https://github.com/sahat/hackathon-starter/pull/435)
- Removed Venmo API (see [Venmo Halts New Developer Access To Its API](https://techcrunch.com/2016/02/26/how-not-to-run-a-platform/))
- Removed BitGo API due to issues with `secp256k1` dependency on Windows

### 4.0.1 (May 17, 2016)
- Renamed `MONGODB` to `MONGODB_URI` environment variable
- Set engine `"node": "6.1.0"` in *package.json*

### 4.0.0 (May 13, 2016)
- **ECMAScript 2015 support!** (Make sure you are using Node.js 6.0+)
 - Thanks  @vanshady and @prashcr
- Added `<meta theme-color>` support for *Chrome for Android*
- Added Yahoo Finance API example
- Updated Aviary API example
- Flash an error message when updating email to that which is already taken
- Removing an email address during profile update is no longer possible
- PayPal API example now uses *return_url* and *cancel_url* from `.env`
- Added client-side `required=true` attributes to input fields 
- Fixed broken `show()` function in the GitHub API example
- Fixed YQL query in the Yahoo Weather API example
- Fixed *Can't set headers after they are sent* error in Stripe API example
- Code refactoring and cleanup
- Updated Travis-CI Node.js version
- Updated NPM dependencies
- Removed Mandrill references

### 3.5.0 (March 4, 2016)
- Added file upload example
- Added Pinterest API example
- Added timestamp support to the User schema
- Fixed `next` parameter being *undefined* inside `getReset` handler
- Refactored querysting param usage in *api.js* controller
- Removed *setup.js* (generator) due to its limited functionality and a lack of updates

### 3.4.1 (February 6, 2016)
- Added "Obtaining Twilio API Keys" instructions.
- Updated Bootstrap v3.3.6.
- Updated jQuery v2.2.0.
- Updated Font Awesome v4.5.0.
- Removed `debug` and `outputStyle` from the Sass middleware options.
- Removed `connect-assets` (no longer used) from *package.json*`.
- Fixed Font Awesome icon syntax error in *profile.jade*.
- Fixed Cheerio broken link.

### 3.4.0 (January 5, 2016)
- Use `dontenv` package for managing API keys and secrets.
- Removed *secrets.js* (replaced by *.env.example*).
- Added .env to .gitignore.
- Fixed broken Aviary API image.

### 3.3.1 (December 25, 2015)
- Use `connect-mongo` ES5 fallback for backward-compatibility with Node.js version `< 4.0`.

### 3.3.0 (December 19, 2015)
- Steam authorization via OpenID.
- Code style update. (No longer use "one-liners" without braces)
- Updated LinkedIn scope from `r_fullprofile` to `r_basicprofile` due to API changes.
- Added LICENSE file.
- Removed [Bitcore](https://bitcore.io/) example due to installation issues on Windows 10.


### 3.2.0 (October 19, 2015)
- Added Google Analytics script.
- Split *api.js* `require` intro declaration and initialization for better performance. (See <a href="https://github.com/sahat/hackathon-starter/issues/247">#247</a>)
- Removed [ionicons](http://ionicons.com).
- Removed [connect-assets](https://github.com/adunkman/connect-assets). (Replaced by [node-sass-middleware](https://github.com/sass/node-sass-middleware))
- Fixed alignment styling on /login, /profile and /account
- Fixed Stripe API `POST` request.
- Converted LESS to Sass stylesheets.
- Set `node_js` version to "stable" in *.travis.yml*.
- Removed `mocha.opts` file, pass options directly to package.json
- README cleanup and fixes.
- Updated Font Awesome to 4.4.0

### 3.1.0 (August 25, 2015)
- Added Bitcore example.
- Added Bitgo example.
- Lots of README fixes.
- Fixed Google OAuth profile image url.
- Fixed a bug where `connect-assets` served all JS assets twice.
- Fixed missing `csrf` token in the Twilio API example form.
- Removed `multer` middleware.
- Removed Ordrx API. (Shutdown)

### 3.0.3 (May 14, 2015)
- Added favicon.
- Fixed an email issue with Google login.

### 3.0.2 (March 31, 2015)
- Renamed `navbar.jade` to `header.jade`.
- Fixed typos in README. Thanks @josephahn and @rstormsf.
- Fix radio button alignment on small screens in Profile page.
- Increased `bcrypt.genSalt()` from **5** to **10**.
- Updated package dependencies.
- Updated Font Awesome `4.3.0`.
- Updated Bootstrap `3.3.4`.
- Removed Ionicons.
- Removed unused `User` variable in *controllers/api.js*.
- Removed Nodejitsu instructions from README.

### 3.0.1 (February 23, 2015)
- Reverted Sass to LESS stylesheets. See <a href="https://github.com/sahat/hackathon-starter/issues/233">#233</a>.
- Convert email to lower case in Passport's LocalStrategy during login.
- New Lob API.
- Updated Font Awesome to 4.3.0
- Updated Bootstrap and Flatly theme to 3.3.2.

### 3.0.0 (January 11, 2015)
- New Ordr.in API example.
- Brought back PayPal API example.
- Added `xframe` and xssProtection` protection via **lusca** module.
- No more CSRF route whitelisting, either enable or dsiable it globally.
- Simplified "remember original destination" middleware.
 - Instead of excluding certain routes, you now have to "opt-in" for the routes you wish to remember for a redirect after successful authentication.
- Converted LESS to Sass.
- Updated Bootstrap to 3.3.1 and Font Awesome to 4.2.0.
- Updated jQuery to 2.1.3 and Bootstrap to 3.3.1 JS files.
- Updated Ionicons to 2.0.
- Faster travis-ci builds using `sudo: false`.
- Fixed YUI url on Yahoo API example.
- Fixed `mongo-connect` deprecation warning.
- Code cleanup throughout the project.
- Updated `secrets.js` notice.
- Simplified the generator (`setup.js`), no longer removes auth providers.
- Added `git remote rm origin` to Getting Started instructions in README.

### 2.4.0 (November 8, 2014)
- Bootstrap 3.3.0.
- Flatly 3.3.0 theme.
- User model cleanup.
- Removed `helperContext` from connect-assets middleware.

### 2.3.4 (October 27, 2014)
- Font Awesome 4.2.0 [01e7bd5c09926911ca856fe4990e6067d9148694](https://github.com/sahat/hackathon-starter/commit/01e7bd5c09926911ca856fe4990e6067d9148694)
- Code cleanup in `app.js` and `controllers/api.js`. [8ce48f767c0146062296685cc101acf3d5d224d9](https://github.com/sahat/hackathon-starter/commit/8ce48f767c0146062296685cc101acf3d5d224d9) [cdbb9d1888a96bbba92d4d14deec99a8acba2618](https://github.com/sahat/hackathon-starter/commit/cdbb9d1888a96bbba92d4d14deec99a8acba2618)
- Updated Stripe API example. [afef373cd57b6a44bf856eb093e8f2801fc2dbe2](https://github.com/sahat/hackathon-starter/commit/afef373cd57b6a44bf856eb093e8f2801fc2dbe2)
- Added 1-step deployment process with Heroku and mLab add-on. [c5def7b7b3b98462e9a2e7896dc11aaec1a48b3f](https://github.com/sahat/hackathon-starter/commit/c5def7b7b3b98462e9a2e7896dc11aaec1a48b3f)
- Updated Twitter apps dashboard url. [e378fbbc24e269de69494d326bc20fcb641c0697](https://github.com/sahat/hackathon-starter/commit/e378fbbc24e269de69494d326bc20fcb641c0697)
- Fixed dead links in the README. [78fac5489c596e8bcef0ab11a96e654335573bb4](https://github.com/sahat/hackathon-starter/commit/78fac5489c596e8bcef0ab11a96e654335573bb4)

### 2.3.3 (September 1, 2014)
- Use *https* (instead of http) profile image URL with Twitter authentication

### 2.3.2 (July 28, 2014)
- Fixed an issue with connect-assets when running `app.js` from an outside folder
- Temporarily disabled `setup.js` on Windows platform until [blessed](https://github.com/chjj/blessed) fixes its problems

### 2.3.1 (July 15, 2014)
- Migrated to Nodemailer 1.0

### 2.3 (July 2, 2014)
- Bootstrap 3.2
- New default theme
- Ionicons fonts
- Fixed bodyParser deprecation warning
- Minor visual updates
- CSS cleanup via RECESS
- Replaced `navbar-brand` image with a font icon

### 2.2.1 (June 17, 2014)
- Added IBM Codename: BlueMix deployment instructions

### 2.2 (June 6, 2014)
- Use Lodash instead of Underscore.js
- Replaced all occurrences of `_.findWhere` with `_.find`
- Added a flash message when user deletes an account
- Updated and clarified some comments
- Updated the Remove Auth message in `setup.js`
- Cleaned up `styles.less`
- Redesigned API Examples page
- Updated Last.fm API example
- Updated Steam API example
- Updated Instagram API example
- Updated Facebook API example
- Updated jQuery to 2.1.1
- Fixed a bug that didn't remove Instagram Auth properly
- Fixed Foursquare secret token

### 2.1.4 (June 5, 2014)
- Fixed a bug related to `returnTo` url (#155)

### 2.1.3 (June 3, 2014)
- Font Awesome 4.1
- Updated icons on some API examples
- Use LESS files for *bootstrap-social* and *font-awesome*

### 2.1.2 (June 2, 2014)
- Improved Twilio API example
- Updated dependencies

### 2.1.1 (May 29, 2014)
- Added **Compose new Tweet** to Twitter API example
- Fixed email service indentation
- Fixed Mailgun and Mandrill secret.js properties
- Renamed `navigation.jade` to `navbar.jade`

### 2.1 (May 13, 2014)
- New and improved generator - **setup.js**
- Added Yahoo API
- CSS and templates cleanup
- Minor improvement to the default theme
- `cluster_app.js` has been moved into **setup.js**

### 2.0.4 (April 26, 2014)
- Added Mandrill e-mail service (via generator)

### 2.0.3 (April 25, 2014)
- LinkedIn API: Fixed an error if a user did not specify education on LinkedIn
- Removed email constraint when linking OAuth accounts in order to be able to merge accounts that use the same email address
- Check if email address is already taken when creating a new local account
 - Previously relied on Validation Error 11000, which doesn't always work
- When creating a local account, checks if e-mail address is already taken
- Flash notifications can now be dismissed by clicking on �?

### 2.0.2 (April 22, 2014)
- Added Instagram Authentication
- Added Instagram API example
- Updated Instagram Strategy to use a "fake" email address similar to Twitter Startegy

### 2.0.1 (April 18, 2014)
- Conditional CSRF support using [lusca](https://github.com/krakenjs/lusca)
- Fixed EOL problem in `generator.js` for Windows users
- Fixed outdated csrf token string on profile.jade
- Code cleanup

### 2.0.0 (April 15, 2014)
There are have been over **500+** commits since the initial announcement in
January 2014 and over a **120** issues and pull requests from **28** contributors.

- Documentation grew **8x** in size since the announcement on Hacker News
- Upgraded to Express 4.0
- Generator for adding/removing authentication providers
- New Instagram authentication that can be added via generator
- Forgot password and password reset for Local authentication
- Added LinkedIn authentication and API example
- Added Stripe API example
- Added Venmo API example
- Added Clockwork SMS example
- Nicer Facebook API example
- Pre-populated secrets.js with API keys (not linked to my personal accounts)
- Grid layout with company logos on API Examples page
- Added tests (Mocha, Chai, Supertest)
- Gravatar pictures in Navbar and Profile page
- Tracks last visited URL before signing in to redirect back to original destination
- CSRF protection
- Gzip compression and static assets caching
- Client-side JavaScript is automatically minified+concatenated in production
- Navbar, flash messages, footer refactored into partial templates
- Support for Node.js clusters
- Support for Mailgun email service
- Support for environment variables in secrets.js
- Switched from less-middleware to connect-assets
- Bug fixes related to multi-authentication login and account linking
- Other small fixes and changes that are too many to list
