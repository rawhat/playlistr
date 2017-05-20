import React, { Component } from 'react';
import { FormGroup, InputGroup } from 'react-bootstrap';

class AddSongArea extends Component {
    constructor(props) {
        super(props);
    }

    state = {
        url: '',
    };

    onChange = () => {
        this.setState({
            url: this.songUrl.value,
        });
    };

    addSong = () => {
        this.props.addSongCallback(this.state.url);
        this.songUrl.value = '';
        this.setState({
            url: '',
        });
    };

    render = () => {
        return (
            // <div className='input-field' style={{width: '50%', margin: '10px auto'}}>
            (
                <FormGroup>
                    <InputGroup>
                        <input
                            className="form-control"
                            ref={songUrl => this.songUrl = songUrl}
                            type="text"
                            placeholder="Add song to current playlist"
                            onChange={this.onChange}
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
            )

            // </div>
        );
    };
}
AddSongArea.propTypes = {
    addSongCallback: React.PropTypes.func,
};

export default AddSongArea;
