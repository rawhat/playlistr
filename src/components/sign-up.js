import React, { Component } from 'react';
import axios from 'axios';

class SignUp extends Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
        };
    }

    signUp = async () => {
        let username = this.username.value;
        let email = this.email.value;
        let password = this.password.value;
        let password_repeat = this.password_repeat.value;

        this.setState({
            error: null,
        });

        try {
            let results = await axios.post('/sign-up', {
                username,
                email,
                password,
                password_repeat,
            });
            this.props.authenticate(results.data.user);
        } catch (err) {
            let msg = err.response.data.error;
            this.setState({
                error: msg,
            });
        }
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
                                    ref={username => this.username = username}
                                />
                            </label>
                        </div>
                        <div className="row">
                            <label style={{ width: '50%' }}>
                                Email
                                <input
                                    className="form-control"
                                    type="text"
                                    ref={email => this.email = email}
                                />
                            </label>
                        </div>
                        <div className="row">
                            <label style={{ width: '50%' }}>
                                Password
                                <input
                                    className="form-control"
                                    type="password"
                                    ref={password => this.password = password}
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
                                        this.password_repeat = password}
                                />
                            </label>
                        </div>
                        {this.state.error
                            ? <p className="bg-danger">{this.state.error}</p>
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

export default SignUp;
