import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Button, Modal } from 'react-bootstrap';

const ModalHeader = Modal.Header;
const ModalBody = Modal.Body;
const ModalFooter = Modal.Footer;

import PlaylistForm from './playlist-form';

import {
    doCreatePlaylist,
    doShowCreatePlaylistModal,
    doHideCreatePlaylistModal,
} from '../ducks/playlist';

class PlaylistCreator extends Component {
    constructor(props) {
        super(props);

        this.state = {
            playlistName: '',
            playlistCategory: '',
            playlistPassword: '',
            playlistOpenSubmissions: true,
            playlistType: 'music',
            hasError: false,
            nameTaken: false,
        };
    }

    static propTypes = {
        createPlaylist: PropTypes.func,
        showModal: PropTypes.func,
        creatingPlaylist: PropTypes.bool,
        hideModal: PropTypes.func,
        createPlaylistError: PropTypes.bool,
    };

    createPlaylist = ev => {
        ev.preventDefault();

        this.props.createPlaylist(
            this.state.playlistName,
            this.state.playlistCategory,
            this.state.playlistPassword,
            this.state.playlistOpenSubmissions,
            this.state.playlistType
        );
    };

    onUserInput = (name, category, password, open, type) => {
        this.setState({
            playlistName: name,
            playlistCategory: category,
            playlistPassword: password,
            playlistOpenSubmissions: open,
            playlistType: type,
        });
    };

    render = () => {
        var alertArea = this.state.nameTaken
            ? <div className="alert-danger">Playlist name already taken.</div>
            : null;
        return (
            <div>
                <Button
                    bsStyle="primary"
                    onClick={this.props.showModal}
                    style={{
                        width: '80%',
                        left: '10%',
                        position: 'relative',
                        marginBottom: '10px',
                    }}
                >
                    Create Playlist
                </Button>

                <Modal
                    show={this.props.creatingPlaylist}
                    onHide={this.props.hideModal}
                >
                    <ModalHeader closeButton>Create New Playlist</ModalHeader>
                    <ModalBody>
                        <PlaylistForm
                            hasError={this.props.createPlaylistError}
                            createPlaylist={this.createPlaylist}
                            onUserInput={this.onUserInput}
                            playlistName={this.state.playlistName}
                            playlistCategory={this.state.playlistCategory}
                            playlistPassword={this.state.playlistPassword}
                            playlistOpenSubmissions={
                                this.state.playlistOpenSubmissions
                            }
                            playlistType={this.state.playlistType}
                        />
                    </ModalBody>
                    <ModalFooter>
                        {alertArea}
                    </ModalFooter>
                </Modal>
            </div>
        );
    };
}

const mapStateToProps = state => ({
    createPlaylistError: state.playlist.createPlaylistError,
    creatingPlaylist: state.playlist.creatingPlaylist,
    createdPlaylist: state.playlist.playlistCreated,
});

export default connect(mapStateToProps, {
    createPlaylist: doCreatePlaylist,
    showModal: doShowCreatePlaylistModal,
    hideModal: doHideCreatePlaylistModal,
})(PlaylistCreator);
