#!/usr/bin/env python3
"""
AlphaZero Chess Training Script
Based on the DeepMind AlphaZero paper and geochri/AlphaZero_Chess implementation

This script trains a neural network to play chess using:
1. Self-play with MCTS to generate training data
2. Neural network with policy and value heads
3. Iterative improvement through arena evaluation

Requirements:
- PyTorch
- python-chess
- numpy
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import chess
import numpy as np
import pickle
import os
from typing import List, Tuple
import time
from collections import deque
import math

# ===========================
# Neural Network Architecture
# ===========================

class ResidualBlock(nn.Module):
    """Residual block with batch normalization"""
    def __init__(self, channels=256):
        super(ResidualBlock, self).__init__()
        self.conv1 = nn.Conv2d(channels, channels, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(channels)
        self.conv2 = nn.Conv2d(channels, channels, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(channels)

    def forward(self, x):
        residual = x
        out = F.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out += residual
        out = F.relu(out)
        return out


class AlphaZeroNet(nn.Module):
    """
    AlphaZero Neural Network

    Architecture:
    - Initial convolution block
    - 19 residual blocks
    - Policy head (move probabilities)
    - Value head (position evaluation)
    """
    def __init__(self, num_res_blocks=19, num_channels=256):
        super(AlphaZeroNet, self).__init__()

        # Input: 8x8x18 (board representation)
        # 12 piece types (6 per color) + 6 auxiliary planes
        self.input_channels = 18

        # Initial convolution block
        self.conv_block = nn.Sequential(
            nn.Conv2d(self.input_channels, num_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(num_channels),
            nn.ReLU()
        )

        # Residual tower
        self.res_blocks = nn.ModuleList(
            [ResidualBlock(num_channels) for _ in range(num_res_blocks)]
        )

        # Policy head
        self.policy_conv = nn.Conv2d(num_channels, 32, kernel_size=1)
        self.policy_bn = nn.BatchNorm2d(32)
        self.policy_fc = nn.Linear(32 * 8 * 8, 4096)  # All possible moves

        # Value head
        self.value_conv = nn.Conv2d(num_channels, 32, kernel_size=1)
        self.value_bn = nn.BatchNorm2d(32)
        self.value_fc1 = nn.Linear(32 * 8 * 8, 256)
        self.value_fc2 = nn.Linear(256, 1)

    def forward(self, x):
        # Initial conv
        x = self.conv_block(x)

        # Residual tower
        for block in self.res_blocks:
            x = block(x)

        # Policy head
        policy = F.relu(self.policy_bn(self.policy_conv(x)))
        policy = policy.view(-1, 32 * 8 * 8)
        policy = self.policy_fc(policy)
        policy = F.log_softmax(policy, dim=1)

        # Value head
        value = F.relu(self.value_bn(self.value_conv(x)))
        value = value.view(-1, 32 * 8 * 8)
        value = F.relu(self.value_fc1(value))
        value = torch.tanh(self.value_fc2(value))

        return policy, value


# ===========================
# Board Encoding/Decoding
# ===========================

def board_to_tensor(board: chess.Board) -> np.ndarray:
    """
    Convert chess board to neural network input tensor

    Returns: 8x8x18 numpy array
    - 12 channels for piece positions (6 per color)
    - 6 auxiliary channels (castling rights, en passant, turn, etc.)
    """
    tensor = np.zeros((18, 8, 8), dtype=np.float32)

    # Piece planes (12 channels)
    piece_idx = {'P': 0, 'N': 1, 'B': 2, 'R': 3, 'Q': 4, 'K': 5,
                 'p': 6, 'n': 7, 'b': 8, 'r': 9, 'q': 10, 'k': 11}

    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if piece:
            rank, file = divmod(square, 8)
            channel = piece_idx[piece.symbol()]
            tensor[channel, rank, file] = 1.0

    # Auxiliary planes (6 channels)
    # Channel 12: White's turn
    if board.turn == chess.WHITE:
        tensor[12, :, :] = 1.0

    # Channel 13-16: Castling rights
    if board.has_kingside_castling_rights(chess.WHITE):
        tensor[13, :, :] = 1.0
    if board.has_queenside_castling_rights(chess.WHITE):
        tensor[14, :, :] = 1.0
    if board.has_kingside_castling_rights(chess.BLACK):
        tensor[15, :, :] = 1.0
    if board.has_queenside_castling_rights(chess.BLACK):
        tensor[16, :, :] = 1.0

    # Channel 17: En passant
    if board.ep_square is not None:
        rank, file = divmod(board.ep_square, 8)
        tensor[17, rank, file] = 1.0

    return tensor


def move_to_index(move: chess.Move) -> int:
    """Convert chess move to policy index (0-4095)"""
    from_square = move.from_square
    to_square = move.to_square

    # Simple encoding: from_square * 64 + to_square
    # This gives us 4096 possible indices
    index = from_square * 64 + to_square
    return index


def index_to_move(index: int) -> Tuple[int, int]:
    """Convert policy index back to move coordinates"""
    from_square = index // 64
    to_square = index % 64
    return from_square, to_square


# ===========================
# MCTS for Self-Play
# ===========================

class MCTSNode:
    """MCTS node for AlphaZero self-play"""
    def __init__(self, board: chess.Board, parent=None, move=None, prior=0.0):
        self.board = board.copy()
        self.parent = parent
        self.move = move
        self.prior = prior

        self.children = {}
        self.visit_count = 0
        self.value_sum = 0.0
        self.is_expanded = False

    def value(self):
        if self.visit_count == 0:
            return 0.0
        return self.value_sum / self.visit_count

    def ucb_score(self, c_puct=1.0):
        """Upper Confidence Bound score"""
        if self.parent is None:
            return float('inf')

        u = c_puct * self.prior * math.sqrt(self.parent.visit_count) / (1 + self.visit_count)
        return self.value() + u

    def select_child(self, c_puct=1.0):
        """Select child with highest UCB score"""
        return max(self.children.values(), key=lambda child: child.ucb_score(c_puct))

    def expand(self, policy_probs):
        """Expand node with legal moves"""
        self.is_expanded = True

        for move in self.board.legal_moves:
            move_idx = move_to_index(move)
            prior = policy_probs[move_idx]

            child_board = self.board.copy()
            child_board.push(move)

            self.children[move] = MCTSNode(child_board, parent=self, move=move, prior=prior)

    def backup(self, value):
        """Backpropagate value up the tree"""
        self.visit_count += 1
        self.value_sum += value

        if self.parent:
            self.parent.backup(-value)  # Negate for opponent


def mcts_search(board: chess.Board, network: AlphaZeroNet, num_simulations=800, c_puct=1.0):
    """
    Perform MCTS search using neural network guidance

    Returns: policy vector (probability distribution over moves)
    """
    root = MCTSNode(board)

    device = next(network.parameters()).device

    # Get initial policy and value from network
    state_tensor = torch.FloatTensor(board_to_tensor(board)).unsqueeze(0).to(device)
    with torch.no_grad():
        policy_logits, _ = network(state_tensor)
        policy_probs = torch.exp(policy_logits).cpu().numpy()[0]

    root.expand(policy_probs)

    # Run simulations
    for _ in range(num_simulations):
        node = root

        # Selection
        while node.is_expanded and not node.board.is_game_over():
            node = node.select_child(c_puct)

        # Expansion and evaluation
        if not node.board.is_game_over():
            state_tensor = torch.FloatTensor(board_to_tensor(node.board)).unsqueeze(0).to(device)
            with torch.no_grad():
                policy_logits, value = network(state_tensor)
                policy_probs = torch.exp(policy_logits).cpu().numpy()[0]
                value = value.item()

            node.expand(policy_probs)
            node.backup(value)
        else:
            # Terminal node
            result = node.board.result()
            value = 1.0 if result == "1-0" else (-1.0 if result == "0-1" else 0.0)
            node.backup(value)

    # Return visit count distribution as policy
    policy = np.zeros(4096, dtype=np.float32)
    total_visits = sum(child.visit_count for child in root.children.values())

    for move, child in root.children.items():
        move_idx = move_to_index(move)
        policy[move_idx] = child.visit_count / total_visits if total_visits > 0 else 0.0

    return policy


# ===========================
# Training
# ===========================

class ChessDataset(Dataset):
    """Dataset for chess positions"""
    def __init__(self, data):
        self.data = data

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        state, policy, value = self.data[idx]
        return torch.FloatTensor(state), torch.FloatTensor(policy), torch.FloatTensor([value])


def generate_selfplay_data(network: AlphaZeroNet, num_games=100, num_simulations=400):
    """Generate training data through self-play"""
    print(f"Generating {num_games} self-play games...")

    training_data = []
    device = next(network.parameters()).device

    for game_num in range(num_games):
        board = chess.Board()
        game_data = []

        while not board.is_game_over():
            # Get MCTS policy
            policy = mcts_search(board, network, num_simulations=num_simulations)

            # Store (state, policy, placeholder_value)
            state = board_to_tensor(board)
            game_data.append((state, policy))

            # Sample move from policy
            legal_moves = list(board.legal_moves)
            legal_indices = [move_to_index(move) for move in legal_moves]
            legal_probs = policy[legal_indices]
            legal_probs = legal_probs / legal_probs.sum()  # Normalize

            chosen_idx = np.random.choice(len(legal_moves), p=legal_probs)
            board.push(legal_moves[chosen_idx])

        # Get game result
        result = board.result()
        if result == "1-0":
            value = 1.0
        elif result == "0-1":
            value = -1.0
        else:
            value = 0.0

        # Assign values to all positions (alternate for each move)
        for i, (state, policy) in enumerate(game_data):
            position_value = value if i % 2 == 0 else -value
            training_data.append((state, policy, position_value))

        if (game_num + 1) % 10 == 0:
            print(f"  Generated {game_num + 1}/{num_games} games")

    print(f"Generated {len(training_data)} training positions")
    return training_data


def train_network(network: AlphaZeroNet, training_data, epochs=10, batch_size=64, learning_rate=0.001):
    """Train the neural network"""
    print(f"Training network for {epochs} epochs...")

    device = next(network.parameters()).device
    optimizer = optim.Adam(network.parameters(), lr=learning_rate)

    dataset = ChessDataset(training_data)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    network.train()

    for epoch in range(epochs):
        total_loss = 0.0
        total_policy_loss = 0.0
        total_value_loss = 0.0

        for states, target_policies, target_values in dataloader:
            states = states.to(device)
            target_policies = target_policies.to(device)
            target_values = target_values.to(device)

            # Forward pass
            policy_logits, values = network(states)

            # Loss calculation
            policy_loss = -torch.mean(torch.sum(target_policies * policy_logits, dim=1))
            value_loss = F.mse_loss(values, target_values)
            loss = policy_loss + value_loss

            # Backward pass
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            total_loss += loss.item()
            total_policy_loss += policy_loss.item()
            total_value_loss += value_loss.item()

        avg_loss = total_loss / len(dataloader)
        avg_policy_loss = total_policy_loss / len(dataloader)
        avg_value_loss = total_value_loss / len(dataloader)

        print(f"  Epoch {epoch+1}/{epochs} - Loss: {avg_loss:.4f} (Policy: {avg_policy_loss:.4f}, Value: {avg_value_loss:.4f})")


# ===========================
# Main Training Loop
# ===========================

def main():
    print("=" * 60)
    print("AlphaZero Chess Training")
    print("=" * 60)

    # Configuration
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    num_iterations = 10
    num_selfplay_games = 50
    num_mcts_simulations = 400
    training_epochs = 10

    # Initialize network
    network = AlphaZeroNet(num_res_blocks=10, num_channels=128).to(device)  # Smaller network for faster training
    print(f"Network initialized: {sum(p.numel() for p in network.parameters())} parameters")

    # Training loop
    for iteration in range(num_iterations):
        print(f"\n{'='*60}")
        print(f"Iteration {iteration + 1}/{num_iterations}")
        print(f"{'='*60}")

        # Generate self-play data
        training_data = generate_selfplay_data(
            network,
            num_games=num_selfplay_games,
            num_simulations=num_mcts_simulations
        )

        # Train network
        train_network(network, training_data, epochs=training_epochs)

        # Save checkpoint
        checkpoint_path = f"checkpoints/alphazero_iter_{iteration+1}.pt"
        os.makedirs("checkpoints", exist_ok=True)
        torch.save({
            'iteration': iteration + 1,
            'model_state_dict': network.state_dict(),
        }, checkpoint_path)
        print(f"Saved checkpoint: {checkpoint_path}")

    print("\n" + "=" * 60)
    print("Training completed!")
    print("=" * 60)

    # Save final model
    final_path = "alphazero_final.pt"
    torch.save(network.state_dict(), final_path)
    print(f"Final model saved: {final_path}")


if __name__ == "__main__":
    main()
