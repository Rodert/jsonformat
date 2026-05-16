document.addEventListener('DOMContentLoaded', function() {
    const message = document.getElementById('image-message');

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function getValue(id) {
        const element = document.getElementById(id);
        return element ? element.value.trim() : '';
    }

    function setValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.value = value;
        }
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatJson(value) {
        return JSON.stringify(value, null, 2);
    }

    function quoteShell(value) {
        return "'" + String(value).replace(/'/g, "'\\''") + "'";
    }

    function buildPayload() {
        return {
            model: getValue('image-model') || 'gpt-image-2',
            prompt: getValue('image-prompt'),
            size: getValue('image-size') || '1024x1024'
        };
    }

    function renderCurl() {
        const apiUrl = getValue('image-api-url') || 'https://api.chongplus.plus/v1/images/generations';
        const apiKey = getValue('image-api-key') || '$DAXIANGAI_API_KEY';
        const curl = [
            `curl --location ${quoteShell(apiUrl)} \\`,
            `--header ${quoteShell(`Authorization: Bearer ${apiKey}`)} \\`,
            `--header ${quoteShell('Content-Type: application/json')} \\`,
            `--data ${quoteShell(formatJson(buildPayload()))}`
        ].join('\n');

        setValue('image-curl-result', curl);
        setMessage('curl 命令已生成。', 'success');
    }

    function copyText(targetId) {
        const target = document.getElementById(targetId);
        if (!target || !target.value) {
            setMessage('没有可复制的内容。', 'error');
            return;
        }

        const onSuccess = () => setMessage('内容已复制。', 'success');
        const onError = () => setMessage('复制失败，请手动选择内容复制。', 'error');

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(target.value).then(onSuccess).catch(onError);
            return;
        }

        target.select();
        try {
            document.execCommand('copy') ? onSuccess() : onError();
        } catch (error) {
            onError();
        }
    }

    function setPreview(content) {
        document.getElementById('image-preview').innerHTML = content;
    }

    function pickImageSource(responseJson) {
        const firstItem = responseJson && Array.isArray(responseJson.data) ? responseJson.data[0] : null;
        if (!firstItem) {
            return '';
        }
        if (firstItem.url) {
            return firstItem.url;
        }
        if (firstItem.b64_json) {
            return `data:image/png;base64,${firstItem.b64_json}`;
        }
        return '';
    }

    async function sendRequest() {
        const apiUrl = getValue('image-api-url');
        const apiKey = getValue('image-api-key');
        const payload = buildPayload();

        if (!apiUrl) {
            setMessage('请先填写 API 地址。', 'error');
            return;
        }
        if (!apiKey) {
            setMessage('请先填写 API Key。', 'error');
            return;
        }
        if (!payload.prompt) {
            setMessage('请先填写 Prompt。', 'error');
            return;
        }

        renderCurl();
        const button = document.getElementById('image-generate-btn');
        button.disabled = true;
        button.textContent = '请求中...';
        setPreview('<span>正在请求图片生成接口...</span>');

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const text = await response.text();
            let responseJson = null;

            try {
                responseJson = JSON.parse(text);
                setValue('image-result', formatJson(responseJson));
            } catch (error) {
                setValue('image-result', text);
            }

            if (!response.ok) {
                setPreview('<span>接口返回错误，详情见接口返回。</span>');
                setMessage(`请求失败：HTTP ${response.status}。`, 'error');
                return;
            }

            const imageSource = pickImageSource(responseJson);
            if (imageSource) {
                setPreview(`<img src="${escapeHtml(imageSource)}" alt="AI 生成图片预览">`);
                setMessage('图片生成请求完成。', 'success');
                return;
            }

            setPreview('<span>请求完成，但返回中没有识别到 url 或 b64_json。</span>');
            setMessage('请求完成，未识别到图片字段。', 'success');
        } catch (error) {
            setValue('image-result', error && error.message ? error.message : String(error));
            setPreview('<span>请求失败，可能是网络或跨域限制。</span>');
            setMessage('请求失败。若浏览器提示 CORS，需要接口侧允许跨域。', 'error');
        } finally {
            button.disabled = false;
            button.textContent = '发送生图请求';
        }
    }

    function fillSample() {
        setValue('image-api-url', 'https://api.chongplus.plus/v1/images/generations');
        setValue('image-model', 'gpt-image-2');
        setValue('image-size', '1024x1024');
        setValue('image-prompt', '生成一张高端运动员写真，人物要有专业运动员的力量感、自信感和健康美感，深色背景，电影级灯光，真实皮肤质感，自然汗水，高级商业摄影风格，适合体育杂志封面，画面大气、干净、有冲击力。');
        renderCurl();
    }

    document.getElementById('image-generate-btn').addEventListener('click', sendRequest);
    document.getElementById('image-curl-btn').addEventListener('click', renderCurl);
    document.getElementById('image-sample-btn').addEventListener('click', fillSample);
    document.querySelectorAll('[data-copy]').forEach(button => {
        button.addEventListener('click', () => copyText(button.dataset.copy));
    });
});
