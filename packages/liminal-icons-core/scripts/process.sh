#!/bin/bash

USE_HALFTONE=false

# -------------------------
# Configurable variables
# -------------------------
INPUT_IMAGE="$1"          # first argument to the script
OUTPUT_DIR="$2"           # second argument to the script
NOHALO_IMAGE="$OUTPUT_DIR/nohalo.png"
NORMALIZED_IMAGE="$OUTPUT_DIR/normalized.png"
HALFTONE_IMAGE="$OUTPUT_DIR/halftone.png"
FINAL_SVG="$OUTPUT_DIR/output.svg"

for arg in "$@"; do
  case $arg in
    --halftone)
      USE_HALFTONE=true
      shift
      ;;
  esac
done

# ImageMagick parameters
FUZZ="10%"
BORDER_COLOR="white"
RESIZE_DIM="512x512"
PAD_PERCENT="0.05"
GRAVITY="center"
BACKGROUND="white"

# VTracer parameters
COLOR_MODE="bw"
if [ "$USE_HALFTONE" = true ]; then
  FILTER_SPECKLE=0
else
  FILTER_SPECKLE=1
fi
CORNER_THRESHOLD="55"
SEGMENT_LENGTH="3.5"
COLOR_PRECISION="6"
SPLICE_THRESHOLD="20"

if [ ! -f "$INPUT_IMAGE" ]; then
  echo "Error: Input image not found: $INPUT_IMAGE"
  exit 1
fi

if ! command -v vtracer &> /dev/null; then
  echo "Error: vtracer not found. Install it first."
  exit 1
fi

# -------------------------
# Ensure output directory exists
# -------------------------
mkdir -p "$OUTPUT_DIR"

# Step 0: Remove AI halo
magick "$INPUT_IMAGE" \
  -fuzz 15% \
  -fill none \
  -draw "color 0,0 floodfill" \
  "$NOHALO_IMAGE"


# -------------------------
# Step 1: Trim, pad, resize using ImageMagick
# -------------------------
magick "$NOHALO_IMAGE" \
  -fuzz "$FUZZ" -trim +repage \
  -set option:pad "%[fx:max(w,h)*$PAD_PERCENT]" \
  -bordercolor "$BORDER_COLOR" -border "%[pad]" \
  -resize "${RESIZE_DIM}>" \
  -gravity "$GRAVITY" -background "$BACKGROUND" -extent "$RESIZE_DIM" \
  "$NORMALIZED_IMAGE"

# -------------------------
# Step 2: Optional halftone
# -------------------------
if [ "$USE_HALFTONE" = true ]; then
  echo "Applying halftone…"
  magick "$NORMALIZED_IMAGE" \
    -colorspace Gray \
    -normalize \
    -ordered-dither h6x6o \
    "$HALFTONE_IMAGE"

  TRACE_INPUT="$HALFTONE_IMAGE"
else
  TRACE_INPUT="$NORMALIZED_IMAGE"
fi

# -------------------------
# Step 3: Vectorize with vtracer
# -------------------------
vtracer --input "$TRACE_INPUT" \
        --output "$FINAL_SVG" \
        --colormode "$COLOR_MODE" \
        --filter_speckle "$FILTER_SPECKLE" \
        --corner_threshold "$CORNER_THRESHOLD" \
        --segment_length "$SEGMENT_LENGTH" \
        --color_precision "$COLOR_PRECISION" \
        --splice_threshold "$SPLICE_THRESHOLD"

npx svgo "$FINAL_SVG" -o "$FINAL_SVG"

echo "Processing complete! Output SVG saved to $FINAL_SVG"
