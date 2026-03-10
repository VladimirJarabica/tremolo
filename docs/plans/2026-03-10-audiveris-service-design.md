# Audiveris Service Design

## Overview

A microservice that converts sheet music images to MusicXML and ABC notation using Audiveris optical music recognition.

## Architecture

```
services/audiveris/
├── Dockerfile           # Audiveris + Python environment
├── requirements.txt     # Python dependencies
├── process.py           # Main processing script
├── input/               # Mounted volume - drop images here
└── output/              # Mounted volume - results appear here
```

## Data Flow

1. Drop `song.png` into `services/audiveris/input/`
2. Run: `docker compose exec audiveris python process.py`
3. Audiveris CLI converts image → MusicXML
4. `musicxml2abc` converts MusicXML → ABC notation
5. Results: `output/song.xml` + `output/song.abc`

## Tech Stack

- **Base image**: `openjdk:11-jre-slim` (Audiveris requires Java)
- **Audiveris**: v5.3.1 from GitHub releases
- **Python 3**: For orchestration script
- **musicxml2abc**: Python library for MusicXML → ABC conversion

## Dockerfile

```dockerfile
FROM openjdk:11-jre-slim AS audiveris-base

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    wget \
    && rm -rf /var/lib/apt/lists/*

ENV AUDIVERIS_VERSION=5.3.1
RUN wget -q https://github.com/Audiveris/audiveris/releases/download/${AUDIVERIS_VERSION}/Audiveris-${AUDIVERIS_VERSION}-x86_64.tar.bz2 \
    && tar -xjf Audiveris-${AUDIVERIS_VERSION}-x86_64.tar.bz2 \
    && mv Audiveris-${AUDIVERIS_VERSION} /opt/audiveris \
    && rm Audiveris-${AUDIVERIS_VERSION}-x86_64.tar.bz2

ENV PATH="/opt/audiveris/bin:${PATH}"

WORKDIR /app
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

COPY process.py .

RUN mkdir -p /app/input /app/output
```

## Processing Script

```python
#!/usr/bin/env python3
"""Process sheet music images to MusicXML and ABC notation."""

import os
import subprocess
import sys
from pathlib import Path
from musicxml2abc import musicxml2abc

INPUT_DIR = Path("/app/input")
OUTPUT_DIR = Path("/app/output")

def process_image(image_path: Path) -> bool:
    """Convert a single image to MusicXML and ABC."""
    stem = image_path.stem
    output_xml = OUTPUT_DIR / f"{stem}.xml"
    output_abc = OUTPUT_DIR / f"{stem}.abc"

    # Step 1: Image → MusicXML via Audiveris CLI
    result = subprocess.run(
        ["audiveris", "-batch", "-output", str(OUTPUT_DIR), str(image_path)],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print(f"Error processing {image_path.name}: {result.stderr}")
        return False

    # Step 2: MusicXML → ABC
    if not output_xml.exists():
        print(f"MusicXML not found for {image_path.name}")
        return False

    xml_content = output_xml.read_text()
    abc_content = musicxml2abc(xml_content)
    output_abc.write_text(abc_content)

    print(f"✓ {image_path.name} → {output_xml.name}, {output_abc.name}")
    return True

def main():
    images = list(INPUT_DIR.glob("*.png")) + list(INPUT_DIR.glob("*.jpg"))

    if not images:
        print("No images found in /app/input")
        sys.exit(1)

    success_count = sum(1 for img in images if process_image(img))
    print(f"\nProcessed {success_count}/{len(images)} files")

if __name__ == "__main__":
    main()
```

## Docker Compose Addition

```yaml
services:
  audiveris:
    build: ./services/audiveris
    volumes:
      - ./services/audiveris/input:/app/input
      - ./services/audiveris/output:/app/output
```

## Requirements

```
musicxml2abc
```

## Usage

```bash
# Build the service
docker compose build audiveris

# Drop sheet music images
cp ~/my-sheet.png services/audiveris/input/

# Process images
docker compose exec audiveris python process.py

# Pick up results
ls services/audiveris/output/
# my-sheet.xml  my-sheet.abc
```

## Future Integration

The service is designed as a standalone microservice but can later be integrated into Tremolo's Next.js app by:
1. Adding an HTTP API wrapper
2. Calling the processing script from server actions
3. Uploading results directly to the database
