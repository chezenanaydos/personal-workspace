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

    function esc(str) {
        return (str || '').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    /* =========================================================
       4. NOTEPAD — Multi-notes with Dropdown, Auto-naming, Inline Double-Tap Rename, Add & Delete
       ========================================================= */
    const notesSelect      = document.getElementById('notes-select');
    const notesRenameInput = document.getElementById('notes-rename-input');
    const noteAddBtn       = document.getElementById('note-add-btn');
    const noteDeleteBtn    = document.getElementById('note-delete-btn');
    const notepadArea      = document.getElementById('notepad-area');

    let savedNotes = [];
    try {
        savedNotes = JSON.parse(localStorage.getItem('ws-notes-list') || '[]');
    } catch(e) {
        savedNotes = [];
    }

    if (!Array.isArray(savedNotes) || savedNotes.length === 0) {
        const legacyNote = localStorage.getItem('ws-notepad') || '';
        savedNotes = [{ id: 'note-1', customTitle: '', content: legacyNote }];
        localStorage.setItem('ws-notes-list', JSON.stringify(savedNotes));
    }

    let activeNoteId = localStorage.getItem('ws-active-note-id') || savedNotes[0].id;
    if (!savedNotes.some(n => n.id === activeNoteId)) {
        activeNoteId = savedNotes[0].id;
    }

    function getNoteTitle(n, idx) {
        if (n.customTitle && n.customTitle.trim()) {
            return n.customTitle.trim();
        }
        const firstLine = (n.content || '').split('\n').find(l => l.trim().length > 0);
        if (firstLine) {
            return firstLine.trim().slice(0, 28);
        }
        return `Note ${idx + 1}`;
    }

    function saveNotesToStorage() {
        localStorage.setItem('ws-notes-list', JSON.stringify(savedNotes));
        localStorage.setItem('ws-active-note-id', activeNoteId);
    }

    function renderNotesDropdown() {
        if (!notesSelect) return;
        notesSelect.innerHTML = '';
        savedNotes.forEach((n, idx) => {
            const opt = document.createElement('option');
            opt.value = n.id;
            opt.textContent = getNoteTitle(n, idx);
            if (n.id === activeNoteId) opt.selected = true;
            notesSelect.appendChild(opt);
        });
    }

    function loadActiveNoteContent() {
        if (!notepadArea) return;
        const cur = savedNotes.find(n => n.id === activeNoteId);
        notepadArea.value = cur ? cur.content : '';
    }

    // Inline rename helpers
    function startRenamingNote() {
        if (!notesSelect || !notesRenameInput) return;
        const cur = savedNotes.find(n => n.id === activeNoteId);
        if (!cur) return;
        const idx = savedNotes.indexOf(cur);
        const currentTitle = getNoteTitle(cur, idx);

        notesSelect.style.display = 'none';
        notesRenameInput.style.display = 'inline-block';
        notesRenameInput.value = currentTitle;
        notesRenameInput.focus();
        notesRenameInput.select();
    }

    function finishRenamingNote(save = true) {
        if (!notesRenameInput || notesRenameInput.style.display === 'none') return;
        if (save) {
            const cur = savedNotes.find(n => n.id === activeNoteId);
            if (cur) {
                const trimmed = notesRenameInput.value.trim();
                cur.customTitle = trimmed; // If left empty, clears custom title so it auto-syncs with typed text
                saveNotesToStorage();
                renderNotesDropdown();
            }
        }
        notesRenameInput.style.display = 'none';
        if (notesSelect) notesSelect.style.display = 'inline-block';
    }

    if (notesRenameInput) {
        notesRenameInput.addEventListener('blur', () => finishRenamingNote(true));
        notesRenameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finishRenamingNote(true);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                finishRenamingNote(false);
            }
        });
    }

    if (notesSelect) {
        // Single click/press chooses note
        notesSelect.addEventListener('change', () => {
            activeNoteId = notesSelect.value;
            localStorage.setItem('ws-active-note-id', activeNoteId);
            loadActiveNoteContent();
        });

        // Double click to rename inline
        notesSelect.addEventListener('dblclick', (e) => {
            e.preventDefault();
            startRenamingNote();
        });

        // Double tap detection for touch screens
        let lastTap = 0;
        notesSelect.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTap < 350 && now - lastTap > 0) {
                e.preventDefault();
                startRenamingNote();
            }
            lastTap = now;
        });
    }

    if (notepadArea) {
        notepadArea.addEventListener('input', () => {
            const cur = savedNotes.find(n => n.id === activeNoteId);
            if (cur) {
                cur.content = notepadArea.value;
                // Auto-sync typed content to dropdown if no custom title was manually set
                if (!cur.customTitle) {
                    const idx = savedNotes.indexOf(cur);
                    const opt = notesSelect ? notesSelect.querySelector(`option[value="${activeNoteId}"]`) : null;
                    if (opt) {
                        opt.textContent = getNoteTitle(cur, idx);
                    }
                }
                saveNotesToStorage();
            }
        });
    }

    if (noteAddBtn) {
        noteAddBtn.addEventListener('click', () => {
            const newId = 'note-' + Date.now();
            const newNote = {
                id: newId,
                customTitle: '',
                content: ''
            };
            savedNotes.push(newNote);
            activeNoteId = newId;
            saveNotesToStorage();
            renderNotesDropdown();
            loadActiveNoteContent();
            if (notepadArea) notepadArea.focus();
        });
    }

    if (noteDeleteBtn) {
        noteDeleteBtn.addEventListener('click', () => {
            if (savedNotes.length <= 1) {
                savedNotes[0].content = '';
                savedNotes[0].customTitle = '';
                saveNotesToStorage();
                renderNotesDropdown();
                loadActiveNoteContent();
                return;
            }
            const idx = savedNotes.findIndex(n => n.id === activeNoteId);
            if (idx !== -1) {
                savedNotes.splice(idx, 1);
                activeNoteId = savedNotes[Math.max(0, idx - 1)].id;
                saveNotesToStorage();
                renderNotesDropdown();
                loadActiveNoteContent();
            }
        });
    }

    renderNotesDropdown();
    loadActiveNoteContent();

    /* =========================================================
       SMOOTH POINTER DRAG & DROP REORDERING ENGINE
       ========================================================= */
    function initSmoothDrag({ container, itemSelector, handleSelector, onReorder }) {
        if (!container) return;

        container.addEventListener('pointerdown', (e) => {
            const handle = e.target.closest(handleSelector);
            if (!handle) return;
            const item = handle.closest(itemSelector);
            if (!item || !container.contains(item)) return;

            e.preventDefault();

            const allItems = Array.from(container.querySelectorAll(itemSelector));
            const initialIndex = allItems.indexOf(item);
            if (initialIndex === -1) return;

            const rect = item.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;

            // Global dragging cursor
            document.body.classList.add('is-dragging-active');

            // Create detached floating clone
            const cloneWrapper = document.createElement('div');
            cloneWrapper.className = 'ws-drag-floating';
            cloneWrapper.style.width  = `${rect.width}px`;
            cloneWrapper.style.height = `${rect.height}px`;
            cloneWrapper.style.left   = `${rect.left}px`;
            cloneWrapper.style.top    = `${rect.top}px`;

            if (item.tagName.toLowerCase() === 'tr') {
                const table = document.createElement('table');
                table.style.width = '100%';
                table.style.height = '100%';
                table.style.tableLayout = 'fixed';
                const tbody = document.createElement('tbody');
                const rowClone = item.cloneNode(true);

                // Preserve exact cell widths and input states
                const origTds = item.querySelectorAll('td');
                const cloneTds = rowClone.querySelectorAll('td');
                origTds.forEach((td, i) => {
                    if (cloneTds[i]) {
                        cloneTds[i].style.width = `${td.getBoundingClientRect().width}px`;
                    }
                });

                const origInputs = item.querySelectorAll('input');
                const cloneInputs = rowClone.querySelectorAll('input');
                origInputs.forEach((inp, i) => {
                    if (cloneInputs[i]) {
                        cloneInputs[i].value = inp.value;
                        cloneInputs[i].checked = inp.checked;
                    }
                });

                tbody.appendChild(rowClone);
                table.appendChild(tbody);
                cloneWrapper.appendChild(table);
            } else {
                const itemClone = item.cloneNode(true);
                const origInputs = item.querySelectorAll('input');
                const cloneInputs = itemClone.querySelectorAll('input');
                origInputs.forEach((inp, i) => {
                    if (cloneInputs[i]) {
                        cloneInputs[i].value = inp.value;
                        cloneInputs[i].checked = inp.checked;
                    }
                });
                cloneWrapper.appendChild(itemClone);
            }

            document.body.appendChild(cloneWrapper);

            // Turn dragged element into visual placeholder slot
            item.classList.add('ws-drag-placeholder');

            function onPointerMove(moveEvent) {
                cloneWrapper.style.left = `${moveEvent.clientX - offsetX}px`;
                cloneWrapper.style.top  = `${moveEvent.clientY - offsetY}px`;

                // Live reordering in the list
                const siblings = Array.from(container.querySelectorAll(itemSelector)).filter(el => el !== item);
                for (const sibling of siblings) {
                    const sibRect = sibling.getBoundingClientRect();
                    if (moveEvent.clientY >= sibRect.top && moveEvent.clientY <= sibRect.bottom) {
                        const isAfter = moveEvent.clientY > sibRect.top + sibRect.height / 2;
                        if (isAfter) {
                            if (sibling.nextSibling !== item) {
                                container.insertBefore(item, sibling.nextSibling);
                            }
                        } else {
                            if (item.nextSibling !== sibling) {
                                container.insertBefore(item, sibling);
                            }
                        }
                        break;
                    }
                }
            }

            function onPointerUp() {
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerup', onPointerUp);
                window.removeEventListener('pointercancel', onPointerUp);

                document.body.classList.remove('is-dragging-active');
                item.classList.remove('ws-drag-placeholder');

                if (cloneWrapper && cloneWrapper.parentNode) {
                    cloneWrapper.parentNode.removeChild(cloneWrapper);
                }

                const finalItems = Array.from(container.querySelectorAll(itemSelector));
                const finalIndex = finalItems.indexOf(item);
                if (finalIndex !== -1 && finalIndex !== initialIndex) {
                    onReorder(initialIndex, finalIndex);
                }
            }

            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
            window.addEventListener('pointercancel', onPointerUp);
        });
    }

    /* =========================================================
       5. TASK SCHEDULE TABLE
       ========================================================= */
    const scheduleTbody  = document.getElementById('schedule-tbody');
    const scheduleAddBtn = document.getElementById('schedule-add-btn');

    let scheduleTasks = [];
    try {
        scheduleTasks = JSON.parse(localStorage.getItem('ws-schedule-tasks') || '[]');
    } catch(e) {
        scheduleTasks = [];
    }

    if (!Array.isArray(scheduleTasks) || scheduleTasks.length === 0) {
        scheduleTasks = [
            { id: 1, name: 'Deep Work Session', time: '10:30AM-11:30AM', status: 'In Progress', done: false },
            { id: 2, name: 'Review emails & plan', time: '01:00PM-02:00PM', status: 'Pending', done: false },
            { id: 3, name: 'Wrap-up & notes review', time: '04:30PM-05:00PM', status: 'Pending', done: true }
        ];
        localStorage.setItem('ws-schedule-tasks', JSON.stringify(scheduleTasks));
    }

    function saveScheduleTasks() {
        localStorage.setItem('ws-schedule-tasks', JSON.stringify(scheduleTasks));
    }

    const DRAG_HANDLE_SVG = `<svg class="ws-drag-dots" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="8.5" cy="5" r="2"/><circle cx="15.5" cy="5" r="2"/><circle cx="8.5" cy="12" r="2"/><circle cx="15.5" cy="12" r="2"/><circle cx="8.5" cy="19" r="2"/><circle cx="15.5" cy="19" r="2"/></svg>`;

    function renderSchedule() {
        if (!scheduleTbody) return;
        scheduleTbody.innerHTML = '';
        if (scheduleTasks.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="6" style="text-align: center; color: var(--color-text-dim); padding: 1.5rem;">No tasks scheduled yet. Click + to add one!</td>`;
            scheduleTbody.appendChild(tr);
            return;
        }

        scheduleTasks.forEach((task, idx) => {
            const tr = document.createElement('tr');
            if (task.done) tr.classList.add('row-done');

            tr.innerHTML = `
                <td style="text-align: center;">
                    <span class="ws-drag-handle" title="Hold to drag and reorder">${DRAG_HANDLE_SVG}</span>
                </td>
                <td>
                    <input type="text" class="ws-tbl-input ws-tbl-name" value="${esc(task.name)}" placeholder="Task name..." aria-label="Task name">
                </td>
                <td>
                    <input type="text" class="ws-tbl-input ws-tbl-time" value="${esc(task.time)}" placeholder="e.g. 10:30AM-11:30AM" aria-label="Task time">
                </td>
                <td>
                    <input type="text" class="ws-tbl-input ws-tbl-status" value="${esc(task.status)}" placeholder="Status..." aria-label="Task status">
                </td>
                <td style="text-align: center;">
                    <input type="checkbox" class="ws-tbl-checkbox" ${task.done ? 'checked' : ''} aria-label="Mark done">
                </td>
                <td style="text-align: center;">
                    <button class="ws-tbl-del-btn" title="Delete row" aria-label="Delete schedule row"><i class="bx bx-trash"></i></button>
                </td>
            `;

            const nameIn  = tr.querySelector('.ws-tbl-name');
            const timeIn  = tr.querySelector('.ws-tbl-time');
            const statIn  = tr.querySelector('.ws-tbl-status');
            const checkIn = tr.querySelector('.ws-tbl-checkbox');
            const delBtn  = tr.querySelector('.ws-tbl-del-btn');

            nameIn.addEventListener('input', () => { task.name = nameIn.value; saveScheduleTasks(); });
            timeIn.addEventListener('input', () => { task.time = timeIn.value; saveScheduleTasks(); });
            statIn.addEventListener('input', () => { task.status = statIn.value; saveScheduleTasks(); });
            checkIn.addEventListener('change', () => {
                task.done = checkIn.checked;
                tr.classList.toggle('row-done', task.done);
                saveScheduleTasks();
            });
            delBtn.addEventListener('click', () => {
                scheduleTasks.splice(idx, 1);
                saveScheduleTasks();
                renderSchedule();
            });

            scheduleTbody.appendChild(tr);
        });
    }

    if (scheduleAddBtn) {
        scheduleAddBtn.addEventListener('click', () => {
            const newRow = {
                id: Date.now(),
                name: '',
                time: '',
                status: 'Pending',
                done: false
            };
            scheduleTasks.push(newRow);
            saveScheduleTasks();
            renderSchedule();
            const rows = scheduleTbody.querySelectorAll('tr');
            const lastRow = rows[rows.length - 1];
            if (lastRow) {
                const input = lastRow.querySelector('.ws-tbl-name');
                if (input) input.focus();
            }
        });
    }

    initSmoothDrag({
        container: scheduleTbody,
        itemSelector: 'tr',
        handleSelector: '.ws-drag-handle',
        onReorder: (fromIndex, toIndex) => {
            const [moved] = scheduleTasks.splice(fromIndex, 1);
            scheduleTasks.splice(toIndex, 0, moved);
            saveScheduleTasks();
            renderSchedule();
        }
    });

    renderSchedule();

    /* =========================================================
       6. QUICK TASKS CHECKLIST
       ========================================================= */
    const quickTaskList   = document.getElementById('quick-task-list');
    const quickTaskAddBtn = document.getElementById('quick-task-add-btn');

    let quickTasks = [];
    try {
        quickTasks = JSON.parse(localStorage.getItem('ws-quick-tasks') || '[]');
    } catch(e) {
        quickTasks = [];
    }

    if (!Array.isArray(quickTasks) || quickTasks.length === 0) {
        quickTasks = [
            { id: 1, text: 'Brainstorm creative ideas', done: false },
            { id: 2, text: 'Review schedule for tomorrow', done: true }
        ];
        localStorage.setItem('ws-quick-tasks', JSON.stringify(quickTasks));
    }

    function saveQuickTasks() {
        localStorage.setItem('ws-quick-tasks', JSON.stringify(quickTasks));
    }

    function renderQuickTasks() {
        if (!quickTaskList) return;
        quickTaskList.innerHTML = '';
        if (quickTasks.length === 0) {
            const li = document.createElement('li');
            li.style.cssText = 'text-align: center; color: var(--color-text-dim); padding: 2rem 1rem; font-size: var(--font-size-sm);';
            li.textContent = 'No tasks yet. Click + to add one!';
            quickTaskList.appendChild(li);
            return;
        }

        quickTasks.forEach((task, idx) => {
            const li = document.createElement('li');
            li.className = 'ws-quick-item' + (task.done ? ' done' : '');

            li.innerHTML = `
                <span class="ws-drag-handle" title="Hold to drag and reorder">${DRAG_HANDLE_SVG}</span>
                <input type="checkbox" class="ws-quick-check" ${task.done ? 'checked' : ''} aria-label="Mark task done">
                <input type="text" class="ws-quick-input" value="${esc(task.text)}" placeholder="Type a task..." aria-label="Task item text">
                <button class="ws-quick-del" title="Delete task" aria-label="Delete task"><i class="bx bx-x"></i></button>
            `;

            const check = li.querySelector('.ws-quick-check');
            const input = li.querySelector('.ws-quick-input');
            const del   = li.querySelector('.ws-quick-del');

            check.addEventListener('change', () => {
                task.done = check.checked;
                li.classList.toggle('done', task.done);
                saveQuickTasks();
            });

            input.addEventListener('input', () => {
                task.text = input.value;
                saveQuickTasks();
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (quickTaskAddBtn) quickTaskAddBtn.click();
                }
            });

            del.addEventListener('click', () => {
                quickTasks.splice(idx, 1);
                saveQuickTasks();
                renderQuickTasks();
            });

            quickTaskList.appendChild(li);
        });
    }

    if (quickTaskAddBtn) {
        quickTaskAddBtn.addEventListener('click', () => {
            const newTask = {
                id: Date.now(),
                text: '',
                done: false
            };
            quickTasks.push(newTask);
            saveQuickTasks();
            renderQuickTasks();
            const items = quickTaskList.querySelectorAll('.ws-quick-item');
            const lastItem = items[items.length - 1];
            if (lastItem) {
                const input = lastItem.querySelector('.ws-quick-input');
                if (input) input.focus();
            }
        });
    }

    initSmoothDrag({
        container: quickTaskList,
        itemSelector: 'li',
        handleSelector: '.ws-drag-handle',
        onReorder: (fromIndex, toIndex) => {
            const [moved] = quickTasks.splice(fromIndex, 1);
            quickTasks.splice(toIndex, 0, moved);
            saveQuickTasks();
            renderQuickTasks();
        }
    });

    renderQuickTasks();

    /* =========================================================
       7. LIVE PHILIPPINE TIME CLOCK (GMT+8)
       ========================================================= */
    const clockTimeEl = document.getElementById('schedule-clock-time');

    function updateScheduleClock() {
        if (!clockTimeEl) return;
        const now = new Date();
        // Use Intl to get exact PH time (Asia/Manila = GMT+8)
        const timeStr = now.toLocaleTimeString('en-PH', {
            timeZone: 'Asia/Manila',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        clockTimeEl.textContent = timeStr;
    }

    // Run immediately, then every second
    updateScheduleClock();
    setInterval(updateScheduleClock, 1000);

});

