import React from 'react';
import { connect } from 'react-redux'
import { resetPassword } from '../../actions/auth';
import Messages from '../Messages';

class Reset extends React.Component {
  constructor(props) {
    super(props);
    this.state = { password: '', confirm: '' };
  }

  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  handleReset(event) {
    event.preventDefault();
    this.props.dispatch(resetPassword(this.state.password, this.state.confirm, this.props.params.token));
  }

  render() {
    return (
      <div className="container">
        <div className="panel">
          <div className="panel-body">
            <Messages messages={this.props.messages}/>
            <form onSubmit={this.handleReset.bind(this)}>
              <legend>Reset Password</legend>
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <input type="password" name="password" id="password" placeholder="New password" className="form-control" autoFocus value={this.state.password} onChange={this.handleChange.bind(this)}/>
              </div>
              <div className="form-group">
                <label htmlFor="confirm">Confirm Password</label>
                <input type="password" name="confirm" id="confirm" placeholder="Confirm password" className="form-control" value={this.state.confirm} onChange={this.handleChange.bind(this)}/>
              </div>
              <div className="form-group">
                <button type="submit" className="btn btn-success">Change Password</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return state;
};

export default connect(mapStateToProps)(Reset);

