import React, { Component } from 'react';
import { FormGroup, InputGroup } from 'react-bootstrap';
import { connect } from 'react-redux';
import { doAddSong, doSetText } from '../ducks/add-song';
import PropTypes from 'prop-types';

class AddSongArea extends Component {
    static propTypes = {
        set: PropTypes.func,
        add: PropTypes.func,
        error: PropTypes.bool,
        text: PropTypes.string,
    };

    onChange = () => {
        this.props.set(this.songUrl.value);
    };

    addSong = () => {
        this.props.add();
    };

    render = () => {
        return (
            <FormGroup className={this.props.error ? 'has-error' : ''}>
                <InputGroup>
                    <input
                        className="form-control"
                        ref={songUrl => (this.songUrl = songUrl)}
                        type="text"
                        placeholder="Add song to current playlist"
                        onChange={this.onChange}
                        value={this.props.text}
                    />
                    <InputGroup.Button>
                        <button
                            className="btn btn-default"
                            onClick={this.addSong}
                        >
                            +
                        </button>
                    </InputGroup.Button>
                </InputGroup>
            </FormGroup>
        );
    };
}

const mapStateToProps = state => ({
    text: state.addSong.text,
    error: state.addSong.error,
});

export default connect(mapStateToProps, { add: doAddSong, set: doSetText })(
    AddSongArea
);
