document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('color-input');
    const message = document.getElementById('color-message');
    const preview = document.getElementById('color-preview');
    const fields = {
        hex: document.getElementById('color-hex-result'),
        rgb: document.getElementById('color-rgb-result'),
        hsl: document.getElementById('color-hsl-result')
    };

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function parseHex(text) {
        let value = text.trim().replace(/^#/, '');
        if (/^[0-9a-f]{3}$/i.test(value)) {
            value = value.split('').map((char) => char + char).join('');
        }
        if (!/^[0-9a-f]{6}$/i.test(value)) {
            throw new Error('HEX 颜色格式不正确');
        }
        return {
            r: parseInt(value.slice(0, 2), 16),
            g: parseInt(value.slice(2, 4), 16),
            b: parseInt(value.slice(4, 6), 16)
        };
    }

    function parseRgb(text) {
        const match = text.match(/^rgba?\(([^)]+)\)$/i);
        if (!match) {
            throw new Error('RGB 颜色格式不正确');
        }
        const parts = match[1].split(',').map((part) => Number(part.trim()));
        if (parts.length < 3 || parts.slice(0, 3).some((part) => !Number.isFinite(part))) {
            throw new Error('RGB 颜色格式不正确');
        }
        return {
            r: clamp(Math.round(parts[0]), 0, 255),
            g: clamp(Math.round(parts[1]), 0, 255),
            b: clamp(Math.round(parts[2]), 0, 255)
        };
    }

    function hslToRgb(h, s, l) {
        h = ((h % 360) + 360) % 360;
        s = clamp(s, 0, 100) / 100;
        l = clamp(l, 0, 100) / 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r = 0;
        let g = 0;
        let b = 0;

        if (h < 60) [r, g, b] = [c, x, 0];
        else if (h < 120) [r, g, b] = [x, c, 0];
        else if (h < 180) [r, g, b] = [0, c, x];
        else if (h < 240) [r, g, b] = [0, x, c];
        else if (h < 300) [r, g, b] = [x, 0, c];
        else [r, g, b] = [c, 0, x];

        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }

    function parseHsl(text) {
        const match = text.match(/^hsla?\(([^)]+)\)$/i);
        if (!match) {
            throw new Error('HSL 颜色格式不正确');
        }
        const parts = match[1].split(',').map((part) => part.trim().replace('%', ''));
        if (parts.length < 3) {
            throw new Error('HSL 颜色格式不正确');
        }
        const [h, s, l] = parts.map(Number);
        if (![h, s, l].every(Number.isFinite)) {
            throw new Error('HSL 颜色格式不正确');
        }
        return hslToRgb(h, s, l);
    }

    function parseColor(text) {
        const value = text.trim();
        if (!value) {
            throw new Error('请输入颜色值');
        }
        if (value.startsWith('#') || /^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(value)) {
            return parseHex(value);
        }
        if (/^rgba?\(/i.test(value)) {
            return parseRgb(value);
        }
        if (/^hsla?\(/i.test(value)) {
            return parseHsl(value);
        }
        throw new Error('仅支持 HEX、RGB 和 HSL 颜色格式');
    }

    function rgbToHex({ r, g, b }) {
        return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
    }

    function rgbToHsl({ r, g, b }) {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0;
        let s = 0;
        const l = (max + min) / 2;
        const d = max - min;

        if (d !== 0) {
            s = d / (1 - Math.abs(2 * l - 1));
            if (max === r) h = 60 * (((g - b) / d) % 6);
            else if (max === g) h = 60 * ((b - r) / d + 2);
            else h = 60 * ((r - g) / d + 4);
        }

        h = Math.round((h + 360) % 360);
        return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    function reset() {
        Object.values(fields).forEach((field) => {
            field.textContent = '-';
        });
        preview.style.background = '#fff';
    }

    function convert() {
        try {
            const rgb = parseColor(input.value);
            const hsl = rgbToHsl(rgb);
            fields.hex.textContent = rgbToHex(rgb);
            fields.rgb.textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
            fields.hsl.textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
            preview.style.background = fields.hex.textContent;
            setMessage('颜色转换完成。', 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.getElementById('color-convert-btn').addEventListener('click', convert);
    document.getElementById('color-sample-btn').addEventListener('click', () => {
        input.value = '#1677ff';
        reset();
        setMessage('已载入示例。', 'success');
    });
    document.getElementById('color-clear-btn').addEventListener('click', () => {
        input.value = '';
        reset();
        setMessage('等待输入颜色。', '');
    });
    document.getElementById('color-copy-btn').addEventListener('click', () => {
        if (fields.hex.textContent === '-') {
            setMessage('没有可复制的结果。', 'error');
            return;
        }
        const text = [
            `HEX: ${fields.hex.textContent}`,
            `RGB: ${fields.rgb.textContent}`,
            `HSL: ${fields.hsl.textContent}`
        ].join('\n');
        navigator.clipboard.writeText(text).then(() => setMessage('结果已复制。', 'success'));
    });
});
