/**
 * تنظيمي - Journaling Module
 * Dual-Phase Journaling with Morning Intentions & Evening Reflections
 */

import { dataManager } from './data-manager.js';
import { formatters } from './utils.js';

export class JournalingManager {
    constructor() {
        this.currentDate = new Date().toISOString().split('T')[0];
        this.currentTab = 'morning';
        this.selectedMood = null;
        
        this.elements = {};
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.loadJournal();
        this.renderArchiveCalendar();
    }

    cacheElements() {
        this.elements = {
            morningTab: document.getElementById('journal-morning-tab'),
            eveningTab: document.getElementById('journal-evening-tab'),
            morningContent: document.getElementById('morning-content'),
            eveningContent: document.getElementById('evening-content'),
            morningSave: document.getElementById('morning-save'),
            eveningSave: document.getElementById('evening-save'),
            moodSelector: document.getElementById('mood-selector'),
            archiveContainer: document.getElementById('journal-archive'),
            archiveMonth: document.getElementById('archive-month'),
            archiveYear: document.getElementById('archive-year'),
            archiveCalendar: document.getElementById('archive-calendar-grid'),
            archiveViewBtn: document.getElementById('view-archive-btn')
        };
    }

    setupEventListeners() {
        // Tab switching
        this.elements.morningTab?.addEventListener('click', () => this.switchTab('morning'));
        this.elements.eveningTab?.addEventListener('click', () => this.switchTab('evening'));
        
        // Save buttons
        this.elements.morningSave?.addEventListener('click', () => this.saveJournal('morning'));
        this.elements.eveningSave?.addEventListener('click', () => this.saveJournal('evening'));
        
        // Mood selection
        this.elements.moodSelector?.querySelectorAll('.mood-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectMood(e.target.dataset.mood));
        });
        
        // Archive navigation
        this.elements.archiveMonth?.addEventListener('change', () => this.renderArchiveCalendar());
        this.elements.archiveYear?.addEventListener('change', () => this.renderArchiveCalendar());
        this.elements.archiveViewBtn?.addEventListener('click', () => this.viewSelectedDay());
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        if (this.elements.morningTab) this.elements.morningTab.classList.toggle('active', tab === 'morning');
        if (this.elements.eveningTab) this.elements.eveningTab.classList.toggle('active', tab === 'evening');
        
        if (this.elements.morningContent) this.elements.morningContent.classList.toggle('hidden', tab !== 'morning');
        if (this.elements.eveningContent) this.elements.eveningContent.classList.toggle('hidden', tab !== 'evening');
        
        this.loadJournal();
    }

    loadJournal() {
        const journal = dataManager.getJournalEntry(this.currentDate);
        
        if (!journal) return;
        
        if (this.elements.morningContent && journal.morning) {
            this.elements.morningContent.value = journal.morning.content;
        }
        
        if (this.elements.eveningContent && journal.evening) {
            this.elements.eveningContent.value = journal.evening.content;
        }
        
        if (journal.mood) {
            this.selectMood(journal.mood);
        }
    }

    saveJournal(type) {
        const contentEl = type === 'morning' ? this.elements.morningContent : this.elements.eveningContent;
        const content = contentEl?.value.trim();
        
        if (!content) {
            alert('⚠️ يرجى كتابة محتوى اليوميات');
            return;
        }
        
        try {
            dataManager.saveJournalEntry(this.currentDate, type, content, this.selectedMood);
            
            alert('✅ تم الحفظ بنجاح');
            dataManager.addXP(5);
        } catch (error) {
            console.error('Error saving journal:', error);
            alert('❌ حدث خطأ أثناء الحفظ');
        }
    }

    selectMood(mood) {
        this.selectedMood = mood;
        
        if (this.elements.moodSelector) {
            this.elements.moodSelector.querySelectorAll('.mood-option').forEach(option => {
                option.classList.toggle('selected', option.dataset.mood === mood);
            });
        }
        
        // Save mood immediately
        if (mood) {
            dataManager.saveJournalEntry(this.currentDate, this.currentTab, 
                this.currentTab === 'morning' ? this.elements.morningContent?.value : this.elements.eveningContent?.value, 
                mood);
        }
    }

    renderArchiveCalendar() {
        if (!this.elements.archiveCalendar) return;
        
        const month = parseInt(this.elements.archiveMonth?.value) || new Date().getMonth();
        const year = parseInt(this.elements.archiveYear?.value) || new Date().getFullYear();
        
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const allDates = dataManager.getAllJournalDates();
        
        let html = '<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px;">';
        
        // Day headers
        const dayNames = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
        dayNames.forEach(day => {
            html += `<div style="text-align: center; font-weight: bold; padding: 8px;">${day}</div>`;
        });
        
        // Empty cells for days before first of month
        const firstDay = new Date(year, month, 1).getDay();
        for (let i = 0; i < firstDay; i++) {
            html += '<div></div>';
        }
        
        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasData = allDates.includes(dateStr);
            
            html += `
                <div class="archive-day ${hasData ? 'has-data' : ''}" 
                     data-date="${dateStr}"
                     onclick="window.journalingManager.selectArchiveDate('${dateStr}')">
                    ${day}
                </div>
            `;
        }
        
        html += '</div>';
        this.elements.archiveCalendar.innerHTML = html;
    }

    selectArchiveDate(dateStr) {
        // Remove previous selection
        document.querySelectorAll('.archive-day.selected').forEach(el => el.classList.remove('selected'));
        
        // Add new selection
        const selectedEl = document.querySelector(`.archive-day[data-date="${dateStr}"]`);
        if (selectedEl) selectedEl.classList.add('selected');
        
        this.currentDate = dateStr;
        this.showArchiveData(dateStr);
    }

    showArchiveData(dateStr) {
        const stats = dataManager.getArchiveStats(dateStr);
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 5000;
        `;
        
        modal.innerHTML = `
            <div class="glass-card" style="max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <h2 class="cairo-font text-gold mb-20">${formatters.formatDate(dateStr)}</h2>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                    <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 12px;">
                        <div style="font-size: 2rem;">📝</div>
                        <div style="font-size: 0.85rem; opacity: 0.8;">المهام المكتملة</div>
                        <div style="font-size: 1.5rem; font-weight: bold;">${stats.tasksCompleted}</div>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 12px;">
                        <div style="font-size: 2rem;">🔥</div>
                        <div style="font-size: 0.85rem; opacity: 0.8;">العادات المنجزة</div>
                        <div style="font-size: 1.5rem; font-weight: bold;">${stats.habitsCompleted}</div>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 12px;">
                        <div style="font-size: 2rem;">⏱️</div>
                        <div style="font-size: 0.85rem; opacity: 0.8;">جلسات التركيز</div>
                        <div style="font-size: 1.5rem; font-weight: bold;">${stats.pomodoroSessions}</div>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 12px;">
                        <div style="font-size: 2rem;">📊</div>
                        <div style="font-size: 0.85rem; opacity: 0.8;">دقائق التركيز</div>
                        <div style="font-size: 1.5rem; font-weight: bold;">${stats.pomodoroMinutes}</div>
                    </div>
                </div>
                
                ${stats.journal?.mood ? `
                    <div style="margin-bottom: 20px;">
                        <div style="opacity: 0.8; margin-bottom: 8px;">الحالة المزاجية:</div>
                        <div style="font-size: 2.5rem;">${stats.journal.mood}</div>
                    </div>
                ` : ''}
                
                ${stats.journal?.morning?.content ? `
                    <div style="margin-bottom: 20px;">
                        <div style="opacity: 0.8; margin-bottom: 8px;">☀️ نوايا الصباح:</div>
                        <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px;">
                            ${stats.journal.morning.content}
                        </div>
                    </div>
                ` : ''}
                
                ${stats.journal?.evening?.content ? `
                    <div style="margin-bottom: 20px;">
                        <div style="opacity: 0.8; margin-bottom: 8px;">🌙 تأملات المساء:</div>
                        <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 8px;">
                            ${stats.journal.evening.content}
                        </div>
                    </div>
                ` : ''}
                
                <button class="btn-secondary" onclick="this.closest('div[style*=fixed]').remove()" 
                        style="width: 100%; margin-top: 20px;">إغلاق</button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    viewSelectedDay() {
        const selectedDate = document.querySelector('.archive-day.selected')?.dataset.date;
        if (selectedDate) {
            this.showArchiveData(selectedDate);
        } else {
            alert('⚠️ يرجى اختيار يوم من التقويم');
        }
    }
}

export const journalingManager = new JournalingManager();
