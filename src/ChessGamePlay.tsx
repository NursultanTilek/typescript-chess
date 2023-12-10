import React from "react"
import Board from "./board/Board"
// import ClockContainer from "./clock/ClockContainer"

export default class ChessGamePlay extends React.Component {
 
    render() {
     
        return (
            <div className="flex  flex-wrap justify-center p-6">
                <Board/>
                {/* <ClockContainer/> */}
            </div>
        )
    }
}
