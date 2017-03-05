export function getApplicants() {
  return fetch('/api/org/applicants', {
    method: 'get'
  }).then((response) => {
    return response.json().then((json) => {
      return json;
    });
  });  

}
