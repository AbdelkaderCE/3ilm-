// Firebase configuration - using environment variables for security
const firebaseConfig = {
    apiKey: window.VITE_FIREBASE_API_KEY || "demo-key",
    authDomain: `${window.VITE_FIREBASE_PROJECT_ID || "demo-project"}.firebaseapp.com`,
    projectId: window.VITE_FIREBASE_PROJECT_ID || "demo-project", 
    storageBucket: `${window.VITE_FIREBASE_PROJECT_ID || "demo-project"}.firebasestorage.app`,
    messagingSenderId: "123456789",
    appId: window.VITE_FIREBASE_APP_ID || "demo-app-id"
};

// Validate configuration
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
    console.error('Missing Firebase configuration keys:', missingKeys);
    console.error('Please check your environment variables or update firebase-config.js');
    
    // Show user-friendly error
    if (typeof window !== 'undefined') {
        document.addEventListener('DOMContentLoaded', () => {
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10000;
                max-width: 90%;
                text-align: center;
            `;
            errorMsg.innerHTML = `
                <strong>خطأ في التكوين:</strong><br>
                تطبيق Firebase غير مكون بشكل صحيح. يرجى التواصل مع المطور.
            `;
            document.body.appendChild(errorMsg);
        });
    }
}

// Log configuration status (without sensitive data)
console.log('Firebase Configuration Status:', {
    apiKey: firebaseConfig.apiKey ? '✓ Set' : '✗ Missing',
    authDomain: firebaseConfig.authDomain ? '✓ Set' : '✗ Missing',
    projectId: firebaseConfig.projectId ? '✓ Set' : '✗ Missing',
    storageBucket: firebaseConfig.storageBucket ? '✓ Set' : '✗ Missing',
    messagingSenderId: firebaseConfig.messagingSenderId ? '✓ Set' : '✗ Missing',
    appId: firebaseConfig.appId ? '✓ Set' : '✗ Missing',
    measurementId: firebaseConfig.measurementId ? '✓ Set' : '✗ Missing'
});

export { firebaseConfig };

