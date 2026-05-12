document.addEventListener('DOMContentLoaded', function() {
    const patternInput = document.getElementById('regex-pattern');
    const textInput = document.getElementById('regex-text');
    const replaceInput = document.getElementById('replace-text');
    const runBtn = document.getElementById('run-regex-btn');
    const sampleBtn = document.getElementById('sample-regex-btn');
    const clearBtn = document.getElementById('clear-regex-btn');
    const copyBtn = document.getElementById('copy-regex-btn');
    const highlightOutput = document.getElementById('regex-highlight');
    const matchesOutput = document.getElementById('regex-matches');
    const replaceOutput = document.getElementById('regex-replace-output');
    const message = document.getElementById('regex-message');

    let lastMatchesText = '';

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function getFlags() {
        return ['g', 'i', 'm', 's', 'u']
            .filter(flag => document.getElementById(`flag-${flag}`).checked)
            .join('');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function buildRegex() {
        const pattern = patternInput.value;
        if (!pattern) {
            throw new Error('请输入正则表达式');
        }
        return new RegExp(pattern, getFlags());
    }

    function collectMatches(regex, text) {
        const matches = [];
        if (regex.global) {
            let match;
            let guard = 0;
            while ((match = regex.exec(text)) !== null) {
                matches.push(match);
                if (match[0] === '') {
                    regex.lastIndex++;
                }
                guard++;
                if (guard > 1000) {
                    throw new Error('匹配结果超过 1000 条，请缩小测试范围');
                }
            }
            return matches;
        }

        const match = regex.exec(text);
        return match ? [match] : [];
    }

    function renderHighlight(text, matches) {
        if (!text) {
            highlightOutput.innerHTML = '<span class="muted">暂无测试文本。</span>';
            return;
        }

        if (matches.length === 0) {
            highlightOutput.textContent = text;
            return;
        }

        let cursor = 0;
        let html = '';
        matches.forEach((match, index) => {
            const start = match.index;
            const end = start + match[0].length;
            html += escapeHtml(text.slice(cursor, start));
            html += `<mark title="Match ${index + 1}">${escapeHtml(match[0])}</mark>`;
            cursor = end;
        });
        html += escapeHtml(text.slice(cursor));
        highlightOutput.innerHTML = html;
    }

    function renderMatches(matches) {
        if (matches.length === 0) {
            matchesOutput.innerHTML = '<p class="muted">没有匹配结果。</p>';
            lastMatchesText = '';
            return;
        }

        lastMatchesText = matches.map((match, index) => {
            const groups = match.slice(1).map((group, groupIndex) => `  $${groupIndex + 1}: ${group}`).join('\n');
            return `#${index + 1} @ ${match.index}\n  match: ${match[0]}${groups ? `\n${groups}` : ''}`;
        }).join('\n\n');

        matchesOutput.innerHTML = matches.map((match, index) => {
            const groups = match.slice(1).map((group, groupIndex) => {
                return `<div><span>$${groupIndex + 1}</span><strong>${escapeHtml(String(group))}</strong></div>`;
            }).join('');
            return `<section class="match-item"><h3>#${index + 1} <span>@ ${match.index}</span></h3><p>${escapeHtml(match[0])}</p>${groups}</section>`;
        }).join('');
    }

    function runRegex() {
        try {
            const text = textInput.value;
            const regex = buildRegex();
            const matches = collectMatches(regex, text);
            renderHighlight(text, matches);
            renderMatches(matches);
            replaceOutput.textContent = replaceInput.value ? text.replace(regex, replaceInput.value) : '';
            setMessage(`执行完成，匹配 ${matches.length} 条。`, matches.length ? 'success' : '');
        } catch (error) {
            highlightOutput.innerHTML = '';
            matchesOutput.innerHTML = '';
            replaceOutput.textContent = '';
            lastMatchesText = '';
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    function loadSample() {
        patternInput.value = '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b';
        textInput.value = 'Contact JavaPub at dev@example.com or admin@javapub.net.\nInvalid email: hello@localhost';
        replaceInput.value = '[email]';
        document.getElementById('flag-g').checked = true;
        document.getElementById('flag-i').checked = true;
        runRegex();
    }

    function clearAll() {
        patternInput.value = '';
        textInput.value = '';
        replaceInput.value = '';
        highlightOutput.innerHTML = '';
        matchesOutput.innerHTML = '';
        replaceOutput.textContent = '';
        lastMatchesText = '';
        setMessage('等待输入正则表达式。', '');
    }

    runBtn.addEventListener('click', runRegex);
    sampleBtn.addEventListener('click', loadSample);
    clearBtn.addEventListener('click', clearAll);
    copyBtn.addEventListener('click', function() {
        if (!lastMatchesText) {
            setMessage('没有可复制的匹配结果。', 'error');
            return;
        }
        navigator.clipboard.writeText(lastMatchesText).then(() => {
            setMessage('匹配结果已复制到剪贴板。', 'success');
        }).catch(error => {
            setMessage(`复制失败：${error.message}`, 'error');
        });
    });
});
