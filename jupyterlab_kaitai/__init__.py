
import json
from pathlib import Path

from ._version import __version__
from .widget_hex import HexViewer
from .display_hex import Hex

MIME_TYPE = "application/octet-stream"

HERE = Path(__file__).parent.resolve()

with (HERE / "labextension" / "package.json").open() as fid:
    data = json.load(fid)

def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": data["name"]
    }]
