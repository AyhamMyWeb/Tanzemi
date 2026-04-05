/**
 * تنظيمي - Data Manager Module
 * Handles all LocalStorage operations, Export/Import, and Persistence Engine
 */

export class DataManager {
    constructor() {
        this.STORAGE_KEY = 'tanzimi_data';
        this.data = this.initializeData();
    }

    /**
     * Initialize default data structure
     */
    initializeData() {
        const defaultData = {
            profile: {
                name: 'مستخدم',
                avatar: '👤',
                theme: 'dark'
            },
            pomodoro: {
                settings: {
                    focusDuration: 25,
                    shortBreakDuration: 5,
                    longBreakDuration: 15
                },
                sessions: [],
                totalFocusSeconds: 0,
                currentSession: null
            },
            tasks: [],
            scrumBoards: [
                {
                    id: 'board-1',
                    name: 'لوحتي الرئيسية',
                    columns: {
                        'todo': [],
                        'inprogress': [],
                        'done': []
                    }
                }
            ],
            habits: [],
            journals: {},
            gamification: {
                xp: 0,
                level: 1,
                achievements: []
            },
            mediaFiles: [],
            settings: {
                notifications: true,
                soundEnabled: true,
                language: 'ar'
            }
        };

        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.data = { ...defaultData, ...parsed };
            } else {
                this.data = defaultData;
                this.save();
            }
        } catch (error) {
            console.error('Error loading data from LocalStorage:', error);
            this.data = defaultData;
        }

        return this.data;
    }

    /**
     * Save data to LocalStorage with error handling
     */
    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
            return true;
        } catch (error) {
            console.error('Error saving data to LocalStorage:', error);
            if (error.name === 'QuotaExceededError') {
                alert('⚠️ مساحة التخزين ممتلئة! يرجى تصدير البيانات ثم مسح بعضها.');
            }
            return false;
        }
    }

    /**
     * Get profile data
     */
    getProfile() {
        return this.data.profile;
    }

    /**
     * Update profile
     */
    updateProfile(profileData) {
        this.data.profile = { ...this.data.profile, ...profileData };
        this.save();
    }

    /**
     * Pomodoro persistence - save every second
     */
    savePomodoroSession(sessionData) {
        try {
            if (!this.data.pomodoro.currentSession) {
                this.data.pomodoro.currentSession = sessionData;
            } else {
                this.data.pomodoro.currentSession = {
                    ...this.data.pomodoro.currentSession,
                    ...sessionData
                };
            }
            
            // Commit focus seconds immediately
            if (sessionData.focusSeconds !== undefined) {
                this.data.pomodoro.totalFocusSeconds = sessionData.focusSeconds;
            }
            
            this.save();
        } catch (error) {
            console.error('Error saving Pomodoro session:', error);
        }
    }

    /**
     * Complete Pomodoro session
     */
    completePomodoroSession() {
        try {
            if (this.data.pomodoro.currentSession) {
                const session = { ...this.data.pomodoro.currentSession };
                session.completedAt = new Date().toISOString();
                session.id = Date.now().toString();
                
                this.data.pomodoro.sessions.push(session);
                
                // Keep only last 365 days of sessions
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 365);
                this.data.pomodoro.sessions = this.data.pomodoro.sessions.filter(
                    s => new Date(s.startedAt) >= thirtyDaysAgo
                );
                
                this.data.pomodoro.currentSession = null;
                this.save();
                
                return session;
            }
        } catch (error) {
            console.error('Error completing Pomodoro session:', error);
        }
        return null;
    }

    /**
     * Get current session for recovery
     */
    getCurrentSession() {
        return this.data.pomodoro.currentSession;
    }

    /**
     * Get Pomodoro statistics
     */
    getPomodoroStats() {
        return {
            sessions: this.data.pomodoro.sessions,
            totalFocusSeconds: this.data.pomodoro.totalFocusSeconds,
            settings: this.data.pomodoro.settings
        };
    }

    /**
     * Update Pomodoro settings
     */
    updatePomodoroSettings(settings) {
        this.data.pomodoro.settings = { ...this.data.pomodoro.settings, ...settings };
        this.save();
    }

    /**
     * Tasks management
     */
    addTask(task) {
        task.id = Date.now().toString();
        task.createdAt = new Date().toISOString();
        this.data.tasks.unshift(task);
        this.save();
        return task;
    }

    updateTask(taskId, updates) {
        const taskIndex = this.data.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            this.data.tasks[taskIndex] = { ...this.data.tasks[taskIndex], ...updates };
            this.save();
            return this.data.tasks[taskIndex];
        }
        return null;
    }

    deleteTask(taskId) {
        this.data.tasks = this.data.tasks.filter(t => t.id !== taskId);
        this.save();
    }

    getTasks() {
        return this.data.tasks;
    }

    /**
     * Scrum Board management
     */
    createScrumBoard(name) {
        const board = {
            id: 'board-' + Date.now(),
            name: name,
            columns: {
                'todo': [],
                'inprogress': [],
                'done': []
            }
        };
        this.data.scrumBoards.push(board);
        this.save();
        return board;
    }

    deleteScrumBoard(boardId) {
        this.data.scrumBoards = this.data.scrumBoards.filter(b => b.id !== boardId);
        this.save();
    }

    addCardToColumn(boardId, column, card) {
        const board = this.data.scrumBoards.find(b => b.id === boardId);
        if (board) {
            card.id = 'card-' + Date.now();
            card.createdAt = new Date().toISOString();
            board.columns[column].push(card);
            this.save();
            return card;
        }
        return null;
    }

    moveCard(boardId, fromColumn, toColumn, cardId, toIndex) {
        const board = this.data.scrumBoards.find(b => b.id === boardId);
        if (board) {
            const cardIndex = board.columns[fromColumn].findIndex(c => c.id === cardId);
            if (cardIndex !== -1) {
                const [card] = board.columns[fromColumn].splice(cardIndex, 1);
                board.columns[toColumn].splice(toIndex, 0, card);
                this.save();
                return card;
            }
        }
        return null;
    }

    updateCard(boardId, column, cardId, updates) {
        const board = this.data.scrumBoards.find(b => b.id === boardId);
        if (board) {
            const cardIndex = board.columns[column].findIndex(c => c.id === cardId);
            if (cardIndex !== -1) {
                board.columns[column][cardIndex] = { 
                    ...board.columns[column][cardIndex], 
                    ...updates 
                };
                this.save();
                return board.columns[column][cardIndex];
            }
        }
        return null;
    }

    deleteCard(boardId, column, cardId) {
        const board = this.data.scrumBoards.find(b => b.id === boardId);
        if (board) {
            board.columns[column] = board.columns[column].filter(c => c.id !== cardId);
            this.save();
        }
    }

    getScrumBoards() {
        return this.data.scrumBoards;
    }

    /**
     * Habit Tracker management
     */
    addHabit(habit) {
        habit.id = 'habit-' + Date.now();
        habit.createdAt = new Date().toISOString();
        habit.completedDates = [];
        this.data.habits.push(habit);
        this.save();
        return habit;
    }

    toggleHabitDate(habitId, dateStr) {
        const habit = this.data.habits.find(h => h.id === habitId);
        if (habit) {
            const index = habit.completedDates.indexOf(dateStr);
            if (index === -1) {
                habit.completedDates.push(dateStr);
            } else {
                habit.completedDates.splice(index, 1);
            }
            this.save();
            return habit.completedDates;
        }
        return null;
    }

    deleteHabit(habitId) {
        this.data.habits = this.data.habits.filter(h => h.id !== habitId);
        this.save();
    }

    getHabits() {
        return this.data.habits;
    }

    /**
     * Journaling management
     */
    saveJournalEntry(date, type, content, mood) {
        if (!this.data.journals[date]) {
            this.data.journals[date] = {
                date: date,
                morning: null,
                evening: null,
                mood: null,
                stats: {}
            };
        }

        if (type === 'morning') {
            this.data.journals[date].morning = {
                content: content,
                savedAt: new Date().toISOString()
            };
        } else if (type === 'evening') {
            this.data.journals[date].evening = {
                content: content,
                savedAt: new Date().toISOString()
            };
        }

        if (mood) {
            this.data.journals[date].mood = mood;
        }

        this.save();
        return this.data.journals[date];
    }

    getJournalEntry(date) {
        return this.data.journals[date] || null;
    }

    getJournalsForMonth(year, month) {
        const journals = {};
        Object.keys(this.data.journals).forEach(date => {
            const [y, m] = date.split('-');
            if (parseInt(y) === year && parseInt(m) === month + 1) {
                journals[date] = this.data.journals[date];
            }
        });
        return journals;
    }

    getAllJournalDates() {
        return Object.keys(this.data.journals);
    }

    /**
     * Gamification management
     */
    addXP(amount) {
        this.data.gamification.xp += amount;
        
        // Level up calculation (100 XP per level)
        const newLevel = Math.floor(this.data.gamification.xp / 100) + 1;
        const leveledUp = newLevel > this.data.gamification.level;
        
        this.data.gamification.level = newLevel;
        this.save();
        
        return {
            xp: this.data.gamification.xp,
            level: this.data.gamification.level,
            leveledUp: leveledUp,
            xpToNextLevel: 100 - (this.data.gamification.xp % 100)
        };
    }

    getGamificationData() {
        return this.data.gamification;
    }

    /**
     * Media files management
     */
    addMediaFile(fileData) {
        fileData.id = 'media-' + Date.now();
        fileData.addedAt = new Date().toISOString();
        this.data.mediaFiles.push(fileData);
        this.save();
        return fileData;
    }

    deleteMediaFile(mediaId) {
        this.data.mediaFiles = this.data.mediaFiles.filter(m => m.id !== mediaId);
        this.save();
    }

    getMediaFiles() {
        return this.data.mediaFiles;
    }

    /**
     * Settings management
     */
    updateSettings(settings) {
        this.data.settings = { ...this.data.settings, ...settings };
        this.save();
    }

    getSettings() {
        return this.data.settings;
    }

    /**
     * Export all data as JSON
     */
    exportData() {
        try {
            const exportData = {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                data: this.data
            };
            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            console.error('Error exporting data:', error);
            return null;
        }
    }

    /**
     * Import data from JSON
     */
    importData(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            if (imported.data) {
                this.data = imported.data;
                this.save();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    /**
     * Factory reset
     */
    factoryReset() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            this.data = this.initializeData();
            return true;
        } catch (error) {
            console.error('Error during factory reset:', error);
            return false;
        }
    }

    /**
     * Get comprehensive stats for archive
     */
    getArchiveStats(date) {
        const journalData = this.data.journals[date];
        const habitsCompleted = this.data.habits.filter(h => 
            h.completedDates.includes(date)
        ).length;
        
        const pomodoroSessions = this.data.pomodoro.sessions.filter(s => 
            s.startedAt.startsWith(date)
        );
        
        const tasksCompleted = this.data.tasks.filter(t => 
            t.completedAt && t.completedAt.startsWith(date)
        ).length;

        return {
            journal: journalData,
            habitsCompleted,
            pomodoroSessions: pomodoroSessions.length,
            pomodoroMinutes: Math.round(
                pomodoroSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60
            ),
            tasksCompleted
        };
    }
}

// Export singleton instance
export const dataManager = new DataManager();
