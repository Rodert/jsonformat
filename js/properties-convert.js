document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('properties-input');
    const output = document.getElementById('properties-output');
    const message = document.getElementById('properties-message');
    const nested = document.getElementById('properties-nested');
    const coerce = document.getElementById('properties-coerce');

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function requireInput() {
        if (!input.value.trim()) {
            throw new Error('请输入 properties 配置');
        }
        return input.value;
    }

    function joinContinuations(text) {
        const lines = text.replace(/\r/g, '').split('\n');
        const result = [];
        let current = '';

        lines.forEach((line) => {
            if (current) {
                current += line;
            } else {
                current = line;
            }

            if (/\\$/.test(current) && !/\\\\$/.test(current)) {
                current = current.slice(0, -1);
            } else {
                result.push(current);
                current = '';
            }
        });

        if (current) {
            result.push(current);
        }
        return result;
    }

    function unescapeValue(value) {
        return value
            .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
            .replace(/\\t/g, '\t')
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\f/g, '\f')
            .replace(/\\([:=#!\\ ])/g, '$1');
    }

    function splitLine(line) {
        let escaped = false;
        for (let i = 0; i < line.length; i += 1) {
            const char = line[i];
            if (escaped) {
                escaped = false;
                continue;
            }
            if (char === '\\') {
                escaped = true;
                continue;
            }
            if (char === '=' || char === ':' || /\s/.test(char)) {
                return [line.slice(0, i), line.slice(i + 1).replace(/^\s*[=:]?\s*/, '')];
            }
        }
        return [line, ''];
    }

    function castValue(value) {
        if (!coerce.checked) {
            return value;
        }
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (value === 'null') return null;
        if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
        return value;
    }

    function assign(result, key, value) {
        const parts = nested.checked ? key.split('.').filter(Boolean) : [key];
        let cursor = result;

        parts.slice(0, -1).forEach((part) => {
            if (!cursor[part] || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) {
                cursor[part] = {};
            }
            cursor = cursor[part];
        });

        cursor[parts[parts.length - 1]] = value;
    }

    function parseProperties() {
        const result = {};

        joinContinuations(requireInput()).forEach((rawLine) => {
            const line = rawLine.trim();
            if (!line || line.startsWith('#') || line.startsWith('!')) {
                return;
            }

            const [rawKey, rawValue] = splitLine(rawLine.trim());
            const key = unescapeValue(rawKey.trim());
            const value = castValue(unescapeValue(rawValue.trim()));
            assign(result, key, value);
        });

        return result;
    }

    function yamlScalar(value) {
        if (value === null) return 'null';
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        if (value === '') return '""';
        if (/[:#\-\[\]{},&*!|>'"%@`\s]/.test(String(value))) {
            return JSON.stringify(String(value));
        }
        return String(value);
    }

    function toYaml(value, level = 0) {
        const indent = '  '.repeat(level);
        return Object.entries(value).map(([key, child]) => {
            const safeKey = /^[A-Za-z0-9_.-]+$/.test(key) ? key : JSON.stringify(key);
            if (child && typeof child === 'object' && !Array.isArray(child)) {
                return `${indent}${safeKey}:\n${toYaml(child, level + 1)}`;
            }
            return `${indent}${safeKey}: ${yamlScalar(child)}`;
        }).join('\n');
    }

    function run(format) {
        try {
            const value = parseProperties();
            output.value = format === 'json'
                ? JSON.stringify(value, null, 2)
                : `${toYaml(value)}\n`;
            setMessage(format === 'json' ? 'Properties 转 JSON 完成。' : 'Properties 转 YAML 完成。', 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.getElementById('properties-json-btn').addEventListener('click', () => run('json'));
    document.getElementById('properties-yaml-btn').addEventListener('click', () => run('yaml'));
    document.getElementById('properties-sample-btn').addEventListener('click', () => {
        input.value = 'server.port=8080\nspring.application.name=javapub-tools\nspring.datasource.enabled=true\nspring.datasource.url=jdbc:mysql://localhost:3306/demo';
        output.value = '';
        setMessage('已载入示例。', 'success');
    });
    document.getElementById('properties-clear-btn').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        setMessage('等待输入配置。', '');
    });
    document.getElementById('properties-copy-btn').addEventListener('click', () => {
        if (!output.value) {
            setMessage('没有可复制的内容。', 'error');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => setMessage('结果已复制。', 'success'));
    });
});
