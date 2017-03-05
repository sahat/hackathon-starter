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

export function updateVettRecord(vettRecord, performer) {
  let customHeader = new Headers();
  customHeader.append('isOrg', performer.isOrg);
  customHeader.append('Content-Type', 'application/json');
  console.error("UPDATE");
  console.error(vettRecord);
  return fetch('/api/org/updateVettRecord', {
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
