// ========================================
// SheOut - UI Utilities Module
// ========================================

const UI = {
    init() {
        this.setupNavigation();
        this.setupModals();
        this.setupThemeToggle();
        this.setupSearch();
        this.setupHeaderButtons();
    },

    setupNavigation() {
        const navBtns = document.querySelectorAll('.nav-btn');
        
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons and sections
                navBtns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Show corresponding section
                const sectionId = btn.dataset.section;
                document.getElementById(sectionId).classList.add('active');
                
                // Load section-specific data
                this.loadSectionData(sectionId);
            });
        });
    },

    loadSectionData(sectionId) {
        switch(sectionId) {
            case 'home':
                if (window.Products) Products.loadFeaturedProducts();
                if (window.News) News.loadNews();
                break;
            case 'products':
                if (window.Products) Products.loadAllProducts();
                break;
            case 'orders':
                if (window.Orders) Orders.loadUserOrders().catch(err => console.error('Error loading orders:', err));
                break;
            case 'favorites':
                if (window.Favorites) Favorites.loadUserFavorites().catch(err => console.error('Error loading favorites:', err));
                break;
            case 'reports':
                if (window.Reports) Reports.loadUserReports().catch(err => console.error('Error loading reports:', err));
                break;
            case 'settings':
                // Profile is already updated by Auth
                break;
        }
    },

    setupModals() {
        // Close modal buttons
        const closeButtons = document.querySelectorAll('.modal-close, .modal-overlay');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.target === btn || btn.classList.contains('modal-close')) {
                    this.closeModal('product-modal');
                    this.closeModal('cart-modal');
                }
            });
        });

        // Specific close handlers
        const closeModalBtn = document.getElementById('close-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closeModal('product-modal'));
        }

        const closeCartModalBtn = document.getElementById('close-cart-modal');
        if (closeCartModalBtn) {
            closeCartModalBtn.addEventListener('click', () => this.closeModal('cart-modal'));
        }
    },

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    },

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            // Load saved theme
            const savedTheme = localStorage.getItem('sheout_theme') || 'light';
            document.body.setAttribute('data-theme', savedTheme);
            themeToggle.checked = savedTheme === 'dark';

            themeToggle.addEventListener('change', () => {
                const newTheme = themeToggle.checked ? 'dark' : 'light';
                document.body.setAttribute('data-theme', newTheme);
                localStorage.setItem('sheout_theme', newTheme);
            });
        }
    },

    setupSearch() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            let debounceTimer;
            
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const query = e.target.value.trim();
                    if (query.length > 2) {
                        this.searchProducts(query);
                    }
                }, 500);
            });
        }
    },

    async searchProducts(query) {
        try {
            // Navigate to products section
            this.navigateToSection('products');
            
            // Search through products
            if (window.Products) {
                await Products.searchProducts(query);
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    },

    navigateToSection(sectionId) {
        const navBtn = document.querySelector(`.nav-btn[data-section="${sectionId}"]`);
        if (navBtn) {
            navBtn.click();
        }
    },

    setupHeaderButtons() {
        // Cart button
        const cartBtn = document.getElementById('cart-btn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                if (window.Cart) Cart.openCart();
            });
        }

        // Favorites button
        const favoritesBtn = document.getElementById('favorites-btn');
        if (favoritesBtn) {
            favoritesBtn.addEventListener('click', () => {
                this.navigateToSection('favorites');
            });
        }

        // Notifications button
        const notificationsBtn = document.getElementById('notifications-btn');
        if (notificationsBtn) {
            notificationsBtn.addEventListener('click', () => {
                this.toggleNotificationsPanel();
            });
        }

        // Profile button
        const profileBtn = document.getElementById('profile-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                this.navigateToSection('settings');
            });
        }

        // Close notifications panel
        const closeNotificationsBtn = document.getElementById('close-notifications');
        if (closeNotificationsBtn) {
            closeNotificationsBtn.addEventListener('click', () => {
                this.closeNotificationsPanel();
            });
        }
    },

    toggleNotificationsPanel() {
        const panel = document.getElementById('notifications-panel');
        if (panel) {
            panel.classList.toggle('hidden');
        }
    },

    closeNotificationsPanel() {
        const panel = document.getElementById('notifications-panel');
        if (panel) {
            panel.classList.add('hidden');
        }
    },

    showNotification(title, message) {
        const notificationsList = document.getElementById('notifications-list');
        if (notificationsList) {
            const notification = document.createElement('div');
            notification.className = 'notification-item';
            notification.innerHTML = `
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            `;
            
            notificationsList.insertBefore(notification, notificationsList.firstChild);
            
            // Update badge
            this.updateNotificationBadge();
        }
    },

    updateNotificationBadge() {
        const badge = document.getElementById('notification-badge');
        const notificationsList = document.getElementById('notifications-list');
        if (badge && notificationsList) {
            const count = notificationsList.children.length;
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    },

    updateCartBadge(count) {
        const badge = document.getElementById('cart-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    },

    updateFavoritesBadge(count) {
        const badge = document.getElementById('favorites-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    },

    showToast(message, type = 'info') {
        // Remove existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    showLoading() {
        // Could add a loading overlay here
        document.body.style.cursor = 'wait';
    },

    hideLoading() {
        document.body.style.cursor = '';
    },

    formatPrice(price) {
        return `${price} ر.س`;
    },

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('ar-SA', options);
    },

    // Render product card HTML
    renderProductCard(product, showQuickActions = true) {
        const placeholderIcons = ['fa-tshirt', 'fa-shoe-prints', 'fa-gem', 'fa-pump-soap', 'fa-mobile-alt', 'fa-home'];
        const randomIcon = placeholderIcons[Math.floor(Math.random() * placeholderIcons.length)];
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    <i class="fas ${randomIcon}"></i>
                </div>
                <div class="product-card-content">
                    <h3 class="product-card-title">${product.name || product.productName || 'منتج غير معروف'}</h3>
                    <p class="product-card-price">${this.formatPrice(product.price || 0)}</p>
                    ${showQuickActions ? `
                        <div class="product-card-actions">
                            <button class="btn-add-cart" onclick="event.stopPropagation(); Cart.addToCart(${product.id})">
                                <i class="fas fa-shopping-cart"></i>
                            </button>
                            <button class="btn-add-fav" onclick="event.stopPropagation(); Favorites.toggleFavorite(${product.id})">
                                <i class="fas fa-heart"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },
};

window.UI = UI;
