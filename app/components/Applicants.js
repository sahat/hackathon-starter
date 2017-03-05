import React from 'react';
import { connect } from 'react-redux'
import { updateProfile, changePassword, deleteAccount } from './../actions/auth';
import { link, unlink } from './../actions/oauth';
import Messages from './Messages';
import { getApplicants } from './../actions/applicants';

class Applicants extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      applicants: []
    };
  }

  componentDidMount() {
    let self = this;

    console.log(self.state);

    getApplicants(this.props.user).then((applicants) => {
      self.setState({
        applicants: applicants
      });
      console.log(self.state);
    });

  }

  render() {

    return (
      <div className="container">
        <div className="panel">
          <div className="panel-body">
            <Messages messages={this.props.messages}/>

          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    token: state.auth.token,
    user: state.auth.user,
    messages: state.messages
  };
};

export default connect(mapStateToProps)(Applicants);
