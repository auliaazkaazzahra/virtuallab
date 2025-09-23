
    // PHYSICSLAB SIMULATION - NEWTON'S LAWS

    // CONFIGURATION & CONSTANTS
    const SIM_CONFIG = {
        PHYSICS: {
            SCALE: 15, // pixels per meter
            GRAVITY: 9.81,
            MAX_TRAILS: 30
        },
        UI: {
            OBJECT_SIZE: 50,
            ANIMATION_DURATION: 300,
            CANVAS_PADDING: 60
        },
        COLORS: {
            OBJECT: '#FF6B6B',
            TRAIL: 'rgba(132, 65, 164, 0.3)',
            TRAIL_DOT: 'rgba(132, 65, 164, 0.5)',
            FORCE_ARROW: '#FF5B94',
            BACKGROUND_START: '#e3f2fd',
            BACKGROUND_END: '#f1f8e9'
        },
        AUDIO: {
            START_FREQ: 440,
            PAUSE_FREQ: 660,
            RESET_FREQ: 880,
            COLLISION_FREQ: 200,
            SLIDER_FREQ: 800,
            DOWNLOAD_FREQ: 523
        }
    };

    // PHYSICS ENGINE
    class PhysicsEngine {
        constructor() {
            this.acceleration = 0;
            this.velocity = 0;
            this.position = SIM_CONFIG.UI.CANVAS_PADDING;
            this.time = 0;
            this.scale = SIM_CONFIG.PHYSICS.SCALE;
        }

        // Calculate physics based on Newton's second law: F = ma
        calculateAcceleration(force, mass) {
            return force / mass;
        }

        // Update position using kinematic equations
        updatePosition(deltaTime) {
            this.acceleration = this.calculateAcceleration(this.force, this.mass);
            this.velocity += this.acceleration * deltaTime;
            this.position += this.velocity * deltaTime * this.scale;
            this.time += deltaTime;
        }

        // Check if object hits boundary
        checkBoundary(canvasWidth) {
            const maxPosition = canvasWidth - SIM_CONFIG.UI.OBJECT_SIZE / 2;
            if (this.position > maxPosition) {
                this.position = maxPosition;
                this.velocity = 0;
                return true; // Collision occurred
            }
            return false;
        }

        // Reset physics state
        reset() {
            this.velocity = 0;
            this.position = SIM_CONFIG.UI.CANVAS_PADDING;
            this.time = 0;
        }
    }

    // AUDIO MANAGER
    class AudioManager {
        constructor() {
            this.soundEnabled = true;
            this.audioContext = null;
            this.initializeAudio();
        }

        initializeAudio() {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.log('Web Audio API not supported');
                this.soundEnabled = false;
            }
        }

        playSound(type, volume = 0.5) {
            if (!this.soundEnabled || !this.audioContext) return;

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Set frequency based on sound type
            const frequencies = SIM_CONFIG.AUDIO;
            switch(type) {
                case 'start':
                    oscillator.frequency.setValueAtTime(frequencies.START_FREQ, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(frequencies.START_FREQ * 2, this.audioContext.currentTime + 0.2);
                    break;
                case 'pause':
                    oscillator.frequency.setValueAtTime(frequencies.PAUSE_FREQ, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(frequencies.PAUSE_FREQ / 2, this.audioContext.currentTime + 0.15);
                    break;
                case 'reset':
                    oscillator.frequency.setValueAtTime(frequencies.RESET_FREQ, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(frequencies.RESET_FREQ / 4, this.audioContext.currentTime + 0.3);
                    break;
                case 'collision':
                    oscillator.frequency.setValueAtTime(frequencies.COLLISION_FREQ, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(frequencies.COLLISION_FREQ / 2, this.audioContext.currentTime + 0.1);
                    break;
                case 'slider':
                    oscillator.frequency.setValueAtTime(frequencies.SLIDER_FREQ, this.audioContext.currentTime);
                    break;
                case 'download':
                    oscillator.frequency.setValueAtTime(frequencies.DOWNLOAD_FREQ, this.audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(frequencies.DOWNLOAD_FREQ * 1.26, this.audioContext.currentTime + 0.1);
                    oscillator.frequency.setValueAtTime(frequencies.DOWNLOAD_FREQ * 1.5, this.audioContext.currentTime + 0.2);
                    break;
            }

            // Apply volume envelope
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        }

        toggleSound() {
            this.soundEnabled = !this.soundEnabled;
            return this.soundEnabled;
        }
    }

    // RENDERING ENGINE
    class RenderingEngine {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.trails = [];
            this.maxTrails = SIM_CONFIG.PHYSICS.MAX_TRAILS;
        }

        // Main drawing function
        draw(physicsState, force, objectSize) {
            this.clearCanvas();
            this.drawBackground();
            this.drawTrails();
            this.drawObject(physicsState.position, objectSize);
            this.drawForceArrow(physicsState.position, force, objectSize);
            this.drawCoordinateSystem();
            this.drawPositionMarkers();
        }

        // Clear canvas with background
        clearCanvas() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw gradient background
        drawBackground() {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, SIM_CONFIG.COLORS.BACKGROUND_START);
            gradient.addColorStop(1, SIM_CONFIG.COLORS.BACKGROUND_END);
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw motion trails
        drawTrails() {
            if (this.trails.length === 0) return;

            // Draw trail lines
            this.ctx.strokeStyle = SIM_CONFIG.COLORS.TRAIL;
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
                this.ctx.fillStyle = SIM_CONFIG.COLORS.TRAIL_DOT.replace('0.5', alpha * 0.5);
                this.ctx.beginPath();
                this.ctx.arc(trail.x, trail.y, 4, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }

        // Draw the physics object
        drawObject(position, size) {
            const centerY = this.canvas.height / 2;

            // Draw main object
            this.ctx.fillStyle = SIM_CONFIG.COLORS.OBJECT;
            this.ctx.beginPath();
            this.ctx.arc(position, centerY, size / 2, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw object border
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }

        // Draw force arrow
        drawForceArrow(position, force, objectSize) {
            if (force <= 0) return;

            const centerY = this.canvas.height / 2;
            const arrowLength = 30;

            this.ctx.strokeStyle = SIM_CONFIG.COLORS.FORCE_ARROW;
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();

            // Arrow shaft
            this.ctx.moveTo(position - arrowLength, centerY - 20);
            this.ctx.lineTo(position - arrowLength - 30, centerY - 20);

            // Arrow head
            this.ctx.moveTo(position - arrowLength - 30, centerY - 20);
            this.ctx.lineTo(position - arrowLength - 25, centerY - 25);
            this.ctx.moveTo(position - arrowLength - 30, centerY - 20);
            this.ctx.lineTo(position - arrowLength - 25, centerY - 15);

            this.ctx.stroke();

            // Force label
            this.ctx.fillStyle = SIM_CONFIG.COLORS.FORCE_ARROW;
            this.ctx.font = '14px Arial';
            this.ctx.fillText(`${force}N`, position - arrowLength - 60, centerY - 25);
        }

        // Draw coordinate system
        drawCoordinateSystem() {
            this.ctx.strokeStyle = '#999';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.canvas.height / 2);
            this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        // Draw position markers
        drawPositionMarkers() {
            for (let x = 0; x < this.canvas.width; x += 50) {
                this.ctx.fillStyle = '#666';
                this.ctx.font = '10px Arial';
                this.ctx.fillText(`${(x / SIM_CONFIG.PHYSICS.SCALE).toFixed(1)}m`, x + 5, this.canvas.height / 2 + 15);
            }
        }

        // Add new trail point
        addTrail(x, y, time) {
            this.trails.push({ x, y, time });
            if (this.trails.length > this.maxTrails) {
                this.trails.shift();
            }
        }

        // Clear all trails
        clearTrails() {
            this.trails = [];
        }
    }

    // UI CONTROLLER
    class UIController {
        constructor() {
            this.physicsEngine = new PhysicsEngine();
            this.audioManager = new AudioManager();
            this.renderingEngine = null;
            this.isRunning = false;
            this.animationId = null;
            this.lastTime = 0;
            this.simulationStartTime = 0;
            this.totalSimulationTime = 0;
        }

        initialize(canvas) {
            this.renderingEngine = new RenderingEngine(canvas);
            this.bindEvents();
            this.updateCalculations();
            this.renderingEngine.draw(this.physicsEngine, this.physicsEngine.force, SIM_CONFIG.UI.OBJECT_SIZE);
            this.startDataAnimation();
            this.loadStats();
        }

        bindEvents() {
            // Control sliders
            const massSlider = document.getElementById('massSlider');
            const forceSlider = document.getElementById('forceSlider');
            const startBtn = document.getElementById('startBtn');
            const resetBtn = document.getElementById('resetBtn');

            // Mass slider
            massSlider?.addEventListener('input', (e) => {
                this.physicsEngine.mass = parseFloat(e.target.value);
                document.getElementById('massDisplay').textContent = `${this.physicsEngine.mass.toFixed(1)} kg`;
                this.updateCalculations();
                this.animateValueChange('massDisplay');
                this.audioManager.playSound('slider', 0.3);
            });

            // Force slider
            forceSlider?.addEventListener('input', (e) => {
                this.physicsEngine.force = parseInt(e.target.value);
                document.getElementById('forceDisplay').textContent = `${this.physicsEngine.force} N`;
                this.updateCalculations();
                this.animateValueChange('forceDisplay');
                this.audioManager.playSound('slider', 0.3);
            });

            // Start/Pause button
            startBtn?.addEventListener('click', () => {
                if (!this.isRunning) {
                    this.start();
                    this.audioManager.playSound('start', 0.5);
                } else {
                    this.pause();
                    this.audioManager.playSound('pause', 0.4);
                }
            });

            // Reset button
            resetBtn?.addEventListener('click', () => {
                this.reset();
                this.audioManager.playSound('reset', 0.6);
            });

            // Download button
            const downloadBtn = document.getElementById('downloadBtn');
            downloadBtn?.addEventListener('click', () => {
                downloadBtn.classList.add('bounce');
                setTimeout(() => {
                    downloadBtn.classList.remove('bounce');
                }, 500);
            });

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                switch(e.code) {
                    case 'Space':
                        e.preventDefault();
                        startBtn?.click();
                        break;
                    case 'KeyR':
                        e.preventDefault();
                        resetBtn?.click();
                        break;
                }
            });

            // Sound toggle
            const soundToggle = document.getElementById('soundToggle');
            soundToggle?.addEventListener('change', (e) => {
                this.audioManager.soundEnabled = e.target.checked;
                const icon = document.querySelector('.sound-icon');
                if (icon) {
                    icon.textContent = this.audioManager.soundEnabled ? '🔊' : '🔇';
                }
            });
        }

        updateCalculations() {
            this.physicsEngine.acceleration = this.physicsEngine.calculateAcceleration(this.physicsEngine.force, this.physicsEngine.mass);
            document.getElementById('accelerationValue').textContent = this.physicsEngine.acceleration.toFixed(1);
            document.getElementById('calculationDisplay').textContent =
                `${this.physicsEngine.force} N = ${this.physicsEngine.mass.toFixed(1)} kg × ${this.physicsEngine.acceleration.toFixed(1)} m/s²`;
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
            this.physicsEngine.reset();
            this.renderingEngine.clearTrails();
            this.totalSimulationTime = 0;

            document.getElementById('velocityValue').textContent = '0.0';
            document.getElementById('positionValue').textContent = '0.0';
            document.getElementById('timeValue').textContent = '0.0';
            document.getElementById('simulationStatus').textContent = '● Siap Dimulai';
            document.getElementById('simulationStatus').className = 'simulation-status status-ready';
            document.getElementById('startBtn').innerHTML = '▶️ Mulai Simulasi';

            this.updateCalculations();
            this.renderingEngine.draw(this.physicsEngine, this.physicsEngine.force, SIM_CONFIG.UI.OBJECT_SIZE);
            this.saveStats();
        }

        animate() {
            if (!this.isRunning) return;

            const currentTime = performance.now();
            const deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;

            // Update physics
            this.physicsEngine.updatePosition(deltaTime);

            // Update display values
            document.getElementById('velocityValue').textContent = this.physicsEngine.velocity.toFixed(1);
            document.getElementById('positionValue').textContent =
                ((this.physicsEngine.position - SIM_CONFIG.UI.CANVAS_PADDING) / this.physicsEngine.scale).toFixed(1);
            document.getElementById('timeValue').textContent = this.physicsEngine.time.toFixed(1);

            // Add trail
            this.renderingEngine.addTrail(
                this.physicsEngine.position,
                this.renderingEngine.canvas.height / 2,
                this.physicsEngine.time
            );

            // Check boundaries and play collision sound if needed
            if (this.physicsEngine.checkBoundary(this.renderingEngine.canvas.width)) {
                this.audioManager.playSound('collision', 0.7);
            }

            // Render frame
            this.renderingEngine.draw(this.physicsEngine, this.physicsEngine.force, SIM_CONFIG.UI.OBJECT_SIZE);

            // Continue animation
            this.animationId = requestAnimationFrame(() => this.animate());
        }

        startDataAnimation() {
            setInterval(() => {
                if (this.isRunning) {
                    document.getElementById('simulationCount').textContent =
                        parseInt(document.getElementById('simulationCount').textContent) + 1;
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

    // MAIN SIMULATION CLASS
    class NewtonLawSimulation {
        constructor() {
            this.canvas = document.getElementById('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.uiController = new UIController();

            // Initialize physics engine properties
            this.uiController.physicsEngine.mass = 2.0;
            this.uiController.physicsEngine.force = 10;

            this.uiController.initialize(this.canvas);
        }
}

// DOWNLOAD FUNCTIONALITY
function downloadSimulationReport() {
    // Get current simulation data
    const mass = document.getElementById('massDisplay').textContent;
    const force = document.getElementById('forceDisplay').textContent;
    const acceleration = document.getElementById('accelerationValue').textContent;
    const velocity = document.getElementById('velocityValue').textContent;
    const position = document.getElementById('positionValue').textContent;
    const time = document.getElementById('timeValue').textContent;
    const calculation = document.getElementById('calculationDisplay').textContent;
    const status = document.getElementById('simulationStatus').textContent;

    // Get simulation statistics
    const simulationCount = document.getElementById('simulationCount').textContent;
    const totalTime = document.getElementById('totalTime').textContent;

    // Generate report content
    const reportContent = `
LAPORAN HASIL SIMULASI FISIKALAB
=====================================

INFORMASI SIMULASI
------------------
Judul Simulasi: Hukum Newton II (F = ma)
Tanggal: ${new Date().toLocaleDateString('id-ID')}
Waktu: ${new Date().toLocaleString('id-ID')}

PARAMETER SIMULASI
------------------
Massa Objek: ${mass}
Gaya yang Diberikan: ${force}
Percepatan: ${acceleration} m/s²
Kecepatan: ${velocity} m/s
Posisi: ${position} m
Waktu Simulasi: ${time} detik

PERHITUNGAN FISIK
-----------------
${calculation}

STATUS SIMULASI
---------------
${status}

STATISTIK PENGGUNAAN
--------------------
Jumlah Simulasi: ${simulationCount}
Total Waktu Simulasi: ${totalTime} detik

TEORI DASAR
-----------
Hukum Newton II menyatakan bahwa percepatan suatu benda
berbanding lurus dengan gaya total yang bekerja padanya
dan berbanding terbalik dengan massanya.

Rumus: F = m × a

Dimana:
- F = Gaya total (Newton)
- m = Massa benda (kilogram)
- a = Percepatan (m/s²)

KESIMPULAN
----------
Simulasi ini menunjukkan hubungan antara gaya, massa,
dan percepatan sesuai dengan Hukum Newton II. Semakin
besar massa benda, semakin kecil percepatan yang dihasilkan
untuk gaya yang sama, dan sebaliknya.

=====================================
Laporan ini dihasilkan oleh PhysicsLab Virtual
Educational Physics Simulation Platform
=====================================
    `.trim();

    // Create and download the file
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Simulasi_Newton_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Play download sound effect
    if (window.simulation && window.simulation.uiController) {
        window.simulation.uiController.audioManager.playSound('download', 0.6);
    }

    // Show success message
    showNotification('✅ Laporan berhasil didownload!', 'success');
}

// NOTIFICATION SYSTEM
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Initialize simulation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.simulation = new NewtonLawSimulation();
});
