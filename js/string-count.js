document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('string-count-input');
    const patternInput = document.getElementById('string-count-pattern');
    const ignoreCase = document.getElementById('string-count-ignore-case');
    const useRegex = document.getElementById('string-count-regex');
    const allowOverlap = document.getElementById('string-count-overlap');
    const countResult = document.getElementById('match-count-result');
    const lengthResult = document.getElementById('source-length-result');
    const output = document.getElementById('string-count-output');
    const message = document.getElementById('string-count-message');

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function requireInput() {
        if (!input.value) {
            throw new Error('请输入要统计的文本');
        }
        if (!patternInput.value) {
            throw new Error('请输入匹配内容');
        }
    }

    function countPlain(text, pattern) {
        const source = ignoreCase.checked ? text.toLowerCase() : text;
        const needle = ignoreCase.checked ? pattern.toLowerCase() : pattern;
        const matches = [];
        let index = 0;

        while (index <= source.length - needle.length) {
            const found = source.indexOf(needle, index);
            if (found === -1) {
                break;
            }
            matches.push({ index: found, value: text.slice(found, found + pattern.length) });
            index = found + (allowOverlap.checked ? 1 : needle.length);
        }

        return matches;
    }

    function countRegex(text, pattern) {
        const flags = `g${ignoreCase.checked ? 'i' : ''}`;
        const regex = new RegExp(pattern, flags);
        const matches = [];
        let match;

        while ((match = regex.exec(text)) !== null) {
            matches.push({ index: match.index, value: match[0] });
            if (match[0] === '') {
                regex.lastIndex += 1;
            }
        }

        return matches;
    }

    function run() {
        try {
            requireInput();
            const text = input.value;
            const pattern = patternInput.value;
            const matches = useRegex.checked ? countRegex(text, pattern) : countPlain(text, pattern);
            countResult.textContent = String(matches.length);
            lengthResult.textContent = String(Array.from(text).length);
            output.value = matches.map((match, index) => `${index + 1}. [${match.index}] ${match.value}`).join('\n');
            setMessage(`统计完成，共匹配 ${matches.length} 次。`, 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.getElementById('string-count-run-btn').addEventListener('click', run);
    document.getElementById('string-count-sample-btn').addEventListener('click', () => {
        input.value = 'JavaPub Tools, JavaPub JSON tools, javapub online tools';
        patternInput.value = 'javapub';
        ignoreCase.checked = true;
        output.value = '';
        countResult.textContent = '0';
        lengthResult.textContent = '0';
        setMessage('已载入示例。', 'success');
    });
    document.getElementById('string-count-clear-btn').addEventListener('click', () => {
        input.value = '';
        patternInput.value = '';
        output.value = '';
        countResult.textContent = '0';
        lengthResult.textContent = '0';
        setMessage('等待输入文本。', '');
    });
    document.getElementById('string-count-copy-btn').addEventListener('click', () => {
        if (!output.value) {
            setMessage('没有可复制的匹配列表。', 'error');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => setMessage('匹配列表已复制。', 'success'));
    });
});
