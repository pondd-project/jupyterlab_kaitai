from IPython.core.display import DisplayObject


class Hex(DisplayObject):
    """render a rich hex viewer"""
    mimetype = "application/octet-stream"

    def __init__(self, buffer=None, metadata=None, **kwargs):
        self.metadata = {}
        self._data = buffer
        if metadata:
            self.metadata.update(metadata)
        if kwargs:
            self.metadata.update(kwargs)

    @property
    def data(self):
        """leave open in case something needs to happen here"""
        return self._data

    def _repr_mimebundle_(self, include=None, exclude=None):
        """Return the bytes as a mimebundle
        """
        return {self.mimetype: self.data}, self.metadata


def display_hex(buffer, **kwargs):
    return Hex(buffer, **kwargs)
