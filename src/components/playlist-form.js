import React, { Component } from 'react';

import { Form, FormGroup, Col } from 'react-bootstrap';

class PlaylistForm extends Component {
    constructor(props) {
        super(props);
    }

    handleChange = () => {
        this.props.onUserInput(
            this.playlistName.value,
            this.playlistCategory.value,
            this.playlistPassword.value,
            this.playlistOpenSubmissions.checked,
            this.musicPlaylist.checked ? 'music' : 'video'
        );
    };

    render = () => {
        var classname = this.props.hasError ? 'has-error' : '';
        return (
            <Form horizontal>
                <FormGroup className={classname}>
                    <Col md={2}>
                        Title
                    </Col>
                    <Col md={10}>
                        <input
                            type="text"
                            ref={playlistName =>
                                this.playlistName = playlistName}
                            className="form-control"
                            placeholder="Playlist title"
                            required
                            value={this.props.playlistName}
                            onChange={this.handleChange}
                        />
                    </Col>
                </FormGroup>
                <FormGroup>
                    <Col md={2}>
                        Category
                    </Col>
                    <Col md={10}>
                        <input
                            type="text"
                            ref={playlistCategory =>
                                this.playlistCategory = playlistCategory}
                            className="form-control"
                            placeholder="Playlist category"
                            required
                            value={this.props.playlistCategory}
                            onChange={this.handleChange}
                        />
                    </Col>
                </FormGroup>
                <FormGroup>
                    <Col md={2}>
                        Password
                    </Col>
                    <Col md={10}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Password (leave blank for none)"
                            ref={playlistPassword =>
                                this.playlistPassword = playlistPassword}
                            value={this.props.playlistPassword}
                            onChange={this.handleChange}
                        />
                    </Col>
                </FormGroup>
                <div className="checkbox">
                    <FormGroup>
                        <Col md={6}>
                            Public Submissions
                        </Col>
                        <Col md={6}>
                            <input
                                type="checkbox"
                                ref={playlistOpenSubmissions =>
                                    this.playlistOpenSubmissions = playlistOpenSubmissions}
                                checked={this.props.playlistOpenSubmissions}
                                onChange={this.handleChange}
                            />
                        </Col>
                    </FormGroup>
                </div>
                <div className="typeRadio">
                    <FormGroup>
                        <Col md={2}>
                            Music{' '}
                        </Col>
                        <Col md={2}>
                            <input
                                type="radio"
                                name="type"
                                ref={musicPlaylist =>
                                    this.musicPlaylist = musicPlaylist}
                                onChange={this.handleChange}
                                checked={
                                    this.props.playlistType === 'music'
                                        ? 'checked'
                                        : ''
                                }
                            />
                        </Col>
                        <Col md={2}>
                            Video{' '}
                        </Col>
                        <Col md={2}>
                            <input
                                type="radio"
                                name="type"
                                ref={videoPlaylist =>
                                    this.videoPlaylist = videoPlaylist}
                                onChange={this.handleChange}
                                checked={
                                    this.props.playlistType === 'video'
                                        ? 'checked'
                                        : ''
                                }
                            />
                        </Col>
                    </FormGroup>
                </div>
                <button
                    type="submit"
                    className="btn btn-primary pull-right"
                    id="create_playlist"
                    onClick={this.props.createPlaylist}
                >
                    Create
                </button>
                <div className="clearfix" />
            </Form>
        );
    };
}
PlaylistForm.propTypes = {
    createPlaylist: React.PropTypes.func,
    playlistType: React.PropTypes.string,
    playlistOpenSubmissions: React.PropTypes.bool,
    playlistPassword: React.PropTypes.string,
    playlistCategory: React.PropTypes.string,
    playlistName: React.PropTypes.string,
    onUserInput: React.PropTypes.func,
    hasError: React.PropTypes.bool,
};

export default PlaylistForm;