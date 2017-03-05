export function getApplicants(user, approvedOnly) {
  let customHeader = new Headers();
  customHeader.append('isorg', user.isOrg);
  return fetch(approvedOnly ? 'api/approved' : 'api/applicants', {
    method: 'post',
    headers: customHeader
  }).then((response) => {
    return response.json().then((json) => {
      return json;
    });
  });  

}

export function updateVettRecord(vettRecord, performer) {
  let customHeader = new Headers();
  customHeader.append('isorg', performer.isOrg);
  customHeader.append('Content-Type', 'application/json');
  console.error("UPDATEFRONT");
  console.error(vettRecord);
  return fetch('api/updateVettRecord', {
      method: 'post',
      headers: customHeader,
      body: JSON.stringify({
        vettRecord: vettRecord
      })
    }).then((response) => {
      console.log(response);
      return "success";
    });
  }
