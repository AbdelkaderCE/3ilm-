// Authentication module
import { auth } from './main.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js';
import { createUserDocument } from './firestore.js';
import { showNotification, showLoading, hideLoading, validateEmail, validatePassword } from './utils.js';

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

// DOM elements
const authErrorMessage = document.getElementById('auth-error-message');
const authLoading = document.getElementById('auth-loading');

// Error handling
function displayError(message) {
    if (authErrorMessage) {
        authErrorMessage.textContent = message;
        authErrorMessage.style.display = 'block';
    }
    console.error('Auth Error:', message);
}

function clearError() {
    if (authErrorMessage) {
        authErrorMessage.textContent = '';
        authErrorMessage.style.display = 'none';
    }
}

// Registration functionality
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const googleLoginBtn = document.getElementById('google-login-btn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleGoogleAuth);
    }
    
    const googleRegisterBtn = document.getElementById('google-register-btn');
    if (googleRegisterBtn) {
        googleRegisterBtn.addEventListener('click', handleGoogleAuth);
    }
    
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', handleForgotPassword);
    }
});

// Handle user registration
async function handleRegistration(event) {
    event.preventDefault();
    clearError();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const name = form['register-name'].value.trim();
    const email = form['register-email'].value.trim();
    const password = form['register-password'].value;
    const confirmPassword = form['register-confirm-password'].value;
    const level = form['register-level']?.value || 'high';
    const termsAgreed = form['terms-agree'].checked;
    
    // Validation
    if (!name) {
        displayError('يرجى إدخال الاسم الكامل');
        return;
    }
    
    if (!validateEmail(email)) {
        displayError('يرجى إدخال بريد إلكتروني صحيح');
        return;
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        displayError(passwordValidation.message);
        return;
    }
    
    if (password !== confirmPassword) {
        displayError('كلمات المرور غير متطابقة');
        return;
    }
    
    if (!termsAgreed) {
        displayError('يجب الموافقة على شروط الخدمة وسياسة الخصوصية');
        return;
    }
    
    try {
        showLoading();
        
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update user profile
        await updateProfile(user, {
            displayName: name
        });
        
        // Create user document in Firestore
        await createUserDocument(user.uid, {
            displayName: name,
            email: email,
            level: level,
            role: 'student',
            createdAt: new Date(),
            lastLoginAt: new Date(),
            profileComplete: true
        });
        
        showNotification('تم إنشاء الحساب بنجاح! مرحباً بك في 3ilm+', 'success');
        
        // Redirect will be handled by auth state observer
        
    } catch (error) {
        console.error('Registration error:', error);
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                displayError('هذا البريد الإلكتروني مستخدم بالفعل');
                break;
            case 'auth/invalid-email':
                displayError('البريد الإلكتروني غير صحيح');
                break;
            case 'auth/operation-not-allowed':
                displayError('تسجيل الحسابات الجديدة غير مفعل. تواصل مع الدعم الفني');
                break;
            case 'auth/weak-password':
                displayError('كلمة المرور ضعيفة. يجب أن تتكون من 6 أحرف على الأقل');
                break;
            case 'auth/network-request-failed':
                displayError('مشكلة في الاتصال بالإنترنت. تحقق من اتصالك وحاول مرة أخرى');
                break;
            default:
                displayError('حدث خطأ أثناء إنشاء الحساب. حاول مرة أخرى');
        }
    } finally {
        hideLoading();
    }
}

// Handle user login
async function handleLogin(event) {
    event.preventDefault();
    clearError();
    
    const form = event.target;
    const email = form['login-email'].value.trim();
    const password = form['login-password'].value;
    
    // Validation
    if (!validateEmail(email)) {
        displayError('يرجى إدخال بريد إلكتروني صحيح');
        return;
    }
    
    if (!password) {
        displayError('يرجى إدخال كلمة المرور');
        return;
    }
    
    try {
        showLoading();
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update last login time
        try {
            const { updateUserData } = await import('./firestore.js');
            await updateUserData(user.uid, {
                lastLoginAt: new Date()
            });
        } catch (error) {
            console.error('Error updating last login:', error);
        }
        
        showNotification('تم تسجيل الدخول بنجاح!', 'success');
        
        // Redirect will be handled by auth state observer
        
    } catch (error) {
        console.error('Login error:', error);
        
        switch (error.code) {
            case 'auth/invalid-email':
                displayError('البريد الإلكتروني غير صحيح');
                break;
            case 'auth/user-disabled':
                displayError('تم إيقاف هذا الحساب. تواصل مع الدعم الفني');
                break;
            case 'auth/user-not-found':
                displayError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
                break;
            case 'auth/wrong-password':
                displayError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
                break;
            case 'auth/too-many-requests':
                displayError('تم تجاوز حد المحاولات. حاول مرة أخرى لاحقاً');
                break;
            case 'auth/network-request-failed':
                displayError('مشكلة في الاتصال بالإنترنت. تحقق من اتصالك وحاول مرة أخرى');
                break;
            default:
                displayError('حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى');
        }
    } finally {
        hideLoading();
    }
}

// Handle Google authentication
async function handleGoogleAuth() {
    clearError();
    
    try {
        showLoading();
        
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const isNewUser = result._tokenResponse?.isNewUser || false;
        
        // For new users, create user document
        if (isNewUser) {
            await createUserDocument(user.uid, {
                displayName: user.displayName || user.email.split('@')[0],
                email: user.email,
                photoURL: user.photoURL,
                level: 'high', // Default level
                role: 'student',
                createdAt: new Date(),
                lastLoginAt: new Date(),
                profileComplete: true,
                authProvider: 'google'
            });
            
            showNotification('تم إنشاء الحساب بنجاح باستخدام Google!', 'success');
        } else {
            // Update last login for existing users
            try {
                const { updateUserData } = await import('./firestore.js');
                await updateUserData(user.uid, {
                    lastLoginAt: new Date()
                });
            } catch (error) {
                console.error('Error updating last login:', error);
            }
            
            showNotification('تم تسجيل الدخول بنجاح!', 'success');
        }
        
        // Redirect will be handled by auth state observer
        
    } catch (error) {
        console.error('Google auth error:', error);
        
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                displayError('تم إلغاء تسجيل الدخول');
                break;
            case 'auth/popup-blocked':
                displayError('تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة وإعادة المحاولة');
                break;
            case 'auth/cancelled-popup-request':
                // User cancelled, no need to show error
                break;
            case 'auth/network-request-failed':
                displayError('مشكلة في الاتصال بالإنترنت. تحقق من اتصالك وحاول مرة أخرى');
                break;
            default:
                displayError('حدث خطأ أثناء تسجيل الدخول باستخدام Google. حاول مرة أخرى');
        }
    } finally {
        hideLoading();
    }
}

// Handle forgot password
async function handleForgotPassword(event) {
    event.preventDefault();
    
    const email = prompt('أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور:');
    
    if (!email) {
        return;
    }
    
    if (!validateEmail(email)) {
        displayError('يرجى إدخال بريد إلكتروني صحيح');
        return;
    }
    
    try {
        showLoading();
        
        await sendPasswordResetEmail(auth, email);
        showNotification('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني', 'success');
        
    } catch (error) {
        console.error('Password reset error:', error);
        
        switch (error.code) {
            case 'auth/user-not-found':
                displayError('لا يوجد حساب بهذا البريد الإلكتروني');
                break;
            case 'auth/invalid-email':
                displayError('البريد الإلكتروني غير صحيح');
                break;
            case 'auth/network-request-failed':
                displayError('مشكلة في الاتصال بالإنترنت. تحقق من اتصالك وحاول مرة أخرى');
                break;
            default:
                displayError('حدث خطأ أثناء إرسال رابط إعادة التعيين. حاول مرة أخرى');
        }
    } finally {
        hideLoading();
    }
}

// Export functions for use in other modules
export {
    handleRegistration,
    handleLogin,
    handleGoogleAuth,
    handleForgotPassword
};

