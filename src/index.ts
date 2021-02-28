import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  IMimeDocumentTracker
} from '@jupyterlab/application';

import { ITranslator } from '@jupyterlab/translation';

import { WidgetTracker } from '@jupyterlab/apputils';

import { MimeDocument } from '@jupyterlab/docregistry';

import { IRenderMimeRegistry } from '@jupyterlab/rendermime';

import { createRendermimePlugin } from '@jupyterlab/application/lib/mimerenderers';

import { MODULE_NAME, MODULE_VERSION } from './version';

import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';

import * as mimerendererExports from './mimerenderer';

import { HexViewerModel, HexViewerView } from './widget';

const EXTENSION_NAME = MODULE_NAME + ':plugin';

/**
 * Initialization data for the jupyterlab_kaitai extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: EXTENSION_NAME,
  autoStart: true,
  requires: [IJupyterWidgetRegistry, IMimeDocumentTracker, IRenderMimeRegistry],
  activate: (
    app: JupyterFrontEnd,
    registry: IJupyterWidgetRegistry,
    tracker: IMimeDocumentTracker,
    rendermime: IRenderMimeRegistry,
    translator: ITranslator
  ) => {
    console.log('JupyterLab extension jupyterlab_kaitai is activated!');
    registry.registerWidget({
      name: MODULE_NAME,
      version: MODULE_VERSION,
      exports: { HexViewerModel, HexViewerView }
    });

    const mimePlugin = createRendermimePlugin(
      tracker as WidgetTracker<MimeDocument>,
      mimerendererExports.default
    );
    // Not sure if I need to register if I am also activating.
    app.registerPlugin(mimePlugin);
    mimePlugin.activate(app, rendermime, translator);
  }
};

export default extension;
