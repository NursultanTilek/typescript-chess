/**
 * AI Thinking Panel Component
 *
 * Displays detailed analysis of what the AI is thinking:
 * - Top move candidates with probabilities
 * - Position evaluation
 * - Temperature setting
 * - Thinking time
 * - Uncertainty/entropy
 */

import React from 'react';
import type { AIAnalysis, MoveCandidate } from '../ai';

interface AIThinkingPanelProps {
  analysis: AIAnalysis | null;
  visible?: boolean;
}

/**
 * Convert coordination ID to chess notation (e.g., 0 -> a8, 63 -> h1)
 */
function coordToNotation(coord: number): string {
  const file = String.fromCharCode(97 + (coord % 8)); // a-h
  const rank = 8 - Math.floor(coord / 8); // 8-1
  return `${file}${rank}`;
}

/**
 * Format move as chess notation
 */
function formatMove(move: MoveCandidate): string {
  return `${coordToNotation(move.from)}${coordToNotation(move.to)}`;
}

/**
 * Get color for probability bar
 */
function getProbabilityColor(probability: number): string {
  if (probability > 0.5) return 'bg-green-500';
  if (probability > 0.2) return 'bg-blue-500';
  if (probability > 0.05) return 'bg-yellow-500';
  return 'bg-gray-500';
}

/**
 * Format evaluation score
 */
function formatEvaluation(score: number, engine: string): string {
  if (engine === 'neural_network') {
    // Neural network returns -1 to +1
    const percentage = ((score + 1) / 2 * 100).toFixed(1);
    return `${score > 0 ? '+' : ''}${score.toFixed(3)} (${percentage}%)`;
  } else {
    // Minimax returns centipawns
    const pawns = (score / 100).toFixed(2);
    return `${score > 0 ? '+' : ''}${pawns} pawns`;
  }
}

/**
 * Get engine display name
 */
function getEngineName(engine: string): string {
  const names: Record<string, string> = {
    'neural_network': 'Neural Network (AlphaZero)',
    'mcts': 'Monte Carlo Tree Search',
    'minimax': 'Minimax (Alpha-Beta)',
    'opening_book': 'Opening Book'
  };
  return names[engine] || engine;
}

export function AIThinkingPanel({ analysis, visible = true }: AIThinkingPanelProps) {
  if (!visible || !analysis) {
    return null;
  }

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold mb-3 flex items-center">
        <span className="mr-2">🤖</span>
        AI Thinking
      </h3>

      {/* Engine Info */}
      <div className="mb-4 p-3 bg-gray-700 rounded">
        <div className="text-sm text-gray-300 mb-1">Engine</div>
        <div className="font-semibold">{getEngineName(analysis.engine)}</div>
      </div>

      {/* Position Evaluation */}
      <div className="mb-4">
        <div className="text-sm text-gray-300 mb-1">Position Evaluation</div>
        <div className="text-2xl font-bold">
          {formatEvaluation(analysis.positionEvaluation, analysis.engine)}
        </div>
        <div className="mt-2 h-2 bg-gray-700 rounded overflow-hidden">
          <div
            className={`h-full ${analysis.positionEvaluation > 0 ? 'bg-green-500' : 'bg-red-500'}`}
            style={{
              width: `${Math.abs(analysis.positionEvaluation) * 100}%`,
              marginLeft: analysis.positionEvaluation > 0 ? '50%' : '0',
              marginRight: analysis.positionEvaluation < 0 ? '50%' : '0'
            }}
          />
        </div>
      </div>

      {/* Top Moves */}
      {analysis.topMoves && analysis.topMoves.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-gray-300 mb-2">Top Moves</div>
          <div className="space-y-2">
            {analysis.topMoves.map((move, index) => (
              <div key={`${move.from}-${move.to}`} className="bg-gray-700 rounded p-2">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <span className="text-xs text-gray-400 mr-2">#{index + 1}</span>
                    <span className="font-mono font-semibold">{formatMove(move)}</span>
                  </div>
                  <span className="text-sm">
                    {(move.probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-600 rounded overflow-hidden">
                  <div
                    className={`h-full ${getProbabilityColor(move.probability)}`}
                    style={{ width: `${move.probability * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Neural Network Specific Info */}
      {analysis.engine === 'neural_network' && (
        <>
          {/* Temperature */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded p-3">
              <div className="text-xs text-gray-300 mb-1">Temperature</div>
              <div className="text-lg font-semibold">{analysis.temperature.toFixed(2)}</div>
              <div className="text-xs text-gray-400 mt-1">
                {analysis.temperature < 0.5 ? 'Deterministic' :
                 analysis.temperature < 1.5 ? 'Balanced' : 'Exploratory'}
              </div>
            </div>

            {/* Policy Entropy */}
            {analysis.policyEntropy !== undefined && (
              <div className="bg-gray-700 rounded p-3">
                <div className="text-xs text-gray-300 mb-1">Confidence</div>
                <div className="text-lg font-semibold">
                  {(100 - Math.min(analysis.policyEntropy * 20, 100)).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {analysis.policyEntropy < 1 ? 'Very confident' :
                   analysis.policyEntropy < 3 ? 'Confident' : 'Uncertain'}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-700 rounded p-2">
          <div className="text-xs text-gray-300">Thinking Time</div>
          <div className="font-semibold">{analysis.thinkingTimeMs.toFixed(0)}ms</div>
        </div>

        {analysis.nodesSearched !== undefined && (
          <div className="bg-gray-700 rounded p-2">
            <div className="text-xs text-gray-300">Nodes Searched</div>
            <div className="font-semibold">{analysis.nodesSearched.toLocaleString()}</div>
          </div>
        )}
      </div>

      {/* Temperature Guide (Neural Network only) */}
      {analysis.engine === 'neural_network' && (
        <div className="mt-4 p-3 bg-gray-700 rounded text-xs">
          <div className="font-semibold mb-1">Temperature Guide:</div>
          <ul className="text-gray-300 space-y-1">
            <li>• <strong>0.0-0.5</strong>: Deterministic (always best move)</li>
            <li>• <strong>0.5-1.5</strong>: Balanced (best move with variety)</li>
            <li>• <strong>1.5+</strong>: Exploratory (more random choices)</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default AIThinkingPanel;
