const CONFIG = {
    STORAGE_KEYS: {
        USER: 'currentUser'
    },
    ANIMATION: {
        DURATION: 300,
        FADE_OUT: 'opacity 0.3s ease'
    }
};

function goBackToDashboard() {
    window.location.href = 'homepage.html';
}

function goToSimulation() {
    window.location.href = 'simulation-hukum-newton.html?lab=newton-laws';
}

function logout() {
    if (!confirm('Apakah Anda yakin ingin keluar dari akun?')) {
        return;
    }
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
    document.body.style.transition = CONFIG.ANIMATION.FADE_OUT;
    document.body.style.opacity = '0';
    setTimeout(() => {
        window.location.href = '../index.html';
    }, CONFIG.ANIMATION.DURATION);
}

function showAbout() {
    alert('PhysicsLab Virtual adalah platform pembelajaran fisika interaktif yang dikembangkan untuk siswa dan guru.');
}

function showHelp() {
    alert('Untuk bantuan, hubungi support@physiclab.com.');
}

function initializeUserInfo() {
    const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
    if (userData) {
        const user = JSON.parse(userData);
        document.getElementById('userName').textContent = user.name || 'John Doe';
        document.getElementById('userAvatar').textContent = user.avatar || 'JD';
    } else {
        window.location.href = '../index.html';
    }
}

function toggleSection(contentId) {
    const content = document.getElementById(contentId);
    const toggle = content.previousElementSibling;
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        toggle.classList.remove('collapsed');
    } else {
        content.classList.add('collapsed');
        toggle.classList.add('collapsed');
    }
}

function showAnswer(button) {
    const answer = button.previousElementSibling.querySelector('.answer-hidden');
    if (answer.style.display === 'block') {
        answer.style.display = 'none';
        button.textContent = 'Tampilkan Jawaban';
    } else {
        answer.style.display = 'block';
        button.textContent = 'Sembunyikan Jawaban';
    }
}

function calculateAcceleration() {
    const mass = parseFloat(document.getElementById('calc-mass').value);
    const force = parseFloat(document.getElementById('calc-force').value);
    const resultDiv = document.getElementById('calc-result');

    if (isNaN(mass) || isNaN(force) || mass <= 0) {
        resultDiv.textContent = 'Masukkan nilai yang valid!';
        resultDiv.style.color = '#dc3545';
        return;
    }

    const acceleration = force / mass;
    resultDiv.textContent = `Percepatan: ${acceleration.toFixed(2)} m/s²`;
    resultDiv.style.color = '#28a745';
}

document.addEventListener('DOMContentLoaded', function() {
    initializeUserInfo();
});