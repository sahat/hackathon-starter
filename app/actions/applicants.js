export function getApplicants(user) {
  let customHeader = new Headers();
  customHeader.append('isOrg', user.isOrg);
  return fetch('/api/org/applicants', {
    method: 'get',
    headers: customHeader
  }).then((response) => {
    return response.json().then((json) => {
      return json;
    });
  });  

}

export function updateVettRecord(vettRecord, text) {
  return fetch('/api/org/updateVettRecord', {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vettRecord: vettRecord
      })
    }).then((response) => {
      return "success";
    });
  }
}
