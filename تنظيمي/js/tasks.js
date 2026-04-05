/**
 * تنظيمي - Tasks Module
 * Standard Todo with Slide-to-Delete and Confetti-on-Complete
 */

import { dataManager } from './data-manager.js';
import { confetti, animations } from './utils.js';

export class TaskManager {
    constructor() {
        this.tasks = [];
        this.touchStartX = 0;
        this.touchCurrentX = 0;
        this.activeSwipeItem = null;
        
        this.elements = {};
    }

    init() {
        this.cacheElements();
        this.loadTasks();
        this.setupEventListeners();
    }

    cacheElements() {
        this.elements = {
            taskInput: document.getElementById('task-input'),
            taskAddBtn: document.getElementById('task-add-btn'),
            taskList: document.getElementById('task-list'),
            filterAll: document.getElementById('filter-all'),
            filterActive: document.getElementById('filter-active'),
            filterCompleted: document.getElementById('filter-completed')
        };
    }

    setupEventListeners() {
        // Add task
        this.elements.taskAddBtn?.addEventListener('click', () => this.addTask());
        
        this.elements.taskInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });

        // Filter buttons
        this.elements.filterAll?.addEventListener('click', () => this.renderTasks('all'));
        this.elements.filterActive?.addEventListener('click', () => this.renderTasks('active'));
        this.elements.filterCompleted?.addEventListener('click', () => this.renderTasks('completed'));

        // Touch events for swipe-to-delete
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
    }

    loadTasks() {
        this.tasks = dataManager.getTasks();
        this.renderTasks();
    }

    addTask() {
        const text = this.elements.taskInput?.value.trim();
        
        if (!text) {
            alert('⚠️ يرجى إدخال نص المهمة');
            return;
        }

        try {
            const task = {
                text: text,
                completed: false,
                priority: 'normal',
                tags: []
            };

            const savedTask = dataManager.addTask(task);
            this.tasks.unshift(savedTask);
            
            if (this.elements.taskInput) {
                this.elements.taskInput.value = '';
            }
            
            this.renderTasks();
            
            // Add XP for adding task
            dataManager.addXP(1);
        } catch (error) {
            console.error('Error adding task:', error);
            alert('❌ حدث خطأ أثناء إضافة المهمة');
        }
    }

    toggleTask(taskId) {
        try {
            const taskIndex = this.tasks.findIndex(t => t.id === taskId);
            if (taskIndex === -1) return;

            const task = this.tasks[taskIndex];
            task.completed = !task.completed;
            
            if (task.completed) {
                task.completedAt = new Date().toISOString();
                // Trigger confetti
                confetti.start({ count: 50, duration: 1500 });
                // Add XP for completing task
                const xpResult = dataManager.addXP(5);
                if (xpResult.leveledUp) {
                    this.showLevelUpNotification(xpResult.level);
                }
            } else {
                task.completedAt = null;
            }

            dataManager.updateTask(taskId, { 
                completed: task.completed,
                completedAt: task.completedAt
            });

            this.renderTasks();
        } catch (error) {
            console.error('Error toggling task:', error);
        }
    }

    deleteTask(taskId) {
        try {
            const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
            if (taskElement) {
                // Animate deletion
                taskElement.classList.add('deleting');
                
                setTimeout(() => {
                    dataManager.deleteTask(taskId);
                    this.tasks = this.tasks.filter(t => t.id !== taskId);
                    this.renderTasks();
                }, 300);
            }
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }

    handleTouchStart(e) {
        const taskItem = e.target.closest('.task-item');
        if (taskItem) {
            this.touchStartX = e.touches[0].clientX;
            this.activeSwipeItem = taskItem;
            taskItem.classList.add('swiping');
        }
    }

    handleTouchMove(e) {
        if (!this.activeSwipeItem) return;
        
        this.touchCurrentX = e.touches[0].clientX;
        const diff = this.touchCurrentX - this.touchStartX;
        
        if (diff < 0) {
            this.activeSwipeItem.style.transform = `translateX(${diff}px)`;
        }
    }

    handleTouchEnd(e) {
        if (!this.activeSwipeItem) return;
        
        const diff = this.touchCurrentX - this.touchStartX;
        const taskId = this.activeSwipeItem.dataset.taskId;
        
        if (diff < -100) {
            // Swipe threshold reached - delete
            this.deleteTask(taskId);
        } else {
            // Reset position
            this.activeSwipeItem.style.transform = '';
        }
        
        this.activeSwipeItem.classList.remove('swiping');
        this.activeSwipeItem = null;
        this.touchStartX = 0;
        this.touchCurrentX = 0;
    }

    renderTasks(filter = 'all') {
        if (!this.elements.taskList) return;

        let filteredTasks = this.tasks;
        
        switch (filter) {
            case 'active':
                filteredTasks = this.tasks.filter(t => !t.completed);
                break;
            case 'completed':
                filteredTasks = this.tasks.filter(t => t.completed);
                break;
        }

        this.elements.taskList.innerHTML = filteredTasks.map(task => `
            <li class="task-item" data-task-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                     onclick="window.taskManager.toggleTask('${task.id}')"></div>
                <span class="task-text ${task.completed ? 'completed' : ''}">${this.escapeHTML(task.text)}</span>
                <button class="btn-danger task-delete" onclick="window.taskManager.deleteTask('${task.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </li>
        `).join('');

        // Update filter buttons
        this.updateFilterButtons(filter);
    }

    updateFilterButtons(activeFilter) {
        [this.elements.filterAll, this.elements.filterActive, this.elements.filterCompleted].forEach(btn => {
            if (btn) {
                btn.classList.remove('active');
            }
        });

        const activeBtn = {
            'all': this.elements.filterAll,
            'active': this.elements.filterActive,
            'completed': this.elements.filterCompleted
        }[activeFilter];

        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    showLevelUpNotification(level) {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `
            <div style="font-size: 4rem;">🎉</div>
            <h2 style="color: var(--accent-gold); margin: 20px 0;">مستوى جديد!</h2>
            <p style="font-size: 1.5rem;">وصلت للمستوى ${level}</p>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    getStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const active = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { total, completed, active, completionRate };
    }
}

// Export singleton instance
export const taskManager = new TaskManager();
