// Configuration untuk API Backend
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_CONFIG = {
    BASE_URL: isLocal
        ? 'http://127.0.0.1:8000' // saat develop
        : 'https://virtuallab-production.up.railway.app', // saat di Vercel
    ENDPOINTS: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        PROFILE: '/auth/profile'
    }
};


// Helper function untuk get headers dengan token
function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// Helper function untuk API calls dengan error handling lengkap
async function apiCall(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    const config = {
        method: options.method || 'GET',
        headers: {
            ...getAuthHeaders(),
            ...options.headers
        }
    };
    
    if (options.body) {
        config.body = JSON.stringify(options.body);
    }
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || data.message || 'Request gagal');
        }
        
        return data;
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.');
        }
        throw error;
    }
}