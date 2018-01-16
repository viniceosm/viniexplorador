const electron = require('electron');
const ipc = electron.ipcRenderer;
const remote = electron.remote;

let numeroArquivoVisualizando = undefined; //numero do arquivo sendo visto
let vizualizandoArquivo = false;

mostraArealistafiles();

document.getElementById("winClose").addEventListener("click", (e) => {
    let window = remote.getCurrentWindow();
    window.close();
});

// EVENTOS

document.getElementById("btnVoltarCaminho").addEventListener("click", (e) => {
    ipc.send('voltar caminho');
    mostraLoader();
});

document.querySelector('#txtCaminho').addEventListener('keyup', mudouCaminhoTecla);
document.querySelector('#txtCaminho').addEventListener('change', (e) => {
    mudouCaminho();
});

[].map.call(document.querySelectorAll('.btnMenu'), (v) => {
    v.onclick = (e) => {
        ipc.send('mudouCaminhoPeloBtnMenu', v.innerHTML);
        mostraLoader();
    };
});

document.querySelector('#setaEsquerda').addEventListener('click', (e) => {
    visualizarSetaEsquerda()
});

document.querySelector('#setaDireita').addEventListener('click', (e) => {
    visualizarSetaDireita();
});

// IPC

ipc.on('voltou caminho com atalho', (event) => {
    mostraLoader();
});

ipc.on('visualizarSetaEsquerda atalho', (event) => {
    if (vizualizandoArquivo == true) {
        visualizarSetaEsquerda();
    }
});

ipc.on('visualizarSetaDireita atalho', (event) => {
    if (vizualizandoArquivo == true) {
        visualizarSetaDireita();
    }
});

ipc.on('files carregados', (event, files, caminhoDiretorio, arvoreDir) => {
    mostraArealistafiles();

    document.querySelector('#txtCaminho').value = caminhoDiretorio;
    document.querySelector('#listafiles').innerHTML = '';
    document.querySelector('#areaConteudo').innerHTML = '';

    files.forEach((file, i) => {
        let areaFilesHtml = '';
        let areaConteudoHtml = '';

        if (file.tipo == 'imagem') {
            areaFilesHtml = areaFilesHtmlImagem(file, i, caminhoDiretorio);
            areaConteudoHtml = areaConteudoHtmlImagem(file, i, caminhoDiretorio);
        } else if (file.tipo == 'video' || file.tipo == 'audio') {
            areaFilesHtml = areaFilesHtmlVideo(file, i, caminhoDiretorio);
        } else if (file.tipo == 'outros') {
            areaFilesHtml = areaFilesHtmlOutros(file, i, caminhoDiretorio);
        } else if (file.tipo == 'dir') {
            areaFilesHtml = areaFilesHtmlDir(file, i, caminhoDiretorio);
        }

        document.querySelector('#listafiles').innerHTML += areaFilesHtml;
        document.querySelector('#areaConteudo').innerHTML += areaConteudoHtml;
    });

    let areaHierarquiaHtml = '';
    areaHierarquiaHtml = montaHierarquia(arvoreDir, 0);
    document.querySelector('#areaHierarquia').innerHTML = areaHierarquiaHtml;

    [].map.call(document.querySelectorAll('.irCaminho'), (v) => {
        v.addEventListener('click', () => {
            document.querySelector('#txtCaminho').value = v.getAttribute('valor-caminho');
            mudouCaminho();
        });
    });
    [].map.call(document.querySelectorAll('.btnVisualizar'), (v) => {
        v.onclick = (e) => {
            let numero = parseInt(v.getAttribute('numero'));
            let caminhoDiretorio = v.getAttribute('caminhoDiretorio');
            vizualizandoArquivo = true;
            visualizar(numero, caminhoDiretorio);
        }
    });
});

// FUNCOES

function montaHierarquia(arr, nivel) {
    return arr.reduce((acc, obj) => {
        return acc + '&nbsp;&nbsp;'.repeat(nivel) + obj.src + '<br>' + montaHierarquia(obj.dirFilho, nivel + 1);
    }, '');
}

function mudouCaminhoTecla(e) {
    if (e.keyCode == 13) {
        mudouCaminho();
    }
}

function mudouCaminho(e) {
    ipc.send('mudou caminho', document.querySelector('#txtCaminho').value);

    mostraLoader();
}

function mostraLoader() {
    document.getElementById('arealistafiles').style.display = "none";
    document.getElementById('areaVisualizar').style.display = "none";

    document.getElementById('areaCarregando').style.display = "";
}

function mostraArealistafiles() {
    document.getElementById('arealistafiles').style.display = "";

    document.getElementById('areaCarregando').style.display = "none";
    document.getElementById('areaVisualizar').style.display = "none";

    vizualizandoArquivo = false;
}

function visualizar(numeroArquivo) {
    document.getElementById('arealistafiles').style.display = "none";
    document.getElementById('areaCarregando').style.display = "none";
    document.getElementById('areaVisualizar').style.display = "";

    if (numeroArquivoVisualizando != undefined)
        document.querySelector(`#areaVisualizar #areaConteudo img[numero="${numeroArquivoVisualizando}"]`).style.display = "none";
    document.querySelector(`#areaVisualizar #areaConteudo img[numero="${numeroArquivo}"]`).style.display = "";

    numeroArquivoVisualizando = numeroArquivo;
}

function visualizarSetaEsquerda() {
    if (numeroArquivoVisualizando >= 1) {
        visualizar(numeroArquivoVisualizando - 1);
    }
}

function visualizarSetaDireita() {
    if (numeroArquivoVisualizando < (document.querySelectorAll('#areaConteudo img').length - 1)) {
        visualizar(numeroArquivoVisualizando + 1);
    }
}

function areaFilesHtmlImagem(file, i, caminhoDiretorio) {
    return `<div class="col-xs-4 col-md-2 margin-top10 mincol">
                    <img class="img-responsive img-thumbnail center-block tinny btnVisualizar" 
                        src="${caminhoDiretorio}${file.src}" valor-tipoArquivo="imagem" numero="${i}" caminhoDiretorio="${caminhoDiretorio}">
                    <div class="title-file">${file.src}</div>
                </div>`;
}
function areaConteudoHtmlImagem(file, i, caminhoDiretorio) {
    return `<img class="center-block" src="${caminhoDiretorio}${file.src}" 
                    valor-tipoArquivo="imagem" numero="${i}" caminhoDiretorio="${caminhoDiretorio}" style="display: none;">`;
}
function areaFilesHtmlVideo(file, i, caminhoDiretorio) {
    return `<div class="col-xs-4 col-md-2 margin-top10 mincol">
                    <video controls class="center-block img-thumbnail" style="max-height: 120px; max-width: 100%;">
                        <source src="${caminhoDiretorio}${file.src}">
                    </video>
                    <div class="title-file">${file.src}</div>
                </div>`;
}
function areaFilesHtmlOutros(file, i, caminhoDiretorio) {
    return `<div class="col-xs-4 col-md-2 margin-top10 mincol">
                    <img class="img-responsive img-thumbnail center-block tinny" src="./img/otherFiles-icon.png">
                    <div class="title-file">${file.src}</div>
                </div>`;
}
function areaFilesHtmlDir(file, i, caminhoDiretorio) {
    return `<div class="col-xs-4 col-md-2 margin-top10 mincol">
            <a href="#" class="irCaminho" valor-caminho="${caminhoDiretorio}${file.src}/" onclick="mudouCaminho();">
            <img class="img-responsive img-thumbnail center-block tinny" src="./img/dir-icon.png">
            <div class="title-file">${file.src}</div>
            </a>
        </div>`;
}