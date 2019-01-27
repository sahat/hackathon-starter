const request = require('supertest');
const app = require('../app.js');

describe('GET /', () => {
  it('should return 200 OK', (done) => {
    request(app)
      .get('/')
      .expect(200, done);
  });
});

describe('GET /login', () => {
  it('should return 200 OK', (done) => {
    request(app)
      .get('/login')
      .expect(200, done);
  });
});

describe('GET /signup', () => {
  it('should return 200 OK', (done) => {
    request(app)
      .get('/signup')
      .expect(200, done);
  });
});

describe('GET /api', () => {
  it('should return 200 OK', (done) => {
    request(app)
      .get('/api')
      .expect(200, done);
  });
});

describe('GET /contact', () => {
  it('should return 200 OK', (done) => {
    request(app)
      .get('/contact')
      .expect(200, done);
  });
});

describe('GET /api/lastfm', () => {
  it('should return 200 OK', (done) => {
    request(app)
      .get('/api/lastfm')
      .expect(200, done);
  });
});

describe('GET /api/twilio', () => {
  it('should return 200 OK', (done) => {
    request(app)
      .get('/api/twilio')
      .expect(200, done);
  });
});

describe('GET /api/stripe', () => {
  it('should return 200 OK', (done) => {
    request(app)
      .get('/api/stripe')
      .expect(200, done);
  });
});

describe('GET /api/scraping', () => {
  it('should return 200 OK', (done) => {
    request(app)
      .get('/api/scraping')
      .expect(200, done);
  });
});

describe('GET /api/lob', () => {
  it('should return 200 OK', (done) => {
    request(app)
      .get('/api/lob')
      .expect(200, done);
  });
});

describe('GET /api/aviary', () => {
  it('should return 200 OK', (done) => {
    request(app)
      .get('/api/aviary')
      .expect(200, done);
  });
});

describe('GET /api/clockwork', () => {
  it('should return 200 OK', (done) => {
    request(app)
      .get('/api/clockwork')
      .expect(200, done);
  });
});

describe('GET /api/upload', () => {
  it('should return 200 OK', (done) => {
    request(app)
      .get('/api/upload')
      .expect(200, done);
  });
});

describe('GET /random-url', () => {
  it('should return 404', (done) => {
    request(app)
      .get('/reset')
      .expect(404, done);
  });
});
