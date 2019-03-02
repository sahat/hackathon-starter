const request = require('supertest');
const cheerio = require('cheerio');
const superTestSession = require('supertest-session');
const app = require('../app.js');

const Session = superTestSession(app);

const extractCsrfToken = (res) => {
  const $ = cheerio.load(res.text);
  return $('[name=_csrf]').val();
};

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

describe('POST /signup', () => {
  let session;

  beforeEach(() => {
    session = Session;
  });

  describe('when valid CSRF token is provided', () => {
    let csrfToken;

    beforeEach((done) => {
      session.get('/signup').end((err, res) => {
        if (err) return done(err);
        csrfToken = extractCsrfToken(res);
        done();
      });
    });

    it('should signup a user', (done) => {
      session
        .post('/signup')
        .send({
          _csrf: csrfToken,
          email: 'test1234@hotmail.com',
          password: 'test1234',
          confirmPassword: 'test1234'
        })
        .expect(302, done)
        .end(done);
    });
  });
});

describe('POST /contact', () => {
  let session;

  beforeEach(() => {
    session = Session;
  });

  describe('when valid CSRF token is provided', () => {
    let csrfToken;

    beforeEach((done) => {
      session.get('/contact').end((err, res) => {
        if (err) return done(err);
        csrfToken = extractCsrfToken(res);
        done();
      });
    });

    it('should post contact info for a user', (done) => {
      session
        .post('/contact')
        .send({
          _csrf: csrfToken,
          email: 'test1234@hotmail.com',
          password: 'test1234',
          message: 'hello world'
        })
        .expect(302, done)
        .end(done);
    });
  });
});
