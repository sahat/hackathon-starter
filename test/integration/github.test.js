const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');
const { getGithub } = require('../../controllers/api');

describe('Github controller integration tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: {
        tokens: [{ kind: 'github', accessToken: 'random-token' }],
      },
    };
    res = {
      render: sinon.spy(),
    };
    next = sinon.spy();
    nock.disableNetConnect();
    mockAllGithubEndpoints();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('should render the github API view', async () => {
    await getGithub(req, res, next);

    expect(res.render.calledOnce).to.be.true;
    expect(res.render.firstCall.args[0]).to.equal('api/github');
  });

  it('should fetch and display user information', async () => {
    await getGithub(req, res, next);
    const data = res.render.firstCall.args[1];

    expect(data.userInfo.login).to.equal('octocat');
    expect(data.userInfo.name).to.equal('The Octocat');
  });

  it('should fetch and display repository information', async () => {
    await getGithub(req, res, next);
    const data = res.render.firstCall.args[1];

    expect(data.repo.name).to.equal('hackathon-starter');
    expect(data.repo.id).to.equal(999);
  });

  it('should fetch and display repository stargazers', async () => {
    await getGithub(req, res, next);
    const data = res.render.firstCall.args[1];

    expect(data.repoStargazers).to.have.lengthOf(2);
    expect(data.repoStargazers[0].login).to.equal('starUser');
  });

  it('should set authFailure to NotGitHubAuthorized when no token exists', async () => {
    req.user = { tokens: [] };

    await getGithub(req, res, next);
    const data = res.render.firstCall.args[1];

    expect(data.authFailure).to.equal('NotGitHubAuthorized');
  });

  function mockAllGithubEndpoints() {
    const apiBase = 'https://api.github.com';

    // GET /user - for userInfo
    nock(apiBase).get('/user').reply(200, { login: 'octocat', name: 'The Octocat' });

    // GET /user/repos?per_page=10 - for listForAuthenticatedUser
    nock(apiBase)
      .get('/user/repos')
      .query({ per_page: 10 })
      .reply(200, [
        { id: 1, name: 'repo1', stargazers_count: 10 },
        { id: 2, name: 'repo2', stargazers_count: 5 },
      ]);

    // GET /users/octocat/events?per_page=10 - for listEventsForAuthenticatedUser
    nock(apiBase)
      .get('/users/octocat/events')
      .query({ per_page: 10 })
      .reply(200, [{ id: 123, type: 'PushEvent' }]);

    // GET /repos/sahat/hackathon-starter - for repos.get
    nock(apiBase)
      .get('/repos/sahat/hackathon-starter')
      .reply(200, {
        id: 999,
        name: 'hackathon-starter',
        stargazers_count: 42,
        owner: { login: 'sahat' },
      });

    // GET /repos/sahat/hackathon-starter/stargazers?per_page=10 - for listStargazersForRepo
    nock(apiBase)
      .get('/repos/sahat/hackathon-starter/stargazers')
      .query({ per_page: 10 })
      .reply(200, [
        { id: 555, login: 'starUser' },
        { id: 556, login: 'anotherStar' },
      ]);
  }
});
