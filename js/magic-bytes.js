document.addEventListener('DOMContentLoaded', function() {
    const search = document.getElementById('magic-search');
    const output = document.getElementById('magic-output');
    const message = document.getElementById('magic-message');
    const rows = [
        ['PNG', '.png', '89 50 4E 47 0D 0A 1A 0A', 'PNG 图片'],
        ['JPEG', '.jpg .jpeg', 'FF D8 FF', 'JPEG 图片'],
        ['GIF87a', '.gif', '47 49 46 38 37 61', 'GIF 图片'],
        ['GIF89a', '.gif', '47 49 46 38 39 61', 'GIF 图片'],
        ['PDF', '.pdf', '25 50 44 46', 'PDF 文档'],
        ['ZIP', '.zip .docx .xlsx .pptx .jar', '50 4B 03 04', 'ZIP 容器'],
        ['RAR', '.rar', '52 61 72 21 1A 07', 'RAR 压缩包'],
        ['7Z', '.7z', '37 7A BC AF 27 1C', '7-Zip 压缩包'],
        ['GZIP', '.gz', '1F 8B', 'Gzip 压缩包'],
        ['TAR', '.tar', '75 73 74 61 72', 'TAR ustar 标记，通常在偏移 257'],
        ['WEBP', '.webp', '52 49 46 46 ?? ?? ?? ?? 57 45 42 50', 'WebP 图片'],
        ['BMP', '.bmp', '42 4D', 'BMP 图片'],
        ['ICO', '.ico', '00 00 01 00', 'Windows 图标'],
        ['MP3 ID3', '.mp3', '49 44 33', 'MP3 ID3 标签'],
        ['MP4', '.mp4', '66 74 79 70', 'MP4 ftyp 标记，通常在偏移 4'],
        ['WAV', '.wav', '52 49 46 46 ?? ?? ?? ?? 57 41 56 45', 'WAV 音频'],
        ['ELF', '', '7F 45 4C 46', 'Linux 可执行文件'],
        ['EXE/DLL', '.exe .dll', '4D 5A', 'Windows PE 文件'],
        ['WASM', '.wasm', '00 61 73 6D', 'WebAssembly 模块'],
        ['SQLite', '.sqlite .db', '53 51 4C 69 74 65 20 66 6F 72 6D 61 74 20 33 00', 'SQLite 数据库']
    ];

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function render() {
        const keyword = search.value.trim().toLowerCase();
        const matched = rows.filter((row) => !keyword || row.join(' ').toLowerCase().includes(keyword));
        output.value = matched.map(([name, ext, magic, desc]) => `${name.padEnd(10)} ${ext.padEnd(28)} ${magic}\n说明：${desc}`).join('\n\n');
        setMessage(`找到 ${matched.length} 条文件头记录。`, matched.length ? 'success' : 'error');
    }

    search.addEventListener('input', render);
    document.getElementById('magic-clear-btn').addEventListener('click', () => {
        search.value = '';
        render();
    });
    render();
});
