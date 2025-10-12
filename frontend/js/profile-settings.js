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

function initializeUserInfo() {
    const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
    if (userData) {
        const user = JSON.parse(userData);
        document.getElementById('userName').textContent = user.name || 'Aulia User';

        const avatarElement = document.getElementById('userAvatar');
        if (user.photo) {
            avatarElement.innerHTML = `<img src="${user.photo}" alt="Profile Photo" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            avatarElement.textContent = user.initials || 'AU';
        }

        const profilePhotoImg = document.getElementById('profilePhotoImg');
        const profilePhotoInitials = document.getElementById('profilePhotoInitials');
        if (user.photo) {
            profilePhotoImg.src = user.photo;
            profilePhotoImg.style.display = 'block';
            profilePhotoInitials.style.display = 'none';
        } else {
            profilePhotoImg.style.display = 'none';
            profilePhotoInitials.textContent = user.initials || 'AU';
            profilePhotoInitials.style.display = 'flex';
        }

        document.getElementById('full-name').value = user.name || '';
        document.getElementById('email').value = user.email || '';
    } else {
        window.location.href = '../index.html';
    }
}

async function handleProfileUpdate(event) {
    event.preventDefault();

    const name = document.getElementById('full-name').value;
    const email = document.getElementById('email').value;
    const photoFile = document.getElementById('photoInput').files[0];
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword && newPassword !== confirmPassword) {
        alert('Password tidak cocok!');
        return;
    }

    let photoBase64 = null;
    if (photoFile) {
        photoBase64 = await fileToBase64(photoFile);
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
        alert('Token tidak ditemukan, silakan login ulang.');
        window.location.href = '../index.html';
        return;
    }

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: name,
                email: email,
                photo: photoBase64
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Update gagal');
        }

        localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(data.user));

        alert('Profile berhasil diupdate!');
        initializeUserInfo();

    } catch (error) {
        console.error('Update error:', error);
        alert(error.message || 'Terjadi kesalahan saat update');
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initializeUserInfo();
    const form = document.querySelector('form');
    form.addEventListener('submit', handleProfileUpdate);
    document.querySelector('.cancel-btn').addEventListener('click', () => {
        window.location.href = 'homepage.html';
    });

    document.getElementById('photoInput').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const profilePhotoImg = document.getElementById('profilePhotoImg');
                const profilePhotoInitials = document.getElementById('profilePhotoInitials');
                profilePhotoImg.src = e.target.result;
                profilePhotoImg.style.display = 'block';
                profilePhotoInitials.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });
});