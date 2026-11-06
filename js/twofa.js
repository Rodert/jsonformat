document.addEventListener('DOMContentLoaded', function() {
    const secretInput = document.getElementById('twofa-secret');
    const revealInput = document.getElementById('twofa-reveal');
    const timer = document.getElementById('twofa-timer');
    const seconds = document.getElementById('twofa-seconds');
    const account = document.getElementById('twofa-account');
    const code = document.getElementById('twofa-code');
    const detail = document.getElementById('twofa-detail');
    const copyButton = document.getElementById('twofa-copy');
    const clearButton = document.getElementById('twofa-clear');
    const message = document.getElementById('twofa-message');
    const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let currentCode = '';
    let currentConfig = null;
    let currentCounter = null;
    let requestId = 0;

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function resetOutput() {
        currentCode = '';
        currentConfig = null;
        currentCounter = null;
        code.textContent = '------';
        account.textContent = '等待输入密钥';
        detail.textContent = '6 位 TOTP，每 30 秒更新';
        copyButton.disabled = true;
    }

    function decodeBase32(value) {
        const clean = value.toUpperCase().replace(/[\s=-]/g, '');
        if (!clean) throw new Error('请输入 Base32 密钥');

        let bits = 0;
        let buffer = 0;
        const bytes = [];
        for (const char of clean) {
            const index = base32Alphabet.indexOf(char);
            if (index === -1) throw new Error(`密钥包含无效的 Base32 字符 “${char}”`);
            buffer = (buffer << 5) | index;
            bits += 5;
            if (bits >= 8) {
                bytes.push((buffer >>> (bits - 8)) & 255);
                bits -= 8;
            }
        }
        if (bytes.length === 0) throw new Error('Base32 密钥长度无效');
        return new Uint8Array(bytes);
    }

    function parseConfig(value) {
        const source = value.trim();
        const config = { secret: source, label: 'TOTP 验证码', digits: 6, period: 30, algorithm: 'SHA-1' };
        if (!/^otpauth:\/\//i.test(source)) return config;

        let uri;
        try {
            uri = new URL(source);
        } catch (error) {
            throw new Error('otpauth 链接格式无效');
        }
        if (uri.protocol !== 'otpauth:' || uri.hostname.toLowerCase() !== 'totp') {
            throw new Error('仅支持 otpauth://totp/ 类型的链接');
        }

        const secret = uri.searchParams.get('secret');
        if (!secret) throw new Error('otpauth 链接中缺少密钥');
        const rawAlgorithm = (uri.searchParams.get('algorithm') || 'SHA1').toUpperCase().replace('-', '');
        const algorithms = { SHA1: 'SHA-1', SHA256: 'SHA-256', SHA512: 'SHA-512' };
        if (!algorithms[rawAlgorithm]) throw new Error('仅支持 SHA-1、SHA-256 或 SHA-512');

        const digits = Number(uri.searchParams.get('digits') || 6);
        const period = Number(uri.searchParams.get('period') || 30);
        if (!Number.isInteger(digits) || digits < 6 || digits > 8) throw new Error('验证码位数仅支持 6 到 8 位');
        if (!Number.isInteger(period) || period < 15 || period > 120) throw new Error('验证码周期必须为 15 到 120 秒');

        const label = decodeURIComponent(uri.pathname.slice(1)).replace(/^.*:/, '') || uri.searchParams.get('issuer') || config.label;
        return { secret, label, digits, period, algorithm: algorithms[rawAlgorithm] };
    }

    async function generateTotp(config, timestamp) {
        if (!globalThis.crypto || !crypto.subtle) throw new Error('当前浏览器不支持 Web Crypto API');
        const key = await crypto.subtle.importKey('raw', decodeBase32(config.secret), { name: 'HMAC', hash: { name: config.algorithm } }, false, ['sign']);
        const counter = Math.floor(timestamp / 1000 / config.period);
        const counterBytes = new Uint8Array(8);
        let remaining = counter;
        for (let index = 7; index >= 0; index -= 1) {
            counterBytes[index] = remaining & 255;
            remaining = Math.floor(remaining / 256);
        }
        const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, counterBytes));
        const offset = signature[signature.length - 1] & 15;
        const binary = ((signature[offset] & 127) << 24)
            | ((signature[offset + 1] & 255) << 16)
            | ((signature[offset + 2] & 255) << 8)
            | (signature[offset + 3] & 255);
        return String(binary % (10 ** config.digits)).padStart(config.digits, '0');
    }

    function updateTimer(config) {
        const elapsed = (Date.now() / 1000) % config.period;
        const remaining = Math.max(1, Math.ceil(config.period - elapsed));
        seconds.textContent = String(remaining);
        timer.style.setProperty('--twofa-progress', `${Math.min(1, Math.max(0, elapsed / config.period)) * 360}deg`);
    }

    async function refreshCode() {
        const id = ++requestId;
        const value = secretInput.value.trim();
        if (!value) {
            resetOutput();
            setMessage('输入密钥后自动生成验证码。');
            return;
        }
        try {
            const config = parseConfig(value);
            const generated = await generateTotp(config, Date.now());
            if (id !== requestId) return;
            currentConfig = config;
            currentCounter = Math.floor(Date.now() / 1000 / config.period);
            currentCode = generated;
            code.textContent = generated;
            account.textContent = config.label;
            detail.textContent = `${config.digits} 位 TOTP，每 ${config.period} 秒更新`;
            copyButton.disabled = false;
            updateTimer(config);
            setMessage('验证码已生成。', 'success');
        } catch (error) {
            if (id !== requestId) return;
            resetOutput();
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    secretInput.addEventListener('input', refreshCode);
    revealInput.addEventListener('change', function() {
        secretInput.classList.toggle('is-revealed', revealInput.checked);
    });
    clearButton.addEventListener('click', function() {
        requestId += 1;
        secretInput.value = '';
        revealInput.checked = false;
        secretInput.classList.remove('is-revealed');
        resetOutput();
        setMessage('已清空密钥。');
        secretInput.focus();
    });
    copyButton.addEventListener('click', async function() {
        if (!currentCode) return;
        try {
            await navigator.clipboard.writeText(currentCode);
            setMessage('验证码已复制。', 'success');
        } catch (error) {
            setMessage('复制失败，请手动复制验证码。', 'error');
        }
    });
    window.setInterval(function() {
        if (!currentConfig) return;
        updateTimer(currentConfig);
        const counter = Math.floor(Date.now() / 1000 / currentConfig.period);
        if (counter !== currentCounter) refreshCode();
    }, 250);
});
