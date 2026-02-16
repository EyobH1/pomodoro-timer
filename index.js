
class PomodoroTimer {
    constructor() {
        this.timerDisplay = document.getElementById('timerDisplay');
        this.sessionType = document.getElementById('sessionType');
        this.startPauseBtn = document.getElementById('startPauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.skipBtn = document.getElementById('skipBtn');
        this.progressDots = document.getElementById('progressDots');
        this.completionSound = document.getElementById('completionSound');
        
        this.workDurationInput = document.getElementById('workDuration');
        this.shortBreakInput = document.getElementById('shortBreakDuration');
        this.longBreakInput = document.getElementById('longBreakDuration');
        this.sessionsBeforeLongBreakInput = document.getElementById('sessionsBeforeLongBreak');
        this.applySettingsBtn = document.getElementById('applySettings');
        
        this.completedSessionsEl = document.getElementById('completedSessions');
        this.totalFocusTimeEl = document.getElementById('totalFocusTime');
        this.currentStreakEl = document.getElementById('currentStreak');
        
        this.progressCircle = document.querySelector('.progress-ring-circle');
        this.circumference = 2 * Math.PI * 130; // 2πr where r=130
        
        this.state = {
            isRunning: false,
            currentTime: 0,
            totalTime: 0,
            timerInterval: null,
            currentSession: 'work', 
            completedSessions: 0,
            totalFocusTime: 0,
            currentStreak: 0
        };
        
        this.settings = {
            workDuration: 25 * 60, // 25 minutes in seconds
            shortBreakDuration: 5 * 60, // 5 minutes
            longBreakDuration: 15 * 60, // 15 minutes
            sessionsBeforeLongBreak: 4
        };
        
        this.initializeApp();
    }
    
    initializeApp() {
        this.progressCircle.style.strokeDasharray = this.circumference;
        this.progressCircle.style.strokeDashoffset = this.circumference;
        
        this.loadFromLocalStorage();
        
        this.resetTimer();
        
        this.startPauseBtn.addEventListener('click', () => this.toggleTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        this.skipBtn.addEventListener('click', () => this.skipSession());
        this.applySettingsBtn.addEventListener('click', () => this.applySettings());
        
        this.workDurationInput.addEventListener('change', () => this.updateSettingsPreview());
        this.shortBreakInput.addEventListener('change', () => this.updateSettingsPreview());
        
        this.updateProgressDots();
        
        this.updateStatistics();
    }
    
    toggleTimer() {
        if (this.state.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }
    
    startTimer() {
        this.state.isRunning = true;
        this.startPauseBtn.textContent = 'Pause';
        this.startPauseBtn.classList.add('btn-secondary');
        this.startPauseBtn.classList.remove('btn-primary');
        
        this.state.timerInterval = setInterval(() => {
            this.state.currentTime--;
            
            if (this.state.currentTime <= 0) {
                this.completeSession();
            } else {
                this.updateDisplay();
            }
        }, 1000);
    }
    
    pauseTimer() {
        this.state.isRunning = false;
        this.startPauseBtn.textContent = 'Resume';
        this.startPauseBtn.classList.add('btn-primary');
        this.startPauseBtn.classList.remove('btn-secondary');
        
        clearInterval(this.state.timerInterval);
    }
    
    resetTimer() {
        this.pauseTimer();
        this.startPauseBtn.textContent = 'Start';
        this.startPauseBtn.classList.add('btn-primary');
        this.startPauseBtn.classList.remove('btn-secondary');
        
        switch (this.state.currentSession) {
            case 'work':
                this.state.totalTime = this.settings.workDuration;
                break;
            case 'shortBreak':
                this.state.totalTime = this.settings.shortBreakDuration;
                break;
            case 'longBreak':
                this.state.totalTime = this.settings.longBreakDuration;
                break;
        }
        
        this.state.currentTime = this.state.totalTime;
        this.updateDisplay();
    }
    
    skipSession() {
        this.completeSession(true);
    }
    
    completeSession(isSkipped = false) {
        clearInterval(this.state.timerInterval);
        
        if (!isSkipped) {
            this.playCompletionSound();
            this.timerDisplay.classList.add('timer-complete');
            setTimeout(() => {
                this.timerDisplay.classList.remove('timer-complete');
            }, 1500);
            
            if (this.state.currentSession === 'work') {
                this.state.completedSessions++;
                this.state.totalFocusTime += this.settings.workDuration / 60; 
                this.state.currentStreak++;
            }
        }
        
        this.nextSession();
        
        this.saveToLocalStorage();
        this.updateStatistics();
        this.updateProgressDots();
    }
    
    nextSession() {
        if (this.state.currentSession === 'work') {
            if (this.state.completedSessions % this.settings.sessionsBeforeLongBreak === 0) {
                this.state.currentSession = 'longBreak';
                this.state.totalTime = this.settings.longBreakDuration;
                this.sessionType.textContent = 'Long Break';
                this.progressCircle.style.stroke = '#45b7d1'; 
            } else {
                this.state.currentSession = 'shortBreak';
                this.state.totalTime = this.settings.shortBreakDuration;
                this.sessionType.textContent = 'Short Break';
                this.progressCircle.style.stroke = '#4ecdc4'; 
            }
        } else {
            this.state.currentSession = 'work';
            this.state.totalTime = this.settings.workDuration;
            this.sessionType.textContent = 'Focus Time';
            this.progressCircle.style.stroke = '#ff6b6b'; 
        }
        
        this.state.currentTime = this.state.totalTime;
        this.state.isRunning = false;
        this.startPauseBtn.textContent = 'Start';
        this.startPauseBtn.classList.add('btn-primary');
        this.startPauseBtn.classList.remove('btn-secondary');
        
        this.updateDisplay();
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.state.currentTime / 60);
        const seconds = this.state.currentTime % 60;
        
        this.timerDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const progress = this.state.currentTime / this.state.totalTime;
        const offset = this.circumference * progress;
        this.progressCircle.style.strokeDashoffset = offset;
    }
    
    updateProgressDots() {
        this.progressDots.innerHTML = '';
        
        const totalDots = this.settings.sessionsBeforeLongBreak;
        
        for (let i = 0; i < totalDots; i++) {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            
            if (i < this.state.completedSessions % totalDots) {
                dot.classList.add('completed');
            } else if (i === this.state.completedSessions % totalDots && this.state.currentSession === 'work') {
                dot.classList.add('current');
            }
            
            this.progressDots.appendChild(dot);
        }
    }
    
    updateStatistics() {
        this.completedSessionsEl.textContent = this.state.completedSessions;
        this.totalFocusTimeEl.textContent = Math.floor(this.state.totalFocusTime);
        this.currentStreakEl.textContent = this.state.currentStreak;
    }
    
    applySettings() {
        this.settings.workDuration = parseInt(this.workDurationInput.value) * 60;
        this.settings.shortBreakDuration = parseInt(this.shortBreakInput.value) * 60;
        this.settings.longBreakDuration = parseInt(this.longBreakInput.value) * 60;
        this.settings.sessionsBeforeLongBreak = parseInt(this.sessionsBeforeLongBreakInput.value);
        
        this.resetTimer();
        this.updateProgressDots();
        
        this.saveToLocalStorage();
        
        this.showNotification('Settings applied successfully!');
    }
    
    updateSettingsPreview() {
        const work = parseInt(this.workDurationInput.value);
        const shortBreak = parseInt(this.shortBreakInput.value);
        const longBreak = parseInt(this.longBreakInput.value);
        
        if (work < 1 || work > 60) {
            this.workDurationInput.style.borderColor = 'var(--primary-color)';
        } else {
            this.workDurationInput.style.borderColor = '';
        }
        
        if (shortBreak < 1 || shortBreak > 30) {
            this.shortBreakInput.style.borderColor = 'var(--primary-color)';
        } else {
            this.shortBreakInput.style.borderColor = '';
        }
        
        if (longBreak < 1 || longBreak > 60) {
            this.longBreakInput.style.borderColor = 'var(--primary-color)';
        } else {
            this.longBreakInput.style.borderColor = '';
        }
    }
    
    playCompletionSound() {
        try {
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
        } catch (error) {
            console.log('Audio context not supported:', error);
            this.completionSound.play().catch(e => console.log('Audio play failed:', e));
        }
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-color);
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            box-shadow: var(--shadow);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }
    
    saveToLocalStorage() {
        const data = {
            settings: this.settings,
            state: {
                completedSessions: this.state.completedSessions,
                totalFocusTime: this.state.totalFocusTime,
                currentStreak: this.state.currentStreak
            }
        };
        localStorage.setItem('pomodoroTimer', JSON.stringify(data));
    }
    
    loadFromLocalStorage() {
        const saved = localStorage.getItem('pomodoroTimer');
        if (saved) {
            const data = JSON.parse(saved);
            
            this.settings = { ...this.settings, ...data.settings };
            this.workDurationInput.value = this.settings.workDuration / 60;
            this.shortBreakInput.value = this.settings.shortBreakDuration / 60;
            this.longBreakInput.value = this.settings.longBreakDuration / 60;
            this.sessionsBeforeLongBreakInput.value = this.settings.sessionsBeforeLongBreak;
            
            this.state.completedSessions = data.state.completedSessions || 0;
            this.state.totalFocusTime = data.state.totalFocusTime || 0;
            this.state.currentStreak = data.state.currentStreak || 0;
        }
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});