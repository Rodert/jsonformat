document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('html-strip-input');
    const output = document.getElementById('html-strip-output');
    const message = document.getElementById('html-strip-message');
    const keepLinebreaks = document.getElementById('strip-keep-linebreaks');
    const collapseSpace = document.getElementById('strip-collapse-space');

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function requireInput() {
        if (!input.value.trim()) {
            throw new Error('请输入 HTML 内容');
        }
        return input.value;
    }

    function stripHtml() {
        const html = requireInput();
        const normalized = keepLinebreaks.checked
            ? html
                .replace(/<(br|hr)\s*\/?>/gi, '\n')
                .replace(/<\/(p|div|li|tr|h[1-6]|section|article|header|footer)>/gi, '\n')
            : html;
        const template = document.createElement('template');
        template.innerHTML = normalized;
        let text = template.content.textContent || '';

        if (collapseSpace.checked) {
            text = text
                .replace(/[ \t\f\v]+/g, ' ')
                .replace(/\n\s+/g, '\n')
                .replace(/\n{3,}/g, '\n\n');
        }

        return text.trim();
    }

    function extractLinks() {
        const template = document.createElement('template');
        template.innerHTML = requireInput();
        const links = Array.from(template.content.querySelectorAll('a[href]')).map((link) => {
            const text = (link.textContent || '').trim();
            const href = link.getAttribute('href');
            return text ? `${text}\t${href}` : href;
        });
        return links.join('\n');
    }

    function run(transform, success) {
        try {
            output.value = transform();
            setMessage(success, 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.getElementById('strip-html-btn').addEventListener('click', () => run(stripHtml, 'HTML 已转为纯文本。'));
    document.getElementById('extract-links-btn').addEventListener('click', () => run(extractLinks, '链接提取完成。'));
    document.getElementById('html-strip-sample-btn').addEventListener('click', () => {
        input.value = '<article><h1>JavaPub Tools</h1><p>开发者在线工具箱。</p><a href="https://rodert.github.io/jsonformat/">访问首页</a></article>';
        output.value = '';
        setMessage('已载入示例。', 'success');
    });
    document.getElementById('html-strip-clear-btn').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        setMessage('等待输入 HTML。', '');
    });
    document.getElementById('html-strip-copy-btn').addEventListener('click', () => {
        if (!output.value) {
            setMessage('没有可复制的内容。', 'error');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => setMessage('结果已复制。', 'success'));
    });
    document.getElementById('html-strip-swap-btn').addEventListener('click', () => {
        if (output.value) {
            input.value = output.value;
            output.value = '';
            setMessage('结果已放回输入框。', 'success');
        }
    });
});
