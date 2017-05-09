import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import axios from 'axios';

class Login extends Component {
    login = async () => {
        let username = this.username.value;
        let password = this.password.value;

        let results = await axios.post('/login', {
            username,
            password
        });
        switch(results.status) {
            case 200: {
                this.props.authenticate(results.data.user);
                break;
            }
        }
    }

    render = () => {
        return (
            <div
                className="col-md-6 col-md-offset-3 col-sm-6 col-sm-offset-3"
                style={{ display: 'flex', alignItems: 'center', height: '100vh' }}>
                <div className="panel" style={{ width: '100%', textAlign: 'center' }}>
                    <h2>Login</h2>
                    <div>
                        <div className="row">
                            <label>
                                Username
                                <input className='form-control' type="text" ref={(username) => this.username = username} />
                            </label>
                        </div>
                        <div className="row">
                            <label>
                                Password
                                <input className='form-control' type="password" ref={(password => this.password = password)} />
                            </label>
                        </div>
                        <div className="row">
                            <button className="btn btn-primary" onClick={this.login}>Login</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(Login);