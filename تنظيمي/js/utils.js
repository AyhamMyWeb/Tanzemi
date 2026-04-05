/**
 * تنظيمي - Utils Module
 * Helpers, Confetti, Animations, Error handling
 */

/**
 * Confetti Animation System
 */
export class ConfettiSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationId = null;
        this.isActive = false;
    }

    init() {
        this.canvas = document.getElementById('confetti-canvas');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'confetti-canvas';
            document.body.appendChild(this.canvas);
        }
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }

    createParticle(x, y) {
        const colors = ['#ffd700', '#4ade80', '#60a5fa', '#a78bfa', '#f87171'];
        return {
            x: x || Math.random() * this.canvas.width,
            y: y || -20,
            size: Math.random() * 10 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedX: Math.random() * 4 - 2,
            speedY: Math.random() * 3 + 2,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 10 - 5,
            opacity: 1
        };
    }

    start(options = {}) {
        this.init();
        this.isActive = true;
        this.particles = [];
        
        const particleCount = options.count || 150;
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(this.createParticle());
        }
        
        this.animate();
        
        // Auto stop after duration
        const duration = options.duration || 3000;
        setTimeout(() => this.stop(), duration);
    }

    animate() {
        if (!this.isActive || !this.ctx) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach((particle, index) => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.rotation += particle.rotationSpeed;
            particle.opacity -= 0.005;

            if (particle.y > this.canvas.height) {
                particle.y = -20;
                particle.x = Math.random() * this.canvas.width;
            }

            if (particle.opacity <= 0) {
                this.particles.splice(index, 1);
            } else {
                this.ctx.save();
                this.ctx.translate(particle.x, particle.y);
                this.ctx.rotate((particle.rotation * Math.PI) / 180);
                this.ctx.globalAlpha = particle.opacity;
                this.ctx.fillStyle = particle.color;
                this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
                this.ctx.restore();
            }
        });

        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }

    stop() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

/**
 * Animation Utilities
 */
export const animations = {
    fadeIn(element, duration = 500) {
        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms ease-in-out`;
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
        });
    },

    slideIn(element, direction = 'left', duration = 500) {
        const transforms = {
            left: 'translateX(-20px)',
            right: 'translateX(20px)',
            up: 'translateY(-20px)',
            down: 'translateY(20px)'
        };
        
        element.style.transform = transforms[direction];
        element.style.opacity = '0';
        element.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        
        requestAnimationFrame(() => {
            element.style.transform = 'translate(0)';
            element.style.opacity = '1';
        });
    },

    pulse(element, duration = 1000) {
        element.style.animation = `pulse ${duration}ms ease-in-out`;
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    },

    shake(element, duration = 500) {
        element.style.animation = `shake ${duration}ms ease-in-out`;
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    },

    scaleUp(element, duration = 300) {
        element.style.transform = 'scale(0.9)';
        element.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        
        requestAnimationFrame(() => {
            element.style.transform = 'scale(1)';
        });
    }
};

/**
 * Format utilities
 */
export const formatters = {
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0) {
            return `${hours} ساعة و ${mins} دقيقة`;
        }
        return `${mins} دقيقة`;
    },

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    formatDateTime(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    getDayName(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ar-EG', { weekday: 'long' });
    },

    getMonthName(monthIndex) {
        const months = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];
        return months[monthIndex];
    },

    calculateStreak(dates) {
        if (!dates || dates.length === 0) return 0;
        
        const sortedDates = [...dates].sort().reverse();
        let streak = 1;
        
        for (let i = 1; i < sortedDates.length; i++) {
            const currentDate = new Date(sortedDates[i - 1]);
            const prevDate = new Date(sortedDates[i]);
            
            const diffTime = currentDate.getTime() - prevDate.getTime();
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            
            if (diffDays === 1) {
                streak++;
            } else if (diffDays > 1) {
                break;
            }
        }
        
        return streak;
    }
};

/**
 * Error Handler
 */
export class ErrorHandler {
    static handle(error, context = '') {
        console.error(`[${context}] Error:`, error);
        
        // Log to error tracking service (if implemented)
        // You can integrate with services like Sentry here
        
        // Show user-friendly message
        const messages = {
            'QuotaExceededError': '⚠️ مساحة التخزين ممتلئة',
            'NotAllowedError': '❌ تم رفض الإذن',
            'NotFoundError': '❌ العنصر غير موجود',
            'InvalidStateError': '❌ حالة غير صالحة',
            'SyntaxError': '❌ خطأ في تنسيق البيانات'
        };
        
        const userMessage = messages[error.name] || '⚠️ حدث خطأ غير متوقع';
        
        return {
            success: false,
            error: error.message,
            userMessage: userMessage
        };
    }

    static async tryCatch(asyncFn, context = '') {
        try {
            const result = await asyncFn();
            return { success: true, data: result };
        } catch (error) {
            return this.handle(error, context);
        }
    }
}

/**
 * Notification System
 */
export class NotificationSystem {
    static show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getIcon(type)}"></i>
            <span>${message}</span>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            padding: 16px 24px;
            border-radius: 12px;
            border: 1px solid var(--glass-border);
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 5000;
            animation: slideDown 0.3s ease-out;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    static getIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

/**
 * Debounce and Throttle utilities
 */
export const utils = {
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    isEmpty(obj) {
        return Object.keys(obj).length === 0;
    },

    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translate(-50%, -20px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translate(-50%, 0);
        }
        to {
            opacity: 0;
            transform: translate(-50%, -20px);
        }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Export instances
export const confetti = new ConfettiSystem();
