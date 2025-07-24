/**
 * CBT Portal - Timer JavaScript
 * Handles test timer functionality with precision and safety features
 */

class TestTimer {
    constructor(options = {}) {
        this.duration = options.duration || 3600; // Default 1 hour in seconds
        this.startTime = options.startTime || Math.floor(Date.now() / 1000);
        this.endTime = this.startTime + this.duration;
        this.element = options.element || document.getElementById('time-display');
        this.warningTime = options.warningTime || 600; // 10 minutes warning
        this.dangerTime = options.dangerTime || 300; // 5 minutes danger
        this.onWarning = options.onWarning || null;
        this.onDanger = options.onDanger || null;
        this.onTimeUp = options.onTimeUp || null;
        this.onTick = options.onTick || null;
        
        this.intervalId = null;
        this.isRunning = false;
        this.warningTriggered = false;
        this.dangerTriggered = false;
        
        this.init();
    }
    
    /**
     * Initialize the timer
     */
    init() {
        this.updateDisplay();
        this.start();
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handlePageHidden();
            } else {
                this.handlePageVisible();
            }
        });
        
        // Handle beforeunload to save state
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });
        
        // Load saved state if exists
        this.loadState();
    }
    
    /**
     * Start the timer
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.intervalId = setInterval(() => {
            this.tick();
        }, 1000);
        
        console.log('Timer started');
    }
    
    /**
     * Stop the timer
     */
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        console.log('Timer stopped');
    }
    
    /**
     * Pause the timer
     */
    pause() {
        this.stop();
        this.saveState();
    }
    
    /**
     * Resume the timer
     */
    resume() {
        this.loadState();
        this.start();
    }
    
    /**
     * Reset the timer
     */
    reset() {
        this.stop();
        this.startTime = Math.floor(Date.now() / 1000);
        this.endTime = this.startTime + this.duration;
        this.warningTriggered = false;
        this.dangerTriggered = false;
        this.updateDisplay();
        this.clearState();
    }
    
    /**
     * Timer tick function
     */
    tick() {
        const now = Math.floor(Date.now() / 1000);
        const remaining = this.endTime - now;
        
        // Check if time is up
        if (remaining <= 0) {
            this.handleTimeUp();
            return;
        }
        
        // Check for warning threshold
        if (!this.warningTriggered && remaining <= this.warningTime) {
            this.handleWarning();
        }
        
        // Check for danger threshold
        if (!this.dangerTriggered && remaining <= this.dangerTime) {
            this.handleDanger();
        }
        
        this.updateDisplay(remaining);
        
        // Call custom tick handler
        if (this.onTick) {
            this.onTick(remaining);
        }
        
        // Update page title with remaining time
        this.updatePageTitle(remaining);
    }
    
    /**
     * Update the timer display
     * @param {number} remaining - Remaining seconds
     */
    updateDisplay(remaining = null) {
        if (remaining === null) {
            const now = Math.floor(Date.now() / 1000);
            remaining = Math.max(0, this.endTime - now);
        }
        
        const formatted = this.formatTime(remaining);
        
        if (this.element) {
            this.element.textContent = formatted;
            
            // Update timer container classes
            const timerContainer = this.element.closest('#timer');
            if (timerContainer) {
                timerContainer.classList.remove('text-warning', 'text-danger');
                
                if (remaining <= this.dangerTime) {
                    timerContainer.classList.add('text-danger');
                } else if (remaining <= this.warningTime) {
                    timerContainer.classList.add('text-warning');
                }
            }
        }
    }
    
    /**
     * Update page title with remaining time
     * @param {number} remaining - Remaining seconds
     */
    updatePageTitle(remaining) {
        const formatted = this.formatTime(remaining);
        const originalTitle = document.querySelector('title').getAttribute('data-original') || document.title;
        
        if (!document.querySelector('title').getAttribute('data-original')) {
            document.querySelector('title').setAttribute('data-original', originalTitle);
        }
        
        document.title = `(${formatted}) ${originalTitle}`;
    }
    
    /**
     * Handle warning time reached
     */
    handleWarning() {
        this.warningTriggered = true;
        console.log('Timer warning triggered');
        
        // Show warning notification
        if (window.CBTPortal && window.CBTPortal.showToast) {
            window.CBTPortal.showToast(
                `⚠️ ${Math.floor(this.warningTime / 60)} minutes remaining!`, 
                'warning', 
                5000
            );
        }
        
        // Add pulsing animation
        if (this.element) {
            this.element.style.animation = 'pulse 1s infinite';
        }
        
        // Call custom warning handler
        if (this.onWarning) {
            this.onWarning();
        }
    }
    
    /**
     * Handle danger time reached
     */
    handleDanger() {
        this.dangerTriggered = true;
        console.log('Timer danger triggered');
        
        // Show danger notification
        if (window.CBTPortal && window.CBTPortal.showToast) {
            window.CBTPortal.showToast(
                `🚨 Only ${Math.floor(this.dangerTime / 60)} minutes left!`, 
                'error', 
                8000
            );
        }
        
        // Add urgent pulsing animation
        if (this.element) {
            this.element.style.animation = 'pulse 0.5s infinite';
        }
        
        // Play sound notification if available
        this.playNotificationSound();
        
        // Call custom danger handler
        if (this.onDanger) {
            this.onDanger();
        }
    }
    
    /**
     * Handle time up
     */
    handleTimeUp() {
        this.stop();
        console.log('Time is up!');
        
        // Update display to show 00:00
        this.updateDisplay(0);
        
        // Show time up notification
        if (window.CBTPortal && window.CBTPortal.showToast) {
            window.CBTPortal.showToast(
                '⏰ Time is up! Your test will be submitted automatically.', 
                'error', 
                10000
            );
        }
        
        // Play urgent sound
        this.playNotificationSound(true);
        
        // Flash the screen
        this.flashScreen();
        
        // Call custom time up handler
        if (this.onTimeUp) {
            this.onTimeUp();
        }
    }
    
    /**
     * Format time in HH:MM:SS or MM:SS format
     * @param {number} seconds 
     * @returns {string}
     */
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    /**
     * Get remaining time in seconds
     * @returns {number}
     */
    getRemainingTime() {
        const now = Math.floor(Date.now() / 1000);
        return Math.max(0, this.endTime - now);
    }
    
    /**
     * Get elapsed time in seconds
     * @returns {number}
     */
    getElapsedTime() {
        const now = Math.floor(Date.now() / 1000);
        return Math.max(0, now - this.startTime);
    }
    
    /**
     * Check if timer is running
     * @returns {boolean}
     */
    isTimerRunning() {
        return this.isRunning;
    }
    
    /**
     * Check if time is up
     * @returns {boolean}
     */
    isTimeUp() {
        return this.getRemainingTime() <= 0;
    }
    
    /**
     * Save timer state to localStorage
     */
    saveState() {
        const state = {
            duration: this.duration,
            startTime: this.startTime,
            endTime: this.endTime,
            warningTriggered: this.warningTriggered,
            dangerTriggered: this.dangerTriggered,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('cbt_timer_state', JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save timer state:', error);
        }
    }
    
    /**
     * Load timer state from localStorage
     */
    loadState() {
        try {
            const saved = localStorage.getItem('cbt_timer_state');
            if (!saved) return;
            
            const state = JSON.parse(saved);
            
            // Check if state is recent (within 1 hour)
            const age = Date.now() - state.timestamp;
            if (age > 60 * 60 * 1000) {
                this.clearState();
                return;
            }
            
            this.duration = state.duration;
            this.startTime = state.startTime;
            this.endTime = state.endTime;
            this.warningTriggered = state.warningTriggered;
            this.dangerTriggered = state.dangerTriggered;
            
        } catch (error) {
            console.error('Failed to load timer state:', error);
            this.clearState();
        }
    }
    
    /**
     * Clear saved timer state
     */
    clearState() {
        try {
            localStorage.removeItem('cbt_timer_state');
        } catch (error) {
            console.error('Failed to clear timer state:', error);
        }
    }
    
    /**
     * Handle page hidden (user switched tab/minimized)
     */
    handlePageHidden() {
        this.saveState();
        
        // Show notification if browser supports it
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('CBT Test in Progress', {
                body: 'Your test timer is still running. Please return to complete your test.',
                icon: '/favicon.ico',
                requireInteraction: true
            });
        }
    }
    
    /**
     * Handle page visible (user returned to tab)
     */
    handlePageVisible() {
        // Check for time discrepancies
        const now = Math.floor(Date.now() / 1000);
        const expectedRemaining = this.endTime - now;
        
        if (expectedRemaining <= 0 && this.isRunning) {
            this.handleTimeUp();
        } else {
            this.updateDisplay();
        }
    }
    
    /**
     * Play notification sound
     * @param {boolean} urgent - Whether to play urgent sound
     */
    playNotificationSound(urgent = false) {
        try {
            // Create audio context for beep sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = urgent ? 800 : 600;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            
            if (urgent) {
                // Play multiple beeps for urgent notification
                setTimeout(() => {
                    const osc2 = audioContext.createOscillator();
                    const gain2 = audioContext.createGain();
                    osc2.connect(gain2);
                    gain2.connect(audioContext.destination);
                    osc2.frequency.value = 1000;
                    osc2.type = 'sine';
                    gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                    osc2.start(audioContext.currentTime);
                    osc2.stop(audioContext.currentTime + 0.3);
                }, 600);
            }
        } catch (error) {
            console.error('Failed to play notification sound:', error);
        }
    }
    
    /**
     * Flash the screen for urgent attention
     */
    flashScreen() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(220, 53, 69, 0.3);
            z-index: 9999;
            pointer-events: none;
            animation: flash 0.5s ease-in-out 3;
        `;
        
        // Add flash animation if not exists
        if (!document.querySelector('#flash-style')) {
            const style = document.createElement('style');
            style.id = 'flash-style';
            style.textContent = `
                @keyframes flash {
                    0%, 100% { opacity: 0; }
                    50% { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.remove();
        }, 1500);
    }
    
    /**
     * Request notification permission
     */
    static requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('Notification permission:', permission);
            });
        }
    }
    
    /**
     * Create a timer with default test settings
     * @param {number} durationMinutes - Test duration in minutes
     * @param {Function} onTimeUp - Callback when time is up
     * @returns {TestTimer}
     */
    static createTestTimer(durationMinutes, onTimeUp) {
        return new TestTimer({
            duration: durationMinutes * 60,
            warningTime: Math.min(600, durationMinutes * 60 * 0.2), // 20% or 10 minutes
            dangerTime: Math.min(300, durationMinutes * 60 * 0.1), // 10% or 5 minutes
            onTimeUp: onTimeUp,
            onWarning: () => {
                console.log('Timer warning: 20% time remaining');
            },
            onDanger: () => {
                console.log('Timer danger: 10% time remaining');
            }
        });
    }
}

// Export for global use
window.TestTimer = TestTimer;

// Auto-initialize timer if test session exists
document.addEventListener('DOMContentLoaded', function() {
    // Request notification permission
    TestTimer.requestNotificationPermission();
    
    // Initialize timer if on test page
    const timerElement = document.getElementById('time-display');
    if (timerElement && window.testSession) {
        window.testTimer = TestTimer.createTestTimer(
            testSession.duration / 60,
            window.autoSubmitTest || function() {
                alert('Time is up! Your test will be submitted automatically.');
                if (window.submitTest) {
                    window.submitTest();
                }
            }
        );
    }
});
