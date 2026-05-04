// ========================================
// SheOut - Reports Module
// ========================================

const Reports = {
    async init() {
        this.setupReportForm();
    },

    setupReportForm() {
        const reportForm = document.getElementById('report-form');
        if (reportForm) {
            reportForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    },

    async handleSubmit(e) {
        e.preventDefault();

        if (!Auth.isLoggedIn()) {
            UI.showToast('يجب تسجيل الدخول أولاً', 'error');
            return;
        }

        const category = document.getElementById('report-category').value;
        const title = document.getElementById('report-title').value;
        const details = document.getElementById('report-details').value;

        try {
            UI.showLoading();

            const reportData = {
                reporterId: Auth.getUserId(),
                category: parseInt(category),
                title: title,
                details: details,
                reportDate: new Date().toISOString(),
                status: 0, // Pending
                // Add any other required fields based on clsReport structure
            };

            const reportId = await api.report.create(reportData);

            if (reportId && reportId !== -1) {
                UI.showToast('تم إرسال البلاغ بنجاح', 'success');
                
                // Show notification
                UI.showNotification('📩 بلاغ جديد', `تم إرسال بلاغك رقم #${reportId}`);

                // Reset form
                reportForm.reset();
                
                // Reload reports list
                await this.loadUserReports();
            } else {
                UI.showToast('حدث خطأ في إرسال البلاغ', 'error');
            }
        } catch (error) {
            console.error('Submit report error:', error);
            UI.showToast('حدث خطأ في إرسال البلاغ', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    async loadUserReports() {
        if (!Auth.isLoggedIn()) {
            return;
        }

        try {
            const container = document.getElementById('reports-list');
            if (!container) return;

            UI.showLoading();

            const reports = await api.report.getByReporterId(Auth.getUserId());

            if (reports && reports.length > 0) {
                // Sort by date descending
                reports.sort((a, b) => new Date(b.reportDate) - new Date(a.reportDate));

                container.innerHTML = reports.map(report => this.renderReportCard(report)).join('');
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-flag"></i>
                        <h3>لا توجد بلاغات</h3>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            UI.hideLoading();
        }
    },

    renderReportCard(report) {
        const categoryClass = this.getCategoryClass(report.category);
        const categoryText = this.getCategoryText(report.category);

        return `
            <div class="report-card">
                <div class="report-header">
                    <span class="report-category ${categoryClass}">${categoryText}</span>
                    <span style="font-size:0.85rem;color:var(--text-secondary);">
                        ${UI.formatDate(report.reportDate)}
                    </span>
                </div>
                <h4 class="report-title">${report.title}</h4>
                <p class="report-details">${report.details}</p>
            </div>
        `;
    },

    getCategoryClass(category) {
        switch(category) {
            case 0: return 'category-help';
            case 1: return 'category-bug';
            case 2: return 'category-ask';
            default: return 'category-help';
        }
    },

    getCategoryText(category) {
        switch(category) {
            case 0: return 'مساعدة';
            case 1: return 'مشكلة تقنية';
            case 2: return 'استفسار';
            default: return 'مساعدة';
        }
    },
};

window.Reports = Reports;
