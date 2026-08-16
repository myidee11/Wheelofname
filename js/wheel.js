/**
 * Classroom Wheel of Names - Canvas 2D Wheel Engine
 * High DPI rendering, Physics deceleration, Ticker flipper bounce, Pastel Themes
 */

class WheelCanvas {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id "${canvasId}" not found.`);
        }
        this.ctx = this.canvas.getContext('2d');

        // State
        this.items = []; // Array of strings or { text, weight }
        this.currentAngle = 0; // in radians
        this.angularVelocity = 0;
        this.isSpinning = false;
        this.spinStartTime = 0;
        this.spinDuration = 7000; // default 7 seconds
        this.startAngle = 0;
        this.targetAngle = 0;
        this.animationFrameId = null;

        // Ticker pointer state
        this.lastSliceIndex = -1;
        this.tickerBounce = 0; // Angle offset for pointer vibration

        // Theme Palettes (Pastel Collection)
        this.themes = {
            pastelRainbow: [
                '#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA', 
                '#A0C4FF', '#BDB2FF', '#FFC6FF', '#FDFFB6', '#CAFFBF'
            ],
            candySweet: [
                '#FF9AA2', '#FFB7B2', '#FFDAC1', '#FFF1C5', '#D4F0F0', 
                '#8FC1E3', '#B8BEDD', '#E8DFF5', '#FCE1E4', '#F3C4FB'
            ],
            mintPeach: [
                '#A8E6CF', '#DCEDC1', '#FFD3B6', '#FFAAA6', '#FF8B94',
                '#BEE1E6', '#DFE7FD', '#FCD5CE', '#F8EDEB', '#E2ECE9'
            ],
            oceanBreeze: [
                '#90E0EF', '#00B4D8', '#48CAE4', '#ADE8F4', '#CAF0F8',
                '#BEE9E8', '#62B6CB', '#5FA8D3', '#A2D2FF', '#BDE0FE'
            ],
            sakuraLilac: [
                '#FFC8DD', '#FFAFCC', '#BDE0FE', '#A2D2FF', '#CDB4DB',
                '#FDE2E4', '#E2ECE9', '#DFE7FD', '#EED3D9', '#D0F4DE'
            ]
        };
        this.currentTheme = 'pastelRainbow';

        // Callbacks
        this.onSpinStart = options.onSpinStart || (() => {});
        this.onSpinEnd = options.onSpinEnd || (() => {});

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.draw();
    }

    resize() {
        const container = this.canvas.parentElement;
        if (!container) return;

        const size = Math.min(container.clientWidth, container.clientHeight || 560);
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = size * dpr;
        this.canvas.height = size * dpr;
        this.canvas.style.width = `${size}px`;
        this.canvas.style.height = `${size}px`;

        this.size = size;
        this.radius = (size / 2) * 0.92;
        this.centerX = size / 2;
        this.centerY = size / 2;

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
        return this.themes[this.currentTheme] || this.themes.pastelRainbow;
    }

    /**
     * Start spinning the wheel
     * @param {number} durationMs - Spin duration in milliseconds
     * @param {number|null} targetIndex - Optional forced winner index
     */
    spin(durationMs = 7000, targetIndex = null) {
        if (this.isSpinning || this.items.length === 0) return;

        this.isSpinning = true;
        this.spinDuration = durationMs;
        this.spinStartTime = performance.now();
        this.startAngle = this.currentAngle % (Math.PI * 2);

        // Calculate random target or specified target
        const count = this.items.length;
        const sliceAngle = (Math.PI * 2) / count;

        let selectedIndex = targetIndex;
        if (selectedIndex === null || selectedIndex < 0 || selectedIndex >= count) {
            selectedIndex = Math.floor(Math.random() * count);
        }

        // Pointer is at Top (angle = 3*PI/2 or -PI/2)
        // Winning item center should align with Top Pointer at end of spin
        const pointerAngle = -Math.PI / 2;
        const sliceCenterOffset = (selectedIndex + 0.5) * sliceAngle;
        
        // Random micro-offset within the slice (keep within 70% of slice width to avoid border ambiguity)
        const randomSliceJitter = (Math.random() - 0.5) * sliceAngle * 0.65;

        // Total spins (e.g. 5 to 8 full rotations + target alignment)
        const fullRotations = (6 + Math.floor(Math.random() * 3)) * (Math.PI * 2);
        
        // Target angle calculation
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

        // Quintic/Cubic Ease Out for dramatic suspense
        const easeOut = (t) => 1 - Math.pow(1 - t, 4.2);
        const currentProgress = easeOut(progress);

        this.currentAngle = this.startAngle + (this.targetAngle - this.startAngle) * currentProgress;

        // Current speed factor for audio pitch
        const speed = (1 - progress);

        // Check slice boundary crossing for ticker sound and bounce
        this.checkTicker(speed);

        // Dampen ticker bounce
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

        // Angle at pointer (Top: -PI/2)
        const pointerAngle = -Math.PI / 2;
        let normalizedAngle = (pointerAngle - this.currentAngle) % (Math.PI * 2);
        if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;

        const currentSliceIndex = Math.floor(normalizedAngle / sliceAngle) % count;

        if (this.lastSliceIndex !== currentSliceIndex && this.lastSliceIndex !== -1) {
            // Crossed a peg/slice line!
            this.tickerBounce = 0.38 * Math.min(speed + 0.3, 1);
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

        // Outer Glow / Soft Shadow
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
        ctx.shadowColor = 'rgba(108, 99, 255, 0.18)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.restore();

        // If no items, draw empty friendly state
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

            // Slice Border with delicate translucent stroke
            ctx.lineWidth = Math.min(2.5, 60 / count);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.stroke();

            // Inner subtle rim border
            ctx.save();
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
            ctx.stroke();
            ctx.restore();

            // Draw Text
            this.drawSliceText(i, angleStart + sliceAngle / 2, cx, cy, radius, count);
        }

        // Outer decorative ring
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(108, 99, 255, 0.2)';
        ctx.stroke();

        // Draw Center Hub & Spin Button
        this.drawCenterHub(cx, cy);

        // Draw Top Ticker Pointer
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

        // Calculate dynamic font size based on slice count and length
        let fontSize = Math.floor(Math.min(20, Math.max(11, 280 / Math.sqrt(totalSlices))));
        if (totalSlices <= 6) fontSize = 22;
        else if (totalSlices <= 12) fontSize = 18;
        else if (totalSlices <= 24) fontSize = 15;
        else if (totalSlices <= 40) fontSize = 12;
        else fontSize = 10;

        ctx.font = `600 ${fontSize}px 'Prompt', 'Kanit', -apple-system, sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        // Deep pastel slate text color for optimal contrast
        ctx.fillStyle = '#2D3748';

        // Available width along the radius (from hub to outer rim)
        const hubRadius = radius * 0.22;
        const maxTextWidth = radius - hubRadius - 20;

        // Truncate text with ellipsis if too long
        let displayText = text;
        let textMetrics = ctx.measureText(displayText);
        if (textMetrics.width > maxTextWidth) {
            while (displayText.length > 2 && ctx.measureText(displayText + '...').width > maxTextWidth) {
                displayText = displayText.slice(0, -1);
            }
            displayText += '...';
        }

        // Draw text with subtle white stroke for maximum legibility
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.strokeText(displayText, radius - 16, 0);
        ctx.fillText(displayText, radius - 16, 0);

        ctx.restore();
    }

    drawCenterHub(cx, cy) {
        const ctx = this.ctx;
        const hubRadius = this.radius * 0.22;

        ctx.save();
        // Hub Outer Shadow
        ctx.beginPath();
        ctx.arc(cx, cy, hubRadius, 0, Math.PI * 2);
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // Hub Gradient Ring
        const grad = ctx.createLinearGradient(cx - hubRadius, cy - hubRadius, cx + hubRadius, cy + hubRadius);
        grad.addColorStop(0, '#7C77FF');
        grad.addColorStop(1, '#A0C4FF');

        ctx.beginPath();
        ctx.arc(cx, cy, hubRadius - 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Hub Inner Circle
        ctx.beginPath();
        ctx.arc(cx, cy, hubRadius - 9, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // Hub Center Text "หมุน / SPIN"
        ctx.fillStyle = '#5A52E0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `700 ${Math.max(12, hubRadius * 0.36)}px 'Prompt', sans-serif`;
        ctx.fillText('หมุน', cx, cy - (hubRadius * 0.12));

        ctx.font = `600 ${Math.max(9, hubRadius * 0.22)}px 'Prompt', sans-serif`;
        ctx.fillStyle = '#8E8AFF';
        ctx.fillText('SPIN', cx, cy + (hubRadius * 0.24));

        ctx.restore();
    }

    drawPointer(cx, cy, radius) {
        const ctx = this.ctx;
        const pointerY = cy - radius;
        const bounce = this.tickerBounce; // Bounce angle in radians

        ctx.save();
        ctx.translate(cx, pointerY + 6);
        ctx.rotate(bounce);

        // Pointer Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;

        // Pointer Body (Cute Pastel Peach/Coral Arrow)
        ctx.beginPath();
        ctx.moveTo(0, 18); // Tip pointing down into wheel
        ctx.lineTo(-14, -16);
        ctx.arcTo(-14, -22, -8, -22, 6);
        ctx.lineTo(8, -22);
        ctx.arcTo(14, -22, 14, -16, 6);
        ctx.lineTo(0, 18);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, -22, 0, 18);
        grad.addColorStop(0, '#FF758C');
        grad.addColorStop(1, '#FF7EB3');

        ctx.fillStyle = grad;
        ctx.fill();

        // Pointer Highlight
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        // Pointer Center Pivot Dot
        ctx.beginPath();
        ctx.arc(0, -12, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        ctx.restore();
    }

    drawEmptyState(cx, cy, radius) {
        const ctx = this.ctx;
        const colors = this.getColors();
        const placeholderSlices = 8;
        const sliceAngle = (Math.PI * 2) / placeholderSlices;

        for (let i = 0; i < placeholderSlices; i++) {
            const angleStart = this.currentAngle + i * sliceAngle;
            const angleEnd = angleStart + sliceAngle;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, angleStart, angleEnd);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.globalAlpha = 0.55;
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.stroke();
        }

        // Center Hint Text
        ctx.save();
        ctx.fillStyle = '#4A5568';
        ctx.font = "600 15px 'Prompt', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.restore();
    }
}

window.WheelCanvas = WheelCanvas;
