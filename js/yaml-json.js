document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('yaml-json-input');
    const output = document.getElementById('yaml-json-output');
    const message = document.getElementById('yaml-json-message');
    let lastJson = '';

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function parseScalar(value) {
        const text = value.trim();
        if (text === '') return '';
        if (text === 'null' || text === '~') return null;
        if (text === 'true') return true;
        if (text === 'false') return false;
        if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
        if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
            return text.slice(1, -1);
        }
        if (text.startsWith('[') || text.startsWith('{')) {
            try {
                return JSON.parse(text.replace(/'/g, '"'));
            } catch (error) {
                return text;
            }
        }
        return text;
    }

    function setValue(parent, key, value) {
        if (Array.isArray(parent)) {
            parent.push(value);
        } else {
            parent[key] = value;
        }
    }

    function parseYaml(yaml) {
        const lines = yaml.split(/\r?\n/)
            .map(line => line.replace(/\t/g, '  '))
            .filter(line => line.trim() && !line.trim().startsWith('#'));
        const root = {};
        const stack = [{ indent: -1, value: root }];

        lines.forEach((line, index) => {
            const indent = line.match(/^ */)[0].length;
            const trimmed = line.trim();
            while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
                stack.pop();
            }
            const parent = stack[stack.length - 1].value;

            if (trimmed.startsWith('- ')) {
                if (!Array.isArray(parent)) {
                    throw new Error(`第 ${index + 1} 行数组项缺少数组父级`);
                }
                const content = trimmed.slice(2).trim();
                if (!content) {
                    const child = {};
                    parent.push(child);
                    stack.push({ indent, value: child });
                } else if (content.includes(':')) {
                    const [key, ...rest] = content.split(':');
                    const child = {};
                    parent.push(child);
                    const value = rest.join(':').trim();
                    child[key.trim()] = value ? parseScalar(value) : {};
                    if (!value) stack.push({ indent, value: child[key.trim()] });
                } else {
                    parent.push(parseScalar(content));
                }
                return;
            }

            const separator = trimmed.indexOf(':');
            if (separator === -1) {
                throw new Error(`第 ${index + 1} 行缺少冒号`);
            }
            const key = trimmed.slice(0, separator).trim();
            const valueText = trimmed.slice(separator + 1).trim();
            if (!key) {
                throw new Error(`第 ${index + 1} 行键名为空`);
            }

            if (valueText) {
                setValue(parent, key, parseScalar(valueText));
            } else {
                const nextLine = lines[index + 1] || '';
                const nextTrimmed = nextLine.trim();
                const child = nextTrimmed.startsWith('- ') ? [] : {};
                setValue(parent, key, child);
                stack.push({ indent, value: child });
            }
        });

        return root;
    }

    function renderJson(value) {
        lastJson = JSON.stringify(value, null, 2);
        output.textContent = lastJson;
        if (typeof hljs !== 'undefined') {
            output.removeAttribute('data-highlighted');
            hljs.highlightElement(output);
        }
    }

    function convert() {
        try {
            if (!input.value.trim()) throw new Error('请输入 YAML 内容');
            renderJson(parseYaml(input.value));
            setMessage('YAML 已转换为 JSON。', 'success');
        } catch (error) {
            lastJson = '';
            output.textContent = '';
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.getElementById('yaml-json-convert-btn').addEventListener('click', convert);
    document.getElementById('yaml-json-sample-btn').addEventListener('click', () => {
        input.value = 'name: JavaPub Tools\nversion: 1\nlocalOnly: true\nfeatures:\n  - JSON格式化\n  - YAML转JSON\nowner:\n  name: JavaPub\n  site: docs.chongplus.plus';
        convert();
    });
    document.getElementById('yaml-json-clear-btn').addEventListener('click', () => {
        input.value = '';
        output.textContent = '';
        lastJson = '';
        setMessage('等待输入 YAML。', '');
    });
    document.getElementById('yaml-json-copy-btn').addEventListener('click', () => {
        if (!lastJson) {
            setMessage('没有可复制的 JSON。', 'error');
            return;
        }
        navigator.clipboard.writeText(lastJson).then(() => setMessage('JSON 已复制。', 'success'));
    });
});
