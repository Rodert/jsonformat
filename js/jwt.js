document.addEventListener('DOMContentLoaded', function() {
    const jwtInput = document.getElementById('jwt-input');
    const decodeBtn = document.getElementById('decode-jwt-btn');
    const sampleBtn = document.getElementById('sample-jwt-btn');
    const clearBtn = document.getElementById('clear-jwt-btn');
    const copyPayloadBtn = document.getElementById('copy-payload-btn');
    const headerOutput = document.getElementById('jwt-header-output');
    const payloadOutput = document.getElementById('jwt-payload-output');
    const claimsOutput = document.getElementById('jwt-claims-output');
    const signatureOutput = document.getElementById('jwt-signature-output');
    const message = document.getElementById('jwt-message');

    let lastPayload = '';

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function base64UrlDecode(part) {
        const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
        const binary = atob(padded);
        const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
        return new TextDecoder().decode(bytes);
    }

    function parseJsonPart(part, name) {
        try {
            return JSON.parse(base64UrlDecode(part));
        } catch (error) {
            throw new Error(`${name} 不是有效的 Base64URL JSON`);
        }
    }

    function setJsonOutput(element, value) {
        element.textContent = JSON.stringify(value, null, 2);
        if (typeof hljs !== 'undefined') {
            element.removeAttribute('data-highlighted');
            hljs.highlightElement(element);
        }
    }

    function formatTimestamp(seconds) {
        if (typeof seconds !== 'number') {
            return '-';
        }
        const date = new Date(seconds * 1000);
        if (Number.isNaN(date.getTime())) {
            return '-';
        }
        return `${date.toLocaleString('zh-CN', { hour12: false })} / ${date.toISOString()}`;
    }

    function renderClaims(payload) {
        const nowSeconds = Math.floor(Date.now() / 1000);
        const rows = [];

        if (payload.exp) {
            const expired = nowSeconds >= payload.exp;
            rows.push({ label: '过期时间 exp', value: formatTimestamp(payload.exp) });
            rows.push({ label: '是否过期', value: expired ? '已过期' : '未过期' });
        }
        if (payload.iat) {
            rows.push({ label: '签发时间 iat', value: formatTimestamp(payload.iat) });
        }
        if (payload.nbf) {
            rows.push({ label: '生效时间 nbf', value: formatTimestamp(payload.nbf) });
            rows.push({ label: '是否已生效', value: nowSeconds >= payload.nbf ? '已生效' : '尚未生效' });
        }
        if (payload.iss) rows.push({ label: '签发方 iss', value: payload.iss });
        if (payload.sub) rows.push({ label: '主题 sub', value: payload.sub });
        if (payload.aud) rows.push({ label: '受众 aud', value: Array.isArray(payload.aud) ? payload.aud.join(', ') : payload.aud });

        claimsOutput.innerHTML = rows.length
            ? rows.map(row => `<div class="result-row"><span>${row.label}</span><strong>${escapeHtml(String(row.value))}</strong></div>`).join('')
            : '<p class="muted">未检测到常见注册声明字段。</p>';
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function decodeJwt() {
        try {
            const token = jwtInput.value.trim();
            const parts = token.split('.');
            if (parts.length !== 3 || parts.some(part => !part)) {
                throw new Error('JWT 应包含 Header、Payload、Signature 三段');
            }

            const header = parseJsonPart(parts[0], 'Header');
            const payload = parseJsonPart(parts[1], 'Payload');
            lastPayload = JSON.stringify(payload, null, 2);

            setJsonOutput(headerOutput, header);
            setJsonOutput(payloadOutput, payload);
            renderClaims(payload);
            signatureOutput.textContent = parts[2];
            setMessage('JWT 解析完成。注意：本工具未验证签名。', 'success');
        } catch (error) {
            lastPayload = '';
            headerOutput.textContent = '';
            payloadOutput.textContent = '';
            claimsOutput.innerHTML = '';
            signatureOutput.textContent = '';
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    function loadSample() {
        const header = { alg: 'HS256', typ: 'JWT' };
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            sub: '10001',
            name: 'JavaPub',
            iss: 'api.chongplus.plus',
            iat: now,
            exp: now + 3600,
            roles: ['developer', 'admin']
        };
        const encode = value => btoa(unescape(encodeURIComponent(JSON.stringify(value))))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/g, '');
        jwtInput.value = `${encode(header)}.${encode(payload)}.demo-signature`;
        decodeJwt();
    }

    function clearAll() {
        jwtInput.value = '';
        lastPayload = '';
        headerOutput.textContent = '';
        payloadOutput.textContent = '';
        claimsOutput.innerHTML = '';
        signatureOutput.textContent = '';
        setMessage('等待输入 JWT。', '');
    }

    decodeBtn.addEventListener('click', decodeJwt);
    sampleBtn.addEventListener('click', loadSample);
    clearBtn.addEventListener('click', clearAll);
    copyPayloadBtn.addEventListener('click', function() {
        if (!lastPayload) {
            setMessage('没有可复制的 Payload。', 'error');
            return;
        }
        navigator.clipboard.writeText(lastPayload).then(() => {
            setMessage('Payload 已复制到剪贴板。', 'success');
        }).catch(error => {
            setMessage(`复制失败：${error.message}`, 'error');
        });
    });
});
