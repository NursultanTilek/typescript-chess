"""
AlphaZero Training Script for Chess
"""
import os
import chess
import torch
import torch.optim as optim
import torch.nn.functional as F
from torch.utils.tensorboard import SummaryWriter
from tqdm import tqdm
import numpy as np

from chess_net import ChessNet, board_to_tensor, move_to_index
from mcts import MCTS


# Training hyperparameters
ITERATIONS = 50  # Reduced for faster training
GAMES_PER_ITERATION = 10  # Reduced for faster testing
MCTS_SIMULATIONS = 200  # Reduced for speed
BATCH_SIZE = 32
LEARNING_RATE = 0.001
TEMPERATURE = 1.0
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'


class AlphaZeroTrainer:
    """AlphaZero training pipeline"""

    def __init__(self):
        self.model = ChessNet(num_res_blocks=3).to(DEVICE)
        self.optimizer = optim.Adam(self.model.parameters(), lr=LEARNING_RATE)
        self.mcts = MCTS(self.model, num_simulations=MCTS_SIMULATIONS, device=DEVICE)
        self.writer = SummaryWriter('runs/alphazero_chess')

        # Create models directory
        os.makedirs('models', exist_ok=True)

        # Training data buffer
        self.training_data = []

    def self_play_game(self):
        """Play one game via self-play"""
        board = chess.Board()
        game_data = []

        move_count = 0
        max_moves = 200  # Prevent infinite games

        while not board.is_game_over() and move_count < max_moves:
            # Get board state
            board_tensor = board_to_tensor(board)

            # MCTS search for move probabilities
            probs = self.mcts.get_action_probs(board, temperature=TEMPERATURE)

            # Store training data (state, policy, value will be filled later)
            game_data.append({
                'board': board_tensor,
                'policy': probs,
                'turn': board.turn
            })

            # Select and play move
            move, _ = self.mcts.play_move(board, temperature=TEMPERATURE)
            board.push(move)
            move_count += 1

        # Assign game outcome to all positions
        result = board.result()
        if result == "1-0":
            winner = chess.WHITE
        elif result == "0-1":
            winner = chess.BLACK
        else:
            winner = None

        # Assign values based on outcome
        for data in game_data:
            if winner is None:
                data['value'] = 0.0  # Draw
            elif data['turn'] == winner:
                data['value'] = 1.0  # Win
            else:
                data['value'] = -1.0  # Loss

        return game_data, result

    def train_network(self):
        """Train network on collected data"""
        if len(self.training_data) < BATCH_SIZE:
            return 0, 0

        self.model.train()

        # Sample batch
        batch_indices = np.random.choice(len(self.training_data), BATCH_SIZE, replace=False)
        batch = [self.training_data[i] for i in batch_indices]

        # Prepare tensors
        boards = torch.stack([item['board'] for item in batch]).to(DEVICE)
        target_policies = torch.tensor([item['policy'] for item in batch], dtype=torch.float32).to(DEVICE)
        target_values = torch.tensor([[item['value']] for item in batch], dtype=torch.float32).to(DEVICE)

        # Forward pass
        policy_logits, values = self.model(boards)

        # Compute losses
        policy_loss = -torch.mean(torch.sum(target_policies * policy_logits, dim=1))
        value_loss = F.mse_loss(values, target_values)
        total_loss = policy_loss + value_loss

        # Backward pass
        self.optimizer.zero_grad()
        total_loss.backward()
        self.optimizer.step()

        return policy_loss.item(), value_loss.item()

    def train(self):
        """Main training loop"""
        print(f"🚀 Starting AlphaZero training on {DEVICE}")
        print(f"Iterations: {ITERATIONS}, Games/iteration: {GAMES_PER_ITERATION}")
        print(f"MCTS simulations: {MCTS_SIMULATIONS}\n")

        global_step = 0

        for iteration in range(ITERATIONS):
            print(f"\n{'='*60}")
            print(f"Iteration {iteration + 1}/{ITERATIONS}")
            print(f"{'='*60}")

            # Self-play phase
            print("🎮 Playing self-play games...")
            iteration_data = []
            wins = {'1-0': 0, '0-1': 0, '1/2-1/2': 0}

            for game_num in tqdm(range(GAMES_PER_ITERATION), desc="Self-play"):
                game_data, result = self.self_play_game()
                iteration_data.extend(game_data)
                wins[result] = wins.get(result, 0) + 1

            # Add to training buffer
            self.training_data.extend(iteration_data)
            print(f"✅ Collected {len(iteration_data)} positions")
            print(f"📊 Results - White: {wins.get('1-0', 0)}, Black: {wins.get('0-1', 0)}, Draw: {wins.get('1/2-1/2', 0)}")

            # Training phase
            print("\n🧠 Training neural network...")
            num_training_steps = len(self.training_data) // BATCH_SIZE
            total_policy_loss = 0
            total_value_loss = 0

            for step in tqdm(range(num_training_steps), desc="Training"):
                policy_loss, value_loss = self.train_network()
                total_policy_loss += policy_loss
                total_value_loss += value_loss
                global_step += 1

                # Log every 10 steps
                if step % 10 == 0:
                    self.writer.add_scalar('Loss/Policy', policy_loss, global_step)
                    self.writer.add_scalar('Loss/Value', value_loss, global_step)

            avg_policy_loss = total_policy_loss / max(num_training_steps, 1)
            avg_value_loss = total_value_loss / max(num_training_steps, 1)

            print(f"📈 Avg Policy Loss: {avg_policy_loss:.4f}, Avg Value Loss: {avg_value_loss:.4f}")

            # Log to TensorBoard
            self.writer.add_scalar('Iteration/PolicyLoss', avg_policy_loss, iteration)
            self.writer.add_scalar('Iteration/ValueLoss', avg_value_loss, iteration)
            self.writer.add_scalar('Iteration/WhiteWins', wins.get('1-0', 0), iteration)
            self.writer.add_scalar('Iteration/BlackWins', wins.get('0-1', 0), iteration)
            self.writer.add_scalar('Iteration/Draws', wins.get('1/2-1/2', 0), iteration)

            # Save checkpoint every 5 iterations
            if (iteration + 1) % 5 == 0:
                checkpoint_path = f'models/checkpoint_iter_{iteration + 1}.pth'
                torch.save({
                    'iteration': iteration,
                    'model_state_dict': self.model.state_dict(),
                    'optimizer_state_dict': self.optimizer.state_dict(),
                }, checkpoint_path)
                print(f"💾 Saved checkpoint: {checkpoint_path}")

            # Keep only recent data (prevent memory overflow)
            if len(self.training_data) > 50000:
                self.training_data = self.training_data[-50000:]

        # Save final model
        final_path = 'models/final_model.pth'
        torch.save(self.model.state_dict(), final_path)
        print(f"\n✅ Training complete! Final model saved to {final_path}")
        self.writer.close()


if __name__ == '__main__':
    trainer = AlphaZeroTrainer()
    trainer.train()
