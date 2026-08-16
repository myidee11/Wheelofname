/**
 * Classroom Wheel of Names - Application Controller & State Management
 */

class WheelApp {
    constructor() {
        this.storageKey = 'classroom_wheel_data_v1';
        this.wheel = null;
        this.currentWinner = null;

        // Default Data
        this.state = {
            classes: [
                {
                    id: 'default-1',
                    name: 'ห้องเรียนตัวอย่าง (ม.1/1)',
                    items: [
                        'กานต์วิภา',
                        'ขวัญข้าว',
                        'จิดาภา',
                        'ชลธิชา',
                        'ณัฐพงษ์',
                        'ธนกร',
                        'ปิยะวัฒน์',
                        'วรัญญา',
                        'ศุภวิชญ์',
                        'อรอนงค์',
                        'กิตติศักดิ์',
                        'พิมพาพร'
                    ]
                }
            ],
            activeClassId: 'default-1',
            history: [],
            settings: {
                spinDuration: 6, // in seconds
                soundEnabled: true,
                voiceEnabled: true,
                volume: 0.8,
                theme: 'pastelRainbow'
            }
        };

        this.groupMode = 'byCount'; // 'byCount' (N groups) or 'bySize' (N people per group)
        this.groupValue = 3;

        this.init();
    }

    init() {
        this.loadState();

        // Initialize Wheel
        this.wheel = new WheelCanvas('wheelCanvas', {
            onSpinStart: () => this.handleSpinStart(),
            onSpinEnd: (winner) => this.handleSpinEnd(winner)
        });

        this.applySettings();
        this.renderClassOptions();
        this.loadActiveClass();
        this.bindEvents();
        this.renderHistory();
    }

    getDefaultNames() {
        return [
            'กานต์วิภา',
            'ขวัญข้าว',
            'จิดาภา',
            'ชลธิชา',
            'ณัฐพงษ์',
            'ธนกร',
            'ปิยะวัฒน์',
            'วรัญญา',
            'ศุภวิชญ์',
            'อรอนงค์',
            'กิตติศักดิ์',
            'พิมพาพร'
        ];
    }

    // --- State Persistence ---
    loadState() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
                // ensure active class exists and has names
                if (!Array.isArray(this.state.classes) || this.state.classes.length === 0) {
                    this.state.classes = [
                        { id: 'default-1', name: 'ห้องเรียนตัวอย่าง (ม.1/1)', items: this.getDefaultNames() }
                    ];
                    this.state.activeClassId = 'default-1';
                }
                if (!this.state.classes.some(c => c.id === this.state.activeClassId)) {
                    this.state.activeClassId = this.state.classes[0]?.id || 'default-1';
                }
                const active = this.getActiveClass();
                if (active && (!active.items || active.items.length === 0)) {
                    active.items = this.getDefaultNames();
                }
            }
        } catch (e) {
            console.error('Failed to load state from localStorage:', e);
        }
    }

    loadSampleNames() {
        const currentClass = this.getActiveClass();
        currentClass.items = this.getDefaultNames();
        this.syncClassNamesToUI();
        this.showToast('โหลดรายชื่อตัวอย่างเรียบร้อยแล้ว ✨');
    }

    saveState() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.state));
        } catch (e) {
            console.error('Failed to save state to localStorage:', e);
        }
    }

    getActiveClass() {
        return this.state.classes.find(c => c.id === this.state.activeClassId) || this.state.classes[0];
    }

    // --- DOM Event Listeners ---
    bindEvents() {
        // Spin Buttons & Click Canvas
        const spinBtn = document.getElementById('spinBtn');
        const wheelCanvas = document.getElementById('wheelCanvas');
        
        if (spinBtn) {
            spinBtn.addEventListener('click', () => this.triggerSpin());
        }
        if (wheelCanvas) {
            wheelCanvas.addEventListener('click', () => this.triggerSpin());
        }

        // Global Keyboard Shortcut (Spacebar to Spin)
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !['TEXTAREA', 'INPUT'].includes(document.activeElement.tagName)) {
                e.preventDefault();
                this.triggerSpin();
            }
        });

        // Tabs
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-tab');
                this.switchTab(target);
            });
        });

        // Textarea Changes
        const namesTextarea = document.getElementById('namesTextarea');
        if (namesTextarea) {
            namesTextarea.addEventListener('input', () => {
                this.updateNamesFromTextarea();
            });
        }

        // Quick Add Single Name
        const quickAddInput = document.getElementById('quickAddInput');
        const quickAddBtn = document.getElementById('quickAddBtn');
        const addSingleName = () => {
            if (!quickAddInput) return;
            const val = quickAddInput.value.trim();
            if (val) {
                const currentClass = this.getActiveClass();
                currentClass.items.push(val);
                this.syncClassNamesToUI();
                quickAddInput.value = '';
                this.showToast(`เพิ่ม "${val}" เรียบร้อยแล้ว`);
            }
        };

        if (quickAddBtn) quickAddBtn.addEventListener('click', addSingleName);
        if (quickAddInput) {
            quickAddInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') addSingleName();
            });
        }

        // Sample & Shuffle & Sort & Clear
        document.getElementById('sampleBtn')?.addEventListener('click', () => this.loadSampleNames());
        document.getElementById('shuffleBtn')?.addEventListener('click', () => this.shuffleNames());
        document.getElementById('sortBtn')?.addEventListener('click', () => this.sortNames());
        document.getElementById('clearBtn')?.addEventListener('click', () => this.clearNames());

        // Class Switcher & Class Management Modal
        document.getElementById('classSelect')?.addEventListener('change', (e) => {
            this.state.activeClassId = e.target.value;
            this.saveState();
            this.loadActiveClass();
        });

        document.getElementById('manageClassBtn')?.addEventListener('click', () => {
            this.openModal('classModal');
            this.renderClassListModal();
        });

        document.getElementById('addNewClassBtn')?.addEventListener('click', () => {
            this.addNewClass();
        });

        // Winner Modal Actions
        document.getElementById('removeWinnerBtn')?.addEventListener('click', () => {
            this.removeWinner();
        });

        document.getElementById('keepWinnerBtn')?.addEventListener('click', () => {
            this.closeModal('winnerModal');
        });

        // Group Generator
        this.bindGroupEvents();

        // Settings Controls
        this.bindSettingsEvents();

        // History Clear
        document.getElementById('clearHistoryBtn')?.addEventListener('click', () => {
            this.state.history = [];
            this.saveState();
            this.renderHistory();
            this.showToast('ล้างประวัติการสุ่มเรียบร้อยแล้ว');
        });

        // Fullscreen & Sound Header Buttons
        document.getElementById('fullscreenBtn')?.addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('exitFullscreenBtn')?.addEventListener('click', () => this.toggleFullscreen());

        const soundToggleBtn = document.getElementById('soundToggleBtn');
        if (soundToggleBtn) {
            soundToggleBtn.addEventListener('click', () => {
                this.state.settings.soundEnabled = !this.state.settings.soundEnabled;
                this.applySettings();
                this.saveState();
                this.showToast(this.state.settings.soundEnabled ? 'เปิดเสียงแล้ว 🔊' : 'ปิดเสียงแล้ว 🔇');
            });
        }

        // Close modal buttons
        document.querySelectorAll('.modal-close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                if (modal) modal.classList.remove('active');
            });
        });

        // Listen to native fullscreen change
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                document.body.classList.remove('fullscreen-mode');
            }
            setTimeout(() => {
                if (this.wheel) this.wheel.resize();
            }, 100);
        });
    }

    // --- Wheel Spin Logic ---
    triggerSpin() {
        if (!this.wheel || this.wheel.isSpinning) return;
        const currentClass = this.getActiveClass();
        if (!currentClass || currentClass.items.length === 0) {
            this.showToast('กรุณาใส่รายชื่อนักเรียนก่อนสุ่ม!');
            document.getElementById('namesTextarea')?.focus();
            return;
        }

        const durationMs = (this.state.settings.spinDuration || 6) * 1000;
        this.wheel.spin(durationMs);
    }

    handleSpinStart() {
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn) {
            spinBtn.disabled = true;
            spinBtn.innerHTML = '<span>กำลังสุ่ม...</span>';
        }
    }

    handleSpinEnd(winner) {
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn) {
            spinBtn.disabled = false;
            spinBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg><span>หมุนวงล้อ</span>';
        }

        if (!winner) return;

        this.currentWinner = winner;

        // Record History
        const now = new Date();
        const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        this.state.history.unshift({
            name: winner.text,
            time: timeStr,
            className: this.getActiveClass().name
        });
        this.saveState();
        this.renderHistory();

        // Audio & Confetti Celebration
        if (window.audioEngine) {
            window.audioEngine.playFanfare();
            window.audioEngine.speakWinner(winner.text);
        }
        if (window.confettiEngine) {
            window.confettiEngine.burst(160);
        }

        // Open Winner Modal
        const winnerNameDisplay = document.getElementById('winnerNameDisplay');
        if (winnerNameDisplay) {
            winnerNameDisplay.textContent = winner.text;
        }
        this.openModal('winnerModal');
    }

    removeWinner() {
        if (!this.currentWinner) return;

        const currentClass = this.getActiveClass();
        const index = currentClass.items.indexOf(this.currentWinner.text);
        if (index > -1) {
            currentClass.items.splice(index, 1);
            this.syncClassNamesToUI();
            if (window.audioEngine) {
                window.audioEngine.playPop();
            }
            this.showToast(`นำ "${this.currentWinner.text}" ออกจากวงล้อแล้ว`);
        }

        this.closeModal('winnerModal');
    }

    // --- Class and Name List Management ---
    loadActiveClass() {
        const currentClass = this.getActiveClass();
        if (!currentClass) return;

        // Update dropdown selection
        const classSelect = document.getElementById('classSelect');
        if (classSelect) classSelect.value = currentClass.id;

        // Sync names to wheel & textarea
        this.syncClassNamesToUI();
    }

    syncClassNamesToUI() {
        const currentClass = this.getActiveClass();
        if (!currentClass) return;

        const namesTextarea = document.getElementById('namesTextarea');
        if (namesTextarea) {
            namesTextarea.value = currentClass.items.join('\n');
        }

        const countBadge = document.getElementById('namesCountBadge');
        if (countBadge) {
            countBadge.textContent = `${currentClass.items.length} รายชื่อ`;
        }

        if (this.wheel) {
            this.wheel.setItems(currentClass.items);
        }

        this.saveState();
    }

    updateNamesFromTextarea() {
        const namesTextarea = document.getElementById('namesTextarea');
        if (!namesTextarea) return;

        const currentClass = this.getActiveClass();
        const rawLines = namesTextarea.value.split('\n');
        currentClass.items = rawLines
            .map(line => line.trim())
            .filter(line => line.length > 0);

        const countBadge = document.getElementById('namesCountBadge');
        if (countBadge) {
            countBadge.textContent = `${currentClass.items.length} รายชื่อ`;
        }

        if (this.wheel) {
            this.wheel.setItems(currentClass.items);
        }

        this.saveState();
    }

    shuffleNames() {
        const currentClass = this.getActiveClass();
        for (let i = currentClass.items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [currentClass.items[i], currentClass.items[j]] = [currentClass.items[j], currentClass.items[i]];
        }
        this.syncClassNamesToUI();
        this.showToast('สลับตำแหน่งรายชื่อแล้ว 🔀');
    }

    sortNames() {
        const currentClass = this.getActiveClass();
        currentClass.items.sort((a, b) => a.localeCompare(b, 'th'));
        this.syncClassNamesToUI();
        this.showToast('เรียงลำดับรายชื่อ ก-ฮ / A-Z แล้ว 📶');
    }

    clearNames() {
        if (confirm('คุณต้องการล้างรายชื่อทั้งหมดในห้องนี้ใช่หรือไม่?')) {
            const currentClass = this.getActiveClass();
            currentClass.items = [];
            this.syncClassNamesToUI();
            this.showToast('ล้างรายชื่อเรียบร้อยแล้ว');
        }
    }

    renderClassOptions() {
        const classSelect = document.getElementById('classSelect');
        if (!classSelect) return;

        classSelect.innerHTML = '';
        this.state.classes.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            classSelect.appendChild(opt);
        });
        classSelect.value = this.state.activeClassId;
    }

    addNewClass() {
        const nameInput = document.getElementById('newClassNameInput');
        const name = nameInput?.value.trim();
        if (!name) {
            alert('กรุณากรอกชื่อห้องเรียน');
            return;
        }

        const newId = 'class-' + Date.now();
        this.state.classes.push({
            id: newId,
            name: name,
            items: []
        });

        this.state.activeClassId = newId;
        this.saveState();
        this.renderClassOptions();
        this.loadActiveClass();
        this.renderClassListModal();
        if (nameInput) nameInput.value = '';
        this.showToast(`สร้างห้อง "${name}" เรียบร้อยแล้ว`);
    }

    renderClassListModal() {
        const container = document.getElementById('classListContainer');
        if (!container) return;

        container.innerHTML = '';
        this.state.classes.forEach(c => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.padding = '10px';
            div.style.borderBottom = '1px solid var(--border-subtle)';

            div.innerHTML = `
                <div>
                    <strong style="font-size: 0.95rem;">${c.name}</strong>
                    <div style="font-size: 0.78rem; color: var(--text-muted);">${c.items.length} รายชื่อ</div>
                </div>
                <div style="display: flex; gap: 6px;">
                    ${this.state.classes.length > 1 ? `
                        <button class="tool-btn delete-class-btn" data-id="${c.id}" style="color: var(--danger);">
                            ลบ
                        </button>
                    ` : ''}
                </div>
            `;
            container.appendChild(div);
        });

        // Delete class listener
        container.querySelectorAll('.delete-class-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm('คุณต้องการลบห้องเรียนนี้ใช่หรือไม่?')) {
                    this.state.classes = this.state.classes.filter(c => c.id !== id);
                    if (this.state.activeClassId === id) {
                        this.state.activeClassId = this.state.classes[0].id;
                    }
                    this.saveState();
                    this.renderClassOptions();
                    this.loadActiveClass();
                    this.renderClassListModal();
                }
            });
        });
    }

    // --- Group Generator Tool ---
    bindGroupEvents() {
        const modeLabels = document.querySelectorAll('.mode-radio-label');
        modeLabels.forEach(label => {
            label.addEventListener('click', () => {
                modeLabels.forEach(l => l.classList.remove('active'));
                label.classList.add('active');
                this.groupMode = label.getAttribute('data-mode');
                const labelText = document.getElementById('groupStepperLabel');
                if (labelText) {
                    labelText.textContent = this.groupMode === 'byCount' ? 'จำนวนกลุ่ม:' : 'จำนวนคนต่อกลุ่ม:';
                }
            });
        });

        const stepperVal = document.getElementById('groupStepperVal');
        document.getElementById('stepperMinus')?.addEventListener('click', () => {
            if (this.groupValue > 2) {
                this.groupValue--;
                if (stepperVal) stepperVal.textContent = this.groupValue;
            }
        });

        document.getElementById('stepperPlus')?.addEventListener('click', () => {
            if (this.groupValue < 50) {
                this.groupValue++;
                if (stepperVal) stepperVal.textContent = this.groupValue;
            }
        });

        document.getElementById('generateGroupsBtn')?.addEventListener('click', () => {
            this.generateGroups();
        });

        document.getElementById('copyGroupsBtn')?.addEventListener('click', () => {
            this.copyGroupsToClipboard();
        });
    }

    generateGroups() {
        const currentClass = this.getActiveClass();
        const items = [...currentClass.items];

        if (items.length < 2) {
            this.showToast('มีรายชื่อนักเรียนน้อยเกินไปสำหรับการแบ่งกลุ่ม');
            return;
        }

        // Shuffle students
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }

        let groups = [];

        if (this.groupMode === 'byCount') {
            const numGroups = Math.min(this.groupValue, items.length);
            for (let i = 0; i < numGroups; i++) {
                groups.push([]);
            }
            items.forEach((item, index) => {
                groups[index % numGroups].push(item);
            });
        } else {
            // bySize (N people per group)
            const size = Math.max(1, this.groupValue);
            for (let i = 0; i < items.length; i += size) {
                groups.push(items.slice(i, i + size));
            }
        }

        this.lastGeneratedGroups = groups;
        this.renderGroupResults(groups);
    }

    renderGroupResults(groups) {
        const container = document.getElementById('groupsResultContainer');
        const copyBtn = document.getElementById('copyGroupsBtn');
        if (!container) return;

        container.innerHTML = '';
        if (copyBtn) copyBtn.style.display = 'flex';

        groups.forEach((group, index) => {
            const card = document.createElement('div');
            card.className = 'group-card';
            card.innerHTML = `
                <div class="group-card-header">
                    <span>กลุ่มที่ ${index + 1}</span>
                    <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">${group.length} คน</span>
                </div>
                <div class="group-card-members">
                    ${group.join(', ')}
                </div>
            `;
            container.appendChild(card);
        });

        if (window.audioEngine) {
            window.audioEngine.playPop();
        }
    }

    copyGroupsToClipboard() {
        if (!this.lastGeneratedGroups || this.lastGeneratedGroups.length === 0) return;

        let text = `📋 ผลการแบ่งกลุ่ม (${this.getActiveClass().name})\n\n`;
        this.lastGeneratedGroups.forEach((group, index) => {
            text += `กลุ่มที่ ${index + 1} (${group.length} คน): ${group.join(', ')}\n`;
        });

        navigator.clipboard.writeText(text).then(() => {
            this.showToast('คัดลอกผลการแบ่งกลุ่มแล้ว 📋');
        }).catch(() => {
            this.showToast('ไม่สามารถคัดลอกได้');
        });
    }

    // --- History Tab ---
    renderHistory() {
        const list = document.getElementById('historyList');
        if (!list) return;

        list.innerHTML = '';
        if (this.state.history.length === 0) {
            list.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 24px; font-size: 0.88rem;">ยังไม่มีประวัติการสุ่ม</div>`;
            return;
        }

        this.state.history.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="history-item-left">
                    <span class="history-medal">🎉</span>
                    <div>
                        <div class="history-name">${item.name}</div>
                        <div class="history-time">${item.className} • ${item.time}</div>
                    </div>
                </div>
                <span style="font-size: 0.8rem; color: var(--text-muted);">#${this.state.history.length - idx}</span>
            `;
            list.appendChild(div);
        });
    }

    // --- Settings Tab ---
    bindSettingsEvents() {
        // Duration Slider
        const durationSlider = document.getElementById('durationSlider');
        const durationVal = document.getElementById('durationVal');
        if (durationSlider && durationVal) {
            durationSlider.value = this.state.settings.spinDuration;
            durationVal.textContent = `${this.state.settings.spinDuration} วินาที`;

            durationSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10);
                this.state.settings.spinDuration = val;
                durationVal.textContent = `${val} วินาที`;
                this.saveState();
            });
        }

        // Sound Toggle
        const soundSwitch = document.getElementById('soundSwitch');
        if (soundSwitch) {
            soundSwitch.checked = this.state.settings.soundEnabled;
            soundSwitch.addEventListener('change', (e) => {
                this.state.settings.soundEnabled = e.target.checked;
                this.applySettings();
                this.saveState();
            });
        }

        // Voice Reader Toggle
        const voiceSwitch = document.getElementById('voiceSwitch');
        if (voiceSwitch) {
            voiceSwitch.checked = this.state.settings.voiceEnabled;
            voiceSwitch.addEventListener('change', (e) => {
                this.state.settings.voiceEnabled = e.target.checked;
                this.applySettings();
                this.saveState();
            });
        }

        // Theme Buttons
        const themeBtns = document.querySelectorAll('.theme-option-btn');
        themeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const themeName = btn.getAttribute('data-theme');
                themeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.settings.theme = themeName;
                if (this.wheel) {
                    this.wheel.setTheme(themeName);
                }
                this.saveState();
            });
        });
    }

    applySettings() {
        if (window.audioEngine) {
            window.audioEngine.soundEnabled = this.state.settings.soundEnabled;
            window.audioEngine.voiceEnabled = this.state.settings.voiceEnabled;
            window.audioEngine.volume = this.state.settings.volume || 0.8;
        }

        const soundToggleBtn = document.getElementById('soundToggleBtn');
        if (soundToggleBtn) {
            if (this.state.settings.soundEnabled) {
                soundToggleBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
                soundToggleBtn.classList.remove('active');
            } else {
                soundToggleBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>';
                soundToggleBtn.classList.add('active');
            }
        }

        if (this.wheel && this.state.settings.theme) {
            this.wheel.setTheme(this.state.settings.theme);
        }
    }

    // --- UI Utilities ---
    switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `${tabId}Pane`);
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('active');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    }

    showToast(message) {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
            document.body.classList.add('fullscreen-mode');
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            }
            document.body.classList.remove('fullscreen-mode');
        }
        setTimeout(() => {
            if (this.wheel) this.wheel.resize();
        }, 120);
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    window.app = new WheelApp();
});
