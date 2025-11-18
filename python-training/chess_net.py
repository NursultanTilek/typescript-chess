"""
AlphaZero-style Neural Network for Chess
"""
import torch
import torch.nn as nn
import torch.nn.functional as F

class ChessNet(nn.Module):
    """
    Neural network with policy and value heads
    Input: 8x8x12 board representation (6 piece types x 2 colors)
    Output:
      - Policy: probability distribution over moves
      - Value: position evaluation (-1 to 1)
    """

    def __init__(self, num_res_blocks=5):
        super(ChessNet, self).__init__()

        # Input convolution
        self.conv_input = nn.Conv2d(12, 128, kernel_size=3, padding=1)
        self.bn_input = nn.BatchNorm2d(128)

        # Residual blocks
        self.res_blocks = nn.ModuleList([
            ResidualBlock(128) for _ in range(num_res_blocks)
        ])

        # Policy head
        self.policy_conv = nn.Conv2d(128, 32, kernel_size=1)
        self.policy_bn = nn.BatchNorm2d(32)
        self.policy_fc = nn.Linear(32 * 8 * 8, 4096)  # All possible moves

        # Value head
        self.value_conv = nn.Conv2d(128, 32, kernel_size=1)
        self.value_bn = nn.BatchNorm2d(32)
        self.value_fc1 = nn.Linear(32 * 8 * 8, 256)
        self.value_fc2 = nn.Linear(256, 1)

    def forward(self, x):
        # Input convolution
        x = F.relu(self.bn_input(self.conv_input(x)))

        # Residual blocks
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


class ResidualBlock(nn.Module):
    """Residual block for deeper network"""

    def __init__(self, channels):
        super(ResidualBlock, self).__init__()
        self.conv1 = nn.Conv2d(channels, channels, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(channels)
        self.conv2 = nn.Conv2d(channels, channels, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(channels)

    def forward(self, x):
        residual = x
        x = F.relu(self.bn1(self.conv1(x)))
        x = self.bn2(self.conv2(x))
        x += residual
        x = F.relu(x)
        return x


def board_to_tensor(board):
    """
    Convert chess.Board to tensor representation
    12 planes: 6 piece types (P, N, B, R, Q, K) x 2 colors (white, black)
    """
    import chess

    tensor = torch.zeros(12, 8, 8)

    piece_map = {
        chess.PAWN: 0, chess.KNIGHT: 1, chess.BISHOP: 2,
        chess.ROOK: 3, chess.QUEEN: 4, chess.KING: 5
    }

    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if piece:
            rank = chess.square_rank(square)
            file = chess.square_file(square)
            piece_idx = piece_map[piece.piece_type]
            plane_idx = piece_idx if piece.color == chess.WHITE else piece_idx + 6
            tensor[plane_idx, 7 - rank, file] = 1.0

    return tensor


def move_to_index(move):
    """Convert chess move to policy index"""
    from_square = move.from_square
    to_square = move.to_square

    # Simple encoding: from_square * 64 + to_square
    return from_square * 64 + to_square


def index_to_move(index, board):
    """Convert policy index to chess move"""
    import chess

    from_square = index // 64
    to_square = index % 64

    move = chess.Move(from_square, to_square)

    # Check for promotion
    if board.piece_at(from_square) and board.piece_at(from_square).piece_type == chess.PAWN:
        if chess.square_rank(to_square) in [0, 7]:
            move = chess.Move(from_square, to_square, promotion=chess.QUEEN)

    return move if move in board.legal_moves else None
