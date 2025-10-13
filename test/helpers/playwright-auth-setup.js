const { chromium } = require('playwright');
const path = require('path');
const os = require('os');

require('dotenv').config({ path: '../../.env' });

// Function to find Brave browser executable path
function getBravePath() {
  const platform = os.platform();
  
  if (platform === 'win32') {
    // Common Brave paths on Windows
    const possiblePaths = [
      'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      `${os.homedir()}\\AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
      `${os.homedir()}\\AppData\\Local\\BraveSoftware\\Brave-Browser-Beta\\Application\\brave.exe`,
      `${os.homedir()}\\AppData\\Local\\BraveSoftware\\Brave-Browser-Dev\\Application\\brave.exe`,
    ];
    
    const fs = require('fs');
    for (const bravePath of possiblePaths) {
      if (fs.existsSync(bravePath)) {
        return bravePath;
      }
    }
  } else if (platform === 'darwin') {
    // macOS paths
    const possiblePaths = [
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      '/Applications/Brave Browser Beta.app/Contents/MacOS/Brave Browser Beta',
      '/Applications/Brave Browser Dev.app/Contents/MacOS/Brave Browser Dev',
    ];
    
    const fs = require('fs');
    for (const bravePath of possiblePaths) {
      if (fs.existsSync(bravePath)) {
        return bravePath;
      }
    }
  } else if (platform === 'linux') {
    // Linux paths
    const possiblePaths = [
      '/usr/bin/brave-browser',
      '/usr/bin/brave',
      '/snap/bin/brave',
      '/opt/brave.com/brave/brave-browser',
    ];
    
    const fs = require('fs');
    for (const bravePath of possiblePaths) {
      if (fs.existsSync(bravePath)) {
        return bravePath;
      }
    }
  }
  
  return null;
}

// Function to get Brave user data directory
function getBraveUserDataPath() {
  const platform = os.platform();
  
  if (platform === 'win32') {
    return path.join(os.homedir(), 'AppData', 'Local', 'BraveSoftware', 'Brave-Browser', 'User Data');
  } else if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'BraveSoftware', 'Brave-Browser');
  } else if (platform === 'linux') {
    return path.join(os.homedir(), '.config', 'BraveSoftware', 'Brave-Browser');
  }
  
  return null;
}

async function setupAuth() {
  console.log('Setting up authentication session for Hackathon Starter...\n');

  const bravePath = getBravePath();
  const braveUserDataPath = getBraveUserDataPath();
  
  if (!bravePath) {
    console.log('Brave browser not found. Available options:');
    console.log('1. Install Brave browser from https://brave.com/');
    console.log('2. Or modify this script to use a different browser');
    console.log('\nFalling back to Chromium...\n');
  } else {
    console.log(`Found Brave browser at: ${bravePath}`);
    if (braveUserDataPath) {
      console.log(`Using Brave user data from: ${braveUserDataPath}`);
    }
    console.log('This will use your existing Brave profile with saved passwords\n');
  }

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000,
    executablePath: bravePath, // Use Brave if found, otherwise default Chromium
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--remote-debugging-port=9222', // Enable remote debugging
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-default-apps',
      '--disable-popup-blocking'
    ]
  });
  
  // Create context with existing user data to preserve login state
  const context = await browser.newContext({
    // Use existing user data to preserve saved passwords and login state
    ...(braveUserDataPath && {
      storageState: undefined // Let it use the default profile data
    }),
    // Additional context options to mimic real browser usage
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();

  try {
    console.log('Navigating to local app...');
    await page.goto('http://localhost:8080');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if we're already logged in
    console.log('Checking if already logged in...');
    
    let isAlreadyLoggedIn = false;
    const loginIndicators = [
      'a[href="/logout"]',
      'a[href="/account"]',
      '.navbar .dropdown-toggle',
      'text=Sign out',
      'text=Logout',
      'text=Account'
    ];

    for (const selector of loginIndicators) {
      try {
        await page.waitForSelector(selector, { timeout: 1000 });
        console.log(`Already logged in! Found: ${selector}`);
        isAlreadyLoggedIn = true;
        break;
      } catch (error) {
        continue;
      }
    }

    if (!isAlreadyLoggedIn) {
      // Click on Login/Sign in button
      console.log('Looking for login button...');
      await page.click('a[href="/login"]');

      // Wait for login page to load
      await page.waitForLoadState('networkidle');

      console.log('\n MANUAL ACTION REQUIRED:');
      console.log('1. Please log in with your GitHub account in the Brave browser window');
      console.log('   (Your saved passwords should be available)');
      console.log('2. Make sure you are redirected to the dashboard/home page');
      console.log('3. Press Enter in this terminal when login is complete...\n');

      // Wait for user input
      await new Promise(resolve => {
        process.stdin.once('data', () => {
          resolve();
        });
      });

      // Verify login after manual action
      console.log('Verifying login status...');
      
      let isLoggedIn = false;
      
      // Try to find any login indicator
      for (const selector of loginIndicators) {
        try {
          await page.waitForSelector(selector, { timeout: 2000 });
          console.log(`Found login indicator: ${selector}`);
          isLoggedIn = true;
          break;
        } catch (error) {
          console.log(`Not found: ${selector}`);
          continue;
        }
      }

      // If standard selectors don't work, check URL and page content
      if (!isLoggedIn) {
        const currentUrl = page.url();
        const pageContent = await page.content();
        
        console.log(`Current URL: ${currentUrl}`);
        
        // Check if we're no longer on login page
        if (!currentUrl.includes('/login')) {
          console.log('URL indicates successful login (not on /login page)');
          isLoggedIn = true;
        }
        
        // Check for user-specific content in the page
        if (pageContent.includes('logout') || pageContent.includes('account') || pageContent.includes('profile')) {
          console.log('Page content indicates successful login');
          isLoggedIn = true;
        }
      }

      if (!isLoggedIn) {
        console.log('\n Could not verify login automatically.');
        console.log('Please confirm: Are you successfully logged in? (y/n)');
        
        const confirmation = await new Promise(resolve => {
          process.stdin.once('data', (data) => {
            resolve(data.toString().trim().toLowerCase());
          });
        });
        
        if (confirmation !== 'y' && confirmation !== 'yes') {
          throw new Error('Login verification failed. Please ensure you are logged in and try again.');
        }
        
        console.log('Login confirmed manually');
      }
    }
    
    console.log('Login verified! Capturing session...');

    // Get all cookies and storage state
    const cookies = await context.cookies();
    const storageState = await context.storageState();

    // Create a session object with all necessary data
    const sessionData = {
      cookies: cookies,
      origins: storageState.origins,
      timestamp: new Date().toISOString(),
      url: page.url(),
      userAgent: await page.evaluate(() => navigator.userAgent)
    };

    // Convert to base64 string for environment variable
    const sessionString = Buffer.from(JSON.stringify(sessionData)).toString('base64');

    console.log('\n Session captured successfully!');
    console.log('\n SETUP INSTRUCTIONS:');
    console.log('='.repeat(50));
    console.log('\n1. Copy the session data below:');
    console.log('\n' + '='.repeat(20) + ' SESSION DATA ' + '='.repeat(20));
    console.log(sessionString);
    console.log('='.repeat(53));
    
    console.log('\n2. Set it as an environment variable:');
    console.log('\nFor Windows Command Prompt:');
    console.log(`set PLAYWRIGHT_AUTH_SESSION=${sessionString}`);
    
    console.log('\nFor Windows PowerShell:');
    console.log(`$env:PLAYWRIGHT_AUTH_SESSION="${sessionString}"`);
    
    console.log('\nFor .env file (recommended):');
    console.log(`PLAYWRIGHT_AUTH_SESSION=${sessionString}`);
    
    console.log('\n3. In your test files, use this helper to restore the session:');
    console.log(`
const { restoreAuthSession } = require('./helpers/playwright-auth-setup');

// In your test setup:
await restoreAuthSession(context);
`);

    // Save to a local file as backup
    const fs = require('fs');
    const authFile = path.join(__dirname, 'auth-session.json');
    fs.writeFileSync(authFile, JSON.stringify(sessionData, null, 2));
    console.log(`\n Session also saved to: ${authFile}`);

    // Debug info
    console.log(`\n Debug Info:`);
    console.log(`- Browser: ${bravePath ? 'Brave' : 'Chromium'}`);
    console.log(`- Using existing profile: ${braveUserDataPath ? 'Yes' : 'No'}`);
    console.log(`- Cookies captured: ${cookies.length}`);
    console.log(`- Storage origins: ${storageState.origins.length}`);
    console.log(`- Final URL: ${page.url()}`);

  } catch (error) {
    console.error(' Error during authentication setup:', error.message);
    
    // Provide additional debug info
    try {
      const currentUrl = page.url();
      const title = await page.title();
      console.log(`\n Debug Info:`);
      console.log(`- Current URL: ${currentUrl}`);
      console.log(`- Page Title: ${title}`);
      
      // List all links on the page for debugging
      const links = await page.$$eval('a', links => 
        links.map(link => ({ href: link.href, text: link.textContent.trim() }))
      );
      console.log(`- Available links:`, links.slice(0, 10)); // Show first 10 links
    } catch (debugError) {
      console.log('Could not gather debug info');
    }
    
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Helper function to restore session (for use in tests)
async function restoreAuthSession(context) {
  const sessionData = process.env.PLAYWRIGHT_AUTH_SESSION;
  
  if (!sessionData) {
    throw new Error('PLAYWRIGHT_AUTH_SESSION environment variable not found. Please run the auth setup first.');
  }

  try {
    const session = JSON.parse(Buffer.from(sessionData, 'base64').toString());
    
    // Add cookies
    await context.addCookies(session.cookies);
    
    // Restore localStorage and sessionStorage if available
    if (session.origins && session.origins.length > 0) {
      await context.addInitScript((origins) => {
        for (const origin of origins) {
          if (origin.localStorage) {
            for (const item of origin.localStorage) {
              localStorage.setItem(item.name, item.value);
            }
          }
          if (origin.sessionStorage) {
            for (const item of origin.sessionStorage) {
              sessionStorage.setItem(item.name, item.value);
            }
          }
        }
      }, session.origins);
    }
    
    console.log(' Authentication session restored');
    console.log(`- Restored ${session.cookies.length} cookies`);
    console.log(`- Session captured at: ${session.timestamp}`);
    
  } catch (error) {
    throw new Error('Failed to restore authentication session: ' + error.message);
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupAuth().catch(console.error);
}

module.exports = { restoreAuthSession };