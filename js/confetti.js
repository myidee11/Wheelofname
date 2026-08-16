/**
 * Classroom Wheel of Names - Confetti Celebration Engine
 * High-performance Canvas particle confetti with Pastel color palette
 */

class ConfettiEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationId = null;
        this.colors = [
            '#FF9AA2', '#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA',
            '#A0C4FF', '#BDB2FF', '#FFC6FF', '#FDFFB6', '#CAFFBF', '#9BF6FF'
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
        this.ctx.scale(dpr, dpr);
    }

    /**
     * Trigger a burst of confetti
     * @param {number} count - number of particles
     */
    burst(count = 150) {
        this.resize();
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Origin points: left side and right side for grand stage entrance
        const origins = [
            { x: width * 0.2, y: height * 0.6, angle: -Math.PI / 3 },
            { x: width * 0.8, y: height * 0.6, angle: -2 * Math.PI / 3 },
            { x: width * 0.5, y: height * 0.4, angle: -Math.PI / 2 }
        ];

        origins.forEach(origin => {
            const particlesPerOrigin = Math.floor(count / origins.length);
            for (let i = 0; i < particlesPerOrigin; i++) {
                const spread = (Math.random() - 0.5) * 1.4;
                const speed = 12 + Math.random() * 18;
                const angle = origin.angle + spread;

                this.particles.push({
                    x: origin.x,
                    y: origin.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: this.colors[Math.floor(Math.random() * this.colors.length)],
                    size: 8 + Math.random() * 8,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.25,
                    shape: Math.random() > 0.3 ? 'rect' : 'circle',
                    wobble: Math.random() * 10,
                    wobbleSpeed: 0.1 + Math.random() * 0.1,
                    alpha: 1,
                    decay: 0.003 + Math.random() * 0.005,
                    gravity: 0.35
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
            p.vx *= 0.98; // Air resistance
            p.vy *= 0.98;
            p.rotation += p.rotationSpeed;
            p.wobble += p.wobbleSpeed;
            p.alpha -= p.decay;

            if (p.alpha <= 0 || p.y > window.innerHeight + 50) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = Math.max(0, p.alpha);
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);

            const scaleX = Math.cos(p.wobble);
            this.ctx.scale(scaleX, 1);

            this.ctx.fillStyle = p.color;

            if (p.shape === 'rect') {
                this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
            } else {
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        }

        if (this.particles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animate());
        } else {
            this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            this.animationId = null;
        }
    }

    stop() {
        this.particles = [];
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.ctx) {
            this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        }
    }
}

window.confettiEngine = new ConfettiEngine();
