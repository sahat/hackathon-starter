import 'isomorphic-fetch'
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock from 'fetch-mock';
import { expect } from 'chai';
import * as actions from '../../../app/actions/contact';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('contact actions', () => {
  afterEach(() => {
    fetchMock.restore();
  });

  it('creates CONTACT_FORM_SUCCESS action when form is submitted', () => {
    fetchMock.mock('/contact', 'POST', {
      body: { msg: 'Thank you! Your feedback has been submitted.' }
    });

    const expectedActions = [
      { type: 'CLEAR_MESSAGES' },
      { type: 'CONTACT_FORM_SUCCESS', messages: [{ msg: 'Thank you! Your feedback has been submitted.' }] }
    ];

    const store = mockStore({});

    return store.dispatch(actions.submitContactForm())
      .then(() => {
        expect(store.getActions()).to.deep.equal(expectedActions);
      });
  });
});
