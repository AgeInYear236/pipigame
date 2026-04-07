const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1920,
        height: 1000,
        backgroundColor: '#0a1a0a',
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    if (!app.isPackaged) {
        // В деве подключаемся к серверу, который запустил concurrently
        win.loadURL('http://127.0.0.1:5173').catch(() => {
            // Если вдруг не успел, пробуем еще раз через секунду
            setTimeout(() => win.loadURL('http://127.0.0.1:5173'), 1000);
        });
    } else {
        // В AppImage открываем готовый файл
        win.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }
}

app.whenReady().then(createWindow);