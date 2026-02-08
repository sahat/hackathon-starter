![](https://lh4.googleusercontent.com/-PVw-ZUM9vV8/UuWeH51os0I/AAAAAAAAD6M/0Ikg7viJftQ/w1286-h566-no/hackathon-starter-logo.jpg)
Hackathon Starter
=======================

**Live Demo**: [Link](https://hackathon-starter-1.ydftech.com)

Jump to [What's new?](https://github.com/sahat/hackathon-starter/blob/master/CHANGELOG.md)

A boilerplate for **Node.js** web applications.

If you have attended any hackathons in the past, then you know how much time it takes to get a project started: decide on what to build, pick a programming language, pick a web framework, pick a CSS framework. A while later, you might have an initial project up on GitHub, and only then can other team members start contributing. Or how about doing something as simple as _Sign in with Facebook_ authentication? You can spend hours on it if you are not familiar with how OAuth 2.0 works.

When I started this project, my primary focus was on **simplicity** and **ease of use**.
I also tried to make it as **generic** and **reusable** as possible to cover most use cases of hackathon web apps, without being too specific. In the worst case, you can use this as a learning guide for your projects, if for example you are only interested in **Sign in with Google** authentication and nothing else.

### Testimonials

> [**"Nice! That README alone is already gold!"**](https://www.producthunt.com/tech/hackathon-starter#comment-224732)<br>
> — Adrian Le Bas

> [**"Awesome. Simply awesome."**](https://www.producthunt.com/tech/hackathon-starter#comment-224966)<br>
> — Steven Rueter

> [**"I'm using it for a year now and many projects, it's an awesome boilerplate and the project is well maintained!"**](https://www.producthunt.com/tech/hackathon-starter#comment-228610)<br>
> — Kevin Granger

> **"Small world with Sahat's project. We were using his hackathon starter for our hackathon this past weekend and got some prizes. Really handy repo!"**<br>
> — Interview candidate for one of the companies I used to work with.

<h4 align="center">Modern Theme</h4>

![](https://lh6.googleusercontent.com/-KQTmCFNK6MM/U7OZpznjDuI/AAAAAAAAERc/h3jR27Uy1lE/w1366-h1006-no/Screenshot+2014-07-02+01.32.22.png)

<h4 align="center">Flatly Bootstrap Theme</h4>

![](https://lh5.googleusercontent.com/-oJ-7bSYisRY/U1a-WhK_LoI/AAAAAAAAECM/a04fVYgefzw/w1474-h1098-no/Screen+Shot+2014-04-22+at+3.08.33+PM.png)

<h4 align="center">API Examples</h4>

![](https://lh5.googleusercontent.com/-BJD2wK8CvC8/VLodBsyL-NI/AAAAAAAAEx0/SafE6o_qq_I/w1818-h1186-no/Screenshot%2B2015-01-17%2B00.25.49.png)

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [HTTPS Proxy](#https-proxy)
- [Obtaining API Keys](#obtaining-api-keys)
- [Web Analytics](#web-analytics)
- [Open Graph](#open-graph)
- [Project Structure](#project-structure)
- [List of Packages](#list-of-packages)
- [Useful Tools and Resources](#useful-tools-and-resources)
- [Recommended Design Resources](#recommended-design-resources)
- [Recommended Node.js Libraries](#recommended-nodejs-libraries)
- [Recommended Client-side Libraries](#recommended-client-side-libraries)
- [Using AI Assistants](#using-ai-assistants)
- [FAQ](#faq)
- [How It Works](#how-it-works-mini-guides)
- [Cheatsheets](#cheatsheets)
  - [ES6](#-es6-cheatsheet)
  - [JavaScript Date](#-javascript-date-cheatsheet)
  - [Mongoose Cheatsheet](#mongoose-cheatsheet)
- [Deployment](#deployment)
- [Production](#production)
- [Changelog](#changelog)
- [Contributing](#contributing)
- [License](#license)

## Features

- Login
  - **Local Authentication** Sign in with Email and Password, Passwordless, Passkey / Biometrics
  - **OAuth 2.0 Authentication:** Sign in with Google, Microsoft, Facebook, LinkedIn, X (Twitter), Twitch, GitHub, Discord
- **User Profile and Account Management**
  - Gravatar
  - Profile Details
  - Password management (Change, Reset, Forgot)
  - Verify Email
  - **Two-Factor Authentication (2FA)** Email codes and Authenticator apps
  - Link multiple OAuth provider accounts to one account
  - OAuth token revocation
  - Delete Account
- Contact Form (powered by SMTP via Mailgun, AWS SES, etc.)
- File upload
- Device camera
- **AI Examples and Boilerplates**
  - AI Agent ReAct (Reasoning + Acting) with tool calling, MongoDB session persistence, and input guardrails
  - RAG with semantic and embedding caching
  - Llama 3.3, Llama 4 Scout (vision use case)
  - OpenAI Moderation
  - Support for a range of foundational and embedding models (DeepSeek, Llama, Mistral, Sentence Transformers, etc.) via LangChain, Groq, and Hugging Face
- **API Examples**
  - **Backoffice:** Lob (USPS Mail), Paypal, Quickbooks, Stripe, Twilio (text messaging)
  - **Data, Media & Entertainment:** Alpha Vantage (stocks and finance info) with ChartJS, Github, Foursquare, Last.fm, New York Times, PubChem (chemical information), Trakt.tv (movies/TV), Twitch, Tumblr (OAuth 1.0a example), Steam (OpenID), Web Scraping, GIPHY
  - **Maps and Location:** Google Maps, HERE Maps
  - **Productivity:** Google Drive, Google Sheets

- Flash notifications
- reCAPTCHA and rate limit protection
- CSRF protection
- MVC Project Structure
- Node.js clusters support
- HTTPS Proxy support (via ngrok, Cloudflare, etc.)
- Sass stylesheets
- Bootstrap 5
- "Go to production" checklist

## Prerequisites

- MongoDB (local install OR hosted)
  - Local Install: [MongoDB](https://www.mongodb.com/download-center/community)
  - Hosted: No need to install, see the MongoDB Atlas section

- [Node.js LTS 24](http://nodejs.org)
  - Highly recommended: Use/Upgrade your Node.js to the latest Node.js LTS version.
- Command Line Tools
- <img src="https://upload.wikimedia.org/wikipedia/commons/1/1b/Apple_logo_grey.svg" height="17">&nbsp;**Mac OS X:** [Xcode](https://itunes.apple.com/us/app/xcode/id497799835?mt=12) (or **OS X 10.9+**: `xcode-select --install`)
- <img src="https://upload.wikimedia.org/wikipedia/commons/8/87/Windows_logo_-_2021.svg" height="17">&nbsp;**Windows:** [Visual Studio Code](https://code.visualstudio.com) + [Windows Subsystem for Linux - Ubuntu](https://learn.microsoft.com/en-us/windows/wsl/install) OR [Visual Studio](https://www.visualstudio.com/products/visual-studio-community-vs)
- <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/UbuntuCoF.svg/512px-UbuntuCoF.svg.png?20120210072525" height="17">&nbsp;**Ubuntu** / <img src="https://upload.wikimedia.org/wikipedia/commons/3/3f/Linux_Mint_logo_without_wordmark.svg" height="17">&nbsp;**Linux Mint:** `sudo apt-get install build-essential`
- <img src="https://upload.wikimedia.org/wikipedia/commons/3/3f/Fedora_logo.svg" height="17">&nbsp;**Fedora**: `sudo dnf groupinstall "Development Tools"`
- <img src="https://en.opensuse.org/images/b/be/Logo-geeko_head.png" height="17">&nbsp;**OpenSUSE:** `sudo zypper install --type pattern devel_basis`

**Note:** If you are new to Node or Express, you may find [Node.js & Express From Scratch series](https://www.youtube.com/watch?v=Ad2ngx6CT0M&list=PLillGF-RfqbYRpji8t4SxUkMxfowG4Kqp&index=3) helpful for learning the basics of Node and Express. Alternatively, here is another great tutorial for complete beginners - [Getting Started With Node.js, Express, MongoDB](https://www.freecodecamp.org/news/build-a-restful-api-using-node-express-and-mongodb/).

## Getting Started

**Step 1:** The easiest way to get started is to clone the repository:

```bash
# Get the latest snapshot
git clone https://github.com/sahat/hackathon-starter.git myproject

# Change directory
cd myproject

# Install NPM dependencies
npm install

# Then simply start your app
npm start
```

**Note:** I highly recommend installing [Nodemon](https://github.com/remy/nodemon). It watches for any changes in your node.js app and automatically restarts the server. Once installed, instead of `node app.js` use `nodemon app.js`. It will
save you a lot of time in the long run, because you won't need to manually restart the server each time you make a small change in code. To install, run `sudo npm install -g nodemon`.

**Step 2:** Obtain API Keys and change configs if needed
After completing step 1 and locally installing MongoDB, you should be able to access the application through a web browser and use local user accounts. However, certain functions like API integrations may not function correctly until you obtain specific keys from service providers. The keys provided in the project serve as placeholders, and you can retain them for features you are not currently utilizing. To incorporate the acquired keys into the application, you have two options:

1.  Set environment variables in your console session: Alternatively, you can set the keys as environment variables directly through the command prompt. For instance, in bash, you can use the `export` command like this: `export FACEBOOK_SECRET=xxxxxx`. This method is considered a better practice as it reduces the risk of accidentally including your secrets in a code repository.
2.  Replace the keys in the `.env.example` file: Open the `.env.example` file and update the placeholder keys with the newly acquired ones. This method has the risk of accidental checking-in of your secrets to code repos.

_What to get and configure:_

- SMTP
  - For user workflows for reset password and verify email
  - For contact form processing
- reCAPTCHA
  - For contact form submission, but you can skip it during your development
- OAuth for social logins (Sign in with / Login with)
  - Depending on your application need, obtain keys from Google, Facebook, X (Twitter), LinkedIn, Twitch, GitHub. You don't have to obtain valid keys for any provider that you don't need. Just remove the buttons and links in the login and account pug views before your demo.
- API keys for service providers that you need in the API Examples if you are planning to use them.

- MongoDB Atlas
  - If you are using MongoDB Atlas instead of a local db, set the MONGODB_URI to your db URI (including your db user/password).

- Email address
  - Set SITE_CONTACT_EMAIL as your incoming email address for messages sent to you through the contact form.
  - Set TRANSACTION_EMAIL as the "From" address for emails sent to users through the lost password or email verification emails to users. You may set this to the same address as SITE_CONTACT_EMAIL.

**Step 3:** Setup an HTTPS proxy to access the app with an https address:
See

- [HTTPS Proxy](#https-proxy)

**Step 4:** Develop your application and customize the experience

- Check out [How It Works](#how-it-works-mini-guides)

**Step 5:** Optional - deploy to production
See:

- [Deployment](#deployment)
- [prod-checklist.md](https://github.com/sahat/hackathon-starter/blob/master/prod-checklist.md)

## HTTPS Proxy:

If you want to use an API that requires HTTPS (for example, GitHub or Facebook), you need to run the app with an HTTPS URL. You can do this by setting up an HTTPS proxy using either ngrok or Cloudflare.
Note: When using an HTTPS proxy, you may get a CSRF mismatch error if you try to directly access the app at `http://localhost:8080` instead of the HTTPS proxy address.

### ngrok

- Download [ngrok](https://ngrok.com/download).
- Start ngrok.
- Set your BASE_URL to the forwarding address from ngrok (i.e., `https://3ccb-1234-abcd.ngrok-free.app`). This will be the HTTPS address for accessing the app.

### Cloudflare

- Download and install [cloudflared](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads).
- For a quick, free tunnel with a random subdomain under `trycloudflare.com`, execute:

```
cloudflared tunnel --url http://localhost:8080
```

- Set BASE_URL to the HTTPS address for the tunnel.

#### Cloudflare with your own domain name

If you own a domain managed by Cloudflare, you can use Cloudflare's Zero Trust portal to set up a tunnel to your app that is activated by a system service. Alternatively, you can create a tunnel and route a subdomain you like to your app using their CLI:

```
cloudflared tunnel login
cloudflared tunnel create myapptunnel
cloudflared tunnel route dns myapptunnel myappsubdomain.mydomain.com
cloudflared tunnel --url http://localhost:8080 run myapptunnel
```

Then set BASE_URL to the HTTPS address for the tunnel.
Note that the tunnel and DNS route are a one-time setup. To reactivate the HTTPS tunnel to your app later, such as after a system restart, just rerun:

```
cloudflared tunnel --url http://localhost:8080 run myapptunnel
```

To clean up your own domain's related configurations when you're done:

- Delete the tunnel by executing `cloudflared tunnel delete myapptunnel`
- Remove the `myappsubdomain` DNS entry from your domain through the Cloudflare web UI.
- Remove `%USERPROFILE%\.cloudflared` (Windows) or `~/.cloudflared` (Linux/macOS) if you want to clear local credentials.

# Obtaining API Keys

You will need to obtain appropriate credentials (Client ID, Client Secret, API Key, or Username & Password) for API and service providers which you need. See Step 2 in the Getting started section for more info.

## SMTP

Obtain SMTP credentials from a provider for transactional emails. Set the SMTP_USER, SMTP_PASSWORD, and SMTP_HOST environment variables accordingly. When picking the SMTP host, keep in mind that the app is configured to use secure SMTP transmissions over port 465 out of the box. You have the flexibility to select any provider that suits your needs or take advantage of one of the following providers, each offering a free tier for your convenience.

| Provider | Free Tier                  | Website                 |
| -------- | -------------------------- | ----------------------- |
| SMTP2Go  | 1000 emails/month for free | https://www.smtp2go.com |
| Brevo    | 300 emails/day for free    | https://www.brevo.com   |

<hr>

<img src="https://i.imgur.com/jULUCKF.png" height="75">

- Visit <a href="https://developers.facebook.com/" target="_blank">Facebook Developers</a>
- Click **My Apps**, then select \*_Add a New App_ from the dropdown menu
- Enter a new name for your app
- Click on the **Create App ID** button
- Find the Facebook Login Product and click on **Facebook Login**
- Instead of going through their Quickstart, click on **Settings** for your app in the top left corner
- Copy and paste _App ID_ and _App Secret_ keys into `.env`
- **Note:** _App ID_ is **FACEBOOK_ID**, _App Secret_ is **FACEBOOK_SECRET** in `.env`
- Enter `localhost` under _App Domains_
- Choose a **Category** that best describes your app
- Click on **+ Add Platform** and select **Website**
- Enter your BASE*URL value (i.e. `http://localhost:8080`, etc) under \_Site URL*
- Click on the _Settings_ tab in the left nav under Facebook Login
- Enter your BASE_URL value followed by /auth/facebook/callback (i.e. `http://localhost:8080/auth/facebook/callback` ) under Valid OAuth redirect URIs

**Note:** After a successful sign-in with Facebook, a user will be redirected back to the home page with appended hash `#_=_` in the URL. It is _not_ a bug. See this [Stack Overflow](https://stackoverflow.com/questions/7131909/facebook-callback-appends-to-return-url) discussion for ways to handle it.

<hr>

<img src="https://imgur.com/2P4UMvC.png" height="75">

- Go to <a href="https://foursquare.com/developers" target="_blank">Foursquare for Developers</a> and log in

- Click on **Create a new project** button
- Enter your _Organization_ and _Project Name_
- Click **Create**
- Navigate to your project
- Click **Settings** in the left-hand-side menu
- Generate a Service API Key
- Copy and paste the Service API Key as `FOURSQUARE_APIKEY` in your `.env` file

<hr>

<img src="https://i.imgur.com/oUob1wG.png" height="75">

- Go to <a href="https://github.com/settings/profile" target="_blank">Account Settings</a>
- Select **Developer settings** from the sidebar
- Then click on **OAuth Apps** and then on **Register new application**
- Enter _Application Name_ and _Homepage URL_. Enter your BASE_URL value (i.e. `http://localhost:8080`, etc) as the homepage URL.
- For _Authorization Callback URL_: your BASE_URL value followed by /auth/github/callback (i.e. `http://localhost:8080/auth/github/callback` )
- Click **Register application**
- Now copy and paste _Client ID_ and _Client Secret_ keys into `.env` file

<hr>

<img src="https://i.imgur.com/ddl2VjR.png" height="75">

- Go to <a href="https://developers.giphy.com/" target="_blank">GIPHY Developers website</a>
- Login or create a new account and login.
- Select **Dashboard** from the navigation bar
- Then click on **Create an API Key** and then select **API** and click on **Next Step**.
- Enter _App Name_ and _App Description_. Select **Web** and create a beta key.
- Now copy and paste the API key into `.env` file as GIPHY_API_KEY.

<hr>

<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1000px-Google_2015_logo.svg.png" height="50">

- Visit <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a>
- Click on the **Create Project** button
- Enter _Project Name_, then click **Create**
- Copy the Project ID for your project and add it as GOOGLE_PROJECT_ID in your `.env` file.
- Then add the APIs and services that apply to your application. If the UI doesn't let you add them during project creation, you can add them later via the **APIs & Services** page (left sidebar) or by searching for them in the top search bar.

**Sign in with Google:**

- Go to the **Credentials** tab, click **Create credentials**, and choose **OAuth client ID**.
- Select **Web application**, and for **Authorized redirect URI** use your BASE_URL value followed by `/auth/google/callback` (for example `http://localhost:8080/auth/google/callback`).
- Copy and paste the **Client ID** and **Client secret** into your `.env` file.
- Update the OAuth consent screen if needed.

**Other APIs:**

Open the **Enabled APIs & services** page for your project in the Google Cloud Console (APIs & Services). Click **+ Enable APIs and services** (top of the page), find the services you need, and enable them:

- **reCAPTCHA Enterprise API** (recommended for the contact form)
- **Google Drive API**
- **Google Sheets API**
- **Maps JavaScript API**

Next, create API keys for the services you enabled:

- For backend API calls (Google Drive and Sheets), create a single API key and restrict it to those APIs. Copy the key as `GOOGLE_API_KEY` into your `.env` file.
- For reCAPTCHA, follow the instructions at <a href="https://cloud.google.com/recaptcha/docs/create-key-website#create-recaptcha-key-Cloud%20console" target="_blank">Google Cloud reCAPTCHA Docs</a> and create a web checkbox reCAPTCHA key. No code changes are required. Just copy the reCAPTCHA site key into `.env` as `GOOGLE_RECAPTCHA_SITE_KEY`.
- For the Google Maps JavaScript API, use a separate API key from your backend key because the key is sent to the front end and can be exposed. Restrict this key to your website on the credentials page. Do NOT use "localhost" as the restriction since it is not unique to your application. Once configured, copy the API key as `GOOGLE_MAP_API_KEY` into your `.env` file.

<hr>

<img src="https://cdn.worldvectorlogo.com/logos/discord-6.svg" height="50">

- Go to <a href="https://discord.com/developers/teams" target="_blank">Teams tab</a> in the Discord Developer Portal and create a new team. This allows you to manage your Discord applications under a team name instead of your personal account.
- After creating a team, switch to the <a href="https://discord.com/developers/applications" target="_blank">Applications tab</a> in the Discord Developer Portal.
- Click on **New Application** and give your app a name. When prompted, select your team as the owner.
- In the left sidebar, click on **OAuth2** > **General**.
- Copy the **Client ID** and **Client Secret** (you may need to "reset" the client secret to obtain it for the first time), then paste them into your `.env` file as `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`, or set them as environment variables.
- In the left sidebar, click on **OAuth2** > **URL Generator**.
- Under **Scopes**, select `identify` and `email`.
- Under **Redirects**, add your BASE_URL value followed by `/auth/discord/callback` (i.e. `http://localhost:8080/auth/discord/callback`).
- Save changes.

<hr>

<img src="https://upload.wikimedia.org/wikipedia/commons/c/c7/HERE_logo.svg" height="75">

- Go to <a href="https://developer.here.com" target="_blank">https://developer.here.com</a>
- Sign up for the Base plan. The Base plan require a credit card to start, but you get 30,000 map renders for free each month.
- Create JAVASCRIPT/REST credentials. Copy and paste the API key into the `.env` file as HERE_API_KEY, or set it up as an environment variable.
- **Set up Trusted Domain** - Your credentials will go to the client-side (browser of the users). You need to enable trusted domains and add your test domain address. Otherwise, others may be able to use your credentials on other websites, go through your quota, and potentially leave you with a bill.

<hr>

<img src="https://i.imgur.com/OEVF7HK.png" height="75">

- Go to <a href="https://huggingface.co" target="_blank">https://huggingface.co</a> and create an account.
- Go to your Account Settings and create a new Access Token. Make sure you have granted the **"Make calls to Inference Provider"** permission to your token.
- Add your token as `HUGGINGFACE_KEY` to your `.env` file or as an environment variable.

<hr>

<img src="https://i.imgur.com/Lw5Jb7A.png" height="50">

- Go to <a href="https://developer.intuit.com/app/developer/qbo/docs/get-started" target="_blank">https://developer.intuit.com/app/developer/qbo/docs/get-started</a>
- Use the Sign Up option in the upper right corner of the screen (navbar) to get a free developer account and a sandbox company.
- Create a new app by going to your Dashboard using the My Apps option in the top nav bar or by going to <a href="https://developer.intuit.com/app/developer/myapps" target="_blank">https://developer.intuit.com/app/developer/myapps</a>
- In your App, under Development, Keys & OAuth (right nav), find the Client ID and Client Secret for your `.env` file

<hr>

<img src="https://content.linkedin.com/content/dam/me/business/en-us/amp/brand-site/v2/bg/LI-Logo.svg.original.svg" height="50">

- Sign in at <a href="https://developer.linkedin.com/" target="_blank">LinkedIn Developer Network</a>
- From the account name dropdown menu select **API Keys**
- _It may ask you to sign in once again_
- Click **+ Add New Application** button
- Fill out all the _required_ fields
- **OAuth 2.0 Redirect URLs**: your BASE_URL value followed by /auth/linkedin/callback (i.e. `http://localhost:8080/auth/linkedin/callback` )
- **JavaScript API Domains**: your BASE_URL value (i.e. `http://localhost:8080`, etc).
- For **Default Application Permissions** make sure at least the following is checked:
- `r_basicprofile`
- Finish by clicking **Add Application** button
- Copy and paste _API Key_ and _Secret Key_ keys into `.env` file
- _API Key_ is your **clientID**
- _Secret Key_ is your **clientSecret**

<hr>

<img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" height="50">

- Go to <a href="https://entra.microsoft.com/" target="_blank">Microsoft Entra admin center</a> and sign in
- Click **App registrations** > **+ New registration**
- Enter an application name (e.g., "Hackathon Starter App") and select **Accounts in any organizational directory and personal Microsoft accounts**
- Set **Redirect URI** to **Web** with your BASE_URL followed by `/auth/microsoft/callback` (e.g., `http://localhost:8080/auth/microsoft/callback`)
- Click **Register**, then copy the **Application (client) ID** to `.env` as `MICROSOFT_CLIENT_ID`
- Go to **Certificates & secrets** > **+ New client secret**, add a description and expiration, then click **Add**
- Copy the secret **Value** immediately to `.env` as `MICROSOFT_CLIENT_SECRET` (won't be visible again)

<hr>

<img src="https://s3-us-west-2.amazonaws.com/public.lob.com/dashboard/navbar/lob-logo.svg" height="50">

- Visit <a href="https://dashboard.lob.com/register" target="_blank">Lob Dashboard</a>
- Create an account
- Once logged into the dashboard, go to Settings in the bottom left corner of the page. (If there is a bottom pop-up, you may need to close it to see the Settings option.)
- Go to the API Keys tab and get your Secret API key for the Test Environment. No physical paper mail will be sent out if you use the Test key, but you can see the PDF of what would have been mailed from your app (with some limitations) through the dashboard. If you use the Live key, they will actually print a physical letter, put it in an envelope with postage, place it in a USPS mailbox, and bill you for it.

<hr>

<img src="https://i.imgur.com/iCsCgp6.png" height="75">

The OpenAI moderation API for checking harmful inputs is free to use as long as you have paid credits in your OpenAI developer account. The cost of using their other models depends on the model, as well as the input and output size of the API call.

- Visit <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI API Keys</a>
- Sign in or create an OpenAI account.
- Click on **Create new secret key** to generate an API key.
- Copy and paste the generated API key into your `.env` file as `OPENAI_API_KEY` or set it as an environment variable.

<hr>

<img src="https://imgur.com/VpWnjp1.png" height="75">

- Visit <a href="https://developer.paypal.com" target="_blank">PayPal Developer</a>
- Log in to your PayPal account
- Click **Applications > Create App** in the navigation bar
- Enter _Application Name_, then click **Create app**
- Copy and paste _Client ID_ and _Secret_ keys into `.env` file
- _App ID_ is **client_id**, _App Secret_ is **client_secret**
- Change **host** to api.paypal.com if you want to test against production and use the live credentials

<hr>

<img src="https://upload.wikimedia.org/wikipedia/commons/a/ae/Steam_logo.svg" height="75">

- Go to <a href="http://steamcommunity.com/dev/apikey" target="_blank">http://steamcommunity.com/dev/apikey</a>
- Sign in with your existing Steam account
- Enter your _Domain Name_ based on your BASE_URL, then and click **Register**
- Copy and paste _Key_ into `.env` file

<hr>

<img src="https://stripe.com/img/about/logos/logos/black@2x.png" height="75">

- <a href="https://stripe.com/" target="_blank">Sign up</a> or log into your <a href="https://manage.stripe.com" target="_blank">dashboard</a>
- Click on your profile and click on Account Settings
- Then click on **API Keys**
- Copy the **Secret Key**. and add this into `.env` file

<hr>

<img src="https://i.imgur.com/dSwblOk.png" height="50">

- Visit <a href="https://groq.com" target="_blank">Groq</a>
- Sign in or create a Groq account.
- Click on **Create API Key** to generate a new key. You will also be able to access your API key under your account settings in the API Keys tab.
- Copy and paste the generated API key into your `.env` file as `GROQ_API_KEY` or set it as an environment variable.

<hr>

<img src="https://i.imgur.com/Adtl9qg.png" height="75">

- Sign up or sign in to your trakt.tv account and go to <a href="https://trakt.tv/oauth/applications" target="_blank">Trakt.tv Applications</a>.
- Create a new application and fill in the required fields:
  - **Name**: Your app name.
  - **Redirect URI**: Set to your BASE_URL value followed by `/auth/trakt/callback` (i.e. `http://localhost:8080/auth/trakt/callback` or `ngrokURL/auth/trakt/callback`)
  - Leave the JavaScript origins blank as we won't be using client-side API calls.
- Click **Save App**.
- Copy and paste the **Client ID** and **Client Secret** into your `.env` file as `TRAKT_ID` and `TRAKT_SECRET` or set them as your environment variables.

<hr>

<img src="https://i.imgur.com/gUngyyW.png" height="50">

- Go to <a href="http://www.tumblr.com/oauth/apps" target="_blank">http://www.tumblr.com/oauth/apps</a>
- Once signed in, click **+Register application**
- Fill in all the details
- For **Default Callback URL**: your BASE_URL value followed by /auth/tumblr/callback (i.e. `http://localhost:8080/auth/tumblr/callback` )
- Click **✔Register**
- Copy and paste _OAuth consumer key_ and _OAuth consumer secret_ keys into `.env` file

<hr>

<img src="https://www.freepnglogos.com/uploads/twitch-logo-image-hd-31.png" height="75">

- Visit the <a href="https://dev.twitch.tv/console" target="_blank">Twitch developer console</a>
- If prompted, authorize the dashboard to access your twitch account
- In the Console, click on Register Your Application
- Enter the name of your application
- Use OAuth Redirect URLs enter your BASE_URL value followed by /auth/twitch/callback (i.e. `http://localhost:8080/auth/twitch/callback` )
- Set Category to Website Integration and press the Create button
- After the application has been created, click on the Manage button
- Copy and paste _Client ID_ into `.env`
- If there is no Client Secret displayed, click on the New Secret button and then copy and paste the _Client secret_ into `.env`

<hr>

<img src="https://s3.amazonaws.com/ahoy-assets.twilio.com/global/images/wordmark.svg" height="75">

- Go to <a href="https://www.twilio.com/try-twilio" target="_blank">https://www.twilio.com/try-twilio</a>
- Sign up for an account.
- Once logged into the dashboard, expand the link 'show api credentials'
- Copy your Account Sid and Auth Token
- Note that you also need to set TWILIO_FROM_NUMBER environment variable to a number you have registered with Twilio and are authorized to send messages from. The +15005550006 placeholder in the .env.example file can be used in the sandbox environment for testing without registering a sending phone number with Twilio.

<hr>

<img src="https://i.imgur.com/QMjwCk6.png" height="50">

- Sign in at <a href="https://developer.x.com/" target="_blank">https://developer.x.com/</a>
- Start with the Free tier
- Click **Create a new application**
- Enter your application name, website and description. Set the website as your BASE_URL value (i.e. `http://localhost:8080`, etc).
- For **Callback URL**: your BASE_URL value followed by /auth/x/callback (i.e. `http://localhost:8080/auth/x/callback` )
- Go to **Settings** tab
- Under _Application Type_ select **Read and Write** access
- Check the box **Allow this application to be used to Sign in with X**
- Click **Update this X's applications settings**
- Copy and paste _Consumer Key_ and _Consumer Secret_ keys into `.env` file

<hr>

## Web Analytics

This project supports integrating web analytics tools such as Google Analytics 4 and Facebook Pixel, along with Open Graph metadata for social sharing. Below are instructions to help you set up these features in your application.

### Google Analytics 4 Setup

- Go to [Google Analytics](https://analytics.google.com)
- Create a new GA4 property so you create a Measurement ID.
- Copy and paste your Measurement ID into `.env` file or set it up as an env variable

### Facebook Pixel

**Optional:** It is highly recommended to set up a business with Facebook that your personal account along with others you authorize can manage. You would need to Go to [Meta Business Suite](https://business.facebook.com/), register a business and add a business page and your website as an asset for the business.

- Go to [Meta Event Manager](https://www.facebook.com/events_manager)
- If you have set up a business, switch from your personal to your business account and pick your business asset using the drop down in the upper right corner of the page.
- Use the Connect Data option to add a Web data source and create a Pixel ID
- Copy and paste the Pixel ID into `.env` file for FACEBOOK_PIXEL_ID or set it up as an environment variable

## Open Graph

The metadata for Open Graph is only set up for the home page (`home.pug`). Update it to suit your application. You can also add Open Graph metadata to any other page that you plan to share through social media by including the relevant data in the corresponding view.

## Project Structure

| Name                             | Description                                                          |
| -------------------------------- | -------------------------------------------------------------------- |
| **config**/flash.js              | Flash middleware (replacement for express-flash)                     |
| **config**/morgan.js             | Configuration for request logging with morgan.                       |
| **config**/nodemailer.js         | Configuration and helper function for sending email with nodemailer. |
| **config**/passport.js           | Passport Local and OAuth strategies, plus login middleware.          |
| **config**/token-revocation.js   | Helper for revoking OAuth tokens.                                    |
| **controllers**/ai.js            | Controller for /ai route and all ai examples and boilerplates.       |
| **controllers**/api.js           | Controller for /api route and all api examples.                      |
| **controllers**/contact.js       | Controller for contact form.                                         |
| **controllers**/home.js          | Controller for home page (index).                                    |
| **controllers**/user.js          | Controller for user account management.                              |
| **controllers**/webauthn.js      | Controller for webauthn management (passkey / biometrics login)      |
| **models**/User.js               | Mongoose schema and model for User.                                  |
| **public**/                      | Static assets (fonts, css, js, img).                                 |
| **public**/**js**/application.js | Specify client-side JavaScript dependencies.                         |
| **public**/**js**/app.js         | Place your client-side JavaScript here.                              |
| **public**/**css**/main.scss     | Main stylesheet for your app.                                        |
| **test**/\*.js                   | Tests, related configs and helpers.                                  |
| **views/account**/               | Templates for _login, password reset, signup, profile, webauthn_     |
| **views/ai**/                    | Templates for AI examples and boilerplates.                          |
| **views/api**/                   | Templates for API examples.                                          |
| **views/partials**/flash.pug     | Error, info and success flash notifications.                         |
| **views/partials**/header.pug    | Navbar partial template.                                             |
| **views/partials**/footer.pug    | Footer partial template.                                             |
| **views**/layout.pug             | Base template.                                                       |
| **views**/home.pug               | Home page template.                                                  |
| .env.example                     | Your API keys, tokens, passwords and database URI.                   |
| .gitignore                       | Folder and files ignored by git.                                     |
| app.js                           | The main application file.                                           |
| eslint.config.mjs                | Rules for eslint linter.                                             |
| package.json                     | NPM dependencies.                                                    |
| package-lock.json                | Contains exact versions of NPM dependencies in package.json.         |

**Note:** There is no preference for how you name or structure your views.
You could place all your templates in a top-level `views` directory without
having a nested folder structure if that makes things easier for you.
Just don't forget to update `extends ../layout` and corresponding
`res.render()` paths in controllers.

## List of Packages

**Dependencies**

Required to run the project before your modifications

| Package                       | Description                                                           |
| ----------------------------- | --------------------------------------------------------------------- |
| @fortawesome/fontawesome-free | Symbol and Icon library.                                              |
| @googleapis/drive             | Google Drive API integration library.                                 |
| @googleapis/sheets            | Google Sheets API integration library.                                |
| @huggingface/inference        | Client library for Hugging Face Inference providers                   |
| @keyv/mongo                   | MongoDB storage adapter for Keyv                                      |
| @langchain/community          | Third party integrations for Langchain                                |
| @langchain/core               | Base LangChain abstractions and Expression Language                   |
| @langchain/mongodb            | MongoDB integrations for LangChain                                    |
| @langchain/textsplitters      | LangChain text splitters for RAG pipelines                            |
| @lob/lob-typescript-sdk       | Lob (USPS mailing / physical mailing service) library.                |
| @node-rs/bcrypt               | Library for hashing and salting user passwords.                       |
| @octokit/rest                 | GitHub API library.                                                   |
| @passport-js/passport-twitter | X (Twitter) login support (OAuth 2).                                  |
| @popperjs/core                | Frontend js library for poppers and tooltips.                         |
| @simplewebauthn/browser       | WebAuthn frontend library (passkey / biometrics authentication)       |
| @simplewebauthn/server        | WebAuthn backend library (passkey / biometrics authentication)        |
| bootstrap                     | CSS Framework.                                                        |
| bootstrap-social              | Social buttons library.                                               |
| bowser                        | User agent parser                                                     |
| chart.js                      | Front-end js library for creating charts.                             |
| cheerio                       | Scrape web pages using jQuery-style syntax.                           |
| compression                   | Node.js compression middleware.                                       |
| connect-mongo                 | MongoDB session store for Express.                                    |
| dotenv                        | Loads environment variables from .env file.                           |
| errorhandler                  | Development-only error handler middleware.                            |
| express                       | Node.js web framework.                                                |
| express-rate-limit            | Rate limiting middleware for abuse protection.                        |
| express-session               | Simple session middleware for Express.                                |
| jquery                        | Front-end JS library to interact with HTML elements.                  |
| keyv                          | key-value storage with support for multiple backends                  |
| langchain                     | Framework for developing LLM applications                             |
| lastfm                        | Last.fm API library.                                                  |
| lusca                         | CSRF middleware.                                                      |
| mailchecker                   | Verifies that an email address is valid and not a disposable address. |
| mongodb                       | MongoDB driver                                                        |
| mongoose                      | MongoDB ODM.                                                          |
| morgan                        | HTTP request logger middleware for node.js.                           |
| multer                        | Node.js middleware for handling `multipart/form-data`.                |
| nodemailer                    | Node.js library for sending emails.                                   |
| oauth                         | OAuth API library without middleware constraints.                     |
| otpauth                       | One-Time Password (TOTP/HOTP) library for 2FA authenticator apps.     |
| passport                      | Simple and elegant authentication library for node.js.                |
| passport-facebook             | Sign-in with Facebook plugin.                                         |
| passport-github2              | Sign-in with GitHub plugin.                                           |
| passport-google-oauth         | Sign-in with Google plugin.                                           |
| passport-local                | Sign-in with Username and Password plugin.                            |
| passport-oauth                | Allows you to set up your own OAuth 1.0a and OAuth 2.0 strategies.    |
| passport-oauth2-refresh       | A library to refresh OAuth 2.0 access tokens using refresh tokens.    |
| passport-steam-openid         | OpenID 2.0 Steam plugin.                                              |
| patch-package                 | Fix broken node modules ahead of fixes by maintainers.                |
| pdfjs-dist                    | PDF parser                                                            |
| pug                           | Template engine for Express.                                          |
| sass                          | Sass compiler to generate CSS with superpowers.                       |
| stripe                        | Official Stripe API library.                                          |
| twilio                        | Twilio API library.                                                   |
| twitch-passport               | Sign-in with Twitch plugin.                                           |
| validator                     | A library of string validators and sanitizers.                        |

**Dev Dependencies**

Required during code development for testing, Hygiene, code styling, etc.

| Package                     | Description                                                                 |
| --------------------------- | --------------------------------------------------------------------------- |
| @eslint/js                  | ESLint JavaScript language implementation.                                  |
| @playwright/test            | Automated end-to-end web testing framework (supports headless web browsers) |
| @prettier/plugin-pug        | Prettier plugin for formatting pug templates                                |
| c8                          | Coverage test.                                                              |
| chai                        | BDD/TDD assertion library.                                                  |
| eslint-config-prettier      | Make ESLint and Prettier play nice with each other.                         |
| eslint                      | Linter JavaScript.                                                          |
| eslint-plugin-chai-friendly | Makes eslint friendly towards Chai.js 'expect' and 'should' statements.     |
| eslint-plugin-import-x      | ESLint plugin with rules that help validate proper imports.                 |
| globals                     | ESLint global identifiers from different JavaScript environments.           |
| husky                       | Git hook manager to automate tasks with git.                                |
| mocha                       | Test framework.                                                             |
| mongodb-memory-server       | In memory mongodb server for testing, so tests can be ran without a DB.     |
| prettier                    | Code formatter.                                                             |
| sinon                       | Test spies, stubs and mocks for JavaScript.                                 |
| supertest                   | HTTP assertion library.                                                     |

## Useful Tools and Resources

- [Microsoft Copilot](https://copilot.microsoft.com/) - Free AI Assistant that can help you with coding questions as well
- [HTML to Pug converter](https://html-to-pug.com/) - HTML to PUG is a free online converter helping you to convert HTML files to pug syntax in real-time.
- [Favicon Generator](http://realfavicongenerator.net/) - Generate favicons for PC, Android, iOS, Windows 8.

## Recommended Design Resources

- [Code Guide](http://codeguide.co/) - Standards for developing flexible, durable, and sustainable HTML and CSS.
- [Bootsnipp](http://bootsnipp.com/) - Code snippets for Bootstrap.
- [Bootstrap Zero](https://www.bootstrapzero.com) - Free Bootstrap templates themes.
- [Google Bootstrap](http://todc.github.io/todc-bootstrap/) - Google-styled theme for Bootstrap.
- [Font Awesome Icons](https://fontawesome.com) - It's already part of the Hackathon Starter, so use this page as a reference.
- [Colors](http://clrs.cc) - A nicer color palette for the web.
- [Creative Button Styles](http://tympanus.net/Development/CreativeButtons/) - awesome button styles.
- [Creative Link Effects](http://tympanus.net/Development/CreativeLinkEffects/) - Beautiful link effects in CSS.
- [Medium Scroll Effect](http://codepen.io/andreasstorm/pen/pyjEh) - Fade in/out header background image as you scroll.
- [GeoPattern](https://github.com/btmills/geopattern) - SVG background pattern generator.
- [Trianglify](https://github.com/qrohlf/trianglify) - SVG low-poly background pattern generator.

## Recommended Node.js Libraries

- [Nodemon](https://github.com/remy/nodemon) - Automatically restart Node.js server on code changes.
- [geoip-lite](https://github.com/bluesmoon/node-geoip) - Geolocation coordinates from IP address.
- [Filesize.js](http://filesizejs.com/) - Pretty file sizes, e.g. `filesize(265318); // "265.32 kB"`.
- [Numeral.js](http://numeraljs.com) - Library for formatting and manipulating numbers.
- [sharp](https://github.com/lovell/sharp) - Node.js module for resizing JPEG, PNG, WebP and TIFF images.

## Recommended Client-side Libraries

- [Framework7](https://framework7.io/) - Full Featured HTML Framework For Building iOS7 Apps.
- [InstantClick](http://instantclick.io) - Makes your pages load instantly by pre-loading them on mouse hover.
- [NProgress.js](https://github.com/rstacruz/nprogress) - Slim progress bars like on YouTube and Medium.
- [Hover](https://github.com/IanLunn/Hover) - Awesome CSS3 animations on mouse hover.
- [Magnific Popup](http://dimsemenov.com/plugins/magnific-popup/) - Responsive jQuery Lightbox Plugin.
- [Offline.js](http://github.hubspot.com/offline/docs/welcome/) - Detect when user's internet connection goes offline.
- [Alertify.js](https://alertifyjs.com) - Sweet looking alerts and browser dialogs.
- [selectize.js](http://selectize.github.io/selectize.js) - Styleable select elements and input tags.
- [drop.js](http://github.hubspot.com/drop/docs/welcome/) - Powerful Javascript and CSS library for creating dropdowns and other floating displays.
- [scrollReveal.js](https://github.com/jlmakes/scrollReveal.js) - Declarative on-scroll reveal animations.

## Using AI Assistants

AI tools and large language models (LLMs) can greatly accelerate your ramp-up time, efficiency, and productivity during hackathons. Many of these tools are available for free and offer features that can significantly enhance your coding experience.

You have two main options for accessing these tools:

- **Web-based chat interfaces**: Platforms like [ChatGPT](https://chat.openai.com/) and [MS Copilot](https://copilot.microsoft.com/)
- **Integrated code assistants**: Tools like [Amazon Q (CodeWhisperer)](https://aws.amazon.com/q/developer/pricing/), [GitHub Copilot](https://github.com/features/copilot), and Gemini Code Assist integrate directly into code editors, such as Visual Studio Code.

Integrated tools, like plugins for Visual Studio Code, let you reference your code directly without needing to copy-paste, making them easier to use in many cases. Web-based assistants, on the other hand, require manual copy-pasting but can offer a different approach without impacting the "context" for your integrated tool. Tools and models perform differently depending on their update cycles, so results may vary. If an integrated tool struggles with a task, try copy-pasting the relevant code into a web assistant to troubleshoot. A good starting point is combining Amazon Q and MS Copilot, as these tools tend to produce fewer issues like outdated syntax, vulnerable code, or incomplete solutions compared to other assistants.

### Providing Context to AI Tools

Context for LLMs is the additional information that the model needs to make sense of how it should respond to your question, which in coding is probably your existing code, example implementation, or specifications that you might copy-paste or pass to the model. Keep in mind that integrated assistants may not automatically include your project files as the context and may try to answer your question without looking at your code. To include the context:

- **Amazon Q**: Use `@[filename]` to specify a file or `@workspace` to include the entire project.
- **GitHub Copilot**: Click the "Add Context" button in the chat and manually add specific files or choose Codebase for full project context. Note that you need to set the copilot mode to "Ask", "Edit", etc based on your intended conversation.

### Example Prompts to Get You Started

**Explaining Code and Concepts**

- "Can you explain how this project handles sanitization of user inputs?"
- "What does function `x` in file `y` do?" (_Copy-paste code into a web-based assistant if using one._)
- "Can you walk me through what this regex does?"

**Adding New Features**

- "I want to add login functionality for [OAuth2 provider]. The project already includes similar logins for other providers. Can you guide me through the required changes to `app.js`, `config/passport.js`, `models/User.js`, and the relevant views?"  
  _Pro Tip:_ If the assistant misses some changes, follow up with specific files or provide relevant documentation for better accuracy.
- "Can you help me design an addition to this project to do the following. I don't need any code yet, and want to work on the design and refine it before moving to an implementation. --- continue with a bullet point list of your requirements"

**Debugging or Fixing Code**

- "I modified the function `x` below to achieve `y`, but I get the following error. Can you help me fix it? --- Can have blocks afterward with a header like `==== error ====` and `==== function x ====` afterward."
- "Can you help me fix a bug in the following function or function `x`. It is supposed to return `y` when it gets input `i` but it is returning `z`."
- "Can you check my comments for spelling issues?".

## FAQ

### Why do I get `403 Error: Forbidden` when submitting a form?

You need to add the following hidden input element to your form. This has been added in the [pull request #40](https://github.com/sahat/hackathon-starter/pull/40) as part of the CSRF protection.

```
input(type='hidden', name='_csrf', value=_csrf)
```

**Note:** It is now possible to whitelist certain URLs. In other words, you can specify a list of routes that should bypass the CSRF verification check.

**Note 2:** To whitelist dynamic URLs use regular expression tests inside the CSRF middleware to see if `req.originalUrl` matches your desired pattern.

### I am getting MongoDB Connection Error, how do I fix it?

That's a custom error message defined in `app.js` to indicate that there was a problem connecting to MongoDB:

```js
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.');
  process.exit(1);
});
```

You need to have a MongoDB server running before launching `app.js`. You can download MongoDB [here](https://www.mongodb.com/try/download/community), or install it via a package manager.
Windows users, read [Install MongoDB on Windows](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-windows//).

**Tip:** If you are always connected to the internet, you could just use [MongoDB Atlas](https://www.mongodb.com) instead of downloading and installing MongoDB locally. You will only need to update the database credentials in the `.env` file.

**NOTE:** MongoDB Atlas (cloud database) is required for vector store, index, and search features used in AI integrations. These features are NOT available in locally installed MongoDBs.

### I get an error when I deploy my app, why?

Chances are you haven't changed the _Database URI_ in `.env`. If `MONGODB` is set to `localhost`, it will only work on your machine as long as MongoDB is running. When you deploy to Render, OpenShift, or some other provider, you will not have MongoDB running on `localhost`. You need to create an account with [MongoDB Atlas](https://www.mongodb.com), then create a free tier database.
See [Deployment](#deployment) for more information on how to set up an account and a new database step-by-step with MongoDB Atlas.

### Why do you have all routes defined in app.js?

For the sake of simplicity. While there might be a better approach, such as passing `app` context to each controller as outlined in this [blog](http://timstermatic.github.io/blog/2013/08/17/a-simple-mvc-framework-with-node-and-express/), I find such a style to be confusing for beginners. It took me a long time to grasp the concept of `exports` and `module.exports`, let alone having a global `app` reference in other files. That to me is backward thinking.
The `app.js` is the "heart of the app", it should be the one referencing models, routes, controllers, etc.
When working solo on small projects, I prefer to have everything inside `app.js` as is the case with [this](<(https://github.com/sahat/ember-sass-express-starter/blob/master/app.js)>) REST API server.

## How It Works (mini guides)

This section is intended for giving you a detailed explanation of how a particular functionality works. Maybe you are just curious about how it works, or perhaps you are lost and confused while reading the code, I hope it provides some guidance to you.

### Custom HTML and CSS Design 101

[HTML5 UP](http://html5up.net/) has many beautiful templates that you can download for free.

When you download the ZIP file, it will come with _index.html_, _images_, _CSS_ and _js_ folders. So, how do you integrate it with Hackathon Starter? Hackathon Starter uses the Bootstrap CSS framework, but these templates do not.
Trying to use both CSS files at the same time will likely result in undesired effects.

**Note:** Using the custom templates approach, you should understand that you cannot reuse any of the views I have created: layout, the home page, API browser, login, signup, account management, contact. Those views were built using Bootstrap grid and styles. You will have to manually update the grid using a different syntax provided in the template. **Having said that, you can mix and match if you want to do so: Use Bootstrap for the main app interface, and a custom template for a landing page.**

Let's start from the beginning. For this example I will use [Escape Velocity](http://html5up.net/escape-velocity/) template:
![Alt](http://html5up.net/uploads/images/escape-velocity.jpg)

**Note:** For the sake of simplicity I will only consider `index.html`, and skip `left-sidebar.html`,
`no-sidebar.html`, `right-sidebar.html`.

Move all JavaScript files from `html5up-escape-velocity/js` to `public/js`. Then move all CSS files from `html5up-escape-velocity/css` to `public/css`. And finally, move all images from `html5up-escape-velocity/images` to `public/images`. You could move it to the existing **img** folder, but that would require manually changing every `img` reference. Grab the contents of `index.html` and paste it into [HTML To Pug](https://html-to-pug.com/).

**Note:** Do not forget to update all the CSS and JS paths accordingly.

Create a new file `escape-velocity.pug` and paste the Pug markup in `views` folder.
Whenever you see the code `res.render('account/login')` - that means it will search for `views/account/login.pug` file.

Let's see how it looks. Create a new controller **escapeVelocity** inside `controllers/home.js`:

```js
exports.escapeVelocity = (req, res) => {
  res.render('escape-velocity', {
    title: 'Landing Page',
  });
};
```

And then create a route in `app.js`. I placed it right after the index controller:

```js
app.get('/escape-velocity', homeController.escapeVelocity);
```

Restart the server (if you are not using **nodemon**); then you should see the new template at `http://localhost:8080/escape-velocity`

I will stop right here, but if you would like to use this template as more than just a single page, take a look at how these Pug templates work: `layout.pug` - base template, `index.pug` - home page, `partials/header.pug` - Bootstrap navbar, `partials/footer.pug` - sticky footer. You will have to manually break it apart into smaller pieces. Figure out which part of the template you want to keep the same on all pages - that's your new `layout.pug`.
Then, each page that changes, be it `index.pug`, `about.pug`, `contact.pug`
will be embedded in your new `layout.pug` via `block content`. Use existing templates as a reference.

This is a rather lengthy process, and templates you get from elsewhere might have yet another grid system. That's why I chose _Bootstrap_ for the Hackathon Starter.
Many people are already familiar with _Bootstrap_, plus it's easy to get started with it if you have never used _Bootstrap_.
You can also buy many beautifully designed _Bootstrap_ themes at various vendors, and use them as a drop-in replacement for Hackathon Starter, just make sure they support the latest version of Bootstrap. However, if you would like to go with a completely custom HTML/CSS design, this should help you to get started!

<hr>

### How do flash messages work in this project?

Flash messages allow you to display a message at the end of the request and access it on the next request and only the next request. For instance, on a failed login attempt, you would display an alert with some error message, but as soon as you refresh that page or visit a different page and come back to the login page, that error message will be gone. It is only displayed once.
This project uses a middleware for displaying flash messages. You don't have to explicitly send a flash message to every view inside `res.render()`.
All flash messages are available in your views via `messages` object by default.

Flash messages have a two-step process. You use `req.flash('errors', { msg: 'Error messages goes here' }`
to create a flash message in your controllers, and then display them in your views:

```pug
if messages.errors
  .alert.alert-danger.fade.in
    each error in messages.errors
      div= error.msg
```

In the first step, `'errors'` is the name of a flash message, which should match the name of the property on `messages` object in your views. You place alert messages inside `if message.errors` because you don't want to show them flash messages are present.
The reason why you pass an error like `{ msg: 'Error message goes here' }` instead of just a string - `'Error message goes here'`, is for the sake of consistency.
To clarify that, _express-validator_ module which is used for validating and sanitizing user's input, returns all errors as an array of objects, where each object has a `msg` property with a message why an error has occurred. Here is a more general example of what express-validator returns when there are errors present:

```js
[
  { param: 'name', msg: 'Name is required', value: '<received input>' },
  { param: 'email', msg: 'A valid email is required', value: '<received input>' },
];
```

To keep consistent with that style, you should pass all flash messages as `{ msg: 'My flash message' }` instead of a string. Otherwise, you will see an alert box without an error message. That is because in **partials/flash.pug** template it will try to output `error.msg` (i.e. `"My flash message".msg`), in other words, it will try to call a `msg` method on a _String_ object, which will return _undefined_. Everything I just mentioned about errors, also applies to "info" and "success" flash messages, and you could even create a new one yourself, such as:

**Data Usage Controller (Example)**

```
req.flash('warning', { msg: 'You have exceeded 90% of your data usage' });
```

**User Account Page (Example)**

```pug
if messages.warning
  .alert.alert-warning.fade.in
    each warning in messages.warning
      div= warning.msg
```

`partials/flash.pug` is a partial template that contains how flash messages are formatted. Previously, flash messages were scattered throughout each view that used flash messages (contact, login, signup, profile), but now, thankfully it uses a _DRY_ approach.

The flash messages partial template is _included_ in the `layout.pug`, along with footer and navigation.

```pug
body
  include partials/header

  .container
    include partials/flash
    block content

  include partials/footer
```

If you have any further questions about flash messages, please feel free to open an issue, and I will update this mini-guide accordingly, or send a pull request if you would like to include something that I missed.

<hr>

### How do I create a new page?

A more correct way to say this would be "How do I create a new route?" The main file `app.js` contains all the routes.
Each route has a callback function associated with it. Sometimes you will see three or more arguments for a route. In a case like that, the first argument is still a URL string, while middle arguments are what's called middleware. Think of middleware as a door. If this door prevents you from continuing forward, you won't get to your callback function. One such example is a route that requires authentication.

```js
app.get('/account', passportConfig.isAuthenticated, userController.getAccount);
```

It always goes from left to right. A user visits `/account` page. Then `isAuthenticated` middleware checks if you are authenticated:

```js
exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};
```

If you are authenticated, you let this visitor pass through your "door" by calling `return next();`. It then proceeds to the
next middleware until it reaches the last argument, which is a callback function that typically renders a template on `GET` requests or redirects on `POST` requests. In this case, if you are authenticated, you will be redirected to the _Account Management_ page; otherwise, you will be redirected to the _Login_ page.

```js
exports.getAccount = (req, res) => {
  res.render('account/profile', {
    title: 'Account Management',
  });
};
```

Express.js has `app.get`, `app.post`, `app.put`, `app.delete`, but for the most part, you will only use the first two HTTP verbs, unless you are building a RESTful API.
If you just want to display a page, then use `GET`, if you are submitting a form, sending a file then use `POST`.

Here is a typical workflow for adding new routes to your application. Let's say we are building a page that lists all books from the database.

**Step 1.** Start by defining a route.

```js
app.get('/books', bookController.getBooks);
```

---

**Note:** As of Express 4.x you can define your routes like so:

```js
app.route('/books').get(bookController.getBooks).post(bookController.createBooks).put(bookController.updateBooks).delete(bookController.deleteBooks);
```

And here is how a route would look if it required an _authentication_ and an _authorization_ middleware:

```js
app.route('/api/twitch').all(passportConfig.isAuthenticated).all(passportConfig.isAuthorized).get(apiController.getTwitch).post(apiController.postTwitch);
```

Use whichever style makes sense to you. Either one is acceptable. I think that chaining HTTP verbs on `app.route` is a very clean and elegant approach, but on the other hand, I can no longer see all my routes at a glance when you have one route per line.

**Step 2.** Create a new schema and a model `Book.js` inside the _models_ directory.

```js
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  name: String,
});

const Book = mongoose.model('Book', bookSchema);
module.exports = Book;
```

**Step 3.** Create a new controller file called `book.js` inside the _controllers_ directory.

```js
/**
 * GET /books
 * List all books.
 */
const Book = require('../models/Book.js');

exports.getBooks = (req, res) => {
  Book.find((err, docs) => {
    res.render('books', { books: docs });
  });
};
```

**Step 4.** Import that controller in `app.js`.

```js
const bookController = require('./controllers/book');
```

**Step 5.** Create `books.pug` template.

```pug
extends layout

block content
  .page-header
    h3 All Books

  ul
    each book in books
      li= book.name
```

That's it! I will say that you could have combined Step 1, 2, 3 as following:

```js
app.get('/books', (req, res) => {
  Book.find((err, docs) => {
    res.render('books', { books: docs });
  });
});
```

Sure, it's simpler, but as soon as you pass 1000 lines of code in `app.js` it becomes a little challenging to navigate the file.
I mean, the whole point of this boilerplate project was to separate concerns, so you could work with your teammates without running into _MERGE CONFLICTS_. Imagine you have four developers working on a single `app.js`, I promise you it won't be fun resolving merge conflicts all the time.
If you are the only developer, then it's okay. But as I said, once it gets up to a certain LoC size, it becomes difficult to maintain everything in a single file.

That's all there is to it. Express.js is super simple to use.
Most of the time you will be dealing with other APIs to do the real work:
[Mongoose](http://mongoosejs.com/docs/guide.html) for querying database, socket.io for sending and receiving messages over WebSockets, sending emails via [Nodemailer](http://nodemailer.com/), form validation using [validator.js](https://github.com/validatorjs/validator.js) library, parsing websites using [Cheerio](https://github.com/cheeriojs/cheerio), etc.

<hr>

### AI Agent Controller

LangChain v1 ReAct agent intended as a starting point for building new AI agents. The end-to-end implementation supports:

- **Tool execution** with automatic retry middleware for transient failures
- **MongoDB session persistence** - Chat history persists across page reloads (authenticated users: permanent until account deletion; unauthenticated: tied to Express session lifecycle)
- **Input guardrails** - Prompt injection/jailbreak detection using a guard model (e.g., Llama Guard 4)
- **Conversation summarization** - Long conversations are condensed to stay within context limits
- **Real-time streaming** - Server-Sent Events (SSE) for live responses

To build your Agent using this controller as a starting point, you need to do two things:

#### 1. Define the agent's role

Edit the `systemPrompt` in `createAIAgent()` to describe what the agent does and which tools it can use.

```
systemPrompt: `You are a helpful [... e.g. travel, personal assistant, exam grading] agent.

Your responsibilities:

1. [YOUR_RESPONSIBILITY_1]
2. [YOUR_RESPONSIBILITY_2]
3. [YOUR_RESPONSIBILITY_3]

Available tools:
[LIST_YOUR_TOOLS_HERE]`
```

---

#### 2. Replace the tools

Add tools specific to your project by replacing the existing tools in the `tools` array inside `createAIAgent()`.  
The existing tool functions can be removed.

Tools follow this structure and use a Zod schema for input validation:

```js
const myTool = tool(
  async ({ input }, config) => {
    config.writer?.({ message: 'Calling my service...' });

    // Call your API or database
    const result = await callYourAPI(input);

    return JSON.stringify(result);
  },
  {
    name: 'my_tool',
    description: 'Does something specific',
    schema: z.object({
      input: z.string().describe('The input'),
    }),
  },
);
```

---

#### Other Functions in ai-agent.js

These functions handle streaming, parsing, and session management and typically do not need modification:

- `promptGuardMiddleware()` : LangChain middleware that classifies user input before the agent processes it. Blocks unsafe prompts and redirects the conversation.
- `getCheckpointer()` : Initializes the MongoDB checkpointer for session persistence.
- `cleanupOrphanedTempSessions()` : Cleans up checkpoint data for unauthenticated users whose Express sessions have expired. Called on app startup.
- `getAIAgent(req, res)` : Express route (GET /ai/ai-agent) - Renders the AI agent demo page and loads prior messages.
- `postAIAgentChat(req, res)` : Express route (POST /ai/ai-agent/chat) - Main SSE endpoint. Streams AI responses, tool progress, and debug data.
- `postAIAgentReset(req, res)` : Express route (POST /ai/ai-agent/reset) - Clears the user's chat session from MongoDB.
- `deleteUserAIAgentData(userId)` : Called when a user deletes their account to clean up their chat data.
- `sendSSE(res, eventType, data)` : Sends typed SSE events to the frontend.
- `extractAIMessages(data)` : Extracts user-visible AI messages from agent stream updates.
- `extractStatus(data)` : Derives tool call and completion status messages.

#### Environment Variables

The AI Agent requires these environment variables:

- `GROQ_API_KEY` : Your Groq API key
- `GROQ_MODEL` : The main LLM model (e.g., `llama-3.3-70b-versatile`)
- `GROQ_MODEL_PROMPT_GUARD` : The guard model for input safety (e.g., `meta-llama/llama-guard-4-12b`)

### How do I use Socket.io with Hackathon Starter?

[Dan Stroot](https://github.com/dstroot) submitted an excellent [pull request](https://github.com/dstroot/hackathon-starter/commit/0a632def1ce8da446709d92812423d337c977d75) that adds a real-time dashboard with socket.io.
And as much as I'd like to add it to the project, I think it violates one of the main principles of the Hackathon Starter:

> When I started this project, my primary focus was on simplicity and ease of use.
> I also tried to make it as generic and reusable as possible to cover most use cases of
> hackathon web apps, **without being too specific**.

When I need to use socket.io, I **really** need it, but most of the time - I don't. But more importantly, WebSockets support is still experimental on most hosting providers.
Due to past provider issues with WebSockets, I have not include socket.io as part of the Hackathon Starter. _For now..._
If you need to use socket.io in your app, please continue reading.

First, you need to install socket.io:

```js
npm install socket.io
```

Replace `const app = express();` with the following code:

```js
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
```

I like to have the following code organization in `app.js` (from top to bottom): module dependencies,
import controllers, import configs, connect to database, express configuration, routes,
start the server, socket.io stuff. That way I always know where to look for things.

Add the following code at the end of `app.js`:

```js
io.on('connection', (socket) => {
  socket.emit('greet', { hello: 'Hey there browser!' });
  socket.on('respond', (data) => {
    console.log(data);
  });
  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
});
```

One last thing left to change:

```js
app.listen(app.get('port'), () => {
```

to

```js
server.listen(app.get('port'), () => {
```

At this point, we are done with the back-end.

You now have a choice - to include your JavaScript code in Pug templates or have all your client-side JavaScript in a separate file - in `app.js`. I admit, when I first started with Node.js and JavaScript in general, I placed all JavaScript code inside templates because I have access to template variables passed in from Express right then and there. It's the easiest thing you can do, but also the least efficient and harder to maintain. Since then I almost never include inline JavaScript inside templates anymore.

But it's also understandable if you want to take the easier road. Most of the time you don't even care about performance during hackathons, you just want to _"get shit done"_ before the time runs out. Well, either way, use whichever approach makes more sense to you. At the end of the day, it's **what** you build that matters, not **how** you build it.

If you want to stick all your JavaScript inside templates, then in `layout.pug` - your main template file, add this to the `head` block.

```pug
script(src='/socket.io/socket.io.js')
script.
  let socket = io.connect(window.location.href);
  socket.on('greet', function (data) {
    console.log(data);
    socket.emit('respond', { message: 'Hey there, server!' });
  });
```

**Note:** Notice the path of the `socket.io.js`, you don't actually have to have `socket.io.js` file anywhere in your project; it will be generated automatically at runtime.

If you want to have JavaScript code separate from templates, move that inline script code into `app.js`, inside the `$(document).ready()` function:

```js
$(document).ready(function () {
  // Place JavaScript code here...
  let socket = io.connect(window.location.href);
  socket.on('greet', function (data) {
    console.log(data);
    socket.emit('respond', { message: 'Hey there, server!' });
  });
});
```

And we are done!

## Cheatsheets

### <img src="https://frontendmasters.com/assets/es6-logo.png" height="34" align="top"> ES6 Cheatsheet

#### Declarations

Declares a read-only named constant.

```js
const name = 'yourName';
```

Declares a block scope local variable.

```js
let index = 0;
```

#### Template Strings

Using the **\`${}\`** syntax, strings can embed expressions.

```js
const name = 'Oggy';
const age = 3;

console.log(`My cat is named ${name} and is ${age} years old.`);
```

#### Modules

To import functions, objects, or primitives exported from an external module. These are the most common types of importing.

```js
const name = require('module-name');
```

```js
const { foo, bar } = require('module-name');
```

To export functions, objects, or primitives from a given file or module.

```js
module.exports = { myFunction };
```

```js
module.exports.name = 'yourName';
```

```js
module.exports = myFunctionOrClass;
```

#### Spread Operator

The spread operator allows an expression to be expanded in places where multiple arguments (for function calls) or multiple elements (for array literals) are expected.

```js
myFunction(...iterableObject);
```

```jsx
<ChildComponent {...this.props} />
```

#### Promises

A Promise is used in asynchronous computations to represent an operation that hasn't completed yet but is expected in the future.

```js
var p = new Promise(function (resolve, reject) {});
```

The `catch()` method returns a Promise and deals with rejected cases only.

```js
p.catch(function (reason) {
  /* handle rejection */
});
```

The `then()` method returns a Promise. It takes two arguments: callback for the success & failure cases.

```js
p.then(
  function (value) {
    /* handle fulfillment */
  },
  function (reason) {
    /* handle rejection */
  },
);
```

The `Promise.all(iterable)` method returns a promise that resolves when all of the promises in the iterable argument have resolved or rejects with the reason of the first passed promise that rejects.

```js
Promise.all([p1, p2, p3]).then(function (values) {
  console.log(values);
});
```

#### Arrow Functions

Arrow function expression. Shorter syntax & lexically binds the `this` value. Arrow functions are anonymous.

```js
(singleParam) => {
  statements;
};
```

```js
() => {
  statements;
};
```

```js
(param1, param2) => expression;
```

```js
const arr = [1, 2, 3, 4, 5];
const squares = arr.map((x) => x * x);
```

#### Classes

The class declaration creates a new class using prototype-based inheritance.

```js
class Person {
  constructor(name, age, gender) {
    this.name = name;
    this.age = age;
    this.gender = gender;
  }

  incrementAge() {
    this.age++;
  }
}
```

:gift: **Credits**: [DuckDuckGo](https://duckduckgo.com/?q=es6+cheatsheet&ia=cheatsheet&iax=1) and [@DrkSephy](https://github.com/DrkSephy/es6-cheatsheet).

:top: <sub>[**back to top**](#table-of-contents)</sub>

### <img src="http://i.stack.imgur.com/Mmww2.png" height="34" align="top"> JavaScript Date Cheatsheet

#### Unix Timestamp (seconds)

```js
Math.floor(Date.now() / 1000);
```

#### Add 30 minutes to a Date object

```js
var now = new Date();
now.setMinutes(now.getMinutes() + 30);
```

#### Date Formatting

```js
// DD-MM-YYYY
var now = new Date();

var DD = now.getDate();
var MM = now.getMonth() + 1;
var YYYY = now.getFullYear();

if (DD < 10) {
  DD = '0' + DD;
}

if (MM < 10) {
  MM = '0' + MM;
}

console.log(MM + '-' + DD + '-' + YYYY); // 03-30-2016
```

```js
// hh:mm (12 hour time with am/pm)
var now = new Date();
var hours = now.getHours();
var minutes = now.getMinutes();
var amPm = hours >= 12 ? 'pm' : 'am';

hours = hours % 12;
hours = hours ? hours : 12;
minutes = minutes < 10 ? '0' + minutes : minutes;

console.log(hours + ':' + minutes + ' ' + amPm); // 1:43 am
```

#### Next week Date object

```js
var today = new Date();
var nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
```

#### Yesterday Date object

```js
var today = new Date();
var yesterday = date.setDate(date.getDate() - 1);
```

:top: <sub>[**back to top**](#table-of-contents)</sub>

### Mongoose Cheatsheet

#### Find all users:

```js
User.find((err, users) => {
  console.log(users);
});
```

#### Find a user by email:

```js
let userEmail = 'example@gmail.com';
User.findOne({ email: { $eq: email.toLowerCase() } }).then((user) => {
  console.log(user);
});
```

#### Find 5 most recent user accounts:

```js
User.find()
  .sort({ _id: -1 })
  .limit(5)
  .exec((err, users) => {
    console.log(users);
  });
```

#### Get the total count of a field from all documents:

Let's suppose that each user has a `votes` field and you would like to count the total number of votes in your database across all users. One very inefficient way would be to loop through each document and manually accumulate the count. Or you could use [MongoDB Aggregation Framework](https://docs.mongodb.org/manual/core/aggregation-introduction/) instead:

```js
User.aggregate({ $group: { _id: null, total: { $sum: '$votes' } } }, (err, votesCount) => {
  console.log(votesCount.total);
});
```

:top: <sub>[**back to top**](#table-of-contents)</sub>

## Deployment

Using a local instance on your laptop with ngrok is a good solution for your demo during the hackathon, and you wouldn't necessarily need to deploy to a cloud platform. If you wish to have your app run 24x7 for a general audience, once you are ready to deploy your app, you will need to create an account with a cloud platform to host it. There are a number of cloud service providers out there that you can research. Service providers like AWS and Azure provide a free tier of service which can help you get started with just some minor costs (such as traffic overage if any, etc).

---

### Hosted MongoDB Atlas

<img src="https://www.mongodb.com/assets/images/global/MongoDB_Logo_Dark.svg" width="200">

- Go to [mongodb.com](https://www.mongodb.com/)
- Click the green **Try free** button
- Fill in your information then hit **Create your Atlas account**
- You will be redirected to Create New Cluster page.
- Select a **Cloud Provider and Region**
- Set the cluster Tier to Free Forever **Shared** Cluster
- Give Cluster a name (default: Cluster0)
- Click on the green **:zap:Create Cluster button**
- Now, to access your database you need to create a DB user. To create a new MongoDB user, from the **Clusters view**, select the **Security tab**
- Under the **MongoDB Users** tab, click on **+Add New User**
- Fill in a username and password and give it either **Atlas Admin** User Privilege
- Next, you will need to create an IP address whitelist and obtain the connection URI. In the Clusters view, under the cluster details (i.e. SANDBOX - Cluster0), click on the **CONNECT** button.
- Under section **(1) Check the IP Whitelist**, click on **ALLOW ACCESS FROM ANYWHERE**. The form will add a field with `0.0.0.0/0`. Click **SAVE** to save the `0.0.0.0/0` whitelist.
- Under section **(2) Choose a connection method**, click on **Connect Your Application**
- In the new screen, select **Node.js** as Driver and version **3.6 or later**.
- Finally, copy the URI connection string and replace the URI in MONGODB_URI of `.env.example` with this URI string. Make sure to replace the <PASSWORD> with the db User password that you created under the Security tab.
- Note that after some of the steps in the Atlas UI, you may see a banner stating `We are deploying your changes`. You will need to wait for the deployment to finish before using the DB in your application.

## Production

If you are starting with this boilerplate to build an application for prod deployment, or if after your hackathon you would like to get your project hardened for production use, see [prod-checklist.md](https://github.com/sahat/hackathon-starter/blob/master/prod-checklist.md).

## Testing

Hackathon Starter includes both unit tests and end-to-end (E2E) tests.

- **Unit tests** focus on core functionality, such as user account management.
- **E2E tests** use [Playwright](https://playwright.dev/) to run the application in a headless Chrome browser, making live API calls and verifying rendered views. These tests are located in `test/e2e/` and `test/e2e-nokey/`. The nokey tests are tests that don't require API keys to run.

During a hackathon, you typically don't need to worry about E2E tests; they can slow you down when you're focused on rapid prototyping. However, if you plan to launch your project for real-world use, adding and maintaining E2E tests is strongly recommended. They help ensure that future changes don't unintentionally break existing functionality.

The existing E2E tests cover the example API integrations included in the starter project. You can use these as **examples or templates** when creating your own test files, adapting them to match your project's specific views and workflows.

You can run the tests using:

```bash
npm test                  # unit tests (core functions)
npm run test:e2e:live     # All E2E tests with previously recorded API responses
npm run test:e2e:replay   # E2E (replay fixtures - recorded API responses)
```

You can run a single E2E Test file like the following:

```bash
# Run tests in a single test file against live APIs
npx playwright test test/e2e.../testfile.e2e.test.js --config=test/playwright.config.js --project=chromium

# Run tests in a single test file while replaying recorded API responses from the fixtures
npx playwright test test/e2e.../testfile.e2e.test.js --config=test/playwright.config.js --project=chromium-replay

# Run tests in a single test file against live APIs and capture the API responses as fixtures for replay later
npx playwright test test/e2e.../testfile.e2e.test.js --config=test/playwright.config.js --project=chromium-record
```

For more information on creating or running E2E tests see [test/TESTING.md](https://github.com/sahat/hackathon-starter/blob/master/test/TESTING.md)

## Changelog

You can find the changelog for the project in: [CHANGELOG.md](https://github.com/sahat/hackathon-starter/blob/master/CHANGELOG.md)

## Contributing

If something is unclear, confusing, or needs to be refactored, please let me know.
Pull requests are always welcome, but due to the opinionated nature of this project, I cannot accept every pull request. Please open an issue before submitting a pull request. This project uses [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) with a few minor exceptions. If you are submitting a pull request that involves Pug templates, please make sure you are using _spaces_, not tabs.

## License

The MIT License (MIT)

Copyright (c) 2014-2026 Sahat Yalkabov

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
