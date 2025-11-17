#!/usr/bin/env python3
"""
Convert PyTorch AlphaZero model to ONNX format
This is the first step in converting to TensorFlow.js
"""

import torch
import torch.onnx
from alphazero_train import AlphaZeroNet
import os

def convert_to_onnx(pytorch_model_path, onnx_model_path, model_config=None):
    """
    Convert PyTorch model to ONNX format

    Args:
        pytorch_model_path: Path to .pt file
        onnx_model_path: Output path for .onnx file
        model_config: Dict with 'num_res_blocks' and 'num_channels'
    """
    print("=" * 60)
    print("PyTorch to ONNX Conversion")
    print("=" * 60)

    # Load PyTorch model
    if model_config is None:
        model_config = {'num_res_blocks': 10, 'num_channels': 128}

    print(f"Loading PyTorch model from: {pytorch_model_path}")
    model = AlphaZeroNet(
        num_res_blocks=model_config['num_res_blocks'],
        num_channels=model_config['num_channels']
    )

    # Load state dict
    state_dict = torch.load(pytorch_model_path, map_location=torch.device('cpu'))
    if isinstance(state_dict, dict) and 'model_state_dict' in state_dict:
        state_dict = state_dict['model_state_dict']

    model.load_state_dict(state_dict)
    model.eval()

    print("Model loaded successfully")
    print(f"Parameters: {sum(p.numel() for p in model.parameters()):,}")

    # Create dummy input (8x8x18 board tensor)
    dummy_input = torch.randn(1, 18, 8, 8)

    # Export to ONNX
    print(f"\nExporting to ONNX format...")
    print(f"Output path: {onnx_model_path}")

    torch.onnx.export(
        model,
        dummy_input,
        onnx_model_path,
        export_params=True,
        opset_version=11,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['policy', 'value'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'policy': {0: 'batch_size'},
            'value': {0: 'batch_size'}
        }
    )

    print("✓ ONNX export successful!")

    # Verify ONNX model
    try:
        import onnx
        onnx_model = onnx.load(onnx_model_path)
        onnx.checker.check_model(onnx_model)
        print("✓ ONNX model verification passed")

        # Print model info
        print(f"\nModel Info:")
        print(f"  Input shape: {onnx_model.graph.input[0].type.tensor_type.shape}")
        print(f"  Output names: {[output.name for output in onnx_model.graph.output]}")

    except ImportError:
        print("⚠ onnx package not installed, skipping verification")
        print("  Install with: pip install onnx")

    print("\n" + "=" * 60)
    print("Conversion complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Convert ONNX to TensorFlow:")
    print("   onnx-tf convert -i alphazero.onnx -o tensorflow_model")
    print("\n2. Convert TensorFlow to TensorFlow.js:")
    print("   tensorflowjs_converter \\")
    print("       --input_format=tf_saved_model \\")
    print("       --output_format=tfjs_graph_model \\")
    print("       tensorflow_model \\")
    print("       ../public/tfjs_model")


def main():
    # Configuration
    pytorch_model_path = "alphazero_final.pt"
    onnx_model_path = "alphazero.onnx"

    # Check if PyTorch model exists
    if not os.path.exists(pytorch_model_path):
        print(f"ERROR: PyTorch model not found: {pytorch_model_path}")
        print("\nAvailable checkpoints:")
        if os.path.exists("checkpoints"):
            for f in os.listdir("checkpoints"):
                if f.endswith(".pt"):
                    print(f"  - checkpoints/{f}")
        print("\nRun training first: python alphazero_train.py")
        return

    # Model configuration (should match training)
    model_config = {
        'num_res_blocks': 10,  # Must match training config
        'num_channels': 128     # Must match training config
    }

    # Convert
    convert_to_onnx(pytorch_model_path, onnx_model_path, model_config)


if __name__ == "__main__":
    main()
