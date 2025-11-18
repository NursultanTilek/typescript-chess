# Neural Network Chess AI - Complete Guide

This guide explains the complete pipeline from training a neural network in Python to using it in your TypeScript chess website.

## 🎯 Overview

```
┌─────────────────┐      ┌──────────────┐      ┌──────────────────┐
│  Python         │      │  Conversion  │      │  JavaScript      │
│  Training       │ ───> │  Pipeline    │ ───> │  Website         │
│  (Google Colab) │      │  (Automated) │      │  (Browser)       │
└─────────────────┘      └──────────────┘      └──────────────────┘
```

## Part 1: Training in Python (Google Colab)

### Step 1: Upload Notebook to Google Colab

1. Go to [Google Colab](https://colab.research.google.com/)
2. Click **File** → **Upload notebook**
3. Upload `training/AlphaZero_Chess_Training.ipynb`
4. Enable GPU: **Runtime** → **Change runtime type** → Select **GPU**

### Step 2: Run Training

1. Click **Runtime** → **Run all** (or `Ctrl+F9`)
2. The notebook will:
   - Install dependencies (PyTorch, python-chess, etc.)
   - Define the neural network architecture (ResNet)
   - Train using self-play with MCTS
   - Save checkpoints after each iteration
   - Convert to ONNX format
   - Download the model files

### Step 3: Download Trained Models

After training completes, you'll get these files:
- `alphazero_chess_final.pt` - PyTorch model (for future training)
- `alphazero_chess.onnx` - ONNX model (for conversion)
- `training_config.json` - Training configuration

**Training Time:**
- **Quick Mode**: 30-60 minutes on GPU (recommended for testing)
- **Full Mode**: 5-7 hours on GPU (better playing strength)

---

## Part 2: Convert Model for JavaScript

### Step 1: Install Conversion Tools

On your local machine, install the required Python packages:

```bash
cd training
pip install torch onnx onnx-tf tensorflowjs
```

### Step 2: Place Model Files

Put the downloaded `alphazero_chess_final.pt` file in the `training/` directory.

### Step 3: Run Conversion Script

```bash
python convert_model.py --input alphazero_chess_final.pt --output-dir ../public/models
```

The script will automatically:
1. Convert PyTorch (.pt) → ONNX (.onnx)
2. Convert ONNX → TensorFlow (SavedModel)
3. Convert TensorFlow → TensorFlow.js (for browser)
4. Save the final model in `public/models/`

**What you'll see:**
```
============================================================
AlphaZero Model Conversion Pipeline
============================================================
Step 1: PyTorch → ONNX
  ✓ Model loaded (XXX,XXX parameters)
  ✓ ONNX export successful
  ✓ File size: XX.X MB

Step 2: ONNX → TensorFlow
  ✓ TensorFlow export successful

Step 3: TensorFlow → TensorFlow.js
  ✓ TensorFlow.js export successful
  ✓ Model files created in: ../public/models
  ✓ Total size: XX.X MB

============================================================
CONVERSION COMPLETED SUCCESSFULLY!
============================================================
```

### Optional: Manual Conversion

If you prefer manual conversion:

```bash
# Step 1: ONNX → TensorFlow
onnx-tf convert -i alphazero_chess.onnx -o tensorflow_model

# Step 2: TensorFlow → TensorFlow.js
tensorflowjs_converter \
    --input_format=tf_saved_model \
    --output_format=tfjs_graph_model \
    tensorflow_model \
    ../public/models
```

---

## Part 3: Use in TypeScript Website

### Step 1: Install Dependencies

The TensorFlow.js dependency is already added to `package.json`:

```bash
npm install
```

### Step 2: Load the Model

The model will automatically be available at `/models/model.json` after conversion.

#### Option A: Load at Application Start

In your main application file (`src/main.tsx` or `src/App.tsx`):

```typescript
import { getNeuralNetworkPlayer } from './ai';

// Load model when app starts
async function initAI() {
  const nn = getNeuralNetworkPlayer();
  const loaded = await nn.loadModel('/models/model.json');

  if (loaded) {
    console.log('✓ Neural network model loaded successfully');
  } else {
    console.log('✗ Failed to load neural network model');
  }
}

initAI();
```

#### Option B: Load On-Demand

Load the model only when the user selects neural network AI:

```typescript
import { createChessAI } from './ai';

const ai = createChessAI();

// Load and enable neural network
async function enableNeuralNetwork() {
  const loaded = await ai.loadNeuralNetwork();

  if (loaded) {
    ai.setUseNeuralNetwork(true);
    console.log('Neural network AI enabled');
  } else {
    console.log('Failed to load neural network, using MCTS instead');
  }
}
```

### Step 3: Use the Neural Network AI

Once loaded, use it like any other AI:

```typescript
import { createChessAI, Difficulty } from './ai';

const ai = createChessAI(Difficulty.EXPERT);

// Enable neural network
await ai.loadNeuralNetwork();
ai.setUseNeuralNetwork(true);

// Get AI move
const move = await ai.getMove(pieces, Color.BLACK);

if (move) {
  console.log(`AI plays: ${move.from} → ${move.to}`);
  console.log(`Position evaluation: ${move.score}`);
}
```

### Step 4: AI Settings UI

Add a toggle in your AI settings component:

```typescript
// src/components/AISettings.tsx

const [useNeuralNetwork, setUseNeuralNetwork] = useState(false);

// In your component
<label>
  <input
    type="checkbox"
    checked={useNeuralNetwork}
    onChange={async (e) => {
      if (e.target.checked) {
        const loaded = await ai.loadNeuralNetwork();
        if (loaded) {
          ai.setUseNeuralNetwork(true);
          setUseNeuralNetwork(true);
        }
      } else {
        ai.setUseNeuralNetwork(false);
        setUseNeuralNetwork(false);
      }
    }}
  />
  Use Neural Network AI (AlphaZero)
</label>
```

---

## 🎮 How It Works

### Neural Network Architecture

The AlphaZero network has two main components:

**Input (8×8×18 tensor):**
- 12 channels for pieces (6 piece types × 2 colors)
- 6 channels for game state (turn, castling rights, en passant)

**Network Body:**
- Initial convolution (18 → 64/128 channels)
- Residual tower (6-10 ResNet blocks)
- Batch normalization + ReLU activation

**Output:**
- **Policy head**: 4096 values (probability for each possible move)
- **Value head**: 1 value (position evaluation from -1 to +1)

### Training Process

1. **Self-play**: Network plays against itself using MCTS
2. **Data generation**: Positions, moves, and outcomes recorded
3. **Training**: Network learns to predict good moves and positions
4. **Iteration**: Repeat with improved network

### Inference in Browser

1. Convert current board position to 8×8×18 tensor
2. Run through TensorFlow.js model
3. Get policy (move probabilities) and value (position score)
4. Select best legal move based on policy
5. Return move to game engine

---

## 📊 Performance

### Model Size
- **Quick mode**: ~5-15 MB
- **Full mode**: ~15-40 MB

### Inference Speed
- **Desktop**: 50-200ms per move
- **Mobile**: 100-500ms per move

### Playing Strength
- **Quick mode**: Intermediate level (~1400-1600 Elo estimated)
- **Full mode**: Advanced level (~1800-2000 Elo estimated)
- **More training iterations**: Even stronger

---

## 🔧 Troubleshooting

### Model won't load in browser

**Check these:**
1. Model files are in `public/models/` directory
2. Files include `model.json` and `.bin` files
3. Dev server is running (`npm run dev`)
4. Browser console shows no CORS errors
5. Path is correct: `/models/model.json` (with leading slash)

**Debug:**
```typescript
const nn = getNeuralNetworkPlayer();
const loaded = await nn.loadModel('/models/model.json');
console.log('Model loaded:', loaded);
console.log('Error:', nn.getLoadError());
```

### Conversion fails

**Common issues:**
1. **Missing dependencies**: Run `pip install torch onnx onnx-tf tensorflowjs`
2. **Wrong model config**: Match `--blocks` and `--channels` to training config
3. **Model file not found**: Ensure `.pt` file is in `training/` directory

### AI makes illegal moves

This shouldn't happen as the code filters to legal moves only. If it does:
1. Check that board state is synced with global store
2. Verify `getLegalMoves()` in `neuralNetwork.ts`
3. Check browser console for errors

### Slow inference

**Optimize:**
1. Use GPU backend if available (TF.js will auto-detect)
2. Use smaller model (Quick mode instead of Full)
3. Reduce number of residual blocks during training
4. Enable WebGL in browser settings

---

## 🚀 Next Steps

### Improve Playing Strength

1. **Train longer**: Increase iterations in Colab notebook
2. **More self-play**: Increase games per iteration
3. **Larger network**: More residual blocks and channels
4. **Fine-tuning**: Resume training from checkpoint

### Advanced Features

1. **MCTS + Neural Network**: Use NN for evaluation in MCTS
2. **Opening book**: Combine with existing opening book
3. **Difficulty levels**: Train multiple models at different strengths
4. **Analysis mode**: Show top moves and evaluations

### Deploy to Production

1. **Optimize model**: Quantization and pruning for smaller size
2. **CDN hosting**: Host model files on CDN for faster loading
3. **Progressive loading**: Load model in background
4. **Fallback**: Default to MCTS if NN fails to load

---

## 📁 File Structure

```
typescript-chess/
├── training/
│   ├── AlphaZero_Chess_Training.ipynb    # Colab training notebook
│   ├── alphazero_train.py                # Training script
│   ├── quick_train.py                    # Quick training mode
│   ├── convert_model.py                  # Conversion script ⭐
│   ├── convert_to_onnx.py                # ONNX conversion
│   └── TRAINING_INSTRUCTIONS.md          # Training guide
│
├── public/
│   └── models/                           # Model files (after conversion)
│       ├── model.json                    # TensorFlow.js model
│       └── *.bin                         # Model weights
│
└── src/
    └── ai/
        ├── neuralNetwork.ts              # NN player implementation ⭐
        ├── ChessAI.ts                    # Main AI (updated) ⭐
        ├── index.ts                      # Exports (updated) ⭐
        └── ...
```

---

## 💡 Tips

1. **Start with Quick Mode**: Test the pipeline end-to-end before long training
2. **Save checkpoints**: Colab can disconnect, checkpoints let you resume
3. **Test locally first**: Ensure conversion works before deploying
4. **Monitor model size**: Larger models = longer loading times
5. **Version your models**: Keep track of which model version is deployed

---

## 📚 Resources

- [AlphaZero Paper](https://arxiv.org/abs/1712.01815) - Original research
- [TensorFlow.js Docs](https://www.tensorflow.org/js) - Browser ML framework
- [python-chess](https://python-chess.readthedocs.io/) - Python chess library
- [Google Colab](https://colab.research.google.com/) - Free GPU training

---

## ❓ FAQ

**Q: Do I need a GPU for inference?**
A: No, TensorFlow.js works on CPU too. GPU just makes it faster.

**Q: Can I use the Python model directly?**
A: No, you must convert PyTorch → ONNX → TensorFlow → TensorFlow.js for browsers.

**Q: How often should I retrain?**
A: Only when you want to improve the model. Once trained, it's good forever.

**Q: Can I train on my local machine?**
A: Yes, but it will be very slow without a GPU. Colab is recommended.

**Q: What if I want even stronger AI?**
A: Train for more iterations, use a larger network, or increase MCTS simulations.

---

## 🎓 Summary

```bash
# 1. Train in Python (Google Colab)
#    → Upload notebook, enable GPU, run all cells
#    → Download: alphazero_chess_final.pt

# 2. Convert for JavaScript (Local machine)
pip install torch onnx onnx-tf tensorflowjs
python training/convert_model.py

# 3. Use in TypeScript (Website)
await ai.loadNeuralNetwork();
ai.setUseNeuralNetwork(true);
const move = await ai.getMove(pieces, color);
```

**That's it! You now have a neural network chess AI running in your browser! 🎉**
