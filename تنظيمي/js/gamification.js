/**
 * تنظيمي - Gamification Module
 * XP System with Level-up Notifications
 */

import { dataManager } from './data-manager.js';

export class GamificationManager {
    constructor() {
        this.elements = {};
    }

    init() {
        this.cacheElements();
        this.updateDisplay();
    }

    cacheElements() {
        this.elements = {
            xpDisplay: document.getElementById('xp-display'),
            levelDisplay: document.getElementById('level-display'),
            xpBarFill: document.getElementById('xp-bar-fill'),
            xpToNext: document.getElementById('xp-to-next')
        };
    }

    updateDisplay() {
        const data = dataManager.getGamificationData();
        
        if (this.elements.xpDisplay) {
            this.elements.xpDisplay.textContent = data.xp;
        }
        
        if (this.elements.levelDisplay) {
            this.elements.levelDisplay.textContent = data.level;
        }
        
        if (this.elements.xpBarFill) {
            const xpProgress = data.xp % 100;
            this.elements.xpBarFill.style.width = `${xpProgress}%`;
        }
        
        if (this.elements.xpToNext) {
            const xpToNext = 100 - (data.xp % 100);
            this.elements.xpToNext.textContent = xpToNext === 100 ? 0 : xpToNext;
        }
    }

    getLevelInfo(level) {
        const titles = [
            'مبتدئ',      // 1
            'متعلم',      // 2
            'ممارس',      // 3
            'محترف',      // 4
            'خبير',       // 5
            'أستاذ',      // 6
            'حكيم',       // 7
            'أسطورة',     // 8
            'نخبة',       // 9
            'ملك الإنتاجية' // 10+
        ];
        
        return titles[Math.min(level - 1, titles.length - 1)];
    }
}

export const gamificationManager = new GamificationManager();
