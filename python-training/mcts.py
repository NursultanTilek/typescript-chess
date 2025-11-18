"""
Monte Carlo Tree Search for self-play training
"""
import math
import chess
import torch
import numpy as np
from chess_net import board_to_tensor, move_to_index, index_to_move


class MCTSNode:
    """Node in the MCTS tree"""

    def __init__(self, board, parent=None, move=None, prior=0):
        self.board = board.copy()
        self.parent = parent
        self.move = move
        self.prior = prior

        self.children = []
        self.visit_count = 0
        self.total_value = 0
        self.mean_value = 0

    def is_leaf(self):
        return len(self.children) == 0

    def is_expanded(self):
        return len(self.children) > 0

    def select_child(self, c_puct=1.0):
        """Select child with highest UCB score"""
        best_score = -float('inf')
        best_child = None

        for child in self.children:
            # UCB formula
            q_value = child.mean_value
            u_value = c_puct * child.prior * math.sqrt(self.visit_count) / (1 + child.visit_count)
            score = q_value + u_value

            if score > best_score:
                best_score = score
                best_child = child

        return best_child

    def expand(self, policy_probs):
        """Expand node with all legal moves"""
        legal_moves = list(self.board.legal_moves)

        for move in legal_moves:
            move_idx = move_to_index(move)
            prior = policy_probs[move_idx] if move_idx < len(policy_probs) else 1e-8

            child_board = self.board.copy()
            child_board.push(move)

            child = MCTSNode(child_board, parent=self, move=move, prior=prior)
            self.children.append(child)

    def update(self, value):
        """Backpropagate value up the tree"""
        self.visit_count += 1
        self.total_value += value
        self.mean_value = self.total_value / self.visit_count

        if self.parent:
            self.parent.update(-value)  # Negate for opponent


class MCTS:
    """Monte Carlo Tree Search with neural network"""

    def __init__(self, model, num_simulations=800, c_puct=1.0, device='cpu'):
        self.model = model
        self.num_simulations = num_simulations
        self.c_puct = c_puct
        self.device = device

    def search(self, board):
        """Run MCTS and return visit count distribution"""
        root = MCTSNode(board)

        # Run simulations
        for _ in range(self.num_simulations):
            node = root

            # Selection - traverse to leaf
            while node.is_expanded() and not node.board.is_game_over():
                node = node.select_child(self.c_puct)

            # Expansion and evaluation
            if not node.board.is_game_over():
                policy, value = self.evaluate(node.board)
                node.expand(policy)
                value = value.item()
            else:
                # Terminal node
                result = node.board.result()
                if result == "1-0":
                    value = 1.0 if node.board.turn == chess.WHITE else -1.0
                elif result == "0-1":
                    value = -1.0 if node.board.turn == chess.WHITE else 1.0
                else:
                    value = 0.0

            # Backpropagation
            node.update(value)

        # Return visit count distribution
        visit_counts = np.zeros(4096)
        for child in root.children:
            move_idx = move_to_index(child.move)
            visit_counts[move_idx] = child.visit_count

        return visit_counts

    def evaluate(self, board):
        """Evaluate position with neural network"""
        self.model.eval()
        with torch.no_grad():
            board_tensor = board_to_tensor(board).unsqueeze(0).to(self.device)
            policy_logits, value = self.model(board_tensor)

            # Convert to probabilities
            policy = torch.softmax(policy_logits, dim=1).cpu().numpy()[0]

            # Mask illegal moves
            legal_moves = list(board.legal_moves)
            mask = np.zeros(4096)
            for move in legal_moves:
                move_idx = move_to_index(move)
                if move_idx < 4096:
                    mask[move_idx] = 1.0

            policy = policy * mask
            policy = policy / (policy.sum() + 1e-8)  # Renormalize

            return policy, value[0]

    def get_action_probs(self, board, temperature=1.0):
        """Get move probabilities from search"""
        visit_counts = self.search(board)

        if temperature == 0:
            # Deterministic - pick most visited
            action = np.argmax(visit_counts)
            probs = np.zeros(4096)
            probs[action] = 1.0
        else:
            # Stochastic with temperature
            visit_counts = visit_counts ** (1.0 / temperature)
            probs = visit_counts / (visit_counts.sum() + 1e-8)

        return probs

    def play_move(self, board, temperature=1.0):
        """Play a move using MCTS"""
        probs = self.get_action_probs(board, temperature)

        # Sample move
        action = np.random.choice(len(probs), p=probs)

        move = index_to_move(action, board)
        if move and move in board.legal_moves:
            return move, probs

        # Fallback: pick random legal move
        return np.random.choice(list(board.legal_moves)), probs
