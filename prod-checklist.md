If you are done with your hackathon and thinking about launching your project into production, or if you are just using this boilerplate to start your soon to be in production  application, this document is a checklist to help you get your application production ready.

- Update the To/From email address for the Contact Form and the Lost Password controller codes
- Remove Unused code and configs
- Add a proxy such as Cloudflare in front of your production deployment
- Add Terms of Service and Privacy Policy
- Update ```License.md``` and the relevant license field in package.json if applicable - See [npm's doc](https://docs.npmjs.com/files/package.json#license).
- Add [sitemap.xml](https://en.wikipedia.org/wiki/Sitemaps) and [robots.txt](https://moz.com/learn/seo/robotstxt)
- Update Google Analytics ID
- Add Facebook App/Pixel ID
- Add Winston Logging, and replace console.log statements with Winston; have a process for monitoring errors to identify bugs or other issues after launch.
- SEO and Social Media Improvements
- Create a deployment pipeline with a pre-prod/integration test stage.
- (optional) Add email verification *Some experimental data has shown that bogus email addresses are not a significant problem in many cases*
- (optional) Add a filter for [disposable-email-domains](https://www.npmjs.com/package/disposable-email-domains).  *Some experimental data has shown that use of disposable emails is typically rare, and in many cases it might not be worth to add this filter.*
 

### Remove unused code and configs
The following is a list of various codes that you may not potential be using and you could remove depending on your application:
- Unused keys from .env file
- /controllers/api.js entirely
- /views/api entirely
- app.js:
  - chalk usage
  - express-status-monitor
  - multer
  - apiController
  - Openshift env references
  - csrf check exception for /api/upload
  - All API example routes
  - OAuth routes for Instagram, Github, LinkedIn (kept Facebook, Twitter, and Google)
  - All OAuth authorization routes
- passport.js all references and functions related to:
  - Instagram, Github, LinkedIn, OpenID, OAuth, OAuth2
- model/User.js
  - key pairs for Github, Instagram, LinkedIn, Steam
- package.json
  - @octokit/rest, chalk, express-status-monitor, instagram-node, lastfm, lob, multer, node-foursquare, node-linkedin, passport-github, passport-instagram, passport-linkedin-oauth2, passport-oauth, passport-openid, paypal-rest-sdk, stripe, tumbler.js, twilio
- /test/app.js
  - /api test case
- views/account/login.pug
  - Some or all of the last form-group set which are the social login choices
- views/account/profile.pug
  - Link/unlink buttons for Instagram, Github, LinkedIn, steam
- Removed readme, changelog, this guide, docker related files if not using them
- Create a domain whitelist for your app in Here's developer portal if you are using the Here's map API.

### Search Engine Optimization (SEO)
Note that SEO only applies to the pages that will be publicly visible with no authentication.  Note that some of the following fields need to be added to the HTML header section similar to the page [title](https://github.com/sahat/hackathon-starter/blob/master/views/layout.pug#L9)
- Add Open Graph fields for SEO
  Open Graph data:
  ```
  <meta property="og:title" content="Title">
  <meta property="og:type" content="website">
  <meta property="og:url" content="http://www.example.com/article.html">
  <meta property="og:image" content="http://www.example.com/image.png">
  ```
- Add a page description, which will show up in the search results of the search engine.
```
  <meta name="Description" content="Description about the page.">
```

- Add the Google Plus page as the publisher of the website.
  ```
  <link rel=”publisher” href=”https://plus.google.com/+your_business_google_plus_id”>
  ```
