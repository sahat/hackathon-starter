/*
 Test-only Foursquare Places API v3 mock.
 - Monkey-patches global.fetch to intercept the endpoints used by the demo page.
 - Returns deterministic data good enough for the pug view and E2E tests.
*/

(function installFoursquareMock() {
  if (process.env.MOCK_FOURSQUARE !== '1') return;
  if (global.__FOURSQUARE_MOCK_INSTALLED__) return;
  const origFetch = global.fetch;

  function jsonResponse(data, init = {}) {
    const body = JSON.stringify(data);
    const hdrs = new Map([['content-type', 'application/json; charset=utf-8']]);
    return {
      ok: true,
      status: init.status || 200,
      statusText: init.statusText || 'OK',
      headers: hdrs,
      url: init.url || '',
      async json() {
        return data;
      },
      async text() {
        return body;
      },
      clone() {
        return jsonResponse(data, init);
      },
    };
  }

  function isFoursquareUrl(url) {
    return typeof url === 'string' && url.startsWith('https://places-api.foursquare.com/places');
  }

  function handleFoursquare(url) {
    try {
      const u = new URL(url);
      // /places/search?ll=...&limit=10
      if (u.pathname === '/places/search') {
        const limit = parseInt(u.searchParams.get('limit') || '10', 10);
        const results = Array.from({ length: limit }, (_, i) => ({
          fsq_id: `mock_fsq_${i + 1}`,
          name: `Mock Place ${i + 1}`,
          categories: [
            {
              id: 13035,
              name: 'Coffee Shop',
              icon: {
                prefix: 'https://ss3.4sqi.net/img/categories_v2/food/coffee_',
                suffix: '.png',
              },
            },
          ],
          location: {
            formatted_address: `${100 + i} Pike St, Seattle, WA 98101`,
          },
          distance: 100 + i * 10,
        }));
        return jsonResponse({ results });
      }

      // /places/:id (we specifically use Pike Place Market id in the demo)
      const match = u.pathname.match(/^\/places\/([a-zA-Z0-9]+)$/);
      if (match) {
        const id = match[1];
        // Fixed deterministic coordinates near Seattle
        const latitude = 47.609657;
        const longitude = -122.342148;
        const venueDetail = {
          fsq_id: id,
          name: 'Pike Place Market',
          categories: [{ id: 17069, name: 'Market' }],
          location: {
            address: '85 Pike St',
            locality: 'Seattle',
            region: 'WA',
          },
          latitude,
          longitude,
          related_places: {
            children: Array.from({ length: 12 }, (_, i) => ({ name: `Related Place ${i + 1}` })),
          },
        };
        return jsonResponse(venueDetail);
      }

      // Fallthrough: let real fetch handle it
      return null;
    } catch {
      // On any parsing error, do not interfere
      return null;
    }
  }

  global.fetch = async function mockedFetch(url, options) {
    if (isFoursquareUrl(url)) {
      const resp = handleFoursquare(url);
      if (resp) return resp;
    }
    return origFetch(url, options);
  };

  global.__FOURSQUARE_MOCK_INSTALLED__ = true;
})();
