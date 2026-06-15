document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('image-file');
    const dropZone = document.getElementById('image-drop-zone');
    const outputFormat = document.getElementById('image-output-format');
    const maxWidthInput = document.getElementById('image-max-width');
    const maxHeightInput = document.getElementById('image-max-height');
    const qualityInput = document.getElementById('image-quality');
    const qualityValue = document.getElementById('image-quality-value');
    const compressBtn = document.getElementById('image-compress-btn');
    const downloadBtn = document.getElementById('image-download-btn');
    const resetBtn = document.getElementById('image-reset-btn');
    const message = document.getElementById('image-compress-message');
    const originalPreview = document.getElementById('image-original-preview');
    const compressedPreview = document.getElementById('image-compressed-preview');
    const originalSize = document.getElementById('image-original-size');
    const outputSize = document.getElementById('image-output-size');
    const savedRatio = document.getElementById('image-saved-ratio');
    const outputDimension = document.getElementById('image-output-dimension');

    let sourceFile = null;
    let originalUrl = '';
    let compressedUrl = '';
    let compressedBlob = null;
    let compressedName = 'compressed-image.jpg';

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

    function revokeUrl(url) {
        if (url) {
            URL.revokeObjectURL(url);
        }
    }

    function resetOutput() {
        revokeUrl(compressedUrl);
        compressedUrl = '';
        compressedBlob = null;
        compressedName = 'compressed-image.jpg';
        outputSize.textContent = '-';
        savedRatio.textContent = '-';
        outputDimension.textContent = '-';
        compressedPreview.innerHTML = '<span>压缩后显示结果。</span>';
        downloadBtn.disabled = true;
    }

    function resetAll() {
        revokeUrl(originalUrl);
        originalUrl = '';
        sourceFile = null;
        fileInput.value = '';
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

    function calculateTargetSize(width, height) {
        const maxWidth = Number(maxWidthInput.value) || width;
        const maxHeight = Number(maxHeightInput.value) || height;
        const ratio = Math.min(1, maxWidth / width, maxHeight / height);

        return {
            width: Math.max(1, Math.round(width * ratio)),
            height: Math.max(1, Math.round(height * ratio))
        };
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
        return `${baseName}-compressed.${extensionForMime(mime)}`;
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
        originalSize.textContent = formatBytes(file.size);
        setPreview(originalPreview, originalUrl, '原图预览');
        setMessage(`已选择 ${file.name}，可以开始压缩。`, 'success');
    }

    async function compressImage() {
        if (!sourceFile) {
            setMessage('请先选择一张图片。', 'error');
            return;
        }

        compressBtn.disabled = true;
        setMessage('正在压缩图片...');

        try {
            const bitmap = await loadBitmap(sourceFile);
            const target = calculateTargetSize(bitmap.width, bitmap.height);
            const mime = outputFormat.value;
            const quality = Number(qualityInput.value) / 100;
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d', { alpha: mime !== 'image/jpeg' });

            canvas.width = target.width;
            canvas.height = target.height;

            if (mime === 'image/jpeg') {
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, canvas.width, canvas.height);
            }

            context.drawImage(bitmap, 0, 0, target.width, target.height);
            if (typeof bitmap.close === 'function') {
                bitmap.close();
            }

            const blob = await canvasToBlob(canvas, mime, mime === 'image/png' ? undefined : quality);
            revokeUrl(compressedUrl);
            compressedBlob = blob;
            compressedUrl = URL.createObjectURL(blob);
            compressedName = buildOutputName(sourceFile, mime);

            const saved = sourceFile.size > 0 ? (1 - blob.size / sourceFile.size) * 100 : 0;
            outputSize.textContent = formatBytes(blob.size);
            savedRatio.textContent = saved >= 0 ? `${saved.toFixed(1)}%` : `增大 ${Math.abs(saved).toFixed(1)}%`;
            outputDimension.textContent = `${target.width} x ${target.height}`;
            setPreview(compressedPreview, compressedUrl, '压缩图片预览');
            downloadBtn.disabled = false;
            setMessage('压缩完成，可以预览或下载结果。', 'success');
        } catch (error) {
            setMessage(error && error.message ? error.message : '图片压缩失败，请换一张图片重试。', 'error');
        } finally {
            compressBtn.disabled = false;
        }
    }

    function downloadResult() {
        if (!compressedBlob || !compressedUrl) {
            setMessage('还没有可下载的压缩结果。', 'error');
            return;
        }

        const link = document.createElement('a');
        link.href = compressedUrl;
        link.download = compressedName;
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
    compressBtn.addEventListener('click', compressImage);
    downloadBtn.addEventListener('click', downloadResult);
    resetBtn.addEventListener('click', resetAll);
    updateQualityLabel();
});
