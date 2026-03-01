"""
Run this script once to download DejaVu fonts for Cyrillic PDF support.
Place in backend/ and run: python download_fonts.py
"""
import urllib.request
import os

FONTS_DIR = os.path.join("app", "services", "fonts")
os.makedirs(FONTS_DIR, exist_ok=True)

fonts = {
    "DejaVuSans.ttf": "https://github.com/py-pdf/fpdf2/raw/master/tutorial/fonts/DejaVuSans.ttf",
    "DejaVuSans-Bold.ttf": "https://github.com/py-pdf/fpdf2/raw/master/tutorial/fonts/DejaVuSans-Bold.ttf",
}

for name, url in fonts.items():
    path = os.path.join(FONTS_DIR, name)
    if not os.path.exists(path):
        print(f"Downloading {name}...")
        urllib.request.urlretrieve(url, path)
        print(f"  Saved to {path}")
    else:
        print(f"  {name} already exists")

print("Done!")
