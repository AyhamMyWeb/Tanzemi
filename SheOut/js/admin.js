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
            fetch(`${API_BASE}/Product`).then(r => r.json()).catch(() => []),
            fetch(`${API_BASE}/Order`).then(r => r.json()).catch(() => []),
            fetch(`${API_BASE}/Report`).then(r => r.json()).catch(() => []),
            fetch(`${API_BASE}/User`).then(r => r.json()).catch(() => [])
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
    
    const section = document.getElementById(`${sectionName}-section`);
    if (section) {
        section.classList.add('active');
    }
    
    // Update active button
    const activeBtn = event.target.closest('.admin-nav-btn');
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Update header
    const headers = {
        'dashboard': 'لوحة التحكم',
        'products': 'إدارة المنتجات',
        'orders': 'إدارة الطلبات',
        'reports': 'بلاغات الدعم الفني',
        'news': 'إدارة الأخبار'
    };
    document.getElementById('pageHeader').textContent = headers[sectionName] || 'لوحة التحكم';
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
    
    if (!allProducts || allProducts.length === 0) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><h3>لا توجد منتجات حالياً</h3></div>';
        return;
    }
    
    // Fetch images for all products
    const productsWithImages = await Promise.all(allProducts.map(async (product) => {
        try {
            const images = await fetch(`${API_BASE}/ProductImage/FindByProductID/${product.id}`).then(r => r.json());
            return {
                ...product,
                imageUrl: images && images.length > 0 ? images[0].imageUrl : null
            };
        } catch (e) {
            return { ...product, imageUrl: null };
        }
    }));
    
    grid.innerHTML = productsWithImages.map(product => `
        <div class="admin-card">
            <img src="${product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                 alt="${product.productName}" 
                 onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            <h3>${product.productName}</h3>
            <p>${product.productDescription ? product.productDescription.substring(0, 100) + '...' : 'لا يوجد وصف'}</p>
            <p><strong>السعر:</strong> $${product.price}</p>
            <div style="margin-top: 15px;">
                <button class="btn-edit" onclick="editProduct(${product.id})">تعديل</button>
                <button class="btn-danger" onclick="deleteProduct(${product.id})">حذف</button>
            </div>
        </div>
    `).join('');
}

// Open product modal for adding new product
function openProductModal() {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const title = document.getElementById('modalTitle');
    
    form.reset();
    document.getElementById('productId').value = '';
    title.textContent = 'إضافة منتج جديد';
    
    modal.classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}

async function saveProduct(event) {
    event.preventDefault();
    
    const productId = document.getElementById('productId').value.trim();
    const imageUrl = document.getElementById('productImage').value.trim();
    
    // Validate product data
    const productName = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    
    if (!productName || isNaN(price) || price <= 0) {
        alert('الرجاء إدخال اسم المنتج وسعر صحيح');
        return;
    }
    
    const productData = {
        productName: productName,
        productDescription: document.getElementById('productDescription').value.trim() || '',
        price: price
    };
    
    try {
        let result;
        
        if (productId && productId !== '') {
            // Update existing product
            console.log('Updating product with ID:', productId);
            
            // First update the product
            const updateResponse = await fetch(`${API_BASE}/Product/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
            
            const updateResult = await updateResponse.text();
            console.log('Update response:', updateResult);
            
            // Handle image separately if provided
            if (imageUrl) {
                try {
                    // Check if product already has images
                    const existingImages = await fetch(`${API_BASE}/ProductImage/FindByProductID/${productId}`).then(r => r.json());
                    
                    if (existingImages && existingImages.length > 0) {
                        // Update first image
                        const imgData = {
                            productID: parseInt(productId),
                            imageUrl: imageUrl
                        };
                        await fetch(`${API_BASE}/ProductImage/${existingImages[0].id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(imgData)
                        });
                    } else {
                        // Create new image
                        const imgData = {
                            productID: parseInt(productId),
                            imageUrl: imageUrl
                        };
                        await fetch(`${API_BASE}/ProductImage`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(imgData)
                        });
                    }
                } catch (imgError) {
                    console.error('Error handling image:', imgError);
                }
            }
            
            result = updateResult;
        } else {
            // Create new product
            console.log('Creating new product');
            const createResponse = await fetch(`${API_BASE}/Product`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
            
            result = await createResponse.text();
            console.log('Create response:', result);
            
            // If image URL provided and product was created successfully
            if (imageUrl && result && result !== '-1') {
                try {
                    const newProductId = parseInt(result);
                    const imgData = {
                        productID: newProductId,
                        imageUrl: imageUrl
                    };
                    await fetch(`${API_BASE}/ProductImage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(imgData)
                    });
                } catch (imgError) {
                    console.error('Error creating image:', imgError);
                }
            }
        }
        
        console.log('Final result:', result);
        
        if (result === 'true' || result === 'True' || (result && !isNaN(parseInt(result)) && parseInt(result) !== -1)) {
            alert('تم حفظ المنتج بنجاح!');
            closeProductModal();
            await loadProducts();
            await loadStats();
        } else {
            alert(`فشل حفظ المنتج. الاستجابة: ${result}`);
        }
    } catch (error) {
        console.error('Error saving product:', error);
        alert('حدث خطأ أثناء الحفظ: ' + error.message);
    }
}

async function editProduct(productId) {
    try {
        // Fetch product details
        const product = await fetch(`${API_BASE}/Product/FindByID/${productId}`).then(r => r.json());
        
        if (!product) {
            alert('المنتج غير موجود');
            return;
        }
        
        // Fetch product images
        let imageUrl = '';
        try {
            const images = await fetch(`${API_BASE}/ProductImage/FindByProductID/${productId}`).then(r => r.json());
            if (images && images.length > 0) {
                imageUrl = images[0].imageUrl || '';
            }
        } catch (imgError) {
            console.log('No images found for product:', productId);
        }
        
        // Populate form fields
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.productName || '';
        document.getElementById('productDescription').value = product.productDescription || '';
        document.getElementById('productPrice').value = product.price || 0;
        document.getElementById('productImage').value = imageUrl;
        
        // Update modal title
        document.getElementById('modalTitle').textContent = 'تعديل المنتج';
        
        // Show modal
        document.getElementById('productModal').classList.add('active');
    } catch (error) {
        console.error('Error loading product for edit:', error);
        alert('فشل تحميل تفاصيل المنتج');
    }
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
