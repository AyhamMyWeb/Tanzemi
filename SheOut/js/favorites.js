// ========================================
// SheOut - Favorites Module
// ========================================

const Favorites = {
    favorites: [],

    async init() {
        // Favorites are loaded when user is logged in
    },

    async loadUserFavorites() {
        if (!Auth.isLoggedIn()) {
            return;
        }

        try {
            const container = document.getElementById('favorites-products');
            if (!container) return;

            UI.showLoading();

            // Get user's favorites
            this.favorites = await api.favourite.getByUserId(Auth.getUserId());

            if (this.favorites && this.favorites.length > 0) {
                // Load product details for each favorite
                const products = await Promise.all(
                    this.favorites.map(async fav => {
                        try {
                            // Handle both camelCase and PascalCase property names
                            const productId = fav.productId || fav.productID;
                            if (!productId) {
                                console.warn('Favorite missing productId:', fav);
                                return null;
                            }
                            return await api.product.getById(productId);
                        } catch (e) {
                            console.error('Error loading product for favorite:', e);
                            return null;
                        }
                    })
                );

                // Filter out null products
                const validProducts = products.filter(p => p !== null);

                if (validProducts.length > 0) {
                    container.innerHTML = validProducts
                        .map(product => UI.renderProductCard(product))
                        .join('');

                    // Add click handlers
                    Products.addProductClickHandlers('#favorites-products');
                } else {
                    container.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-heart-broken"></i>
                            <h3>قائمة المفضلة فارغة</h3>
                            <p>أضيفي منتجاتك المفضلة هنا</p>
                        </div>
                    `;
                }
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-heart-broken"></i>
                        <h3>قائمة المفضلة فارغة</h3>
                        <p>أضيفي منتجاتك المفضلة هنا</p>
                    </div>
                `;
            }

            // Update badge
            UI.updateFavoritesBadge(this.favorites.length);
        } catch (error) {
            console.error('Error loading favorites:', error);
        } finally {
            UI.hideLoading();
        }
    },

    async toggleFavorite(productId) {
        if (!Auth.isLoggedIn()) {
            UI.showToast('يجب تسجيل الدخول أولاً', 'error');
            return;
        }

        try {
            UI.showLoading();

            // Check if already favorited
            const exists = await api.favourite.existsByUserAndProduct(Auth.getUserId(), productId);

            if (exists) {
                // Remove from favorites
                const fav = this.favorites.find(f => (f.productId || f.productID) === productId);
                if (fav) {
                    const deleted = await api.favourite.delete(fav.id);
                    if (deleted) {
                        this.favorites = this.favorites.filter(f => (f.productId || f.productID) !== productId);
                        UI.showToast('تم الحذف من المفضلة', 'success');
                    }
                }
            } else {
                // Add to favorites
                const favouriteData = {
                    userId: Auth.getUserId(),
                    productId: productId,
                    // Add any other required fields based on clsFavouriteProduct structure
                };

                const favId = await api.favourite.create(favouriteData);

                if (favId && favId !== -1) {
                    this.favorites.push({ id: favId, userId: Auth.getUserId(), productId });
                    UI.showToast('تمت الإضافة للمفضلة', 'success');
                    
                    // Show notification
                    UI.showNotification('❤️ أضيف للمفضلة', '');
                } else {
                    UI.showToast('حدث خطأ في الإضافة للمفضلة', 'error');
                }
            }

            // Update badge
            UI.updateFavoritesBadge(this.favorites.length);

            // Refresh favorites view if on favorites page
            const favoritesSection = document.getElementById('favorites');
            if (favoritesSection.classList.contains('active')) {
                await this.loadUserFavorites();
            }
        } catch (error) {
            console.error('Toggle favorite error:', error);
            UI.showToast('حدث خطأ', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    async isFavorite(productId) {
        if (!Auth.isLoggedIn()) {
            return false;
        }

        try {
            return await api.favourite.existsByUserAndProduct(Auth.getUserId(), productId);
        } catch (error) {
            return false;
        }
    },

    getFavoritesCount() {
        return this.favorites.length;
    },
};

window.Favorites = Favorites;
