document.addEventListener('DOMContentLoaded', function() {
    const message = document.getElementById('claude-message');

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function getValue(id) {
        return document.getElementById(id).value.trim();
    }

    function toNumber(id, fallback) {
        const value = Number(getValue(id));
        return Number.isFinite(value) ? value : fallback;
    }

    function generateRequest() {
        const system = getValue('claude-system');
        const user = getValue('claude-user');
        if (!user) {
            setMessage('请先填写 User 消息。', 'error');
            return;
        }

        const request = {
            model: getValue('claude-model'),
            max_tokens: toNumber('claude-max-tokens', 2048),
            messages: [
                { role: 'user', content: user }
            ]
        };

        if (system) {
            request.system = system;
        }

        document.getElementById('claude-result').value = JSON.stringify(request, null, 2);
        setMessage('Claude 请求体已生成。', 'success');
    }

    function fillSample() {
        document.getElementById('claude-system').value = '你是一个专注代码审查的助手。';
        document.getElementById('claude-user').value = '请审查下面的代码片段，按风险等级输出问题和修复建议。';
        generateRequest();
    }

    function copyResult() {
        const result = document.getElementById('claude-result');
        if (!result.value) {
            setMessage('没有可复制的请求体。', 'error');
            return;
        }
        navigator.clipboard.writeText(result.value).then(() => setMessage('请求体已复制。', 'success'));
    }

    document.getElementById('claude-generate-btn').addEventListener('click', generateRequest);
    document.getElementById('claude-sample-btn').addEventListener('click', fillSample);
    document.getElementById('claude-copy-btn').addEventListener('click', copyResult);
});
