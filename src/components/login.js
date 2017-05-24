import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import { connect } from 'react-redux';

import { doLogin } from '../ducks/authentication';

class Login extends Component {
    static propTypes = {
        user: PropTypes.object,
        login: PropTypes.func,
        loginAuthError: PropTypes.bool,
    };

    login = async ev => {
        ev.preventDefault();
        let username = this.username.value;
        let password = this.password.value;
        this.props.login(username, password);
    };

    render = () => (
        <div
            className="col-md-6 col-md-offset-3 col-sm-6 col-sm-offset-3"
            style={{
                display: 'flex',
                alignItems: 'center',
                height: 'calc(100vh - 60px)',
            }}
        >
            <div
                className="panel panel-default"
                style={{ width: '100%', textAlign: 'center' }}
            >
                <h2>Login</h2>
                <form
                    className="form-horizontal"
                    style={{ width: '75%', margin: '0 auto' }}
                    onSubmit={this.login}
                >
                    <span
                        className={`form-group ${this.props.loginAuthError ? 'has-error' : ''}`}
                    >
                        <label
                            className="col-sm-2 control-label"
                            htmlFor="form-username"
                        >
                            Username
                        </label>
                        <div className="col-sm-10">
                            <input
                                id="form-username"
                                className="form-control"
                                type="text"
                                ref={username => this.username = username}
                            />
                        </div>
                    </span>
                    <span
                        className={`form-group ${this.props.loginAuthError ? 'has-error' : ''}`}
                    >
                        <label
                            className="col-sm-2 control-label"
                            htmlFor="form-password"
                        >
                            Password
                        </label>
                        <div className="col-sm-10">
                            <input
                                id="form-password"
                                className="form-control"
                                type="password"
                                ref={password => this.password = password}
                            />
                        </div>
                    </span>
                    {this.props.loginAuthError
                        ? <p className="bg-danger">
                              Invalid username or password.
                          </p>
                        : null}
                    <div className="form-group">
                        <button
                            className="btn btn-primary"
                            onClick={this.login}
                        >
                            Login
                        </button>
                        <Link className="btn btn-success" to="/sign-up">
                            Sign Up
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

const mapStateToProps = state => {
    const { isLoading, loginAuthError, user } = state.auth;
    return {
        isLoading,
        loginAuthError,
        user,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        login: (username, password) => dispatch(doLogin(username, password)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Login);
