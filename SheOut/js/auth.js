// ========================================
// SheOut - Authentication Module
// ========================================

const Auth = {
    currentUser: null,

    init() {
        // Check if user is logged in
        const savedUser = localStorage.getItem('sheout_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }

        // Setup form handlers
        this.setupFormHandlers();
        
        // Check auth state
        this.checkAuthState();
    },

    setupFormHandlers() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Show register link
        const showRegisterBtn = document.getElementById('show-register');
        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterForm();
            });
        }

        // Show login link
        const showLoginBtn = document.getElementById('show-login');
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    },

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            UI.showLoading();
            
            // Call login API
            const userId = await api.user.login(username, password);
            
            if (userId && userId !== -1) {
                // Get user details
                const user = await api.user.getById(userId);
                
                if (user) {
                    this.currentUser = user;
                    localStorage.setItem('sheout_user', JSON.stringify(user));
                    
                    UI.showToast('تم تسجيل الدخول بنجاح!', 'success');
                    this.checkAuthState();
                } else {
                    UI.showToast('حدث خطأ في جلب بيانات المستخدم', 'error');
                }
            } else {
                UI.showToast('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            UI.showToast('حدث خطأ في الاتصال بالخادم', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    async handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const phone = document.getElementById('register-phone').value;
        const password = document.getElementById('register-password').value;

        try {
            UI.showLoading();
            
            // Check if username exists
            const exists = await api.user.existsByUsername(username);
            
            if (exists) {
                UI.showToast('اسم المستخدم موجود بالفعل، اختاري اسم آخر', 'error');
                return;
            }

            // Create new user
            const userData = {
                username: username,
                email: email,
                phone: phone || '',
                password: password,
                // Add any other required fields based on clsUser structure
            };

            const userId = await api.user.create(userData);
            
            if (userId && userId !== -1) {
                UI.showToast('تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن', 'success');
                this.showLoginForm();
            } else {
                UI.showToast('حدث خطأ في إنشاء الحساب', 'error');
            }
        } catch (error) {
            console.error('Register error:', error);
            UI.showToast('حدث خطأ في الاتصال بالخادم', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    logout() {
        this.currentUser = null;
        localStorage.removeItem('sheout_user');
        UI.showToast('تم تسجيل الخروج بنجاح', 'success');
        this.checkAuthState();
    },

    showRegisterForm() {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
    },

    showLoginForm() {
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
    },

    checkAuthState() {
        const authContainer = document.getElementById('auth-container');
        const appContainer = document.getElementById('app-container');
        const splashScreen = document.getElementById('splash-screen');
        const adminBtn = document.getElementById('admin-btn');

        if (this.currentUser) {
            // User is logged in
            if (authContainer) authContainer.classList.add('hidden');
            if (appContainer) appContainer.classList.remove('hidden');
            
            // Show admin button for admin users (role === 1)
            if (adminBtn) {
                if (this.currentUser.role === 1) {
                    adminBtn.style.display = 'block';
                } else {
                    adminBtn.style.display = 'none';
                }
            }
            
            // Update profile display
            this.updateProfileDisplay();
            
            // Load user-specific data with error handling
            setTimeout(() => {
                if (window.Favorites) {
                    Favorites.loadUserFavorites().catch(err => console.error('Error loading favorites:', err));
                }
                if (window.Orders) {
                    Orders.loadUserOrders().catch(err => console.error('Error loading orders:', err));
                }
                if (window.Reports) {
                    Reports.loadUserReports().catch(err => console.error('Error loading reports:', err));
                }
            }, 100);
        } else {
            // User is not logged in
            if (authContainer) authContainer.classList.remove('hidden');
            if (appContainer) appContainer.classList.add('hidden');
            if (adminBtn) adminBtn.style.display = 'none';
        }

        // Hide splash screen after delay
        setTimeout(() => {
            if (splashScreen) {
                splashScreen.style.display = 'none';
            }
        }, 2500);
    },

    updateProfileDisplay() {
        if (!this.currentUser) return;

        const nameDisplay = document.getElementById('profile-name-display');
        const emailDisplay = document.getElementById('profile-email-display');
        const avatarDisplay = document.getElementById('profile-avatar-display');
        
        const editUsername = document.getElementById('edit-username');
        const editEmail = document.getElementById('edit-email');
        const editPhone = document.getElementById('edit-phone');

        if (nameDisplay) nameDisplay.textContent = this.currentUser.username || 'مستخدم';
        if (emailDisplay) emailDisplay.textContent = this.currentUser.email || '';
        if (avatarDisplay) avatarDisplay.textContent = (this.currentUser.username || 'M')[0].toUpperCase();

        if (editUsername) editUsername.value = this.currentUser.username || '';
        if (editEmail) editEmail.value = this.currentUser.email || '';
        if (editPhone) editPhone.value = this.currentUser.phone || '';
    },

    async updateProfile() {
        if (!this.currentUser) return;

        const newUsername = document.getElementById('edit-username').value;
        const newEmail = document.getElementById('edit-email').value;
        const newPhone = document.getElementById('edit-phone').value;

        try {
            UI.showLoading();

            const updatedData = {
                ...this.currentUser,
                username: newUsername,
                email: newEmail,
                phone: newPhone,
            };

            const success = await api.user.update(this.currentUser.id, updatedData);

            if (success) {
                this.currentUser = updatedData;
                localStorage.setItem('sheout_user', JSON.stringify(updatedData));
                this.updateProfileDisplay();
                UI.showToast('تم تحديث الملف الشخصي بنجاح', 'success');
            } else {
                UI.showToast('حدث خطأ في تحديث الملف الشخصي', 'error');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            UI.showToast('حدث خطأ في الاتصال بالخادم', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    getUserId() {
        return this.currentUser ? this.currentUser.id : null;
    },

    isLoggedIn() {
        return this.currentUser !== null;
    },
};

window.Auth = Auth;
