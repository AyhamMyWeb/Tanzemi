/**
 * تنظيمي - Main Application Entry Point
 * App initialization, Navigation, Theme, Global logic
 */

import { dataManager } from './data-manager.js';
import { pomodoroManager } from './pomodoro.js';
import { mediaHub } from './media-hub.js';
import { taskManager } from './tasks.js';
import { scrumManager } from './scrum.js';
import { habitTracker } from './habit-tracker.js';
import { journalingManager } from './journaling.js';
import { gamificationManager } from './gamification.js';
import { settingsManager } from './settings.js';
import { confetti } from './utils.js';

class App {
    constructor() {
        this.currentSection = 'pomodoro';
    }

    async init() {
        try {
            // Initialize confetti system
            confetti.init();
            
            // Setup time progress bar
            this.setupTimeProgress();
            
            // Setup navigation
            this.setupNavigation();
            
            // Initialize all modules
            this.initializeModules();
            
            // Update XP display
            gamificationManager.updateDisplay();
            
            console.log('✅ تطبيق تنظيمي تم تشغيله بنجاح');
        } catch (error) {
            console.error('Error initializing app:', error);
        }
    }

    setupTimeProgress() {
        const updateProgress = () => {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
            
            const elapsed = now - startOfDay;
            const total = endOfDay - startOfDay;
            const percentage = (elapsed / total) * 100;
            
            const progressBar = document.querySelector('.time-progress-bar');
            if (progressBar) {
                progressBar.style.width = `${percentage}%`;
            }
        };
        
        updateProgress();
        setInterval(updateProgress, 1000);
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sectionId = btn.dataset.section;
                this.navigateTo(sectionId);
                
                // Update active state
                navButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    navigateTo(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
            
            // Re-render components as needed
            this.refreshCurrentSection();
        }
    }

    refreshCurrentSection() {
        switch (this.currentSection) {
            case 'pomodoro':
                pomodoroManager.renderChart();
                pomodoroManager.updateStats();
                break;
            case 'tasks':
                taskManager.loadTasks();
                break;
            case 'scrum':
                scrumManager.loadBoards();
                break;
            case 'habits':
                habitTracker.loadHabits();
                break;
            case 'journaling':
                journalingManager.loadJournal();
                journalingManager.renderArchiveCalendar();
                break;
            case 'gamification':
                gamificationManager.updateDisplay();
                break;
        }
    }

    initializeModules() {
        // Initialize Pomodoro
        pomodoroManager.init();
        
        // Initialize Media Hub
        mediaHub.init();
        
        // Initialize Tasks
        taskManager.init();
        
        // Initialize Scrum
        scrumManager.init();
        
        // Initialize Habit Tracker
        habitTracker.init();
        
        // Initialize Journaling
        journalingManager.init();
        
        // Initialize Gamification
        gamificationManager.init();
        
        // Initialize Settings
        settingsManager.init();
    }
}

// Make managers globally accessible for inline onclick handlers
window.taskManager = taskManager;
window.scrumManager = scrumManager;
window.habitTracker = habitTracker;
window.journalingManager = journalingManager;
window.mediaHub = mediaHub;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});

// Handle page visibility changes (for timer persistence)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Page became visible - could refresh data here
        pomodoroManager.recoverSession();
    }
});

// Handle beforeunload for saving state
window.addEventListener('beforeunload', () => {
    // Ensure all data is saved
    dataManager.save();
});

export default App;
