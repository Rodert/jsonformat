document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('query-input');
    const output = document.getElementById('query-output');
    const message = document.getElementById('query-message');
    const arrayFormat = document.getElementById('query-array-format');
    const leadingQuestion = document.getElementById('query-leading-question');

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function requireInput() {
        if (!input.value.trim()) {
            throw new Error('请输入要转换的内容');
        }
        return input.value.trim();
    }

    function addPair(pairs, key, value) {
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value == null ? '' : String(value))}`);
    }

    function flatten(value, prefix, pairs) {
        if (Array.isArray(value)) {
            if (arrayFormat.value === 'comma') {
                addPair(pairs, prefix, value.join(','));
                return;
            }
            value.forEach((item) => {
                flatten(item, arrayFormat.value === 'brackets' ? `${prefix}[]` : prefix, pairs);
            });
            return;
        }

        if (value && typeof value === 'object') {
            Object.entries(value).forEach(([key, child]) => {
                flatten(child, prefix ? `${prefix}.${key}` : key, pairs);
            });
            return;
        }

        addPair(pairs, prefix, value);
    }

    function jsonToQuery() {
        const value = JSON.parse(requireInput());
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            throw new Error('JSON 根节点必须是对象');
        }

        const pairs = [];
        Object.entries(value).forEach(([key, child]) => flatten(child, key, pairs));
        return `${leadingQuestion.checked ? '?' : ''}${pairs.join('&')}`;
    }

    function coerceValue(value) {
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (value === 'null') return null;
        if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
        return value;
    }

    function setNested(result, rawKey, value) {
        const isArrayKey = rawKey.endsWith('[]');
        const key = isArrayKey ? rawKey.slice(0, -2) : rawKey;
        const parts = key.split('.').filter(Boolean);
        let cursor = result;

        parts.slice(0, -1).forEach((part) => {
            if (!cursor[part] || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) {
                cursor[part] = {};
            }
            cursor = cursor[part];
        });

        const last = parts[parts.length - 1];
        const finalValue = coerceValue(value);
        if (isArrayKey || Object.prototype.hasOwnProperty.call(cursor, last)) {
            if (!Array.isArray(cursor[last])) {
                cursor[last] = cursor[last] === undefined ? [] : [cursor[last]];
            }
            cursor[last].push(finalValue);
        } else {
            cursor[last] = finalValue;
        }
    }

    function queryToJson() {
        const raw = requireInput().replace(/^[^?]*\?/, '').replace(/^#?/, '');
        const result = {};

        raw.split('&').filter(Boolean).forEach((part) => {
            const equalIndex = part.indexOf('=');
            const rawKey = equalIndex === -1 ? part : part.slice(0, equalIndex);
            const rawValue = equalIndex === -1 ? '' : part.slice(equalIndex + 1);
            const key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
            const value = decodeURIComponent(rawValue.replace(/\+/g, ' '));
            setNested(result, key, value);
        });

        return JSON.stringify(result, null, 2);
    }

    function run(transform, success) {
        try {
            output.value = transform();
            setMessage(success, 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.getElementById('json-to-query-btn').addEventListener('click', () => run(jsonToQuery, 'JSON 转 Query 完成。'));
    document.getElementById('query-to-json-btn').addEventListener('click', () => run(queryToJson, 'Query 转 JSON 完成。'));
    document.getElementById('query-sample-btn').addEventListener('click', () => {
        input.value = JSON.stringify({ page: 1, tag: ['js', 'tools'], user: { name: 'JavaPub' } }, null, 2);
        output.value = '';
        setMessage('已载入示例。', 'success');
    });
    document.getElementById('query-clear-btn').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        setMessage('等待输入内容。', '');
    });
    document.getElementById('query-copy-btn').addEventListener('click', () => {
        if (!output.value) {
            setMessage('没有可复制的内容。', 'error');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => setMessage('结果已复制。', 'success'));
    });
    document.getElementById('query-swap-btn').addEventListener('click', () => {
        if (output.value) {
            input.value = output.value;
            output.value = '';
            setMessage('结果已放回输入框。', 'success');
        }
    });
});
