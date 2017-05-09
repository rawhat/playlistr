class Neo4jConnector {
    constructor(driver) {
        this.driver = driver;
        this.playlistListeners = {};
        this.newPlaylistListeners = [];
    }

    async makeQuery(query, params) {
        let notifyNew = false;

        if(/CREATE \([A-z]*:Playlist/ig.exec(query)) {
            notifyNew = true;
        }

        try {
            let session = this.driver.session();
            let results = await session.run(query, params);
            let data = results.records[0].get('playlist').properties;

            if(notifyNew) {
                this.notifyNewPlaylistListeners(data);
            }
            else {
                this.notifyPlaylistListeners(data);
            }

            return { data, error: null };
        }
        catch(e) {
            console.error(e);
            return { error: e };
        }
    }

    addPlaylistListener(socket, playlistTitle, listenerFunction) {
        if(this.playlistListeners.hasOwnProperty(playlistTitle)) {
            this.playlistListeners = Object.assign({}, this.playlistListeners, { [playlistTitle]: this.playlistListeners[playlistTitle].concat({ socket, listenerFunction }) });
        }
        else {
            this.playlistListeners[playlistTitle] = [{ socket, listenerFunction }];
        }
    }

    addNewPlaylistListener(socket, listenerFunction) {
        this.newPlaylistListeners = this.newPlaylistListeners.length ? this.newPlaylistListeners.concat({ socket, listenerFunction }) : [{ socket, listenerFunction }];
    }

    removePlaylistListener(socket, playlistTitle) {
        if(this.playlistListeners[playlistTitle])
            this.playlistListeners[playlistTitle] = this.playlistListeners[playlistTitle].filter(obj => obj.socket !== socket);
    }

    removeNewPlaylistListener(socket) {
        if(this.newPlaylistListeners)
            this.newPlaylistListeners = this.newPlaylistListeners.filter(obj => obj.socket !== socket);
    }

    notifyPlaylistListeners(data) {
        let playlistTitle = data.title;
        this.playlistListeners[playlistTitle].forEach(obj => obj.listenerFunction(data));
    }

    notifyNewPlaylistListeners(data) {
        this.newPlaylistListeners.forEach(obj => obj.listenerFunction(data));
    }
}

module.exports = {
    Neo4jConnector
};