import { combineReducers } from 'redux';
import messages from './messages';
import auth from './auth';
import orgInfo from './orgInfo';

export default combineReducers({
  messages,
  auth,
  orgInfo
});
