// JSON格式化工具脚本
document.addEventListener('DOMContentLoaded', function() {
    const jsonInput = document.getElementById('json-input');
    const jsonOutput = document.getElementById('json-output');
    const formatBtn = document.getElementById('format-btn');
    const clearBtn = document.getElementById('clear-btn');
    const sampleBtn = document.getElementById('sample-btn');
    const copyBtn = document.getElementById('copy-btn');

    // 格式化JSON
    formatBtn.addEventListener('click', function() {
        try {
            const inputText = jsonInput.value.trim();
            if (!inputText) {
                alert('请输入JSON数据！');
                return;
            }
            
            const jsonObj = JSON.parse(inputText);
            const formatted = JSON.stringify(jsonObj, null, 2);
            jsonOutput.textContent = formatted;
            
            // 使用highlight.js高亮显示
            if (typeof hljs !== 'undefined') {
                hljs.highlightElement(jsonOutput);
            }
        } catch (error) {
            jsonOutput.textContent = '错误：无效的JSON格式\n\n' + error.message;
        }
    });

    // 清空
    clearBtn.addEventListener('click', function() {
        jsonInput.value = '';
        jsonOutput.textContent = '';
    });

    // 示例
    sampleBtn.addEventListener('click', function() {
        const sample = {
            "name": "张三",
            "age": 28,
            "email": "zhangsan@example.com",
            "address": {
                "city": "北京",
                "district": "朝阳区"
            },
            "hobbies": ["阅读", "旅游", "摄影"]
        };
        jsonInput.value = JSON.stringify(sample);
        formatBtn.click();
    });

    // 复制
    copyBtn.addEventListener('click', function() {
        const text = jsonOutput.textContent;
        if (!text) {
            alert('没有可复制的内容！');
            return;
        }
        
        navigator.clipboard.writeText(text).then(function() {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '已复制！';
            setTimeout(function() {
                copyBtn.textContent = originalText;
            }, 2000);
        }).catch(function(err) {
            alert('复制失败：' + err);
        });
    });
});

