import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import NavBar from './components/navbar';
import Main from './components/main';
import Login from './components/login';
import SignUp from './components/sign-up';
import Profile from './components/profile';
import withAuth from './components/authenticated';

const App = () => (
    <Router>
        <div>
            <NavBar />
            <div id="top-section">
                <Switch>
                    <Route exact path="/" component={withAuth(true)(Main)} />
                    <Route path="/login" component={withAuth(false)(Login)} />
                    <Route
                        path="/sign-up"
                        component={withAuth(false)(SignUp)}
                    />
                    <Route
                        exact
                        path="/profile/:username"
                        component={withAuth(true)(Profile)}
                    />
                    <Route render={() => <h2>Path not found.</h2>} />
                </Switch>
            </div>
        </div>
    </Router>
);

// class App extends React.Component {
//     componentDidMount = () => {
//         console.log('attempting to connect');
//         this.socket = new Socket('/socket');
//         this.socket.connect();

//         this.lobby = this.socket.channel('playlists:lobby');
//         this.lobby.join().receive('ok', () => {
//             console.log('connected to lobby!');
//         });
//     };

//     render = () => {
//         return (
//             <Router>
//                 <div>
//                     <NavBar />
//                     <div id="top-section">
//                         <Switch>
//                             <Route
//                                 exact
//                                 path="/"
//                                 component={withAuth(true)(Main)}
//                             />
//                             <Route
//                                 path="/login"
//                                 component={withAuth(false)(Login)}
//                             />
//                             <Route
//                                 path="/sign-up"
//                                 component={withAuth(false)(SignUp)}
//                             />
//                             <Route
//                                 exact
//                                 path="/profile/:username"
//                                 component={withAuth(true)(Profile)}
//                             />
//                             <Route render={() => <h2>Path not found.</h2>} />
//                         </Switch>
//                     </div>
//                 </div>
//             </Router>
//         );
//     };
// }

export default App;
