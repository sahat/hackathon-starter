import React from 'react';
import { connect } from 'react-redux';
import Messages from './Messages';
import VolunteerForm from './VolunteerForm.react';

class Home extends React.Component {
  //TODO: the volunteer form should be rendered after a user selects a volunteer role to apply for.
  render() {
    return (
      <div className="container-fluid">
        <Messages messages={this.props.messages}/>
        <div className="row">
          <VolunteerForm iframe='iframe' src="https://form.jotform.com/70626599389172" height="600" width="700"/>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    messages: state.messages
  };
};

export default connect(mapStateToProps)(Home);
