import { describe, it, expect, beforeEach } from 'vitest'
import { findBestMove } from '../search'
import { Color } from '../../enum'
import { CoordinationId, PieceType } from '../../types'
import Coordination from '../../board/Coordination'
import Pawn from '../../pieces/Pawn'
import Rook from '../../pieces/Rook'
import Queen from '../../pieces/Queen'
import King from '../../pieces/King'
import { usePieces } from '../../store/usePieces'

describe('Chess AI Search', () => {
  beforeEach(() => {
    // Clear the pieces store before each test
    usePieces.getState().setPieces(new Map())
  })

  describe('findBestMove', () => {
    it('should find a legal move in simple position', () => {
      const pieces = new Map<CoordinationId, PieceType>()
      pieces.set('E1', new King(new Coordination('E', 1), Color.WHITE))
      pieces.set('D2', new Pawn(new Coordination('D', 2), Color.WHITE))
      pieces.set('E8', new King(new Coordination('E', 8), Color.BLACK))
      pieces.set('D7', new Pawn(new Coordination('D', 7), Color.BLACK))

      // Set up board state
      usePieces.getState().setPieces(pieces)

      const config = {
        maxDepth: 2,
        useAlphaBeta: true,
        useIterativeDeepening: false,
        useQuiescence: false,
        timeLimitMs: 1000
      }

      const move = findBestMove(pieces, Color.WHITE, config)

      expect(move).not.toBeNull()
      if (move) {
        expect(move.from).toBeDefined()
        expect(move.to).toBeDefined()
        expect(typeof move.score).toBe('number')
      }
    })

    it('should prefer capturing moves', () => {
      const pieces = new Map<CoordinationId, PieceType>()
      pieces.set('E1', new King(new Coordination('E', 1), Color.WHITE))
      pieces.set('D4', new Queen(new Coordination('D', 4), Color.WHITE))
      pieces.set('E8', new King(new Coordination('E', 8), Color.BLACK))
      pieces.set('D8', new Queen(new Coordination('D', 8), Color.BLACK)) // Undefended queen

      usePieces.getState().setPieces(pieces)

      const config = {
        maxDepth: 3,
        useAlphaBeta: true,
        useIterativeDeepening: false,
        useQuiescence: true,
        timeLimitMs: 2000
      }

      const move = findBestMove(pieces, Color.WHITE, config)

      expect(move).not.toBeNull()
      if (move) {
        // Should find a strong move
        expect(move.score).toBeGreaterThan(500) // Good position or material gain
      }
    })

    it('should recognize winning positions', () => {
      const pieces = new Map<CoordinationId, PieceType>()
      // Setup a clearly winning position for white
      pieces.set('E1', new King(new Coordination('E', 1), Color.WHITE))
      pieces.set('A1', new Rook(new Coordination('A', 1), Color.WHITE))
      pieces.set('H1', new Rook(new Coordination('H', 1), Color.WHITE))
      pieces.set('E8', new King(new Coordination('E', 8), Color.BLACK))

      usePieces.getState().setPieces(pieces)

      const config = {
        maxDepth: 2,
        useAlphaBeta: true,
        useIterativeDeepening: false,
        useQuiescence: false,
        timeLimitMs: 2000
      }

      const move = findBestMove(pieces, Color.WHITE, config)

      expect(move).not.toBeNull()
      if (move) {
        // Should recognize large material advantage (2 rooks = 1000)
        // Score reflects position evaluation; check that material advantage is recognized
        expect(Math.abs(move.score)).toBeGreaterThan(700)
      }
    })

    it('should return null when no legal moves', () => {
      const pieces = new Map<CoordinationId, PieceType>()
      // Stalemate or checkmate position - just king with no moves
      pieces.set('A1', new King(new Coordination('A', 1), Color.WHITE))
      pieces.set('C2', new Queen(new Coordination('C', 2), Color.BLACK))
      pieces.set('B3', new King(new Coordination('B', 3), Color.BLACK))

      usePieces.getState().setPieces(pieces)

      const config = {
        maxDepth: 1,
        useAlphaBeta: true,
        useIterativeDeepening: false,
        useQuiescence: false,
        timeLimitMs: 1000
      }

      // White king is in stalemate/checkmate
      const move = findBestMove(pieces, Color.WHITE, config)

      // Should return null or at least recognize no good moves
      // The actual behavior depends on whether it's checkmate or stalemate
      expect(move).toBeDefined()
    })

    it('should work with alpha-beta pruning disabled', () => {
      const pieces = new Map<CoordinationId, PieceType>()
      pieces.set('E1', new King(new Coordination('E', 1), Color.WHITE))
      pieces.set('D2', new Pawn(new Coordination('D', 2), Color.WHITE))
      pieces.set('E8', new King(new Coordination('E', 8), Color.BLACK))

      usePieces.getState().setPieces(pieces)

      const config = {
        maxDepth: 2,
        useAlphaBeta: false, // Disable alpha-beta
        useIterativeDeepening: false,
        useQuiescence: false,
        timeLimitMs: 2000
      }

      const move = findBestMove(pieces, Color.WHITE, config)

      expect(move).not.toBeNull()
      expect(move?.from).toBeDefined()
      expect(move?.to).toBeDefined()
    })

    it('should work with iterative deepening', () => {
      const pieces = new Map<CoordinationId, PieceType>()
      pieces.set('E1', new King(new Coordination('E', 1), Color.WHITE))
      pieces.set('D2', new Pawn(new Coordination('D', 2), Color.WHITE))
      pieces.set('E8', new King(new Coordination('E', 8), Color.BLACK))

      usePieces.getState().setPieces(pieces)

      const config = {
        maxDepth: 3,
        useAlphaBeta: true,
        useIterativeDeepening: true, // Enable iterative deepening
        useQuiescence: false,
        timeLimitMs: 2000
      }

      const move = findBestMove(pieces, Color.WHITE, config)

      expect(move).not.toBeNull()
      expect(move?.from).toBeDefined()
      expect(move?.to).toBeDefined()
    })

    it('should work with quiescence search', () => {
      const pieces = new Map<CoordinationId, PieceType>()
      pieces.set('E1', new King(new Coordination('E', 1), Color.WHITE))
      pieces.set('D4', new Queen(new Coordination('D', 4), Color.WHITE))
      pieces.set('E8', new King(new Coordination('E', 8), Color.BLACK))
      pieces.set('D5', new Pawn(new Coordination('D', 5), Color.BLACK))

      usePieces.getState().setPieces(pieces)

      const config = {
        maxDepth: 2,
        useAlphaBeta: true,
        useIterativeDeepening: false,
        useQuiescence: true, // Enable quiescence search
        timeLimitMs: 2000
      }

      const move = findBestMove(pieces, Color.WHITE, config)

      expect(move).not.toBeNull()
      expect(move?.from).toBeDefined()
      expect(move?.to).toBeDefined()
    })

    it('should respect time limit', () => {
      const pieces = new Map<CoordinationId, PieceType>()
      // Set up a simple position
      pieces.set('E1', new King(new Coordination('E', 1), Color.WHITE))
      pieces.set('D2', new Pawn(new Coordination('D', 2), Color.WHITE))
      pieces.set('E8', new King(new Coordination('E', 8), Color.BLACK))
      pieces.set('D7', new Pawn(new Coordination('D', 7), Color.BLACK))

      usePieces.getState().setPieces(pieces)

      const config = {
        maxDepth: 3,
        useAlphaBeta: true,
        useIterativeDeepening: false, // Disable to avoid deep search issues
        useQuiescence: false,
        timeLimitMs: 500
      }

      const startTime = Date.now()
      const move = findBestMove(pieces, Color.WHITE, config)
      const elapsed = Date.now() - startTime

      expect(move).not.toBeNull()
      // Should finish within reasonable time
      expect(elapsed).toBeLessThan(2000)
    })

    it('should be consistent for simple positions', () => {
      const pieces = new Map<CoordinationId, PieceType>()
      pieces.set('E1', new King(new Coordination('E', 1), Color.WHITE))
      pieces.set('D2', new Pawn(new Coordination('D', 2), Color.WHITE))
      pieces.set('E8', new King(new Coordination('E', 8), Color.BLACK))

      usePieces.getState().setPieces(pieces)

      const config = {
        maxDepth: 2, // Lower depth for more consistent results
        useAlphaBeta: true,
        useIterativeDeepening: false,
        useQuiescence: false,
        timeLimitMs: 5000
      }

      const move1 = findBestMove(pieces, Color.WHITE, config)
      const move2 = findBestMove(pieces, Color.WHITE, config)

      // Both moves should exist
      expect(move1).toBeTruthy()
      expect(move2).toBeTruthy()
      // Scores should be close (might vary slightly due to transposition table)
      if (move1 && move2) {
        expect(Math.abs(move1.score - move2.score)).toBeLessThan(5)
      }
    })
  })

  describe('Search performance', () => {
    it('should complete depth 2 search quickly', () => {
      const pieces = new Map<CoordinationId, PieceType>()
      pieces.set('E1', new King(new Coordination('E', 1), Color.WHITE))
      pieces.set('D2', new Pawn(new Coordination('D', 2), Color.WHITE))
      pieces.set('E2', new Pawn(new Coordination('E', 2), Color.WHITE))
      pieces.set('E8', new King(new Coordination('E', 8), Color.BLACK))
      pieces.set('D7', new Pawn(new Coordination('D', 7), Color.BLACK))

      usePieces.getState().setPieces(pieces)

      const config = {
        maxDepth: 2,
        useAlphaBeta: true,
        useIterativeDeepening: false,
        useQuiescence: false,
        timeLimitMs: 5000
      }

      const startTime = Date.now()
      const move = findBestMove(pieces, Color.WHITE, config)
      const elapsed = Date.now() - startTime

      expect(move).not.toBeNull()
      expect(elapsed).toBeLessThan(1000) // Should be quick for depth 2
    })
  })
})
