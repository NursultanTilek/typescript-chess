#!/usr/bin/env python3
"""
Quick Training Script for AlphaZero Chess
Reduced parameters for faster demonstration/testing
"""

import sys
import os

# Modify the training parameters for quick demo
print("=" * 60)
print("AlphaZero Chess - Quick Training Mode")
print("=" * 60)
print("\nThis is a reduced training run for demonstration.")
print("For full training, use: python alphazero_train.py")
print("\nConfiguration:")
print("  - Iterations: 3 (instead of 10)")
print("  - Games per iteration: 10 (instead of 50)")
print("  - MCTS simulations: 100 (instead of 400)")
print("  - Network: 6 residual blocks (instead of 10)")
print("  - Estimated time: 30-60 minutes (GPU) or 3-5 hours (CPU)")
print("\n" + "=" * 60)

# Import after printing info
try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    import torch.optim as optim
    from torch.utils.data import Dataset, DataLoader
    import chess
    import numpy as np
    import pickle
    import time
    from collections import deque
    import math
except ImportError as e:
    print(f"\nERROR: Missing dependency: {e}")
    print("\nPlease install dependencies:")
    print("  pip install torch python-chess numpy")
    sys.exit(1)

# Import the training components from main script
import importlib.util
spec = importlib.util.spec_from_file_location("alphazero_train", "alphazero_train.py")
train_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(train_module)

# Quick training configuration
def quick_train():
    print("\nStarting quick training...")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    if device.type == "cpu":
        print("\n⚠️  WARNING: Training on CPU will be SLOW (3-5 hours for quick mode)")
        print("   Consider using Google Colab with GPU for faster training")

    # Reduced configuration
    num_iterations = 3
    num_selfplay_games = 10
    num_mcts_simulations = 100
    training_epochs = 5

    # Smaller network
    network = train_module.AlphaZeroNet(num_res_blocks=6, num_channels=64).to(device)
    print(f"Network initialized: {sum(p.numel() for p in network.parameters()):,} parameters")

    # Training loop
    for iteration in range(num_iterations):
        print(f"\n{'='*60}")
        print(f"Iteration {iteration + 1}/{num_iterations}")
        print(f"{'='*60}")

        # Generate self-play data
        print(f"Generating {num_selfplay_games} self-play games...")
        training_data = train_module.generate_selfplay_data(
            network,
            num_games=num_selfplay_games,
            num_simulations=num_mcts_simulations
        )

        # Train network
        print(f"Training network for {training_epochs} epochs...")
        train_module.train_network(network, training_data, epochs=training_epochs)

        # Save checkpoint
        checkpoint_path = f"checkpoints/quick_train_iter_{iteration+1}.pt"
        os.makedirs("checkpoints", exist_ok=True)
        torch.save({
            'iteration': iteration + 1,
            'model_state_dict': network.state_dict(),
        }, checkpoint_path)
        print(f"✓ Saved checkpoint: {checkpoint_path}")

    print("\n" + "=" * 60)
    print("Quick training completed!")
    print("=" * 60)

    # Save final model
    final_path = "quick_trained.pt"
    torch.save(network.state_dict(), final_path)
    print(f"✓ Final model saved: {final_path}")

    print("\nNext steps:")
    print("1. Convert to ONNX: python convert_to_onnx.py")
    print("2. For full training: python alphazero_train.py")

if __name__ == "__main__":
    quick_train()
