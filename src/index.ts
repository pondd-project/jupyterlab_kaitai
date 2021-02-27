import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { MODULE_NAME, MODULE_VERSION } from './version';

import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';

import * as widgetExports from './widget';

const EXTENSION_NAME = MODULE_NAME + ':plugin';

/**
 * Initialization data for the jupyterlab_kaitai extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: EXTENSION_NAME,
  autoStart: true,
  requires: [IJupyterWidgetRegistry],
  activate: (app: JupyterFrontEnd, registry: IJupyterWidgetRegistry) => {
    console.log('JupyterLab extension jupyterlab_kaitai is activated!');
    registry.registerWidget({
      name: MODULE_NAME,
      version: MODULE_VERSION,
      exports: widgetExports
    });
  }
};

export default extension;
