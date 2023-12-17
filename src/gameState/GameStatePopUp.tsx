import { Component } from "react";
import { GameState } from "../enum";

interface GameStatePopUpProps {
    gameState: GameState;
 
}

export default class GameStatePopUp extends Component<GameStatePopUpProps> {

    private renderMessage(){
        const { gameState} = this.props;

        let message = '';
        switch (gameState) {
            case GameState.ONGOING:
                message = 'Game is ongoing';
                break;
            case GameState.STALEMATE:
                message = 'Stalemate!';
                break;
            case GameState.WHITE_CHECKMATE:
                message = 'Black Wins!';
                break;
            case GameState.BLACK_CHECKMATE:
                message = 'White Wins!';
                break;
        }
        return message
    }
    render() {
        return (
            <div className='relative z-50'>
                <div className="flex center absolute top-1/2 left-1/2 -translate-x-1/3 translate-y-full z-5 scale-300">
                    <div className="bg-white shadow-lg rounded-lg p-6 space-y-4">
                        <div className="flex items-center space-x-4">
                            <div>
                                <div className="text-gray-900 text-2xl font-semibold">
                                    {this.renderMessage()}
                                </div>
                            </div>
                        </div>
                        <button
                            className="w-full text-purple-600 bg-purple-100 hover:bg-purple-200 text-sm py-2 px-4 rounded-md transition duration-300 ease-in-out"
                            onClick={()=>window.location.reload()}
                        >
                            Restart
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

