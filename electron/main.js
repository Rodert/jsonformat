const { app, BrowserWindow, dialog, shell } = require('electron');
const https = require('https');
const path = require('path');

const UPDATE_OWNER = 'Rodert';
const UPDATE_REPO = 'jsonformat';
const UPDATE_CHECK_DELAY_MS = 3000;
const UPDATE_CHECK_TIMEOUT_MS = 8000;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'JavaPub Tools',
    backgroundColor: '#f5f7fb',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  win.loadFile(path.join(__dirname, '..', 'index.html'));

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', event => {
    const targetUrl = event.url;
    if (!targetUrl.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(targetUrl);
    }
  });

  return win;
}

function getBuildInfo() {
  try {
    return require('./build-info.json');
  } catch (error) {
    return {
      releaseTag: 'dev',
      commit: 'local',
      buildDate: 'local'
    };
  }
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'JavaPub-Tools-Updater'
      }
    }, response => {
      let body = '';

      response.on('data', chunk => {
        body += chunk;
      });

      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`GitHub API status ${response.statusCode}`));
          return;
        }

        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });

    request.setTimeout(UPDATE_CHECK_TIMEOUT_MS, () => {
      request.destroy(new Error('Update check timeout'));
    });

    request.on('error', reject);
  });
}

async function checkForUpdates(win) {
  if (!app.isPackaged || !win || win.isDestroyed()) {
    return;
  }

  const current = getBuildInfo();
  if (!current.releaseTag || current.releaseTag === 'dev') {
    return;
  }

  try {
    const latest = await requestJson(`https://api.github.com/repos/${UPDATE_OWNER}/${UPDATE_REPO}/releases/latest`);
    if (!latest.tag_name || latest.tag_name === current.releaseTag || win.isDestroyed()) {
      return;
    }

    const result = await dialog.showMessageBox(win, {
      type: 'info',
      buttons: ['去下载', '稍后'],
      defaultId: 0,
      cancelId: 1,
      title: '发现新版本',
      message: `发现新版本：${latest.name || latest.tag_name}`,
      detail: `当前版本：${current.releaseTag}\n最新版本：${latest.tag_name}\n\n是否前往 GitHub Releases 下载？`
    });

    if (result.response === 0 && latest.html_url) {
      shell.openExternal(latest.html_url);
    }
  } catch (error) {
    console.warn('Update check failed:', error.message);
  }
}

app.whenReady().then(() => {
  const win = createWindow();

  setTimeout(() => {
    checkForUpdates(win);
  }, UPDATE_CHECK_DELAY_MS);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const activatedWin = createWindow();
      setTimeout(() => {
        checkForUpdates(activatedWin);
      }, UPDATE_CHECK_DELAY_MS);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
