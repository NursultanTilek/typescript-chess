# AlphaZero Chess Training

This directory contains the Python training script for the AlphaZero-style chess AI.

## 🧠 What is AlphaZero?

AlphaZero is a reinforcement learning algorithm developed by DeepMind that learns to play chess (and other games) from scratch through self-play. It combines:

1. **Monte Carlo Tree Search (MCTS)** - Smart game tree exploration
2. **Deep Neural Network** - Policy (move selection) + Value (position evaluation)
3. **Self-Play** - Generates its own training data
4. **Iterative Improvement** - Gets better over time

## 🏗️ Architecture

**Neural Network:**
- Input: 8x8x18 board representation
  - 12 channels for pieces (6 per color)
  - 6 auxiliary channels (castling, en passant, turn)
- 10-19 residual blocks (ResNet architecture)
- **Policy Head**: Outputs move probabilities (4096 possible moves)
- **Value Head**: Outputs position evaluation (-1 to +1)

**Training Process:**
1. Self-play games using MCTS + neural network
2. Store (board state, MCTS policy, game outcome) tuples
3. Train network to predict MCTS policy and game outcome
4. Repeat with improved network

## 📋 Requirements

### System Requirements
- **GPU Recommended**: CUDA-capable GPU for faster training (10-100x speedup)
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 2GB for checkpoints
- **Time**: 6-24 hours for meaningful training

### Software Requirements
```bash
Python 3.8+
PyTorch 2.0+
python-chess
numpy
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd training
pip install -r requirements.txt
```

### 2. Run Training
```bash
python alphazero_train.py
```

**Training Parameters** (edit in `alphazero_train.py`):
- `num_iterations = 10` - Number of training cycles
- `num_selfplay_games = 50` - Games per iteration
- `num_mcts_simulations = 400` - MCTS simulations per move
- `training_epochs = 10` - Neural network epochs per iteration
- `num_res_blocks = 10` - Residual blocks (10-19)
- `num_channels = 128` - Conv channels (128-256)

### 3. Training Progress

The script will:
1. Generate 50 self-play games (takes ~30-60 min per iteration)
2. Train neural network on generated data (~5 min)
3. Save checkpoint to `checkpoints/alphazero_iter_N.pt`
4. Repeat for N iterations

**Output:**
```
Iteration 1/10
  Generated 10/50 games
  Generated 20/50 games
  ...
  Generated 3000 training positions
Training network for 10 epochs...
  Epoch 1/10 - Loss: 2.4500 (Policy: 1.8000, Value: 0.6500)
  Epoch 2/10 - Loss: 1.9200 (Policy: 1.4500, Value: 0.4700)
  ...
Saved checkpoint: checkpoints/alphazero_iter_1.pt
```

## ⚡ Training on GPU vs CPU

**GPU (CUDA):**
- 50 games: ~30 minutes
- Full iteration: ~40 minutes
- 10 iterations: ~7 hours

**CPU Only:**
- 50 games: ~4-6 hours
- Full iteration: ~5-7 hours
- 10 iterations: ~60-80 hours

**Speed Up Tips:**
- Reduce `num_selfplay_games` to 20-30
- Reduce `num_mcts_simulations` to 200-300
- Use smaller network (10 res blocks instead of 19)

## 📊 Monitoring Training

### Loss Values
- **Policy Loss**: How well network predicts MCTS policy (should decrease)
- **Value Loss**: How well network predicts game outcome (should decrease)
- **Total Loss**: Sum of both losses

**Good Training:**
```
Epoch 1  - Loss: 2.50 (Policy: 1.80, Value: 0.70)
Epoch 5  - Loss: 1.20 (Policy: 0.85, Value: 0.35)
Epoch 10 - Loss: 0.80 (Policy: 0.55, Value: 0.25)
```

## 🔄 Converting to TensorFlow.js

After training, convert the PyTorch model to TensorFlow.js for use in the browser:

### Option A: Using ONNX (Recommended)

```bash
# 1. Install ONNX tools
pip install onnx onnx-tf tensorflowjs

# 2. Export PyTorch to ONNX
python convert_to_onnx.py

# 3. Convert ONNX to TensorFlow
onnx-tf convert -i model.onnx -o tensorflow_model

# 4. Convert TensorFlow to TensorFlow.js
tensorflowjs_converter \
    --input_format=tf_saved_model \
    --output_format=tfjs_graph_model \
    tensorflow_model \
    ../public/tfjs_model
```

### Option B: Manual Conversion Script

Create `convert_to_tfjs.py`:
```python
import torch
import tensorflowjs as tfjs
from alphazero_train import AlphaZeroNet

# Load PyTorch model
model = AlphaZeroNet()
model.load_state_dict(torch.load('alphazero_final.pt'))
model.eval()

# Convert to TensorFlow.js
# (Implementation depends on your specific needs)
```

## 🎮 Using the Trained Model

Once converted to TensorFlow.js, the model will be loaded in the browser:

```typescript
// In your TypeScript/React app
import * as tf from '@tensorflow/tfjs';

const model = await tf.loadGraphModel('/tfjs_model/model.json');

// Use for move prediction
const boardTensor = boardToTensor(currentPosition);
const [policy, value] = model.predict(boardTensor);
```

## 🔧 Troubleshooting

**Out of Memory:**
- Reduce batch size: `batch_size=32` instead of 64
- Reduce network size: `num_res_blocks=8`, `num_channels=64`
- Use gradient accumulation

**Training Too Slow:**
- Reduce `num_selfplay_games` to 20
- Reduce `num_mcts_simulations` to 200
- Use GPU instead of CPU

**Model Not Learning:**
- Increase training epochs: `training_epochs=20`
- Increase learning rate: `learning_rate=0.01`
- Check that loss is decreasing

## 📈 Expected Results

After full training (10 iterations):
- **Beginner Level**: 1-2 iterations (~1-2 hours)
- **Intermediate**: 5-6 iterations (~5-8 hours)
- **Advanced**: 10+ iterations (~15-20 hours)
- **Expert**: 50+ iterations (~100+ hours)

The current MCTS + evaluation hybrid is already quite strong. Adding the neural network will improve:
1. **Opening play** - Better pattern recognition
2. **Endgame** - Learned winning techniques
3. **Tactical awareness** - Pattern matching for tactics

## 🔬 Advanced: Experiment with Parameters

**For Better Quality** (slower):
```python
num_iterations = 50
num_selfplay_games = 100
num_mcts_simulations = 800
num_res_blocks = 19
num_channels = 256
```

**For Faster Training** (lower quality):
```python
num_iterations = 5
num_selfplay_games = 20
num_mcts_simulations = 200
num_res_blocks = 6
num_channels = 64
```

## 📚 References

- [AlphaZero Paper](https://arxiv.org/abs/1712.01815) - DeepMind's original paper
- [AlphaGo Zero Paper](https://www.nature.com/articles/nature24270)
- [geochri/AlphaZero_Chess](https://github.com/geochri/AlphaZero_Chess) - Reference implementation

## 📝 License

This training code is provided for educational purposes.
