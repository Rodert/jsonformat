// 代码对比工具脚本
document.addEventListener('DOMContentLoaded', function() {
    const codeOriginal = document.getElementById('code-original');
    const codeModified = document.getElementById('code-modified');
    const diffViewerOriginal = document.getElementById('diff-viewer-original');
    const diffViewerModified = document.getElementById('diff-viewer-modified');
    const compareBtn = document.getElementById('compare-btn');
    const clearBtn = document.getElementById('clear-btn');
    const sampleBtn = document.getElementById('sample-btn');
    const languageSelect = document.getElementById('language-select');
    const ignoreWhitespace = document.getElementById('ignore-whitespace');
    const ignoreCase = document.getElementById('ignore-case');
    const syncScroll = document.getElementById('sync-scroll');
    const diffStats = document.getElementById('diff-stats');
    
    let scrollSync = true;
    let stats = { added: 0, removed: 0, changed: 0, unchanged: 0 };

    // 同步滚动
    syncScroll.addEventListener('change', function() {
        scrollSync = this.checked;
    });

    // 滚动同步处理
    let isScrolling = false;
    function syncScrollViews(source, target) {
        if (!scrollSync || isScrolling) return;
        isScrolling = true;
        target.scrollTop = source.scrollTop;
        setTimeout(() => { isScrolling = false; }, 50);
    }

    diffViewerOriginal.addEventListener('scroll', function() {
        syncScrollViews(this, diffViewerModified);
    });

    diffViewerModified.addEventListener('scroll', function() {
        syncScrollViews(this, diffViewerOriginal);
    });

    // 文件上传
    document.querySelectorAll('.file-input').forEach(input => {
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const panel = this.dataset.panel;
            const textarea = panel === 'original' ? codeOriginal : codeModified;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                textarea.value = e.target.result;
            };
            reader.readAsText(file);
            this.value = ''; // 重置input，允许选择同一文件
        });
    });

    // 复制功能
    document.querySelectorAll('.copy-panel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const panel = this.dataset.panel;
            const textarea = panel === 'original' ? codeOriginal : codeModified;
            const text = textarea.value;
            
            if (!text) {
                alert('没有可复制的内容！');
                return;
            }
            
            navigator.clipboard.writeText(text).then(() => {
                const originalText = this.textContent;
                this.textContent = '✓';
                this.style.color = '#28a745';
                setTimeout(() => {
                    this.textContent = originalText;
                    this.style.color = '';
                }, 2000);
            }).catch(err => {
                alert('复制失败：' + err);
            });
        });
    });

    // LCS算法计算最长公共子序列
    function lcs(lines1, lines2) {
        const m = lines1.length;
        const n = lines2.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
        
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (lines1[i - 1] === lines2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }
        
        return dp;
    }

    // 生成差异序列
    function generateDiff(lines1, lines2, dp) {
        const result = [];
        let i = lines1.length;
        let j = lines2.length;
        
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
                result.unshift({ type: 'equal', original: lines1[i - 1], modified: lines2[j - 1], originalLine: i, modifiedLine: j });
                i--;
                j--;
            } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
                result.unshift({ type: 'added', original: '', modified: lines2[j - 1], originalLine: 0, modifiedLine: j });
                j--;
            } else {
                result.unshift({ type: 'removed', original: lines1[i - 1], modified: '', originalLine: i, modifiedLine: 0 });
                i--;
            }
        }
        
        return result;
    }

    // 优化差异显示（合并相邻的相同类型）
    function optimizeDiff(diff) {
        const optimized = [];
        let currentBlock = null;
        
        for (let item of diff) {
            if (currentBlock && currentBlock.type === item.type) {
                currentBlock.items.push(item);
            } else {
                if (currentBlock) optimized.push(currentBlock);
                currentBlock = {
                    type: item.type,
                    items: [item]
                };
            }
        }
        if (currentBlock) optimized.push(currentBlock);
        
        return optimized;
    }

    // 标准化文本（用于比较）
    function normalizeText(text, ignoreWS, ignoreCS) {
        if (ignoreWS) {
            text = text.replace(/\s+/g, ' ').trim();
        }
        if (ignoreCS) {
            text = text.toLowerCase();
        }
        return text;
    }

    // 渲染差异视图
    function renderDiff(diffBlocks, language) {
        let originalHtml = '';
        let modifiedHtml = '';
        let originalLineNum = 1;
        let modifiedLineNum = 1;
        
        stats = { added: 0, removed: 0, changed: 0, unchanged: 0 };
        
        diffBlocks.forEach(block => {
            block.items.forEach(item => {
                const originalLine = item.original || '';
                const modifiedLine = item.modified || '';
                
                if (block.type === 'added') {
                    stats.added++;
                    originalHtml += `<div class="diff-line diff-empty"></div>`;
                    modifiedHtml += `<div class="diff-line diff-added"><span class="line-number">${modifiedLineNum++}</span><span class="line-content">${escapeHtml(modifiedLine)}</span></div>`;
                } else if (block.type === 'removed') {
                    stats.removed++;
                    originalHtml += `<div class="diff-line diff-removed"><span class="line-number">${originalLineNum++}</span><span class="line-content">${escapeHtml(originalLine)}</span></div>`;
                    modifiedHtml += `<div class="diff-line diff-empty"></div>`;
                } else if (block.type === 'changed') {
                    stats.changed++;
                    originalHtml += `<div class="diff-line diff-removed"><span class="line-number">${originalLineNum++}</span><span class="line-content">${escapeHtml(originalLine)}</span></div>`;
                    modifiedHtml += `<div class="diff-line diff-added"><span class="line-number">${modifiedLineNum++}</span><span class="line-content">${escapeHtml(modifiedLine)}</span></div>`;
                } else if (block.type === 'equal') {
                    stats.unchanged++;
                    originalHtml += `<div class="diff-line diff-equal"><span class="line-number">${originalLineNum++}</span><span class="line-content">${escapeHtml(originalLine)}</span></div>`;
                    modifiedHtml += `<div class="diff-line diff-equal"><span class="line-number">${modifiedLineNum++}</span><span class="line-content">${escapeHtml(modifiedLine)}</span></div>`;
                }
            });
        });
        
        diffViewerOriginal.innerHTML = `<pre><code>${originalHtml}</code></pre>`;
        diffViewerModified.innerHTML = `<pre><code>${modifiedHtml}</code></pre>`;
        
        // 应用语法高亮（对每行内容进行高亮）
        if (typeof hljs !== 'undefined' && language !== 'plaintext') {
            const highlightLine = (lineContent) => {
                if (!lineContent || lineContent.trim() === '') return escapeHtml(lineContent);
                try {
                    const highlighted = hljs.highlight(lineContent, { language: language });
                    return highlighted.value;
                } catch (e) {
                    return escapeHtml(lineContent);
                }
            };
            
            // 对原始代码面板进行高亮
            diffViewerOriginal.querySelectorAll('.line-content').forEach(el => {
                const text = el.textContent || '';
                if (text.trim()) {
                    el.innerHTML = highlightLine(text);
                }
            });
            
            // 对对比代码面板进行高亮
            diffViewerModified.querySelectorAll('.line-content').forEach(el => {
                const text = el.textContent || '';
                if (text.trim()) {
                    el.innerHTML = highlightLine(text);
                }
            });
        }
        
        // 更新统计信息
        updateStats();
    }

    // 更新统计信息
    function updateStats() {
        document.getElementById('stat-added').textContent = stats.added;
        document.getElementById('stat-removed').textContent = stats.removed;
        document.getElementById('stat-changed').textContent = stats.changed;
        document.getElementById('stat-unchanged').textContent = stats.unchanged;
        diffStats.style.display = 'flex';
    }

    // HTML转义
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 执行对比
    compareBtn.addEventListener('click', function() {
        const originalText = codeOriginal.value;
        const modifiedText = codeModified.value;
        
        if (!originalText && !modifiedText) {
            alert('请输入要对比的代码！');
            return;
        }
        
        // 保存原始文本行
        const originalLines = originalText.split('\n');
        const modifiedLines = modifiedText.split('\n');
        
        // 应用选项进行比较
        const ignoreWS = ignoreWhitespace.checked;
        const ignoreCS = ignoreCase.checked;
        
        // 创建用于比较的标准化文本
        const compareLines1 = originalLines.map(line => normalizeText(line, ignoreWS, ignoreCS));
        const compareLines2 = modifiedLines.map(line => normalizeText(line, ignoreWS, ignoreCS));
        
        // 计算差异（使用标准化文本）
        const dp = lcs(compareLines1, compareLines2);
        
        // 生成差异序列（使用原始文本）
        const diff = [];
        let i = originalLines.length;
        let j = modifiedLines.length;
        
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && compareLines1[i - 1] === compareLines2[j - 1]) {
                diff.unshift({ 
                    type: 'equal', 
                    original: originalLines[i - 1], 
                    modified: modifiedLines[j - 1], 
                    originalLine: i, 
                    modifiedLine: j 
                });
                i--;
                j--;
            } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
                diff.unshift({ 
                    type: 'added', 
                    original: '', 
                    modified: modifiedLines[j - 1], 
                    originalLine: 0, 
                    modifiedLine: j 
                });
                j--;
            } else {
                diff.unshift({ 
                    type: 'removed', 
                    original: originalLines[i - 1], 
                    modified: '', 
                    originalLine: i, 
                    modifiedLine: 0 
                });
                i--;
            }
        }
        
        const diffBlocks = optimizeDiff(diff);
        
        // 检测修改的行（相邻的删除和添加）
        const optimizedBlocks = [];
        for (let i = 0; i < diffBlocks.length; i++) {
            const current = diffBlocks[i];
            const next = diffBlocks[i + 1];
            
            if (current.type === 'removed' && next && next.type === 'added' && 
                current.items.length === next.items.length) {
                // 合并为修改
                current.type = 'changed';
                current.items.forEach((item, idx) => {
                    if (next.items[idx]) {
                        item.modified = next.items[idx].modified;
                        item.modifiedLine = next.items[idx].modifiedLine || 0;
                    }
                });
                optimizedBlocks.push(current);
                i++; // 跳过下一个块
            } else {
                optimizedBlocks.push(current);
            }
        }
        
        // 渲染差异
        const language = languageSelect.value;
        renderDiff(optimizedBlocks, language);
        
        // 显示对比视图，隐藏输入框
        codeOriginal.style.display = 'none';
        codeModified.style.display = 'none';
        diffViewerOriginal.style.display = 'block';
        diffViewerModified.style.display = 'block';
    });

    // 清空
    clearBtn.addEventListener('click', function() {
        codeOriginal.value = '';
        codeModified.value = '';
        diffViewerOriginal.innerHTML = '';
        diffViewerModified.innerHTML = '';
        diffStats.style.display = 'none';
        codeOriginal.style.display = 'block';
        codeModified.style.display = 'block';
        diffViewerOriginal.style.display = 'none';
        diffViewerModified.style.display = 'none';
    });

    // 示例
    sampleBtn.addEventListener('click', function() {
        const original = `function calculateSum(a, b) {
    return a + b;
}

function calculateProduct(a, b) {
    return a * b;
}`;

        const modified = `function calculateSum(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error('参数必须是数字');
    }
    return a + b;
}

function calculateDifference(a, b) {
    return a - b;
}

function calculateProduct(a, b) {
    return a * b;
}`;

        codeOriginal.value = original;
        codeModified.value = modified;
        languageSelect.value = 'javascript';
    });

    // 双击代码区域可编辑
    diffViewerOriginal.addEventListener('dblclick', function() {
        codeOriginal.style.display = 'block';
        this.style.display = 'none';
    });

    diffViewerModified.addEventListener('dblclick', function() {
        codeModified.style.display = 'block';
        this.style.display = 'none';
    });
});

