/**
 * تنظيمي - Settings Module
 * Profile, Export/Import, Factory Reset
 */

import { dataManager } from './data-manager.js';

export class SettingsManager {
    constructor() {
        this.elements = {};
    }

    init() {
        this.cacheElements();
        this.loadProfile();
        this.setupEventListeners();
    }

    cacheElements() {
        this.elements = {
            profileName: document.getElementById('profile-name'),
            profileAvatar: document.getElementById('profile-avatar'),
            saveProfileBtn: document.getElementById('save-profile-btn'),
            exportBtn: document.getElementById('export-data-btn'),
            importInput: document.getElementById('import-data-input'),
            importBtn: document.getElementById('import-data-btn'),
            resetBtn: document.getElementById('factory-reset-btn'),
            themeToggle: document.getElementById('theme-toggle')
        };
    }

    setupEventListeners() {
        this.elements.saveProfileBtn?.addEventListener('click', () => this.saveProfile());
        
        this.elements.exportBtn?.addEventListener('click', () => this.exportData());
        
        this.elements.importBtn?.addEventListener('click', () => {
            this.elements.importInput?.click();
        });
        
        this.elements.importInput?.addEventListener('change', (e) => this.importData(e));
        
        this.elements.resetBtn?.addEventListener('click', () => this.factoryReset());
        
        this.elements.themeToggle?.addEventListener('change', (e) => {
            const theme = e.target.checked ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', theme);
            dataManager.updateProfile({ theme });
        });
    }

    loadProfile() {
        const profile = dataManager.getProfile();
        
        if (this.elements.profileName) {
            this.elements.profileName.value = profile.name;
        }
        
        if (this.elements.profileAvatar) {
            this.elements.profileAvatar.textContent = profile.avatar;
        }
        
        // Load theme
        const currentTheme = profile.theme || 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        
        if (this.elements.themeToggle) {
            this.elements.themeToggle.checked = currentTheme === 'light';
        }
    }

    saveProfile() {
        try {
            const name = this.elements.profileName?.value.trim() || 'مستخدم';
            const avatar = this.elements.profileAvatar?.textContent || '👤';
            
            dataManager.updateProfile({ name, avatar });
            
            alert('✅ تم حفظ الملف الشخصي بنجاح');
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('❌ حدث خطأ أثناء الحفظ');
        }
    }

    exportData() {
        try {
            const jsonData = dataManager.exportData();
            
            if (!jsonData) {
                throw new Error('Failed to export data');
            }
            
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `تنظيمي-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('✅ تم تصدير البيانات بنجاح');
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('❌ حدث خطأ أثناء التصدير');
        }
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const success = dataManager.importData(e.target.result);
                    
                    if (success) {
                        alert('✅ تم استيراد البيانات بنجاح. سيتم إعادة تحميل الصفحة.');
                        location.reload();
                    } else {
                        throw new Error('Invalid data format');
                    }
                } catch (error) {
                    console.error('Error parsing imported data:', error);
                    alert('❌ ملف غير صالح أو تنسيق خاطئ');
                }
            };
            
            reader.onerror = () => {
                alert('❌ حدث خطأ أثناء قراءة الملف');
            };
            
            reader.readAsText(file);
        } catch (error) {
            console.error('Error importing data:', error);
            alert('❌ حدث خطأ أثناء الاستيراد');
        }
        
        // Reset input
        event.target.value = '';
    }

    factoryReset() {
        const confirmation = prompt('⚠️ هل أنت متأكد تماماً؟ هذا سيحذف جميع بياناتك نهائياً!\n\nاكتب "تأكيد" للمتابعة:');
        
        if (confirmation !== 'تأكيد') {
            return;
        }
        
        try {
            dataManager.factoryReset();
            alert('✅ تم إعادة ضبط المصنع. سيتم إعادة تحميل الصفحة.');
            location.reload();
        } catch (error) {
            console.error('Error during factory reset:', error);
            alert('❌ حدث خطأ أثناء إعادة الضبط');
        }
    }
}

export const settingsManager = new SettingsManager();
