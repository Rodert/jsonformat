document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('tool-search-input');
    const cards = Array.from(document.querySelectorAll('[data-tool-card]'));
    const count = document.getElementById('search-count');
    const empty = document.getElementById('no-results');

    if (!searchInput || cards.length === 0) {
        return;
    }

    function normalize(text) {
        return text.trim().toLowerCase();
    }

    function filterTools() {
        const keyword = normalize(searchInput.value);
        let visibleCount = 0;

        cards.forEach(card => {
            const haystack = normalize(`${card.textContent} ${card.dataset.keywords || ''}`);
            const matched = !keyword || haystack.includes(keyword);
            card.hidden = !matched;
            if (matched) {
                visibleCount++;
            }
        });

        empty.hidden = visibleCount !== 0;
        count.textContent = keyword
            ? `找到 ${visibleCount} 个匹配工具`
            : '输入关键词快速定位工具';
    }

    const query = new URLSearchParams(window.location.search).get('q');
    if (query) {
        searchInput.value = query;
    }

    searchInput.addEventListener('input', filterTools);
    filterTools();
});
