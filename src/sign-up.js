import React, { Component } from 'react';
import axios from 'axios';
import { Redirect, withRouter } from 'react-router';

class SignUp extends Component {
    constructor(props) {
        super(props);
        this.state = {
            authenticated: false
        };
    }
    signUp = async () => {
        let username = this.username.value;
        let email = this.email.value;
        let password = this.password.value;
        let password_repeat = this.password_repeat.value;

        let results = await axios.post('/sign-up', {
            username,
            email,
            password,
            password_repeat
        });
        switch(results.status) {
            case 203: {
                this.setState({
                    authenticated: true
                });
                break;
            }
        }
    }

    render = () => {
        return (
            this.state.authenticated ?
            <Redirect to={'/'} />
            :
            <div
                className="col-md-6 col-md-offset-3 col-sm-6 col-sm-offset-3"
                style={{ display: 'flex', alignItems: 'center', height: '100vh' }}>
                <div className="panel" style={{ width: '100%', textAlign: 'center' }}>
                    <h2>Sign Up</h2>
                    <div>
                        <div className="row">
                            <label style={{ width: '50%' }}>
                                Username
                                <input className='form-control' type="text" ref={(username) => this.username = username} />
                            </label>
                        </div>
                        <div className="row">
                            <label style={{ width: '50%' }}>
                                Email
                                <input className='form-control' type="text" ref={(email => this.email = email)} />
                            </label>
                        </div>
                        <div className="row">
                            <label style={{ width: '50%' }}>
                                Password
                                <input className='form-control' type="password" ref={(password => this.password = password)} />
                            </label>
                        </div>
                        <div className="row">
                            <label style={{ width: '50%' }}>
                                Repeat password
                                <input className='form-control' type="password" ref={(password => this.password_repeat = password)} />
                            </label>
                        </div>
                        <div className="row">
                            <button className="btn btn-primary" onClick={this.signUp}>Sign Up</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(SignUp);