import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { Widget } from '@lumino/widgets';
import { HexViewer } from './HexViewer';
import { HexViewerDataProvider } from './widget';
import { base64ToBuffer } from '@jupyter-widgets/base';

/**
 * The default mime type for the extension.
 */
export const MIME_TYPE = 'application/octet-stream';

/**
 * The class name added to the extension.
 */
const CLASS_NAME = 'mimerenderer-hexviewer';

/**
 * A widget for rendering {{cookiecutter.mimetype_name}}.
 */
export class OutputWidget extends Widget implements IRenderMime.IRenderer {
  /**
   * Construct a new output widget.
   */
  constructor(options: IRenderMime.IRendererOptions) {
    super();
    this._mimeType = options.mimeType;
    this.addClass(CLASS_NAME);
  }

  /**
   * Render {{cookiecutter.mimetype_name}} into this widget's node.
   */
  renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    const buffer = base64ToBuffer(model.data[this._mimeType] as string);
    this.dataProvider = new HexViewerDataProvider(new Uint8Array(buffer));
    this.viewer = new HexViewer(this.node, this.dataProvider);
    return Promise.resolve();
  }

  onResize(event: Widget.ResizeMessage): void {
    this.viewer.resize();
  }

  private dataProvider: HexViewerDataProvider;
  private viewer: HexViewer;
  private _mimeType: string;
}

/**
 * A mime renderer factory for {{cookiecutter.mimetype_name}} data.
 */
export const rendererFactory: IRenderMime.IRendererFactory = {
  safe: true,
  mimeTypes: [MIME_TYPE],
  createRenderer: options => new OutputWidget(options)
};

/**
 * Extension definition.
 */
const extension: IRenderMime.IExtension = {
  id: 'jupyterlab_kaitai_hexviewer:plugin',
  rendererFactory,
  rank: 0,
  dataType: 'string',
  fileTypes: [
    {
      name: 'mimerenderer-hexviewer',
      mimeTypes: [MIME_TYPE],
      extensions: ['.bin']
    }
  ],
  documentWidgetFactoryOptions: {
    name: 'hexviewer',
    primaryFileType: 'mimerenderer-hexviewer',
    fileTypes: ['mimerenderer-hexviewer'],
    defaultFor: ['mimerenderer-hexviewer'],
    modelName: 'base64'
  }
};

export default extension;
