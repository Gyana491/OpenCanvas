import { ipcRenderer, contextBridge } from "electron";
import { IPC_CHANNELS } from "./constants";

window.addEventListener("message", (event) => {
  if (event.data === IPC_CHANNELS.START_ORPC_SERVER) {
    const [serverPort] = event.ports;

    ipcRenderer.postMessage(IPC_CHANNELS.START_ORPC_SERVER, null, [serverPort]);
  }
});

// Expose workflow API to renderer process
contextBridge.exposeInMainWorld('electron', {
  createWorkflow: (name?: string) => ipcRenderer.invoke('workflow:create', name),

  saveWorkflow: (id: string, nodes: any[], edges: any[], viewport?: any, thumbnail?: ArrayBuffer) =>
    ipcRenderer.invoke('workflow:save', id, nodes, edges, viewport, thumbnail),

  loadWorkflow: (id: string) => ipcRenderer.invoke('workflow:load', id),

  deleteWorkflow: (id: string) => ipcRenderer.invoke('workflow:delete', id),

  listWorkflows: () => ipcRenderer.invoke('workflow:list'),

  saveAsset: (
    workflowId: string,
    nodeId: string,
    fileBuffer: Buffer,
    fileName: string,
    assetType: 'image' | 'video' | 'file',
    mimeType?: string
  ) => ipcRenderer.invoke('workflow:save-asset', workflowId, nodeId, fileBuffer, fileName, assetType, mimeType),

  exportProject: (id: string) => ipcRenderer.invoke('workflow:export', id),

  importProject: (zipBuffer: Buffer) => ipcRenderer.invoke('workflow:import', zipBuffer),

  duplicateWorkflow: (id: string) => ipcRenderer.invoke('workflow:duplicate', id),

  renameWorkflow: (id: string, name: string) => ipcRenderer.invoke('workflow:rename', id, name),

  // Update API
  onUpdateAvailable: (callback: (info: any) => void) => ipcRenderer.on('update-available', (_, info) => callback(info)),
  onUpdateDownloaded: (callback: (info: any) => void) => ipcRenderer.on('update-downloaded', (_, info) => callback(info)),
  onUpdateError: (callback: (error: any) => void) => ipcRenderer.on('update-error', (_, error) => callback(error)),
  downloadUpdateManual: () => ipcRenderer.invoke('download-update-manual'),
});
