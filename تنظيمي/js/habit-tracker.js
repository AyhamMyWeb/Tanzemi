/**
 * تنظيمي - Habit Tracker Module
 * Grid-based Visual Streaks with Delete Option
 */

import { dataManager } from './data-manager.js';
import { formatters } from './utils.js';

export class HabitTracker {
    constructor() {
        this.habits = [];
        this.currentMonth = new Date();
        
        this.elements = {};
    }

    init() {
        this.cacheElements();
        this.loadHabits();
        this.setupEventListeners();
    }

    cacheElements() {
        this.elements = {
            habitInput: document.getElementById('habit-input'),
            habitAddBtn: document.getElementById('habit-add-btn'),
            habitsContainer: document.getElementById('habits-container'),
            prevMonth: document.getElementById('prev-month'),
            nextMonth: document.getElementById('next-month'),
            currentMonthLabel: document.getElementById('current-month-label')
        };
    }

    setupEventListeners() {
        this.elements.habitAddBtn?.addEventListener('click', () => this.addHabit());
        this.elements.habitInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addHabit();
        });
        
        this.elements.prevMonth?.addEventListener('click', () => this.changeMonth(-1));
        this.elements.nextMonth?.addEventListener('click', () => this.changeMonth(1));
    }

    loadHabits() {
        this.habits = dataManager.getHabits();
        this.renderHabits();
    }

    addHabit() {
        const name = this.elements.habitInput?.value.trim();
        if (!name) {
            alert('⚠️ يرجى إدخال اسم العادة');
            return;
        }

        try {
            const habit = {
                name: name,
                color: this.getRandomColor(),
                completedDates: []
            };

            const savedHabit = dataManager.addHabit(habit);
            this.habits.push(savedHabit);
            
            if (this.elements.habitInput) {
                this.elements.habitInput.value = '';
            }
            
            this.renderHabits();
            dataManager.addXP(3);
        } catch (error) {
            console.error('Error adding habit:', error);
        }
    }

    toggleDate(habitId, dateStr) {
        try {
            const completedDates = dataManager.toggleHabitDate(habitId, dateStr);
            
            const habit = this.habits.find(h => h.id === habitId);
            if (habit) {
                habit.completedDates = completedDates;
                this.renderHabits();
                
                // Add XP for completing habit
                dataManager.addXP(2);
            }
        } catch (error) {
            console.error('Error toggling habit date:', error);
        }
    }

    deleteHabit(habitId) {
        if (!confirm('هل أنت متأكد من حذف هذه العادة؟')) return;
        
        try {
            dataManager.deleteHabit(habitId);
            this.habits = this.habits.filter(h => h.id !== habitId);
            this.renderHabits();
        } catch (error) {
            console.error('Error deleting habit:', error);
        }
    }

    changeMonth(delta) {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + delta);
        this.renderHabits();
    }

    renderHabits() {
        if (!this.elements.habitsContainer) return;

        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        
        if (this.elements.currentMonthLabel) {
            this.elements.currentMonthLabel.textContent = `${formatters.getMonthName(month)} ${year}`;
        }

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1);
        const startingDay = firstDay.getDay();

        const dayNames = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

        let html = `
            <div class="flex justify-between items-center mb-20">
                <button class="btn-secondary" id="prev-month"><i class="fas fa-chevron-right"></i></button>
                <h3 class="cairo-font">${formatters.getMonthName(month)} ${year}</h3>
                <button class="btn-secondary" id="next-month"><i class="fas fa-chevron-left"></i></button>
            </div>
            
            <div style="display: grid; grid-template-columns: 200px repeat(${daysInMonth}, 1fr); gap: 5px; margin-bottom: 30px;">
                <div></div>
                ${Array.from({ length: daysInMonth }, (_, i) => {
                    const date = new Date(year, month, i + 1);
                    const dayName = dayNames[date.getDay()];
                    const isToday = this.isToday(date);
                    return `<div style="text-align: center; font-size: 0.75rem; opacity: 0.8;">${dayName}<br>${i + 1}</div>`;
                }).join('')}
            </div>
        `;

        this.habits.forEach(habit => {
            const streak = formatters.calculateStreak(habit.completedDates);
            
            html += `
                <div class="habit-item glass-card">
                    <div class="habit-header">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 16px; height: 16px; border-radius: 4px; background: ${habit.color};"></div>
                            <span style="font-weight: 600;">${this.escapeHTML(habit.name)}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <span style="font-size: 0.85rem; opacity: 0.8;">🔥 ${streak} أيام متتالية</span>
                            <button class="btn-danger" onclick="window.habitTracker.deleteHabit('${habit.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="habit-grid" style="grid-template-columns: repeat(${daysInMonth}, 1fr);">
                        ${Array.from({ length: daysInMonth }, (_, i) => {
                            const date = new Date(year, month, i + 1);
                            const dateStr = date.toISOString().split('T')[0];
                            const isCompleted = habit.completedDates.includes(dateStr);
                            const isToday = this.isToday(date);
                            
                            return `
                                <div class="habit-day ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''}"
                                     onclick="window.habitTracker.toggleDate('${habit.id}', '${dateStr}')"
                                     style="background: ${isCompleted ? habit.color : ''}; color: ${isCompleted ? '#1f2937' : ''}">
                                    ${i + 1}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });

        this.elements.habitsContainer.innerHTML = html;
        
        // Re-bind month buttons
        document.getElementById('prev-month')?.addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('next-month')?.addEventListener('click', () => this.changeMonth(1));
    }

    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    getRandomColor() {
        const colors = ['#4ade80', '#60a5fa', '#a78bfa', '#f87171', '#fbbf24', '#34d399'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

export const habitTracker = new HabitTracker();
