import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import axios from 'axios';

const withAuthentication = (authStatus) => (redirectionPath) => (WrappedComponent) => {
    class App extends Component {
        constructor(props) {
            super(props);
            this.state = {
                authenticated: false,
                user: null
            };
        }

        componentDidMount = async () => {
            await this.authenticate();
        }

        authenticate = async () => {
            try {
                let res = await this.isAuthenticated();
                this.setState({ authenticated: true, user: res.data });
            }
            catch (err) {
                this.setState({ authenticated: false, user: null });
            }
        }

        isAuthenticated = async () => {
            let res = await axios.get('/authenticated');
            return res;
        }

        render = () => {
            return (this.state.authenticated === authStatus) ? <Redirect to={redirectionPath} /> : <WrappedComponent {...this.props} user={this.state.user} authenticate={this.authenticate} />;
        }
    }

    return App;
};

export default withAuthentication;