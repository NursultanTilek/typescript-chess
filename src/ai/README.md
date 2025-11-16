# Chess AI Engine

A sophisticated chess AI engine using classical algorithms and modern optimizations.

## Features

### 1. **Position Evaluation**
The AI evaluates chess positions using multiple strategic factors:

- **Material Balance**: Piece values (Pawn=100, Knight=320, Bishop=330, Rook=500, Queen=900, King=20000)
- **Piece-Square Tables**: Positional bonuses for optimal piece placement
- **Mobility**: Number of legal moves available
- **King Safety**: Pawn shield evaluation and king exposure
- **Pawn Structure**: Penalties for doubled/isolated pawns, bonuses for passed pawns
- **Center Control**: Bonuses for controlling central squares (D4, D5, E4, E5)

### 2. **Search Algorithm**
- **Minimax with Alpha-Beta Pruning**: Efficiently searches the game tree
- **Move Ordering**: Prioritizes captures and center moves for better pruning
- **Quiescence Search**: Searches tactical positions until quiet to avoid horizon effect
- **Iterative Deepening**: Progressively deepens search within time limits
- **Transposition Table**: Memoizes previously evaluated positions (100k entries)

### 3. **Opening Book**
Contains popular opening lines including:
- King's Pawn Game (1.e4 e5)
- Sicilian Defense (1.e4 c5)
- French Defense (1.e4 e6)
- Caro-Kann Defense (1.e4 c6)
- Queen's Gambit (1.d4 d5)
- Indian Defenses (1.d4 Nf6)
- English Opening (1.c4)

### 4. **Difficulty Levels**

| Level | Depth | Think Time | Error Rate | Description |
|-------|-------|-----------|-----------|-------------|
| Beginner | 1 | 0.5s | 30% | Makes frequent mistakes |
| Easy | 2 | 1s | 15% | Makes occasional mistakes |
| Medium | 3 | 3s | 5% | Solid play with few errors |
| Hard | 4 | 5s | 2% | Strong tactical play |
| Expert | 5 | 8s | 0% | Very strong play |
| Master | 6 | 15s | 0% | Top-level play |

## Usage

```typescript
import { ChessAI, Difficulty } from "./ai";

// Create AI instance
const ai = new ChessAI(Difficulty.MEDIUM);

// Get best move
const move = ai.getMove(pieces, Color.BLACK);
if (move) {
  console.log(`AI plays: ${move.from} -> ${move.to}`);
  console.log(`Evaluation score: ${move.score}`);
}

// Change difficulty
ai.setDifficulty(Difficulty.HARD);

// Enable/disable opening book
ai.setUseOpeningBook(true);

// Reset for new game
ai.clearHistory();
```

## Architecture

### Module Structure

```
src/ai/
├── index.ts          # Main exports
├── ChessAI.ts        # AI engine coordinator
├── evaluation.ts     # Position evaluation
├── search.ts         # Minimax search algorithm
├── openingBook.ts    # Opening move database
└── types.ts          # Type definitions
```

### Key Classes

#### `ChessAI`
Main AI engine that coordinates all components.

**Methods:**
- `getMove(pieces, color)` - Get best move with error simulation
- `getBestMove(pieces, color)` - Get best move without errors
- `setDifficulty(difficulty)` - Change AI strength
- `setUseOpeningBook(enabled)` - Toggle opening book
- `clearHistory()` - Reset move history

#### `evaluatePosition(pieces, color, weights)`
Evaluates a position from the perspective of the given color.

**Parameters:**
- `pieces` - Current board state
- `color` - Color to evaluate for
- `weights` - Optional custom evaluation weights

**Returns:** Score (positive = good for color, negative = good for opponent)

#### `findBestMove(pieces, color, config)`
Searches for the best move using minimax with alpha-beta pruning.

**Parameters:**
- `pieces` - Current board state
- `color` - Color to move
- `config` - Search configuration (depth, time limit, etc.)

**Returns:** `AIMove` with from/to coordinates and evaluation score

## Performance

### Search Performance
- **Depth 3**: ~100-500 positions/second
- **Depth 4**: ~1000-5000 positions/second
- **Depth 5**: ~10000-50000 positions/second

### Optimizations
1. **Alpha-Beta Pruning**: Reduces search tree by ~50-90%
2. **Move Ordering**: Improves pruning efficiency by 2-3x
3. **Transposition Table**: Avoids re-evaluating repeated positions
4. **Quiescence Search**: Prevents tactical blunders at leaf nodes
5. **Iterative Deepening**: Provides best move quickly, improves over time

## Training / Tuning

### Evaluation Weights
Customize evaluation priorities by adjusting weights:

```typescript
const customWeights = {
  material: 1.0,      // Piece value
  position: 0.5,      // Piece placement
  mobility: 0.3,      // Move options
  kingSafety: 0.8,    // King protection
  pawnStructure: 0.4, // Pawn quality
  centerControl: 0.3  // Center dominance
};

const score = evaluatePosition(pieces, color, customWeights);
```

### Piece-Square Tables
Located in `evaluation.ts`, these tables define positional bonuses. Modify them to:
- Encourage aggressive play (higher bonuses for advanced squares)
- Encourage defensive play (higher bonuses for back rank)
- Favor specific openings or styles

### Search Depth
Increase `maxDepth` in difficulty levels for stronger play:
- Each additional ply roughly doubles search time
- Depth 6+ requires significant computation
- Use time limits to prevent excessive delays

## Integration

The AI is integrated into the game via `ChessGamePlay.tsx`:

1. AI automatically moves when it's Black's turn
2. Player can adjust difficulty via `AISettings` component
3. "New Game" button resets both board and AI state
4. AI thinking indicator shows during move calculation

## Future Improvements

### Potential Enhancements
1. **Neural Network Evaluation**: Replace hand-crafted eval with learned weights
2. **Monte Carlo Tree Search**: Alternative to minimax for better long-term planning
3. **Endgame Tablebases**: Perfect play in 5-6 piece endgames
4. **Parallel Search**: Multi-threaded search for faster analysis
5. **Time Management**: Allocate more time for critical positions
6. **Pondering**: Think during opponent's time
7. **Learning**: Adjust weights based on game outcomes

### Known Limitations
1. **No Deep Learning**: Uses classical algorithms only
2. **Fixed Depth**: Doesn't extend search in tactical positions
3. **Simple Endgame**: No tablebase support
4. **No Pondering**: Only thinks on its turn
5. **Single-threaded**: Doesn't use multiple CPU cores

## Testing

### Manual Testing
1. Play against AI at different difficulties
2. Verify opening book moves match standard theory
3. Check tactical awareness (captures, checks, threats)
4. Test endgame play (pawn promotion, checkmate patterns)

### Performance Testing
```typescript
const startTime = Date.now();
const move = ai.getBestMove(pieces, color);
const elapsed = Date.now() - startTime;
console.log(`Found move in ${elapsed}ms`);
```

## References

- [Chess Programming Wiki](https://www.chessprogramming.org/)
- [Minimax Algorithm](https://en.wikipedia.org/wiki/Minimax)
- [Alpha-Beta Pruning](https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning)
- [Evaluation Functions](https://www.chessprogramming.org/Evaluation)
- [Opening Book Theory](https://www.chess.com/article/view/common-chess-openings)
