# Screen Region OCR (Windows)

Minimal desktop tool: **move/resize a transparent overlay**, **capture** that screen region, **OCR** with preprocessing, **filter** by instruction, then **Copy** or **Type** (paste) into the focused field.

## Requirements

- **Windows 10/11** (primary target)
- **Python 3.10+**
- **[Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki)** installed and on `PATH`  
  Or set: `TESSDATA_PREFIX` / configure `pytesseract.pytesseract.tesseract_cmd` in `ocr_engine.py` if installed elsewhere.

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
