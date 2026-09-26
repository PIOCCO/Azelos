#!/usr/bin/env bash
# One-time / refresh: download decorative homepage assets into public/APIO/homepage-style/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/public/APIO/homepage-style"
HERO="$DEST/hero"
mkdir -p "$HERO"

fetch() {
  local url="$1"
  local out="$2"
  local w="${3:-1400}"
  curl -fsSL "${url}?auto=format&fit=crop&w=${w}&q=85" -o "/tmp/apio-dl.jpg"
  ffmpeg -y -hide_banner -loglevel error -i "/tmp/apio-dl.jpg" -q:v 82 "$out"
}

# Hero sequence (hero-01 … hero-09)
fetch "https://images.unsplash.com/photo-1486325212027-8081e485255e" "$HERO/hero-01.webp" 1920
fetch "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab" "$HERO/hero-02.webp" 1920
fetch "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00" "$HERO/hero-03.webp" 1920
fetch "https://images.unsplash.com/photo-1569982175971-d92b01cf8694" "$HERO/hero-04.webp" 1920
fetch "https://images.unsplash.com/photo-1600585154340-be6161a56a0c" "$HERO/hero-05.webp" 1920
fetch "https://images.unsplash.com/photo-1600607687644-c7171b42498f" "$HERO/hero-06.webp" 1920
fetch "https://images.unsplash.com/photo-1449824913935-59a10b8d2000" "$HERO/hero-07.webp" 1920
fetch "https://images.unsplash.com/photo-1500382017468-9049fed747ef" "$HERO/hero-08.webp" 1920
fetch "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3" "$HERO/hero-09.webp" 1920

# About mosaic
fetch "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00" "$DEST/about-wide.webp" 1200
fetch "https://images.unsplash.com/photo-1600585154340-be6161a56a0c" "$DEST/about-left.webp" 900
fetch "https://images.unsplash.com/photo-1569982175971-d92b01cf8694" "$DEST/about-right.webp" 900

# Region section
fetch "https://images.unsplash.com/photo-1600585154340-be6161a56a0c" "$DEST/region-left-01.webp" 900
fetch "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c" "$DEST/region-left-02.webp" 900
fetch "https://images.unsplash.com/photo-1486325212027-8081e485255e" "$DEST/region-right-tall.webp" 1200
fetch "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c" "$DEST/region-right-01.webp" 800
fetch "https://images.unsplash.com/photo-1500382017468-9049fed747ef" "$DEST/region-right-02.webp" 800

# Bottom CTA background
fetch "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3" "$DEST/cta.webp" 1920

echo "Done: $(find "$DEST" -type f | wc -l) files in $DEST"
