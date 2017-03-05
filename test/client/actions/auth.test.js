import 'isomorphic-fetch'
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock from 'fetch-mock';
import { expect } from 'chai';
import { login, __RewireAPI__ as AuthActionsRewireAPI } from '../../../app/actions/auth';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('auth actions', () => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJteS5kb21haW4uY29tIiwic3ViIjoiMTIzNDU2Nzg5MCIsImlhdCI6IjE0NjMyNTU0MjYiLCJleHAiOiIxNDYzODYxMjIyIn0.Cchy4zAn7-mPdUu1BXzeIG8x3cvQztszI2faWGETTEE';
  const user = {
    id: '01234567890',
    name: 'John Doe',
    email: 'john@gmail.com',
    location: 'San Francisco'
  };

  afterEach(() => {
    fetchMock.restore();
  });

  it('creates LOGIN_SUCCESS action when login form is submitted', () => {
    fetchMock.mock('/login', 'POST', { token, user });

    AuthActionsRewireAPI.__Rewire__('browserHistory', []);

    const expectedActions = [
      { type: 'CLEAR_MESSAGES' },
      { type: 'LOGIN_SUCCESS', token: token, user: user }];

    const store = mockStore({});

    return store.dispatch(login()).then(() => {
      expect(store.getActions()).to.deep.equal(expectedActions);
    });
  });
});
