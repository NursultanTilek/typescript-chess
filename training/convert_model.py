#!/usr/bin/env python3
"""
Model Conversion Script
Converts PyTorch model → ONNX → TensorFlow → TensorFlow.js

This script automates the entire conversion pipeline for deploying
the trained AlphaZero model to the web browser.
"""

import os
import sys
import subprocess
import argparse

def check_dependencies():
    """Check if all required packages are installed"""
    print("Checking dependencies...")

    required = {
        'torch': 'PyTorch',
        'onnx': 'ONNX',
        'onnx_tf': 'ONNX-TensorFlow',
        'tensorflowjs': 'TensorFlow.js converter'
    }

    missing = []
    for package, name in required.items():
        try:
            __import__(package)
            print(f"  ✓ {name}")
        except ImportError:
            print(f"  ✗ {name} (missing)")
            missing.append(package)

    if missing:
        print("\n⚠️  Missing packages. Install with:")
        print(f"  pip install {' '.join(missing)}")
        return False

    return True


def convert_pytorch_to_onnx(pytorch_path, onnx_path, config):
    """Convert PyTorch model to ONNX format"""
    print("\n" + "="*60)
    print("Step 1: PyTorch → ONNX")
    print("="*60)

    import torch
    from alphazero_train import AlphaZeroNet

    # Load PyTorch model
    print(f"Loading PyTorch model: {pytorch_path}")
    model = AlphaZeroNet(
        num_res_blocks=config['num_res_blocks'],
        num_channels=config['num_channels']
    )

    state_dict = torch.load(pytorch_path, map_location='cpu')
    if isinstance(state_dict, dict) and 'model_state_dict' in state_dict:
        state_dict = state_dict['model_state_dict']

    model.load_state_dict(state_dict)
    model.eval()
    print(f"  ✓ Model loaded ({sum(p.numel() for p in model.parameters()):,} parameters)")

    # Export to ONNX
    print(f"\nExporting to ONNX: {onnx_path}")
    dummy_input = torch.randn(1, 18, 8, 8)

    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
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

    # Verify ONNX
    import onnx
    onnx_model = onnx.load(onnx_path)
    onnx.checker.check_model(onnx_model)
    print(f"  ✓ ONNX export successful")
    print(f"  ✓ File size: {os.path.getsize(onnx_path) / 1e6:.1f} MB")

    return True


def convert_onnx_to_tensorflow(onnx_path, tf_path):
    """Convert ONNX to TensorFlow SavedModel format"""
    print("\n" + "="*60)
    print("Step 2: ONNX → TensorFlow")
    print("="*60)

    from onnx_tf.backend import prepare
    import onnx

    print(f"Loading ONNX model: {onnx_path}")
    onnx_model = onnx.load(onnx_path)

    print("Converting to TensorFlow...")
    tf_rep = prepare(onnx_model)

    print(f"Exporting to: {tf_path}")
    tf_rep.export_graph(tf_path)

    print(f"  ✓ TensorFlow export successful")

    return True


def convert_tensorflow_to_tfjs(tf_path, tfjs_path):
    """Convert TensorFlow SavedModel to TensorFlow.js format"""
    print("\n" + "="*60)
    print("Step 3: TensorFlow → TensorFlow.js")
    print("="*60)

    print(f"Converting to TensorFlow.js: {tfjs_path}")

    # Use subprocess to call tensorflowjs_converter
    cmd = [
        'tensorflowjs_converter',
        '--input_format=tf_saved_model',
        '--output_format=tfjs_graph_model',
        tf_path,
        tfjs_path
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"  ✗ Conversion failed:")
        print(result.stderr)
        return False

    print(f"  ✓ TensorFlow.js export successful")

    # Check output files
    model_json = os.path.join(tfjs_path, 'model.json')
    if os.path.exists(model_json):
        print(f"  ✓ Model files created in: {tfjs_path}")

        # List files
        files = os.listdir(tfjs_path)
        total_size = sum(os.path.getsize(os.path.join(tfjs_path, f)) for f in files)
        print(f"  ✓ Total size: {total_size / 1e6:.1f} MB")
        print(f"  ✓ Files: {', '.join(files)}")

    return True


def main():
    parser = argparse.ArgumentParser(description='Convert AlphaZero model for web deployment')
    parser.add_argument('--input', default='alphazero_chess_final.pt',
                       help='Input PyTorch model file (.pt)')
    parser.add_argument('--output-dir', default='../public/models',
                       help='Output directory for TensorFlow.js model')
    parser.add_argument('--blocks', type=int, default=10,
                       help='Number of residual blocks in model')
    parser.add_argument('--channels', type=int, default=128,
                       help='Number of channels in model')

    args = parser.parse_args()

    print("="*60)
    print("AlphaZero Model Conversion Pipeline")
    print("="*60)
    print(f"Input: {args.input}")
    print(f"Output: {args.output_dir}")
    print(f"Model config: {args.blocks} blocks, {args.channels} channels")
    print("="*60)

    # Check dependencies
    if not check_dependencies():
        sys.exit(1)

    # Check input file
    if not os.path.exists(args.input):
        print(f"\n✗ Input file not found: {args.input}")
        print("\nAvailable .pt files:")
        for f in os.listdir('.'):
            if f.endswith('.pt'):
                print(f"  - {f}")
        sys.exit(1)

    # Create intermediate paths
    onnx_path = 'alphazero_chess.onnx'
    tf_path = 'tensorflow_model'
    tfjs_path = args.output_dir

    config = {
        'num_res_blocks': args.blocks,
        'num_channels': args.channels
    }

    try:
        # Step 1: PyTorch → ONNX
        if not convert_pytorch_to_onnx(args.input, onnx_path, config):
            sys.exit(1)

        # Step 2: ONNX → TensorFlow
        if not convert_onnx_to_tensorflow(onnx_path, tf_path):
            sys.exit(1)

        # Step 3: TensorFlow → TensorFlow.js
        if not convert_tensorflow_to_tfjs(tf_path, tfjs_path):
            sys.exit(1)

        print("\n" + "="*60)
        print("CONVERSION COMPLETED SUCCESSFULLY!")
        print("="*60)
        print(f"\n✓ Model ready for web deployment at: {tfjs_path}")
        print("\nNext steps:")
        print("1. The model files are in your public/models directory")
        print("2. The TypeScript code will automatically load from /models/model.json")
        print("3. Start your dev server and test the neural network AI!")

    except Exception as e:
        print(f"\n✗ Conversion failed with error:")
        print(f"  {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
