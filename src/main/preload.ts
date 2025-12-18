import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  openExternal: (filePath: string) => ipcRenderer.invoke('open-external', filePath)
});
