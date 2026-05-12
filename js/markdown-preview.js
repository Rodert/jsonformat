document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('markdown-input');
    const preview = document.getElementById('markdown-preview');
    const message = document.getElementById('markdown-message');
    let lastHtml = '';

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function inline(text) {
        return escapeHtml(text)
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    }

    function renderTable(lines) {
        const headers = lines[0].split('|').filter(Boolean).map(cell => `<th>${inline(cell.trim())}</th>`).join('');
        const body = lines.slice(2).map(line => {
            return `<tr>${line.split('|').filter(Boolean).map(cell => `<td>${inline(cell.trim())}</td>`).join('')}</tr>`;
        }).join('');
        return `<table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table>`;
    }

    function markdownToHtml(markdown) {
        const lines = markdown.split(/\r?\n/);
        const html = [];
        let inCode = false;
        let codeLines = [];
        let listOpen = false;
        let quoteOpen = false;
        let tableBuffer = [];

        function closeBlocks() {
            if (listOpen) {
                html.push('</ul>');
                listOpen = false;
            }
            if (quoteOpen) {
                html.push('</blockquote>');
                quoteOpen = false;
            }
            if (tableBuffer.length) {
                html.push(renderTable(tableBuffer));
                tableBuffer = [];
            }
        }

        lines.forEach(line => {
            if (line.startsWith('```')) {
                if (inCode) {
                    html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
                    codeLines = [];
                    inCode = false;
                } else {
                    closeBlocks();
                    inCode = true;
                }
                return;
            }
            if (inCode) {
                codeLines.push(line);
                return;
            }

            if (line.includes('|') && /^\s*\|?(.+\|)+.+\|?\s*$/.test(line)) {
                tableBuffer.push(line);
                return;
            }

            closeBlocks();
            if (!line.trim()) return;

            const heading = /^(#{1,6})\s+(.+)$/.exec(line);
            if (heading) {
                const level = heading[1].length;
                html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
                return;
            }

            const list = /^\s*[-*+]\s+(.+)$/.exec(line);
            if (list) {
                if (!listOpen) {
                    html.push('<ul>');
                    listOpen = true;
                }
                html.push(`<li>${inline(list[1])}</li>`);
                return;
            }

            const quote = /^>\s?(.+)$/.exec(line);
            if (quote) {
                if (!quoteOpen) {
                    html.push('<blockquote>');
                    quoteOpen = true;
                }
                html.push(`<p>${inline(quote[1])}</p>`);
                return;
            }

            html.push(`<p>${inline(line)}</p>`);
        });

        if (inCode) {
            html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        }
        if (listOpen) html.push('</ul>');
        if (quoteOpen) html.push('</blockquote>');
        if (tableBuffer.length) html.push(renderTable(tableBuffer));
        return html.join('\n');
    }

    function render() {
        lastHtml = markdownToHtml(input.value);
        preview.innerHTML = lastHtml || '<p class="muted">预览区域</p>';
        setMessage(input.value ? '预览已更新。' : '输入 Markdown 后自动预览。', input.value ? 'success' : '');
    }

    document.getElementById('sample-md-btn').addEventListener('click', () => {
        input.value = '# JavaPub Tools\n\n**开发者在线工具箱**，打开即用。\n\n- JSON格式化\n- 时间戳转换\n- Markdown预览\n\n> 数据仅在浏览器本地处理。\n\n```js\nconsole.log("hello tools");\n```\n\n| 工具 | 状态 |\n| --- | --- |\n| Markdown | 可用 |';
        render();
    });
    document.getElementById('copy-md-html-btn').addEventListener('click', () => {
        if (!lastHtml) {
            setMessage('没有可复制的 HTML。', 'error');
            return;
        }
        navigator.clipboard.writeText(lastHtml).then(() => setMessage('HTML 已复制。', 'success'));
    });
    document.getElementById('clear-md-btn').addEventListener('click', () => {
        input.value = '';
        render();
    });
    input.addEventListener('input', render);
    render();
});
