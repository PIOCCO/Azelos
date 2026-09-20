# Screen Region OCR (Windows)

Minimal desktop tool: **move/resize a transparent overlay**, **capture** that screen region, **OCR** with preprocessing, **filter** by instruction, then **Copy** or **Type** (paste) into the focused field.

## Requirements

- **Windows 10/11** (primary target)
- **Python 3.10+**
- **Tkinter** (GUI — included with Windows Python; on Linux install separately, see below)
- **[Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki)** installed and on `PATH`  
  Or set: `TESSDATA_PREFIX` / configure `pytesseract.pytesseract.tesseract_cmd` in `ocr_engine.py` if installed elsewhere.

### Linux: `ModuleNotFoundError: No module named 'tkinter'`

Install the Tk binding for your distro, then use the same `python3` that has it:

```bash
# Debian / Ubuntu / Raspberry Pi OS
sudo apt update
sudo apt install python3-tk python3-venv tesseract-ocr

# Fedora
sudo dnf install python3-tkinter tesseract

# Arch
sudo pacman -S tk tesseract
```

Create the venv **after** installing `python3-tk`:

```bash
cd screen-region-ocr
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

On Linux, overlay transparency may differ from Windows; the tool still runs for capture/OCR tests.

### `KeyError: 'DISPLAY'` or PyAutoGUI / mouseinfo errors

You are on **SSH or a headless server** with no GUI. This app needs a **desktop** (Windows, or Linux with X11/Wayland).

- Run on your **PC desktop**, not a remote VPS without GUI.
- **WSL2:** use [WSLg](https://learn.microsoft.com/en-us/windows/wsl/tutorials/gui-apps) or install/run with Windows Python from `screen-region-ocr`.
- **SSH:** `ssh -X user@host` only if X forwarding is set up; local run is simpler.

**Copy** uses the clipboard only; **Type** needs a display (same as the window).

## Install

```powershell
cd screen-region-ocr
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```powershell
python main.py
```

1. Position the **red rectangle** over the text you want (drag inside to move, handles to resize).
2. Set **What to extract** (see below).
3. Click **Capture**.
4. Review **Raw OCR** and **Structured result**.
5. **Copy** or click the destination field in another app, then **Type** (sends Ctrl+V).

## Extraction instructions

| Instruction | Behavior |
|-------------|----------|
| `all` | Full OCR text |
| `emails` / Extract emails | Email addresses, one per line |
| `names` | Lines that look like names |
| `student names` | Same with light ID-column stripping |
| `names and roles` | `Name — role` when separated by `-`, `:`, `\|` |
| `regex:pattern` | Custom regex (use `\n` in pattern via raw string in code) |

Edit **Raw OCR** manually, then **Apply filter** to re-run extraction without recapturing.

## Project layout

| Module | Role |
|--------|------|
| `main.py` | Control panel UI |
| `overlay.py` | Topmost selection rectangle |
| `capture.py` | `mss` screen grab |
| `ocr_engine.py` | OpenCV preprocess + Tesseract |
| `extractors.py` | Instruction → structured text |
| `automation.py` | Clipboard + paste typing |

## Notes

- Does **not** modify the source application — read-only capture; typing only goes to the **currently focused** window after you click it.
- **PyAutoGUI failsafe**: move mouse to a screen corner to abort automation.
- For multi-monitor, place the overlay on the monitor containing the target content.

## License

MIT
