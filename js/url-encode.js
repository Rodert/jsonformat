document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('url-encode-input');
    const output = document.getElementById('url-encode-output');
    const message = document.getElementById('url-encode-message');
    const formSpace = document.getElementById('url-form-space');

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function requireInput() {
        if (!input.value) {
            throw new Error('请输入要转换的内容');
        }
        return input.value;
    }

    function applyFormSpace(value) {
        return formSpace.checked ? value.replace(/%20/g, '+') : value;
    }

    function normalizeFormSpace(value) {
        return formSpace.checked ? value.replace(/\+/g, '%20') : value;
    }

    function componentEncode() {
        return applyFormSpace(encodeURIComponent(requireInput()));
    }

    function fullEncode() {
        return applyFormSpace(encodeURI(requireInput()));
    }

    function decodeUrl() {
        try {
            return decodeURIComponent(normalizeFormSpace(requireInput()));
        } catch (error) {
            throw new Error('URL 编码格式不正确');
        }
    }

    function run(transform, success) {
        try {
            output.value = transform();
            setMessage(success, 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.getElementById('url-component-encode-btn').addEventListener('click', () => run(componentEncode, 'URL 组件编码完成。'));
    document.getElementById('url-full-encode-btn').addEventListener('click', () => run(fullEncode, '整段 URL 编码完成。'));
    document.getElementById('url-decode-btn').addEventListener('click', () => run(decodeUrl, 'URL 解码完成。'));
    document.getElementById('url-encode-sample-btn').addEventListener('click', () => {
        input.value = 'JavaPub Tools 中文?q=1&tag=编码';
        output.value = '';
        setMessage('已载入示例。', 'success');
    });
    document.getElementById('url-encode-clear-btn').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        setMessage('等待输入内容。', '');
    });
    document.getElementById('url-encode-copy-btn').addEventListener('click', () => {
        if (!output.value) {
            setMessage('没有可复制的内容。', 'error');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => setMessage('结果已复制。', 'success'));
    });
    document.getElementById('url-encode-swap-btn').addEventListener('click', () => {
        if (output.value) {
            input.value = output.value;
            output.value = '';
            setMessage('结果已放回输入框。', 'success');
        }
    });
});
