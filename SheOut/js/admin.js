// Admin Dashboard Module for SheOut

const API_BASE = 'http://sheout.runasp.net/api';

// Check admin authentication on load
document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('sheout_user') || 'null');
    
    if (!user || user.role !== 1) { // Assuming role 1 is admin
        alert('غير مسموح لك بالدخول هنا. يجب أن تكون مسؤولاً.');
        window.location.href = '../index.html';
        return;
    }
    
    document.getElementById('adminUsername').textContent = `مرحباً، ${user.displayName || user.username}`;
    loadDashboard();
});

// Load dashboard statistics and data
async function loadDashboard() {
    await loadStats();
    await loadProducts();
    await loadReports();
    await loadNews();
    await loadOrders();
}

// Load statistics
async function loadStats() {
    try {
        const [products, orders, reports, users] = await Promise.all([
            fetch(`${API_BASE}/Product`).then(r => r.json()),
            fetch(`${API_BASE}/Order`).then(r => r.json()),
            fetch(`${API_BASE}/Report`).then(r => r.json()),
            fetch(`${API_BASE}/User`).then(r => r.json())
        ]);
        
        document.getElementById('totalProducts').textContent = products.length || 0;
        document.getElementById('totalOrders').textContent = orders.length || 0;
        document.getElementById('totalReports').textContent = reports.length || 0;
        document.getElementById('totalUsers').textContent = users.length || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Show section
function showSection(sectionName) {
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.admin-nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`${sectionName}-section`).classList.add('active');
    event.target.classList.add('active');
}

// Products Management
let allProducts = [];

async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/Product`);
        allProducts = await response.json();
        renderProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsGrid').innerHTML = '<p>فشل تحميل المنتجات</p>';
    }
}

async function renderProducts() {
    const grid = document.getElementById('productsGrid');
    
    if (allProducts.length === 0) {
        grid.innerHTML = '<p>لا توجد منتجات حالياً</p>';
        return;
    }
    
    grid.innerHTML = allProducts.map(product => `
        <div class="admin-card">
            <img src="${product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}" alt="${product.productName}">
            <h3>${product.productName}</h3>
            <p>${product.productDescription || 'لا يوجد وصف'}</p>
            <p><strong>السعر:</strong> $${product.price}</p>
            <div style="margin-top: 15px;">
                <button class="btn-edit" onclick="editProduct(${product.id})">تعديل</button>
                <button class="btn-danger" onclick="deleteProduct(${product.id})">حذف</button>
            </div>
        </div>
    `).join('');
}

function openProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const title = document.getElementById('modalTitle');
    
    form.reset();
    
    if (productId) {
        const product = allProducts.find(p => p.id === productId);
        if (product) {
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.productName;
            document.getElementById('productDescription').value = product.productDescription || '';
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productImage').value = product.imageUrl || '';
            title.textContent = 'تعديل المنتج';
        }
    } else {
        document.getElementById('productId').value = '';
        title.textContent = 'إضافة منتج جديد';
    }
    
    modal.classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}

async function saveProduct(event) {
    event.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const productData = {
        productName: document.getElementById('productName').value,
        productDescription: document.getElementById('productDescription').value,
        price: parseFloat(document.getElementById('productPrice').value),
        imageUrl: document.getElementById('productImage').value || null
    };
    
    try {
        let response;
        
        if (productId) {
            // Update existing product
            response = await fetch(`${API_BASE}/Product/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
        } else {
            // Create new product
            response = await fetch(`${API_BASE}/Product`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
        }
        
        if (response.ok) {
            alert('تم حفظ المنتج بنجاح!');
            closeProductModal();
            await loadProducts();
            await loadStats();
        } else {
            alert('فشل حفظ المنتج');
        }
    } catch (error) {
        console.error('Error saving product:', error);
        alert('حدث خطأ أثناء الحفظ');
    }
}

async function editProduct(productId) {
    openProductModal(productId);
}

async function deleteProduct(productId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    
    try {
        const response = await fetch(`${API_BASE}/Product/${productId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('تم حذف المنتج بنجاح');
            await loadProducts();
            await loadStats();
        } else {
            alert('فشل حذف المنتج');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('حدث خطأ أثناء الحذف');
    }
}

// Reports Management
async function loadReports() {
    try {
        const response = await fetch(`${API_BASE}/Report`);
        const reports = await response.json();
        renderReports(reports);
    } catch (error) {
        console.error('Error loading reports:', error);
        document.getElementById('reportsList').innerHTML = '<p>فشل تحميل البلاغات</p>';
    }
}

function renderReports(reports) {
    const list = document.getElementById('reportsList');
    
    if (reports.length === 0) {
        list.innerHTML = '<p>لا توجد بلاغات حالياً</p>';
        return;
    }
    
    const categories = {
        0: 'مساعدة',
        1: 'مشكلة فنية',
        2: 'استفسار'
    };
    
    const categoryClasses = {
        0: 'category-help',
        1: 'category-bug',
        2: 'category-ask'
    };
    
    list.innerHTML = reports.map(report => `
        <div class="report-card">
            <span class="report-category ${categoryClasses[report.reportCategory]}">${categories[report.reportCategory]}</span>
            <h3>${report.reportTitle || 'بدون عنوان'}</h3>
            <p><strong>من:</strong> مستخدم #${report.reporterID}</p>
            <p>${report.reportMessage}</p>
            <small style="color: #888;">${new Date(report.reportDate || Date.now()).toLocaleDateString('ar-EG')}</small>
        </div>
    `).join('');
}

// News Management
async function loadNews() {
    try {
        const response = await fetch(`${API_BASE}/News`);
        const news = await response.json();
        
        if (news.length > 0) {
            document.getElementById('newsMessage').value = news[0].newsMessage || '';
        }
        
        renderNews(news);
    } catch (error) {
        console.error('Error loading news:', error);
    }
}

function renderNews(news) {
    const list = document.getElementById('newsList');
    
    if (news.length === 0) {
        list.innerHTML = '<p>لا توجد أخبار حالياً</p>';
        return;
    }
    
    list.innerHTML = news.map(item => `
        <div class="report-card" style="border-right-color: var(--secondary);">
            <p>${item.newsMessage}</p>
            <small style="color: #888;">${new Date(item.createdDate || Date.now()).toLocaleDateString('ar-EG')}</small>
            <button class="btn-danger" style="margin-top: 10px;" onclick="deleteNews(${item.id})">حذف</button>
        </div>
    `).join('');
}

async function saveNews() {
    const message = document.getElementById('newsMessage').value.trim();
    
    if (!message) {
        alert('الرجاء إدخال نص الإشعار');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/News`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(message)
        });
        
        if (response.ok) {
            alert('تم حفظ الإشعار بنجاح!');
            await loadNews();
        } else {
            alert('فشل حفظ الإشعار');
        }
    } catch (error) {
        console.error('Error saving news:', error);
        alert('حدث خطأ أثناء الحفظ');
    }
}

async function deleteNews(newsId) {
    if (!confirm('هل أنت متأكد من حذف هذا الخبر؟')) return;
    
    try {
        const response = await fetch(`${API_BASE}/News?newsID=${newsId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('تم حذف الخبر بنجاح');
            await loadNews();
        } else {
            alert('فشل حذف الخبر');
        }
    } catch (error) {
        console.error('Error deleting news:', error);
        alert('حدث خطأ أثناء الحذف');
    }
}

// Orders Management
async function loadOrders() {
    try {
        const response = await fetch(`${API_BASE}/Order`);
        const orders = await response.json();
        renderOrders(orders);
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('ordersTableBody').innerHTML = '<tr><td colspan="5">فشل تحميل الطلبات</td></tr>';
    }
}

async function renderOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">لا توجد طلبات حالياً</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>مستخدم #${order.orderedUserID}</td>
            <td>${new Date(order.orderDate || Date.now()).toLocaleDateString('ar-EG')}</td>
            <td>$${order.orderAmount}</td>
            <td><button class="btn-edit" onclick="viewOrderDetails(${order.id})">عرض التفاصيل</button></td>
        </tr>
    `).join('');
}

async function viewOrderDetails(orderId) {
    try {
        const response = await fetch(`${API_BASE}/Item/FindByOrderID/${orderId}`);
        const items = await response.json();
        
        let details = `تفاصيل الطلب #${orderId}:\n\n`;
        items.forEach((item, index) => {
            details += `${index + 1}. منتج #${item.productID} - الكمية: ${item.quantity} - السعر: $${item.productPrice}\n`;
        });
        
        alert(details);
    } catch (error) {
        console.error('Error loading order details:', error);
        alert('فشل تحميل تفاصيل الطلب');
    }
}

// Logout
function logout() {
    localStorage.removeItem('sheout_user');
    window.location.href = '../index.html';
}
