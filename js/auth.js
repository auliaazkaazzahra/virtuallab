let currentUser = null;

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

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (email && password) {
        currentUser = {
            name: email.split('@')[0],
            email: email,
            avatar: email.charAt(0).toUpperCase() + email.split('@')[0].charAt(1).toUpperCase()
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        window.location.href = 'homepage.html';
        setTimeout(() => {
            alert('Login berhasil! Selamat datang di PhysicsLab Virtual.');
        }, 300);
    }
}

function handleSignup(event) {
    event.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirm').value;

    if (password !== confirm) {
        alert('Password tidak cocok!');
        return;
    }

    if (name && email && password) {
        currentUser = {
            name: name,
            email: email,
            avatar: name.charAt(0).toUpperCase() + (name.split(' ')[1] ? name.split(' ')[1].charAt(0).toUpperCase() : name.charAt(1).toUpperCase())
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        window.location.href = 'homepage.html';

        setTimeout(() => {
            alert('Akun berhasil dibuat! Selamat bergabung di PhysicsLab Virtual.');
        }, 300);
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

window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    if (mode === 'signup') {
        showSignup();
    } else {
        showLogin();
    }
});
