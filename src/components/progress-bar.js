import React, { Component } from 'react';

class ProgressBar extends Component {
    constructor(props) {
        super(props);
    }

    static defaultProps = {
        currentTime: 0,
        totalTime: 0,
    };

    render = () => {
        var width = '0%';
        if (this.props.totalTime !== 0)
            width = this.props.currentTime / this.props.totalTime * 100 + '%';

        var currMinutes = 0;
        var currSeconds = 0;

        if (this.props.currentTime) {
            currMinutes = Math.floor(this.props.currentTime / 60);
            currSeconds = Math.floor(this.props.currentTime - currMinutes * 60);
        }

        var currTimeString = currSeconds < 10
            ? currMinutes + ':0' + currSeconds
            : currMinutes + ':' + currSeconds;

        //var totalMinutes = Math.floor(this.refs.audioPlayerHidden.duration / 60);
        //var totalSeconds = Math.floor(this.refs.audioPlayerHidden.duration - totalMinutes * 60);
        var totalMinutes = 0;
        var totalSeconds = 0;

        if (this.props.totalTime) {
            totalMinutes = Math.floor(this.props.totalTime / 60);
            totalSeconds = Math.floor(this.props.totalTime - totalMinutes * 60);
        }

        var totalTimeString = totalSeconds < 10
            ? totalMinutes + ':0' + totalSeconds
            : totalMinutes + ':' + totalSeconds;

        if (this.innerDiv !== undefined && this.props.isPaused)
            this.innerDiv.style.transition = 'paused';

        return (
            <div
                ref={outerDiv => this.outerDiv = outerDiv}
                style={{
                    backgroundColor: 'darkgray',
                    borderRadius: '3px',
                    top: 3,
                    width: '100%',
                    height: '45px',
                }}
            >
                <div
                    ref={innerDiv => this.innerDiv = innerDiv}
                    style={{
                        backgroundColor: '#375a7f',
                        borderRadius: '3px',
                        width: width,
                        height: '45px',
                    }}
                />
                <div
                    style={{ position: 'absolute', top: '12px', right: '20px' }}
                >
                    {currTimeString + ' / ' + totalTimeString}
                </div>
            </div>
        );
    };
}
ProgressBar.propTypes = {
    totalTime: React.PropTypes.number,
    isPaused: React.PropTypes.bool,
    currentTime: React.PropTypes.number,
};

export default ProgressBar;
