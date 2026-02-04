/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />

import { app, BrowserWindow, protocol, net } from "electron";
import path from "path";
import {
  installExtension,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import { ipcMain } from "electron/main";
import { ipcContext } from "@/ipc/context";
import { IPC_CHANNELS } from "./constants";
import { updateElectronApp, UpdateSourceType } from "update-electron-app";
import { initStorage } from "./services/file-storage-service";
import { registerWorkflowHandlers } from "./ipc/workflow-handlers";

const inDevelopment = process.env.NODE_ENV === "development";

function createWindow() {
  const preload = path.join(__dirname, "preload.js");
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      devTools: inDevelopment,
      contextIsolation: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,

      preload: preload,
    },
    title: "OpenCanvas",
  });
  ipcContext.setMainWindow(mainWindow);

  //Enable Developer Tools
  mainWindow.webContents.openDevTools();

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
}

async function installExtensions() {
  try {
    const result = await installExtension(REACT_DEVELOPER_TOOLS);
    console.log(`Extensions installed successfully: ${result.name}`);
  } catch {
    console.error("Failed to install extensions");
  }
}

function checkForUpdates() {
  updateElectronApp({
    updateSource: {
      type: UpdateSourceType.ElectronPublicUpdateService,
      repo: "LuanRoger/electron-shadcn",
    },
  });
}

async function setupORPC() {
  const { rpcHandler } = await import("./ipc/handler");

  ipcMain.on(IPC_CHANNELS.START_ORPC_SERVER, (event) => {
    const [serverPort] = event.ports;

    serverPort.start();
    rpcHandler.upgrade(serverPort);
  });
}

function registerProtocol() {
  protocol.handle("opencanvas", (request) => {
    const url = request.url.replace("opencanvas://", "");
    // url format: opencanvas://<workflowId>/assets/<filename>
    // but the request.url comes as opencanvas://<host>/<path>
    // actually, normally schemes like opencanvas://hostname/path
    // We will use opencanvas://store/workflowId/assets/filename for clarity or just opencanvas://workflowId/

    // Let's assume usage: opencanvas://<workflowId>/assets/<filename>
    // request.url will be opencanvas://<workflowId>/assets/<filename>

    try {
      // Decode URL to handle spaces etc
      const decodedUrl = decodeURIComponent(url);

      // We expect the first segment to be the workflow ID
      // But depending on how URL is parsed, it might be tricky.
      // Let's handle it manually.

      // Remove trailing slash if any
      const cleanPath = decodedUrl.startsWith('/') ? decodedUrl.slice(1) : decodedUrl;
      const parts = cleanPath.split('/');

      // Expected: [workflowId, 'assets', filename] OR [workflowId, 'thumbnail']
      if (parts.length === 2 && parts[1] === 'thumbnail') {
        // Serve thumbnail
        const workflowId = parts[0];
        const homeDir = app.getPath('home');
        const filePath = path.join(homeDir, '.opencanvas', `opencanvas_${workflowId}`, `opencanvas_thumbnail_${workflowId}.png`);
        return net.fetch(`file://${filePath}`);
      }

      if (parts.length < 3 || parts[1] !== 'assets') {
        return new Response("Invalid URL format", { status: 400 });
      }

      const workflowId = parts[0];
      const filename = parts.slice(2).join('/'); // In case filename has subdirs, though we flat keys

      const homeDir = app.getPath('home');
      const filePath = path.join(homeDir, '.opencanvas', `opencanvas_${workflowId}`, 'assets', filename);

      return net.fetch(`file://${filePath}`, {
        headers: request.headers
      });
    } catch (error) {
      console.error("Protocol error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  });
}

async function setupDatabase() {
  try {
    console.log('[Main] Initializing file storage...');

    // Initialize storage directories
    initStorage();

    // Register workflow IPC handlers
    registerWorkflowHandlers();

    console.log('[Main] File storage initialized successfully');
  } catch (error) {
    console.error('[Main] Failed to initialize storage:', error);
    throw error;
  }
}

// Register privileges for the custom protocol
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'opencanvas',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      bypassCSP: true,
      stream: true
    }
  }
])

app
  .whenReady()
  .then(() => {
    registerProtocol();
    setupDatabase();
    createWindow();
    installExtensions();
    checkForUpdates();
    setupORPC();
  });

//osX only
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
//osX only ends
