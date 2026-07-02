const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');

let expressApp;
let server;

function startExpress() {
  expressApp = express();

  // Serve static files from the dist directory
  expressApp.use(express.static(path.join(__dirname, '../dist')));

  // Simple fallback for SPA routing
  expressApp.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });

  server = expressApp.listen(0, () => {
    const port = server.address().port;
    createWindow(`http://localhost:${port}`);
  });
}

function createWindow(url) {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  win.loadURL(url);
}

app.whenReady().then(() => {
  startExpress();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      startExpress();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
