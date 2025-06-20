// public/js/main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";

// YOUR ACTUAL FIREBASE CONFIG GOES HERE (Copied from Firebase Console)
const firebaseConfig = {
    apiKey: "AIzaSyC...", // Use your actual key
    authDomain: "ilm-plus-be482.firebaseapp.com", // Use your actual domain
    projectId: "ilm-plus-be482", // Use your actual project ID
    storageBucket: "ilm-plus-be482.appspot.com", // Use your actual bucket
    messagingSenderId: "385083019954", // Use your actual ID
    appId: "1:385083019954:web:dcfa2e53886bd713b0efab", // Use your actual ID
    measurementId: "G-RSMCH8R8BJ" // Include if present
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

console.log("Firebase app initialized successfully:", app);

// Export the initialized app instance so other modules can use it
export { app };

// Optional: Basic redirect logic for authenticated users (will improve later)
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
    const currentPage = window.location.pathname;
    const authPages = ['/login.html', '/register.html'];

    if (user) {
        // User is signed in.
        console.log("User is signed in:", user.email);
        if (authPages.includes(currentPage) || currentPage === '/') {
            // Redirect to home page if on login/register/landing
            window.location.href = 'home.html';
        }
    } else {
        // User is signed out.
        console.log("User is signed out.");
        if (!authPages.includes(currentPage) && currentPage !== '/index.html' && currentPage !== '/') {
            // Redirect to login if not on auth pages or landing
            window.location.href = 'login.html';
        }
    }
});
// public/js/auth.js

// Import the initialized Firebase app from main.js
import { app } from './main.js';

// Import Firebase Authentication functions
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged // Good for checking current auth state if needed here
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

// Initialize Auth service
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- Helper for displaying error messages ---
const authErrorMessage = document.getElementById('auth-error-message');

function displayError(message) {
    if (authErrorMessage) {
        authErrorMessage.textContent = message;
        authErrorMessage.style.display = 'block';
    }
}

function clearError() {
    if (authErrorMessage) {
        authErrorMessage.textContent = '';
        authErrorMessage.style.display = 'none';
    }
}

// --- Registration Logic ---
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission
        clearError(); // Clear previous errors

        const name = registerForm['register-name'].value; // We'll save this later
        const email = registerForm['register-email'].value;
        const password = registerForm['register-password'].value;
        const confirmPassword = registerForm['register-confirm-password'].value;
        const termsAgreed = registerForm['terms-agree'].checked;

        if (password !== confirmPassword) {
            displayError("Passwords do not match.");
            return;
        }

        if (!termsAgreed) {
            displayError("You must agree to the Terms of Service and Privacy Policy.");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log("User registered:", user);
            // Optionally, save user's name to Firestore here:
            // import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
            // const db = getFirestore(app);
            // await setDoc(doc(db, "users", user.uid), {
            //     fullName: name,
            //     email: user.email,
            //     createdAt: new Date()
            // });

            window.location.href = 'home.html'; // Redirect to home page
        } catch (error) {
            console.error("Registration error:", error.code, error.message);
            // Display user-friendly error messages
            switch (error.code) {
                case 'auth/email-already-in-use':
                    displayError('The email address is already in use by another account.');
                    break;
                case 'auth/invalid-email':
                    displayError('The email address is not valid.');
                    break;
                case 'auth/operation-not-allowed':
                    displayError('Email/password accounts are not enabled. Please contact support.');
                    break;
                case 'auth/weak-password':
                    displayError('The password is too weak. It must be at least 6 characters long.');
                    break;
                default:
                    displayError('Registration failed: ' + error.message);
            }
        }
    });
}

// --- Login Logic ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();

        const email = loginForm['login-email'].value;
        const password = loginForm['login-password'].value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log("User logged in:", user);
            window.location.href = 'home.html'; // Redirect to home page
        } catch (error) {
            console.error("Login error:", error.code, error.message);
            switch (error.code) {
                case 'auth/invalid-email':
                case 'auth/user-disabled':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    displayError('Invalid email or password.');
                    break;
                default:
                    displayError('Login failed: ' + error.message);
            }
        }
    });
}

// --- Google Login/Registration Logic ---
const googleLoginBtn = document.getElementById('google-login-btn');
const googleRegisterBtn = document.getElementById('google-register-btn');

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        clearError();
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            console.log("Google user logged in:", user);
            // Additional logic for new Google users (e.g., save display name)
            // if (result.additionalUserInfo.isNewUser) {
            //     import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
            //     const db = getFirestore(app);
            //     await setDoc(doc(db, "users", user.uid), {
            //         fullName: user.displayName,
            //         email: user.email,
            //         createdAt: new Date()
            //     }, { merge: true }); // Use merge to avoid overwriting existing data if any
            // }
            window.location.href = 'home.html';
        } catch (error) {
            console.error("Google sign-in error:", error.code, error.message);
            // Handle specific Google auth errors like 'auth/popup-closed-by-user'
            if (error.code === 'auth/popup-closed-by-user') {
                displayError('Google sign-in was cancelled.');
            } else {
                displayError('Google sign-in failed: ' + error.message);
            }
        }
    });
}

if (googleRegisterBtn) { // For the register page's Google button
    googleRegisterBtn.addEventListener('click', async () => {
        clearError();
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            console.log("Google user registered/logged in:", user);
            // Save new Google user's info to Firestore:
            // import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
            // const db = getFirestore(app);
            // await setDoc(doc(db, "users", user.uid), {
            //     fullName: user.displayName,
            //     email: user.email,
            //     createdAt: new Date()
            // }, { merge: true });

            window.location.href = 'home.html';
        } catch (error) {
            console.error("Google sign-up error:", error.code, error.message);
            if (error.code === 'auth/popup-closed-by-user') {
                displayError('Google sign-up was cancelled.');
            } else {
                displayError('Google sign-up failed: ' + error.message);
            }
        }
    });
}

// --- Logout Function (will be used on home/profile pages) ---
export async function logoutUser() {
    try {
        await signOut(auth);
        console.log("User logged out.");
        window.location.href = 'login.html'; // Redirect to login page after logout
    } catch (error) {
        console.error("Logout error:", error.message);
        // You might want a small error message on the page here
    }
}

// Basic redirection logic when auth state changes - main.js now handles the core of this
// but you could add specific onAuthStateChanged listeners here if needed for auth.js specific tasks.