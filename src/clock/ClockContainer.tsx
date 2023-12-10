import React, { Component } from 'react'
import Clock from './Clock';

interface IState {
    whiteTime: number,
    blackTime: number,
    isWhiteTurn: boolean
}

export default class ClockContainer extends Component {

    //  interval 
    // state: IState = {
    //     whiteTime: 300,
    //     blackTime: 300,
    //     isWhiteTurn: true
    // }

    // switchTurn = () => {
    //     this.setState(prev => ({
    //         isWhiteTurn: !prev.isWhiteTurn
    //     }));
    // }

    // componentDidMount() {
    //     this.interval = setInterval(() => {
    //         const { isWhiteTurn, whiteTime, blackTime } = this.state;

    //         if (isWhiteTurn) {
    //             this.setState(prev => ({ whiteTime: prev.whiteTime - 1 }));
    //         } else {
    //             this.setState(prev => ({ blackTime: prev.blackTime - 1 }));
    //         }

    //     }, 1000);
    // }

    // componentWillUnmount() {
    //     clearInterval(this.interval);
    // }

    render() {


        return (
            <div>
                <div className="flex flex-col p-8 w-60 gap-7">
                    <Clock/>
                    <Clock/>
                </div>

            </div>
        )
    }
}
