document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('xml-json-input');
    const output = document.getElementById('xml-json-output');
    const message = document.getElementById('xml-json-message');
    const keepAttrs = document.getElementById('xml-attrs');
    const keepRoot = document.getElementById('xml-root');
    let lastJson = '';

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function addChild(target, key, value) {
        if (Object.prototype.hasOwnProperty.call(target, key)) {
            if (!Array.isArray(target[key])) {
                target[key] = [target[key]];
            }
            target[key].push(value);
        } else {
            target[key] = value;
        }
    }

    function elementToJson(element) {
        const obj = {};
        if (keepAttrs.checked && element.attributes.length) {
            obj['@attributes'] = {};
            Array.from(element.attributes).forEach(attr => {
                obj['@attributes'][attr.name] = attr.value;
            });
        }

        const childElements = Array.from(element.children);
        const text = Array.from(element.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.nodeValue.trim())
            .filter(Boolean)
            .join(' ');

        childElements.forEach(child => addChild(obj, child.nodeName, elementToJson(child)));

        if (text) {
            if (Object.keys(obj).length === 0) {
                return text;
            }
            obj['#text'] = text;
        }

        return obj;
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
            const raw = input.value.trim();
            if (!raw) throw new Error('请输入 XML 内容');
            const doc = new DOMParser().parseFromString(raw, 'application/xml');
            const parserError = doc.querySelector('parsererror');
            if (parserError) {
                throw new Error('XML 解析失败，请检查标签是否闭合');
            }
            const root = doc.documentElement;
            const value = elementToJson(root);
            renderJson(keepRoot.checked ? { [root.nodeName]: value } : value);
            setMessage('XML 已转换为 JSON。', 'success');
        } catch (error) {
            output.textContent = '';
            lastJson = '';
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.getElementById('xml-json-convert-btn').addEventListener('click', convert);
    document.getElementById('xml-json-sample-btn').addEventListener('click', () => {
        input.value = '<tools version="1.0">\n  <item id="json">JSON格式化</item>\n  <item id="csv">JSON转CSV</item>\n  <owner>JavaPub</owner>\n</tools>';
        convert();
    });
    document.getElementById('xml-json-clear-btn').addEventListener('click', () => {
        input.value = '';
        output.textContent = '';
        lastJson = '';
        setMessage('等待输入 XML。', '');
    });
    document.getElementById('xml-json-copy-btn').addEventListener('click', () => {
        if (!lastJson) {
            setMessage('没有可复制的 JSON。', 'error');
            return;
        }
        navigator.clipboard.writeText(lastJson).then(() => setMessage('JSON 已复制。', 'success'));
    });
});
