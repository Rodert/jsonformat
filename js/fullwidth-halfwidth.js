document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('fullwidth-input');
    const output = document.getElementById('fullwidth-output');
    const message = document.getElementById('fullwidth-message');
    const convertPunctuation = document.getElementById('convert-punctuation');
    const punctuationToHalf = {
        '。': '.', '，': ',', '、': ',', '；': ';', '：': ':', '？': '?', '！': '!',
        '（': '(', '）': ')', '【': '[', '】': ']', '｛': '{', '｝': '}',
        '“': '"', '”': '"', '‘': "'", '’': "'", '《': '<', '》': '>',
        '￥': '¥', '—': '-', '…': '...'
    };
    const punctuationToFull = {
        '.': '。', ',': '，', ';': '；', ':': '：', '?': '？', '!': '！',
        '(': '（', ')': '）', '[': '【', ']': '】', '{': '｛', '}': '｝',
        '"': '“', "'": '‘', '<': '《', '>': '》'
    };

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function requireInput() {
        if (!input.value) {
            throw new Error('请输入要转换的文本');
        }
        return input.value;
    }

    function toHalfwidth(text) {
        return Array.from(text).map((char) => {
            const code = char.charCodeAt(0);
            if (code === 0x3000) {
                return ' ';
            }
            if (code >= 0xff01 && code <= 0xff5e) {
                return String.fromCharCode(code - 0xfee0);
            }
            if (convertPunctuation.checked && punctuationToHalf[char]) {
                return punctuationToHalf[char];
            }
            return char;
        }).join('');
    }

    function toFullwidth(text) {
        return Array.from(text).map((char) => {
            const code = char.charCodeAt(0);
            if (code === 0x20) {
                return '　';
            }
            if (code >= 0x21 && code <= 0x7e) {
                if (convertPunctuation.checked && punctuationToFull[char]) {
                    return punctuationToFull[char];
                }
                return String.fromCharCode(code + 0xfee0);
            }
            return char;
        }).join('');
    }

    function run(transform, success) {
        try {
            output.value = transform(requireInput());
            setMessage(success, 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.getElementById('to-halfwidth-btn').addEventListener('click', () => run(toHalfwidth, '全角转半角完成。'));
    document.getElementById('to-fullwidth-btn').addEventListener('click', () => run(toFullwidth, '半角转全角完成。'));
    document.getElementById('fullwidth-sample-btn').addEventListener('click', () => {
        input.value = 'ＪａｖａＰｕｂ　Ｔｏｏｌｓ，版本：２０２６！';
        output.value = '';
        setMessage('已载入示例。', 'success');
    });
    document.getElementById('fullwidth-clear-btn').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        setMessage('等待输入文本。', '');
    });
    document.getElementById('fullwidth-copy-btn').addEventListener('click', () => {
        if (!output.value) {
            setMessage('没有可复制的内容。', 'error');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => setMessage('结果已复制。', 'success'));
    });
    document.getElementById('fullwidth-swap-btn').addEventListener('click', () => {
        if (output.value) {
            input.value = output.value;
            output.value = '';
            setMessage('结果已放回输入框。', 'success');
        }
    });
});
