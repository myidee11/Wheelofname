/**
 * Classroom Wheel of Names - High-Performance Canvas 2D Wheel Engine
 * Vibrant colors, high contrast Thai typography, LED bulbs, realistic flipper physics
 */

class WheelCanvas {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id "${canvasId}" not found.`);
        }
        this.ctx = this.canvas.getContext('2d');

        // State
        this.items = []; // Array of strings
        this.currentAngle = 0; // in radians
        this.angularVelocity = 0;
        this.isSpinning = false;
        this.spinStartTime = 0;
        this.spinDuration = 6000; // default 6 seconds
        this.startAngle = 0;
        this.targetAngle = 0;
        this.animationFrameId = null;

        // Ticker pointer state
        this.lastSliceIndex = -1;
        this.tickerBounce = 0; // Angle offset for pointer vibration

        // LED Bulbs animation
        this.bulbTick = 0;

        // Vibrant Theme Palettes
        this.themes = {
            carnivalBright: [
                '#FF3366', '#FF9900', '#FFCC00', '#10B981', '#00D2D3', 
                '#6366F1', '#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B'
            ],
            candyPop: [
                '#FF2E93', '#FF8A00', '#FFD600', '#00E676', '#00B0FF', 
                '#7C4DFF', '#FF4081', '#1DE9B6', '#FF6D00', '#651FFF'
            ],
            tropicalFiesta: [
                '#00E5FF', '#00C853', '#FFD600', '#FF6D00', '#D500F9', 
                '#2979FF', '#AEEA00', '#FF3D00', '#00B0FF', '#C51162'
            ],
            sunsetGlow: [
                '#FF1744', '#FF5252', '#FF9100', '#FFD740', '#FF4081', 
                '#F50057', '#FF6E40', '#FFAB00', '#E040FB', '#7C4DFF'
            ],
            pastelSweet: [
                '#FFAAA6', '#FFD3B6', '#A8E6CF', '#DCEDC1', '#CDB4DB', 
                '#A0C4FF', '#BDB2FF', '#FFC6FF', '#FDFFB6', '#BEE1E6'
            ],
            arcadeNeon: [
                '#00F5D4', '#7B2CBF', '#F72585', '#4CC9F0', '#FFB703', 
                '#FB8500', '#3A0CA3', '#7209B7', '#4361EE', '#4895EF'
            ]
        };
        this.currentTheme = 'carnivalBright';

        // Callbacks
        this.onSpinStart = options.onSpinStart || (() => {});
        this.onSpinEnd = options.onSpinEnd || (() => {});

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('load', () => this.resize());
        setTimeout(() => this.resize(), 50);
        this.draw();
    }

    resize() {
        if (!this.canvas) return;

        const isFullscreen = document.body.classList.contains('fullscreen-mode');
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let availW = isFullscreen ? (vw - 60) : (vw > 1024 ? vw - 480 : vw - 60);
        let availH = isFullscreen ? (vh - 80) : (vh - 220);

        availW = Math.max(280, Math.min(availW, 860));
        availH = Math.max(280, Math.min(availH, 820));

        const finalSize = Math.floor(Math.min(availW, availH));
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        this.canvas.width = finalSize * dpr;
        this.canvas.height = finalSize * dpr;
        this.canvas.style.width = `${finalSize}px`;
        this.canvas.style.height = `${finalSize}px`;

        this.size = finalSize;
        this.radius = (finalSize / 2) * 0.93;
        this.centerX = finalSize / 2;
        this.centerY = finalSize / 2;

        this.draw();
    }

    setItems(items) {
        this.items = items.filter(item => typeof item === 'string' ? item.trim().length > 0 : item.text.trim().length > 0);
        this.draw();
    }

    setTheme(themeName) {
        if (this.themes[themeName]) {
            this.currentTheme = themeName;
            this.draw();
        }
    }

    getColors() {
        return this.themes[this.currentTheme] || this.themes.carnivalBright;
    }

    /**
     * Start spinning the wheel
     * @param {number} durationMs - Spin duration in milliseconds
     * @param {number|null} targetIndex - Optional forced winner index
     */
    spin(durationMs = 6000, targetIndex = null) {
        if (this.isSpinning || this.items.length === 0) return;

        this.isSpinning = true;
        this.spinDuration = durationMs;
        this.spinStartTime = performance.now();
        this.startAngle = this.currentAngle % (Math.PI * 2);

        const count = this.items.length;
        const sliceAngle = (Math.PI * 2) / count;

        let selectedIndex = targetIndex;
        if (selectedIndex === null || selectedIndex < 0 || selectedIndex >= count) {
            selectedIndex = Math.floor(Math.random() * count);
        }

        // Pointer is at Top (angle = -PI/2)
        const pointerAngle = -Math.PI / 2;
        const sliceCenterOffset = (selectedIndex + 0.5) * sliceAngle;
        
        // Random micro-offset within the slice (stay within 65% width to avoid border ambiguity)
        const randomSliceJitter = (Math.random() - 0.5) * sliceAngle * 0.65;

        // Full rotations (5 to 8 turns)
        const fullRotations = (6 + Math.floor(Math.random() * 3)) * (Math.PI * 2);
        
        this.targetAngle = this.startAngle + fullRotations + (pointerAngle - (this.startAngle % (Math.PI * 2)) - sliceCenterOffset + randomSliceJitter);
        while (this.targetAngle < this.startAngle + fullRotations) {
            this.targetAngle += Math.PI * 2;
        }

        this.onSpinStart();
        if (window.audioEngine) {
            window.audioEngine.initContext();
        }

        this.animateSpin();
    }

    animateSpin() {
        const now = performance.now();
        const elapsed = now - this.spinStartTime;
        const progress = Math.min(elapsed / this.spinDuration, 1);

        // Quintic Ease Out for dramatic deceleration
        const easeOut = (t) => 1 - Math.pow(1 - t, 4.2);
        const currentProgress = easeOut(progress);

        this.currentAngle = this.startAngle + (this.targetAngle - this.startAngle) * currentProgress;

        const speed = (1 - progress);
        this.bulbTick += speed * 0.5;

        // Check slice boundary for mechanical ticker click
        this.checkTicker(speed);

        // Dampen bounce
        this.tickerBounce *= 0.88;

        this.draw();

        if (progress < 1) {
            this.animationFrameId = requestAnimationFrame(() => this.animateSpin());
        } else {
            this.isSpinning = false;
            this.tickerBounce = 0;
            this.draw();

            const winner = this.getCurrentWinner();
            this.onSpinEnd(winner);
        }
    }

    checkTicker(speed) {
        if (this.items.length === 0) return;
        const count = this.items.length;
        const sliceAngle = (Math.PI * 2) / count;

        const pointerAngle = -Math.PI / 2;
        let normalizedAngle = (pointerAngle - this.currentAngle) % (Math.PI * 2);
        if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;

        const currentSliceIndex = Math.floor(normalizedAngle / sliceAngle) % count;

        if (this.lastSliceIndex !== currentSliceIndex && this.lastSliceIndex !== -1) {
            this.tickerBounce = 0.42 * Math.min(speed + 0.35, 1);
            if (window.audioEngine) {
                window.audioEngine.playTick(speed);
            }
        }
        this.lastSliceIndex = currentSliceIndex;
    }

    getCurrentWinner() {
        if (this.items.length === 0) return null;
        const count = this.items.length;
        const sliceAngle = (Math.PI * 2) / count;

        const pointerAngle = -Math.PI / 2;
        let normalizedAngle = (pointerAngle - this.currentAngle) % (Math.PI * 2);
        if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;

        const winningIndex = Math.floor(normalizedAngle / sliceAngle) % count;
        const item = this.items[winningIndex];
        const text = typeof item === 'string' ? item : item.text;
        
        return {
            index: winningIndex,
            text: text
        };
    }

    draw() {
        if (!this.ctx) return;
        const dpr = window.devicePixelRatio || 1;
        const ctx = this.ctx;

        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, this.size, this.size);

        const cx = this.centerX;
        const cy = this.centerY;
        const radius = this.radius;

        // Outer Glow & Shadow
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
        ctx.shadowColor = 'rgba(99, 102, 241, 0.28)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 10;
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.restore();

        // If no items, draw empty state
        if (this.items.length === 0) {
            this.drawEmptyState(cx, cy, radius);
            this.drawCenterHub(cx, cy);
            this.drawPointer(cx, cy, radius);
            ctx.restore();
            return;
        }

        const count = this.items.length;
        const sliceAngle = (Math.PI * 2) / count;
        const colors = this.getColors();

        // Draw slices
        for (let i = 0; i < count; i++) {
            const angleStart = this.currentAngle + i * sliceAngle;
            const angleEnd = angleStart + sliceAngle;
            const color = colors[i % colors.length];

            // Slice Fill
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, angleStart, angleEnd);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();

            // Slice Border
            ctx.lineWidth = Math.min(3, 80 / count);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.stroke();

            // Draw Thai Text on Slice
            this.drawSliceText(i, angleStart + sliceAngle / 2, cx, cy, radius, count);
        }

        // Outer Golden Carnival Rim
        this.drawOuterCarnivalRim(cx, cy, radius);

        // Center Hub (Spin Button)
        this.drawCenterHub(cx, cy);

        // Top Ticker Pointer (Flipper)
        this.drawPointer(cx, cy, radius);

        ctx.restore();
    }

    drawSliceText(index, midAngle, cx, cy, radius, totalSlices) {
        const ctx = this.ctx;
        const item = this.items[index];
        const text = typeof item === 'string' ? item : item.text;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(midAngle);

        // Dynamic large font calculation tailored for classroom projector
        let fontSize;
        if (totalSlices <= 3) {
            fontSize = Math.floor(Math.min(42, radius * 0.15));
        } else if (totalSlices <= 6) {
            fontSize = Math.floor(Math.min(34, radius * 0.125));
        } else if (totalSlices <= 12) {
            fontSize = Math.floor(Math.min(26, radius * 0.095));
        } else if (totalSlices <= 20) {
            fontSize = Math.floor(Math.min(22, radius * 0.08));
        } else if (totalSlices <= 32) {
            fontSize = Math.floor(Math.min(18, radius * 0.064));
        } else if (totalSlices <= 50) {
            fontSize = Math.floor(Math.min(15, radius * 0.05));
        } else {
            fontSize = Math.max(11, Math.floor(radius * 0.038));
        }

        ctx.font = `800 ${fontSize}px 'Kanit', 'Prompt', sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        const hubRadius = radius * 0.22;
        const maxTextWidth = radius - hubRadius - 26;

        // Truncate text with ellipsis if too long
        let displayText = text;
        let textMetrics = ctx.measureText(displayText);
        if (textMetrics.width > maxTextWidth) {
            while (displayText.length > 2 && ctx.measureText(displayText + '...').width > maxTextWidth) {
                displayText = displayText.slice(0, -1);
            }
            displayText += '...';
        }

        // Draw crisp solid white halo around Thai text for 100% legibility from any distance
        ctx.lineWidth = Math.max(4, fontSize * 0.24);
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeStyle = '#FFFFFF';
        ctx.strokeText(displayText, radius - 18, 0);

        // Solid charcoal fill with shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 1;
        ctx.fillStyle = '#0F172A';
        ctx.fillText(displayText, radius - 18, 0);

        ctx.restore();
    }

    drawOuterCarnivalRim(cx, cy, radius) {
        const ctx = this.ctx;

        // Golden Outer Ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, radius + 7, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
        ctx.stroke();

        // Carnival LED Bulbs / Studs
        const numBulbs = 24;
        for (let b = 0; b < numBulbs; b++) {
            const bAngle = (b / numBulbs) * (Math.PI * 2);
            const bx = cx + Math.cos(bAngle) * (radius + 2);
            const by = cy + Math.sin(bAngle) * (radius + 2);

            const isLit = Math.floor(b + this.bulbTick) % 2 === 0;

            ctx.beginPath();
            ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = isLit ? '#FFD700' : '#FF6B00';
            ctx.shadowColor = isLit ? '#FFD700' : 'transparent';
            ctx.shadowBlur = isLit ? 8 : 0;
            ctx.fill();
        }
        ctx.restore();
    }

    drawCenterHub(cx, cy) {
        const ctx = this.ctx;
        const hubRadius = this.radius * 0.23;

        ctx.save();
        // Hub Drop Shadow
        ctx.beginPath();
        ctx.arc(cx, cy, hubRadius, 0, Math.PI * 2);
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 6;
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // Hub Gradient Outer Ring
        const grad = ctx.createLinearGradient(cx - hubRadius, cy - hubRadius, cx + hubRadius, cy + hubRadius);
        grad.addColorStop(0, '#FF3366');
        grad.addColorStop(0.5, '#FF6B00');
        grad.addColorStop(1, '#FFC700');

        ctx.beginPath();
        ctx.arc(cx, cy, hubRadius - 3, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Hub Inner Circle (Clean 3D White Dome)
        const innerGrad = ctx.createRadialGradient(cx, cy - hubRadius * 0.2, hubRadius * 0.1, cx, cy, hubRadius - 7);
        innerGrad.addColorStop(0, '#FFFFFF');
        innerGrad.addColorStop(1, '#F1F5F9');

        ctx.beginPath();
        ctx.arc(cx, cy, hubRadius - 7, 0, Math.PI * 2);
        ctx.fillStyle = innerGrad;
        ctx.fill();

        // Hub Center Text "หมุน / SPIN"
        ctx.shadowColor = 'rgba(255, 51, 102, 0.2)';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#FF3366';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.font = `900 ${Math.max(14, hubRadius * 0.38)}px 'Kanit', 'Prompt', sans-serif`;
        ctx.fillText('หมุน', cx, cy - (hubRadius * 0.12));

        ctx.font = `800 ${Math.max(10, hubRadius * 0.22)}px 'Plus Jakarta Sans', sans-serif`;
        ctx.fillStyle = '#FF6B00';
        ctx.fillText('SPIN', cx, cy + (hubRadius * 0.26));

        ctx.restore();
    }

    drawPointer(cx, cy, radius) {
        const ctx = this.ctx;
        const pointerY = cy - radius;
        const bounce = this.tickerBounce;

        ctx.save();
        ctx.translate(cx, pointerY + 6);
        ctx.rotate(bounce);

        // Pointer Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;

        // Pointer Arrow (Vibrant Crimson & Gold Tip)
        const grad = ctx.createLinearGradient(-16, -24, 16, 22);
        grad.addColorStop(0, '#FF1744');
        grad.addColorStop(1, '#D50000');

        ctx.beginPath();
        ctx.moveTo(0, 22); // Sharp tip into wheel
        ctx.lineTo(-16, -18);
        ctx.arcTo(-16, -26, -8, -26, 8);
        ctx.lineTo(8, -26);
        ctx.arcTo(16, -26, 16, -18, 8);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // White & Gold Center Indicator
        ctx.beginPath();
        ctx.arc(0, -12, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, -12, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        ctx.restore();
    }

    drawEmptyState(cx, cy, radius) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#F8FAFC';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#E2E8F0';
        ctx.stroke();

        ctx.fillStyle = '#64748B';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = "800 20px 'Kanit', 'Prompt', sans-serif";
        ctx.fillText('โปรดเพิ่มรายชื่อนักเรียน', cx, cy - 35);
        ctx.font = "600 15px 'Kanit', 'Prompt', sans-serif";
        ctx.fillStyle = '#94A3B8';
        ctx.fillText('พิมพ์หรือเลือกแม่แบบที่แถบขวามือ', cx, cy - 10);
    }
}

window.WheelCanvas = WheelCanvas;
