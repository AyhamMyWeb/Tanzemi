// ========================================
// SheOut - Main Application Entry Point
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('SheOut App Initializing...');
    
    // Initialize all modules
    UI.init();
    Auth.init();
    Cart.init();
    Reports.init();
    
    // Initialize products (loads all products)
    Products.init();
    
    // Setup filter and sort handlers
    setupFilters();
    
    // Setup profile save handler
    setupProfileSave();
    
    // Setup admin button handler
    setupAdminButton();
    
    console.log('SheOut App Initialized Successfully!');
});

function setupFilters() {
    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            Products.filterByCategory(e.target.value);
        });
    }

    // Price sort
    const priceSort = document.getElementById('price-sort');
    if (priceSort) {
        priceSort.addEventListener('change', (e) => {
            Products.sortByPrice(e.target.value);
        });
    }
}

function setupProfileSave() {
    const saveProfileBtn = document.getElementById('save-profile-btn');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', () => {
            Auth.updateProfile();
        });
    }
}

function setupAdminButton() {
    const adminBtn = document.getElementById('admin-btn');
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            const user = JSON.parse(localStorage.getItem('sheout_user') || 'null');
            if (user && user.role === 1) {
                window.location.href = 'pages/admin.html';
            } else {
                alert('غير مسموح لك بالدخول هنا.');
            }
        });
    }
}

// Handle browser back button for navigation
window.addEventListener('popstate', () => {
    // Could implement hash-based routing here if needed
});

// Service Worker Registration (for PWA support in future)
if ('serviceWorker' in navigator) {
    // Uncomment to enable PWA
    // navigator.serviceWorker.register('/sw.js')
    //     .then(registration => console.log('SW registered:', registration))
    //     .catch(error => console.log('SW registration failed:', error));
}

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    // Could send error to analytics here
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    // Could send error to analytics here
});
