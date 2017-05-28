import React, { Component } from 'react';
import {
    Overlay,
    Popover,
    FormGroup,
    FormControl,
    InputGroup,
    Button,
} from 'react-bootstrap';
import { connect } from 'react-redux';

import { doFetchPasswordPlaylistByTitle } from '../ducks/playlist';
import {
    doToggleModal,
    doHidePasswordModal,
} from '../ducks/protected-playlist';

class PasswordPlaylist extends Component {
    state = {
        password: null,
    };

    toggleOverlay = () => {
        this.props.toggleModal(this.props.name);
    };

    hideOverlay = () => {
        this.props.hide(this.props.name);
    };

    submitPassword = ev => {
        ev.preventDefault();
        this.props.select(this.props.name, this.state.password);
    };

    render = () => {
        var style = this.props.selected ? { backgroundColor: '#375a7f' } : {};
        var glyphicon = this.props.type === 'music'
            ? 'glyphicon-music'
            : 'glyphicon-film';
        return (
            <div ref={overlayTarget => this.overlayTarget = overlayTarget}>
                <button
                    onClick={this.toggleOverlay}
                    style={style}
                    type="button"
                    className="list-group-item playlist-selector"
                    id={this.props.name}
                    ref={playlistButton => this.playlistButton = playlistButton}
                >
                    {this.props.name}
                    <div className="pull-right">
                        <span
                            className="glyphicon glyphicon-lock"
                            style={{ paddingRight: 5 }}
                        />
                        <span className={'glyphicon ' + glyphicon} />
                    </div>
                </button>
                <Overlay
                    rootClose
                    show={
                        this.props.displayModal &&
                            this.props.title === this.props.name
                    }
                    onHide={this.hideOverlay}
                    placement="right"
                    containerPadding={20}
                    target={this.playlistButton}
                    ref={overlay => this.overlay = overlay}
                >
                    <Popover
                        id="playlist-password-overlay"
                        title="Playlist password"
                    >
                        <FormGroup
                            validationState={
                                this.props.error &&
                                    this.props.title === this.props.name
                                    ? 'error'
                                    : null
                            }
                            onSubmit={this.submitPassword}
                        >
                            <InputGroup>
                                <FormControl
                                    type="text"
                                    id="password-overlay"
                                    onChange={ev =>
                                        this.setState({
                                            password: ev.target.value,
                                        })}
                                />
                                <InputGroup.Button>
                                    <Button
                                        type="submit"
                                        bsStyle="success"
                                        onClick={this.submitPassword}
                                    >
                                        Access
                                    </Button>
                                </InputGroup.Button>
                            </InputGroup>
                        </FormGroup>
                    </Popover>
                </Overlay>
            </div>
        );
    };
}
PasswordPlaylist.propTypes = {
    name: React.PropTypes.string,
    type: React.PropTypes.string,
    selected: React.PropTypes.bool,
    playlistSelector: React.PropTypes.func,
    hasPassword: React.PropTypes.bool,
    playlistPasswordError: React.PropTypes.bool,
    selectProtectedPlaylist: React.PropTypes.func,
};

const mapStateToProps = state => {
    return {
        error: state.protectedPlaylist.error,
        title: state.protectedPlaylist.playlistTitle,
        displayModal: state.protectedPlaylist.displayModal,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        select: (title, password) =>
            dispatch(doFetchPasswordPlaylistByTitle(title, password)),
        toggleModal: title => dispatch(doToggleModal(title)),
        hide: title => dispatch(doHidePasswordModal(title)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(PasswordPlaylist);
