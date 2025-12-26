// Password Reset Modal - Shared Component
// Usage: Include this file and call openPasswordResetModal(email) to open the modal

let currentResetEmail = '';
let currentResetCode = '';
let currentStep = 1;

const RESET_ENDPOINTS = {
    request: 'https://password-reset-request-b52ovbio5q-uc.a.run.app',
    verify: 'https://password-reset-verify-b52ovbio5q-uc.a.run.app',
    confirm: 'https://password-reset-confirm-b52ovbio5q-uc.a.run.app'
};

function openPasswordResetModal(email = '') {
    const modal = document.getElementById('password-reset-modal');
    if (!modal) {
        console.error('Password reset modal not found');
        return;
    }
    
    currentResetEmail = email;
    currentResetCode = '';
    currentStep = 1;
    
    // Reset all steps
    document.getElementById('reset-step-1').style.display = 'block';
    document.getElementById('reset-step-2').style.display = 'none';
    document.getElementById('reset-step-3').style.display = 'none';
    document.getElementById('reset-success').style.display = 'none';
    
    // Clear errors
    hideError(1);
    hideError(2);
    hideError(3);
    
    // Set email if provided
    const emailInput = document.getElementById('reset-email');
    if (emailInput) {
        emailInput.value = email;
        if (email) {
            emailInput.readOnly = true;
        } else {
            emailInput.readOnly = false;
        }
    }
    
    // Clear forms
    document.getElementById('reset-request-form')?.reset();
    document.getElementById('reset-verify-form')?.reset();
    document.getElementById('reset-confirm-form')?.reset();
    
    modal.style.display = 'flex';
    lucide.createIcons();
}

function closePasswordResetModal() {
    const modal = document.getElementById('password-reset-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showStep(step) {
    document.getElementById('reset-step-1').style.display = step === 1 ? 'block' : 'none';
    document.getElementById('reset-step-2').style.display = step === 2 ? 'block' : 'none';
    document.getElementById('reset-step-3').style.display = step === 3 ? 'block' : 'none';
    document.getElementById('reset-success').style.display = step === 4 ? 'block' : 'none';
    currentStep = step;
    lucide.createIcons();
}

function showError(step, message) {
    const errorEl = document.getElementById(`reset-error-${step}`);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

function hideError(step) {
    const errorEl = document.getElementById(`reset-error-${step}`);
    if (errorEl) {
        errorEl.style.display = 'none';
    }
}

function setLoading(buttonId, loading) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = loading;
        if (loading) {
            button.dataset.originalText = button.textContent;
            button.textContent = 'Loading...';
        } else {
            button.textContent = button.dataset.originalText || button.textContent;
        }
    }
}

// Step 1: Request Code
document.addEventListener('DOMContentLoaded', () => {
    const requestForm = document.getElementById('reset-request-form');
    if (requestForm) {
        requestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError(1);
            
            const emailInput = document.getElementById('reset-email');
            const email = emailInput.value.trim();
            
            if (!email || !isValidEmail(email)) {
                showError(1, 'Please enter a valid email address.');
                return;
            }
            
            currentResetEmail = email;
            setLoading('reset-request-button', true);
            
            try {
                const response = await fetch(RESET_ENDPOINTS.request, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });
                
                const result = await response.json();
                
                if (result.ok) {
                    // Move to step 2
                    showStep(2);
                    emailInput.readOnly = true;
                } else {
                    showError(1, result.message || 'Failed to send code. Please try again.');
                }
            } catch (error) {
                console.error('Error requesting reset code:', error);
                showError(1, 'Network error. Please check your connection and try again.');
            } finally {
                setLoading('reset-request-button', false);
            }
        });
    }
    
    // Step 2: Verify Code
    const verifyForm = document.getElementById('reset-verify-form');
    if (verifyForm) {
        verifyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError(2);
            
            const codeInput = document.getElementById('reset-code');
            const code = codeInput.value.trim();
            
            if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
                showError(2, 'Please enter a valid 6-digit code.');
                return;
            }
            
            currentResetCode = code;
            setLoading('reset-verify-button', true);
            
            try {
                const response = await fetch(RESET_ENDPOINTS.verify, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: currentResetEmail,
                        code: code
                    })
                });
                
                const result = await response.json();
                
                if (result.ok) {
                    // Move to step 3
                    showStep(3);
                } else {
                    showError(2, result.message || 'Invalid or expired code. Please try again.');
                }
            } catch (error) {
                console.error('Error verifying code:', error);
                showError(2, 'Network error. Please check your connection and try again.');
            } finally {
                setLoading('reset-verify-button', false);
            }
        });
    }
    
    // Resend Code Button
    const resendButton = document.getElementById('reset-resend-button');
    if (resendButton) {
        resendButton.addEventListener('click', async () => {
            hideError(2);
            setLoading('reset-resend-button', true);
            
            try {
                const response = await fetch(RESET_ENDPOINTS.request, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: currentResetEmail })
                });
                
                const result = await response.json();
                
                if (result.ok) {
                    // Show success message (you could add a toast notification here)
                    alert('A new code has been sent to your email.');
                } else {
                    showError(2, result.message || 'Failed to resend code. Please try again.');
                }
            } catch (error) {
                console.error('Error resending code:', error);
                showError(2, 'Network error. Please check your connection and try again.');
            } finally {
                setLoading('reset-resend-button', false);
            }
        });
    }
    
    // Step 3: Confirm Password Reset
    const confirmForm = document.getElementById('reset-confirm-form');
    if (confirmForm) {
        confirmForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError(3);
            
            const newPasswordInput = document.getElementById('reset-new-password');
            const confirmPasswordInput = document.getElementById('reset-confirm-password');
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            if (newPassword.length < 6) {
                showError(3, 'Password must be at least 6 characters long.');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showError(3, 'Passwords do not match.');
                return;
            }
            
            setLoading('reset-confirm-button', true);
            
            try {
                const response = await fetch(RESET_ENDPOINTS.confirm, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: currentResetEmail,
                        code: currentResetCode,
                        newPassword: newPassword,
                        confirmPassword: confirmPassword
                    })
                });
                
                const result = await response.json();
                
                if (result.ok) {
                    // Show success
                    showStep(4);
                } else {
                    showError(3, result.message || 'Failed to reset password. Please try again.');
                }
            } catch (error) {
                console.error('Error confirming password reset:', error);
                showError(3, 'Network error. Please check your connection and try again.');
            } finally {
                setLoading('reset-confirm-button', false);
            }
        });
    }
    
    // Close button
    const closeButton = document.getElementById('password-reset-close');
    if (closeButton) {
        closeButton.addEventListener('click', closePasswordResetModal);
    }
    
    // Close on overlay click
    const overlay = document.querySelector('.password-reset-modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', closePasswordResetModal);
    }
    
    // Close success button
    const closeSuccessButton = document.getElementById('reset-close-success');
    if (closeSuccessButton) {
        closeSuccessButton.addEventListener('click', () => {
            closePasswordResetModal();
            // If on login page, redirect to login
            if (window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
        });
    }
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('password-reset-modal');
            if (modal && modal.style.display !== 'none') {
                closePasswordResetModal();
            }
        }
    });
});

function isValidEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

