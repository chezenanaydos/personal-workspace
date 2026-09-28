/**
 * Zen Space — script.js
 * 1. Sidebar Toggle (brand/icon swap)
 * 2. Navigation Active Link Switching
 * 3. Timer Widget (countdown + alarm)
 * 4. Notepad (auto-save localStorage)
 * 5. Task Manager
 */

document.addEventListener('DOMContentLoaded', () => {

    /* =========================================================
       1. SIDEBAR TOGGLE
       ========================================================= */
    const sidebar       = document.getElementById('workspace-sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    // Start collapsed (brand hidden, icon shown)
    document.body.classList.add('sidebar-collapsed');
    if (sidebar) sidebar.classList.add('collapsed');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
            if (sidebar) sidebar.classList.toggle('collapsed', isCollapsed);
            sidebarToggle.setAttribute('aria-expanded', String(!isCollapsed));
        });
    }

    /* =========================================================
       2. NAV ACTIVE LINK SWITCHING
       ========================================================= */
    const navLinks = document.querySelectorAll('.navigation-buttons a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    /* =========================================================
       3. TIMER WIDGET
       ========================================================= */
    const timerDisplay   = document.getElementById('timer-display');
    const timerHoursIn   = document.getElementById('timer-hours');
    const timerMinutesIn = document.getElementById('timer-minutes');
    const timerSecondsIn = document.getElementById('timer-seconds');
    const timerStartBtn  = document.getElementById('timer-start');
    const timerPauseBtn  = document.getElementById('timer-pause');
    const timerResetBtn  = document.getElementById('timer-reset');
    const timerAlarmBtn  = document.getElementById('timer-alarm-toggle');

    if (timerDisplay) {
        let timerInterval    = null;
        let timerRemaining   = 0;
        let timerAlarmOn     = false;
        let timerAlarmFiring = false;
        let audioCtx         = null;

        function getAudioCtx() {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            return audioCtx;
        }

        function playBeep(freq, dur) {
            try {
                const ctx  = getAudioCtx();
                const osc  = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                gain.gain.setValueAtTime(0.5, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + dur);
            } catch(e) {}
        }

        function playAlarmTone() {
            playBeep(880,  0.15);
            setTimeout(() => playBeep(1100, 0.15), 200);
            setTimeout(() => playBeep(880,  0.15), 400);
        }

        function fmt(secs) {
            const h = String(Math.floor(secs / 3600)).padStart(2, '0');
            const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
            const s = String(secs % 60).padStart(2, '0');
            return `${h}:${m}:${s}`;
        }

        function getInputSecs() {
            return (parseInt(timerHoursIn.value)   || 0) * 3600
                 + (parseInt(timerMinutesIn.value)  || 0) * 60
                 + (parseInt(timerSecondsIn.value)  || 0);
        }

        function stopAlarm() {
            timerAlarmFiring = false;
            timerDisplay.classList.remove('timer-alarm-fire');
        }

        function startTimer() {
            if (timerInterval) return;
            stopAlarm();
            if (timerRemaining === 0) {
                timerRemaining = getInputSecs();
                if (timerRemaining === 0) return;
            }
            timerDisplay.classList.add('timer-running');
            timerStartBtn.style.display = 'none';
            timerPauseBtn.style.display = 'flex';

            timerInterval = setInterval(() => {
                timerRemaining--;
                timerDisplay.textContent = fmt(timerRemaining);
                if (timerRemaining <= 0) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    timerDisplay.classList.remove('timer-running');
                    timerStartBtn.style.display = 'flex';
                    timerPauseBtn.style.display = 'none';
                    if (timerAlarmOn) {
                        timerAlarmFiring = true;
                        timerDisplay.classList.add('timer-alarm-fire');
                        playAlarmTone();
                        const loop = setInterval(() => {
                            if (!timerAlarmFiring) { clearInterval(loop); return; }
                            playAlarmTone();
                        }, 1200);
                    }
                }
            }, 1000);
        }

        function pauseTimer() {
            clearInterval(timerInterval);
            timerInterval = null;
            timerDisplay.classList.remove('timer-running');
            timerStartBtn.style.display = 'flex';
            timerPauseBtn.style.display = 'none';
        }

        function resetTimer() {
            clearInterval(timerInterval);
            timerInterval = null;
            timerRemaining = 0;
            timerDisplay.classList.remove('timer-running');
            timerStartBtn.style.display = 'flex';
            timerPauseBtn.style.display = 'none';
            stopAlarm();
            timerDisplay.textContent = '00:00:00';
            timerHoursIn.value = timerMinutesIn.value = timerSecondsIn.value = 0;
        }

        timerStartBtn.addEventListener('click', startTimer);
        timerPauseBtn.addEventListener('click', pauseTimer);
        timerResetBtn.addEventListener('click', resetTimer);
        timerDisplay.addEventListener('click',  () => { if (timerAlarmFiring) stopAlarm(); });

        timerAlarmBtn.addEventListener('click', () => {
            if (timerAlarmFiring) { stopAlarm(); return; }
            timerAlarmOn = !timerAlarmOn;
            timerAlarmBtn.classList.toggle('alarm-active', timerAlarmOn);
            timerAlarmBtn.title = timerAlarmOn ? 'Alarm On — click to disable' : 'Alarm Off';
            timerAlarmBtn.querySelector('i').className = timerAlarmOn ? 'bx bx-bell' : 'bx bx-bell-off';
        });
    }

    /* =========================================================
       4. NOTEPAD — auto-save to localStorage
       ========================================================= */
    const notepadArea  = document.getElementById('notepad-area');
    const notepadClear = document.getElementById('notepad-clear');

    if (notepadArea) {
        notepadArea.value = localStorage.getItem('ws-notepad') || '';
        notepadArea.addEventListener('input', () => {
            localStorage.setItem('ws-notepad', notepadArea.value);
        });
    }

    if (notepadClear) {
        notepadClear.addEventListener('click', () => {
            if (!notepadArea) return;
            if (notepadArea.value.trim() && !confirm('Clear all notes?')) return;
            notepadArea.value = '';
            localStorage.removeItem('ws-notepad');
        });
    }

    /* =========================================================
       5. TASK MANAGER
       ========================================================= */
    const taskForm        = document.getElementById('task-form');
    const taskNameInput   = document.getElementById('task-name-input');
    const taskTimeInput   = document.getElementById('task-time-input');
    const taskDoneInitial = document.getElementById('task-done-initial');
    const taskList        = document.getElementById('task-list');
    const taskCount       = document.getElementById('task-count');
    const taskEmptyState  = document.getElementById('task-empty-state');

    let tasks = JSON.parse(localStorage.getItem('ws-tasks') || '[]');

    function saveTasks() { localStorage.setItem('ws-tasks', JSON.stringify(tasks)); }

    function updateTaskCount() {
        if (!taskCount) return;
        const total = tasks.length;
        const done  = tasks.filter(t => t.done).length;
        taskCount.textContent = total === 0 ? '0 tasks' : `${done}/${total} done`;
    }

    function esc(str) {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function renderTasks() {
        if (!taskList) return;
        Array.from(taskList.children).forEach(c => { if (c.id !== 'task-empty-state') c.remove(); });
        if (tasks.length === 0) {
            if (taskEmptyState) taskEmptyState.style.display = '';
            updateTaskCount();
            return;
        }
        if (taskEmptyState) taskEmptyState.style.display = 'none';

        tasks.forEach((task, idx) => {
            const li = document.createElement('li');
            li.className = 'ws-task-item' + (task.done ? ' done' : '');
            li.innerHTML = `
                <input type="checkbox" class="ws-task-item-check" ${task.done ? 'checked' : ''} aria-label="Mark done">
                <span class="ws-task-item-name">${esc(task.name)}</span>
                ${task.time ? `<span class="ws-task-item-time">${task.time}</span>` : ''}
                <button class="ws-task-item-delete" title="Delete" aria-label="Delete task"><i class="bx bx-x"></i></button>
            `;
            li.querySelector('.ws-task-item-check').addEventListener('change', e => {
                tasks[idx].done = e.target.checked;
                li.classList.toggle('done', tasks[idx].done);
                saveTasks(); updateTaskCount();
            });
            li.querySelector('.ws-task-item-delete').addEventListener('click', () => {
                tasks.splice(idx, 1);
                saveTasks(); renderTasks();
            });
            taskList.appendChild(li);
        });
        updateTaskCount();
    }

    if (taskForm) {
        taskForm.addEventListener('submit', e => {
            e.preventDefault();
            const name = taskNameInput.value.trim();
            if (!name) return;
            tasks.unshift({
                id:   Date.now(),
                name,
                time: taskTimeInput.value || '',
                done: taskDoneInitial ? taskDoneInitial.checked : false
            });
            saveTasks(); renderTasks();
            taskNameInput.value = '';
            taskTimeInput.value = '';
            if (taskDoneInitial) taskDoneInitial.checked = false;
            taskNameInput.focus();
        });
    }

    renderTasks();

});

