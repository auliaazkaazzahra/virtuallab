// Configuration & Constants
const CONFIG = {
    AVAILABLE_LABS: ['newton-laws'],
    STORAGE_KEYS: {
        USER: 'currentUser'
    },
    ANIMATION: {
        DURATION: 300,
        FADE_OUT: 'opacity 0.3s ease'
    }
};

// Data for all content types
const CONTENT_DATA = {
    simulasi: [
        {
            id: 'newton-laws',
            title: 'Hukum II Newton',
            description: 'Pelajari hukum II Newton dengan simulasi interaktif. Eksperimen dengan massa, gaya, dan percepatan.',
            icon: '🚀',
            difficulty: 'Pemula',
            completed: true,
            available: true
        },
        {
            id: 'projectile-motion',
            title: 'Gerak Proyektil',
            description: 'Simulasi gerak peluru dengan berbagai sudut dan kecepatan awal. Analisis lintasan dan jangkauan.',
            icon: '🎯',
            difficulty: 'Menengah',
            completed: false,
            available: false
        },
        {
            id: 'waves-oscillation',
            title: 'Gelombang & Osilasi',
            description: 'Eksplorasi gelombang mekanik, frekuensi, amplitudo, dan fenomena interferensi.',
            icon: '🌊',
            difficulty: 'Menengah',
            completed: false,
            available: false
        }
    ],
    quiz: [
        {
            id: 'newton-laws-quiz',
            title: 'Quiz Hukum II Newton',
            description: 'Uji pemahamanmu tentang Hukum II Newton dengan 10 soal pilihan ganda.',
            icon: '🚀',
            questions: 10,
            available: true
        },
        {
            id: 'projectile-motion-quiz',
            title: 'Quiz Gerak Proyektil',
            description: 'Tes pengetahuanmu tentang gerak peluru dengan 10 soal interaktif.',
            icon: '🎯',
            questions: 10,
            available: false
        },
        {
            id: 'waves-oscillation-quiz',
            title: 'Quiz Gelombang & Osilasi',
            description: 'Evaluasi pemahaman gelombang dan osilasi dengan 10 soal menarik.',
            icon: '🌊',
            questions: 10,
            available: false
        }
    ]
};

// Tab switching functionality
function switchTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Add active class to selected tab and content
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-content`).classList.add('active');

    // Populate content for the active tab
    populateContent(tabName);
}

// Populate content based on tab
function populateContent(tabName) {
    const grid = document.getElementById(`${tabName}Grid`);
    const data = CONTENT_DATA[tabName] || [];

    grid.innerHTML = '';

    data.forEach(item => {
        const card = createContentCard(item, tabName);
        grid.appendChild(card);
    });
}

// Create content card
function createContentCard(item, type) {
    const card = document.createElement('div');
    card.className = 'content-card fade-in';

    const buttonText = getButtonText(item, type);
    let onclick = '';
    if (item.available) {
        if (type === 'simulasi') {
            onclick = `showSimulation('${item.id}')`;
        } else if (type === 'quiz') {
            // For quiz, navigate to quiz.html directly
            onclick = `window.location.href='quiz.html'`;
        } else {
            onclick = `showContent('${item.id}', '${type}')`;
        }
    } else {
        onclick = `showComingSoon('${item.id}', '${type}')`;
    }

    card.innerHTML = `
        <div class="card-image">
            <div class="icon">${item.icon}</div>
        </div>
        <div class="card-content">
            <div class="card-title">${item.title}</div>
            <div class="card-description">${item.description}</div>
            <div class="card-meta">
                <span>📊 ${item.difficulty}</span>
            </div>
            <button class="btn btn-primary" onclick="${onclick}" style="width: 100%;">
                ${buttonText}
            </button>
        </div>
    `;
    return card;
}

// Get appropriate button text
function getButtonText(item, type) {
    if (!item.available) {
        return '🔮 Segera Hadir';
    }

    switch(type) {
        case 'simulasi':
            return item.completed ? '🔄 Ulangi Lab' : '🚀 Mulai Lab';
        default:
            return '🚀 Mulai';
    }
}

// Show simulation (existing functionality)
function showSimulation(labId) {
    if (CONFIG.AVAILABLE_LABS.includes(labId)) {
        window.location.href = `simulation.html?lab=${labId}`;
    } else {
        showComingSoon(labId, 'simulasi');
    }
}

// Show content for other types
function showContent(contentId, type) {
    // For now, show coming soon modal for all content types
    showComingSoon(contentId, type);
}

// Show coming soon modal
function showComingSoon(contentId, type) {
    const data = CONTENT_DATA[type]?.find(item => item.id === contentId);
    if (!data) return;

    const modal = document.createElement('div');
    modal.className = 'coming-soon-modal';
    modal.innerHTML = `
        <div style="
            background: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            transform: translateY(20px);
            transition: transform 0.3s ease;
        ">
            <div style="font-size: 4rem; margin-bottom: 20px;">${data.icon}</div>
            <h3 style="color: #8441A4; margin-bottom: 15px; font-size: 1.5rem;">Akan Segera Tersedia!</h3>
            <p style="margin-bottom: 10px; font-weight: bold; font-size: 1.1rem;">${data.title}</p>
            <p style="margin-bottom: 20px; color: #666; line-height: 1.6;">
                Fitur ini sedang dalam pengembangan dan akan segera hadir dengan konten interaktif yang menarik.
            </p>
            <button class="btn btn-primary" onclick="closeComingSoon()" style="width: 100%;">Mengerti</button>
        </div>
    `;

    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 3000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    `;

    document.body.appendChild(modal);
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        modal.querySelector('div').style.transform = 'translateY(0)';
    }, 100);

    window.currentModal = modal;
}

// Close coming soon modal
function closeComingSoon() {
    if (window.currentModal) {
        window.currentModal.style.opacity = '0';
        window.currentModal.style.visibility = 'hidden';
        setTimeout(() => {
            if (window.currentModal && window.currentModal.parentNode) {
                window.currentModal.parentNode.removeChild(window.currentModal);
            }
            window.currentModal = null;
        }, 300);
    }
}

// Logout functionality
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

// Initialize user info
function initializeUserInfo() {
    const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
    if (userData) {
        const user = JSON.parse(userData);
        document.getElementById('userName').textContent = user.name || 'John Doe';
        document.getElementById('userAvatar').textContent = user.avatar || 'JD';
    } else {
        // Redirect to login if not authenticated
        window.location.href = '../index.html';
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('coming-soon-modal')) {
        closeComingSoon();
    }
});

// Keyboard navigation for modals
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && window.currentModal) {
        closeComingSoon();
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeUserInfo();
    populateContent('simulasi');
});
