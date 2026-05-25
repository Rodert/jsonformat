document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('url-parser-input');
    const autoProtocol = document.getElementById('url-parser-auto-protocol');
    const decodeValues = document.getElementById('url-parser-decode');
    const message = document.getElementById('url-parser-message');
    const queryJson = document.getElementById('url-query-json');
    const normalizedOutput = document.getElementById('url-normalized-output');
    const fields = {
        protocol: document.getElementById('url-protocol-result'),
        hostname: document.getElementById('url-hostname-result'),
        port: document.getElementById('url-port-result'),
        path: document.getElementById('url-path-result'),
        hash: document.getElementById('url-hash-result')
    };

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function resetResults() {
        Object.values(fields).forEach((field) => {
            field.textContent = '-';
        });
        queryJson.value = '';
        normalizedOutput.value = '';
    }

    function normalizeInput(text) {
        const trimmed = text.trim();
        if (!trimmed) {
            throw new Error('请输入要解析的 URL');
        }
        if (autoProtocol.checked && !/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
            return `https://${trimmed}`;
        }
        return trimmed;
    }

    function safeDecode(value) {
        if (!decodeValues.checked) {
            return value;
        }
        try {
            return decodeURIComponent(value.replace(/\+/g, ' '));
        } catch (error) {
            return value;
        }
    }

    function paramsToObject(search) {
        const raw = search.startsWith('?') ? search.slice(1) : search;
        const result = {};

        if (!raw) {
            return result;
        }

        for (const part of raw.split('&')) {
            if (!part) {
                continue;
            }
            const equalIndex = part.indexOf('=');
            const key = equalIndex === -1 ? part : part.slice(0, equalIndex);
            const value = equalIndex === -1 ? '' : part.slice(equalIndex + 1);
            const decodedKey = safeDecode(key);
            const decodedValue = safeDecode(value);
            if (Object.prototype.hasOwnProperty.call(result, decodedKey)) {
                if (!Array.isArray(result[decodedKey])) {
                    result[decodedKey] = [result[decodedKey]];
                }
                result[decodedKey].push(decodedValue);
            } else {
                result[decodedKey] = decodedValue;
            }
        }

        return result;
    }

    function parseUrl() {
        try {
            const url = new URL(normalizeInput(input.value));
            fields.protocol.textContent = url.protocol.replace(/:$/, '') || '-';
            fields.hostname.textContent = url.hostname || '-';
            fields.port.textContent = url.port || '(默认)';
            fields.path.textContent = safeDecode(url.pathname) || '/';
            fields.hash.textContent = url.hash ? safeDecode(url.hash.slice(1)) : '-';
            queryJson.value = JSON.stringify(paramsToObject(url.search), null, 2);
            normalizedOutput.value = url.href;
            setMessage('URL 解析完成。', 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    function copyText(text, emptyMessage) {
        if (!text) {
            setMessage(emptyMessage, 'error');
            return;
        }
        navigator.clipboard.writeText(text).then(() => setMessage('内容已复制。', 'success'));
    }

    document.getElementById('url-parser-run-btn').addEventListener('click', parseUrl);
    document.getElementById('url-parser-sample-btn').addEventListener('click', () => {
        input.value = 'https://user:pass@www.example.com:8443/api/list?page=1&tag=js&tag=tools&q=JavaPub%20Tools#readme';
        resetResults();
        setMessage('已载入示例。', 'success');
    });
    document.getElementById('url-parser-clear-btn').addEventListener('click', () => {
        input.value = '';
        resetResults();
        setMessage('等待输入 URL。', '');
    });
    document.getElementById('url-copy-json-btn').addEventListener('click', () => copyText(queryJson.value, '没有可复制的 JSON。'));
    document.getElementById('url-copy-normalized-btn').addEventListener('click', () => copyText(normalizedOutput.value, '没有可复制的 URL。'));
});
