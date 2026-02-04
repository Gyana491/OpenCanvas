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

  saveWorkflow: (id: string, nodes: any[], edges: any[], viewport?: any) =>
    ipcRenderer.invoke('workflow:save', id, nodes, edges, viewport),

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
});
