import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux'
import { signup } from '../../actions/auth';
import { facebookLogin, twitterLogin, googleLogin } from '../../actions/oauth';
import { getOrgInfo } from '../../actions/orgInfo'
import Messages from '../Messages';

class Signup extends React.Component {
  constructor(props) {
    super(props);
    props.dispatch(getOrgInfo());
  }

  componentWillReceiveProps(nextProps) {
    this.orgInfo = nextProps.orgInfo;
  }

  handleFacebook() {
    this.props.dispatch(facebookLogin())
  }

  handleTwitter() {
    this.props.dispatch(twitterLogin())
  }

  handleGoogle() {
    this.props.dispatch(googleLogin())
  }

  render() {
    const { orgAddress, orgLogo, orgMission, orgName, orgPhone, orgWebsite } = this.orgInfo;

    return (
      <div className="login-container container">
        <div className="row">
          <div className="col-md-8">
            <h3>{orgName}</h3>
            <img className="org-logo" src={orgLogo} alt="orgLogo" />
              <p className="mission"><strong>Mission: </strong>{orgMission}</p>
              <p className="contact"><strong>Contact Information:</strong></p>
                <ul className="org-info">
                  <li>Phone: {orgPhone}</li>
                  <li>Address: {orgAddress}</li>
                  <li>Website: {orgWebsite}</li>
                </ul>
          </div>
          <div className="col-md-4" id="sign-up">
            <h3 className="sign-in-title">Sign in</h3>
            <button onClick={this.handleFacebook.bind(this)} className="btn btn-facebook">Sign in with Facebook</button>
            <button onClick={this.handleTwitter.bind(this)} className="btn btn-twitter">Sign in with Twitter</button>
            <button onClick={this.handleGoogle.bind(this)} className="btn btn-google">Sign in with Google+</button>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    messages: state.messages,
    orgInfo: state.orgInfo
  };
};

export default connect(mapStateToProps)(Signup);
