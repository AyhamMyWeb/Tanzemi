/**
 * تنظيمي - Pomodoro Module
 * Hyper-Advanced Pomodoro Timer with Chart.js Visuals
 */

import { dataManager } from './data-manager.js';
import { formatters, confetti } from './utils.js';

export class PomodoroManager {
    constructor() {
        this.timer = null;
        this.isRunning = false;
        this.currentTime = 0;
        this.mode = 'focus'; // focus, shortBreak, longBreak
        this.totalSeconds = 0;
        this.focusSecondsAccumulated = 0;
        this.chartInstance = null;
        this.currentView = 'week';
        
        this.elements = {};
        this.audioContext = null;
    }

    init() {
        this.cacheElements();
        this.loadSettings();
        this.recoverSession();
        this.setupEventListeners();
        this.renderChart();
        this.updateStats();
        
        // Start every-second persistence
        setInterval(() => this.persistCurrentState(), 1000);
    }

    cacheElements() {
        this.elements = {
            timerDisplay: document.getElementById('timer-display'),
            timerModeFocus: document.getElementById('timer-mode-focus'),
            timerModeShort: document.getElementById('timer-mode-short'),
            timerModeLong: document.getElementById('timer-mode-long'),
            btnStart: document.getElementById('pomodoro-start'),
            btnPause: document.getElementById('pomodoro-pause'),
            btnReset: document.getElementById('pomodoro-reset'),
            focusDuration: document.getElementById('focus-duration'),
            shortBreakDuration: document.getElementById('short-break-duration'),
            longBreakDuration: document.getElementById('long-break-duration'),
            btnSaveSettings: document.getElementById('save-pomodoro-settings'),
            chartType: document.getElementById('chart-type'),
            chartContainer: document.querySelector('.chart-container'),
            totalFocusTime: document.getElementById('total-focus-time'),
            sessionsToday: document.getElementById('sessions-today'),
            sessionsWeek: document.getElementById('sessions-week')
        };
    }

    loadSettings() {
        const stats = dataManager.getPomodoroStats();
        const settings = stats.settings;
        
        if (this.elements.focusDuration) {
            this.elements.focusDuration.value = settings.focusDuration;
            this.elements.shortBreakDuration.value = settings.shortBreakDuration;
            this.elements.longBreakDuration.value = settings.longBreakDuration;
        }
        
        this.setMode('focus');
    }

    setupEventListeners() {
        // Mode buttons
        this.elements.timerModeFocus?.addEventListener('click', () => this.setMode('focus'));
        this.elements.timerModeShort?.addEventListener('click', () => this.setMode('shortBreak'));
        this.elements.timerModeLong?.addEventListener('click', () => this.setMode('longBreak'));
        
        // Control buttons
        this.elements.btnStart?.addEventListener('click', () => this.start());
        this.elements.btnPause?.addEventListener('click', () => this.pause());
        this.elements.btnReset?.addEventListener('click', () => this.reset());
        
        // Settings
        this.elements.btnSaveSettings?.addEventListener('click', () => this.saveSettings());
        
        // Chart type toggle
        this.elements.chartType?.addEventListener('change', (e) => {
            this.currentView = e.target.value;
            this.renderChart();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    setMode(mode) {
        this.mode = mode;
        const settings = dataManager.getPomodoroStats().settings;
        
        switch (mode) {
            case 'focus':
                this.totalSeconds = settings.focusDuration * 60;
                this.elements.timerModeFocus?.classList.add('active');
                this.elements.timerModeShort?.classList.remove('active');
                this.elements.timerModeLong?.classList.remove('active');
                break;
            case 'shortBreak':
                this.totalSeconds = settings.shortBreakDuration * 60;
                this.elements.timerModeFocus?.classList.remove('active');
                this.elements.timerModeShort?.classList.add('active');
                this.elements.timerModeLong?.classList.remove('active');
                break;
            case 'longBreak':
                this.totalSeconds = settings.longBreakDuration * 60;
                this.elements.timerModeFocus?.classList.remove('active');
                this.elements.timerModeShort?.classList.remove('active');
                this.elements.timerModeLong?.classList.add('active');
                break;
        }
        
        this.currentTime = this.totalSeconds;
        this.updateDisplay();
        
        if (this.isRunning) {
            this.pause();
        }
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        // Initialize session if starting fresh
        if (this.currentTime === this.totalSeconds && this.mode === 'focus') {
            this.initializeSession();
        }
        
        this.timer = setInterval(() => {
            this.tick();
        }, 1000);
        
        this.elements.btnStart?.classList.add('hidden');
        this.elements.btnPause?.classList.remove('hidden');
    }

    pause() {
        this.isRunning = false;
        clearInterval(this.timer);
        
        this.elements.btnStart?.classList.remove('hidden');
        this.elements.btnPause?.classList.add('hidden');
        
        // Save current state
        this.persistCurrentState();
    }

    toggle() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    }

    reset() {
        this.pause();
        this.currentTime = this.totalSeconds;
        this.focusSecondsAccumulated = 0;
        this.updateDisplay();
        
        // Clear any pending session
        dataManager.savePomodoroSession({
            mode: this.mode,
            startTime: null,
            focusSeconds: 0
        });
    }

    tick() {
        if (this.currentTime > 0) {
            this.currentTime--;
            this.updateDisplay();
            
            // Track focus seconds
            if (this.mode === 'focus') {
                this.focusSecondsAccumulated++;
                dataManager.savePomodoroSession({
                    focusSeconds: dataManager.data.pomodoro.totalFocusSeconds + this.focusSecondsAccumulated
                });
            }
        } else {
            this.complete();
        }
    }

    complete() {
        this.pause();
        this.playNotificationSound();
        
        if (this.mode === 'focus') {
            // Complete the session
            const session = dataManager.completePomodoroSession();
            if (session) {
                confetti.start({ count: 100, duration: 2000 });
                
                // Add XP for completion
                const xpResult = dataManager.addXP(10);
                if (xpResult.leveledUp) {
                    this.showLevelUpNotification(xpResult.level);
                }
            }
            
            // Suggest break
            setTimeout(() => {
                if (confirm('🎉 أحسنت! اكتملت جلسة التركيز. هل تريد أخذ استراحة قصيرة؟')) {
                    this.setMode('shortBreak');
                }
            }, 500);
        }
        
        this.updateStats();
        this.renderChart();
    }

    initializeSession() {
        const now = new Date().toISOString();
        dataManager.savePomodoroSession({
            mode: this.mode,
            startedAt: now,
            focusSeconds: dataManager.data.pomodoro.totalFocusSeconds,
            duration: 0
        });
    }

    persistCurrentState() {
        if (this.isRunning && this.mode === 'focus') {
            dataManager.savePomodoroSession({
                focusSeconds: dataManager.data.pomodoro.totalFocusSeconds + this.focusSecondsAccumulated,
                lastUpdated: new Date().toISOString()
            });
        }
    }

    recoverSession() {
        const currentSession = dataManager.getCurrentSession();
        
        if (currentSession && currentSession.startedAt && !currentSession.completedAt) {
            // Check if session was recent (within last hour)
            const sessionTime = new Date(currentSession.startedAt).getTime();
            const now = Date.now();
            const diffMinutes = (now - sessionTime) / (1000 * 60);
            
            if (diffMinutes < 60 && currentSession.focusSeconds > 0) {
                this.focusSecondsAccumulated = currentSession.focusSeconds % 3600; // Get seconds within current hour
                dataManager.data.pomodoro.totalFocusSeconds = currentSession.focusSeconds;
            }
        }
    }

    updateDisplay() {
        if (this.elements.timerDisplay) {
            this.elements.timerDisplay.textContent = formatters.formatTime(this.currentTime);
            document.title = `${formatters.formatTime(this.currentTime)} - ${this.mode === 'focus' ? 'تركيز' : 'استراحة'}`;
        }
    }

    saveSettings() {
        try {
            const settings = {
                focusDuration: parseInt(this.elements.focusDuration?.value) || 25,
                shortBreakDuration: parseInt(this.elements.shortBreakDuration?.value) || 5,
                longBreakDuration: parseInt(this.elements.longBreakDuration?.value) || 15
            };
            
            dataManager.updatePomodoroSettings(settings);
            
            // Reload settings
            this.loadSettings();
            
            alert('✅ تم حفظ الإعدادات بنجاح');
        } catch (error) {
            console.error('Error saving Pomodoro settings:', error);
            alert('❌ حدث خطأ أثناء حفظ الإعدادات');
        }
    }

    renderChart() {
        const ctx = document.getElementById('pomodoro-chart');
        if (!ctx) return;
        
        const context = ctx.getContext('2d');
        
        // Destroy existing chart
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
        
        const stats = dataManager.getPomodoroStats();
        const data = this.prepareChartData(stats.sessions);
        
        try {
            this.chartInstance = new Chart(context, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'دقائق التركيز',
                        data: data.values,
                        backgroundColor: 'rgba(255, 215, 0, 0.6)',
                        borderColor: 'rgba(255, 215, 0, 1)',
                        borderWidth: 2,
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            labels: {
                                color: 'rgba(255, 255, 255, 0.8)',
                                font: {
                                    family: 'Cairo',
                                    size: 14
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.6)'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        x: {
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.6)',
                                font: {
                                    family: 'Cairo'
                                }
                            },
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error rendering chart:', error);
        }
    }

    prepareChartData(sessions) {
        const now = new Date();
        let labels = [];
        let values = [];
        
        if (this.currentView === 'week') {
            // Last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                
                labels.push(formatters.getDayName(dateStr));
                
                const daySessions = sessions.filter(s => s.startedAt.startsWith(dateStr));
                const totalMinutes = daySessions.reduce((acc, s) => acc + ((s.duration || 25) * 60), 0) / 60;
                values.push(Math.round(totalMinutes));
            }
        } else if (this.currentView === 'month') {
            // Last 30 days
            for (let i = 29; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                
                labels.push(date.getDate().toString());
                
                const daySessions = sessions.filter(s => s.startedAt.startsWith(dateStr));
                const totalMinutes = daySessions.reduce((acc, s) => acc + ((s.duration || 25) * 60), 0) / 60;
                values.push(Math.round(totalMinutes));
            }
        } else if (this.currentView === 'year') {
            // Last 12 months
            for (let i = 11; i >= 0; i--) {
                const date = new Date(now);
                date.setMonth(date.getMonth() - i);
                const month = date.getMonth();
                const year = date.getFullYear();
                
                labels.push(formatters.getMonthName(month));
                
                const monthSessions = sessions.filter(s => {
                    const sDate = new Date(s.startedAt);
                    return sDate.getMonth() === month && sDate.getFullYear() === year;
                });
                const totalMinutes = monthSessions.reduce((acc, s) => acc + ((s.duration || 25) * 60), 0) / 60;
                values.push(Math.round(totalMinutes));
            }
        }
        
        return { labels, values };
    }

    updateStats() {
        const stats = dataManager.getPomodoroStats();
        const totalMinutes = Math.round(stats.totalFocusSeconds / 60);
        
        if (this.elements.totalFocusTime) {
            this.elements.totalFocusTime.textContent = formatters.formatDuration(totalMinutes);
        }
        
        // Sessions today
        const today = new Date().toISOString().split('T')[0];
        const todaySessions = stats.sessions.filter(s => s.startedAt.startsWith(today)).length;
        
        if (this.elements.sessionsToday) {
            this.elements.sessionsToday.textContent = todaySessions;
        }
        
        // Sessions this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekSessions = stats.sessions.filter(s => new Date(s.startedAt) >= weekAgo).length;
        
        if (this.elements.sessionsWeek) {
            this.elements.sessionsWeek.textContent = weekSessions;
        }
    }

    playNotificationSound() {
        try {
            // Create a pleasant notification sound using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            
            // Play a second tone
            setTimeout(() => {
                const osc2 = audioContext.createOscillator();
                const gain2 = audioContext.createGain();
                
                osc2.connect(gain2);
                gain2.connect(audioContext.destination);
                
                osc2.frequency.value = 1000;
                osc2.type = 'sine';
                
                gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                
                osc2.start(audioContext.currentTime);
                osc2.stop(audioContext.currentTime + 0.5);
            }, 600);
        } catch (error) {
            console.error('Error playing notification sound:', error);
        }
    }

    showLevelUpNotification(level) {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `
            <div style="font-size: 4rem;">🎉</div>
            <h2 style="color: var(--accent-gold); margin: 20px 0;">مستوى جديد!</h2>
            <p style="font-size: 1.5rem;">وصلت للمستوى ${level}</p>
            <p style="margin-top: 10px; opacity: 0.8;">استمر في الإنجاز!</p>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    destroy() {
        this.pause();
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
    }
}

// Export singleton instance
export const pomodoroManager = new PomodoroManager();
