document.addEventListener('DOMContentLoaded', function() {
    const title = document.getElementById('meta-title');
    const url = document.getElementById('meta-url');
    const image = document.getElementById('meta-image');
    const description = document.getElementById('meta-description');
    const output = document.getElementById('meta-output');
    const message = document.getElementById('meta-message');

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function line(tag, value) {
        return value ? tag(value) : '';
    }

    function generate() {
        const pageTitle = title.value.trim();
        const pageUrl = url.value.trim();
        const pageImage = image.value.trim();
        const pageDescription = description.value.trim();

        if (!pageTitle || !pageDescription) {
            setMessage('错误：标题和描述不能为空。', 'error');
            return;
        }

        const lines = [
            `<title>${escapeHtml(pageTitle)}</title>`,
            `<meta name="description" content="${escapeHtml(pageDescription)}">`,
            line((value) => `<link rel="canonical" href="${escapeHtml(value)}">`, pageUrl),
            '<meta property="og:type" content="website">',
            `<meta property="og:title" content="${escapeHtml(pageTitle)}">`,
            `<meta property="og:description" content="${escapeHtml(pageDescription)}">`,
            line((value) => `<meta property="og:url" content="${escapeHtml(value)}">`, pageUrl),
            line((value) => `<meta property="og:image" content="${escapeHtml(value)}">`, pageImage),
            '<meta name="twitter:card" content="summary_large_image">',
            `<meta name="twitter:title" content="${escapeHtml(pageTitle)}">`,
            `<meta name="twitter:description" content="${escapeHtml(pageDescription)}">`,
            line((value) => `<meta name="twitter:image" content="${escapeHtml(value)}">`, pageImage)
        ].filter(Boolean);

        output.value = lines.join('\n');
        setMessage(`已生成 ${lines.length} 行 Meta 标签。`, 'success');
    }

    document.getElementById('meta-generate-btn').addEventListener('click', generate);
    document.getElementById('meta-sample-btn').addEventListener('click', () => {
        title.value = 'JavaPub Tools - 开发者在线工具箱';
        url.value = 'https://rodert.github.io/jsonformat/';
        image.value = 'https://rodert.github.io/jsonformat/img/image.png';
        description.value = 'JSON格式化、编码加密、开发调试和文本处理工具，数据仅在浏览器本地处理。';
        output.value = '';
        setMessage('已载入示例。', 'success');
    });
    document.getElementById('meta-clear-btn').addEventListener('click', () => {
        title.value = '';
        url.value = '';
        image.value = '';
        description.value = '';
        output.value = '';
        setMessage('等待输入页面信息。', '');
    });
    document.getElementById('meta-copy-btn').addEventListener('click', () => {
        if (!output.value) {
            setMessage('没有可复制的内容。', 'error');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => setMessage('结果已复制。', 'success'));
    });
});
