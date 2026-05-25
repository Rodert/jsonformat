document.addEventListener('DOMContentLoaded', function() {
    const lengthInput = document.getElementById('password-length');
    const countInput = document.getElementById('password-count');
    const uppercase = document.getElementById('password-uppercase');
    const lowercase = document.getElementById('password-lowercase');
    const digits = document.getElementById('password-digits');
    const symbols = document.getElementById('password-symbols');
    const avoidAmbiguous = document.getElementById('password-avoid-ambiguous');
    const requireEach = document.getElementById('password-require-each');
    const output = document.getElementById('password-output');
    const message = document.getElementById('password-message');

    const sets = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        digits: '0123456789',
        symbols: '!@#$%^&*()-_=+[]{};:,.?'
    };
    const ambiguous = new Set(Array.from('0O1lI|`\'"'));

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function secureRandomInt(max) {
        const limit = Math.floor(0x100000000 / max) * max;
        const buffer = new Uint32Array(1);
        let value;
        do {
            crypto.getRandomValues(buffer);
            value = buffer[0];
        } while (value >= limit);
        return value % max;
    }

    function pick(charset) {
        return charset[secureRandomInt(charset.length)];
    }

    function shuffle(chars) {
        for (let i = chars.length - 1; i > 0; i -= 1) {
            const j = secureRandomInt(i + 1);
            [chars[i], chars[j]] = [chars[j], chars[i]];
        }
        return chars;
    }

    function normalizeSet(value) {
        return avoidAmbiguous.checked
            ? Array.from(value).filter((char) => !ambiguous.has(char)).join('')
            : value;
    }

    function getSelectedSets() {
        const selected = [];
        if (uppercase.checked) selected.push(normalizeSet(sets.uppercase));
        if (lowercase.checked) selected.push(normalizeSet(sets.lowercase));
        if (digits.checked) selected.push(normalizeSet(sets.digits));
        if (symbols.checked) selected.push(normalizeSet(sets.symbols));
        return selected.filter(Boolean);
    }

    function readNumber(element, min, max, name) {
        const value = Number(element.value);
        if (!Number.isInteger(value) || value < min || value > max) {
            throw new Error(`${name}必须是 ${min}-${max} 之间的整数`);
        }
        return value;
    }

    function generatePassword(length, selectedSets) {
        const allChars = selectedSets.join('');
        const chars = [];

        if (requireEach.checked) {
            if (length < selectedSets.length) {
                throw new Error('密码长度不能小于已选字符类型数量');
            }
            selectedSets.forEach((set) => chars.push(pick(set)));
        }

        while (chars.length < length) {
            chars.push(pick(allChars));
        }

        return shuffle(chars).join('');
    }

    function generate() {
        try {
            if (!globalThis.crypto || !globalThis.crypto.getRandomValues) {
                throw new Error('当前环境不支持 Crypto API');
            }

            const length = readNumber(lengthInput, 4, 256, '长度');
            const count = readNumber(countInput, 1, 200, '数量');
            const selectedSets = getSelectedSets();
            if (selectedSets.length === 0) {
                throw new Error('请至少选择一种字符类型');
            }

            const passwords = Array.from({ length: count }, () => generatePassword(length, selectedSets));
            output.value = passwords.join('\n');
            setMessage(`已生成 ${count} 个随机密码。`, 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.getElementById('password-generate-btn').addEventListener('click', generate);
    document.getElementById('password-clear-btn').addEventListener('click', () => {
        output.value = '';
        setMessage('等待生成密码。', '');
    });
    document.getElementById('password-copy-btn').addEventListener('click', () => {
        if (!output.value) {
            setMessage('没有可复制的内容。', 'error');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => setMessage('结果已复制。', 'success'));
    });
});
