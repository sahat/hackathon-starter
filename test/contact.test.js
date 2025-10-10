const { expect } = require('chai');
const sinon = require('sinon');
const request = require('supertest');
const express = require('express');
const session = require('express-session');
const contactController = require('../controllers/contact');

let app;
let sendMailStub;
let fetchStub;
const OLD_ENV = { ...process.env };

function setupApp(controller) {
  const app = express();
  app.use(express.urlencoded({ extended: false }));
  app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));

  // Set a dummy CSRF token for all requests
  app.use((req, res, next) => {
    req.flash = (type, msg) => {
      req.session[type] = msg;
    };
    req.csrfToken = () => 'testcsrf';
    res.render = () => res.status(200).send('Contact Form');
    next();
  });

  app.get('/contact', controller.getContact);
  app.post('/contact', controller.postContact);
  return app;
}

describe('Contact Controller', () => {
  before(() => {
    process.env.SITE_CONTACT_EMAIL = 'test@example.com';
    process.env.RECAPTCHA_SITE_KEY = 'dummy';
    process.env.RECAPTCHA_SECRET_KEY = 'dummy';
  });

  beforeEach(() => {
    // Stub nodemailerConfig.sendMail
    sendMailStub = sinon.stub().resolves();
    // Patch require cache for nodemailerConfig
    const nodemailerConfig = require.cache[require.resolve('../config/nodemailer')];
    if (nodemailerConfig) {
      nodemailerConfig.exports.sendMail = sendMailStub;
    }

    // Stub global fetch for reCAPTCHA
    fetchStub = sinon.stub().resolves({
      json: () => Promise.resolve({ success: true }),
    });
    global.fetch = fetchStub;

    app = setupApp(contactController);
  });

  afterEach(() => {
    sinon.restore();
    if (sendMailStub) sendMailStub.resetHistory();
    delete global.fetch;
  });

  after(() => {
    process.env = OLD_ENV;
  });

  describe('GET /contact', () => {
    it('renders the contact form', (done) => {
      request(app)
        .get('/contact')
        .expect(200)
        .end((err) => {
          if (err) return done(err);
          expect(true).to.be.true; // keep assertion for lint, actual check is above
          done();
        });
    });
  });

  describe('POST /contact', () => {
    it('rejects missing name/email for unknown user', (done) => {
      request(app)
        .post('/contact')
        .type('form')
        .send({ _csrf: 'testcsrf', name: '', email: '', message: 'Hello', 'g-recaptcha-response': 'token' })
        .expect(302)
        .expect('Location', '/contact')
        .end((err) => {
          if (err) return done(err);
          expect(sendMailStub.called).to.be.false;
          done();
        });
    });

    it('rejects missing message', (done) => {
      request(app)
        .post('/contact')
        .type('form')
        .send({ _csrf: 'testcsrf', name: 'Test', email: 'test@example.com', message: '', 'g-recaptcha-response': 'token' })
        .expect(302)
        .expect('Location', '/contact')
        .end((err) => {
          if (err) return done(err);
          expect(sendMailStub.called).to.be.false;
          done();
        });
    });

    it('rejects missing reCAPTCHA', (done) => {
      request(app)
        .post('/contact')
        .type('form')
        .send({ _csrf: 'testcsrf', name: 'Test', email: 'test@example.com', message: 'Hello', 'g-recaptcha-response': '' })
        .expect(302)
        .expect('Location', '/contact')
        .end((err) => {
          if (err) return done(err);
          expect(sendMailStub.called).to.be.false;
          done();
        });
    });

    it('sends email if all fields are valid', (done) => {
      request(app)
        .post('/contact')
        .type('form')
        .send({ _csrf: 'testcsrf', name: 'Test', email: 'test@example.com', message: 'Hello', 'g-recaptcha-response': 'token' })
        .expect(302)
        .expect('Location', '/contact')
        .end((err) => {
          if (err) return done(err);
          expect(sendMailStub.calledOnce).to.be.true;
          done();
        });
    });

    it('handles reCAPTCHA failure', (done) => {
      fetchStub.resolves({ json: () => Promise.resolve({ success: false }) });
      request(app)
        .post('/contact')
        .type('form')
        .send({ _csrf: 'testcsrf', name: 'Test', email: 'test@example.com', message: 'Hello', 'g-recaptcha-response': 'token' })
        .expect(302)
        .expect('Location', '/contact')
        .end((err) => {
          if (err) return done(err);
          expect(sendMailStub.called).to.be.false;
          done();
        });
    });
  });
});
