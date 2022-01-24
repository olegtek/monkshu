/**
 * Preload bridge for Monkshu. 
 * (C) TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */
const {contextBridge, ipcRenderer} = require('electron');

function _initSync() {
    LOG.debug("preload _initSync: Enter");
    contextBridge.exposeInMainWorld("__org_monkshu_native", true);  // indicate we are running under Monkshu native
    contextBridge.exposeInMainWorld("api", function() {
        LOG.debug("preload _initSync: api");
        return ipcRenderer.sendSync("api", [...arguments]);
    });
    contextBridge.exposeInMainWorld("apiAsync", async function() {
        LOG.debug("preload _initSync: apiAsync");
        return await ipcRenderer.invoke("apiAsync", [...arguments]);
    });
    LOG.debug("preload _initSync: Exit");
}
_initSync();