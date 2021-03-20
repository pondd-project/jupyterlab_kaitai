import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers
} from '@jupyter-widgets/base';

import { UUID } from '@lumino/coreutils';

import { MODULE_NAME, MODULE_VERSION } from './version';

import { HexViewer, IDataProvider } from './HexViewer';
import { ConverterPanelModel } from './converterpanel';
import { renderPanel } from './utils';

function serializeArray(array: Uint8Array): DataView {
  return new DataView(array.buffer.slice(0));
}

function deserializeArray(dataview: DataView): Uint8Array {
  return new Uint8Array(dataview.buffer);
}

export class HexViewerDataProvider implements IDataProvider {
  constructor(buffer: Uint8Array) {
    this.length = buffer.length;
    this.buffer = buffer;
  }
  get(offset: number, length: number): Uint8Array {
    return this.buffer.slice(offset, offset + length);
  }

  length: number;
  buffer: Uint8Array;
}

export class HexViewerModel extends DOMWidgetModel {
  defaults(): any {
    return {
      ...super.defaults(),
      buffer: undefined,
      selectionStart: -1,
      selectionEnd: -1,
      _model_name: HexViewerModel.model_name,
      _model_module: HexViewerModel.model_module,
      _model_module_version: HexViewerModel.model_module_version
    };
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  initialize(attributes: any, options: any): void {
    super.initialize(attributes, options);
    this.buffer = new Uint8Array(this.get('buffer'));
    this.on('msg:custom', this.onCommand.bind(this));
  }

  private async onCommand(command: any, buffers: any): Promise<void> {
    switch (command.name) {
      case 'scrollTo':
        // This needs implementing
        break;
      default:
        break;
    }
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    buffer: { serialize: serializeArray, deserialize: deserializeArray }
  };

  getDataProvider(): HexViewerDataProvider {
    return new HexViewerDataProvider(this.buffer);
  }

  buffer: Uint8Array;

  static model_name = 'HexViewerModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'HexViewerView';
  static view_module = MODULE_NAME;
  static view_module_version = MODULE_VERSION;
}

export class HexViewerView extends DOMWidgetView {
  async render(): Promise<void> {
    super.render();
    this.div = document.createElement('div');
    this.divId = 'HexViewer-' + UUID.uuid4();
    this.div.setAttribute('id', this.divId);
    this.div.classList.add('HexViewer-view');
    this.div.classList.add('hexViewer');
    this.el.appendChild(this.div);
    this.el.classList.add('HexViewer-container');
    this.dataProvider = this.model.getDataProvider();
    this.viewer = new HexViewer(this.div, this.dataProvider);
    this.converterPanelModel = new ConverterPanelModel();
    this.converterPanelModel.update(this.dataProvider, -1);
    this.converterPanel = document.createElement('div');
    this.converterPanel.classList.add('converterPanel');
    this.el.appendChild(this.converterPanel);
    this.converterPanel.innerHTML = renderPanel(
      this.converterPanelModel.type_conversion_results
    );
    await this.setupEventListeners();
    this.displayed.then(() => {
      this.viewer.resize();
      this.viewer.onSelectionChanged = () => {
        this.converterPanelModel.update(
          this.dataProvider,
          this.viewer.selectionStart
        );
        this.renderConverterPanel();
        this.model.set('selectionStart', this.viewer.selectionStart);
        this.model.set('selectionEnd', this.viewer.selectionEnd);
        this.model.save();
      };
    });
  }

  async renderConverterPanel(): Promise<void> {
    this.converterPanel.innerHTML = renderPanel(
      this.converterPanelModel.type_conversion_results
    );
    return;
  }

  async setupEventListeners(): Promise<void> {
    this.model.on_some_change(
      ['selectionStart', 'selectionEnd'],
      this.updateSelection,
      this
    );
    return;
  }

  private async updateSelection() {
    this.viewer.setSelection(
      this.model.get('selectionStart'),
      this.model.get('selectionEnd')
    );
  }

  viewer: HexViewer;
  converterPanel: HTMLDivElement;
  converterPanelModel: ConverterPanelModel;
  dataProvider: HexViewerDataProvider;
  model: HexViewerModel;
  div: HTMLDivElement;
  divId: string;
}
