import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  IMimeDocumentTracker
} from '@jupyterlab/application';

import { WidgetTracker } from '@jupyterlab/apputils';

import { MimeDocument } from '@jupyterlab/docregistry';

import { createRendermimePlugin } from '@jupyterlab/application/lib/mimerenderers';

import { IRenderMimeRegistry } from '@jupyterlab/rendermime';

import { MODULE_NAME, MODULE_VERSION } from './version';

import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';

import * as mimerendererExports from './mimerenderer';

import * as widgetExports from './widget';

const EXTENSION_NAME = MODULE_NAME + ':plugin';

/**
 * Initialization data for the jupyterlab_kaitai extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: EXTENSION_NAME,
  autoStart: true,
  requires: [IJupyterWidgetRegistry, IRenderMimeRegistry, IMimeDocumentTracker],
  activate: (
    app: JupyterFrontEnd,
    registry: IJupyterWidgetRegistry,
    mimeregistry: IRenderMimeRegistry,
    tracker: IMimeDocumentTracker
  ) => {
    console.log('JupyterLab extension jupyterlab_kaitai is activated!');
    mimeregistry.addFactory;
    registry.registerWidget({
      name: MODULE_NAME,
      version: MODULE_VERSION,
      exports: widgetExports
    });

    app.registerPlugin(
      createRendermimePlugin(
        tracker as WidgetTracker<MimeDocument>,
        mimerendererExports.default
      )
    );
  }
};

export default extension;
