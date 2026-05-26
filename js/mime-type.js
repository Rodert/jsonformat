document.addEventListener('DOMContentLoaded', function() {
    const search = document.getElementById('mime-search');
    const output = document.getElementById('mime-output');
    const message = document.getElementById('mime-message');
    const rows = [
        ['.json', 'application/json', 'JSON 数据'],
        ['.jsonl', 'application/x-ndjson', 'NDJSON / JSON Lines'],
        ['.xml', 'application/xml', 'XML 文档'],
        ['.html .htm', 'text/html', 'HTML 页面'],
        ['.css', 'text/css', 'CSS 样式'],
        ['.js .mjs', 'text/javascript', 'JavaScript'],
        ['.txt', 'text/plain', '纯文本'],
        ['.csv', 'text/csv', 'CSV 表格'],
        ['.md', 'text/markdown', 'Markdown 文档'],
        ['.pdf', 'application/pdf', 'PDF 文档'],
        ['.zip', 'application/zip', 'ZIP 压缩包'],
        ['.gz', 'application/gzip', 'Gzip 压缩包'],
        ['.tar', 'application/x-tar', 'TAR 压缩包'],
        ['.7z', 'application/x-7z-compressed', '7-Zip 压缩包'],
        ['.png', 'image/png', 'PNG 图片'],
        ['.jpg .jpeg', 'image/jpeg', 'JPEG 图片'],
        ['.gif', 'image/gif', 'GIF 图片'],
        ['.webp', 'image/webp', 'WebP 图片'],
        ['.svg', 'image/svg+xml', 'SVG 图片'],
        ['.ico', 'image/x-icon', 'Icon 图标'],
        ['.avif', 'image/avif', 'AVIF 图片'],
        ['.mp3', 'audio/mpeg', 'MP3 音频'],
        ['.wav', 'audio/wav', 'WAV 音频'],
        ['.mp4', 'video/mp4', 'MP4 视频'],
        ['.webm', 'video/webm', 'WebM 视频'],
        ['.ttf', 'font/ttf', 'TrueType 字体'],
        ['.otf', 'font/otf', 'OpenType 字体'],
        ['.woff', 'font/woff', 'WOFF 字体'],
        ['.woff2', 'font/woff2', 'WOFF2 字体'],
        ['.wasm', 'application/wasm', 'WebAssembly'],
        ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Word 文档'],
        ['.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Excel 表格'],
        ['.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'PowerPoint 文档']
    ];

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function render() {
        const keyword = search.value.trim().toLowerCase();
        const matched = rows.filter((row) => !keyword || row.join(' ').toLowerCase().includes(keyword));
        output.value = matched.map(([ext, type, desc]) => `${ext.padEnd(14)} ${type.padEnd(85)} ${desc}`).join('\n');
        setMessage(`找到 ${matched.length} 条 MIME Type。`, matched.length ? 'success' : 'error');
    }

    search.addEventListener('input', render);
    document.getElementById('mime-clear-btn').addEventListener('click', () => {
        search.value = '';
        render();
    });
    render();
});
