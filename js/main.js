// Firebase configuration and initialization
import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js';
import { showNotification, hideLoading, showLoading } from './utils.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Export app instance for other modules
export { app, auth };

// Global state management
window.currentUser = null;
window.isAdmin = false;

// Authentication state observer
onAuthStateChanged(auth, async (user) => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const authPages = ['login.html', 'register.html', 'index.html'];
    const protectedPages = ['home.html', 'watch.html', 'profile.html', 'admin.html'];
    
    if (user) {
        // User is signed in
        console.log('User authenticated:', user.email);
        window.currentUser = user;
        
        // Check if user is admin
        try {
            const { getUserData } = await import('./firestore.js');
            const userData = await getUserData(user.uid);
            window.isAdmin = userData?.role === 'admin';
        } catch (error) {
            console.error('Error checking user role:', error);
            window.isAdmin = false;
        }
        
        // Update UI elements
        updateHeaderForLoggedInUser(user);
        
        // Redirect logic
        if (authPages.includes(currentPage)) {
            window.location.href = 'home.html';
        }
    } else {
        // User is signed out
        console.log('User not authenticated');
        window.currentUser = null;
        window.isAdmin = false;
        
        // Redirect to login if on protected pages
        if (protectedPages.includes(currentPage)) {
            window.location.href = 'login.html';
        }
    }
});

// Update header for logged-in users
function updateHeaderForLoggedInUser(user) {
    // Update user avatar
    const userAvatarImg = document.getElementById('user-avatar-img');
    if (userAvatarImg) {
        if (user.photoURL) {
            userAvatarImg.src = user.photoURL;
        } else {
            userAvatarImg.src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>👤</text></svg>";
        }
    }
    
    // Show/hide admin navigation
    const adminNavItem = document.getElementById('admin-nav-item');
    if (adminNavItem) {
        adminNavItem.style.display = window.isAdmin ? 'block' : 'none';
    }
    
    // Update welcome message
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) {
        const displayName = user.displayName || user.email.split('@')[0];
        welcomeMessage.textContent = `مرحباً ${displayName}!`;
    }
}

// Logout functionality
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                showLoading();
                const { signOut } = await import('https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js');
                await signOut(auth);
                showNotification('تم تسجيل الخروج بنجاح', 'success');
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Error signing out:', error);
                showNotification('حدث خطأ أثناء تسجيل الخروج', 'error');
            } finally {
                hideLoading();
            }
        });
    }
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (event.error.code === 'auth/network-request-failed') {
        showNotification('مشكلة في الاتصال بالإنترنت. تحقق من اتصالك وحاول مرة أخرى.', 'error');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (event.reason?.code === 'auth/network-request-failed') {
        showNotification('مشكلة في الاتصال بالإنترنت. تحقق من اتصالك وحاول مرة أخرى.', 'error');
        event.preventDefault();
    }
});

// Service worker registration for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Initialize page-specific functionality
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Initialize common functionality
    initializeCommonFeatures();
    
    // Initialize page-specific features
    switch (currentPage) {
        case 'home.html':
            initializeHomePage();
            break;
        case 'watch.html':
            initializeWatchPage();
            break;
        case 'profile.html':
            initializeProfilePage();
            break;
        case 'admin.html':
            initializeAdminPage();
            break;
        default:
            break;
    }
});

// Initialize common features across all pages
function initializeCommonFeatures() {
    // Initialize tooltips
    initializeTooltips();
    
    // Initialize keyboard shortcuts
    initializeKeyboardShortcuts();
    
    // Initialize lazy loading for images
    initializeLazyLoading();
}

// Initialize home page
async function initializeHomePage() {
    if (window.currentUser) {
        const { loadHomeContent } = await import('./search.js');
        await loadHomeContent();
    }
}

// Initialize watch page
async function initializeWatchPage() {
    const { initializeVideoPlayer } = await import('./videoPlayer.js');
    const { initializeComments } = await import('./comments.js');
    
    await initializeVideoPlayer();
    await initializeComments();
}

// Initialize profile page
async function initializeProfilePage() {
    const { initializeProfileManager } = await import('./profileManager.js');
    await initializeProfileManager();
}

// Initialize admin page
async function initializeAdminPage() {
    if (window.isAdmin) {
        const { initializeAdminDashboard } = await import('./adminDashboard.js');
        await initializeAdminDashboard();
    } else {
        window.location.href = 'home.html';
    }
}

// Initialize tooltips
function initializeTooltips() {
    const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
    tooltipTriggers.forEach(trigger => {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-text';
        tooltip.textContent = trigger.getAttribute('data-tooltip');
        trigger.appendChild(tooltip);
        trigger.classList.add('tooltip');
    });
}

// Initialize keyboard shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        // ESC key to close modals
        if (event.key === 'Escape') {
            const openModal = document.querySelector('.modal-overlay.show');
            if (openModal) {
                openModal.classList.remove('show');
            }
        }
        
        // Ctrl/Cmd + K for search (on logged-in pages)
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Space bar for play/pause video
        if (event.code === 'Space' && event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
            const video = document.getElementById('main-video-player');
            if (video) {
                event.preventDefault();
                if (video.paused) {
                    video.play();
                } else {
                    video.pause();
                }
            }
        }
    });
}

// Initialize lazy loading for images
function initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                }
            });
        });
        
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            img.classList.add('lazy');
            imageObserver.observe(img);
        });
    }
}

console.log('3ilm+ Application initialized');

