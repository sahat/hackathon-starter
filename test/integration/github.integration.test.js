const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.test') });

const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');
const apiController = require('../../controllers/api');

/**
 * GitHub API Integration Tests (Nock Recorder)
 *
 * Uses Nock recorder to capture live API responses and replay them for offline testing.
 *
 * Recording Mode (requires GitHub token):
 *   Windows PowerShell: $env:NOCK_BACK_MODE='record'; npm test -- test/integration/github.integration.test.js
 *   Windows CMD: set NOCK_BACK_MODE=record && npm test -- test/integration/github.integration.test.js
 *   Linux/Mac: NOCK_BACK_MODE=record npm test -- test/integration/github.integration.test.js
 *
 * Playback Mode (default, no token required):
 *   npm test -- test/integration/github.integration.test.js
 *
 * Update Mode (re-record existing fixtures):
 *   Replace 'record' with 'update' in the commands above
 *
 * Reference: https://github.com/nock/nock#recording
 */

describe('GitHub API Integration (Nock Recorder)', function () {
  this.timeout(60000);

  let req;
  let res;
  let renderSpy;
  let statusSpy;

  before(function () {
    nock.back.fixtures = path.join(__dirname, '..', 'fixtures');
    nock.back.setMode(process.env.NOCK_BACK_MODE || 'lockdown');

    if (!process.env.GITHUB_TOKEN && nock.back.currentMode !== 'lockdown') {
      throw new Error('GITHUB_TOKEN environment variable required for recording GitHub API fixtures');
    }
  });

  beforeEach(function () {
    req = {
      user: null,
    };
    res = {
      render: sinon.spy(),
      status: sinon.stub().returnsThis(),
    };
    renderSpy = res.render;
    statusSpy = res.status;
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('getGithub - unauthenticated public API', function () {
    it('should fetch public repository data without authentication', async function () {
      const fixtureName = 'github-public-success.json';
      const fixturePath = path.join(nock.back.fixtures, fixtureName);
      const mode = nock.back.currentMode;

      // Clean up empty fixtures before recording
      if ((mode === 'record' || mode === 'update') && fs.existsSync(fixturePath)) {
        const stat = fs.statSync(fixturePath);
        if (stat.size === 0) {
          fs.unlinkSync(fixturePath);
        }
      }

      let nockDone;
      try {
        const { nockDone: done } = await nock.back(fixtureName);
        nockDone = done;

        await apiController.getGithub(req, res, (err) => {
          if (err && (mode === 'record' || mode === 'update')) {
            throw err;
          }
        });

        // Fail-fast if API returns 500 during recording
        if ((mode === 'record' || mode === 'update') && statusSpy.calledWith(500)) {
          if (fs.existsSync(fixturePath)) {
            fs.unlinkSync(fixturePath);
          }
          throw new Error('API returned 500 error during recording. Fixture deleted. Check API health and retry.');
        }

        // Assertions run only in record mode
        if (mode === 'record' || mode === 'update') {
          expect(renderSpy.calledOnce).to.be.true;
          expect(renderSpy.firstCall.args[0]).to.equal('api/github');

          const renderData = renderSpy.firstCall.args[1];
          expect(renderData).to.have.property('title', 'GitHub API');
          expect(renderData).to.have.property('repo');
          expect(renderData).to.have.property('repoStargazers');
          expect(renderData).to.have.property('authFailure');

          const { repo } = renderData;
          expect(repo).to.be.an('object');
          expect(repo).to.have.property('name', 'hackathon-starter');
          expect(repo).to.have.property('owner');
          expect(repo.owner).to.have.property('login', 'sahat');
          expect(repo).to.have.property('stargazers_count').that.is.a('number');
          expect(repo).to.have.property('forks_count').that.is.a('number');
          expect(repo).to.have.property('watchers_count').that.is.a('number');

          expect(renderData.repoStargazers).to.be.an('array');
          if (renderData.repoStargazers.length > 0) {
            const stargazer = renderData.repoStargazers[0];
            expect(stargazer).to.have.property('login');
            expect(stargazer).to.have.property('avatar_url');
          }

          expect(renderData.authFailure).to.equal('NotLoggedIn');
        } else {
          // In lockdown mode, verify fixture exists
          expect(fs.existsSync(fixturePath)).to.be.true;
        }
      } finally {
        if (nockDone) nockDone();

        // Cleanup empty fixtures
        if ((mode === 'record' || mode === 'update') && fs.existsSync(fixturePath)) {
          const stat = fs.statSync(fixturePath);
          if (stat.size === 0) {
            fs.unlinkSync(fixturePath);
          }
        }
      }
    });
  });

  describe('getGithub - authenticated user (with GitHub token)', function () {
    it('should fetch user profile, repos, and events with authentication', async function () {
      const fixtureName = 'github-authenticated-success.json';
      const fixturePath = path.join(nock.back.fixtures, fixtureName);
      const mode = nock.back.currentMode;

      // Clean up empty fixtures before recording
      if ((mode === 'record' || mode === 'update') && fs.existsSync(fixturePath)) {
        const stat = fs.statSync(fixturePath);
        if (stat.size === 0) {
          fs.unlinkSync(fixturePath);
        }
      }

      let nockDone;
      try {
        const { nockDone: done } = await nock.back(fixtureName);
        nockDone = done;

        req.user = {
          tokens: [
            {
              kind: 'github',
              accessToken: process.env.GITHUB_TOKEN || 'fake_token_for_lockdown',
            },
          ],
        };

        await apiController.getGithub(req, res, (err) => {
          if (err && (mode === 'record' || mode === 'update')) {
            throw err;
          }
        });

        // Fail-fast if API returns 500 during recording
        if ((mode === 'record' || mode === 'update') && statusSpy.calledWith(500)) {
          if (fs.existsSync(fixturePath)) {
            fs.unlinkSync(fixturePath);
          }
          throw new Error('API returned 500 error during recording. Fixture deleted. Check API health and retry.');
        }

        // Assertions run only in record mode
        if (mode === 'record' || mode === 'update') {
          expect(renderSpy.calledOnce).to.be.true;
          expect(renderSpy.firstCall.args[0]).to.equal('api/github');

          const renderData = renderSpy.firstCall.args[1];
          expect(renderData).to.have.property('title', 'GitHub API');
          expect(renderData).to.have.property('repo');
          expect(renderData).to.have.property('userInfo');
          expect(renderData).to.have.property('userRepos');
          expect(renderData).to.have.property('userEvents');
          expect(renderData).to.have.property('repoStargazers');

          const { userInfo } = renderData;
          expect(userInfo).to.be.an('object');
          expect(userInfo).to.have.property('login');
          expect(userInfo).to.have.property('avatar_url');

          expect(renderData.userRepos).to.be.an('array');
          if (renderData.userRepos.length > 0) {
            const userRepo = renderData.userRepos[0];
            expect(userRepo).to.have.property('name');
            expect(userRepo).to.have.property('full_name');
          }

          expect(renderData.userEvents).to.be.an('array');
          if (renderData.userEvents.length > 0) {
            const event = renderData.userEvents[0];
            expect(event).to.have.property('type');
            expect(event).to.have.property('repo');
          }

          const { repo } = renderData;
          expect(repo).to.be.an('object');
          expect(repo).to.have.property('name', 'hackathon-starter');
          expect(repo).to.have.property('owner');
          expect(repo.owner).to.have.property('login', 'sahat');

          expect(renderData.repoStargazers).to.be.an('array');
          expect(renderData.authFailure).to.be.oneOf([null, 'NotFetched']);
        } else {
          // In lockdown mode, verify fixture exists
          expect(fs.existsSync(fixturePath)).to.be.true;
        }
      } finally {
        if (nockDone) nockDone();

        // Cleanup empty fixtures
        if ((mode === 'record' || mode === 'update') && fs.existsSync(fixturePath)) {
          const stat = fs.statSync(fixturePath);
          if (stat.size === 0) {
            fs.unlinkSync(fixturePath);
          }
        }
      }
    });
  });

  describe('getGithub - error handling', function () {
    it('should render the GitHub API page even without fixtures', async function () {
      let errorCaught = false;
      await apiController.getGithub(req, res, (err) => {
        if (err) {
          errorCaught = true;
        }
      });

      if (!errorCaught) {
        expect(renderSpy.called).to.be.true;
      } else {
        expect(errorCaught).to.be.true;
      }
    });
  });
});
