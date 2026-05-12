document.addEventListener('DOMContentLoaded', function() {
    const countInput = document.getElementById('uuid-count');
    const hyphenInput = document.getElementById('uuid-hyphen');
    const sortInput = document.getElementById('uuid-sort');
    const output = document.getElementById('uuid-output');
    const generateBtn = document.getElementById('generate-uuid-btn');
    const copyBtn = document.getElementById('copy-uuid-btn');
    const clearBtn = document.getElementById('clear-uuid-btn');
    const message = document.getElementById('uuid-message');

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function getCount() {
        const count = Number(countInput.value);
        if (!Number.isInteger(count) || count < 1 || count > 200) {
            throw new Error('生成数量需在 1 到 200 之间');
        }
        return count;
    }

    function createUuid() {
        if (crypto.randomUUID) {
            return crypto.randomUUID();
        }

        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    function getCaseMode() {
        const selected = document.querySelector('input[name="uuid-case"]:checked');
        return selected ? selected.value : 'lower';
    }

    function formatUuid(uuid) {
        let value = hyphenInput.checked ? uuid : uuid.replace(/-/g, '');
        if (getCaseMode() === 'upper') {
            value = value.toUpperCase();
        }
        return value;
    }

    function generate() {
        try {
            const count = getCount();
            let values = Array.from({ length: count }, () => formatUuid(createUuid()));
            if (sortInput.checked) {
                values = values.sort();
            }
            output.value = values.join('\n');
            setMessage(`已生成 ${count} 个 UUID。`, 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    function copyOutput() {
        if (!output.value) {
            setMessage('没有可复制的 UUID。', 'error');
            return;
        }

        navigator.clipboard.writeText(output.value).then(() => {
            setMessage('UUID 已复制到剪贴板。', 'success');
        }).catch(error => {
            setMessage(`复制失败：${error.message}`, 'error');
        });
    }

    generateBtn.addEventListener('click', generate);
    copyBtn.addEventListener('click', copyOutput);
    clearBtn.addEventListener('click', function() {
        output.value = '';
        setMessage('等待生成 UUID。', '');
    });

    generate();
});
