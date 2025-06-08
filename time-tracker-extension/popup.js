class TaskTimeTracker {
    constructor() {
        this.tasks = [];
        this.currentTask = null;
        this.startTime = null;
        this.timerInterval = null;
        this.isRunning = false;
        this.isStarting = false; // Flag to prevent multiple simultaneous starts

        this.initializeElements();
        this.setupEventListeners();
        this.init();
    }

    async init() {
        await this.loadData();
        this.updateDisplay();
    }

    initializeElements() {
        // Input elements
        this.taskInput = document.getElementById('taskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');

        // Current task elements
        this.currentTaskSection = document.getElementById('currentTaskSection');
        this.currentTaskName = document.getElementById('currentTaskName');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');

        // Task list elements
        this.tasksList = document.getElementById('tasksList');

        // Statistics elements
        this.toggleStats = document.getElementById('toggleStats');
        this.statsContent = document.getElementById('statsContent');
        this.todayTotal = document.getElementById('todayTotal');
        this.weekTotal = document.getElementById('weekTotal');
        this.totalTasks = document.getElementById('totalTasks');
    }

    setupEventListeners() {
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        this.pauseBtn.addEventListener('click', async () => {
            if (this.isRunning) {
                // Currently running - pause the timer
                this.pauseBtn.disabled = true;
                this.pauseBtn.textContent = '⏳ Pausing...';
                await this.pauseTimer();
            } else if (this.currentTask && !this.isStarting) {
                // Currently paused - resume the timer
                this.pauseBtn.disabled = true;
                this.pauseBtn.textContent = '⏳ Resuming...';
                await this.resumeTask();
            }
            // Button state will be reset in updateCurrentTaskDisplay()
        });
        
        this.stopBtn.addEventListener('click', async () => {
            this.stopBtn.disabled = true;
            this.stopBtn.textContent = '⏳ Stopping...';
            await this.stopTimer();
            // Button state will be reset in updateCurrentTaskDisplay()
        });
        this.toggleStats.addEventListener('click', () => this.toggleStatistics());

        // Listen for background script messages
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'timerUpdate') {
                this.handleTimerUpdate(message.data);
            }
        });
    }

    async loadData() {
        try {
            const result = await chrome.storage.local.get(['tasks', 'currentTask', 'isRunning', 'startTime']);
            
            this.tasks = result.tasks || [];
            this.currentTask = result.currentTask || null;
            this.isRunning = result.isRunning || false;
            this.startTime = result.startTime || null;

            if (this.isRunning && this.currentTask) {
                this.startTimer(false); // Resume timer without updating storage
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    async saveData() {
        try {
            await chrome.storage.local.set({
                tasks: this.tasks,
                currentTask: this.currentTask,
                isRunning: this.isRunning,
                startTime: this.startTime
            });
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    addTask() {
        const taskName = this.taskInput.value.trim();
        if (!taskName) return;

        const newTask = {
            id: Date.now(),
            name: taskName,
            totalTime: 0,
            sessions: [],
            createdAt: new Date().toISOString()
        };

        this.tasks.push(newTask);
        this.taskInput.value = '';
        this.saveData();
        this.updateDisplay();
    }

    async startTask(taskId) {
        // Prevent multiple simultaneous starts
        if (this.isStarting) {
            return;
        }
        
        this.isStarting = true;
        
        try {
            // Stop current timer if running
            if (this.isRunning) {
                await this.stopTimer();
            }

            const task = this.tasks.find(t => t.id === taskId);
            if (!task) {
                this.isStarting = false;
                this.updateDisplay();
                return;
            }

            this.currentTask = task;
            this.startTime = Date.now();
            this.isRunning = true;

            await this.saveData();
            
            // Notify background script
            chrome.runtime.sendMessage({
                action: 'startTimer',
                taskId: taskId,
                startTime: this.startTime
            });

            this.startTimer();
            
        } catch (error) {
            console.error('Error starting task:', error);
            this.isRunning = false;
            this.currentTask = null;
        } finally {
            this.isStarting = false;
            this.updateDisplay();
        }
    }

    startTimer(updateStorage = true) {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(() => {
            this.updateTimerDisplay();
        }, 1000);

        this.updateTimerDisplay();
    }

    async resumeTask() {
        if (!this.currentTask || this.isRunning || this.isStarting) {
            return;
        }

        try {
            this.startTime = Date.now();
            this.isRunning = true;

            await this.saveData();
            
            // Notify background script
            chrome.runtime.sendMessage({
                action: 'startTimer',
                taskId: this.currentTask.id,
                startTime: this.startTime
            });

            this.startTimer();
            
        } catch (error) {
            console.error('Error resuming task:', error);
            this.isRunning = false;
            this.startTime = null;
        } finally {
            this.updateDisplay();
        }
    }

    async pauseTimer() {
        if (!this.isRunning) return;

        const sessionTime = Date.now() - this.startTime;
        this.currentTask.totalTime += sessionTime;
        this.currentTask.sessions.push({
            start: this.startTime,
            end: Date.now(),
            duration: sessionTime
        });

        this.isRunning = false;
        this.startTime = null;

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        chrome.runtime.sendMessage({ action: 'pauseTimer' });
        
        await this.saveData();
        this.updateTimerDisplay(); // Update timer display to show paused time
        this.updateDisplay();
    }

    async stopTimer() {
        if (this.isRunning) {
            await this.pauseTimer();
        }

        this.currentTask = null;
        chrome.runtime.sendMessage({ action: 'stopTimer' });
        
        await this.saveData();
        this.updateDisplay();
    }

    deleteTask(taskId) {
        if (this.currentTask && this.currentTask.id === taskId) {
            this.stopTimer();
        }

        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveData();
        this.updateDisplay();
    }

    updateTimerDisplay() {
        if (!this.currentTask) {
            this.timerDisplay.textContent = '00:00:00';
            return;
        }

        if (this.isRunning && this.startTime) {
            // Timer is running - show live total time
            const currentTime = Date.now();
            const sessionTime = currentTime - this.startTime;
            const totalTime = this.currentTask.totalTime + sessionTime;
            this.timerDisplay.textContent = this.formatTime(totalTime);
        } else {
            // Timer is paused - show accumulated total time
            this.timerDisplay.textContent = this.formatTime(this.currentTask.totalTime);
        }
    }

    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    formatTimeShort(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        // If more than an hour, show hours and minutes
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        
        // If less than an hour, show MM:SS format
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateDisplay() {
        this.updateCurrentTaskDisplay();
        this.updateTasksList();
        this.updateStatistics();
    }

    updateCurrentTaskDisplay() {
        if (this.currentTask) {
            this.currentTaskSection.style.display = 'block';
            this.currentTaskName.textContent = this.currentTask.name;
            
            // Reset button states to default
            this.pauseBtn.disabled = false;
            this.stopBtn.disabled = false;
            this.stopBtn.textContent = '⏹️ Stop';
            
            if (this.isRunning) {
                // Task is running - show pause button
                this.pauseBtn.textContent = '⏸️ Pause';
                this.pauseBtn.style.display = 'inline-flex';
                this.currentTaskSection.classList.add('running');
            } else if (this.isStarting) {
                // Task is starting - show starting feedback
                this.pauseBtn.style.display = 'none';
                this.stopBtn.disabled = true;
                this.stopBtn.textContent = '⏳ Starting...';
                this.currentTaskSection.classList.add('running');
            } else {
                // Task is paused - show resume button
                this.pauseBtn.textContent = '▶️ Resume';
                this.pauseBtn.style.display = 'inline-flex';
                this.currentTaskSection.classList.remove('running');
            }
        } else {
            this.currentTaskSection.style.display = 'none';
        }
    }

    updateTasksList() {
        // Clear the tasks list first
        this.tasksList.innerHTML = '';
        
        if (this.tasks.length === 0) {
            this.tasksList.innerHTML = '<div class="no-tasks">No tasks yet. Add one above!</div>';
            return;
        }
        
        const tasksHtml = this.tasks.map(task => {
            const isActive = this.currentTask && this.currentTask.id === task.id;
            const totalTime = isActive && this.isRunning 
                ? task.totalTime + (Date.now() - this.startTime)
                : task.totalTime;

            const taskState = isActive ? (this.isRunning ? 'active running' : 'active paused') : '';
            
            return `
                <div class="task-item ${taskState}">
                    <div class="task-details">
                        <div class="task-item-name">${task.name}</div>
                        <div class="task-time">${this.formatTimeShort(totalTime)}</div>
                    </div>
                    <div class="task-actions">
                        ${!isActive && !this.isStarting ? `<button class="btn btn-success btn-small start-task-btn" data-task-id="${task.id}">▶️ Start</button>` : ''}
                        ${isActive && !this.isRunning && !this.isStarting ? `<button class="btn btn-success btn-small resume-task-btn">▶️ Resume</button>` : ''}
                        ${this.isStarting ? `<button class="btn btn-secondary btn-small" disabled>⏳ Starting...</button>` : ''}
                        <button class="btn btn-danger btn-small delete-task-btn" data-task-id="${task.id}" ${isActive && this.isRunning ? 'title="Stop timer to delete"' : ''}>🗑️</button>
                    </div>
                </div>
            `;
        }).join('');

        this.tasksList.innerHTML = tasksHtml;
        
        // Set up event listeners for the newly created buttons
        this.setupTaskListEventListeners();
    }

    setupTaskListEventListeners() {
        // Remove existing listeners to prevent duplicates
        const startButtons = this.tasksList.querySelectorAll('.start-task-btn');
        const resumeButtons = this.tasksList.querySelectorAll('.resume-task-btn');
        const deleteButtons = this.tasksList.querySelectorAll('.delete-task-btn');
        
        // Add event listeners for start buttons
        startButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.getAttribute('data-task-id'));
                
                // Prevent multiple simultaneous starts
                if (this.isStarting || this.isRunning) {
                    return;
                }
                
                this.startTask(taskId);
            });
        });

        // Add event listeners for resume buttons
        resumeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Prevent multiple simultaneous resumes
                if (this.isStarting || this.isRunning) {
                    return;
                }
                
                this.resumeTask();
            });
        });
        
        // Add event listeners for delete buttons
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.getAttribute('data-task-id'));
                
                // Prevent deletion of running task without confirmation
                if (this.currentTask && this.currentTask.id === taskId && this.isRunning) {
                    if (!confirm('This task is currently running. Stopping it will save the current session. Continue?')) {
                        return;
                    }
                }
                
                if (confirm('Are you sure you want to delete this task? All time data will be lost.')) {
                    this.deleteTask(taskId);
                }
            });
        });
    }

    updateStatistics() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());

        let todayTime = 0;
        let weekTime = 0;

        this.tasks.forEach(task => {
            task.sessions.forEach(session => {
                const sessionDate = new Date(session.start);
                
                if (sessionDate >= today) {
                    todayTime += session.duration;
                }
                if (sessionDate >= weekStart) {
                    weekTime += session.duration;
                }
            });

            // Add current running session if applicable
            if (this.currentTask && this.currentTask.id === task.id && this.isRunning) {
                const currentSessionTime = Date.now() - this.startTime;
                const sessionStart = new Date(this.startTime);
                
                if (sessionStart >= today) {
                    todayTime += currentSessionTime;
                }
                if (sessionStart >= weekStart) {
                    weekTime += currentSessionTime;
                }
            }
        });

        this.todayTotal.textContent = this.formatTimeShort(todayTime);
        this.weekTotal.textContent = this.formatTimeShort(weekTime);
        this.totalTasks.textContent = this.tasks.length.toString();
    }

    toggleStatistics() {
        const isVisible = this.statsContent.style.display !== 'none';
        this.statsContent.style.display = isVisible ? 'none' : 'block';
        this.toggleStats.textContent = isVisible ? '📊 View Statistics' : '📊 Hide Statistics';
    }

    handleTimerUpdate(data) {
        if (data.currentTask) {
            this.currentTask = data.currentTask;
            this.isRunning = data.isRunning;
            this.startTime = data.startTime;
            this.updateDisplay();
        }
    }
}

// Initialize the tracker when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.tracker = new TaskTimeTracker();
    });
} else {
    // DOM is already loaded
    window.tracker = new TaskTimeTracker();
} 