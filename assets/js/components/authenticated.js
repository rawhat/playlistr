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
            if(this.props.loading) return <p>Loading...</p>;
            return this.props.authStatus === authStatus
                ? <WrappedComponent {...this.props} />
                : <Redirect to={authStatus ? '/login' : '/'} />;
        };
    }

    const mapStateToProps = state => ({
        authStatus: state.auth.authStatus,
        loading: state.auth.isLoading,
        user: state.auth.user,
    });

    return connect(mapStateToProps, { authCheck: doAuthCheck })(App);
};

export default withAuthentication;
