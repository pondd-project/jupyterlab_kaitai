import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers
} from '@jupyter-widgets/base';

import { UUID } from '@lumino/coreutils';

import { MODULE_NAME, MODULE_VERSION } from './version';

import { HexViewer, IDataProvider } from './HexViewer';
import { ConverterPanelModel } from './converterpanel';

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
    await this.setupEventListeners();
    this.displayed.then(() => {
      this.viewer.resize();
      this.viewer.onSelectionChanged = () => {
        this.converterPanelModel.update(
          this.dataProvider,
          this.viewer.selectionStart
        );
        this.renderConverterPanel();
      };
    });
  }

  async renderConverterPanel(): Promise<void> {
    const m = this.converterPanelModel.type_conversion_results;
    // eslint sure makes this next bit kind of weird looking
    this.converterPanel.innerHTML = `
    <table>
        <thead><tr><th class="typeCol">Type</th><th class="typeValue">Value (unsigned)</th><th>(signed)</th></tr></thead>
        <tr><td>i8</td>     <td>${m.get('u8')}</td><td>${m.get('i8')}</td></tr>
        <tr><td>i16le</td>  <td>${m.get('u16le')}</td><td>${m.get(
      'i16le'
    )}</td></tr>
        <tr><td>i32le</td>  <td>${m.get('u32le')}</td><td>${m.get(
      'i32le'
    )}</td></tr>
        <tr><td>i64le</td>  <td>${m.get('u64le')}</td><td>${m.get(
      'i64le'
    )}</td></tr>
        <tr><td>i16be</td>  <td>${m.get('u16be')}</td><td>${m.get(
      'i16be'
    )}</td></tr>
        <tr><td>i32be</td>  <td>${m.get('u32be')}</td><td>${m.get(
      'i32be'
    )}</td></tr>
        <tr><td>i64be</td>  <td>${m.get('u64be')}</td><td>${m.get(
      'i64be'
    )}</td></tr>
        <tr><td>float</td>  <td colspan="2">${m.get('float')}</td></tr>
        <tr><td>double</td> <td colspan="2">${m.get('double')}</td></tr>
        <tr><td>unixts</td> <td colspan="2">${m.get('unixts')}</td></tr>
        <tr><td>ascii</td>  <td colspan="2"><div class="str">${m.get(
          'ascii'
        )}</div></td></tr>
        <tr><td>utf8</td>   <td colspan="2"><div class="str">${m.get(
          'utf8'
        )}</div></td></tr>
        <tr><td>utf16le</td><td colspan="2"><div class="str">${m.get(
          'utf16le'
        )}</div></td></tr>
        <tr><td>utf16be</td><td colspan="2"><div class="str">${m.get(
          'utf16be'
        )}</div></td></tr>
    </table>
`;
  }

  async setupEventListeners(): Promise<void> {
    return;
  }

  viewer: HexViewer;
  converterPanel: HTMLDivElement;
  converterPanelModel: ConverterPanelModel;
  dataProvider: HexViewerDataProvider;
  model: HexViewerModel;
  div: HTMLDivElement;
  divId: string;
}
