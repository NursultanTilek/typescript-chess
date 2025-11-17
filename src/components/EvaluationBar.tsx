/**
 * Evaluation Bar Component (like lichess.org)
 * Visual bar showing position evaluation
 */

import React from "react";

interface EvaluationBarProps {
  score: number; // centipawns (100 = 1 pawn advantage)
  thinking: boolean;
}

export class EvaluationBar extends React.Component<EvaluationBarProps> {
  /**
   * Convert centipawn score to percentage for visual display
   * Uses sigmoid-like function to map infinite scores to 0-100%
   */
  scoreToPercentage(score: number): number {
    // Clamp extreme values
    const clampedScore = Math.max(-2000, Math.min(2000, score));

    // Convert to percentage (50% = equal, 100% = white winning, 0% = black winning)
    // Using tanh for smooth scaling
    const normalized = Math.tanh(clampedScore / 400);
    return 50 + (normalized * 50);
  }

  formatScore(score: number): string {
    if (Math.abs(score) > 9900) {
      // Mate score
      const mateIn = Math.ceil((10000 - Math.abs(score)) / 2);
      return score > 0 ? `M${mateIn}` : `-M${mateIn}`;
    }

    // Regular score in pawns
    const pawns = score / 100;
    return pawns >= 0 ? `+${pawns.toFixed(1)}` : pawns.toFixed(1);
  }

  render() {
    const { score, thinking } = this.props;
    const percentage = this.scoreToPercentage(score);

    return (
      <div className="w-full mb-4">
        {/* Evaluation Bar */}
        <div className="relative h-6 bg-gray-900 rounded overflow-hidden border border-gray-700">
          {/* White portion */}
          <div
            className={`absolute left-0 top-0 h-full bg-white transition-all duration-300 ${
              thinking ? 'opacity-70' : ''
            }`}
            style={{ width: `${percentage}%` }}
          />

          {/* Score label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={`text-sm font-bold px-2 py-0.5 rounded ${
                percentage > 50
                  ? 'text-gray-900 bg-white bg-opacity-80'
                  : 'text-white bg-gray-900 bg-opacity-80'
              }`}
            >
              {this.formatScore(score)}
            </span>
          </div>
        </div>

        {/* Labels */}
        <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
          <span>Black</span>
          <span>White</span>
        </div>
      </div>
    );
  }
}
