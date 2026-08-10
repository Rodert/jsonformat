document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('gif-files');
    const dropZone = document.getElementById('gif-drop-zone');
    const frameList = document.getElementById('gif-frame-list');
    const delayInput = document.getElementById('gif-delay');
    const sizeInput = document.getElementById('gif-size');
    const qualityInput = document.getElementById('gif-quality');
    const loopInput = document.getElementById('gif-loop');
    const createButton = document.getElementById('gif-create-btn');
    const downloadButton = document.getElementById('gif-download-btn');
    const resetButton = document.getElementById('gif-reset-btn');
    const message = document.getElementById('gif-message');
    const preview = document.getElementById('gif-preview');
    const frameCount = document.getElementById('gif-frame-count');
    const outputDimension = document.getElementById('gif-output-dimension');
    const outputSize = document.getElementById('gif-output-size');
    let frames = [];
    let resultBlob = null;
    let resultUrl = '';

    function setMessage(text, type) { message.textContent = text; message.className = `json-message${type ? ` ${type}` : ''}`; }
    function formatBytes(bytes) {
        const units = ['B', 'KB', 'MB', 'GB']; let value = bytes; let index = 0;
        while (value >= 1024 && index < units.length - 1) { value /= 1024; index++; }
        return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(2)} ${units[index]}`;
    }
    function supported(file) { return file && /^image\/(jpeg|png|webp|avif)$/.test(file.type); }
    function clearResult() {
        if (resultUrl) URL.revokeObjectURL(resultUrl);
        resultBlob = null; resultUrl = ''; outputSize.textContent = '-'; downloadButton.disabled = true;
        preview.innerHTML = '<span>生成后显示 GIF 预览。</span>';
    }
    function updateDimensions() {
        if (!frames.length || !frames[0].width) { outputDimension.textContent = '-'; return; }
        const max = Number(sizeInput.value);
        const scale = Number.isFinite(max) ? Math.min(1, max / Math.max(frames[0].width, frames[0].height)) : 1;
        outputDimension.textContent = `${Math.round(frames[0].width * scale)} x ${Math.round(frames[0].height * scale)}`;
    }
    function renderFrames() {
        frameCount.textContent = String(frames.length); createButton.disabled = frames.length < 2;
        if (!frames.length) { frameList.innerHTML = '<p class="muted">选择图片后会按此处顺序播放。可使用每一帧上的按钮调整顺序或移除图片。</p>'; updateDimensions(); return; }
        frameList.innerHTML = '';
        frames.forEach((frame, index) => {
            const item = document.createElement('div'); item.className = 'gif-frame-item';
            item.innerHTML = `<img src="${frame.url}" alt="第 ${index + 1} 帧预览"><div class="gif-frame-name"><strong>第 ${index + 1} 帧</strong><span>${frame.file.name}</span></div><div class="gif-frame-actions"><button type="button" data-action="up" data-index="${index}" title="上移" aria-label="上移第 ${index + 1} 帧" ${index === 0 ? 'disabled' : ''}>上移</button><button type="button" data-action="down" data-index="${index}" title="下移" aria-label="下移第 ${index + 1} 帧" ${index === frames.length - 1 ? 'disabled' : ''}>下移</button><button type="button" data-action="remove" data-index="${index}" title="移除" aria-label="移除第 ${index + 1} 帧">移除</button></div>`;
            frameList.appendChild(item);
        });
        updateDimensions();
    }
    function addFiles(fileList) {
        const valid = Array.from(fileList).filter(supported);
        if (!valid.length) { setMessage('请选择 JPEG、PNG、WebP 或 AVIF 图片。', 'error'); return; }
        clearResult();
        valid.forEach((file) => frames.push({ file, url: URL.createObjectURL(file), width: 0, height: 0 }));
        Promise.all(frames.map((frame) => new Promise((resolve) => {
            if (frame.width) { resolve(); return; }
            const image = new Image(); image.onload = () => { frame.width = image.naturalWidth; frame.height = image.naturalHeight; resolve(); };
            image.onerror = () => resolve(); image.src = frame.url;
        }))).then(renderFrames);
        renderFrames(); setMessage(`已添加 ${valid.length} 张图片，请确认播放顺序后生成 GIF。`, 'success');
    }
    function reset() {
        frames.forEach((frame) => URL.revokeObjectURL(frame.url)); frames = []; fileInput.value = ''; clearResult(); renderFrames(); setMessage('至少选择两张图片后即可生成。');
    }
    function loadImage(url) { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('有图片无法读取，请移除后重试。')); image.src = url; }); }
    async function createGif() {
        if (frames.length < 2 || !window.GIF) { setMessage('GIF 编码器未准备好，请刷新页面后重试。', 'error'); return; }
        createButton.disabled = true; clearResult(); setMessage('正在读取图片并编码 GIF，请保持页面开启...');
        try {
            const images = await Promise.all(frames.map((frame) => loadImage(frame.url)));
            const first = images[0]; const max = Number(sizeInput.value);
            const scale = Number.isFinite(max) ? Math.min(1, max / Math.max(first.naturalWidth, first.naturalHeight)) : 1;
            const width = Math.max(1, Math.round(first.naturalWidth * scale)); const height = Math.max(1, Math.round(first.naturalHeight * scale));
            const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
            const context = canvas.getContext('2d');
            const gif = new GIF({ workers: Math.min(2, navigator.hardwareConcurrency || 1), quality: Number(qualityInput.value), width, height, repeat: loopInput.checked ? 0 : -1, workerScript: 'vendor/gif.js/gif.worker.js' });
            images.forEach((image) => {
                const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight);
                const drawWidth = Math.round(image.naturalWidth * ratio); const drawHeight = Math.round(image.naturalHeight * ratio);
                context.fillStyle = '#ffffff'; context.fillRect(0, 0, width, height);
                context.drawImage(image, Math.round((width - drawWidth) / 2), Math.round((height - drawHeight) / 2), drawWidth, drawHeight);
                gif.addFrame(canvas, { copy: true, delay: Number(delayInput.value) });
            });
            gif.on('progress', (progress) => setMessage(`正在编码 GIF：${Math.round(progress * 100)}%`));
            gif.on('finished', (blob) => { resultBlob = blob; resultUrl = URL.createObjectURL(blob); preview.innerHTML = `<img src="${resultUrl}" alt="生成的 GIF 预览">`; outputSize.textContent = formatBytes(blob.size); outputDimension.textContent = `${width} x ${height}`; downloadButton.disabled = false; createButton.disabled = false; setMessage('GIF 已生成，可以预览或下载。', 'success'); });
            gif.render();
        } catch (error) { createButton.disabled = false; setMessage(error.message || 'GIF 生成失败，请减少图片数量或输出尺寸后重试。', 'error'); }
    }
    frameList.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]'); if (!button) return;
        const index = Number(button.dataset.index); const action = button.dataset.action; clearResult();
        if (action === 'remove') { URL.revokeObjectURL(frames[index].url); frames.splice(index, 1); }
        if (action === 'up' && index > 0) [frames[index - 1], frames[index]] = [frames[index], frames[index - 1]];
        if (action === 'down' && index < frames.length - 1) [frames[index], frames[index + 1]] = [frames[index + 1], frames[index]];
        renderFrames();
    });
    fileInput.addEventListener('change', () => { if (fileInput.files.length) { addFiles(fileInput.files); fileInput.value = ''; } });
    ['dragenter', 'dragover'].forEach((name) => dropZone.addEventListener(name, (event) => { event.preventDefault(); dropZone.classList.add('is-dragover'); }));
    ['dragleave', 'drop'].forEach((name) => dropZone.addEventListener(name, (event) => { event.preventDefault(); dropZone.classList.remove('is-dragover'); }));
    dropZone.addEventListener('drop', (event) => addFiles(event.dataTransfer.files));
    sizeInput.addEventListener('change', () => { clearResult(); updateDimensions(); });
    createButton.addEventListener('click', createGif);
    downloadButton.addEventListener('click', () => { if (!resultUrl) return; const link = document.createElement('a'); link.href = resultUrl; link.download = 'animated-image.gif'; document.body.appendChild(link); link.click(); link.remove(); });
    resetButton.addEventListener('click', reset);
    window.addEventListener('beforeunload', () => { frames.forEach((frame) => URL.revokeObjectURL(frame.url)); if (resultUrl) URL.revokeObjectURL(resultUrl); });
});
