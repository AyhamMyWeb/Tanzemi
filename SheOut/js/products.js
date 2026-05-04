// ========================================
// SheOut - Products Module
// ========================================

const Products = {
    allProducts: [],
    currentProduct: null,

    async init() {
        await this.loadAllProducts();
        this.setupProductModal();
    },

    async loadAllProducts() {
        try {
            const container = document.getElementById('all-products');
            if (!container) return;

            UI.showLoading();
            
            this.allProducts = await api.product.getAll();
            
            if (this.allProducts && this.allProducts.length > 0) {
                container.innerHTML = this.allProducts
                    .map(product => UI.renderProductCard(product))
                    .join('');
                
                // Add click handlers to product cards
                this.addProductClickHandlers();
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <h3>لا توجد منتجات حالياً</h3>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading products:', error);
            UI.showToast('حدث خطأ في تحميل المنتجات', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    async loadFeaturedProducts() {
        try {
            const container = document.getElementById('featured-products');
            if (!container) return;

            if (this.allProducts.length === 0) {
                this.allProducts = await api.product.getAll();
            }

            // Show first 4-8 products as featured
            const featured = this.allProducts.slice(0, 8);
            
            if (featured.length > 0) {
                container.innerHTML = featured
                    .map(product => UI.renderProductCard(product))
                    .join('');
                
                this.addProductClickHandlers('#featured-products');
            }
        } catch (error) {
            console.error('Error loading featured products:', error);
        }
    },

    addProductClickHandlers(containerSelector = '#all-products') {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const productCards = container.querySelectorAll('.product-card');
        productCards.forEach(card => {
            card.addEventListener('click', () => {
                const productId = card.dataset.productId;
                this.showProductDetails(productId);
            });
        });
    },

    async showProductDetails(productId) {
        try {
            const product = await api.product.getById(productId);
            
            if (product) {
                this.currentProduct = product;
                
                // Get product images
                const images = await api.productImage.getByProductId(productId);
                
                // Populate modal
                document.getElementById('product-name').textContent = product.name || product.productName || 'منتج';
                document.getElementById('product-price').textContent = UI.formatPrice(product.price || 0);
                document.getElementById('product-description').textContent = product.description || 'لا يوجد وصف متاح';
                
                // Render images or placeholder
                const imagesContainer = document.getElementById('product-images');
                if (images && images.length > 0) {
                    imagesContainer.innerHTML = `<img src="${images[0].imageUrl}" alt="${product.name}" style="max-width:100%;max-height:400px;border-radius:15px;">`;
                } else {
                    imagesContainer.innerHTML = '<i class="fas fa-image"></i>';
                }
                
                // Update favorite button state
                const favBtn = document.getElementById('add-to-favorites-btn');
                if (favBtn && Auth.isLoggedIn()) {
                    const isFav = await api.favourite.existsByUserAndProduct(Auth.getUserId(), productId);
                    favBtn.classList.toggle('active', isFav);
                }
                
                UI.openModal('product-modal');
            }
        } catch (error) {
            console.error('Error loading product details:', error);
            UI.showToast('حدث خطأ في تحميل تفاصيل المنتج', 'error');
        }
    },

    setupProductModal() {
        // Add to cart button
        const addToCartBtn = document.getElementById('add-to-cart-btn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => {
                if (!Auth.isLoggedIn()) {
                    UI.showToast('يجب تسجيل الدخول أولاً', 'error');
                    return;
                }
                
                if (this.currentProduct) {
                    Cart.addToCart(this.currentProduct.id);
                    UI.closeModal('product-modal');
                }
            });
        }

        // Add to favorites button
        const addToFavBtn = document.getElementById('add-to-favorites-btn');
        if (addToFavBtn) {
            addToFavBtn.addEventListener('click', async () => {
                if (!Auth.isLoggedIn()) {
                    UI.showToast('يجب تسجيل الدخول أولاً', 'error');
                    return;
                }
                
                if (this.currentProduct) {
                    await Favorites.toggleFavorite(this.currentProduct.id);
                    
                    // Update button state
                    const isFav = await api.favourite.existsByUserAndProduct(Auth.getUserId(), this.currentProduct.id);
                    addToFavBtn.classList.toggle('active', isFav);
                }
            });
        }
    },

    async searchProducts(query) {
        try {
            const container = document.getElementById('all-products');
            if (!container) return;

            UI.showLoading();

            // Search by name
            const filtered = this.allProducts.filter(p => 
                (p.name || p.productName || '').toLowerCase().includes(query.toLowerCase())
            );

            if (filtered.length > 0) {
                container.innerHTML = filtered
                    .map(product => UI.renderProductCard(product))
                    .join('');
                
                this.addProductClickHandlers();
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <h3>لم يتم العثور على نتائج</h3>
                        <p>جربي البحث بكلمات أخرى</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            UI.hideLoading();
        }
    },

    async filterByCategory(category) {
        try {
            const container = document.getElementById('all-products');
            if (!container) return;

            UI.showLoading();

            const filtered = category 
                ? this.allProducts.filter(p => p.categoryId == category)
                : this.allProducts;

            container.innerHTML = filtered
                .map(product => UI.renderProductCard(product))
                .join('');

            this.addProductClickHandlers();
        } catch (error) {
            console.error('Filter error:', error);
        } finally {
            UI.hideLoading();
        }
    },

    async sortByPrice(order) {
        try {
            const container = document.getElementById('all-products');
            if (!container) return;

            UI.showLoading();

            const sorted = [...this.allProducts].sort((a, b) => {
                if (order === 'asc') return (a.price || 0) - (b.price || 0);
                if (order === 'desc') return (b.price || 0) - (a.price || 0);
                return 0;
            });

            container.innerHTML = sorted
                .map(product => UI.renderProductCard(product))
                .join('');

            this.addProductClickHandlers();
        } catch (error) {
            console.error('Sort error:', error);
        } finally {
            UI.hideLoading();
        }
    },
};

window.Products = Products;
