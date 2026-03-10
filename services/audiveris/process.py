#!/usr/bin/env python3
"""Process sheet music images to MusicXML and ABC notation."""

import subprocess
import sys
from pathlib import Path

from music21 import converter

INPUT_DIR = Path("/app/input")
OUTPUT_DIR = Path("/app/output")


def process_image(image_path: Path) -> bool:
    """Convert a single image to MusicXML and ABC."""
    stem = image_path.stem
    output_xml = OUTPUT_DIR / f"{stem}.xml"
    output_abc = OUTPUT_DIR / f"{stem}.abc"

    # Step 1: Image -> MusicXML via Audiveris CLI
    result = subprocess.run(
        ["audiveris", "-batch", "-output", str(OUTPUT_DIR), str(image_path)],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        print(f"Error processing {image_path.name}: {result.stderr}")
        return False

    # Step 2: MusicXML -> ABC via music21
    if not output_xml.exists():
        print(f"MusicXML not found for {image_path.name}")
        return False

    score = converter.parse(str(output_xml))
    abc_path = score.write("abc", fp=str(output_abc.with_suffix("")))

    print(f"✓ {image_path.name} -> {output_xml.name}, {Path(abc_path).name}")
    return True


def main() -> None:
    images = list(INPUT_DIR.glob("*.png")) + list(INPUT_DIR.glob("*.jpg"))

    if not images:
        print("No images found in /app/input")
        sys.exit(1)

    success_count = sum(1 for img in images if process_image(img))
    print(f"\nProcessed {success_count}/{len(images)} files")


if __name__ == "__main__":
    main()
