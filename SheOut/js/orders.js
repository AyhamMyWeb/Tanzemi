// ========================================
// SheOut - Orders Module
// ========================================

const Orders = {
    async init() {
        // Orders are loaded when user navigates to the orders section
    },

    async loadUserOrders() {
        if (!Auth.isLoggedIn()) {
            return;
        }

        try {
            const container = document.getElementById('orders-list');
            if (!container) return;

            UI.showLoading();

            const orders = await api.order.getByUserId(Auth.getUserId());

            if (orders && orders.length > 0) {
                // Sort by date descending
                orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

                container.innerHTML = await Promise.all(
                    orders.map(async order => await this.renderOrderCard(order))
                ).then(cards => cards.join(''));
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <h3>لا توجد طلبات بعد</h3>
                        <p>ابدئي التسوق الآن!</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            UI.showToast('حدث خطأ في تحميل الطلبات', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    async renderOrderCard(order) {
        try {
            // Get order items
            const items = await api.item.getByOrderId(order.id);
            
            const statusClass = this.getStatusClass(order.status);
            const statusText = this.getStatusText(order.status);

            let itemsHtml = '';
            if (items && items.length > 0) {
                for (const item of items) {
                    // Get product details for each item
                    let productName = 'منتج';
                    try {
                        const product = await api.product.getById(item.productId);
                        productName = product ? (product.name || product.productName) : 'منتج';
                    } catch (e) {
                        console.error('Error getting product:', e);
                    }

                    itemsHtml += `
                        <div class="order-item">
                            <div class="order-item-image">
                                <i class="fas fa-box" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:var(--text-secondary);"></i>
                            </div>
                            <div class="order-item-details">
                                <div class="order-item-name">${productName}</div>
                                <div class="order-item-price">${UI.formatPrice(item.price)} × ${item.quantity}</div>
                            </div>
                        </div>
                    `;
                }
            }

            return `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <div class="order-id">طلب #${order.id}</div>
                            <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:5px;">
                                ${UI.formatDate(order.orderDate)}
                            </div>
                        </div>
                        <span class="order-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="order-items">
                        ${itemsHtml}
                    </div>
                    <div class="order-total">
                        <span>المجموع الكلي:</span>
                        <span class="text-gold">${UI.formatPrice(order.totalAmount)}</span>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error rendering order:', error);
            return '';
        }
    },

    getStatusClass(status) {
        switch(status) {
            case 0: return 'status-pending';
            case 1: return 'status-completed';
            case 2: return 'status-cancelled';
            default: return 'status-pending';
        }
    },

    getStatusText(status) {
        switch(status) {
            case 0: return 'قيد المعالجة';
            case 1: return 'مكتمل';
            case 2: return 'ملغي';
            default: return 'قيد المعالجة';
        }
    },

    async cancelOrder(orderId) {
        if (!confirm('هل أنتِ متأكدة من إلغاء هذا الطلب؟')) {
            return;
        }

        try {
            UI.showLoading();

            const success = await api.order.update(orderId, { status: 2 });

            if (success) {
                UI.showToast('تم إلغاء الطلب', 'success');
                await this.loadUserOrders();
            } else {
                UI.showToast('حدث خطأ في إلغاء الطلب', 'error');
            }
        } catch (error) {
            console.error('Cancel order error:', error);
            UI.showToast('حدث خطأ في إلغاء الطلب', 'error');
        } finally {
            UI.hideLoading();
        }
    },
};

window.Orders = Orders;
