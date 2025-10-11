// auth.js - Fixed version

function showLogin() {
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}

function showSignup() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
}

function closeAuth() {
    window.location.href = '../index.html';
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    // Disable button dan ubah text
    submitBtn.disabled = true;
    submitBtn.textContent = 'Loading...';

    try {
        // Gunakan API_CONFIG.BASE_URL
        const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Login gagal');
        }

        // Simpan token dan user data
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));

        alert('Login berhasil! Selamat datang di PhysicsLab Virtual.');
        window.location.href = 'homepage.html';

    } catch (error) {
        console.error('Login error:', error);
        alert(error.message || 'Terjadi kesalahan saat login');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
}

async function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirm').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');

    // Validasi password match
    if (password !== confirm) {
        alert('Password tidak cocok!');
        return;
    }

    // Disable button dan ubah text
    submitBtn.disabled = true;
    submitBtn.textContent = 'Loading...';

    try {
        // Gunakan API_CONFIG.BASE_URL
        const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Pendaftaran gagal');
        }

        alert('Akun berhasil dibuat! Silakan login.');
        showLogin();
        
        // Reset form
        event.target.reset();

    } catch (error) {
        console.error('Signup error:', error);
        alert(error.message || 'Terjadi kesalahan saat mendaftar');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign up';
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const img = button.querySelector('img');
    
    if (input.type === 'password') {
        input.type = 'text';
        img.src = '../assets/visible.png';
        img.alt = 'Hide Password';
    } else {
        input.type = 'password';
        img.src = '../assets/nonvisible.png';
        img.alt = 'Show Password';
    }
}

// Fungsi untuk logout
async function logout() {
    const token = localStorage.getItem('access_token');
    
    if (token) {
        try {
            await fetch(`${API_CONFIG.BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
    
    // Hapus data dari localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('currentUser');
    
    // Redirect ke halaman utama
    window.location.href = '../index.html';
}

// Fungsi untuk cek apakah user sudah login
function isLoggedIn() {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('currentUser');
    return token && user;
}

// Fungsi untuk get user profile dari API
async function getUserProfile() {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        throw new Error('Tidak ada token');
    }
    
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Token tidak valid');
        }
        
        const data = await response.json();
        
        // Update localStorage dengan data terbaru
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        return data.user;
    } catch (error) {
        // Jika token tidak valid, logout
        localStorage.removeItem('access_token');
        localStorage.removeItem('currentUser');
        throw error;
    }
}

// Event listener saat halaman dimuat
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    if (mode === 'signup') {
        showSignup();
    } else {
        showLogin();
    }
});