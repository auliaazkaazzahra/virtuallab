class NewtonLawSimulation {
  constructor() {
    this.canvas = document.getElementById("canvas")
    this.ctx = this.canvas.getContext("2d")
    this.isRunning = false
    this.animationId = null
    this.mass = 2.0 // kg
    this.force = 10 // N
    this.acceleration = 0 // m/s²
    this.velocity = 0 // m/s
    this.position = 60
    this.time = 0 // seconds
    this.objectSize = 50
    this.objectColor = "#FF6B6B"
    this.trails = []
    this.maxTrails = 30
    this.lastTime = 0
    this.scale = 15
    this.simulationStartTime = 0
    this.totalSimulationTime = 0
    this.soundEnabled = true
    this.audioContext = null
    this.mediaRecorder = null
    this.isRecording = false
    this.initializeControls()
    this.initializeAudio()
    this.initializeDownload()
    this.updateCalculations()
    this.draw()
    this.startDataAnimation()
    this.loadStats()
  }

  initializeControls() {
    const massSlider = document.getElementById("massSlider")
    const forceSlider = document.getElementById("forceSlider")
    const startBtn = document.getElementById("startBtn")
    const resetBtn = document.getElementById("resetBtn")
    massSlider.addEventListener("input", (e) => {
      this.mass = Number.parseFloat(e.target.value)
      document.getElementById("massDisplay").textContent = `${this.mass.toFixed(1)} kg`
      this.updateCalculations()
      this.animateValueChange("massDisplay")
      this.playSound("slider", 0.3)
    })
    forceSlider.addEventListener("input", (e) => {
      this.force = Number.parseInt(e.target.value, 10)
      document.getElementById("forceDisplay").textContent = `${this.force} N`
      this.updateCalculations()
      this.animateValueChange("forceDisplay")
      this.playSound("slider", 0.3)
    })
    startBtn.addEventListener("click", () => {
      if (!this.isRunning) {
        this.start()
        this.playSound("start", 0.5)
      } else {
        this.pause()
        this.playSound("pause", 0.4)
      }
    })
    resetBtn.addEventListener("click", () => {
      this.reset()
      this.playSound("reset", 0.6)
    })
  }

  initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    } catch (e) {
      console.log("Web Audio API not supported")
      this.soundEnabled = false
    }
    const soundToggle = document.getElementById("soundToggle")
    soundToggle.addEventListener("change", (e) => {
      this.soundEnabled = e.target.checked
      const icon = document.querySelector(".sound-icon")
      icon.textContent = this.soundEnabled ? "🔊" : "🔇"
    })
  }

  initializeDownload() {
    window.downloadSimulationReport = () => {
      this.playSound("download", 0.5)
      if (!window.MediaRecorder) {
        alert("MediaRecorder tidak didukung di browser ini. Silakan gunakan browser modern seperti Chrome atau Firefox.")
        return
      }

      const stream = this.canvas.captureStream(30)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      })

      const chunks = []
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `newton-simulation-video-${Date.now()}.webm`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        const downloadBtn = document.getElementById("downloadBtn")
        downloadBtn.innerHTML = "📥 Download Hasil"
        downloadBtn.disabled = false
      }

      mediaRecorder.start()
      this.mediaRecorder = mediaRecorder
      this.isRecording = true
      const downloadBtn = document.getElementById("downloadBtn")
      downloadBtn.innerHTML = "⏸️ Merekam Video..."
      downloadBtn.disabled = true
      const maxRecordDuration = 15000
      const checkStopInterval = setInterval(() => {
        if (Math.abs(this.velocity) < 0.1 && this.isRunning) {
          if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop()
            this.isRecording = false
            clearInterval(checkStopInterval)
          }
        }
      }, 100)
      setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop()
          this.isRecording = false
        }
        clearInterval(checkStopInterval)
      }, maxRecordDuration)
    }
  }

  playSound(type, volume = 0.5) {
    if (!this.soundEnabled || !this.audioContext) return
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    switch (type) {
      case "start":
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.2)
        break
      case "pause":
        oscillator.frequency.setValueAtTime(660, this.audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(330, this.audioContext.currentTime + 0.15)
        break
      case "reset":
        oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.3)
        break
      case "collision":
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1)
        break
      case "slider":
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime)
        break
      case "download":
        oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime)
        oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1)
        oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2)
        break
    }
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3)
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.3)
  }

  animateValueChange(elementId) {
    const element = document.getElementById(elementId)
    element.classList.add("pulse")
    setTimeout(() => {
      element.classList.remove("pulse")
    }, 600)
  }

  updateCalculations() {
    this.acceleration = this.force / this.mass
    document.getElementById("accelerationValue").textContent = this.acceleration.toFixed(1)
    document.getElementById("calculationDisplay").textContent =
      `${this.force} N = ${this.mass.toFixed(1)} kg × ${this.acceleration.toFixed(1)} m/s²`
    this.animateValueChange("accelerationValue")
  }

  start() {
    this.isRunning = true
    this.lastTime = performance.now()
    this.simulationStartTime = performance.now()
    const startBtn = document.getElementById("startBtn")
    startBtn.innerHTML = "⏸️ Pause"
    startBtn.className = "btn btn-pause"
    document.getElementById("simulationStatus").textContent = "● Simulasi Berjalan"
    document.getElementById("simulationStatus").className = "simulation-status status-running"
    this.updateSimulationCount()
    this.animate()
  }

  pause() {
    this.isRunning = false
    if (this.simulationStartTime) {
      this.totalSimulationTime += (performance.now() - this.simulationStartTime) / 1000
      this.updateTotalTime()
    }
    const startBtn = document.getElementById("startBtn")
    startBtn.innerHTML = "▶️ Lanjutkan"
    startBtn.className = "btn btn-start"
    document.getElementById("simulationStatus").textContent = "⏸️ Dijeda"
    document.getElementById("simulationStatus").className = "simulation-status status-ready"
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }

  reset() {
    this.pause()
    this.velocity = 0
    this.position = 60
    this.time = 0
    this.trails = []
    document.getElementById("velocityValue").textContent = "0.0"
    document.getElementById("positionValue").textContent = "0.0"
    document.getElementById("timeValue").textContent = "0.0"
    const startBtn = document.getElementById("startBtn")
    startBtn.innerHTML = "▶️ Mulai Simulasi"
    startBtn.className = "btn btn-start"
    document.getElementById("simulationStatus").textContent = "● Siap Dimulai"
    document.getElementById("simulationStatus").className = "simulation-status status-ready"
    document.getElementById("resetBtn").classList.add("bounce")
    setTimeout(() => {
      document.getElementById("resetBtn").classList.remove("bounce")
    }, 500)
    this.draw()
  }

  animate(currentTime = performance.now()) {
    if (!this.isRunning) return
    const deltaTime = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime
    this.time += deltaTime
    this.velocity += this.acceleration * deltaTime
    this.position += this.velocity * deltaTime * this.scale
    if (this.trails.length > this.maxTrails) {
      this.trails.shift()
    }
    this.trails.push({
      x: this.position + this.objectSize / 2,
      y: this.canvas.height / 2,
      alpha: 1.0,
      time: this.time,
    })
    this.trails.forEach((trail) => {
      const age = this.time - trail.time
      trail.alpha = Math.max(0, 1 - age / 2)
    })
    this.trails = this.trails.filter((trail) => trail.alpha > 0)
    if (this.position > this.canvas.width - this.objectSize - 10) {
      this.position = this.canvas.width - this.objectSize - 10
      this.velocity *= -0.7
      this.addCollisionEffect(this.position + this.objectSize / 2, this.canvas.height / 2)
    }
    if (this.position < 10) {
      this.position = 10
      this.velocity *= -0.7
      this.addCollisionEffect(this.position + this.objectSize / 2, this.canvas.height / 2)
    }
    this.updateDisplays()
    this.draw()
    this.animationId = requestAnimationFrame((time) => this.animate(time))
  }

  addCollisionEffect(x, y) {
    for (let i = 0; i < 8; i++) {
      this.trails.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        alpha: 0.8,
        time: this.time,
        isCollision: true,
      })
    }
    this.playSound("collision", 0.4)
  }

  updateDisplays() {
    document.getElementById("velocityValue").textContent = Math.abs(this.velocity).toFixed(1)
    document.getElementById("positionValue").textContent = ((this.position - 60) / this.scale).toFixed(1)
    document.getElementById("timeValue").textContent = this.time.toFixed(1)
  }

  draw() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height)
    gradient.addColorStop(0, "#e3f2fd")
    gradient.addColorStop(1, "#f1f8e9")
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.drawGrid()
    this.ctx.fillStyle = "#8D6E63"
    this.ctx.fillRect(0, this.canvas.height - 25, this.canvas.width, 25)
    this.ctx.fillStyle = "#6D4C41"
    for (let i = 0; i < this.canvas.width; i += 20) {
      this.ctx.fillRect(i, this.canvas.height - 25, 10, 25)
    }
    this.drawTrails()
    this.drawObject()
    if (this.isRunning && Math.abs(this.velocity) > 0.1) {
      this.drawForceArrow()
    }
    this.drawMeasurements()
  }

  drawGrid() {
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.4)"
    this.ctx.lineWidth = 1
    for (let i = 0; i < this.canvas.width; i += 50) {
      this.ctx.beginPath()
      this.ctx.moveTo(i, 0)
      this.ctx.lineTo(i, this.canvas.height - 25)
      this.ctx.stroke()
    }
    for (let i = 0; i < this.canvas.height - 25; i += 50) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, i)
      this.ctx.lineTo(this.canvas.width, i)
      this.ctx.stroke()
    }
  }

  drawTrails() {
    this.trails.forEach((trail) => {
      if (trail.isCollision) {
        this.ctx.fillStyle = `rgba(255, 193, 7, ${trail.alpha})`
        this.ctx.beginPath()
        this.ctx.arc(trail.x, trail.y, 4, 0, Math.PI * 2)
        this.ctx.fill()
      } else {
        this.ctx.fillStyle = `rgba(255, 107, 107, ${trail.alpha * 0.6})`
        this.ctx.beginPath()
        this.ctx.arc(trail.x, trail.y, 3, 0, Math.PI * 2)
        this.ctx.fill()
      }
    })
  }

  drawObject() {
    const centerY = this.canvas.height / 2
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)"
    this.ctx.fillRect(this.position + 6, centerY - this.objectSize / 2 + 6, this.objectSize, this.objectSize)
    const objectGradient = this.ctx.createLinearGradient(
      this.position,
      centerY - this.objectSize / 2,
      this.position + this.objectSize,
      centerY + this.objectSize / 2,
    )
    objectGradient.addColorStop(0, "#FF8A80")
    objectGradient.addColorStop(1, "#FF5252")
    this.ctx.fillStyle = objectGradient
    this.ctx.fillRect(this.position, centerY - this.objectSize / 2, this.objectSize, this.objectSize)
    this.ctx.strokeStyle = "#D32F2F"
    this.ctx.lineWidth = 3
    this.ctx.strokeRect(this.position, centerY - this.objectSize / 2, this.objectSize, this.objectSize)
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.3)"
    this.ctx.fillRect(this.position + 5, centerY - this.objectSize / 2 + 5, this.objectSize - 20, 10)
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    this.ctx.fillRect(this.position - 5, centerY + this.objectSize / 2 + 10, this.objectSize + 10, 25)
    this.ctx.fillStyle = "white"
    this.ctx.font = "bold 16px Arial"
    this.ctx.textAlign = "center"
    this.ctx.fillText(
      `${this.mass.toFixed(1)} kg`,
      this.position + this.objectSize / 2,
      centerY + this.objectSize / 2 + 28,
    )
    this.ctx.textAlign = "left"
  }

  drawForceArrow() {
    const centerY = this.canvas.height / 2
    const arrowLength = Math.min(Math.abs(this.force) * 4, 120)
    const direction = this.velocity > 0 ? 1 : -1
    const arrowX = this.position + this.objectSize + 15
    const arrowEndX = arrowX + arrowLength * direction
    this.ctx.strokeStyle = "#4CAF50"
    this.ctx.lineWidth = 4
    this.ctx.beginPath()
    this.ctx.moveTo(arrowX, centerY)
    this.ctx.lineTo(arrowEndX, centerY)
    this.ctx.stroke()
    this.ctx.fillStyle = "#4CAF50"
    this.ctx.beginPath()
    this.ctx.moveTo(arrowEndX, centerY)
    this.ctx.lineTo(arrowEndX - 15 * direction, centerY - 8)
    this.ctx.lineTo(arrowEndX - 15 * direction, centerY + 8)
    this.ctx.fill()
    const labelX = arrowX + (arrowLength * direction) / 2
    this.ctx.fillStyle = "rgba(76, 175, 80, 0.9)"
    this.ctx.fillRect(labelX - 25, centerY - 25, 50, 20)
    this.ctx.fillStyle = "white"
    this.ctx.font = "bold 14px Arial"
    this.ctx.textAlign = "center"
    this.ctx.fillText(`${this.force}N`, labelX, centerY - 10)
    this.ctx.textAlign = "left"
  }

  drawMeasurements() {
    this.ctx.strokeStyle = "#666"
    this.ctx.lineWidth = 1
    this.ctx.setLineDash([5, 5])
    this.ctx.beginPath()
    this.ctx.moveTo(60, this.canvas.height - 50)
    this.ctx.lineTo(60, this.canvas.height - 25)
    this.ctx.stroke()
    this.ctx.beginPath()
    this.ctx.moveTo(this.position + this.objectSize / 2, this.canvas.height - 50)
    this.ctx.lineTo(this.position + this.objectSize / 2, this.canvas.height - 25)
    this.ctx.stroke()
    this.ctx.setLineDash([])
    if (Math.abs(this.position - 60) > 10) {
      const distance = Math.abs((this.position - 60) / this.scale)
      this.ctx.fillStyle = "#333"
      this.ctx.font = "12px Arial"
      this.ctx.textAlign = "center"
      this.ctx.fillText(
        `${distance.toFixed(1)}m`,
        (60 + this.position + this.objectSize / 2) / 2,
        this.canvas.height - 55,
      )
      this.ctx.textAlign = "left"
    }
  }

  startDataAnimation() {
    const dataValues = document.querySelectorAll(".data-value")
    dataValues.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add("fade-in")
      }, index * 100)
    })
  }

  updateSimulationCount() {
    let count = Number.parseInt(localStorage.getItem("simulationCount") || "0", 10)
    count++
    localStorage.setItem("simulationCount", count.toString())
    document.getElementById("simulationCount").textContent = count
  }

  updateTotalTime() {
    localStorage.setItem("totalTime", this.totalSimulationTime.toFixed(1))
    document.getElementById("totalTime").textContent = this.totalSimulationTime.toFixed(1)
  }

  loadStats() {
    const count = localStorage.getItem("simulationCount") || "0"
    const time = localStorage.getItem("totalTime") || "0"
    document.getElementById("simulationCount").textContent = count
    document.getElementById("totalTime").textContent = time
    this.totalSimulationTime = Number.parseFloat(time)
  }
}

window.addEventListener("load", () => {
  new NewtonLawSimulation()
  document.body.style.opacity = "0"
  document.body.style.transition = "opacity 0.5s ease"
  setTimeout(() => {
    document.body.style.opacity = "1"
  }, 100)
})

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case " ":
      e.preventDefault()
      document.getElementById("startBtn").click()
      break
    case "r":
    case "R":
      document.getElementById("resetBtn").click()
      break
  }
})

document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll('a[href^="#"]')
  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      const target = document.querySelector(link.getAttribute("href"))
      if (target) {
        target.scrollIntoView({ behavior: "smooth" })
      }
    })
  })
})

function goBackToDashboard() {
  document.body.style.transition = "opacity 0.3s ease"
  document.body.style.opacity = "0"
  setTimeout(() => {
    window.location.href = "homepage.html"
  }, 300)
}

function initializeUserInfo() {
  const userData = localStorage.getItem('currentUser');
  if (userData) {
    const user = JSON.parse(userData);
    document.getElementById('userName').textContent = user.name || 'Aulia';
    document.getElementById('userAvatar').textContent = user.avatar || 'A';
  }
}

function logout() {
  if (confirm('Apakah Anda yakin ingin keluar dari akun?')) {
    localStorage.removeItem('currentUser');
    window.location.href = '../index.html';
  }
}

function goBackToDashboard() {
  window.location.href = 'homepage.html';
}

document.addEventListener('DOMContentLoaded', initializeUserInfo);
