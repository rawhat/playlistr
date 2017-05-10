import React, { Component } from 'react';
import { render } from 'react-dom';
import axios from 'axios';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Redirect
} from 'react-router-dom';

import NavBar from './navbar';
import Main from './main';
import Login from './login';
import SignUp from './sign-up';
import Profile from './profile';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            authenticated: false,
            user: null
        };
    }

    componentWillMount = async () => {
        await this.authenticate();
    }

    authenticate = async () => {
        let res = await this.isAuthenticated();
        if(res.status !== 401) {
            this.setState({ authenticated: true, user: res.data });
        }
    }

    isAuthenticated = async () => {
        let res = await axios.get('/authenticated');
        return res;
        // if(res.status !== 401) {
        //     this.setState({
        //         authenticated: true
        //     });
        // }
    }

    render = () => {
        return (
            <Router>
                <div>
                    <NavBar user={this.state.user} />
                    <Switch>
                        <Route exact path="/" render={(props) => {
                            return !this.state.authenticated ? <Redirect to={'/login'} /> : <Main {...props} user={this.state.user} />;
                        }} />
                        <Route path="/login" render={(props) => {
                            return this.state.authenticated ? <Redirect to={'/'} /> : <Login {...props} authenticate={this.authenticate} />;
                        }}/>
                        <Route path="/sign-up" render={(props) => {
                            return this.state.authenticated ? <Redirect to={'/'} /> : <SignUp {...props} authenticate={this.authenticate} />;
                        }}/>
                        <Route exact path="/profile/:username" render={(props) => {
                            return !this.state.authenticated ? <Redirect to={'/login'} /> : <Profile {...props} username={this.state.user} />;
                        }}/>
                        <Route render={() => <h2>Path not found.</h2>} />
                    </Switch>
                </div>
            </Router>
        );
    }
}

render(<App />, document.getElementById('main-panel'));