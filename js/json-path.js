document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('json-path-input');
    const expression = document.getElementById('json-path-expression');
    const results = document.getElementById('json-path-results');
    const message = document.getElementById('json-path-message');
    const count = document.getElementById('json-path-count');
    let latestMatches = [];

    const sample = {
        users: [
            {
                id: 1,
                name: 'Tom',
                age: 28,
                email: 'tom@example.com',
                roles: ['admin', 'editor'],
                active: true
            },
            {
                id: 2,
                name: 'Lucy',
                age: 17,
                email: 'lucy@example.com',
                roles: ['viewer'],
                active: false
            },
            {
                id: 3,
                name: 'Ming',
                age: 32,
                email: 'ming@example.com',
                roles: ['developer', 'ops'],
                active: true
            }
        ],
        meta: {
            page: 1,
            total: 3,
            traceId: 'jp-20260612'
        }
    };

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function formatValue(value) {
        return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    }

    function displayResults(matches) {
        latestMatches = matches;
        count.textContent = `${matches.length} 个匹配`;
        if (matches.length === 0) {
            results.innerHTML = '<div class="path-empty">没有匹配结果。</div>';
            return;
        }

        results.innerHTML = matches.map((match, index) => `
            <section class="path-result-item">
                <div class="path-result-meta">
                    <strong>#${index + 1}</strong>
                    <code>${escapeHtml(match.path)}</code>
                </div>
                <pre><code>${escapeHtml(formatValue(match.value))}</code></pre>
            </section>
        `).join('');
    }

    function parseJson() {
        const raw = input.value.trim();
        if (!raw) {
            throw new Error('请输入 JSON 数据');
        }
        return JSON.parse(raw);
    }

    function readName(source, start) {
        let end = start;
        while (end < source.length && /[A-Za-z0-9_$-]/.test(source[end])) {
            end += 1;
        }
        return {
            value: source.slice(start, end),
            next: end
        };
    }

    function findClosingBracket(source, start) {
        let quote = '';
        for (let index = start + 1; index < source.length; index += 1) {
            const char = source[index];
            const previous = source[index - 1];
            if ((char === '"' || char === "'") && previous !== '\\') {
                quote = quote === char ? '' : char;
            }
            if (char === ']' && !quote) {
                return index;
            }
        }
        throw new Error('方括号没有闭合');
    }

    function parseFilterValue(raw) {
        const quoted = raw.match(/^(['"])(.*)\1$/);
        if (quoted) {
            return quoted[2];
        }
        if (raw === 'true') return true;
        if (raw === 'false') return false;
        if (raw === 'null') return null;
        if (/^-?\d+(?:\.\d+)?$/.test(raw)) return Number(raw);
        if (raw.startsWith('/') && raw.endsWith('/')) {
            return new RegExp(raw.slice(1, -1));
        }
        return raw;
    }

    function parseBracketToken(content) {
        if (content === '*') {
            return { type: 'wildcard' };
        }
        if (/^-?\d+$/.test(content)) {
            return { type: 'index', index: Number(content) };
        }

        const quoted = content.match(/^(['"])(.*)\1$/);
        if (quoted) {
            return { type: 'property', key: quoted[2].replace(/\\(['"])/g, '$1') };
        }

        const filter = content.match(/^\?\(@\.([A-Za-z0-9_$-]+)\s*(==|!=|>=|<=|>|<|=~)\s*(.+)\)$/);
        if (filter) {
            return {
                type: 'filter',
                key: filter[1],
                operator: filter[2],
                expected: parseFilterValue(filter[3].trim())
            };
        }

        throw new Error(`不支持的方括号表达式：[${content}]`);
    }

    function parsePath(path) {
        const source = path.trim();
        const tokens = [];
        let index = 0;

        if (!source.startsWith('$')) {
            throw new Error('JSON Path 必须以 $ 开头');
        }
        tokens.push({ type: 'root' });
        index = 1;

        while (index < source.length) {
            const char = source[index];

            if (char === '.') {
                if (source[index + 1] === '.') {
                    index += 2;
                    const name = readName(source, index);
                    if (!name.value) {
                        throw new Error('递归查找需要字段名，例如 $..name');
                    }
                    tokens.push({ type: 'recursive', key: name.value });
                    index = name.next;
                    continue;
                }

                index += 1;
                if (source[index] === '*') {
                    tokens.push({ type: 'wildcard' });
                    index += 1;
                    continue;
                }

                const name = readName(source, index);
                if (!name.value) {
                    throw new Error('点号后需要字段名');
                }
                tokens.push({ type: 'property', key: name.value });
                index = name.next;
                continue;
            }

            if (char === '[') {
                const close = findClosingBracket(source, index);
                const content = source.slice(index + 1, close).trim();
                tokens.push(parseBracketToken(content));
                index = close + 1;
                continue;
            }

            throw new Error(`无法解析路径位置 ${index + 1}：${char}`);
        }

        return tokens;
    }

    function toPath(parent, key) {
        if (typeof key === 'number') {
            return `${parent}[${key}]`;
        }
        return /^[A-Za-z_$][A-Za-z0-9_$-]*$/.test(key)
            ? `${parent}.${key}`
            : `${parent}[${JSON.stringify(key)}]`;
    }

    function getChildren(node) {
        if (Array.isArray(node.value)) {
            return node.value.map((value, index) => ({
                value,
                path: toPath(node.path, index)
            }));
        }
        if (node.value && typeof node.value === 'object') {
            return Object.entries(node.value).map(([key, value]) => ({
                value,
                path: toPath(node.path, key)
            }));
        }
        return [];
    }

    function findRecursive(node, key) {
        const matches = [];
        const visit = (current) => {
            if (current.value && typeof current.value === 'object') {
                if (Object.prototype.hasOwnProperty.call(current.value, key)) {
                    matches.push({
                        value: current.value[key],
                        path: toPath(current.path, key)
                    });
                }
                getChildren(current).forEach(visit);
            }
        };
        visit(node);
        return matches;
    }

    function matchFilter(value, token) {
        if (!value || typeof value !== 'object') {
            return false;
        }
        const actual = value[token.key];
        const expected = token.expected;

        switch (token.operator) {
            case '==':
                return actual === expected;
            case '!=':
                return actual !== expected;
            case '>':
                return Number(actual) > Number(expected);
            case '>=':
                return Number(actual) >= Number(expected);
            case '<':
                return Number(actual) < Number(expected);
            case '<=':
                return Number(actual) <= Number(expected);
            case '=~':
                return expected instanceof RegExp && expected.test(String(actual));
            default:
                return false;
        }
    }

    function applyToken(nodes, token) {
        if (token.type === 'root') {
            return nodes;
        }

        if (token.type === 'property') {
            return nodes.flatMap((node) => {
                if (node.value && typeof node.value === 'object' && Object.prototype.hasOwnProperty.call(node.value, token.key)) {
                    return [{ value: node.value[token.key], path: toPath(node.path, token.key) }];
                }
                return [];
            });
        }

        if (token.type === 'index') {
            return nodes.flatMap((node) => {
                if (!Array.isArray(node.value)) {
                    return [];
                }
                const actualIndex = token.index < 0 ? node.value.length + token.index : token.index;
                if (actualIndex < 0 || actualIndex >= node.value.length) {
                    return [];
                }
                return [{ value: node.value[actualIndex], path: toPath(node.path, actualIndex) }];
            });
        }

        if (token.type === 'wildcard') {
            return nodes.flatMap(getChildren);
        }

        if (token.type === 'recursive') {
            return nodes.flatMap((node) => findRecursive(node, token.key));
        }

        if (token.type === 'filter') {
            return nodes.flatMap((node) => {
                const candidates = Array.isArray(node.value) ? getChildren(node) : [];
                return candidates.filter((child) => matchFilter(child.value, token));
            });
        }

        return [];
    }

    function queryJson(data, path) {
        const tokens = parsePath(path);
        return tokens.reduce(applyToken, [{ value: data, path: '$' }]);
    }

    function runQuery() {
        try {
            const data = parseJson();
            const path = expression.value.trim();
            if (!path) {
                throw new Error('请输入 JSON Path 表达式');
            }
            const matches = queryJson(data, path);
            displayResults(matches);
            setMessage(`查询完成：找到 ${matches.length} 个匹配。`, 'success');
        } catch (error) {
            displayResults([]);
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.getElementById('json-path-run-btn').addEventListener('click', runQuery);
    expression.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            runQuery();
        }
    });

    document.querySelectorAll('[data-path]').forEach((button) => {
        button.addEventListener('click', () => {
            expression.value = button.dataset.path;
            runQuery();
        });
    });

    document.getElementById('json-path-sample-btn').addEventListener('click', () => {
        input.value = JSON.stringify(sample, null, 2);
        expression.value = '$.users[?(@.age >= 18)].name';
        runQuery();
    });

    document.getElementById('json-path-format-btn').addEventListener('click', () => {
        try {
            input.value = JSON.stringify(parseJson(), null, 2);
            setMessage('JSON 已格式化。', 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    });

    document.getElementById('json-path-clear-btn').addEventListener('click', () => {
        input.value = '';
        expression.value = '$.users[*].name';
        displayResults([]);
        setMessage('等待输入 JSON 和路径表达式。', '');
    });

    document.getElementById('json-path-copy-btn').addEventListener('click', () => {
        if (latestMatches.length === 0) {
            setMessage('没有可复制的结果。', 'error');
            return;
        }
        const values = latestMatches.map((match) => match.value);
        const text = values.length === 1 ? formatValue(values[0]) : JSON.stringify(values, null, 2);
        navigator.clipboard.writeText(text).then(() => setMessage('结果已复制。', 'success'));
    });

    displayResults([]);
});
