document.addEventListener('DOMContentLoaded', function() {
    const message = document.getElementById('openai-message');

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

    function setResult(value) {
        document.getElementById('openai-result').value = JSON.stringify(value, null, 2);
    }

    function generateResponses() {
        const system = getValue('openai-system');
        const user = getValue('openai-user');
        if (!user) {
            setMessage('请先填写 User 消息。', 'error');
            return;
        }

        setResult({
            model: getValue('openai-model'),
            input: [
                ...(system ? [{ role: 'system', content: system }] : []),
                { role: 'user', content: user }
            ],
            temperature: toNumber('openai-temperature', 0.2),
            max_output_tokens: toNumber('openai-max-output', 2048)
        });
        setMessage('Responses API 请求体已生成。', 'success');
    }

    function generateChat() {
        const system = getValue('openai-system');
        const user = getValue('openai-user');
        if (!user) {
            setMessage('请先填写 User 消息。', 'error');
            return;
        }

        setResult({
            model: getValue('openai-model'),
            messages: [
                ...(system ? [{ role: 'system', content: system }] : []),
                { role: 'user', content: user }
            ],
            temperature: toNumber('openai-temperature', 0.2),
            max_tokens: toNumber('openai-max-output', 2048)
        });
        setMessage('Chat Completions 请求体已生成。', 'success');
    }

    function fillSample() {
        document.getElementById('openai-system').value = '你是一个严谨的开发助手。';
        document.getElementById('openai-user').value = '请帮我把下面的接口返回整理成字段说明，并指出潜在异常。';
        generateResponses();
    }

    function copyResult() {
        const result = document.getElementById('openai-result');
        if (!result.value) {
            setMessage('没有可复制的请求体。', 'error');
            return;
        }
        navigator.clipboard.writeText(result.value).then(() => setMessage('请求体已复制。', 'success'));
    }

    document.getElementById('openai-responses-btn').addEventListener('click', generateResponses);
    document.getElementById('openai-chat-btn').addEventListener('click', generateChat);
    document.getElementById('openai-sample-btn').addEventListener('click', fillSample);
    document.getElementById('openai-copy-btn').addEventListener('click', copyResult);
});
