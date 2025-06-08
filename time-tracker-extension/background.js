class BackgroundTimer {
    constructor() {
        this.currentTask = null;
        this.isRunning = false;
        this.startTime = null;
        this.timerInterval = null;

        this.setupMessageListeners();
        this.loadState();
    }

    setupMessageListeners() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.action) {
                case 'startTimer':
                    this.startTimer(message.taskId, message.startTime);
                    break;
                case 'pauseTimer':
                    this.pauseTimer();
                    break;
                case 'stopTimer':
                    this.stopTimer();
                    break;
                case 'getTimerState':
                    sendResponse({
                        currentTask: this.currentTask,
                        isRunning: this.isRunning,
                        startTime: this.startTime
                    });
                    break;
            }
        });
    }

    async loadState() {
        try {
            const result = await chrome.storage.local.get(['currentTask', 'isRunning', 'startTime', 'tasks']);
            
            this.currentTask = result.currentTask || null;
            this.isRunning = result.isRunning || false;
            this.startTime = result.startTime || null;

            if (this.isRunning && this.currentTask && this.startTime) {
                this.resumeTimer();
            }
        } catch (error) {
            console.error('Error loading background state:', error);
        }
    }

    async saveState() {
        try {
            await chrome.storage.local.set({
                currentTask: this.currentTask,
                isRunning: this.isRunning,
                startTime: this.startTime
            });
        } catch (error) {
            console.error('Error saving background state:', error);
        }
    }

    async startTimer(taskId, startTime) {
        try {
            const result = await chrome.storage.local.get(['tasks']);
            const tasks = result.tasks || [];
            const task = tasks.find(t => t.id === taskId);
            
            if (!task) return;

            this.currentTask = task;
            this.startTime = startTime;
            this.isRunning = true;

            await this.saveState();
            
            // Set up periodic updates
            this.setupPeriodicUpdates();
            
            // Update badge
            this.updateBadge();
            
        } catch (error) {
            console.error('Error starting timer:', error);
        }
    }

    resumeTimer() {
        if (this.isRunning && this.currentTask && this.startTime) {
            this.setupPeriodicUpdates();
            this.updateBadge();
        }
    }

    async pauseTimer() {
        if (!this.isRunning || !this.currentTask) return;

        try {
            // Get current tasks from storage
            const result = await chrome.storage.local.get(['tasks']);
            const tasks = result.tasks || [];
            
            // Find and update the current task
            const taskIndex = tasks.findIndex(t => t.id === this.currentTask.id);
            if (taskIndex !== -1) {
                const sessionTime = Date.now() - this.startTime;
                tasks[taskIndex].totalTime += sessionTime;
                tasks[taskIndex].sessions = tasks[taskIndex].sessions || [];
                tasks[taskIndex].sessions.push({
                    start: this.startTime,
                    end: Date.now(),
                    duration: sessionTime
                });

                // Save updated tasks
                await chrome.storage.local.set({ tasks });
            }

            this.isRunning = false;
            this.startTime = null;
            
            await this.saveState();
            this.clearPeriodicUpdates();
            this.updateBadge();

        } catch (error) {
            console.error('Error pausing timer:', error);
        }
    }

    async stopTimer() {
        if (this.isRunning) {
            await this.pauseTimer();
        }

        this.currentTask = null;
        await this.saveState();
        this.clearPeriodicUpdates();
        this.updateBadge();
    }

    setupPeriodicUpdates() {
        this.clearPeriodicUpdates();
        
        // Update every minute
        this.timerInterval = setInterval(() => {
            this.updateBadge();
            this.broadcastUpdate();
        }, 60000);
    }

    clearPeriodicUpdates() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateBadge() {
        if (this.isRunning && this.currentTask && this.startTime) {
            const elapsedMinutes = Math.floor((Date.now() - this.startTime) / (1000 * 60));
            const totalMinutes = Math.floor(this.currentTask.totalTime / (1000 * 60)) + elapsedMinutes;
            
            if (totalMinutes > 0) {
                chrome.action.setBadgeText({
                    text: totalMinutes < 60 ? `${totalMinutes}m` : `${Math.floor(totalMinutes / 60)}h`
                });
                chrome.action.setBadgeBackgroundColor({ color: '#4299e1' });
            } else {
                chrome.action.setBadgeText({ text: '●' });
                chrome.action.setBadgeBackgroundColor({ color: '#48bb78' });
            }
        } else {
            chrome.action.setBadgeText({ text: '' });
        }
    }

    broadcastUpdate() {
        // Send update to popup if open
        chrome.runtime.sendMessage({
            action: 'timerUpdate',
            data: {
                currentTask: this.currentTask,
                isRunning: this.isRunning,
                startTime: this.startTime
            }
        }).catch(() => {
            // Popup might not be open, which is fine
        });
    }

    formatTime(milliseconds) {
        const totalMinutes = Math.floor(milliseconds / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }
}

// Initialize background timer
let backgroundTimer;

chrome.runtime.onStartup.addListener(() => {
    backgroundTimer = new BackgroundTimer();
});

chrome.runtime.onInstalled.addListener(() => {
    backgroundTimer = new BackgroundTimer();
});

// Initialize immediately
backgroundTimer = new BackgroundTimer();

// Handle extension icon click
chrome.action.onClicked.addListener(() => {
    chrome.action.openPopup();
}); 