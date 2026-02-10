const API_URL = window.location.origin;

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const button = document.querySelector('.login-button');
    const buttonText = document.getElementById('button-text');
    const errorMessage = document.getElementById('error-message');
    
    errorMessage.style.display = 'none';
    button.disabled = true;
    buttonText.textContent = 'Logging in...';
    
    try {
        const response = await fetch(`${API_URL}/api/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('adminToken', data.token);
            showToast('Login successful!', 'success');
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1000);
        } else {
            errorMessage.textContent = data.error || 'Login failed';
            errorMessage.style.display = 'block';
            showToast(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = 'Network error. Please try again.';
        errorMessage.style.display = 'block';
        showToast('Network error', 'error');
    } finally {
        button.disabled = false;
        buttonText.textContent = 'Login';
    }
});