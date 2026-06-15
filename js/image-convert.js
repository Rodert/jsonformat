document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('image-file');
    const dropZone = document.getElementById('image-drop-zone');
    const outputFormat = document.getElementById('image-output-format');
    const qualityInput = document.getElementById('image-quality');
    const qualityValue = document.getElementById('image-quality-value');
    const convertBtn = document.getElementById('image-convert-btn');
    const downloadBtn = document.getElementById('image-download-btn');
    const resetBtn = document.getElementById('image-reset-btn');
    const message = document.getElementById('image-convert-message');
    const originalPreview = document.getElementById('image-original-preview');
    const convertedPreview = document.getElementById('image-converted-preview');
    const originalFormat = document.getElementById('image-original-format');
    const outputFormatText = document.getElementById('image-output-format-text');
    const originalSize = document.getElementById('image-original-size');
    const outputSize = document.getElementById('image-output-size');
    const outputDimension = document.getElementById('image-output-dimension');

    let sourceFile = null;
    let originalUrl = '';
    let convertedUrl = '';
    let convertedBlob = null;
    let convertedName = 'converted-image.jpg';

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message${type ? ` ${type}` : ''}`;
    }

    function formatBytes(bytes) {
        if (!Number.isFinite(bytes) || bytes <= 0) {
            return '0 B';
        }
        const units = ['B', 'KB', 'MB', 'GB'];
        let value = bytes;
        let index = 0;
        while (value >= 1024 && index < units.length - 1) {
            value /= 1024;
            index++;
        }
        return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(2)} ${units[index]}`;
    }

    function mimeLabel(mime) {
        const labels = {
            'image/jpeg': 'JPEG',
            'image/png': 'PNG',
            'image/webp': 'WebP',
            'image/avif': 'AVIF'
        };
        return labels[mime] || mime.replace('image/', '').toUpperCase();
    }

    function revokeUrl(url) {
        if (url) {
            URL.revokeObjectURL(url);
        }
    }

    function resetOutput() {
        revokeUrl(convertedUrl);
        convertedUrl = '';
        convertedBlob = null;
        convertedName = 'converted-image.jpg';
        outputSize.textContent = '-';
        outputDimension.textContent = '-';
        convertedPreview.innerHTML = '<span>转换后显示结果。</span>';
        downloadBtn.disabled = true;
    }

    function resetAll() {
        revokeUrl(originalUrl);
        originalUrl = '';
        sourceFile = null;
        fileInput.value = '';
        originalFormat.textContent = '-';
        outputFormatText.textContent = '-';
        originalSize.textContent = '-';
        originalPreview.innerHTML = '<span>选择图片后显示原图。</span>';
        resetOutput();
        setMessage('等待选择图片。');
    }

    function setPreview(container, url, alt) {
        container.innerHTML = '';
        const img = document.createElement('img');
        img.src = url;
        img.alt = alt;
        container.appendChild(img);
    }

    function updateQualityLabel() {
        qualityValue.textContent = `${qualityInput.value}%`;
    }

    function updateQualityState() {
        const isPng = outputFormat.value === 'image/png';
        qualityInput.disabled = isPng;
        qualityValue.textContent = isPng ? 'PNG无质量参数' : `${qualityInput.value}%`;
        outputFormatText.textContent = mimeLabel(outputFormat.value);
    }

    function isSupportedImage(file) {
        return file && /^image\/(jpeg|png|webp|avif)$/.test(file.type);
    }

    function loadBitmap(file) {
        if (window.createImageBitmap) {
            return createImageBitmap(file, { imageOrientation: 'from-image' });
        }

        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = function() {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            img.onerror = function() {
                URL.revokeObjectURL(url);
                reject(new Error('图片读取失败，请换一张图片重试。'));
            };
            img.src = url;
        });
    }

    function canvasToBlob(canvas, mime, quality) {
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                    return;
                }
                reject(new Error('当前浏览器无法导出该图片格式。'));
            }, mime, quality);
        });
    }

    function extensionForMime(mime) {
        if (mime === 'image/webp') {
            return 'webp';
        }
        if (mime === 'image/png') {
            return 'png';
        }
        return 'jpg';
    }

    function buildOutputName(file, mime) {
        const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
        return `${baseName}.${extensionForMime(mime)}`;
    }

    async function handleFile(file) {
        if (!isSupportedImage(file)) {
            setMessage('请选择 JPEG、PNG、WebP 或 AVIF 图片。', 'error');
            return;
        }

        revokeUrl(originalUrl);
        resetOutput();
        sourceFile = file;
        originalUrl = URL.createObjectURL(file);
        originalFormat.textContent = mimeLabel(file.type);
        outputFormatText.textContent = mimeLabel(outputFormat.value);
        originalSize.textContent = formatBytes(file.size);
        setPreview(originalPreview, originalUrl, '原图预览');
        setMessage(`已选择 ${file.name}，可以开始转换。`, 'success');
    }

    async function convertImage() {
        if (!sourceFile) {
            setMessage('请先选择一张图片。', 'error');
            return;
        }

        convertBtn.disabled = true;
        setMessage('正在转换图片格式...');

        try {
            const bitmap = await loadBitmap(sourceFile);
            const mime = outputFormat.value;
            const quality = Number(qualityInput.value) / 100;
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d', { alpha: mime !== 'image/jpeg' });

            canvas.width = bitmap.width;
            canvas.height = bitmap.height;

            if (mime === 'image/jpeg') {
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, canvas.width, canvas.height);
            }

            context.drawImage(bitmap, 0, 0);
            if (typeof bitmap.close === 'function') {
                bitmap.close();
            }

            const blob = await canvasToBlob(canvas, mime, mime === 'image/png' ? undefined : quality);
            revokeUrl(convertedUrl);
            convertedBlob = blob;
            convertedUrl = URL.createObjectURL(blob);
            convertedName = buildOutputName(sourceFile, mime);

            outputFormatText.textContent = mimeLabel(mime);
            outputSize.textContent = formatBytes(blob.size);
            outputDimension.textContent = `${canvas.width} x ${canvas.height}`;
            setPreview(convertedPreview, convertedUrl, '转换图片预览');
            downloadBtn.disabled = false;
            setMessage('格式转换完成，可以预览或下载结果。', 'success');
        } catch (error) {
            setMessage(error && error.message ? error.message : '图片格式转换失败，请换一张图片重试。', 'error');
        } finally {
            convertBtn.disabled = false;
        }
    }

    function downloadResult() {
        if (!convertedBlob || !convertedUrl) {
            setMessage('还没有可下载的转换结果。', 'error');
            return;
        }

        const link = document.createElement('a');
        link.href = convertedUrl;
        link.download = convertedName;
        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    fileInput.addEventListener('change', function() {
        const file = fileInput.files && fileInput.files[0];
        if (file) {
            handleFile(file);
        }
    });

    ['dragenter', 'dragover'].forEach((eventName) => {
        dropZone.addEventListener(eventName, function(event) {
            event.preventDefault();
            dropZone.classList.add('is-dragover');
        });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
        dropZone.addEventListener(eventName, function(event) {
            event.preventDefault();
            dropZone.classList.remove('is-dragover');
        });
    });

    dropZone.addEventListener('drop', function(event) {
        const file = event.dataTransfer.files && event.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    });

    qualityInput.addEventListener('input', updateQualityLabel);
    outputFormat.addEventListener('change', function() {
        resetOutput();
        updateQualityState();
    });
    convertBtn.addEventListener('click', convertImage);
    downloadBtn.addEventListener('click', downloadResult);
    resetBtn.addEventListener('click', resetAll);
    updateQualityState();
});
