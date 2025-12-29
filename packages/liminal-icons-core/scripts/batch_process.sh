#!/bin/bash
# Usage: ./batch_convert.sh input_dir output_root_dir

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

INPUT_DIR="$1"
OUTPUT_ROOT="$2"

if [ -z "$INPUT_DIR" ] || [ -z "$OUTPUT_ROOT" ]; then
  echo "Usage: $0 <input_dir> <output_root_dir>"
  exit 1
fi

# Ensure output root exists
mkdir -p "$OUTPUT_ROOT"

# Loop through all PNG files (you can adjust the extension as needed)
for FILE in "$INPUT_DIR"/*.{png,jpg}; do
  [ -e "$FILE" ] || continue  # Skip if no matches

  BASENAME=$(basename "$FILE" | sed 's/\.[^.]*$//')
  OUTPUT_DIR="$OUTPUT_ROOT/$BASENAME"

  echo "Processing $BASENAME..."
  "$SCRIPT_DIR/process.sh" "$FILE" "$OUTPUT_DIR"
done

echo "All images processed."
