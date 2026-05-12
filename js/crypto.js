// 编码加密工具脚本：所有处理均在浏览器本地完成。

const AES_ITERATIONS = 100000;

function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value : '';
}

function setValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.value = value;
    }
}

function setCryptoMessage(message, type = '') {
    const element = document.getElementById('crypto-message');
    if (!element) {
        return;
    }

    element.textContent = message;
    element.classList.toggle('success', type === 'success');
    element.classList.toggle('error', type === 'error');
}

function setOutput(id, value, message, type = 'success') {
    setValue(id, value);
    if (message) {
        setCryptoMessage(message, type);
    }
}

function requireSubtleCrypto() {
    if (!globalThis.crypto || !globalThis.crypto.subtle) {
        throw new Error('当前环境不支持 Web Crypto API，请使用现代浏览器或桌面版工具。');
    }
    return globalThis.crypto.subtle;
}

function textToBytes(text) {
    return new TextEncoder().encode(text);
}

function bytesToText(bytes) {
    return new TextDecoder().decode(bytes);
}

function bytesToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
}

function bytesToBase64(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk);
    }

    return btoa(binary);
}

function base64ToBytes(base64) {
    const clean = base64.replace(/\s+/g, '');
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}

function formatJson(value) {
    return JSON.stringify(value, null, 2);
}

function normalizePem(pem) {
    return pem.replace(/\r/g, '').trim();
}

function arrayBufferToPem(buffer, label) {
    const base64 = bytesToBase64(buffer);
    const lines = base64.match(/.{1,64}/g) || [];
    return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
}

function pemToArrayBuffer(pem, label) {
    const normalized = normalizePem(pem);
    const header = `-----BEGIN ${label}-----`;
    const footer = `-----END ${label}-----`;

    if (!normalized.includes(header) || !normalized.includes(footer)) {
        throw new Error(`请粘贴有效的 ${label} PEM。`);
    }

    const base64 = normalized
        .replace(header, '')
        .replace(footer, '')
        .replace(/\s+/g, '');

    return base64ToBytes(base64).buffer;
}

function parseAesPackage(input) {
    let payload;

    try {
        payload = JSON.parse(input);
    } catch (error) {
        throw new Error('加密包不是有效 JSON。');
    }

    if (
        payload.alg !== 'AES-GCM' ||
        payload.kdf !== 'PBKDF2-SHA256' ||
        !payload.salt ||
        !payload.iv ||
        !payload.ciphertext
    ) {
        throw new Error('加密包格式不正确，请使用本工具生成的 AES-GCM 加密包。');
    }

    return payload;
}

async function deriveAesKey(password, salt, usages) {
    const subtle = requireSubtleCrypto();
    const baseKey = await subtle.importKey(
        'raw',
        textToBytes(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: AES_ITERATIONS,
            hash: 'SHA-256'
        },
        baseKey,
        {
            name: 'AES-GCM',
            length: 256
        },
        false,
        usages
    );
}

// ==================== Base64 编码/解码 ====================
function base64Encode() {
    const input = getValue('base64-input');

    if (!input) {
        setCryptoMessage('请输入要编码的文本。', 'error');
        return;
    }

    try {
        setOutput('base64-output', bytesToBase64(textToBytes(input)), 'Base64 编码完成。');
    } catch (error) {
        setCryptoMessage(`编码失败：${error.message}`, 'error');
    }
}

function base64Decode() {
    const input = getValue('base64-input');

    if (!input) {
        setCryptoMessage('请输入要解码的 Base64 文本。', 'error');
        return;
    }

    try {
        setOutput('base64-output', bytesToText(base64ToBytes(input)), 'Base64 解码完成。');
    } catch (error) {
        setCryptoMessage('解码失败：输入的 Base64 格式不正确。', 'error');
    }
}

function clearBase64() {
    setValue('base64-input', '');
    setOutput('base64-output', '', 'Base64 输入已清空。', '');
}

// ==================== URL 编码/解码 ====================
function urlEncode() {
    const input = getValue('url-input');

    if (!input) {
        setCryptoMessage('请输入要编码的 URL 或文本。', 'error');
        return;
    }

    try {
        setOutput('url-output', encodeURIComponent(input), 'URL 编码完成。');
    } catch (error) {
        setCryptoMessage(`编码失败：${error.message}`, 'error');
    }
}

function urlDecode() {
    const input = getValue('url-input');

    if (!input) {
        setCryptoMessage('请输入要解码的 URL 文本。', 'error');
        return;
    }

    try {
        setOutput('url-output', decodeURIComponent(input), 'URL 解码完成。');
    } catch (error) {
        setCryptoMessage('解码失败：输入的 URL 编码格式不正确。', 'error');
    }
}

function clearURL() {
    setValue('url-input', '');
    setOutput('url-output', '', 'URL 输入已清空。', '');
}

// ==================== 哈希摘要 ====================
async function generateHash(algorithm) {
    const input = getValue('hash-input');

    if (!input) {
        setCryptoMessage('请输入要生成摘要的文本。', 'error');
        return;
    }

    try {
        if (algorithm === 'MD5') {
            setOutput('hash-output', md5(input), 'MD5 摘要已生成。');
            return;
        }

        const subtle = requireSubtleCrypto();
        const digest = await subtle.digest(algorithm, textToBytes(input));
        setOutput('hash-output', bytesToHex(digest), `${algorithm} 摘要已生成。`);
    } catch (error) {
        setCryptoMessage(`生成失败：${error.message}`, 'error');
    }
}

function clearHash() {
    setValue('hash-input', '');
    setOutput('hash-output', '', '哈希输入已清空。', '');
}

// ==================== HMAC-SHA256 ====================
async function generateHmac() {
    const key = getValue('hmac-key');
    const input = getValue('hmac-input');

    if (!key) {
        setCryptoMessage('请输入 HMAC 密钥。', 'error');
        return;
    }

    if (!input) {
        setCryptoMessage('请输入要签名的消息。', 'error');
        return;
    }

    try {
        const subtle = requireSubtleCrypto();
        const cryptoKey = await subtle.importKey(
            'raw',
            textToBytes(key),
            {
                name: 'HMAC',
                hash: 'SHA-256'
            },
            false,
            ['sign']
        );
        const signature = await subtle.sign('HMAC', cryptoKey, textToBytes(input));
        setOutput('hmac-output', bytesToHex(signature), 'HMAC-SHA256 已生成。');
    } catch (error) {
        setCryptoMessage(`生成失败：${error.message}`, 'error');
    }
}

function clearHmac() {
    setValue('hmac-key', '');
    setValue('hmac-input', '');
    setOutput('hmac-output', '', 'HMAC 输入已清空。', '');
}

// ==================== AES-GCM 加密/解密 ====================
async function aesEncrypt() {
    const password = getValue('aes-key');
    const input = getValue('aes-input');

    if (!input) {
        setCryptoMessage('请输入要加密的明文。', 'error');
        return;
    }

    if (!password || password.length < 8) {
        setCryptoMessage('AES 口令至少需要 8 个字符。', 'error');
        return;
    }

    try {
        requireSubtleCrypto();
        const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
        const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
        const key = await deriveAesKey(password, salt, ['encrypt']);
        const ciphertext = await globalThis.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv
            },
            key,
            textToBytes(input)
        );
        const payload = {
            alg: 'AES-GCM',
            kdf: 'PBKDF2-SHA256',
            iterations: AES_ITERATIONS,
            salt: bytesToBase64(salt),
            iv: bytesToBase64(iv),
            ciphertext: bytesToBase64(ciphertext)
        };

        setOutput('aes-output', formatJson(payload), 'AES-GCM 加密完成。');
    } catch (error) {
        setCryptoMessage(`加密失败：${error.message}`, 'error');
    }
}

async function aesDecrypt() {
    const password = getValue('aes-key');
    const input = getValue('aes-input');

    if (!input) {
        setCryptoMessage('请输入要解密的加密包。', 'error');
        return;
    }

    if (!password || password.length < 8) {
        setCryptoMessage('AES 口令至少需要 8 个字符。', 'error');
        return;
    }

    try {
        const payload = parseAesPackage(input);
        const salt = base64ToBytes(payload.salt);
        const iv = base64ToBytes(payload.iv);
        const ciphertext = base64ToBytes(payload.ciphertext);
        const iterations = Number(payload.iterations);

        if (iterations !== AES_ITERATIONS) {
            throw new Error(`当前仅支持 ${AES_ITERATIONS} 次 PBKDF2 迭代的加密包。`);
        }

        const key = await deriveAesKey(password, salt, ['decrypt']);
        const plaintext = await globalThis.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv
            },
            key,
            ciphertext
        );

        setOutput('aes-output', bytesToText(new Uint8Array(plaintext)), 'AES-GCM 解密完成。');
    } catch (error) {
        setCryptoMessage(`解密失败：${error.message}`, 'error');
    }
}

function clearAES() {
    setValue('aes-key', '');
    setValue('aes-input', '');
    setOutput('aes-output', '', 'AES 输入已清空。', '');
}

// ==================== RSA-OAEP 加密/解密 ====================
async function generateRsaKeys() {
    try {
        const subtle = requireSubtleCrypto();
        const keyPair = await subtle.generateKey(
            {
                name: 'RSA-OAEP',
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: 'SHA-256'
            },
            true,
            ['encrypt', 'decrypt']
        );
        const publicKey = await subtle.exportKey('spki', keyPair.publicKey);
        const privateKey = await subtle.exportKey('pkcs8', keyPair.privateKey);

        setValue('rsa-public-key', arrayBufferToPem(publicKey, 'PUBLIC KEY'));
        setValue('rsa-private-key', arrayBufferToPem(privateKey, 'PRIVATE KEY'));
        setCryptoMessage('RSA-OAEP 密钥对已生成，请妥善保存私钥。', 'success');
    } catch (error) {
        setCryptoMessage(`密钥生成失败：${error.message}`, 'error');
    }
}

async function rsaEncrypt() {
    const publicPem = getValue('rsa-public-key');
    const input = getValue('rsa-input');

    if (!publicPem) {
        setCryptoMessage('请先生成或粘贴 RSA 公钥 PEM。', 'error');
        return;
    }

    if (!input) {
        setCryptoMessage('请输入要加密的短文本。', 'error');
        return;
    }

    try {
        const subtle = requireSubtleCrypto();
        const publicKey = await subtle.importKey(
            'spki',
            pemToArrayBuffer(publicPem, 'PUBLIC KEY'),
            {
                name: 'RSA-OAEP',
                hash: 'SHA-256'
            },
            false,
            ['encrypt']
        );
        const encrypted = await subtle.encrypt(
            {
                name: 'RSA-OAEP'
            },
            publicKey,
            textToBytes(input)
        );

        setOutput('rsa-output', bytesToBase64(encrypted), 'RSA-OAEP 加密完成。');
    } catch (error) {
        setCryptoMessage(`加密失败：${error.message}。RSA-OAEP 2048 位密钥只适合加密短文本。`, 'error');
    }
}

async function rsaDecrypt() {
    const privatePem = getValue('rsa-private-key');
    const input = getValue('rsa-input');

    if (!privatePem) {
        setCryptoMessage('请先生成或粘贴 RSA 私钥 PEM。', 'error');
        return;
    }

    if (!input) {
        setCryptoMessage('请输入要解密的 Base64 密文。', 'error');
        return;
    }

    try {
        const subtle = requireSubtleCrypto();
        const privateKey = await subtle.importKey(
            'pkcs8',
            pemToArrayBuffer(privatePem, 'PRIVATE KEY'),
            {
                name: 'RSA-OAEP',
                hash: 'SHA-256'
            },
            false,
            ['decrypt']
        );
        const decrypted = await subtle.decrypt(
            {
                name: 'RSA-OAEP'
            },
            privateKey,
            base64ToBytes(input)
        );

        setOutput('rsa-output', bytesToText(new Uint8Array(decrypted)), 'RSA-OAEP 解密完成。');
    } catch (error) {
        setCryptoMessage(`解密失败：${error.message}`, 'error');
    }
}

function clearRSA() {
    setValue('rsa-public-key', '');
    setValue('rsa-private-key', '');
    setValue('rsa-input', '');
    setOutput('rsa-output', '', 'RSA 输入已清空。', '');
}

// ==================== 复制 ====================
async function copyById(id) {
    const value = getValue(id);

    if (!value) {
        setCryptoMessage('没有可复制的结果。', 'error');
        return;
    }

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(value);
        } else {
            const element = document.getElementById(id);
            element.focus();
            element.select();
            document.execCommand('copy');
        }
        setCryptoMessage('结果已复制到剪贴板。', 'success');
    } catch (error) {
        setCryptoMessage(`复制失败：${error.message}`, 'error');
    }
}

// ==================== MD5 实现 ====================
function md5(input) {
    const bytes = textToBytes(input);
    const bitLength = bytes.length * 8;
    const paddedLength = (((bytes.length + 8) >> 6) + 1) * 64;
    const padded = new Uint8Array(paddedLength);
    const words = new Uint32Array(padded.buffer);

    padded.set(bytes);
    padded[bytes.length] = 0x80;
    words[paddedLength / 4 - 2] = bitLength & 0xffffffff;
    words[paddedLength / 4 - 1] = Math.floor(bitLength / 0x100000000);

    let a = 0x67452301;
    let b = 0xefcdab89;
    let c = 0x98badcfe;
    let d = 0x10325476;

    const shifts = [
        7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
        5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
        4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
        6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
    ];
    const constants = new Uint32Array(64);

    for (let i = 0; i < 64; i += 1) {
        constants[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000);
    }

    for (let offset = 0; offset < words.length; offset += 16) {
        let aa = a;
        let bb = b;
        let cc = c;
        let dd = d;

        for (let i = 0; i < 64; i += 1) {
            let f;
            let g;

            if (i < 16) {
                f = (bb & cc) | (~bb & dd);
                g = i;
            } else if (i < 32) {
                f = (dd & bb) | (~dd & cc);
                g = (5 * i + 1) % 16;
            } else if (i < 48) {
                f = bb ^ cc ^ dd;
                g = (3 * i + 5) % 16;
            } else {
                f = cc ^ (bb | ~dd);
                g = (7 * i) % 16;
            }

            const temp = dd;
            const sum = (aa + f + constants[i] + words[offset + g]) >>> 0;
            dd = cc;
            cc = bb;
            bb = (bb + leftRotate(sum, shifts[i])) >>> 0;
            aa = temp;
        }

        a = (a + aa) >>> 0;
        b = (b + bb) >>> 0;
        c = (c + cc) >>> 0;
        d = (d + dd) >>> 0;
    }

    return [a, b, c, d].map(wordToLittleEndianHex).join('');
}

function leftRotate(value, shift) {
    return (value << shift) | (value >>> (32 - shift));
}

function wordToLittleEndianHex(word) {
    let hex = '';

    for (let i = 0; i < 4; i += 1) {
        hex += ((word >>> (i * 8)) & 0xff).toString(16).padStart(2, '0');
    }

    return hex;
}
