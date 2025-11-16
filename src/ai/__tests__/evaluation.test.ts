import { describe, it, expect, beforeEach } from 'vitest'
import { evaluatePosition, getPieceValue, DEFAULT_WEIGHTS } from '../evaluation'
import { Color, PieceName } from '../../enum'
import { CoordinationId, PieceType } from '../../types'
import Coordination from '../../board/Coordination'
import Pawn from '../../pieces/Pawn'
import Knight from '../../pieces/Knight'
import Bishop from '../../pieces/Bishop'
import Rook from '../../pieces/Rook'
import Queen from '../../pieces/Queen'
import King from '../../pieces/King'

describe('Chess AI Evaluation', () => {
  describe('getPieceValue', () => {
    it('should return correct value for pawn', () => {
      const pawn = new Pawn(new Coordination('E', 2), Color.WHITE)
      expect(getPieceValue(pawn)).toBe(100)
    })

    it('should return correct value for knight', () => {
      const knight = new Knight(new Coordination('B', 1), Color.WHITE)
      expect(getPieceValue(knight)).toBe(320)
    })

    it('should return correct value for bishop', () => {
      const bishop = new Bishop(new Coordination('C', 1), Color.WHITE)
      expect(getPieceValue(bishop)).toBe(330)
    })

    it('should return correct value for rook', () => {
      const rook = new Rook(new Coordination('A', 1), Color.WHITE)
      expect(getPieceValue(rook)).toBe(500)
    })

    it('should return correct value for queen', () => {
      const queen = new Queen(new Coordination('D', 1), Color.WHITE)
      expect(getPieceValue(queen)).toBe(900)
    })

    it('should return correct value for king', () => {
      const king = new King(new Coordination('E', 1), Color.WHITE)
      expect(getPieceValue(king)).toBe(20000)
    })

    it('should return 0 for undefined piece', () => {
      expect(getPieceValue(undefined)).toBe(0)
    })
  })

  describe('evaluatePosition', () => {
    let pieces: Map<CoordinationId, PieceType>

    beforeEach(() => {
      pieces = new Map()
    })

    it('should evaluate starting position as roughly equal', () => {
      // Set up starting position
      pieces.set('A1', new Rook(new Coordination('A', 1), Color.WHITE))
      pieces.set('B1', new Knight(new Coordination('B', 1), Color.WHITE))
      pieces.set('C1', new Bishop(new Coordination('C', 1), Color.WHITE))
      pieces.set('D1', new Queen(new Coordination('D', 1), Color.WHITE))
      pieces.set('E1', new King(new Coordination('E', 1), Color.WHITE))
      pieces.set('F1', new Bishop(new Coordination('F', 1), Color.WHITE))
      pieces.set('G1', new Knight(new Coordination('G', 1), Color.WHITE))
      pieces.set('H1', new Rook(new Coordination('H', 1), Color.WHITE))

      for (let file of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
        pieces.set(`${file}2`, new Pawn(new Coordination(file, 2), Color.WHITE))
      }

      pieces.set('A8', new Rook(new Coordination('A', 8), Color.BLACK))
      pieces.set('B8', new Knight(new Coordination('B', 8), Color.BLACK))
      pieces.set('C8', new Bishop(new Coordination('C', 8), Color.BLACK))
      pieces.set('D8', new Queen(new Coordination('D', 8), Color.BLACK))
      pieces.set('E8', new King(new Coordination('E', 8), Color.BLACK))
      pieces.set('F8', new Bishop(new Coordination('F', 8), Color.BLACK))
      pieces.set('G8', new Knight(new Coordination('G', 8), Color.BLACK))
      pieces.set('H8', new Rook(new Coordination('H', 8), Color.BLACK))

      for (let file of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
        pieces.set(`${file}7`, new Pawn(new Coordination(file, 7), Color.BLACK))
      }

      const whiteScore = evaluatePosition(pieces, Color.WHITE)
      const blackScore = evaluatePosition(pieces, Color.BLACK)

      // Starting position should be close to 0 for both sides
      expect(Math.abs(whiteScore)).toBeLessThan(200)
      expect(Math.abs(blackScore)).toBeLessThan(200)
      // Scores should be roughly symmetric
      expect(Math.abs(whiteScore + blackScore)).toBeLessThan(100)
    })

    it('should favor white when white has material advantage', () => {
      pieces.set('E1', new King(new Coordination('E', 1), Color.WHITE))
      pieces.set('D1', new Queen(new Coordination('D', 1), Color.WHITE))
      pieces.set('E8', new King(new Coordination('E', 8), Color.BLACK))

      const score = evaluatePosition(pieces, Color.WHITE)
      expect(score).toBeGreaterThan(800) // Queen advantage
    })

    it('should favor black when black has material advantage', () => {
      pieces.set('E1', new King(new Coordination('E', 1), Color.WHITE))
      pieces.set('E8', new King(new Coordination('E', 8), Color.BLACK))
      pieces.set('D8', new Queen(new Coordination('D', 8), Color.BLACK))

      const score = evaluatePosition(pieces, Color.WHITE)
      expect(score).toBeLessThan(-800) // Black queen advantage
    })

    it('should value center control', () => {
      pieces.set('E1', new King(new Coordination('E', 1), Color.WHITE))
      pieces.set('E4', new Pawn(new Coordination('E', 4), Color.WHITE))
      pieces.set('E8', new King(new Coordination('E', 8), Color.BLACK))
      pieces.set('E5', new Pawn(new Coordination('E', 5), Color.BLACK))

      const score = evaluatePosition(pieces, Color.WHITE)

      // Center pawns should give some advantage
      // The exact score depends on weights, but should be non-trivial
      expect(Math.abs(score)).toBeGreaterThan(0)
    })

    it('should handle empty board', () => {
      const score = evaluatePosition(pieces, Color.WHITE)
      expect(score).toBe(0)
    })

    it('should handle position with only kings', () => {
      pieces.set('E1', new King(new Coordination('E', 1), Color.WHITE))
      pieces.set('E8', new King(new Coordination('E', 8), Color.BLACK))

      const whiteScore = evaluatePosition(pieces, Color.WHITE)
      const blackScore = evaluatePosition(pieces, Color.BLACK)

      // With only kings, position should be roughly equal
      expect(Math.abs(whiteScore + blackScore)).toBeLessThan(100)
    })

    it('should use custom weights when provided', () => {
      pieces.set('E1', new King(new Coordination('E', 1), Color.WHITE))
      pieces.set('D1', new Queen(new Coordination('D', 1), Color.WHITE))
      pieces.set('E8', new King(new Coordination('E', 8), Color.BLACK))

      const defaultScore = evaluatePosition(pieces, Color.WHITE, DEFAULT_WEIGHTS)

      const materialOnlyWeights = {
        material: 1.0,
        position: 0,
        mobility: 0,
        kingSafety: 0,
        pawnStructure: 0,
        centerControl: 0
      }

      const materialOnlyScore = evaluatePosition(pieces, Color.WHITE, materialOnlyWeights)

      // Material-only score should be close to queen value
      expect(materialOnlyScore).toBeGreaterThan(850)
      expect(materialOnlyScore).toBeLessThan(950)

      // Default score might be slightly different due to positional factors
      expect(Math.abs(defaultScore - materialOnlyScore)).toBeLessThan(200)
    })

    it('should evaluate advanced pawns positively', () => {
      pieces.set('E1', new King(new Coordination('E', 1), Color.WHITE))
      pieces.set('E7', new Pawn(new Coordination('E', 7), Color.WHITE)) // Advanced pawn
      pieces.set('E8', new King(new Coordination('E', 8), Color.BLACK))

      const score = evaluatePosition(pieces, Color.WHITE)

      // Advanced pawn should give some advantage (material + position bonus)
      expect(score).toBeGreaterThan(80) // Pawn value 100, minus some position factors
    })
  })

  describe('Position evaluation consistency', () => {
    it('should give opposite scores for opposite colors', () => {
      const pieces = new Map<CoordinationId, PieceType>()
      pieces.set('E1', new King(new Coordination('E', 1), Color.WHITE))
      pieces.set('D1', new Queen(new Coordination('D', 1), Color.WHITE))
      pieces.set('E8', new King(new Coordination('E', 8), Color.BLACK))
      pieces.set('A8', new Rook(new Coordination('A', 8), Color.BLACK))

      const whiteScore = evaluatePosition(pieces, Color.WHITE)
      const blackScore = evaluatePosition(pieces, Color.BLACK)

      // White has queen (900) vs black's rook (500), so ~400 advantage
      expect(whiteScore).toBeGreaterThan(300)
      expect(blackScore).toBeLessThan(-300)
    })

    it('should be deterministic', () => {
      const pieces = new Map<CoordinationId, PieceType>()
      pieces.set('E1', new King(new Coordination('E', 1), Color.WHITE))
      pieces.set('D4', new Queen(new Coordination('D', 4), Color.WHITE))
      pieces.set('E8', new King(new Coordination('E', 8), Color.BLACK))

      const score1 = evaluatePosition(pieces, Color.WHITE)
      const score2 = evaluatePosition(pieces, Color.WHITE)
      const score3 = evaluatePosition(pieces, Color.WHITE)

      expect(score1).toBe(score2)
      expect(score2).toBe(score3)
    })
  })
})
