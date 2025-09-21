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
        soundToggle.addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
            const icon = document.querySelector('.sound-icon');
            icon.textContent = this.soundEnabled ? '🔊' : '🔇';
        });
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

}