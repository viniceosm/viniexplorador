const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
const ipcMain = electron.ipcMain

const path = require('path')
const url = require('url')
const fs = require('fs')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

let caminhoDiretorio = adicionaBarraNoFinal(app.getPath('pictures'));
let historicoCaminhoDiretorio = [caminhoDiretorio];

let extensoesArquivo = [
  { tipo: 'imagem', extensao: ['jpg', 'jpeg', 'png', 'svg', 'gif', 'bmp', 'tiff'] },
  { tipo: 'video', extensao: ['mp4'] },
  { tipo: 'audio', extensao: ['opus', 'mp3'] },
  { tipo: 'outros', extensao: ['pdf', 'zip', 'md', 'js', 'sh', 'arj', 'java'] }
];

const voltarCaminho = (sender) => {
  if (historicoCaminhoDiretorio.length > 1) {
    historicoCaminhoDiretorio.pop();

    caminhoDiretorio = historicoCaminhoDiretorio[historicoCaminhoDiretorio.length-1];
    carregaArquivos(sender);
  }
};

function adicionaBarraNoFinal(caminho) {
  if (caminho.charAt(caminho.length-1) !== '/'){
    caminho+='/';
  }
  return caminho;
}

const adicionaTipoDir = (file) => {
  return {
    src: file,
    tipo: 'dir'
  };

};

const adicionaTipoArquivo = (file) => {
  file = { src: file };

  for (extensaoArquivo of extensoesArquivo){
    for (extensao of extensaoArquivo.extensao){
      if (file.src.toLowerCase().indexOf('.' + extensao) > -1) {
        file.tipo = extensaoArquivo.tipo;
        return file;
      }
    }
  }

  return file;
};

const readDirs = p => fs.readdirSync(p).filter(f => fs.statSync(path.join(p, f)).isDirectory());
const readNoDirs = p => fs.readdirSync(p).filter(f => !fs.statSync(path.join(p, f)).isDirectory());

const carregaArquivos = (sender) => {
  let arvoreDir = adicionaDirFilho(readDirs(caminhoDiretorio).map(adicionaTipoDir), caminhoDiretorio);
  montaHierarquia(arvoreDir, 0);

  let dirs = readDirs(caminhoDiretorio).map(adicionaTipoDir);
  let noDirs = readNoDirs(caminhoDiretorio).map(adicionaTipoArquivo);

  let files = dirs.concat(noDirs);
  sender.send('files carregados', files, caminhoDiretorio, arvoreDir);
}

function montaHierarquia(arr, nivel){
  `
    <li class="text-center">
        <a href="dashboard#" data-toggle="dropdown" class="dropdown-toggle">
            <i class="fa fa-bullhorn" aria-hidden="true"></i><br>
            Propaganda
        </a>
        <ul class="dropdown-menu sub-menu min-width-100%">
            <li>
                <a href="dashboard#">
                    <i class="fa fa-television" aria-hidden="true"></i>
                    Criar Propaganda
                </a>
            </li>
        </ul>
    </li>
  `
  arr.map(obj => {
    console.log('\t'.repeat(nivel) + obj.src + ' (' + obj.caminhoCompleto + ') ' + obj.tipo);
    montaHierarquia(obj.dirFilho, nivel + 1);
  })
}

function adicionaDirFilho(arr, caminho){
  return arr.map(obj => {
    let dirFilho = [];

    if (obj.tipo == 'dir') {
      let dirs = readDirs(path.join(caminho, obj.src)).map(adicionaTipoDir);
      let noDirs = readNoDirs(path.join(caminho, obj.src)).map(adicionaTipoArquivo);

      dirFilho = adicionaDirFilho(dirs.concat(noDirs), path.join(caminho, obj.src));
    }
    
    obj.caminhoCompleto = path.join(caminho, obj.src);
    obj.dirFilho = dirFilho;

    return obj;
  });
}

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600, 
    frame: false,
    center: true,
    icon: './img/dir-icon.png'
  })

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  mainWindow.webContents.on('did-finish-load', () => {
    carregaArquivos(mainWindow.webContents);
    mainWindow.webContents.send('appCarregou');

    electron.globalShortcut.register('Alt+Left', () => {
      if (mainWindow.isFocused()) {
        voltarCaminho(mainWindow.webContents)
        mainWindow.webContents.send('voltou caminho com atalho');
      }
    })
    electron.globalShortcut.register('Left', () => {
      if (mainWindow.isFocused()) {
        mainWindow.webContents.send('visualizarSetaEsquerda atalho');
      }
    })
    electron.globalShortcut.register('Right', () => {
      if (mainWindow.isFocused()) {
        mainWindow.webContents.send('visualizarSetaDireita atalho');
      }
    })
  })
  
  ipcMain.on('mudou caminho', (event, caminhoNovo) => {
    caminhoDiretorio = adicionaBarraNoFinal(caminhoNovo);
    historicoCaminhoDiretorio.push(caminhoDiretorio);
    
    carregaArquivos(event.sender);
  })
  
  ipcMain.on('mudouCaminhoPeloBtnMenu', (event, caminhoNovo) => {
    let options = {
      'Imagens': 'pictures',
      'Documentos': 'documents',
      'Downloads': 'downloads',
      'Musicas': 'music',
      'Videos': 'videos'
    };
    caminhoDiretorio = adicionaBarraNoFinal(app.getPath(options[caminhoNovo]));
    historicoCaminhoDiretorio.push(caminhoDiretorio);

    carregaArquivos(event.sender);
  });

  ipcMain.on('voltar caminho', (event, caminhoNovo) => {
    voltarCaminho(event.sender);
  })

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
