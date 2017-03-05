export const receiveOrgInfo = orgInfo => ({ type: 'ORG_INFO', data: orgInfo });

export const getOrgInfo = () => (
  dispatch => (
    fetch('/orgInfo', {
      credentials: 'same-origin'
    })
    .then(res => res.json())
    .then(orgInfo => dispatch(receiveOrgInfo(orgInfo)))
    .catch(err => dispatch(error(err)))
  )
);