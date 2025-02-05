const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, 'assets', 'icon.ico'), // Use your .ico file here
        webPreferences: {
            nodeIntegration: true, // Enable Node.js in renderer
            contextIsolation: false, // Disable context isolation
        },
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on("web-contents-created", (event, contents) => {
    if (contents.getType() === "webview") {
        contents.on("will-navigate", (event, url) => {
            console.log(`Webview navigating to: ${url}`);
        });

        contents.on("new-window", (event, url) => {
            event.preventDefault();
            console.log(`Blocked new window: ${url}`);
        });
    }
});