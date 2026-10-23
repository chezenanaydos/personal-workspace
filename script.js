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
       2. NAV ACTIVE LINK SWITCHING & SECTION ROUTING
       ========================================================= */
    const navLinks    = document.querySelectorAll('.navigation-buttons a');
    const sections    = document.querySelectorAll('.ws-section');
    const pageTitleEl = document.getElementById('page-title');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href') || '';
            if (href.startsWith('#')) {
                const targetId = href.substring(1);
                // Case-insensitive match for section id (e.g. Workspace vs workspace, calendar)
                const targetSec = Array.from(sections).find(s => s.id.toLowerCase() === targetId.toLowerCase());

                if (targetSec) {
                    e.preventDefault();

                    // Switch active class
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');

                    // Show target section, hide others
                    sections.forEach(s => s.style.display = 'none');
                    targetSec.style.display = 'block';

                    // Update header title text
                    const labelSpan = link.querySelector('span');
                    if (pageTitleEl && labelSpan) {
                        pageTitleEl.textContent = labelSpan.textContent.trim();
                    }
                }
            }
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
            timerAlarmBtn.querySelector('i').className = timerAlarmOn ? 'bx bx-bell' : 'bx bx-bell-slash';
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
       7. LIVE PHILIPPINE TIME CLOCK (GMT+8) + 12h/24h TOGGLE
       ========================================================= */
    const clockTimeEl    = document.getElementById('schedule-clock-time');
    const clockFmtToggle = document.getElementById('clock-fmt-toggle');
    const clockFmtLabel  = document.getElementById('clock-fmt-label');

    // Persist format preference; default = 24h
    let clockIs12h = localStorage.getItem('ws-clock-12h') === 'true';

    function updateClockFmtLabel() {
        if (!clockFmtLabel) return;
        clockFmtLabel.textContent = clockIs12h ? '12h' : '24h';
    }

    function updateScheduleClock() {
        if (!clockTimeEl) return;
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-PH', {
            timeZone: 'Asia/Manila',
            hour:   '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: clockIs12h
        });
        clockTimeEl.textContent = timeStr;
    }

    if (clockFmtToggle) {
        clockFmtToggle.addEventListener('click', () => {
            clockIs12h = !clockIs12h;
            localStorage.setItem('ws-clock-12h', String(clockIs12h));
            updateClockFmtLabel();
            updateScheduleClock();   // refresh immediately on toggle
        });
    }

    // Init label and start ticking
    updateClockFmtLabel();
    updateScheduleClock();
    setInterval(updateScheduleClock, 1000);

    /* =========================================================
       6. GOOGLE CALENDAR COMPONENT
       ========================================================= */
    const calConfigBtn     = document.getElementById('cal-config-btn');
    const calConfigPanel   = document.getElementById('cal-config-panel');
    const calUrlInput      = document.getElementById('cal-url-input');
    const calSaveBtn       = document.getElementById('cal-save-btn');
    const calResetBtn      = document.getElementById('cal-reset-btn');
    const calIframe        = document.getElementById('google-calendar-iframe');
    const calExternalLink  = document.getElementById('cal-external-link');

    const DEFAULT_CAL_URL = 'https://calendar.google.com/calendar/embed?src=en.philippines%23holiday%40group.v.calendar.google.com&ctz=Asia%2FManila&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0';

    function buildEmbedUrl(input) {
        if (!input) return DEFAULT_CAL_URL;
        let trimmed = input.trim();

        // If user pasted an iframe tag, extract the src attribute
        const iframeSrcMatch = trimmed.match(/src=["']([^"']+)["']/i);
        if (iframeSrcMatch) {
            trimmed = iframeSrcMatch[1];
        }

        // If it's already an embed URL, return it
        if (trimmed.includes('calendar.google.com/calendar/embed')) {
            return trimmed;
        }

        // If it's an email or calendar ID, build a clean embed URL
        const calId = encodeURIComponent(trimmed);
        return `https://calendar.google.com/calendar/embed?src=${calId}&ctz=Asia%2FManila&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0`;
    }

    function loadSavedCalendar() {
        if (!calIframe) return;
        const savedUrl = localStorage.getItem('zen_custom_google_cal');
        if (savedUrl) {
            calIframe.src = savedUrl;
            if (calUrlInput) calUrlInput.value = savedUrl;
        }
    }

    if (calConfigBtn && calConfigPanel) {
        calConfigBtn.addEventListener('click', () => {
            const isHidden = calConfigPanel.style.display === 'none';
            calConfigPanel.style.display = isHidden ? 'block' : 'none';
            if (isHidden && calUrlInput) calUrlInput.focus();
        });
    }

    if (calSaveBtn && calUrlInput && calIframe) {
        calSaveBtn.addEventListener('click', () => {
            const val = calUrlInput.value.trim();
            if (!val) {
                alert('Please enter a Google Calendar email/ID or embed URL.');
                return;
            }
            const finalUrl = buildEmbedUrl(val);
            calIframe.src = finalUrl;
            localStorage.setItem('zen_custom_google_cal', finalUrl);
            calConfigPanel.style.display = 'none';
        });
    }

    if (calResetBtn && calIframe) {
        calResetBtn.addEventListener('click', () => {
            calIframe.src = DEFAULT_CAL_URL;
            if (calUrlInput) calUrlInput.value = '';
            localStorage.removeItem('zen_custom_google_cal');
            calConfigPanel.style.display = 'none';
        });
    }

    loadSavedCalendar();

    /* =========================================================
       7. PROJECT MANAGER COMPONENT
       ========================================================= */
    const pmContainer         = document.getElementById('pm-projects-container');
    const pmSearchInput       = document.getElementById('pm-search-input');
    const pmSearchClear       = document.getElementById('pm-search-clear');
    const pmViewButtons       = document.querySelectorAll('.pm-view-btn');
    const pmCountIndicator    = document.getElementById('pm-count-indicator');
    const pmActiveFiltersEl   = document.getElementById('pm-active-filters');
    const pmEmptyState        = document.getElementById('pm-empty-state');
    const pmStatusFilterList  = document.getElementById('pm-status-filter-list');
    const pmTagsFilterList    = document.getElementById('pm-tags-filter-list');
    const pmResetFiltersBtn   = document.getElementById('pm-reset-filters-btn');
    const pmAddBtn            = document.getElementById('pm-add-btn');
    const pmSidebarAddBtn     = document.getElementById('pm-sidebar-add-btn');
    const pmEmptyAddBtn       = document.getElementById('pm-empty-add-btn');

    // Modal elements
    const pmModal             = document.getElementById('pm-modal');
    const pmModalCloseBtn     = document.getElementById('pm-modal-close-btn');
    const pmModalCancelBtn    = document.getElementById('pm-modal-cancel-btn');
    const pmModalTitle        = document.getElementById('pm-modal-title');
    const pmForm              = document.getElementById('pm-project-form');
    const pmFormId            = document.getElementById('pm-form-id');
    const pmFormTitle         = document.getElementById('pm-form-title');
    const pmFormLink          = document.getElementById('pm-form-link');
    const pmFormImage         = document.getElementById('pm-form-image');
    const pmFormStatus        = document.getElementById('pm-form-status');
    const pmFormTags          = document.getElementById('pm-form-tags');
    const pmFormDesc          = document.getElementById('pm-form-desc');

    // Default Seed Projects (loaded if localStorage is empty)
    const SEED_PROJECTS = [
        {
            id: 'proj_1',
            title: 'Japanese Language Learning',
            link: '../japanese-language-website/index.html',
            image: '',
            gradient: 'linear-gradient(135deg, #c43c22, #ea580c)',
            status: 'In Progress',
            tags: ['Website', 'Japanese', 'Education', 'Front-end'],
            desc: 'Interactive platform for learning Hiragana, Katakana, JLPT N5 Kanji, and essential everyday Japanese phrases.'
        },
        {
            id: 'proj_2',
            title: 'Personal Developer Portfolio',
            link: '../personal-portfolio/index.html',
            image: '',
            gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            status: 'Completed',
            tags: ['Portfolio', 'Website', 'Showcase'],
            desc: 'Clean personal website showcasing web design work, interactive components, projects, and contact information.'
        },
        {
            id: 'proj_3',
            title: 'Experimental Testing Sandbox',
            link: '../experimental-website/index.html',
            image: '',
            gradient: 'linear-gradient(135deg, #0d9488, #0284c7)',
            status: 'In Progress',
            tags: ['Experiments', 'Login', 'UI Components', 'HTML/CSS'],
            desc: 'Experimental testing sandbox featuring modern authentication login card with validation and password toggles.'
        },
        {
            id: 'proj_4',
            title: 'Online Dictionary Website',
            link: '../dictionary-website/index.html',
            image: '',
            gradient: 'linear-gradient(135deg, #d97706, #b45309)',
            status: 'In Progress',
            tags: ['Website', 'Tools', 'Dictionary'],
            desc: 'Searchable dictionary and vocabulary tool with instant definitions and lexical examples.'
        },
        {
            id: 'proj_5',
            title: 'National News Page',
            link: '../national-news-page/index.html',
            image: '',
            gradient: 'linear-gradient(135deg, #e11d48, #be123c)',
            status: 'Completed',
            tags: ['Website', 'News', 'Layout'],
            desc: 'Editorial news page layout with breaking news ticker, featured articles, and responsive story grid.'
        },
        {
            id: 'proj_6',
            title: 'School Academic Portal',
            link: '../school-portal/index.html',
            image: '',
            gradient: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            status: 'In Progress',
            tags: ['Portal', 'Education', 'Web App'],
            desc: 'Academic portal for students and faculty with schedules, course modules, and announcements.'
        },
        {
            id: 'proj_7',
            title: 'Custom Video Player',
            link: '../video-player/index.html',
            image: '',
            gradient: 'linear-gradient(135deg, #7c3aed, #db2777)',
            status: 'Completed',
            tags: ['Media', 'Player', 'JavaScript'],
            desc: 'Custom web video playback interface featuring playback rate, scrubber, fullscreen, and playlist support.'
        }
    ];

    // State
    let projects     = loadProjects();
    let currentView  = localStorage.getItem('zen_pm_view') || 'cards';
    let searchQuery  = '';
    let filterStatus = 'All';
    let filterTag    = 'All';

    // Gradients for projects without custom image
    const GRADIENT_PALETTE = [
        'linear-gradient(135deg, #4f46e5, #7c3aed)',
        'linear-gradient(135deg, #0d9488, #0284c7)',
        'linear-gradient(135deg, #c43c22, #ea580c)',
        'linear-gradient(135deg, #d97706, #b45309)',
        'linear-gradient(135deg, #e11d48, #be123c)',
        'linear-gradient(135deg, #059669, #0d9488)',
        'linear-gradient(135deg, #7c3aed, #db2777)',
        'linear-gradient(135deg, #3b82f6, #1d4ed8)'
    ];

    function loadProjects() {
        try {
            const raw = localStorage.getItem('zen_projects_data');
            if (raw) return JSON.parse(raw);
        } catch(e) {}
        // Save initial seed projects
        saveProjectsToStorage(SEED_PROJECTS);
        return SEED_PROJECTS;
    }

    function saveProjectsToStorage(data) {
        try {
            localStorage.setItem('zen_projects_data', JSON.stringify(data));
        } catch(e) {}
    }

    function getRandomGradient() {
        return GRADIENT_PALETTE[Math.floor(Math.random() * GRADIENT_PALETTE.length)];
    }

    function getStatusClass(status) {
        const s = (status || '').toLowerCase();
        if (s.includes('completed')) return 'completed';
        if (s.includes('progress')) return 'in-progress';
        if (s.includes('plan') || s.includes('idea')) return 'planned';
        if (s.includes('hold')) return 'on-hold';
        return 'in-progress';
    }

    // --- Filter & Search Logic ---
    function getFilteredProjects() {
        return projects.filter(p => {
            // Search query
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q || 
                p.title.toLowerCase().includes(q) ||
                (p.desc && p.desc.toLowerCase().includes(q)) ||
                (p.tags && p.tags.some(t => t.toLowerCase().includes(q)));

            // Status filter
            const matchesStatus = (filterStatus === 'All') || (p.status === filterStatus);

            // Tag filter
            const matchesTag = (filterTag === 'All') || (p.tags && p.tags.includes(filterTag));

            return matchesSearch && matchesStatus && matchesTag;
        });
    }

    // --- Render Projects ---
    function renderProjectManager() {
        if (!pmContainer) return;

        const filtered = getFilteredProjects();

        // Update container view class
        pmContainer.className = `pm-projects-view view-${currentView}`;

        // View Switcher active button
        pmViewButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-view') === currentView);
        });

        // Update count indicator
        if (pmCountIndicator) {
            pmCountIndicator.textContent = `Showing ${filtered.length} of ${projects.length} project${projects.length === 1 ? '' : 's'}`;
        }

        // Active filters pills
        if (pmActiveFiltersEl) {
            let pillsHtml = '';
            if (filterStatus !== 'All') {
                pillsHtml += `<span class="pm-filter-pill-active">Status: ${escapeHtml(filterStatus)} <i class="bx bx-x" onclick="window.pmClearStatusFilter()"></i></span>`;
            }
            if (filterTag !== 'All') {
                pillsHtml += `<span class="pm-filter-pill-active">Tag: ${escapeHtml(filterTag)} <i class="bx bx-x" onclick="window.pmClearTagFilter()"></i></span>`;
            }
            if (searchQuery) {
                pillsHtml += `<span class="pm-filter-pill-active">Search: "${escapeHtml(searchQuery)}" <i class="bx bx-x" onclick="window.pmClearSearch()"></i></span>`;
            }
            pmActiveFiltersEl.innerHTML = pillsHtml;
        }

        // Reset filters button visibility
        const hasFilters = (filterStatus !== 'All' || filterTag !== 'All' || searchQuery !== '');
        if (pmResetFiltersBtn) {
            pmResetFiltersBtn.style.display = hasFilters ? 'inline-flex' : 'none';
        }

        // Empty state
        if (filtered.length === 0) {
            pmContainer.style.display = 'none';
            if (pmEmptyState) pmEmptyState.style.display = 'flex';
        } else {
            pmContainer.style.display = (currentView === 'list') ? 'flex' : 'grid';
            if (pmEmptyState) pmEmptyState.style.display = 'none';

            // Generate HTML based on view
            pmContainer.innerHTML = filtered.map(p => renderProjectItem(p, currentView)).join('');
        }

        // Render sidebars
        renderFilterSidebars();
    }

    function renderProjectItem(p, view) {
        const statusClass = getStatusClass(p.status);
        const bannerStyle = p.image 
            ? `background-image: url('${escapeHtml(p.image)}');` 
            : `background: ${p.gradient || 'var(--color-primary)'};`;

        const placeholderIcon = p.image ? '' : `<i class="bx bx-code-alt pm-card-placeholder-icon"></i>`;
        const linkHref = p.link ? escapeHtml(p.link) : '#';

        const tagsHtml = (p.tags && p.tags.length)
            ? p.tags.map(t => `<span class="pm-tag-pill" onclick="window.pmSelectTag('${escapeHtml(t)}')">${escapeHtml(t)}</span>`).join('')
            : '';

        if (view === 'list') {
            return `
                <div class="pm-card-item" data-id="${p.id}">
                    <div class="pm-card-banner" style="${bannerStyle}">
                        ${placeholderIcon}
                    </div>
                    <div class="pm-card-body">
                        <div class="pm-card-title">
                            <a href="${linkHref}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.title)}</a>
                        </div>
                        <p class="pm-card-desc">${escapeHtml(p.desc || 'No description provided.')}</p>
                    </div>
                    <div class="pm-card-tags">
                        ${tagsHtml}
                    </div>
                    <div class="pm-list-status">
                        <span class="pm-status-badge ${statusClass}">${escapeHtml(p.status || 'Active')}</span>
                    </div>
                    <div class="pm-card-footer">
                        <a href="${linkHref}" target="_blank" rel="noopener noreferrer" class="btn-icon ws-btn-sm" title="Open Project">
                            <i class="bx bx-link-external"></i>
                        </a>
                        <button type="button" class="btn-icon ws-btn-sm" onclick="window.pmEditProject('${p.id}')" title="Edit Project">
                            <i class="bx bx-edit"></i>
                        </button>
                        <button type="button" class="btn-icon ws-btn-sm" onclick="window.pmDeleteProject('${p.id}')" title="Delete Project">
                            <i class="bx bx-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        if (view === 'tiles') {
            return `
                <div class="pm-card-item" data-id="${p.id}">
                    <div class="pm-card-banner" style="${bannerStyle}">
                        ${placeholderIcon}
                    </div>
                    <div class="pm-card-body">
                        <div class="pm-card-title">
                            <a href="${linkHref}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(p.title)}">${escapeHtml(p.title)}</a>
                        </div>
                        <p class="pm-card-desc">${escapeHtml(p.desc || 'No description provided.')}</p>
                        <div class="pm-card-tags">
                            ${tagsHtml}
                        </div>
                    </div>
                    <div class="pm-card-footer">
                        <a href="${linkHref}" target="_blank" rel="noopener noreferrer" class="btn-icon ws-btn-sm" title="Open Project">
                            <i class="bx bx-link-external"></i>
                        </a>
                        <button type="button" class="btn-icon ws-btn-sm" onclick="window.pmEditProject('${p.id}')" title="Edit Project">
                            <i class="bx bx-edit"></i>
                        </button>
                        <button type="button" class="btn-icon ws-btn-sm" onclick="window.pmDeleteProject('${p.id}')" title="Delete Project">
                            <i class="bx bx-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        // Default: Cards View
        return `
            <div class="pm-card-item" data-id="${p.id}">
                <div class="pm-card-banner" style="${bannerStyle}">
                    ${placeholderIcon}
                    <span class="pm-status-badge ${statusClass}">${escapeHtml(p.status || 'Active')}</span>
                </div>
                <div class="pm-card-body">
                    <h4 class="pm-card-title">
                        <a href="${linkHref}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.title)}</a>
                    </h4>
                    <p class="pm-card-desc">${escapeHtml(p.desc || 'No description provided.')}</p>
                    <div class="pm-card-tags">
                        ${tagsHtml}
                    </div>
                </div>
                <div class="pm-card-footer">
                    <a href="${linkHref}" target="_blank" rel="noopener noreferrer" class="pm-btn-open">
                        <span>Open</span>
                        <i class="bx bx-link-external"></i>
                    </a>
                    <div class="pm-card-actions">
                        <button type="button" class="btn-icon ws-btn-sm" onclick="window.pmEditProject('${p.id}')" title="Edit Project">
                            <i class="bx bx-edit"></i>
                        </button>
                        <button type="button" class="btn-icon ws-btn-sm" onclick="window.pmDeleteProject('${p.id}')" title="Delete Project">
                            <i class="bx bx-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // --- Render Filter Sidebar (Status & Tags with counts) ---
    function renderFilterSidebars() {
        // Status Counts
        const statusMap = { 'All': projects.length };
        ['In Progress', 'Completed', 'Planned', 'On Hold'].forEach(st => {
            statusMap[st] = projects.filter(p => p.status === st).length;
        });

        if (pmStatusFilterList) {
            pmStatusFilterList.innerHTML = Object.keys(statusMap).map(statusKey => {
                const count = statusMap[statusKey] || 0;
                const isActive = (filterStatus === statusKey);
                return `
                    <li class="pm-filter-item ${isActive ? 'active' : ''}" onclick="window.pmSelectStatus('${escapeHtml(statusKey)}')">
                        <span>${escapeHtml(statusKey)}</span>
                        <span class="pm-filter-badge">${count}</span>
                    </li>
                `;
            }).join('');
        }

        // Tag Counts
        const tagMap = {};
        projects.forEach(p => {
            if (p.tags && Array.isArray(p.tags)) {
                p.tags.forEach(t => {
                    const tagClean = t.trim();
                    if (tagClean) {
                        tagMap[tagClean] = (tagMap[tagClean] || 0) + 1;
                    }
                });
            }
        });

        if (pmTagsFilterList) {
            const sortedTags = Object.keys(tagMap).sort((a, b) => tagMap[b] - tagMap[a]);
            let tagsListHtml = `
                <li class="pm-filter-item ${filterTag === 'All' ? 'active' : ''}" onclick="window.pmSelectTag('All')">
                    <span>All Tags</span>
                    <span class="pm-filter-badge">${projects.length}</span>
                </li>
            `;

            tagsListHtml += sortedTags.map(tagKey => {
                const count = tagMap[tagKey];
                const isActive = (filterTag === tagKey);
                return `
                    <li class="pm-filter-item ${isActive ? 'active' : ''}" onclick="window.pmSelectTag('${escapeHtml(tagKey)}')">
                        <span>${escapeHtml(tagKey)}</span>
                        <span class="pm-filter-badge">${count}</span>
                    </li>
                `;
            }).join('');

            pmTagsFilterList.innerHTML = tagsListHtml;
        }
    }

    // --- Global Click Handlers for Project Manager ---
    window.pmSelectStatus = function(status) {
        filterStatus = status;
        renderProjectManager();
    };

    window.pmSelectTag = function(tag) {
        filterTag = tag;
        renderProjectManager();
    };

    window.pmClearStatusFilter = function() {
        filterStatus = 'All';
        renderProjectManager();
    };

    window.pmClearTagFilter = function() {
        filterTag = 'All';
        renderProjectManager();
    };

    window.pmClearSearch = function() {
        searchQuery = '';
        if (pmSearchInput) pmSearchInput.value = '';
        if (pmSearchClear) pmSearchClear.style.display = 'none';
        renderProjectManager();
    };

    window.pmEditProject = function(id) {
        const project = projects.find(p => p.id === id);
        if (!project) return;

        pmFormId.value = project.id;
        pmFormTitle.value = project.title || '';
        pmFormLink.value = project.link || '';
        pmFormImage.value = project.image || '';
        pmFormStatus.value = project.status || 'In Progress';
        pmFormTags.value = (project.tags || []).join(', ');
        pmFormDesc.value = project.desc || '';

        if (pmModalTitle) {
            pmModalTitle.innerHTML = `<i class="bx bx-edit"></i> Edit Project`;
        }

        openModal();
    };

    window.pmDeleteProject = function(id) {
        const project = projects.find(p => p.id === id);
        if (!project) return;

        if (confirm(`Are you sure you want to delete "${project.title}"?`)) {
            projects = projects.filter(p => p.id !== id);
            saveProjectsToStorage(projects);
            renderProjectManager();
        }
    };

    // --- Search Input Events ---
    if (pmSearchInput) {
        pmSearchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            if (pmSearchClear) {
                pmSearchClear.style.display = searchQuery ? 'flex' : 'none';
            }
            renderProjectManager();
        });
    }

    if (pmSearchClear) {
        pmSearchClear.addEventListener('click', window.pmClearSearch);
    }

    // --- View Mode Buttons ---
    pmViewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            if (view) {
                currentView = view;
                localStorage.setItem('zen_pm_view', view);
                renderProjectManager();
            }
        });
    });

    // --- Reset Filters Button ---
    if (pmResetFiltersBtn) {
        pmResetFiltersBtn.addEventListener('click', () => {
            searchQuery = '';
            filterStatus = 'All';
            filterTag = 'All';
            if (pmSearchInput) pmSearchInput.value = '';
            if (pmSearchClear) pmSearchClear.style.display = 'none';
            renderProjectManager();
        });
    }

    // --- Modal Management ---
    function openModal() {
        if (pmModal) {
            pmModal.style.display = 'flex';
            setTimeout(() => pmFormTitle.focus(), 60);
        }
    }

    function closeModal() {
        if (pmModal) pmModal.style.display = 'none';
        if (pmForm) pmForm.reset();
        pmFormId.value = '';
    }

    if (pmAddBtn) {
        pmAddBtn.addEventListener('click', () => {
            if (pmForm) pmForm.reset();
            pmFormId.value = '';
            if (pmModalTitle) {
                pmModalTitle.innerHTML = `<i class="bx bx-folder-plus"></i> New Project`;
            }
            openModal();
        });
    }

    if (pmSidebarAddBtn) {
        pmSidebarAddBtn.addEventListener('click', () => {
            if (pmForm) pmForm.reset();
            pmFormId.value = '';
            if (pmModalTitle) {
                pmModalTitle.innerHTML = `<i class="bx bx-folder-plus"></i> New Project`;
            }
            openModal();
        });
    }

    if (pmEmptyAddBtn) {
        pmEmptyAddBtn.addEventListener('click', () => {
            if (pmForm) pmForm.reset();
            pmFormId.value = '';
            openModal();
        });
    }

    if (pmModalCloseBtn) pmModalCloseBtn.addEventListener('click', closeModal);
    if (pmModalCancelBtn) pmModalCancelBtn.addEventListener('click', closeModal);

    if (pmModal) {
        pmModal.addEventListener('click', (e) => {
            if (e.target === pmModal) closeModal();
        });
    }

    // Form Submission (Add or Update)
    if (pmForm) {
        pmForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const title = pmFormTitle.value.trim();
            if (!title) {
                alert('Please enter a project title.');
                pmFormTitle.focus();
                return;
            }

            const id = pmFormId.value.trim();
            const link = pmFormLink.value.trim();
            const image = pmFormImage.value.trim();
            const status = pmFormStatus.value;
            const desc = pmFormDesc.value.trim();

            // Parse tags
            const tags = pmFormTags.value
                .split(',')
                .map(t => t.trim())
                .filter(t => t.length > 0);

            if (id) {
                // Editing existing project
                const index = projects.findIndex(p => p.id === id);
                if (index !== -1) {
                    projects[index] = {
                        ...projects[index],
                        title,
                        link,
                        image,
                        status,
                        tags,
                        desc
                    };
                }
            } else {
                // Creating new project
                const newProject = {
                    id: 'proj_' + Date.now(),
                    title,
                    link,
                    image,
                    gradient: getRandomGradient(),
                    status,
                    tags,
                    desc
                };
                projects.unshift(newProject);
            }

            saveProjectsToStorage(projects);
            closeModal();
            renderProjectManager();
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Initialize Project Manager
    renderProjectManager();

});

