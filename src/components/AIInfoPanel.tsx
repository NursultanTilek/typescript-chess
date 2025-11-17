/**
 * AI Info Panel Component
 * Displays AI thinking process, evaluation, and move information
 */

import React from "react";

export interface AIInfo {
  thinking: boolean;
  lastMove?: {
    from: string;
    to: string;
    score: number;
    depth: number;
    timeMs: number;
    openingBook?: boolean;
  };
  moveHistory: string[];
}

interface AIInfoPanelProps {
  aiInfo: AIInfo;
}

export class AIInfoPanel extends React.Component<AIInfoPanelProps> {
  formatScore(score: number): string {
    if (score > 99000) return "White is winning (mate soon)";
    if (score < -99000) return "Black is winning (mate soon)";
    if (score > 500) return `White is ahead (+${(score / 100).toFixed(2)} pawns)`;
    if (score < -500) return `Black is ahead (${(score / 100).toFixed(2)} pawns)`;
    if (score > 0) return `Slightly better for White (+${(score / 100).toFixed(2)})`;
    if (score < 0) return `Slightly better for Black (${(score / 100).toFixed(2)})`;
    return "Equal position";
  }

  render() {
    const { aiInfo } = this.props;

    return (
      <div className="bg-gray-800 text-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">
          🤖 AI Analysis
        </h2>

        {/* Thinking Status */}
        {aiInfo.thinking && (
          <div className="bg-blue-900 border-2 border-blue-500 rounded-lg p-4 mb-4 animate-pulse">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-3 animate-ping"></div>
              <span className="text-xl font-semibold">AI is thinking...</span>
            </div>
          </div>
        )}

        {/* Last Move Info */}
        {aiInfo.lastMove && (
          <div className="space-y-3">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-green-400">Last Move:</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400">Move:</span>
                  <div className="text-2xl font-bold text-white mt-1">
                    {aiInfo.lastMove.from} → {aiInfo.lastMove.to}
                  </div>
                </div>

                <div>
                  <span className="text-gray-400">Source:</span>
                  <div className="text-lg font-semibold mt-1">
                    {aiInfo.lastMove.openingBook ? (
                      <span className="text-purple-400">📚 Opening Book</span>
                    ) : (
                      <span className="text-blue-400">🧠 Search Algorithm</span>
                    )}
                  </div>
                </div>

                {!aiInfo.lastMove.openingBook && (
                  <>
                    <div>
                      <span className="text-gray-400">Evaluation:</span>
                      <div className="text-lg font-semibold mt-1">
                        <span className={aiInfo.lastMove.score > 0 ? "text-green-400" : aiInfo.lastMove.score < 0 ? "text-red-400" : "text-yellow-400"}>
                          {(aiInfo.lastMove.score / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {this.formatScore(aiInfo.lastMove.score)}
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-400">Search Depth:</span>
                      <div className="text-lg font-semibold text-blue-400 mt-1">
                        {aiInfo.lastMove.depth} plies
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-400">Time Taken:</span>
                      <div className="text-lg font-semibold text-yellow-400 mt-1">
                        {aiInfo.lastMove.timeMs}ms
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-400">Positions Evaluated:</span>
                      <div className="text-lg font-semibold text-purple-400 mt-1">
                        ~{Math.pow(30, Math.min(aiInfo.lastMove.depth, 3)).toLocaleString()}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Move History */}
            {aiInfo.moveHistory.length > 0 && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2 text-blue-400">Move History:</h3>
                <div className="flex flex-wrap gap-2">
                  {aiInfo.moveHistory.map((move, index) => (
                    <span
                      key={index}
                      className="bg-gray-600 px-3 py-1 rounded text-sm"
                    >
                      {index + 1}. {move}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No moves yet */}
        {!aiInfo.lastMove && !aiInfo.thinking && (
          <div className="text-center text-gray-400 py-8">
            <p className="text-lg">Make your first move to start the game!</p>
            <p className="text-sm mt-2">AI will respond as Black</p>
          </div>
        )}
      </div>
    );
  }
}
