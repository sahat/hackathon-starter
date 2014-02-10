module.exports = {
	option : { 
	  getAsync: true,
	  preload: ['ug-CN', 'zh-CN', 'en-US'],
	  detectLngFromHeaders: false,
	  detectLngFromPath: false,
	  useCookie: false,
	  detectLngQS: 'locale',
	  cookieName: 'locale',
	  fallbackLng: 'en-US',
	  supportedLngs: ['en-US','ug-CN','zh-CN'] 
	}
}	