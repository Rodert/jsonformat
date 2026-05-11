// JSON格式化工具脚本
document.addEventListener('DOMContentLoaded', function() {
    const jsonInput = document.getElementById('json-input');
    const jsonOutput = document.getElementById('json-output');
    const outputPre = document.getElementById('output-pre');
    const outputMode = document.getElementById('output-mode');
    const formatBtn = document.getElementById('format-btn');
    const compressBtn = document.getElementById('compress-btn');
    const validateBtn = document.getElementById('validate-btn');
    const escapeBtn = document.getElementById('escape-btn');
    const unescapeBtn = document.getElementById('unescape-btn');
    const clearBtn = document.getElementById('clear-btn');
    const sampleBtn = document.getElementById('sample-btn');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const message = document.getElementById('json-message');
    const inputStats = document.getElementById('input-stats');
    const statSize = document.getElementById('stat-size');
    const statLines = document.getElementById('stat-lines');
    const statDepth = document.getElementById('stat-depth');
    const statKeys = document.getElementById('stat-keys');

    if (!jsonInput || !jsonOutput) {
        return;
    }

    let lastJson = null;
    let lastOutput = '';

    function parseInput() {
        const inputText = jsonInput.value.trim();
        if (!inputText) {
            throw new Error('请输入JSON数据');
        }
        return JSON.parse(inputText);
    }

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function setOutput(text, language) {
        lastOutput = text;
        jsonOutput.textContent = text;
        jsonOutput.className = language || 'json';

        if (typeof hljs !== 'undefined') {
            jsonOutput.removeAttribute('data-highlighted');
            hljs.highlightElement(jsonOutput);
        }
    }

    function formatBytes(bytes) {
        if (bytes < 1024) {
            return `${bytes} B`;
        }
        return `${(bytes / 1024).toFixed(2)} KB`;
    }

    function getByteSize(text) {
        return new Blob([text]).size;
    }

    function getDepth(value) {
        if (value === null || typeof value !== 'object') {
            return 0;
        }
        const children = Array.isArray(value) ? value : Object.values(value);
        if (children.length === 0) {
            return 1;
        }
        return 1 + Math.max(...children.map(getDepth));
    }

    function countKeys(value) {
        if (value === null || typeof value !== 'object') {
            return 0;
        }
        if (Array.isArray(value)) {
            return value.reduce((sum, item) => sum + countKeys(item), 0);
        }
        return Object.keys(value).length + Object.values(value).reduce((sum, item) => sum + countKeys(item), 0);
    }

    function updateStats(value, sourceText) {
        inputStats.textContent = `${jsonInput.value.length} 字符`;
        statSize.textContent = `大小：${formatBytes(getByteSize(sourceText || jsonInput.value))}`;
        statLines.textContent = `行数：${jsonInput.value ? jsonInput.value.split('\n').length : 0}`;
        statDepth.textContent = `层级：${value ? getDepth(value) : 0}`;
        statKeys.textContent = `键数：${value ? countKeys(value) : 0}`;
    }

    function locateJsonError(error, source) {
        const match = /position\s+(\d+)/i.exec(error.message);
        if (!match) {
            return error.message;
        }

        const position = Number(match[1]);
        const before = source.slice(0, position);
        const line = before.split('\n').length;
        const column = before.length - before.lastIndexOf('\n');
        return `${error.message}（第 ${line} 行，第 ${column} 列）`;
    }

    function renderCurrent(mode) {
        if (lastJson === null) {
            return;
        }

        switch (mode) {
            case 'tree':
                setOutput(jsonToTree(lastJson), 'plaintext');
                break;
            case 'yaml':
                setOutput(jsonToYaml(lastJson), 'yaml');
                break;
            case 'xml':
                setOutput(`<?xml version="1.0" encoding="UTF-8"?>\n${jsonToXml(lastJson, 'root')}`, 'xml');
                break;
            case 'typescript':
                setOutput(jsonToTypeScript(lastJson), 'typescript');
                break;
            case 'go':
                setOutput(jsonToGoStruct(lastJson), 'go');
                break;
            default:
                setOutput(JSON.stringify(lastJson, null, 2), 'json');
        }
    }

    function handleJsonAction(action) {
        const inputText = jsonInput.value.trim();
        try {
            if (!inputText) {
                throw new Error('请输入JSON数据');
            }

            lastJson = JSON.parse(inputText);

            if (action === 'compress') {
                outputMode.value = 'json';
                setOutput(JSON.stringify(lastJson), 'json');
                setMessage('压缩成功，已移除多余空白字符。', 'success');
            } else if (action === 'validate') {
                outputMode.value = 'json';
                setOutput(JSON.stringify(lastJson, null, 2), 'json');
                setMessage('JSON 校验通过。', 'success');
            } else {
                outputMode.value = 'json';
                setOutput(JSON.stringify(lastJson, null, 2), 'json');
                setMessage('格式化成功。', 'success');
            }

            updateStats(lastJson, inputText);
        } catch (error) {
            lastJson = null;
            setOutput('', 'plaintext');
            updateStats(null, inputText);
            setMessage(`错误：${locateJsonError(error, inputText)}`, 'error');
        }
    }

    function escapeInput() {
        const text = jsonInput.value;
        if (!text) {
            setMessage('请输入要转义的文本。', 'error');
            return;
        }
        setOutput(JSON.stringify(text), 'json');
        setMessage('转义完成。', 'success');
    }

    function unescapeInput() {
        const text = jsonInput.value.trim();
        if (!text) {
            setMessage('请输入要去转义的字符串。', 'error');
            return;
        }

        try {
            const value = JSON.parse(text);
            if (typeof value !== 'string') {
                throw new Error('去转义输入必须是 JSON 字符串');
            }
            setOutput(value, 'plaintext');
            setMessage('去转义完成。', 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    function copyResult() {
        const text = lastOutput || jsonOutput.textContent;
        if (!text) {
            setMessage('没有可复制的内容。', 'error');
            return;
        }

        navigator.clipboard.writeText(text).then(function() {
            setMessage('结果已复制到剪贴板。', 'success');
        }).catch(function(err) {
            setMessage(`复制失败：${err}`, 'error');
        });
    }

    function downloadJson() {
        const text = lastOutput || jsonOutput.textContent;
        if (!text) {
            setMessage('没有可下载的内容。', 'error');
            return;
        }

        const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = outputMode.value === 'json' ? 'formatted.json' : `json-result.${outputMode.value}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setMessage('文件已生成下载。', 'success');
    }

    function loadSample() {
        const sample = {
            id: 1001,
            name: 'JavaPub 在线工具箱',
            owner: {
                name: '王仕宇',
                github: 'Rodert'
            },
            features: ['JSON格式化', 'JSON压缩', 'JSON转YAML', 'JSON转TypeScript', 'JSON转Go Struct'],
            localOnly: true,
            links: {
                docs: 'https://docs.chongplus.plus',
                api: 'https://api.chongplus.plus'
            }
        };
        jsonInput.value = JSON.stringify(sample, null, 2);
        handleJsonAction('format');
    }

    function clearAll() {
        jsonInput.value = '';
        lastJson = null;
        lastOutput = '';
        setOutput('', 'json');
        setMessage('等待输入 JSON 数据。', '');
        updateStats(null, '');
    }

    function toggleFullscreen() {
        const workbench = document.querySelector('.json-workbench');
        if (!workbench) {
            return;
        }
        workbench.classList.toggle('is-fullscreen');
        fullscreenBtn.textContent = workbench.classList.contains('is-fullscreen') ? '退出全屏' : '全屏';
    }

    function jsonToTree(value, label = 'root', depth = 0) {
        const indent = '  '.repeat(depth);
        if (value === null || typeof value !== 'object') {
            return `${indent}${label}: ${String(value)}\n`;
        }

        const type = Array.isArray(value) ? 'Array' : 'Object';
        let result = `${indent}${label}: ${type}\n`;
        const entries = Array.isArray(value) ? value.map((item, index) => [index, item]) : Object.entries(value);
        entries.forEach(([key, child]) => {
            result += jsonToTree(child, key, depth + 1);
        });
        return result;
    }

    function jsonToYaml(value, depth = 0) {
        const indent = '  '.repeat(depth);
        if (Array.isArray(value)) {
            return value.map(item => {
                if (item !== null && typeof item === 'object') {
                    return `${indent}-\n${jsonToYaml(item, depth + 1)}`;
                }
                return `${indent}- ${formatYamlValue(item)}\n`;
            }).join('');
        }

        if (value !== null && typeof value === 'object') {
            return Object.entries(value).map(([key, item]) => {
                if (item !== null && typeof item === 'object') {
                    return `${indent}${key}:\n${jsonToYaml(item, depth + 1)}`;
                }
                return `${indent}${key}: ${formatYamlValue(item)}\n`;
            }).join('');
        }

        return `${indent}${formatYamlValue(value)}\n`;
    }

    function formatYamlValue(value) {
        if (value === null) {
            return 'null';
        }
        if (typeof value === 'string') {
            if (value === '' || /[:#\n"'{}\[\],&*?|-]/.test(value)) {
                return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
            }
            return value;
        }
        return String(value);
    }

    function jsonToXml(value, nodeName, depth = 0) {
        const indent = '  '.repeat(depth);
        if (Array.isArray(value)) {
            return value.map(item => jsonToXml(item, nodeName, depth)).join('');
        }

        if (value !== null && typeof value === 'object') {
            let xml = `${indent}<${safeXmlName(nodeName)}>\n`;
            Object.entries(value).forEach(([key, item]) => {
                xml += jsonToXml(item, key, depth + 1);
            });
            xml += `${indent}</${safeXmlName(nodeName)}>\n`;
            return xml;
        }

        return `${indent}<${safeXmlName(nodeName)}>${escapeXml(String(value ?? ''))}</${safeXmlName(nodeName)}>\n`;
    }

    function safeXmlName(name) {
        const normalized = String(name).replace(/[^A-Za-z0-9_-]/g, '_');
        return /^[A-Za-z_]/.test(normalized) ? normalized : `item_${normalized}`;
    }

    function escapeXml(text) {
        return text.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    function jsonToTypeScript(value) {
        const definitions = [];
        const rootType = buildTypeScriptType(value, 'Root', definitions);
        if (!definitions.some(definition => definition.startsWith('interface Root '))) {
            definitions.unshift(`type Root = ${rootType};`);
        }
        return definitions.join('\n\n');
    }

    function buildTypeScriptType(value, name, definitions) {
        if (value === null) return 'null';
        if (Array.isArray(value)) {
            return value.length ? `${buildTypeScriptType(value[0], singularize(name), definitions)}[]` : 'unknown[]';
        }
        if (typeof value === 'object') {
            const interfaceName = toPascalCase(name);
            const fields = Object.entries(value).map(([key, item]) => {
                return `  ${safeTsKey(key)}: ${buildTypeScriptType(item, key, definitions)};`;
            });
            const definition = `interface ${interfaceName} {\n${fields.join('\n')}\n}`;
            if (!definitions.includes(definition)) {
                definitions.push(definition);
            }
            return interfaceName;
        }
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        return 'string';
    }

    function jsonToGoStruct(value) {
        const structs = [];
        const rootType = buildGoType(value, 'Root', structs);
        if (rootType !== 'Root') {
            structs.unshift(`type Root ${rootType}`);
        }
        return structs.join('\n\n');
    }

    function buildGoType(value, name, structs) {
        if (value === null) return 'interface{}';
        if (Array.isArray(value)) {
            return value.length ? `[]${buildGoType(value[0], singularize(name), structs)}` : '[]interface{}';
        }
        if (typeof value === 'object') {
            const structName = toPascalCase(name);
            const fields = Object.entries(value).map(([key, item]) => {
                return `    ${toPascalCase(key)} ${buildGoType(item, key, structs)} \`json:"${key}"\``;
            });
            const definition = `type ${structName} struct {\n${fields.join('\n')}\n}`;
            if (!structs.includes(definition)) {
                structs.push(definition);
            }
            return structName;
        }
        if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'float64';
        if (typeof value === 'boolean') return 'bool';
        return 'string';
    }

    function toPascalCase(text) {
        const normalized = String(text)
            .replace(/[^A-Za-z0-9]+/g, ' ')
            .trim()
            .split(/\s+/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('');
        return /^[A-Za-z]/.test(normalized) ? normalized : `Field${normalized || 'Value'}`;
    }

    function safeTsKey(key) {
        return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
    }

    function singularize(text) {
        return String(text).endsWith('s') ? String(text).slice(0, -1) : text;
    }

    formatBtn.addEventListener('click', () => handleJsonAction('format'));
    compressBtn.addEventListener('click', () => handleJsonAction('compress'));
    validateBtn.addEventListener('click', () => handleJsonAction('validate'));
    escapeBtn.addEventListener('click', escapeInput);
    unescapeBtn.addEventListener('click', unescapeInput);
    clearBtn.addEventListener('click', clearAll);
    sampleBtn.addEventListener('click', loadSample);
    copyBtn.addEventListener('click', copyResult);
    downloadBtn.addEventListener('click', downloadJson);
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    outputMode.addEventListener('change', () => renderCurrent(outputMode.value));
    jsonInput.addEventListener('input', () => updateStats(lastJson, jsonInput.value));

    updateStats(null, '');
});
