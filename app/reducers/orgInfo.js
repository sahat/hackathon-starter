export default function orgInfo (state, action) {
  switch (action.type) {
    case 'ORG_INFO': {
      return action.data.orgInfo || state;
    }
    default:
      return state || {};
  }
};
