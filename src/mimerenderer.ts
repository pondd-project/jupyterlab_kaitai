import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { Widget } from '@lumino/widgets';
import { HexViewer } from './HexViewer';
import { HexViewerDataProvider } from './widget';
import { base64ToBuffer } from '@jupyter-widgets/base';
import { UUID } from '@lumino/coreutils';
import { ConverterPanelModel } from './converterpanel';
import { renderPanel } from './utils';

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
    this.div = document.createElement('div');
    this.divId = 'HexViewer-' + UUID.uuid4();
    this.div.setAttribute('id', this.divId);
    this.div.classList.add('HexViewer-standalong');
    this.div.classList.add('hexViewer');
    this.node.appendChild(this.div);
    this.node.classList.add('HexViewer-container');
    this.dataProvider = undefined;
    this.viewer = new HexViewer(this.div, this.dataProvider);
    this.converterPanelModel = new ConverterPanelModel();
    this.converterPanelModel.update(this.dataProvider, -1);
    this.converterPanel = document.createElement('div');
    this.converterPanel.classList.add('converterPanel');
    this.node.appendChild(this.converterPanel);
    this.viewer.onSelectionChanged = () => {
      this.converterPanelModel.update(
        this.dataProvider,
        this.viewer.selectionStart
      );
      this.converterPanel.innerHTML = renderPanel(
        this.converterPanelModel.type_conversion_results
      );
    };
  }

  /**
   * Render into this widget's node.
   */
  renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    let s = model.data[this._mimeType] as string;
    /* Manually pad the base64 string with '=' marks */
    if (s.length % 4 > 0) {
      s = s + '='.repeat(4 - (s.length % 4));
    }
    const buffer = base64ToBuffer(s);
    this.dataProvider = new HexViewerDataProvider(new Uint8Array(buffer));
    this.viewer.dataProvider = this.dataProvider;
    this.viewer.resize();
    return Promise.resolve();
  }

  onResize(event: Widget.ResizeMessage): void {
    this.viewer.resize();
  }

  divId: string;
  div: HTMLDivElement;
  converterPanel: HTMLDivElement;
  converterPanelModel: ConverterPanelModel;
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
