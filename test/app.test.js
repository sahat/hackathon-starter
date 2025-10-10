const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let app;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mockMongoDBUri = await mongoServer.getUri();
  process.env.MONGODB_URI = mockMongoDBUri;
  // If we require the app at the beginning of this file
  // it will try to connect to the database before the
  // MongoMemoryServer is started which can cause the testes to fail
  // Hence we are making an exception for linting this require statement
  /* eslint-disable global-require */
  app = require('../app');
});

after(async () => {
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('GET /', () => {
  it('should return 200 OK', (done) => {
    request(app).get('/').expect(200, done);
  });
});

describe('GET /login', () => {
  it('should return 200 OK', (done) => {
    request(app).get('/login').expect(200, done);
  });
});

describe('GET /signup', () => {
  it('should return 200 OK', (done) => {
    request(app).get('/signup').expect(200, done);
  });
});

describe('GET /forgot', () => {
  it('should return 200 OK', (done) => {
    request(app).get('/forgot').expect(200, done);
  });
});

describe('GET /api', () => {
  it('should return 200 OK', (done) => {
    request(app).get('/api').expect(200, done);
  });
});

describe('GET /contact', () => {
  it('should return 200 OK', (done) => {
    request(app).get('/contact').expect(200, done);
  });
});

describe('GET /api/twilio', () => {
  it('should return 200 OK', (done) => {
    request(app).get('/api/twilio').expect(200, done);
  });
});

describe('GET /api/stripe', () => {
  it('should return 200 OK', (done) => {
    request(app).get('/api/stripe').expect(200, done);
  });
});

describe('GET /api/scraping', () => {
  it('should return 200 OK', (done) => {
    request(app).get('/api/scraping').expect(200, done);
  });
});

describe('GET /api/upload', () => {
  it('should return 200 OK', (done) => {
    request(app).get('/api/upload').expect(200, done);
  });
});

describe('GET /random-url', () => {
  it('should return 404', (done) => {
    request(app).get('/reset').expect(404, done);
  });
});
