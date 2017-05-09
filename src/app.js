import React, { Component } from 'react';
import { render } from 'react-dom';
import { 
    BrowserRouter as Router,
    Route,
    Redirect
} from 'react-router-dom';

import Main from './main';
import Login from './login';
import SignUp from './sign-up';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            authenticated: false,
            user: null
        };
    }

    authenticate = (user) => {
        this.setState({
            authenticated: true,
            user
        });
    }

    render = () => {
        return (
            <Router>
                <div>
                    <Route exact path="/" render={() => !this.state.authenticated ? <Redirect to={'/login'} /> : <Main />} />
                    <Route path="/login" render={() => this.state.authenticated ? <Redirect to={'/'} /> : <Login authenticate={this.authenticate} />} />
                    <Route path="/sign-up" render={() => this.state.authenticated ? <Redirect to={'/'} /> : <SignUp authenticate={this.authenticate} />} />
                </div>
            </Router>
        );
    }
}

render(<App />, document.getElementById('main-panel'));