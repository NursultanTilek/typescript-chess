# Training Chess AI with Google Colab in VS Code

**NEW!** Google just launched the Colab VS Code extension (November 2025). You can now train your chess AI directly from VS Code using Colab's free GPUs!

## 🎯 What This Gives You

- ✅ **Code in VS Code** - Your familiar editor with all your extensions
- ✅ **Run on Colab** - Free GPU/TPU access (no local GPU needed)
- ✅ **Best of both worlds** - Local development + Cloud computing power

---

## 📦 Setup: Install VS Code Colab Extension

### Step 1: Install the Extension

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for **"Colab"** (by Google)
4. Click **Install**

The extension will automatically install the Jupyter extension if needed.

### Step 2: Connect to Colab Runtime

1. Open your `.ipynb` notebook in VS Code
2. Click the **kernel selector** (top right)
3. Select **"Connect to Colab..."**
4. Choose runtime type:
   - **T4 GPU** (Free) - Recommended
   - **L4 GPU** (Colab Pro)
   - **A100 GPU** (Colab Pro+)
   - **TPU** (Colab Pro)

### Step 3: Verify GPU Access

Run this in a cell to confirm GPU is available:

```python
import torch
print(f"CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
```

---

## 🚀 Training Your Chess AI

### Option 1: Use the Jupyter Notebook (Recommended)

1. **Open the notebook in VS Code:**
   ```bash
   code training/AlphaZero_Chess_Training.ipynb
   ```

2. **Connect to Colab runtime** (as shown above)

3. **Run all cells** (`Ctrl+Shift+Enter`)

4. **Download trained models** when complete

### Option 2: Use Python Scripts

You can also run the training scripts directly on Colab runtime:

```python
# In VS Code, create a new notebook cell and run:
!python training/quick_train.py
```

---

## 📂 File Management

### Saving Models

When running on Colab, save models to Google Drive for persistence:

```python
from google.colab import drive
drive.mount('/content/drive')

# Save model to Drive
model_path = '/content/drive/MyDrive/chess_models/alphazero_final.pt'
torch.save(network.state_dict(), model_path)
```

### Downloading to Local Machine

After training, download files directly from VS Code:

```python
# Files in Colab runtime are accessible in VS Code
# Simply right-click → Download in VS Code file explorer
```

---

## ⚙️ Updated Training Scripts

The training scripts have been updated to:
- ✅ Auto-detect if running on Colab
- ✅ Mount Google Drive automatically
- ✅ Save checkpoints to persistent storage
- ✅ Work with both web Colab and VS Code Colab

---

## 🔄 Workflow

Here's your complete workflow:

### 1. Edit Code Locally in VS Code
```
typescript-chess/
├── training/
│   ├── AlphaZero_Chess_Training.ipynb  ← Edit here
│   ├── quick_train.py
│   └── alphazero_train.py
```

### 2. Execute on Colab GPU
- Click "Run Cell" in VS Code
- Code runs on Colab's cloud GPU
- See output in VS Code

### 3. Save Models
- Models saved to Colab runtime
- Optionally sync to Google Drive
- Download to local machine

### 4. Convert for Website
```bash
# Run locally (after downloading model)
cd training
python convert_model.py --input alphazero_final.pt
```

---

## 🎨 VS Code Features You Can Use

With Colab in VS Code, you get:

### IntelliSense & Code Completion
```python
# Full autocomplete for PyTorch, TensorFlow, etc.
network = AlphaZeroNet(  # <-- IntelliSense shows parameters
```

### Debugging
- Set breakpoints
- Step through code
- Inspect variables
- All while running on Colab GPU!

### Extensions
- GitHub Copilot (if you have it)
- Python linting
- Code formatting
- Git integration

### Multiple Files
- Edit multiple Python files simultaneously
- Run cells from different notebooks
- All share the same Colab runtime

---

## 📊 Monitoring Training

### Real-time Output in VS Code

```python
# Training progress appears directly in VS Code
Iteration 1/3
Generating 10 self-play games...
  Game 1/10 | Result: 1-0 | 12.3 games/min
  Game 2/10 | Result: 0-1 | 11.8 games/min
```

### TensorBoard Integration

```python
# Launch TensorBoard in VS Code
%load_ext tensorboard
%tensorboard --logdir logs
```

### GPU Usage

```python
# Monitor GPU memory
!nvidia-smi
```

---

## 🆚 Comparison

| Feature | Web Colab | VS Code Colab |
|---------|-----------|---------------|
| GPU Access | ✅ Free T4 | ✅ Free T4 |
| Code Editor | Basic | Full VS Code |
| Extensions | ❌ No | ✅ Yes |
| Debugging | ⚠️ Limited | ✅ Full |
| File System | Web only | Local + Cloud |
| Git Integration | ⚠️ Limited | ✅ Native |
| IntelliSense | ⚠️ Basic | ✅ Full |
| Multi-file | ⚠️ Limited | ✅ Easy |
| Offline Editing | ❌ No | ✅ Yes |

---

## 💡 Pro Tips

### 1. Keep Sessions Alive
Colab sessions timeout after inactivity. In VS Code:
```python
# Add this to a cell at the start
import time
from IPython.display import Javascript

def keep_alive():
    display(Javascript('setInterval(() => { console.log("keep alive"); }, 60000)'))

keep_alive()
```

### 2. Save Checkpoints Frequently
```python
# Save after each iteration
torch.save({
    'iteration': i,
    'model_state_dict': network.state_dict(),
    'optimizer_state_dict': optimizer.state_dict(),
}, f'/content/drive/MyDrive/checkpoints/iter_{i}.pt')
```

### 3. Use Quick Mode First
```python
# Test the full pipeline with quick training
QUICK_MODE = True  # 30-60 min
# Then do full training
QUICK_MODE = False  # 5-7 hours
```

### 4. Download Models Immediately
After training completes, download models right away:
```python
from google.colab import files
files.download('alphazero_final.pt')
```

---

## 🔧 Troubleshooting

### Extension Not Showing Colab Option

1. Make sure you have the latest VS Code
2. Restart VS Code after installing extension
3. Open a `.ipynb` file first

### Can't Connect to Colab

1. Check internet connection
2. Sign in to Google account in VS Code
3. Try: `Ctrl+Shift+P` → "Colab: Connect to Colab"

### GPU Not Available

```python
# Check if Colab runtime has GPU enabled
import torch
if not torch.cuda.is_available():
    print("⚠️ GPU not available!")
    print("Change runtime: Click kernel selector → Select GPU runtime")
```

### Files Not Persisting

Colab runtime is temporary. Save to Google Drive:
```python
# Mount Drive
from google.colab import drive
drive.mount('/content/drive')

# Save there
torch.save(model, '/content/drive/MyDrive/model.pt')
```

---

## 🎯 Quick Start Checklist

- [ ] Install Colab extension in VS Code
- [ ] Open `training/AlphaZero_Chess_Training.ipynb`
- [ ] Connect to Colab runtime (with GPU)
- [ ] Verify GPU is available
- [ ] Mount Google Drive (optional, for persistence)
- [ ] Run training cells
- [ ] Download trained model
- [ ] Convert to TensorFlow.js
- [ ] Deploy to website

---

## 📚 Resources

- **VS Code Marketplace**: [Colab Extension](https://marketplace.visualstudio.com/items?itemName=Google.colab)
- **GitHub Repo**: [googlecolab/colab-vscode](https://github.com/googlecolab/colab-vscode)
- **Announcement**: [Google Developers Blog](https://developers.googleblog.com/en/google-colab-is-coming-to-vs-code/)

---

## 🚀 Example Session

Here's what a typical training session looks like:

```bash
# 1. Open VS Code
code .

# 2. Open notebook
# File → Open → training/AlphaZero_Chess_Training.ipynb

# 3. Connect to Colab
# Click kernel selector → "Connect to Colab" → Select T4 GPU

# 4. Run training
# Press Ctrl+Shift+Enter to run all cells

# 5. Monitor progress in VS Code output

# 6. Download model when done
# Right-click on alphazero_final.pt → Download
```

---

## 🎉 Benefits Summary

Using VS Code + Colab gives you:

1. **Professional IDE** - All VS Code features
2. **Free GPU** - No local GPU needed
3. **Easy sharing** - Git integration built-in
4. **Debugging** - Full breakpoint support
5. **Extensions** - Use your favorite tools
6. **Persistence** - Save to Google Drive
7. **Flexibility** - Switch between local and cloud

**Ready to train your chess AI! 🤖♟️**
