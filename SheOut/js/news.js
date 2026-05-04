// ========================================
// SheOut - News Module
// ========================================

const News = {
    async init() {
        // News is loaded on home page
    },

    async loadNews() {
        try {
            const container = document.getElementById('news-list');
            if (!container) return;

            const newsList = await api.news.getAll();

            if (newsList && newsList.length > 0) {
                // Sort by date descending (assuming news has a date field)
                newsList.sort((a, b) => new Date(b.date || b.id) - new Date(a.date || a.id));

                container.innerHTML = newsList.map(news => this.renderNewsItem(news)).join('');
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-newspaper"></i>
                        <h3>لا توجد أخبار حالياً</h3>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading news:', error);
            // Don't show error toast for news as it's not critical
        }
    },

    renderNewsItem(news) {
        const date = news.date ? UI.formatDate(news.date) : '';
        const message = news.message || news.newMessage || news.content || '';

        return `
            <div class="news-item">
                <div class="news-content">${message}</div>
                ${date ? `<div class="news-date">${date}</div>` : ''}
            </div>
        `;
    },
};

window.News = News;
