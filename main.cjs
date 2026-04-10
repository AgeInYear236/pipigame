const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1920,
        height: 1000,
        webPreferences: {
            nodeIntegration: true
        }
    });

    // В разработке загружаем с сервера Vite, в билде — из папки dist
    if (process.env.NODE_ENV === 'development') {
        win.loadURL('http://localhost:5173');
    } else {
        // ВАЖНО: убедитесь, что путь ведет именно в папку dist,
        // которую создает Vite после npm run build
        win.loadFile(path.join(__dirname, 'dist/index.html'));
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});