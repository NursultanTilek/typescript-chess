# AlphaZero Chess Training Instructions

This guide will help you train a neural network chess AI using Google Colab's free GPU.

## Quick Start

1. **Upload notebook to Google Colab**
   - Go to [Google Colab](https://colab.research.google.com/)
   - Click `File` → `Upload notebook`
   - Upload `AlphaZero_Chess_Training.ipynb`

2. **Enable GPU**
   - Click `Runtime` → `Change runtime type`
   - Select `GPU` (T4 GPU is free)
   - Click `Save`

3. **Run all cells**
   - Click `Runtime` → `Run all`
   - Or press `Ctrl+F9` (Windows/Linux) or `Cmd+F9` (Mac)

4. **Wait for training to complete**
   - Quick mode: ~30-60 minutes
   - Full mode: ~5-7 hours

5. **Download the trained models**
   - Files will automatically download at the end
   - You'll get: `alphazero_chess_final.pt`, `alphazero_chess.onnx`, and `training_config.json`

## Training Modes

### Quick Mode (Default)
- **Time**: 30-60 minutes on GPU
- **Configuration**:
  - 3 iterations
  - 10 games per iteration
  - 100 MCTS simulations per move
  - 6 residual blocks, 64 channels
- **Best for**: Testing, learning, getting a working model fast

### Full Mode
- **Time**: 5-7 hours on GPU
- **Configuration**:
  - 10 iterations
  - 50 games per iteration
  - 400 MCTS simulations per move
  - 10 residual blocks, 128 channels
- **Best for**: Better playing strength, production use

To switch modes, change this line in the notebook (Section 6):
```python
QUICK_MODE = True  # Change to False for full training
```

## After Training

Once training is complete, you'll have three files:

1. **alphazero_chess_final.pt** - PyTorch model (for future training)
2. **alphazero_chess.onnx** - ONNX model (for conversion)
3. **training_config.json** - Training configuration

### Converting to TensorFlow.js

To use the model in your browser-based chess app, you need to convert ONNX → TensorFlow → TensorFlow.js:

#### Step 1: Install conversion tools (run locally)
```bash
pip install onnx-tf tensorflowjs
```

#### Step 2: Convert ONNX to TensorFlow
```bash
onnx-tf convert -i alphazero_chess.onnx -o tensorflow_model
```

#### Step 3: Convert TensorFlow to TensorFlow.js
```bash
tensorflowjs_converter \
    --input_format=tf_saved_model \
    --output_format=tfjs_graph_model \
    tensorflow_model \
    ../public/tfjs_model
```

#### Step 4: Load in your TypeScript application
```typescript
import * as tf from '@tensorflow/tfjs';

// Load the model
const model = await tf.loadGraphModel('/tfjs_model/model.json');

// Convert board to tensor (8x8x18)
const boardTensor = tf.tensor4d(boardArray, [1, 18, 8, 8]);

// Get predictions
const [policy, value] = model.predict(boardTensor);
```

## Troubleshooting

### "No GPU detected"
- Make sure you enabled GPU: `Runtime` → `Change runtime type` → `GPU`
- Google Colab's free GPU has usage limits. If you hit the limit, try again later or use Colab Pro

### Training is taking too long
- Use Quick Mode instead of Full Mode
- Reduce `num_selfplay_games` or `num_mcts_simulations` in the config

### Out of memory errors
- Reduce `batch_size` in the config (try 32 instead of 64)
- Reduce `num_channels` (try 64 instead of 128)
- Reduce `num_res_blocks` (try 4 or 6 instead of 10)

### Model not learning well
- Increase training time (more iterations)
- Increase MCTS simulations (better quality self-play data)
- Check that GPU is enabled (CPU training produces poor results)

## Resuming Training

If training gets interrupted, you can resume from a checkpoint:

```python
# In the notebook, add this before the training loop
checkpoint = torch.load('checkpoints/iter_3.pt')
network.load_state_dict(checkpoint['model_state_dict'])
start_iteration = checkpoint['iteration']
```

## Model Architecture

The AlphaZero network consists of:

- **Input**: 8×8×18 tensor (board representation)
  - 12 channels for pieces (6 piece types × 2 colors)
  - 6 channels for game state (castling rights, en passant, turn)

- **Body**: Residual tower
  - Initial convolution (18 → 64/128 channels)
  - 6-10 residual blocks
  - Batch normalization + ReLU activation

- **Output**: Two heads
  - **Policy head**: 4096 outputs (all possible moves)
  - **Value head**: 1 output (position evaluation -1 to +1)

## Training Process

1. **Self-play**: Network plays against itself using MCTS
2. **Data generation**: Positions, moves, and outcomes are recorded
3. **Training**: Network learns from self-play games
4. **Iteration**: Repeat with improved network

Each iteration makes the network stronger!

## Next Steps

After you have the TensorFlow.js model:

1. Integrate it with your chess application
2. Add a new AI difficulty level that uses the neural network
3. Compare performance with existing Minimax and MCTS engines
4. Fine-tune by training more iterations
5. Share your results!

## Resources

- [AlphaZero Paper](https://arxiv.org/abs/1712.01815)
- [Google Colab](https://colab.research.google.com/)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [python-chess Documentation](https://python-chess.readthedocs.io/)

## Questions?

If you encounter issues:
1. Check the troubleshooting section above
2. Review the notebook cell outputs for error messages
3. Make sure all dependencies are installed correctly
4. Verify GPU is enabled in Colab

Happy training! 🚀♟️
