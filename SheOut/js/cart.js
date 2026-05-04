// ========================================
// SheOut - Cart Module
// ========================================

const Cart = {
    items: [],

    init() {
        this.loadCart();
        this.setupCheckout();
    },

    loadCart() {
        const savedCart = localStorage.getItem('sheout_cart');
        if (savedCart) {
            this.items = JSON.parse(savedCart);
        }
        this.updateBadge();
    },

    saveCart() {
        localStorage.setItem('sheout_cart', JSON.stringify(this.items));
        this.updateBadge();
    },

    async addToCart(productId) {
        try {
            // Check if user is logged in
            if (!Auth.isLoggedIn()) {
                UI.showToast('يجب تسجيل الدخول أولاً', 'error');
                return;
            }

            // Get product details
            const product = await api.product.getById(productId);
            
            if (!product) {
                UI.showToast('المنتج غير موجود', 'error');
                return;
            }

            // Check if item already in cart
            const existingItem = this.items.find(item => item.productId === productId);
            
            if (existingItem) {
                existingItem.quantity++;
            } else {
                this.items.push({
                    productId: productId,
                    name: product.name || product.productName,
                    price: product.price || 0,
                    quantity: 1,
                    image: null
                });
            }

            this.saveCart();
            UI.showToast('تمت الإضافة إلى السلة', 'success');
            
            // Show notification
            UI.showNotification('🛒 أضيف للسلة', product.name || product.productName);
        } catch (error) {
            console.error('Add to cart error:', error);
            UI.showToast('حدث خطأ في الإضافة للسلة', 'error');
        }
    },

    removeFromCart(productId) {
        this.items = this.items.filter(item => item.productId !== productId);
        this.saveCart();
        this.renderCartItems();
        UI.showToast('تم الحذف من السلة', 'success');
    },

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.productId === productId);
        
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
                this.renderCartItems();
            }
        }
    },

    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    updateBadge() {
        const count = this.items.reduce((total, item) => total + item.quantity, 0);
        UI.updateCartBadge(count);
    },

    openCart() {
        if (!Auth.isLoggedIn()) {
            UI.showToast('يجب تسجيل الدخول أولاً', 'error');
            return;
        }

        this.renderCartItems();
        UI.openModal('cart-modal');
    },

    renderCartItems() {
        const container = document.getElementById('cart-items');
        const totalElement = document.getElementById('cart-total-amount');
        
        if (!container) return;

        if (this.items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>السلة فارغة</h3>
                    <p>أضيفي بعض المنتجات للتسوق</p>
                </div>
            `;
            if (totalElement) totalElement.textContent = '0 ر.س';
            return;
        }

        container.innerHTML = this.items.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <i class="fas fa-box" style="font-size:2rem;color:var(--text-secondary);display:flex;align-items:center;justify-content:center;width:100%;height:100%;"></i>
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${UI.formatPrice(item.price)}</div>
                    <div class="cart-item-quantity">
                        <button class="qty-btn" onclick="Cart.updateQuantity(${item.productId}, ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="Cart.updateQuantity(${item.productId}, ${item.quantity + 1})">+</button>
                        <button class="qty-btn" onclick="Cart.removeFromCart(${item.productId})" style="margin-right:auto;border-color:var(--danger);color:var(--danger);">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        if (totalElement) {
            totalElement.textContent = UI.formatPrice(this.getTotal());
        }
    },

    setupCheckout() {
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.checkout());
        }
    },

    async checkout() {
        if (this.items.length === 0) {
            UI.showToast('السلة فارغة', 'error');
            return;
        }

        try {
            UI.showLoading();

            // Create order
            const orderData = {
                userId: Auth.getUserId(),
                orderDate: new Date().toISOString(),
                totalAmount: this.getTotal(),
                status: 0, // Pending
                // Add any other required fields based on clsOrder structure
            };

            const orderId = await api.order.create(orderData);

            if (orderId && orderId !== -1) {
                // Create order items
                for (const item of this.items) {
                    const itemData = {
                        orderId: orderId,
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price,
                        // Add any other required fields based on clsItem structure
                    };
                    
                    await api.item.create(itemData);
                }

                // Clear cart
                this.items = [];
                this.saveCart();

                UI.closeModal('cart-modal');
                UI.showToast('تم إنشاء الطلب بنجاح!', 'success');
                
                // Show notification
                UI.showNotification('✅ طلب جديد', `تم إنشاء طلبك رقم #${orderId}`);

                // Navigate to orders page
                setTimeout(() => {
                    UI.navigateToSection('orders');
                    Orders.loadUserOrders();
                }, 1500);
            } else {
                UI.showToast('حدث خطأ في إنشاء الطلب', 'error');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            UI.showToast('حدث خطأ في إتمام الشراء', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    clearCart() {
        this.items = [];
        this.saveCart();
    },
};

window.Cart = Cart;
