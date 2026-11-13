import * as pdfjsLib from '../vendor/pdfjs/pdf.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('../vendor/pdfjs/pdf.worker.mjs', import.meta.url).href;

const input = document.getElementById('page-count-input');
const dropzone = document.getElementById('page-count-dropzone');
const list = document.getElementById('page-count-list');
const progress = document.getElementById('page-count-progress');
const clearButton = document.getElementById('page-count-clear');
const sortInput = document.getElementById('page-count-sort');
const paperInput = document.getElementById('page-count-paper');
const marginInput = document.getElementById('page-count-margin');
const fontSizeInput = document.getElementById('page-count-font-size');
const fontSizeValue = document.getElementById('page-count-font-size-value');
const totalFiles = document.getElementById('page-count-total-files');
const totalPages = document.getElementById('page-count-total-pages');
const thresholdInputs = [
    document.getElementById('page-count-threshold-1'),
    document.getElementById('page-count-threshold-2'),
    document.getElementById('page-count-threshold-3')
];
const thresholdOutputs = [
    document.getElementById('page-count-over-1'),
    document.getElementById('page-count-over-2'),
    document.getElementById('page-count-over-3')
];

const textExtensions = new Set(['txt', 'md', 'markdown', 'html', 'htm', 'csv', 'json', 'xml', 'yaml', 'yml', 'log', 'js', 'ts', 'jsx', 'tsx', 'css', 'java', 'py', 'sql']);
const unsupportedOfficeExtensions = new Set(['doc', 'ppt', 'xls', 'xlsx']);
const results = [];

function extensionOf(file) {
    const name = file.name.toLowerCase();
    return name.includes('.') ? name.split('.').pop() : '';
}

function typeLabel(extension, file) {
    if (extension === 'pdf') return 'PDF';
    if (extension === 'docx') return 'DOCX';
    if (extension === 'pptx') return 'PPTX';
    if (file.type.startsWith('image/')) return '图片';
    if (textExtensions.has(extension)) return extension.toUpperCase();
    return extension ? extension.toUpperCase() : '未知';
}

function estimateConfig() {
    const paper = paperInput.value === 'letter' ? { width: 216, height: 279 } : { width: 210, height: 297 };
    const margins = { narrow: 12, normal: 20, wide: 28 };
    return { paper, margin: margins[marginInput.value], fontSize: Number(fontSizeInput.value) };
}

function decodeXml(value) {
    const decoder = document.createElement('textarea');
    decoder.innerHTML = value;
    return decoder.value;
}

function textFromHtml(value) {
    return new DOMParser().parseFromString(value, 'text/html').body.textContent || '';
}

function textFromDocxXml(xml) {
    const withParagraphs = xml
        .replace(/<w:p(?:\s[^>]*)?>/g, '\n')
        .replace(/<w:tab[^>]*\/?>(?:<\/w:tab>)?/g, '\t')
        .replace(/<w:br[^>]*\/?>(?:<\/w:br>)?/g, '\n');
    return withParagraphs.replace(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g, function(_, text) {
        return decodeXml(text);
    }).replace(/<[^>]+>/g, '');
}

function estimateTextPages(text, config) {
    if (!text.trim()) return 0;
    const cssPixelsPerMillimeter = 96 / 25.4;
    const printableWidth = (config.paper.width - config.margin * 2) * cssPixelsPerMillimeter;
    const printableHeight = (config.paper.height - config.margin * 2) * cssPixelsPerMillimeter;
    const lineHeight = config.fontSize * 1.6;
    const linesPerPage = Math.max(1, Math.floor(printableHeight / lineHeight));
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = `${config.fontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    let lines = 0;

    for (const paragraph of text.replace(/\r/g, '').split('\n')) {
        if (!paragraph) {
            lines += 1;
            continue;
        }
        let width = 0;
        let paragraphLines = 1;
        for (const character of paragraph.replace(/\t/g, '    ')) {
            const characterWidth = context.measureText(character).width;
            if (width > 0 && width + characterWidth > printableWidth) {
                paragraphLines += 1;
                width = characterWidth;
            } else {
                width += characterWidth;
            }
        }
        lines += paragraphLines;
    }
    return Math.ceil(lines / linesPerPage);
}

async function inspectPdf(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const document = await pdfjsLib.getDocument({ data: bytes }).promise;
    const pages = document.numPages;
    document.destroy();
    return { pages, kind: 'exact', note: 'PDF 文件内的精确页数' };
}

async function inspectDocx(file) {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const documentFile = zip.file('word/document.xml');
    if (!documentFile) throw new Error('不是可识别的 DOCX 文档');
    const xml = await documentFile.async('string');
    const explicitBreaks = Math.max(
        (xml.match(/w:type=["']page["']/g) || []).length,
        (xml.match(/w:lastRenderedPageBreak\b/g) || []).length
    );
    const imageCount = (xml.match(/<(?:w:drawing|w:pict)\b/g) || []).length;
    return {
        kind: 'estimate',
        text: textFromDocxXml(xml),
        minimumPages: explicitBreaks + 1,
        imagePages: imageCount * 0.35,
        note: explicitBreaks ? `按正文、${explicitBreaks} 个显式分页符和图片估算` : '按正文排版和图片估算',
        confidence: '高可信估算'
    };
}

async function inspectPptx(file) {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const slides = Object.keys(zip.files).filter((path) => /^ppt\/slides\/slide\d+\.xml$/i.test(path)).length;
    if (!slides) throw new Error('未找到 PPTX 幻灯片');
    return { pages: slides, kind: 'exact', note: `精确识别 ${slides} 张幻灯片，按每张 1 页计` };
}

async function inspectText(file, extension) {
    const raw = await file.text();
    const text = extension === 'html' || extension === 'htm' ? textFromHtml(raw) : raw;
    return { kind: 'estimate', text, minimumPages: 0, imagePages: 0, note: '按当前纸张、页边距和字号估算', confidence: '估算' };
}

function refreshEstimate(result) {
    if (result.kind !== 'estimate') return;
    const basePages = estimateTextPages(result.text, estimateConfig());
    result.pages = Math.max(result.minimumPages || 0, Math.ceil(basePages + (result.imagePages || 0)));
}

async function inspectFile(file) {
    const extension = extensionOf(file);
    const result = { file, extension, type: typeLabel(extension, file), pages: null, kind: 'unsupported', note: '' };
    try {
        if (extension === 'pdf') Object.assign(result, await inspectPdf(file));
        else if (extension === 'docx') Object.assign(result, await inspectDocx(file));
        else if (extension === 'pptx') Object.assign(result, await inspectPptx(file));
        else if (file.type.startsWith('image/')) Object.assign(result, { pages: 1, kind: 'exact', note: '按每张图片 1 页计' });
        else if (textExtensions.has(extension)) Object.assign(result, await inspectText(file, extension));
        else if (unsupportedOfficeExtensions.has(extension)) {
            result.note = `旧版 ${extension.toUpperCase()} 或表格文件无法在浏览器中可靠分页，请使用离线版核对`;
        } else {
            result.note = '暂不支持此文件类型';
        }
        refreshEstimate(result);
    } catch (error) {
        result.kind = 'error';
        result.note = `无法读取：${error.message}`;
    }
    return result;
}

function badge(result) {
    const labels = { exact: '精确', estimate: result.confidence || '估算', unsupported: '不支持', error: '读取失败' };
    const badge = document.createElement('span');
    badge.className = `page-count-badge ${result.kind}`;
    badge.textContent = labels[result.kind];
    return badge;
}

function sortedResults() {
    if (sortInput.value === 'added') return results;
    const direction = sortInput.value === 'pages-asc' ? 1 : -1;
    return results
        .map((result, index) => ({ result, index }))
        .sort((left, right) => {
            const leftHasPages = Number.isFinite(left.result.pages);
            const rightHasPages = Number.isFinite(right.result.pages);
            if (!leftHasPages || !rightHasPages) {
                if (leftHasPages === rightHasPages) return left.index - right.index;
                return leftHasPages ? -1 : 1;
            }
            const pageDifference = (left.result.pages - right.result.pages) * direction;
            return pageDifference || left.index - right.index;
        })
        .map(({ result }) => result);
}

function render() {
    list.replaceChildren();
    if (!results.length) {
        const row = document.createElement('tr');
        row.className = 'page-count-empty';
        const cell = document.createElement('td');
        cell.colSpan = 4;
        cell.textContent = '尚未添加文件。';
        row.append(cell);
        list.append(row);
    } else {
        for (const result of sortedResults()) {
            const row = document.createElement('tr');
            const name = document.createElement('td');
            name.textContent = result.file.name;
            name.title = result.file.name;
            const type = document.createElement('td');
            type.textContent = result.type;
            const pages = document.createElement('td');
            pages.textContent = Number.isFinite(result.pages) ? `${result.pages} ${result.type === 'PPTX' ? '张' : '页'}` : '-';
            const note = document.createElement('td');
            note.append(badge(result), document.createTextNode(result.note));
            row.append(name, type, pages, note);
            list.append(row);
        }
    }

    const countable = results.filter((result) => Number.isFinite(result.pages));
    totalFiles.textContent = String(results.length);
    totalPages.textContent = String(countable.reduce((sum, result) => sum + result.pages, 0));
    thresholdInputs.forEach((input, index) => {
        const threshold = Number(input.value) || 0;
        thresholdOutputs[index].textContent = String(countable.filter((result) => result.pages > threshold).length);
    });
    clearButton.disabled = results.length === 0;
}

async function processFiles(files) {
    const pending = Array.from(files);
    if (!pending.length) return;
    for (let index = 0; index < pending.length; index += 1) {
        progress.textContent = `正在分析 ${index + 1} / ${pending.length}：${pending[index].name}`;
        results.push(await inspectFile(pending[index]));
        render();
    }
    progress.textContent = `已完成 ${pending.length} 个文件分析。`;
    input.value = '';
}

function updateEstimates() {
    fontSizeValue.textContent = `${fontSizeInput.value} px`;
    results.forEach(refreshEstimate);
    render();
}

dropzone.addEventListener('click', () => input.click());
dropzone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        input.click();
    }
});
input.addEventListener('change', () => processFiles(input.files));
['dragenter', 'dragover'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.add('is-dragging');
}));
['dragleave', 'drop'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.remove('is-dragging');
}));
dropzone.addEventListener('drop', (event) => processFiles(event.dataTransfer.files));
clearButton.addEventListener('click', () => {
    results.length = 0;
    progress.textContent = '等待添加文件。';
    render();
});
[paperInput, marginInput, fontSizeInput].forEach((element) => element.addEventListener('input', updateEstimates));
thresholdInputs.forEach((element) => element.addEventListener('input', render));
sortInput.addEventListener('change', render);
render();
