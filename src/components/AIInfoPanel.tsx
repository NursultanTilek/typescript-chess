/**
 * AI Info Panel Component (Sidebar style like lichess.org)
 * Displays AI thinking process, evaluation, and move information
 */

import React from "react";
import { EvaluationBar } from "./EvaluationBar";

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
    if (score > 99000) return "White is winning";
    if (score < -99000) return "Black is winning";
    if (score > 200) return `White is better`;
    if (score < -200) return `Black is better`;
    return "Equal position";
  }

  render() {
    const { aiInfo } = this.props;
    const score = aiInfo.lastMove?.score || 0;

    return (
      <div className="bg-gray-800 rounded-lg shadow-xl p-4 h-full flex flex-col">
        <h2 className="text-xl font-bold mb-3 text-white flex items-center">
          <span className="mr-2">🤖</span>
          Computer Analysis
        </h2>

        {/* Evaluation Bar */}
        <EvaluationBar score={score} thinking={aiInfo.thinking} />

        {/* Thinking Status */}
        {aiInfo.thinking && (
          <div className="bg-blue-900 bg-opacity-50 rounded-lg p-3 mb-3 border border-blue-500">
            <div className="flex items-center text-blue-200">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm font-medium">Calculating...</span>
            </div>
          </div>
        )}

        {/* Last Move Info */}
        {aiInfo.lastMove && !aiInfo.thinking && (
          <div className="space-y-3 flex-1">
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Best Move</div>
              <div className="text-2xl font-bold text-white mb-2">
                {aiInfo.lastMove.from} → {aiInfo.lastMove.to}
              </div>

              <div className="text-sm text-gray-300 mb-2">
                {this.formatScore(aiInfo.lastMove.score)}
              </div>

              {aiInfo.lastMove.openingBook ? (
                <div className="flex items-center text-xs text-purple-300">
                  <span className="mr-1">📚</span>
                  <span>Opening Book</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">Depth:</span>
                    <span className="text-blue-300 ml-1 font-semibold">
                      {aiInfo.lastMove.depth}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Time:</span>
                    <span className="text-green-300 ml-1 font-semibold">
                      {aiInfo.lastMove.timeMs}ms
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400">Eval:</span>
                    <span className={`ml-1 font-semibold ${
                      aiInfo.lastMove.score > 0 ? 'text-white' : 'text-gray-300'
                    }`}>
                      {(aiInfo.lastMove.score / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Move History */}
            {aiInfo.moveHistory.length > 0 && (
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-2">Move History</div>
                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 gap-1">
                    {aiInfo.moveHistory.map((move, index) => (
                      <div
                        key={index}
                        className="bg-gray-600 px-2 py-1 rounded text-xs text-gray-200 flex items-center"
                      >
                        <span className="text-gray-400 mr-1 text-[10px]">
                          {index + 1}.
                        </span>
                        <span className="font-mono">{move}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No moves yet */}
        {!aiInfo.lastMove && !aiInfo.thinking && (
          <div className="flex-1 flex items-center justify-center text-center">
            <div className="text-gray-400">
              <div className="text-4xl mb-2">♟️</div>
              <p className="text-sm">Make your first move</p>
              <p className="text-xs mt-1">AI will respond</p>
            </div>
          </div>
        )}

        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #374151;
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #4B5563;
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #6B7280;
          }
        `}</style>
      </div>
    );
  }
}
