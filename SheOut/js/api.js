// ========================================
// SheOut - API Configuration
// ========================================

const API_BASE_URL = 'http://sheout.runasp.net/api';

// API Helper Functions
const api = {
    async request(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (body && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Handle DELETE requests that return boolean
            if (method === 'DELETE') {
                const text = await response.text();
                return text === 'true' || text === 'True';
            }

            // Handle PUT requests that return boolean
            if (method === 'PUT') {
                const text = await response.text();
                return text === 'true' || text === 'True';
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // User endpoints
    user: {
        getAll: () => api.request('/User'),
        getById: (userId) => api.request(`/User/FindByID/${userId}`),
        getByUsername: (username) => api.request(`/User/FindByUsername/${username}`),
        create: (userData) => api.request('/User', 'POST', userData),
        update: (userId, userData) => api.request(`/User/${userId}`, 'PUT', userData),
        delete: (userId) => api.request(`/User/${userId}`, 'DELETE'),
        login: (username, password) => api.request(`/User/Login/${username}/${password}`),
        existsById: (userId) => api.request(`/User/IsUesrExistByID/${userId}`),
        existsByUsername: (username) => api.request(`/User/IsUesrExistByUsername/${username}`),
    },

    // Product endpoints
    product: {
        getAll: () => api.request('/Product'),
        getById: (productId) => api.request(`/Product/FindByID/${productId}`),
        getByName: (productName) => api.request(`/Product/FindByProductName/${productName}`),
        create: (productData) => api.request('/Product', 'POST', productData),
        update: (productId, productData) => api.request(`/Product/${productId}`, 'PUT', productData),
        delete: (productId) => api.request(`/Product/${productId}`, 'DELETE'),
        existsById: (productId) => api.request(`/Product/IsProductExistByID/${productId}`),
        existsByName: (productName) => api.request(`/Product/IsProductExistByProductName/${productName}`),
    },

    // Product Image endpoints
    productImage: {
        getAll: () => api.request('/ProductImage'),
        getById: (imgId) => api.request(`/ProductImage/FindByID/${imgId}`),
        getByProductId: (productId) => api.request(`/ProductImage/FindByProductID/${productId}`),
        getByImageUrl: (imageUrl) => api.request(`/ProductImage/FindByImageUrl/${imageUrl}`),
        create: (imageData) => api.request('/ProductImage', 'POST', imageData),
        update: (imgId, imageData) => api.request(`/ProductImage/${imgId}`, 'PUT', imageData),
        delete: (imgId) => api.request(`/ProductImage/${imgId}`, 'DELETE'),
        existsById: (imgId) => api.request(`/ProductImage/IsProductImageExistByID/${imgId}`),
        existsByImageUrl: (imageUrl) => api.request(`/ProductImage/IsProductImageExistByImageUrl/${imageUrl}`),
    },

    // Favourite Product endpoints
    favourite: {
        getAll: () => api.request('/FavouriteProduct'),
        getById: (favId) => api.request(`/FavouriteProduct/FindByID/${favId}`),
        getByUserId: (userId) => api.request(`/FavouriteProduct/FindByUserID/${userId}`),
        getByProductId: (productId) => api.request(`/FavouriteProduct/FindByProductID/${productId}`),
        create: (favouriteData) => api.request('/FavouriteProduct', 'POST', favouriteData),
        update: (favId, favouriteData) => api.request(`/FavouriteProduct/${favId}`, 'PUT', favouriteData),
        delete: (favId) => api.request(`/FavouriteProduct/${favId}`, 'DELETE'),
        existsById: (favId) => api.request(`/FavouriteProduct/IsFavouriteProductExistByID/${favId}`),
        existsByUserAndProduct: (userId, productId) => 
            api.request(`/FavouriteProduct/IsFavouriteProductExistByUserAndProduct/${userId}/${productId}`),
    },

    // Order endpoints
    order: {
        getAll: () => api.request('/Order'),
        getById: (orderId) => api.request(`/Order/FindByID/${orderId}`),
        getByUserId: (userId) => api.request(`/Order/FindByOrderedUserID/${userId}`),
        create: (orderData) => api.request('/Order', 'POST', orderData),
        update: (orderId, orderData) => api.request(`/Order/${orderId}`, 'PUT', orderData),
        delete: (orderId) => api.request(`/Order/${orderId}`, 'DELETE'),
        existsById: (orderId) => api.request(`/Order/IsOrderExistByID/${orderId}`),
    },

    // Item endpoints
    item: {
        getAll: () => api.request('/Item'),
        getById: (itemId) => api.request(`/Item/FindByID/${itemId}`),
        getByOrderId: (orderId) => api.request(`/Item/FindByOrderID/${orderId}`),
        getByProductId: (productId) => api.request(`/Item/FindByProductID/${productId}`),
        create: (itemData) => api.request('/Item', 'POST', itemData),
        update: (itemId, itemData) => api.request(`/Item/${itemId}`, 'PUT', itemData),
        delete: (itemId) => api.request(`/Item/${itemId}`, 'DELETE'),
        existsById: (itemId) => api.request(`/Item/IsItemExistByID/${itemId}`),
    },

    // Report endpoints
    report: {
        getAll: () => api.request('/Report'),
        getById: (reportId) => api.request(`/Report/FindByID/${reportId}`),
        getByReporterId: (reporterId) => api.request(`/Report/FindByReporterID/${reporterId}`),
        getByCategory: (category) => api.request(`/Report/FindByCategory/${category}`),
        create: (reportData) => api.request('/Report', 'POST', reportData),
        update: (reportId, reportData) => api.request(`/Report/${reportId}`, 'PUT', reportData),
        delete: (reportId) => api.request(`/Report/${reportId}`, 'DELETE'),
        existsById: (reportId) => api.request(`/Report/IsReportExistByID/${reportId}`),
    },

    // News endpoints
    news: {
        getAll: () => api.request('/News'),
        create: (newMessage) => api.request('/News', 'POST', newMessage),
        delete: (newsId) => api.request(`/News?newsID=${newsId}`, 'DELETE'),
    },
};

// Export for use in other modules
window.api = api;
