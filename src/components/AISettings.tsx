/**
 * AI Settings Component
 * Allows players to configure AI opponent
 */

import React from "react";
import { Difficulty } from "../ai/types";
import { ChessAI } from "../ai/ChessAI";

interface AISettingsProps {
  aiEnabled: boolean;
  difficulty: Difficulty;
  onAIEnabledChange: (enabled: boolean) => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
}

export class AISettings extends React.Component<AISettingsProps> {
  render() {
    const { aiEnabled, difficulty, onAIEnabledChange, onDifficultyChange } =
      this.props;

    return (
      <div className="bg-gray-800 text-white p-6 rounded-lg shadow-lg mb-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Game Settings</h2>

        {/* AI Enable/Disable */}
        <div className="mb-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={aiEnabled}
              onChange={(e) => onAIEnabledChange(e.target.checked)}
              className="w-5 h-5 mr-3"
            />
            <span className="text-lg">Play against AI</span>
          </label>
        </div>

        {/* Difficulty Selection */}
        {aiEnabled && (
          <div className="mb-4">
            <label className="block text-lg mb-2">AI Difficulty:</label>
            <select
              value={difficulty}
              onChange={(e) =>
                onDifficultyChange(parseInt(e.target.value) as Difficulty)
              }
              className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            >
              <option value={Difficulty.BEGINNER}>
                Beginner - {ChessAI.getDifficultyDescription(Difficulty.BEGINNER)}
              </option>
              <option value={Difficulty.EASY}>
                Easy - {ChessAI.getDifficultyDescription(Difficulty.EASY)}
              </option>
              <option value={Difficulty.MEDIUM}>
                Medium - {ChessAI.getDifficultyDescription(Difficulty.MEDIUM)}
              </option>
              <option value={Difficulty.HARD}>
                Hard - {ChessAI.getDifficultyDescription(Difficulty.HARD)}
              </option>
              <option value={Difficulty.EXPERT}>
                Expert - {ChessAI.getDifficultyDescription(Difficulty.EXPERT)}
              </option>
              <option value={Difficulty.MASTER}>
                Master - {ChessAI.getDifficultyDescription(Difficulty.MASTER)}
              </option>
            </select>
          </div>
        )}

        {/* Info */}
        {aiEnabled && (
          <div className="text-sm text-gray-400 mt-4">
            <p>You play as White, AI plays as Black.</p>
            <p className="mt-1">
              The AI uses minimax search with alpha-beta pruning, quiescence search, and opening book knowledge.
            </p>
          </div>
        )}
      </div>
    );
  }
}
