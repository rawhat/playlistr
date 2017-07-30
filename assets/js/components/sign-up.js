import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { doSignup } from '../ducks/authentication';

class SignUp extends Component {
    static propTypes = {
        signup: PropTypes.func,
        error: PropTypes.string,
    };

    signUp = () => {
        let username = this.username.value;
        let email = this.email.value;
        let password = this.password.value;
        let password_repeat = this.password_repeat.value;

        this.props.signup(username, email, password, password_repeat);
    };

    render = () => {
        return (
            <div
                className="col-md-6 col-md-offset-3 col-sm-6 col-sm-offset-3"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100vh',
                }}
            >
                <div
                    className="panel"
                    style={{ width: '100%', textAlign: 'center' }}
                >
                    <h2>Sign Up</h2>
                    <div>
                        <div className="row">
                            <label style={{ width: '50%' }}>
                                Username
                                <input
                                    className="form-control"
                                    type="text"
                                    ref={username => (this.username = username)}
                                />
                            </label>
                        </div>
                        <div className="row">
                            <label style={{ width: '50%' }}>
                                Email
                                <input
                                    className="form-control"
                                    type="text"
                                    ref={email => (this.email = email)}
                                />
                            </label>
                        </div>
                        <div className="row">
                            <label style={{ width: '50%' }}>
                                Password
                                <input
                                    className="form-control"
                                    type="password"
                                    ref={password => (this.password = password)}
                                />
                            </label>
                        </div>
                        <div className="row">
                            <label style={{ width: '50%' }}>
                                Repeat password
                                <input
                                    className="form-control"
                                    type="password"
                                    ref={password =>
                                        (this.password_repeat = password)}
                                />
                            </label>
                        </div>
                        {this.props.error
                            ? <p className="bg-danger">
                                  {this.props.error}
                              </p>
                            : null}
                        <div className="row">
                            <button
                                className="btn btn-primary"
                                onClick={this.signUp}
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
}

const mapStateToProps = state => ({
    error: state.auth.signupAuthError,
});

export default connect(mapStateToProps, { signup: doSignup })(SignUp);
