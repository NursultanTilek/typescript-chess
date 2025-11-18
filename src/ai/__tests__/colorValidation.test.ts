/**
 * Color Validation Integration Test
 *
 * This test ensures the AI ONLY moves pieces of its assigned color
 * and never touches the opponent's pieces.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ChessAI } from '../ChessAI'
import { Difficulty } from '../types'
import { Color } from '../../enum'
import { CoordinationId, PieceType } from '../../types'
import Pawn from '../../pieces/Pawn'
import Rook from '../../pieces/Rook'
import Knight from '../../pieces/Knight'
import Bishop from '../../pieces/Bishop'
import Queen from '../../pieces/Queen'
import King from '../../pieces/King'
import Coordination from '../../board/Coordination'

// Helper to create starting position
function createStartingPosition(): Map<CoordinationId, PieceType> {
  const pieces = new Map<CoordinationId, PieceType>()

  // White pieces
  pieces.set('A1', new Rook(new Coordination('A', 1), Color.WHITE))
  pieces.set('B1', new Knight(new Coordination('B', 1), Color.WHITE))
  pieces.set('C1', new Bishop(new Coordination('C', 1), Color.WHITE))
  pieces.set('D1', new Queen(new Coordination('D', 1), Color.WHITE))
  pieces.set('E1', new King(new Coordination('E', 1), Color.WHITE))
  pieces.set('F1', new Bishop(new Coordination('F', 1), Color.WHITE))
  pieces.set('G1', new Knight(new Coordination('G', 1), Color.WHITE))
  pieces.set('H1', new Rook(new Coordination('H', 1), Color.WHITE))
  for (const file of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
    pieces.set(`${file}2` as CoordinationId, new Pawn(new Coordination(file, 2), Color.WHITE))
  }

  // Black pieces
  pieces.set('A8', new Rook(new Coordination('A', 8), Color.BLACK))
  pieces.set('B8', new Knight(new Coordination('B', 8), Color.BLACK))
  pieces.set('C8', new Bishop(new Coordination('C', 8), Color.BLACK))
  pieces.set('D8', new Queen(new Coordination('D', 8), Color.BLACK))
  pieces.set('E8', new King(new Coordination('E', 8), Color.BLACK))
  pieces.set('F8', new Bishop(new Coordination('F', 8), Color.BLACK))
  pieces.set('G8', new Knight(new Coordination('G', 8), Color.BLACK))
  pieces.set('H8', new Rook(new Coordination('H', 8), Color.BLACK))
  for (const file of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
    pieces.set(`${file}7` as CoordinationId, new Pawn(new Coordination(file, 7), Color.BLACK))
  }

  return pieces
}

// Helper to check if a square is on rank 1 or 2 (WHITE pieces)
function isWhitePieceSquare(coord: CoordinationId): boolean {
  return coord.endsWith('1') || coord.endsWith('2')
}

// Helper to check if a square is on rank 7 or 8 (BLACK pieces)
function isBlackPieceSquare(coord: CoordinationId): boolean {
  return coord.endsWith('7') || coord.endsWith('8')
}

describe('AI Color Validation - Integration Test', () => {
  let ai: ChessAI
  let pieces: Map<CoordinationId, PieceType>

  beforeEach(() => {
    ai = new ChessAI(Difficulty.MEDIUM)
    pieces = createStartingPosition()
  })

  it('AI playing WHITE should ONLY move pieces from ranks 1-2', async () => {
    const aiColor = Color.WHITE
    const move = await ai.getMove(pieces, aiColor)

    expect(move).not.toBeNull()
    if (move) {
      console.log(`AI (WHITE) suggested move: ${move.from} -> ${move.to}`)

      // Check that the 'from' square is a WHITE piece position
      expect(isWhitePieceSquare(move.from)).toBe(true)

      // Verify the piece at 'from' is actually WHITE
      const piece = pieces.get(move.from)
      expect(piece).toBeDefined()
      expect(piece?.color).toBe(Color.WHITE)

      // Ensure it's NOT trying to move a BLACK piece
      expect(isBlackPieceSquare(move.from)).toBe(false)
    }
  })

  it('AI playing BLACK should ONLY move pieces from ranks 7-8', async () => {
    const aiColor = Color.BLACK
    const move = await ai.getMove(pieces, aiColor)

    expect(move).not.toBeNull()
    if (move) {
      console.log(`AI (BLACK) suggested move: ${move.from} -> ${move.to}`)

      // Check that the 'from' square is a BLACK piece position
      expect(isBlackPieceSquare(move.from)).toBe(true)

      // Verify the piece at 'from' is actually BLACK
      const piece = pieces.get(move.from)
      expect(piece).toBeDefined()
      expect(piece?.color).toBe(Color.BLACK)

      // Ensure it's NOT trying to move a WHITE piece
      expect(isWhitePieceSquare(move.from)).toBe(false)
    }
  })

  it('AI should respect color across multiple moves (simulate game)', async () => {
    // Simulate a few moves of a game
    // Move 1: WHITE (human) plays E2-E4
    const whitePawn = pieces.get('E2')!
    pieces.delete('E2')
    whitePawn.coordination = Coordination.fromId('E4')
    pieces.set('E4', whitePawn)

    // Move 2: BLACK (AI) responds
    const blackMove1 = await ai.getMove(pieces, Color.BLACK)
    expect(blackMove1).not.toBeNull()
    if (blackMove1) {
      console.log(`Move 2 - AI (BLACK): ${blackMove1.from} -> ${blackMove1.to}`)
      const piece = pieces.get(blackMove1.from)
      expect(piece?.color).toBe(Color.BLACK)

      // Apply the move
      pieces.delete(blackMove1.from)
      piece!.coordination = Coordination.fromId(blackMove1.to)
      pieces.set(blackMove1.to, piece!)
    }

    // Move 3: WHITE (AI) responds
    const whiteMove1 = await ai.getMove(pieces, Color.WHITE)
    expect(whiteMove1).not.toBeNull()
    if (whiteMove1) {
      console.log(`Move 3 - AI (WHITE): ${whiteMove1.from} -> ${whiteMove1.to}`)
      const piece = pieces.get(whiteMove1.from)
      expect(piece?.color).toBe(Color.WHITE)

      // Apply the move
      pieces.delete(whiteMove1.from)
      piece!.coordination = Coordination.fromId(whiteMove1.to)
      pieces.set(whiteMove1.to, piece!)
    }

    // Move 4: BLACK (AI) responds again
    const blackMove2 = await ai.getMove(pieces, Color.BLACK)
    expect(blackMove2).not.toBeNull()
    if (blackMove2) {
      console.log(`Move 4 - AI (BLACK): ${blackMove2.from} -> ${blackMove2.to}`)
      const piece = pieces.get(blackMove2.from)
      expect(piece?.color).toBe(Color.BLACK)
    }
  })

  it('AI should never suggest moving opponent pieces', async () => {
    // Test WHITE AI
    for (let i = 0; i < 5; i++) {
      const whiteMove = await ai.getMove(pieces, Color.WHITE)
      if (whiteMove) {
        const piece = pieces.get(whiteMove.from)
        expect(piece?.color).not.toBe(Color.BLACK)
        expect(piece?.color).toBe(Color.WHITE)
      }
    }

    // Reset AI
    ai.clearHistory()

    // Test BLACK AI
    for (let i = 0; i < 5; i++) {
      const blackMove = await ai.getMove(pieces, Color.BLACK)
      if (blackMove) {
        const piece = pieces.get(blackMove.from)
        expect(piece?.color).not.toBe(Color.WHITE)
        expect(piece?.color).toBe(Color.BLACK)
      }
    }
  })

  it('Opening book moves should respect color', async () => {
    // Starting position - WHITE to move
    const whiteOpeningMove = await ai.getMove(pieces, Color.WHITE)
    expect(whiteOpeningMove).not.toBeNull()
    if (whiteOpeningMove) {
      console.log(`Opening move for WHITE: ${whiteOpeningMove.from} -> ${whiteOpeningMove.to}`)
      const piece = pieces.get(whiteOpeningMove.from)
      expect(piece?.color).toBe(Color.WHITE)
      // Opening book should suggest a move from starting position
      expect(whiteOpeningMove.openingBook).toBe(true)
    }

    // After 1. e4
    const e4Pawn = pieces.get('E2')!
    pieces.delete('E2')
    e4Pawn.coordination = Coordination.fromId('E4')
    pieces.set('E4', e4Pawn)
    ai.clearHistory()

    // BLACK to move
    const blackOpeningMove = await ai.getMove(pieces, Color.BLACK)
    expect(blackOpeningMove).not.toBeNull()
    if (blackOpeningMove) {
      console.log(`Opening move for BLACK: ${blackOpeningMove.from} -> ${blackOpeningMove.to}`)
      const piece = pieces.get(blackOpeningMove.from)
      expect(piece?.color).toBe(Color.BLACK)
      // May or may not be from opening book (depends on if book has this position)
      // But the important thing is the color is correct
    }
  })
})
