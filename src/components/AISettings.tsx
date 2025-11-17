/**
 * AI Settings Component
 * Allows players to configure AI opponent
 */

import React from "react";
import { Difficulty } from "../ai/types";

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
      <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg">
        <div className="flex flex-wrap items-center gap-4">
          {/* AI Enable/Disable */}
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={aiEnabled}
              onChange={(e) => onAIEnabledChange(e.target.checked)}
              className="w-4 h-4 mr-2"
            />
            <span className="text-sm font-medium">AI Opponent</span>
          </label>

          {/* Difficulty Selection */}
          {aiEnabled && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Difficulty:</label>
              <select
                value={difficulty}
                onChange={(e) =>
                  onDifficultyChange(parseInt(e.target.value) as Difficulty)
                }
                className="px-3 py-1.5 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value={Difficulty.BEGINNER}>Beginner</option>
                <option value={Difficulty.EASY}>Easy</option>
                <option value={Difficulty.MEDIUM}>Medium</option>
                <option value={Difficulty.HARD}>Hard</option>
                <option value={Difficulty.EXPERT}>Expert</option>
                <option value={Difficulty.MASTER}>Master</option>
              </select>
            </div>
          )}

          {/* Info */}
          {aiEnabled && (
            <div className="text-xs text-gray-400 ml-auto">
              MCTS + Neural Network (AlphaZero-style)
            </div>
          )}
        </div>
      </div>
    );
  }
}
