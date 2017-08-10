import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Redirect } from 'react-router';

import { doAuthCheck } from '../ducks/authentication';

const withAuthentication = authStatus => WrappedComponent => {
    class App extends Component {
        static propTypes = {
            error: PropTypes.bool,
            authCheck: PropTypes.func,
            authStatus: PropTypes.bool,
            redirect: PropTypes.func
        };

        componentWillMount() {
            this.props.authCheck();
        }

        render = () => {
            return this.props.authStatus === authStatus
                ? <WrappedComponent {...this.props} />
                : <Redirect to={authStatus ? '/login' : '/'} />;
        };
    }

    const mapStateToProps = state => ({
        user: state.auth.user,
        authStatus: state.auth.authStatus
    });

    return connect(mapStateToProps, { authCheck: doAuthCheck })(App);
};

export default withAuthentication;
