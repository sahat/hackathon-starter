import { combineReducers } from 'redux';
import messages from './messages';
import auth from './auth';

export default combineReducers({
  messages,
  auth
});
