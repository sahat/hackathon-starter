const cheerio = require('cheerio');
const superTestSession = require('supertest-session');
const app = require('../../app.js');

const Session = superTestSession(app);

const extractCsrfToken = (res) => {
  const $ = cheerio.load(res.text);
  return $('[name=_csrf]').val();
};

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
        .expect(302)
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
        .expect(302)
        .end(done);
    });
  });
});
