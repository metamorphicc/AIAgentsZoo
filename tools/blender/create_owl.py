"""Generate the detailed, rigged Owl 01 source and web model."""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))

from species_builders import build_owl


if __name__ == "__main__":
    build_owl()
