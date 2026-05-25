document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('sql-input');
    const output = document.getElementById('sql-output');
    const keywordCaseInput = document.getElementById('sql-keyword-case');
    const indentSizeInput = document.getElementById('sql-indent-size');
    const formatBtn = document.getElementById('format-sql-btn');
    const minifyBtn = document.getElementById('minify-sql-btn');
    const sampleBtn = document.getElementById('sample-sql-btn');
    const clearBtn = document.getElementById('clear-sql-btn');
    const copyBtn = document.getElementById('copy-sql-btn');
    const message = document.getElementById('sql-message');
    const statChars = document.getElementById('sql-stat-chars');
    const statLines = document.getElementById('sql-stat-lines');

    const keywords = new Set([
        'add', 'all', 'alter', 'and', 'as', 'asc', 'between', 'by', 'case', 'cast', 'check',
        'column', 'constraint', 'create', 'cross', 'database', 'default', 'delete', 'desc',
        'distinct', 'drop', 'else', 'end', 'exists', 'false', 'for', 'foreign', 'from', 'full',
        'group', 'having', 'in', 'index', 'inner', 'insert', 'into', 'is', 'join', 'key',
        'left', 'like', 'limit', 'not', 'null', 'offset', 'on', 'or', 'order', 'outer',
        'primary', 'references', 'right', 'select', 'set', 'table', 'then', 'true', 'union',
        'unique', 'update', 'using', 'values', 'when', 'where', 'with'
    ]);
    const clauseKeywords = new Set([
        'select', 'from', 'where', 'group by', 'having', 'order by', 'limit', 'offset',
        'insert into', 'values', 'update', 'set', 'delete from', 'with', 'returning'
    ]);
    const joinKeywords = new Set([
        'join', 'inner join', 'left join', 'left outer join', 'right join', 'right outer join',
        'full join', 'full outer join', 'cross join'
    ]);
    const logicalKeywords = new Set(['and', 'or', 'when', 'else']);

    if (!input || !output) {
        return;
    }

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function updateStats(text) {
        statChars.textContent = `字符：${text.length}`;
        statLines.textContent = `行数：${text ? text.split('\n').length : 0}`;
    }

    function isWordChar(char) {
        return /[A-Za-z0-9_$]/.test(char);
    }

    function readQuoted(sql, start, quote) {
        let value = quote;
        let i = start + 1;

        while (i < sql.length) {
            const char = sql[i];
            value += char;
            if (char === quote) {
                if (sql[i + 1] === quote) {
                    value += sql[i + 1];
                    i += 2;
                    continue;
                }
                break;
            }
            if (char === '\\' && i + 1 < sql.length) {
                value += sql[i + 1];
                i += 2;
                continue;
            }
            i += 1;
        }

        return { value, next: i + 1 };
    }

    function tokenize(sql) {
        const tokens = [];
        let i = 0;

        while (i < sql.length) {
            const char = sql[i];

            if (/\s/.test(char)) {
                i += 1;
                continue;
            }

            if (char === '-' && sql[i + 1] === '-') {
                let end = i + 2;
                while (end < sql.length && sql[end] !== '\n') {
                    end += 1;
                }
                tokens.push({ type: 'comment', value: sql.slice(i, end) });
                i = end;
                continue;
            }

            if (char === '/' && sql[i + 1] === '*') {
                const end = sql.indexOf('*/', i + 2);
                const next = end === -1 ? sql.length : end + 2;
                tokens.push({ type: 'comment', value: sql.slice(i, next) });
                i = next;
                continue;
            }

            if (char === '\'' || char === '"' || char === '`') {
                const quoted = readQuoted(sql, i, char);
                tokens.push({ type: 'literal', value: quoted.value });
                i = quoted.next;
                continue;
            }

            if ('(),;.'.includes(char)) {
                tokens.push({ type: 'punctuation', value: char });
                i += 1;
                continue;
            }

            if ('+-*/%=<>!|&'.includes(char)) {
                let value = char;
                if ('=<>!|&'.includes(sql[i + 1])) {
                    value += sql[i + 1];
                    i += 1;
                }
                tokens.push({ type: 'operator', value });
                i += 1;
                continue;
            }

            let end = i;
            while (end < sql.length && isWordChar(sql[end])) {
                end += 1;
            }

            if (end === i) {
                tokens.push({ type: 'word', value: char });
                i += 1;
                continue;
            }

            const value = sql.slice(i, end);
            tokens.push({
                type: keywords.has(value.toLowerCase()) ? 'keyword' : 'word',
                value
            });
            i = end;
        }

        return tokens;
    }

    function combinedKeyword(tokens, index) {
        const phrase = keywordPhrase(tokens, index);
        return phrase ? phrase.normalized : '';
    }

    function keywordPhrase(tokens, index) {
        const one = tokens[index] && tokens[index].value.toLowerCase();
        const two = tokens[index + 1] && tokens[index + 1].value.toLowerCase();
        const three = tokens[index + 2] && tokens[index + 2].value.toLowerCase();

        if (!one) {
            return null;
        }

        const threeWord = `${one} ${two || ''} ${three || ''}`.trim();
        if (clauseKeywords.has(threeWord) || joinKeywords.has(threeWord)) {
            return {
                normalized: threeWord,
                original: tokens.slice(index, index + 3).map(token => token.value).join(' '),
                length: 3
            };
        }

        const twoWord = `${one} ${two || ''}`.trim();
        if (clauseKeywords.has(twoWord) || joinKeywords.has(twoWord)) {
            return {
                normalized: twoWord,
                original: tokens.slice(index, index + 2).map(token => token.value).join(' '),
                length: 2
            };
        }

        return {
            normalized: one,
            original: tokens[index].value,
            length: 1
        };
    }

    function applyKeywordCase(token) {
        if (token.type !== 'keyword') {
            return token.value;
        }

        const mode = keywordCaseInput.value;
        if (mode === 'lower') {
            return token.value.toLowerCase();
        }
        if (mode === 'preserve') {
            return token.value;
        }
        return token.value.toUpperCase();
    }

    function applyKeywordPhraseCase(phrase) {
        const mode = keywordCaseInput.value;
        if (mode === 'lower') {
            return phrase.normalized.toLowerCase();
        }
        if (mode === 'preserve') {
            return phrase.original;
        }
        return phrase.normalized.toUpperCase();
    }

    function formatSql(sql) {
        const tokens = tokenize(sql);
        const indentUnit = ' '.repeat(Number(indentSizeInput.value));
        const lines = [];
        let line = '';
        let indentLevel = 0;
        let continuationIndent = 0;

        function currentIndent(extra = 0) {
            return indentUnit.repeat(Math.max(indentLevel + extra, 0));
        }

        function pushLine(force = false, extraIndent = 0) {
            const trimmed = line.trimEnd();
            if (trimmed || force) {
                lines.push(trimmed);
            }
            line = currentIndent(extraIndent);
        }

        function append(value) {
            if (!line.trim()) {
                if (line.length === 0) {
                    line = currentIndent();
                }
            } else if (!line.endsWith(' ') && !line.endsWith('(') && !line.endsWith('.')) {
                line += ' ';
            }
            line += value;
        }

        function appendNoSpace(value) {
            line = line.trimEnd() + value;
        }

        for (let i = 0; i < tokens.length; i += 1) {
            const token = tokens[i];
            const phrase = token.type === 'keyword' ? keywordPhrase(tokens, i) : null;
            const keyword = phrase ? phrase.normalized : '';

            if (token.type === 'comment') {
                pushLine();
                line = `${currentIndent()}${token.value}`;
                pushLine();
                continue;
            }

            if (token.value === ';') {
                appendNoSpace(';');
                pushLine();
                continue;
            }

            if (token.value === ',') {
                appendNoSpace(',');
                pushLine(false, continuationIndent || 1);
                continue;
            }

            if (token.value === '.') {
                appendNoSpace('.');
                continue;
            }

            if (token.value === '(') {
                const previous = tokens[i - 1];
                if (previous && previous.type === 'word') {
                    appendNoSpace('(');
                } else {
                    append('(');
                }
                indentLevel += 1;
                continuationIndent = Math.max(continuationIndent, 1);
                continue;
            }

            if (token.value === ')') {
                indentLevel = Math.max(indentLevel - 1, 0);
                if (!line.trim()) {
                    line = currentIndent();
                }
                appendNoSpace(')');
                continue;
            }

            if (clauseKeywords.has(keyword)) {
                if (line.trim()) {
                    pushLine();
                }
                line = currentIndent();
                append(applyKeywordPhraseCase(phrase));
                continuationIndent = keyword === 'select' ? 1 : 0;
                if (keyword === 'select') {
                    pushLine(false, continuationIndent);
                }
                i += phrase.length - 1;
                continue;
            }

            if (joinKeywords.has(keyword) || logicalKeywords.has(keyword)) {
                if (line.trim()) {
                    pushLine();
                }
                line = currentIndent(1);
                append(applyKeywordPhraseCase(phrase));
                continuationIndent = 1;
                i += phrase.length - 1;
                continue;
            }

            append(applyKeywordCase(token));
        }

        pushLine();
        return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    }

    function minifySql(sql) {
        const tokens = tokenize(sql).filter(token => token.type !== 'comment');
        let text = '';

        tokens.forEach((token) => {
            const value = applyKeywordCase(token);
            if (!text) {
                text = value;
                return;
            }
            if ([')', ',', ';', '.'].includes(value)) {
                text = text.trimEnd() + value;
                return;
            }
            if (value === '(') {
                text = text.trimEnd() + value;
                return;
            }
            if (text.endsWith('.') || text.endsWith('(')) {
                text += value;
                return;
            }
            text += ` ${value}`;
        });

        return text.trim();
    }

    function run(action) {
        const source = input.value.trim();
        if (!source) {
            setMessage('请输入 SQL。', 'error');
            return;
        }

        try {
            const result = action === 'minify' ? minifySql(source) : formatSql(source);
            output.value = result;
            updateStats(result);
            setMessage(action === 'minify' ? 'SQL 压缩完成。' : 'SQL 格式化完成。', 'success');
        } catch (error) {
            setMessage(`处理失败：${error.message}`, 'error');
        }
    }

    function loadSample() {
        input.value = "select u.id,u.name,u.email,count(o.id) as order_count,sum(o.amount) as total_amount from users u left join orders o on o.user_id=u.id and o.status='paid' where u.created_at>='2026-01-01' and u.enabled=true group by u.id,u.name,u.email having count(o.id)>0 order by total_amount desc limit 20;";
        run('format');
    }

    function clearAll() {
        input.value = '';
        output.value = '';
        updateStats('');
        setMessage('等待输入 SQL。', '');
    }

    function copyResult() {
        if (!output.value) {
            setMessage('没有可复制的 SQL。', 'error');
            return;
        }

        navigator.clipboard.writeText(output.value).then(function() {
            setMessage('SQL 已复制到剪贴板。', 'success');
        }).catch(function(error) {
            setMessage(`复制失败：${error.message}`, 'error');
        });
    }

    formatBtn.addEventListener('click', () => run('format'));
    minifyBtn.addEventListener('click', () => run('minify'));
    sampleBtn.addEventListener('click', loadSample);
    clearBtn.addEventListener('click', clearAll);
    copyBtn.addEventListener('click', copyResult);
    input.addEventListener('input', () => updateStats(input.value));

    updateStats('');
});
