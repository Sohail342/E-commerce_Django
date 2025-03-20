function checkPasswordStrength(password) {
    let strength = 0;
    const indicators = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        numbers: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };

    strength += indicators.length ? 1 : 0;
    strength += indicators.uppercase ? 1 : 0;
    strength += indicators.lowercase ? 1 : 0;
    strength += indicators.numbers ? 1 : 0;
    strength += indicators.special ? 1 : 0;

    const strengthBar = document.getElementById('password-strength');
    const strengthText = document.getElementById('strength-text');

    if (password === '') {
        strengthBar.style.width = '0%';
        strengthBar.className = 'password-strength-bar';
        strengthText.textContent = '';
        return;
    }

    const percentage = (strength / 5) * 100;
    strengthBar.style.width = percentage + '%';

    if (strength <= 2) {
        strengthBar.className = 'password-strength-bar weak';
        strengthText.textContent = 'Weak';
    } else if (strength <= 3) {
        strengthBar.className = 'password-strength-bar medium';
        strengthText.textContent = 'Medium';
    } else {
        strengthBar.className = 'password-strength-bar strong';
        strengthText.textContent = 'Strong';
    }

    // Update requirements list
    document.getElementById('req-length').className = indicators.length ? 'met' : '';
    document.getElementById('req-uppercase').className = indicators.uppercase ? 'met' : '';
    document.getElementById('req-lowercase').className = indicators.lowercase ? 'met' : '';
    document.getElementById('req-numbers').className = indicators.numbers ? 'met' : '';
    document.getElementById('req-special').className = indicators.special ? 'met' : '';
}