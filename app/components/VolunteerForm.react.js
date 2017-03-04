import React from 'react';

function VolunteerForm (props) {
  var Iframe = props.iframe;
  return (
    <Iframe src={props.src} height={props.height} width={props.width}/>
  );
}

export default VolunteerForm;
