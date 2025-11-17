# TypeScript Chess with AI 🎮♟️

A fully-featured chess game built with **React + TypeScript** featuring an advanced AI opponent powered by **Monte Carlo Tree Search (MCTS)** and **AlphaZero-style neural networks**.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

## 🎯 Project Overview

This is an **Object-Oriented Programming (OOP)** implementation of chess in TypeScript with a sophisticated AI system. The project demonstrates advanced software engineering concepts including:

- **Design Patterns**: Strategy, Observer, Factory patterns
- **State Management**: Zustand for global state, deep cloning for isolation
- **AI Algorithms**: MCTS, Minimax with alpha-beta pruning, neural networks
- **Type Safety**: Full TypeScript implementation with strict typing
- **Testing**: 73 comprehensive tests covering AI, game logic, and edge cases

## ✨ Features

### 🎲 Complete Chess Engine
- ✅ All standard chess rules (castling, en passant, pawn promotion)
- ✅ Legal move validation
- ✅ Check and checkmate detection
- ✅ Stalemate and draw conditions
- ✅ Move history tracking

### 🤖 Advanced AI System

**Multiple AI Algorithms:**
- **Monte Carlo Tree Search (MCTS)** - AlphaZero-style search with UCB1
- **Minimax with Alpha-Beta Pruning** - Traditional chess engine algorithm
- **Neural Network** (Training mode) - PyTorch-based self-learning AI

**AI Features:**
- 🎚️ **6 Difficulty Levels**: Beginner to Master
- 📚 **Opening Book**: Database of strong opening moves
- 🧠 **Position Evaluation**: Material, piece-square tables, king safety
- ⏱️ **Configurable Think Time**: 0.5s to 15s based on difficulty
- 📊 **Real-time Stats**: Shows evaluation, search depth, thinking time

### 🎨 User Interface
- 🎨 **Lichess.org-inspired design**: Clean, professional look
- ✨ **Move Highlights**: Shows legal moves when piece is selected
- 👑 **Check Indicator**: Highlights king when in check
- 🔄 **Last Move Display**: Visual indicator of last move
- ⚙️ **Settings Panel**: Configure AI difficulty and player color
- 📈 **AI Info Panel**: Real-time AI analysis and move history

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm

### Installation & Running

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open **http://localhost:5173/** in your browser and start playing!

### Testing

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run specific test file
npm test -- search.test.ts
```

### Production Build

```bash
npm run build
npm run preview
```

## 🎮 How to Play

1. **Start the game** - Board is initialized with standard chess starting position
2. **Select a piece** - Click on any piece of your color (default: White)
3. **See legal moves** - Green highlights show where you can move
4. **Make a move** - Click on a highlighted square
5. **AI responds** - Watch the AI calculate and make its move
6. **Game info** - Check the right panel for AI analysis

### Controls

- **Enable/Disable AI**: Toggle AI opponent on/off
- **Difficulty**: Choose from Beginner, Easy, Medium, Hard, Expert, or Master
- **Player Color**: Select to play as White or Black
- **Move History**: View all moves in the game

## 🐛 Critical Bug Fixes (Latest Session)

### Problem: Piece Coordinate Corruption
**Symptoms:**
- AI couldn't make moves (piece coordinates didn't match Map keys)
- Pieces appeared in wrong positions after AI calculation
- Console showed hundreds of "MISMATCH" errors

**Root Cause:**
Shallow copying of Map objects caused piece objects to be **shared** between:
1. Global pieces store (`usePieces`)
2. Component state (`ChessGamePlay.state.boardCondition`)
3. AI calculation temporary boards

When AI calculated moves using `isMoveSafe()`, it modified shared piece coordinates, corrupting the display board.

**Solution:**
Implemented `deepCloneBoard()` utility that creates **completely independent piece instances**:

```typescript
// ❌ WRONG - Shallow copy (pieces still shared)
boardCondition: new Map(usePieces.getState().pieces)

// ✅ CORRECT - Deep clone (independent pieces)
boardCondition: deepCloneBoard(usePieces.getState().pieces)
```

**Applied in 5 critical locations:**
1. `ChessGamePlay.tsx` - State initialization
2. `Piece.ts` - Move safety checks (`isMoveSafe`)
3. `search.ts` - AI search algorithms (`makeMove`)
4. `Board.tsx` - Player move execution
5. `Board.tsx` - FEN initialization

### Problem: React Not Re-rendering After AI Moves
**Symptoms:**
- AI calculated moves correctly (console showed correct output)
- But pieces didn't move visually on the board

**Root Cause:**
React uses **reference equality** to detect Map changes. Passing the same Map reference meant React thought nothing changed.

**Solution:**
Always create new Map instances when updating state:

```typescript
this.changeBoardCondition(new Map(newPieces))
```

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State**: Zustand (global store)
- **Testing**: Vitest
- **AI Training**: PyTorch, python-chess (optional)

### Project Structure

```
src/
├── ai/                     # AI Engine
│   ├── ChessAI.ts         # Main AI controller
│   ├── mcts.ts            # Monte Carlo Tree Search
│   ├── search.ts          # Minimax & alpha-beta pruning
│   ├── evaluation.ts      # Position evaluation
│   ├── openingBook.ts     # Opening moves database
│   └── __tests__/         # AI tests (73 tests)
├── board/                  # Chess Board
│   ├── Board.tsx          # Board component (rendering)
│   ├── BoardFactory.ts    # Board setup and utilities
│   ├── Coordination.ts    # Square coordinate system
│   └── Move.ts            # Move execution logic
├── pieces/                 # Chess Pieces
│   ├── Piece.ts           # Abstract base class
│   ├── Pawn.ts, Rook.ts, Knight.ts, etc.
│   └── [Each piece's movement logic]
├── gameState/              # Game State
│   └── GameStateChecker.ts # Check/checkmate detection
├── store/                  # Global State (Zustand)
│   ├── usePieces.ts       # Pieces store
│   └── useHistory.ts      # Move history
├── components/             # UI Components
│   ├── AISettings.tsx     # AI configuration panel
│   └── AIInfoPanel.tsx    # AI analysis display
├── utils/                  # Utilities
│   └── boardClone.ts      # Deep cloning for state isolation
└── ChessGamePlay.tsx       # Main game controller
```

### Key Design Patterns

**1. State Isolation Pattern**
- Component state uses deep clones to prevent corruption
- AI calculations use independent piece objects
- No shared mutable state between stores

**2. Factory Pattern**
- `BoardFactory` creates and initializes board
- `BoardFactory.setupPiecePosition()` creates pieces by type

**3. Strategy Pattern**
- Multiple AI algorithms (MCTS, Minimax) switchable via difficulty
- Different evaluation strategies per difficulty level

**4. Observer Pattern**
- React state updates trigger UI re-renders
- Zustand store notifies subscribers of changes

## 🧪 Testing

Comprehensive test suite with **73 tests** covering:

| Test Suite | Tests | Coverage |
|------------|-------|----------|
| Legal Move Validation | 5 | AI only suggests legal moves |
| Color Validation | 5 | AI only moves its own pieces |
| Opening Book | 17 | Opening moves are correct |
| Position Evaluation | 17 | Material & position scoring |
| Search Algorithms | 10 | Minimax, alpha-beta, MCTS |
| ChessAI Integration | 19 | Full AI behavior |

**Test Results**: 72/73 passing (99% pass rate)

```bash
# Run all tests
npm test

# Test specific functionality
npm test -- legalMoves.test.ts
npm test -- colorValidation.test.ts
npm test -- mcts.test.ts
```

## 🎯 AI Difficulty Levels

| Level | Algorithm | Depth | Think Time | MCTS Iterations | Description |
|-------|-----------|-------|------------|-----------------|-------------|
| **Beginner** | Minimax | 1 | 0.5s | 100 | Makes frequent mistakes |
| **Easy** | Minimax | 2 | 1s | 300 | Occasional errors |
| **Medium** | MCTS | 3 | 3s | 500 | Solid play, few errors |
| **Hard** | MCTS | 4 | 5s | 800 | Strong tactical play |
| **Expert** | MCTS | 5 | 8s | 1200 | Very strong play |
| **Master** | MCTS | 6 | 15s | 2000 | Top-level play |

## 🔬 AI Training (Optional)

Train your own AlphaZero-style neural network:

```bash
cd python-training

# Install dependencies
pip install -r requirements.txt

# Start training
python train.py
```

**Training Features:**
- Self-play game generation
- Policy and value network training
- TensorBoard logging
- Model checkpointing
- Export for TypeScript integration

## 📊 Performance Optimizations

1. **Transposition Tables** - Cache position evaluations
2. **Move Ordering** - Prioritize captures and center control
3. **Alpha-Beta Pruning** - Skip unnecessary search branches
4. **Iterative Deepening** - Gradually increase search depth
5. **Quiescence Search** - Extend search in tactical positions
6. **Opening Book** - Skip search for known openings
7. **Deep Cloning** - Isolated state prevents recalculation

## 🎓 What I Learned Building This

This project demonstrates:

✅ **Advanced TypeScript** - Strict typing, generics, abstract classes
✅ **React Best Practices** - Component composition, state management, re-rendering optimization
✅ **Chess Engine Implementation** - Move generation, position evaluation, game tree search
✅ **AI Algorithms** - MCTS, minimax, alpha-beta, neural networks
✅ **State Management** - Zustand, immutability, state isolation
✅ **Testing** - Unit tests, integration tests, test-driven development
✅ **Debugging Complex Issues** - Reference vs value, shallow vs deep copy, state corruption
✅ **Performance Optimization** - Memoization, caching, algorithmic improvements

## 🐞 Known Issues

- [ ] One test timing out (colorValidation - opponent pieces test)
- [ ] AlphaZero training requires significant compute resources (GPU recommended)

## 🚀 Future Enhancements

- [ ] Online multiplayer with WebSockets
- [ ] Game save/load functionality
- [ ] PGN (Portable Game Notation) export
- [ ] Position analysis mode
- [ ] Puzzle mode for training
- [ ] Time controls (blitz, rapid, classical)
- [ ] ELO rating system
- [ ] Game replay with navigation

## 📝 License

MIT License - feel free to use this for learning and projects!

## 🙏 Acknowledgments

- **Lichess.org** - UI design inspiration
- **AlphaZero** - AI algorithm inspiration
- **Chess.com** - Chess rules reference
- **React** - Excellent documentation

## 📧 Contact

Built with ❤️ by [Your Name]

For questions or issues, please open a GitHub issue.

---

**Status**: ✅ All critical bugs fixed | 🎮 Fully playable | 🤖 AI working correctly | 🧪 72/73 tests passing
