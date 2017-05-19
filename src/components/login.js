import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

import { connect } from 'react-redux';

import { doLogin } from '../ducks/authentication';

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            error: false
        };
    }

    login = async (ev) => {
        ev.preventDefault();
        let username = this.username.value;
        let password = this.password.value;
        this.props.login(username, password);
        // this.setState({
        //     error: false
        // });

        // let username = this.username.value;
        // let password = this.password.value;

        // try {
        //     let results = await axios.post('/login', {
        //         username,
        //         password
        //     });
            
        //     this.props.authenticate(results.data.user);
        // }
        // catch(err) {
        //     this.setState({
        //         error: true
        //     });
        // }
    }

    render = () => {
        return (
            <div
                className="col-md-6 col-md-offset-3 col-sm-6 col-sm-offset-3"
                style={{ display: 'flex', alignItems: 'center', height: '100vh' }}>
                <div className="panel panel-default" style={{ width: '100%', textAlign: 'center' }}>
                    <h2>Login</h2>
                    <form className='form-horizontal' style={{ width: '75%', margin: '0 auto'}} onSubmit={this.login}>
                        <span className={`form-group ${this.state.error ? 'has-error' : ''}`}>
                            <label className='col-sm-2 control-label' htmlFor='form-username'>Username</label>
                            <div className="col-sm-10">
                                <input id='form-username' className='form-control' type="text" ref={(username) => this.username = username} />
                            </div>
                        </span>
                        <span className={`form-group ${this.state.error ? 'has-error' : ''}`}>
                            <label className='col-sm-2 control-label' htmlFor='form-password'>Password</label>
                            <div className="col-sm-10">
                                <input id='form-password' className='form-control' type="password" ref={(password => this.password = password)} />
                            </div>
                        </span>
                        {this.state.error ? <p className='bg-danger'>Invalid username or password.</p> : null}
                        <div className="form-group">
                            <button className="btn btn-primary" onClick={this.login}>Login</button>
                            <Link className='btn btn-success' to='/sign-up'>Sign Up</Link>
                        </div>
                    </form>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        ...state.auth
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        login: (username, password) => {
            dispatch(doLogin(username, password));
        }
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Login);