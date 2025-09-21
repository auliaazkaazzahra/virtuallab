class NewtonLawSimulation {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.isRunning = false;
        this.animationId = null;

        // Physics variables
        this.mass = 2.0; // kg
        this.force = 10; // N
        this.acceleration = 0; // m/s²
        this.velocity = 0; // m/s
        this.position = 60; // pixels from left
        this.time = 0; // seconds

        // Visual properties
        this.objectSize = 50;
        this.objectColor = '#FF6B6B';
        this.trails = [];
        this.maxTrails = 30;

        // Animation properties
        this.lastTime = 0;
        this.scale = 15; // pixels per meter for position display

        // Statistics
        this.simulationStartTime = 0;
        this.totalSimulationTime = 0;

        // Sound properties
        this.soundEnabled = true;
        this.audioContext = null;

        this.initializeControls();
        this.initializeAudio();
        this.updateCalculations();
        this.draw();
        this.startDataAnimation();
        this.loadStats();
    }

    initializeControls() {
        const massSlider = document.getElementById('massSlider');
        const forceSlider = document.getElementById('forceSlider');
        const startBtn = document.getElementById('startBtn');
        const resetBtn = document.getElementById('resetBtn');

        massSlider.addEventListener('input', (e) => {
            this.mass = parseFloat(e.target.value);
            document.getElementById('massDisplay').textContent = `${this.mass.toFixed(1)} kg`;
            this.updateCalculations();
            this.animateValueChange('massDisplay');
            this.playSound('slider', 0.3);
        });

        forceSlider.addEventListener('input', (e) => {
            this.force = parseInt(e.target.value);
            document.getElementById('forceDisplay').textContent = `${this.force} N`;
            this.updateCalculations();
            this.animateValueChange('forceDisplay');
            this.playSound('slider', 0.3);
        });

        startBtn.addEventListener('click', () => {
            if (!this.isRunning) {
                this.start();
                this.playSound('start', 0.5);
            } else {
                this.pause();
                this.playSound('pause', 0.4);
            }
        });

        resetBtn.addEventListener('click', () => {
            this.reset();
            this.playSound('reset', 0.6);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    startBtn.click();
                    break;
                case 'KeyR':
                    e.preventDefault();
                    resetBtn.click();
                    break;
            }
        });
    }

    initializeAudio() {
        // Initialize Web Audio API
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
            this.soundEnabled = false;
        }

        // Sound toggle control
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => {
                this.soundEnabled = e.target.checked;
                const icon = document.querySelector('.sound-icon');
                if (icon) {
                    icon.textContent = this.soundEnabled ? '🔊' : '🔇';
                }
            });
        }
    }

    playSound(type, volume = 0.5) {
        if (!this.soundEnabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Different sounds for different actions
        switch(type) {
            case 'start':
                oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.2);
                break;
            case 'pause':
                oscillator.frequency.setValueAtTime(660, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(330, this.audioContext.currentTime + 0.15);
                break;
            case 'reset':
                oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.3);
                break;
            case 'collision':
                oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);
                break;
            case 'slider':
                oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                break;
            case 'download':
                oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime);
                oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2);
                break;
        }

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    updateCalculations() {
        this.acceleration = this.force / this.mass;
        document.getElementById('accelerationValue').textContent = this.acceleration.toFixed(1);
        document.getElementById('calculationDisplay').textContent = `${this.force} N = ${this.mass.toFixed(1)} kg × ${this.acceleration.toFixed(1)} m/s²`;
    }

    animateValueChange(elementId) {
        const element = document.getElementById(elementId);
        element.classList.add('pulse');
        setTimeout(() => {
            element.classList.remove('pulse');
        }, 600);
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.simulationStartTime = Date.now();
        document.getElementById('simulationStatus').textContent = '● Berjalan';
        document.getElementById('simulationStatus').className = 'simulation-status status-running';
        document.getElementById('startBtn').innerHTML = '⏸️ Pause';

        this.animate();
    }

    pause() {
        if (!this.isRunning) return;

        this.isRunning = false;
        document.getElementById('simulationStatus').textContent = '● Dijeda';
        document.getElementById('simulationStatus').className = 'simulation-status status-paused';
        document.getElementById('startBtn').innerHTML = '▶️ Lanjutkan';

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    reset() {
        this.pause();
        this.velocity = 0;
        this.position = 60;
        this.time = 0;
        this.trails = [];
        this.totalSimulationTime = 0;

        document.getElementById('velocityValue').textContent = '0.0';
        document.getElementById('positionValue').textContent = '0.0';
        document.getElementById('timeValue').textContent = '0.0';
        document.getElementById('simulationStatus').textContent = '● Siap Dimulai';
        document.getElementById('simulationStatus').className = 'simulation-status status-ready';
        document.getElementById('startBtn').innerHTML = '▶️ Mulai Simulasi';

        this.updateCalculations();
        this.draw();
        this.saveStats();
    }

    animate() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;

        // Physics calculations
        this.acceleration = this.force / this.mass;
        this.velocity += this.acceleration * deltaTime;
        this.position += this.velocity * deltaTime * this.scale;
        this.time += deltaTime;

        // Update display values
        document.getElementById('velocityValue').textContent = this.velocity.toFixed(1);
        document.getElementById('positionValue').textContent = ((this.position - 60) / this.scale).toFixed(1);
        document.getElementById('timeValue').textContent = this.time.toFixed(1);

        // Add trail
        this.trails.push({
            x: this.position,
            y: this.canvas.height / 2,
            time: this.time
        });

        // Limit trail length
        if (this.trails.length > this.maxTrails) {
            this.trails.shift();
        }

        // Check boundaries
        if (this.position > this.canvas.width - this.objectSize/2) {
            this.position = this.canvas.width - this.objectSize/2;
            this.velocity = 0;
            this.playSound('collision', 0.7);
        }

        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#e3f2fd');
        gradient.addColorStop(1, '#f1f8e9');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw trails
        this.ctx.strokeStyle = 'rgba(132, 65, 164, 0.3)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.trails.forEach((trail, index) => {
            if (index === 0) {
                this.ctx.moveTo(trail.x, trail.y);
            } else {
                this.ctx.lineTo(trail.x, trail.y);
            }
        });
        this.ctx.stroke();

        // Draw trail dots
        this.trails.forEach((trail, index) => {
            const alpha = index / this.trails.length;
            this.ctx.fillStyle = `rgba(132, 65, 164, ${alpha * 0.5})`;
            this.ctx.beginPath();
            this.ctx.arc(trail.x, trail.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw object
        this.ctx.fillStyle = this.objectColor;
        this.ctx.beginPath();
        this.ctx.arc(this.position, this.canvas.height / 2, this.objectSize / 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw object border
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // Draw force arrow
        if (this.force > 0) {
            this.ctx.strokeStyle = '#FF5B94';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.moveTo(this.position - 30, this.canvas.height / 2 - 20);
            this.ctx.lineTo(this.position - 60, this.canvas.height / 2 - 20);
            this.ctx.lineTo(this.position - 55, this.canvas.height / 2 - 25);
            this.ctx.moveTo(this.position - 60, this.canvas.height / 2 - 20);
            this.ctx.lineTo(this.position - 55, this.canvas.height / 2 - 15);
            this.ctx.stroke();

            // Arrow label
            this.ctx.fillStyle = '#FF5B94';
            this.ctx.font = '14px Arial';
            this.ctx.fillText(`${this.force}N`, this.position - 90, this.canvas.height / 2 - 25);
        }

        // Draw coordinate system
        this.ctx.strokeStyle = '#999';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height / 2);
        this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw position markers
        for (let x = 0; x < this.canvas.width; x += 50) {
            this.ctx.fillStyle = '#666';
            this.ctx.font = '10px Arial';
            this.ctx.fillText(`${(x / this.scale).toFixed(1)}m`, x + 5, this.canvas.height / 2 + 15);
        }
    }

    startDataAnimation() {
        // Animate data values periodically
        setInterval(() => {
            if (this.isRunning) {
                document.getElementById('simulationCount').textContent = parseInt(document.getElementById('simulationCount').textContent) + 1;
                this.totalSimulationTime += 0.1;
                document.getElementById('totalTime').textContent = this.totalSimulationTime.toFixed(1);
                this.saveStats();
            }
        }, 100);
    }

    loadStats() {
        const simulationCount = localStorage.getItem('simulationCount') || '0';
        const totalTime = localStorage.getItem('totalTime') || '0';
        document.getElementById('simulationCount').textContent = simulationCount;
        document.getElementById('totalTime').textContent = totalTime;
    }

    saveStats() {
        localStorage.setItem('simulationCount', document.getElementById('simulationCount').textContent);
        localStorage.setItem('totalTime', document.getElementById('totalTime').textContent);
    }
}

// Initialize simulation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.simulation = new NewtonLawSimulation();
});
