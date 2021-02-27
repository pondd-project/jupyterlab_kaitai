import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers
} from '@jupyter-widgets/base';

import { UUID } from '@lumino/coreutils';

import { MODULE_NAME, MODULE_VERSION } from './version';

import { HexViewer, IDataProvider } from './HexViewer';

function serializeArray(array: Uint8Array): DataView {
  return new DataView(array.buffer.slice(0));
}

function deserializeArray(dataview: DataView): Uint8Array {
  return new Uint8Array(dataview.buffer);
}

class HexViewerDataProvider implements IDataProvider {
  constructor(buffer: Uint8Array) {
    this.length = buffer.length;
    this.buffer = buffer;
    console.log('full length', this.length);
  }
  get(offset: number, length: number): Uint8Array {
    console.log('Being asked for ', offset, length);
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
      _model_name: HexViewerModel.model_name,
      _model_module: HexViewerModel.model_module,
      _model_module_version: HexViewerModel.model_module_version
    };
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  initialize(attributes: any, options: any): void {
    super.initialize(attributes, options);
    this.buffer = new Uint8Array(this.get('buffer'));
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    buffer: { serialize: serializeArray, deserialize: deserializeArray }
  };

  getDataProvider(): HexViewerDataProvider {
    console.log('data provider', this.buffer);
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
    this.viewer = new HexViewer(this.div, this.model.getDataProvider());
    await this.setupEventListeners();
    this.displayed.then(() => {
      this.viewer.resize();
    });
  }

  async setupEventListeners(): Promise<void> {
    return;
  }

  viewer: HexViewer;
  model: HexViewerModel;
  div: HTMLDivElement;
  divId: string;
}
