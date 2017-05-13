import React, { Component } from 'react';
import axios from 'axios';
import {
    Button,
    Modal
} from 'react-bootstrap';

const ModalHeader = Modal.Header;
const ModalBody = Modal.Body;
const ModalFooter = Modal.Footer;

import PlaylistForm from './playlist-form';

class PlaylistCreator extends Component {
	constructor(props){
		super(props);

		this.state = {
			isShown: false,
			playlistName: '',
			playlistCategory: '',
			playlistPassword: '',
			playlistOpenSubmissions: true,
			playlistType: 'music',
			hasError: false,
			nameTaken: false
		};
	}

	showModal = () => {
		this.setState({
			isShown: true
		});
	}

	hideModal = () => {
		this.setState({
			isShown: false
		});
	}

	createPlaylist = async (ev) => {
		ev.preventDefault();
		this.makePlaylist = axios.put('/playlist', {
			playlist: this.state.playlistName,
			category: this.state.playlistCategory,
			password: this.state.playlistPassword,
			openSubmissions: this.state.playlistOpenSubmissions,
			type: this.state.playlistType
		});

		try {
			let res = await this.makePlaylist;
			if(res.status === 409) {
				this.setState({
					nameTaken: true
				});
			}
			else if(res.status === 400) {
				this.setState({
					hasError: true
				});
			}
			else {
				this.props.playlistSelector(this.state.playlistName);
				this.hideModal();
			}
		}
		catch(err) {
			console.error(err);
		}
	}

	componentWillUnmount = () => {
		if(this.makePlaylist) this.makePlaylist.cancel();
	}

	onUserInput = (name, category, password, open, type) => {
		this.setState({
			playlistName: name,
			playlistCategory: category,
			playlistPassword: password,
			playlistOpenSubmissions: open,
			playlistType: type
		});
	}

	render = () => {
		var alertArea = this.state.nameTaken ? <div className='alert-danger'>Playlist name already taken.</div> : null;
		return(
			<div>
				<Button
					bsStyle="primary"
					onClick={this.showModal}
					style={{width: '80%', left: '10%', position: 'relative', marginBottom: '10px'}}>
					Create Playlist
				</Button>

				<Modal show={this.state.isShown} onHide={this.hideModal}>
					<ModalHeader closeButton>Create New Playlist</ModalHeader>
					<ModalBody>
						<PlaylistForm 
							hasError={this.state.hasError} 
							createPlaylist={this.createPlaylist} 
							onUserInput={this.onUserInput} 
							playlistName={this.state.playlistName} 
							playlistCategory={this.state.playlistCategory} 
							playlistPassword={this.state.playlistPassword} 
							playlistOpenSubmissions={this.state.playlistOpenSubmissions} 
							playlistType={this.state.playlistType}
						/>
					</ModalBody>
					<ModalFooter>
						{alertArea}
					</ModalFooter>
				</Modal>
			</div>
		);
	}
}
PlaylistCreator.propTypes = {
	playlistSelector: React.PropTypes.func
};

export default PlaylistCreator;