import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
    Overlay,
    Popover,
    FormGroup,
    FormControl,
    InputGroup,
    Button,
} from 'react-bootstrap';

class Playlist extends Component {
    constructor(props) {
        super(props);
        this.state = {
            overlayShown: false,
            playlistPasswordError: false,
            password: null,
        };
    }

    static propTypes = {
        name: PropTypes.string,
        type: PropTypes.string,
        selected: PropTypes.bool,
        playlistSelector: PropTypes.func,
        hasPassword: PropTypes.bool,
        playlistPasswordError: PropTypes.bool,
        selectProtectedPlaylist: PropTypes.func,
    };

    static defaultProps = {
        name: '',
        selected: false,
        type: '',
    };

    toggleOverlay = () => {
        this.setState({
            overlayShown: !this.state.overlayShown,
        });
    };

    onChange = ev => {
        if (this.state.playlistPasswordError) {
            this.setState({ playlistPasswordError: false });
        }
        let password = ev.target.value;
        this.setState({
            password,
        });
    };

    submitPassword = ev => {
        ev.preventDefault();
        this.setState(
            {
                playlistPasswordError: false,
            },
            async () => {
                let status = await this.props.selectProtectedPlaylist(
                    this.props.name,
                    this.state.password
                );
                if (status) {
                    this.setState({
                        overlayShown: false,
                        password: null,
                    });
                } else {
                    this.setState({
                        playlistPasswordError: true,
                    });
                }
            }
        );
    };

    render = () => {
        var style = this.props.selected ? { backgroundColor: '#375a7f' } : {};
        var glyphicon = this.props.type === 'music'
            ? 'glyphicon-music'
            : 'glyphicon-film';
        if (this.props.hasPassword) {
            return (
                <div ref={overlayTarget => this.overlayTarget = overlayTarget}>
                    <button
                        onClick={this.toggleOverlay}
                        style={style}
                        type="button"
                        className="list-group-item playlist-selector"
                        id={this.props.name}
                        ref={playlistButton =>
                            this.playlistButton = playlistButton}
                    >
                        {this.props.name}
                        <div className="pull-right">
                            {this.props.hasPassword
                                ? <span
                                      className="glyphicon glyphicon-lock"
                                      style={{ paddingRight: 5 }}
                                  />
                                : null}
                            <span className={'glyphicon ' + glyphicon} />
                        </div>
                    </button>
                    <Overlay
                        rootClose
                        show={this.state.overlayShown}
                        onHide={() =>
                            this.setState({
                                overlayShown: false,
                                password: null,
                                playlistPasswordError: false,
                            })}
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
                                    this.state.playlistPasswordError
                                        ? 'error'
                                        : null
                                }
                                onSubmit={this.submitPassword}
                            >
                                <InputGroup>
                                    <FormControl
                                        type="text"
                                        id="password-overlay"
                                        onChange={this.onChange}
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
        } else {
            return (
                <button
                    onClick={this.props.playlistSelector.bind(
                        null,
                        this.props.name
                    )}
                    style={style}
                    type="button"
                    className="list-group-item playlist-selector"
                    id={this.props.name}
                >
                    {this.props.name}
                    <div className="pull-right">
                        {this.props.hasPassword
                            ? <span
                                  className="glyphicon glyphicon-lock"
                                  style={{ paddingRight: 5 }}
                              />
                            : null}
                        <span className={'glyphicon ' + glyphicon} />
                    </div>
                </button>
            );
        }
    };
}

export default Playlist;
