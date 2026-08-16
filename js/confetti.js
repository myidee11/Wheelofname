/**
 * Classroom Wheel of Names - Vibrant Confetti & Sparkles Engine
 * Multi-shape particles (ribbons, stars, circles) with energetic celebration physics
 */

class ConfettiEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationId = null;
        this.colors = [
            '#FF3366', '#FF9900', '#FFCC00', '#10B981', '#00D2D3',
            '#6366F1', '#8B5CF6', '#EC4899', '#00E5FF', '#FF1744'
        ];
        this.init();
    }

    init() {
        let canvas = document.getElementById('confettiCanvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'confettiCanvas';
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '9999';
            document.body.appendChild(canvas);
        }
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (!this.canvas) return;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    burst(count = 180) {
        this.resize();
        const width = window.innerWidth;
        const height = window.innerHeight;

        const origins = [
            { x: width * 0.15, y: height * 0.65, angle: -Math.PI / 3 },
            { x: width * 0.85, y: height * 0.65, angle: -2 * Math.PI / 3 },
            { x: width * 0.5, y: height * 0.45, angle: -Math.PI / 2 }
        ];

        origins.forEach(origin => {
            const particlesPerOrigin = Math.floor(count / origins.length);
            for (let i = 0; i < particlesPerOrigin; i++) {
                const spread = (Math.random() - 0.5) * 1.5;
                const speed = 14 + Math.random() * 20;
                const angle = origin.angle + spread;

                const shapeRand = Math.random();
                const shape = shapeRand > 0.6 ? 'rect' : (shapeRand > 0.25 ? 'circle' : 'star');

                this.particles.push({
                    x: origin.x,
                    y: origin.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: this.colors[Math.floor(Math.random() * this.colors.length)],
                    size: shape === 'star' ? (10 + Math.random() * 8) : (8 + Math.random() * 9),
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.3,
                    shape: shape,
                    wobble: Math.random() * 10,
                    wobbleSpeed: 0.12 + Math.random() * 0.1,
                    alpha: 1,
                    decay: 0.004 + Math.random() * 0.006,
                    gravity: 0.38
                });
            }
        });

        if (!this.animationId) {
            this.animate();
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.vx *= 0.985;
            p.rotation += p.rotationSpeed;
            p.wobble += p.wobbleSpeed;
            p.alpha -= p.decay;

            if (p.alpha <= 0 || p.y > window.innerHeight + 50) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);
            this.ctx.globalAlpha = Math.max(0, p.alpha);
            this.ctx.fillStyle = p.color;

            if (p.shape === 'rect') {
                const w = p.size * Math.cos(p.wobble);
                this.ctx.fillRect(-w / 2, -p.size / 2, Math.abs(w), p.size);
            } else if (p.shape === 'circle') {
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (p.shape === 'star') {
                this.drawStar(0, 0, 5, p.size / 2, p.size / 4);
            }

            this.ctx.restore();
        }

        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animate());
        } else {
            this.animationId = null;
            this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        }
    }

    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }
        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
        this.ctx.fill();
    }
}

window.confetti = new ConfettiEngine();
