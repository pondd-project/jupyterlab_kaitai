from ._version import __version__
import ipywidgets
import traitlets
from ipywidgets.widgets.trait_types import bytes_serialization

EXTENSION_VERSION = __version__

@ipywidgets.register
class HexViewer(ipywidgets.DOMWidget):
    _model_name = traitlets.Unicode('HexViewerModel').tag(sync=True)
    _model_module = traitlets.Unicode('jupyterlab_kaitai').tag(sync=True)
    _model_module_version = traitlets.Unicode(EXTENSION_VERSION).tag(sync=True)
    _view_name = traitlets.Unicode('HexViewerView').tag(sync=True)
    _view_module = traitlets.Unicode('jupyterlab_kaitai').tag(sync=True)
    _view_module_version = traitlets.Unicode(EXTENSION_VERSION).tag(sync=True)

    buffer = traitlets.Bytes(allow_none=False).tag(
        sync=True, **bytes_serialization)

    def __init__(self, buffer=None, *args, **kwargs):
        kwargs["buffer"] = buffer if buffer is not None else b""
        super().__init__(*args, **kwargs)
