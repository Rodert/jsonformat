document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('punycode-input');
    const output = document.getElementById('punycode-output');
    const message = document.getElementById('punycode-message');
    const domainMode = document.getElementById('punycode-domain-mode');
    const preserveCase = document.getElementById('punycode-preserve-case');

    const base = 36;
    const tMin = 1;
    const tMax = 26;
    const skew = 38;
    const damp = 700;
    const initialBias = 72;
    const initialN = 128;
    const delimiter = '-';

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function requireInput() {
        if (!input.value.trim()) {
            throw new Error('请输入要转换的内容');
        }
        return input.value.trim();
    }

    function basicToDigit(codePoint) {
        if (codePoint >= 48 && codePoint <= 57) {
            return codePoint - 22;
        }
        if (codePoint >= 65 && codePoint <= 90) {
            return codePoint - 65;
        }
        if (codePoint >= 97 && codePoint <= 122) {
            return codePoint - 97;
        }
        return base;
    }

    function digitToBasic(digit) {
        return String.fromCharCode(digit + 22 + 75 * (digit < 26));
    }

    function adapt(delta, numPoints, firstTime) {
        delta = firstTime ? Math.floor(delta / damp) : delta >> 1;
        delta += Math.floor(delta / numPoints);

        let k = 0;
        while (delta > Math.floor(((base - tMin) * tMax) / 2)) {
            delta = Math.floor(delta / (base - tMin));
            k += base;
        }

        return k + Math.floor(((base - tMin + 1) * delta) / (delta + skew));
    }

    function encodeLabel(label) {
        const codePoints = Array.from(label, (char) => char.codePointAt(0));
        const basic = codePoints.filter((point) => point < 0x80);

        if (basic.length === codePoints.length) {
            return label;
        }

        let outputValue = String.fromCodePoint(...basic);
        let handled = basic.length;
        let n = initialN;
        let delta = 0;
        let bias = initialBias;

        if (basic.length > 0) {
            outputValue += delimiter;
        }

        while (handled < codePoints.length) {
            let m = Infinity;
            for (const point of codePoints) {
                if (point >= n && point < m) {
                    m = point;
                }
            }

            delta += (m - n) * (handled + 1);
            n = m;

            for (const point of codePoints) {
                if (point < n) {
                    delta += 1;
                }
                if (point === n) {
                    let q = delta;
                    for (let k = base; ; k += base) {
                        const t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
                        if (q < t) {
                            break;
                        }
                        outputValue += digitToBasic(t + ((q - t) % (base - t)));
                        q = Math.floor((q - t) / (base - t));
                    }
                    outputValue += digitToBasic(q);
                    bias = adapt(delta, handled + 1, handled === basic.length);
                    delta = 0;
                    handled += 1;
                }
            }

            delta += 1;
            n += 1;
        }

        return `xn--${outputValue}`;
    }

    function decodeLabel(label) {
        const lower = label.toLowerCase();
        if (!lower.startsWith('xn--')) {
            return preserveCase.checked ? label : label.toLowerCase();
        }

        const inputValue = lower.slice(4);
        const outputPoints = [];
        const delimiterIndex = inputValue.lastIndexOf(delimiter);
        let index = 0;

        if (delimiterIndex !== -1) {
            for (const char of inputValue.slice(0, delimiterIndex)) {
                outputPoints.push(char.codePointAt(0));
            }
            index = delimiterIndex + 1;
        }

        let n = initialN;
        let i = 0;
        let bias = initialBias;

        while (index < inputValue.length) {
            const oldI = i;
            let w = 1;

            for (let k = base; ; k += base) {
                if (index >= inputValue.length) {
                    throw new Error(`无效的 Punycode 标签 "${label}"`);
                }
                const digit = basicToDigit(inputValue.charCodeAt(index));
                index += 1;

                if (digit >= base) {
                    throw new Error(`无效的 Punycode 字符 "${inputValue[index - 1]}"`);
                }

                i += digit * w;
                const t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
                if (digit < t) {
                    break;
                }
                w *= base - t;
            }

            const outLength = outputPoints.length + 1;
            bias = adapt(i - oldI, outLength, oldI === 0);
            n += Math.floor(i / outLength);
            i %= outLength;
            outputPoints.splice(i, 0, n);
            i += 1;
        }

        return String.fromCodePoint(...outputPoints);
    }

    function mapLabels(text, mapper) {
        if (!domainMode.checked) {
            return mapper(text);
        }
        return text.split('.').map((label) => {
            if (!label) {
                return label;
            }
            return mapper(label);
        }).join('.');
    }

    function run(transform, success) {
        try {
            output.value = mapLabels(requireInput(), transform);
            setMessage(success, 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.getElementById('punycode-encode-btn').addEventListener('click', () => run(encodeLabel, 'Punycode 编码完成。'));
    document.getElementById('punycode-decode-btn').addEventListener('click', () => run(decodeLabel, 'Punycode 解码完成。'));
    document.getElementById('punycode-sample-btn').addEventListener('click', () => {
        input.value = '中文.com';
        output.value = '';
        setMessage('已载入示例。', 'success');
    });
    document.getElementById('punycode-clear-btn').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        setMessage('等待输入内容。', '');
    });
    document.getElementById('punycode-copy-btn').addEventListener('click', () => {
        if (!output.value) {
            setMessage('没有可复制的内容。', 'error');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => setMessage('结果已复制。', 'success'));
    });
    document.getElementById('punycode-swap-btn').addEventListener('click', () => {
        if (output.value) {
            input.value = output.value;
            output.value = '';
            setMessage('结果已放回输入框。', 'success');
        }
    });
});
