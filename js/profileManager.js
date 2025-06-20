// Profile management module
import { auth } from './main.js';
import {
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js';
import { getUserData, updateUserData, getWatchHistory, getWatchlistVideos } from './firestore.js';
import { uploadUserAvatar, compressImage } from './storage.js';
import { showNotification, showLoading, hideLoading, validatePassword } from './utils.js';

let currentUserData = null;

// Initialize profile manager
export async function initializeProfileManager() {
    if (!window.currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        showLoading();
        await loadUserProfile();
        setupTabSwitching();
        setupProfileForm();
        setupPasswordForm();
        await loadWatchHistory();
        await loadWatchlist();
    } catch (error) {
        console.error('Error initializing profile manager:', error);
        showNotification('حدث خطأ أثناء تحميل الملف الشخصي', 'error');
    } finally {
        hideLoading();
    }
}

// Load user profile data
async function loadUserProfile() {
    try {
        currentUserData = await getUserData(window.currentUser.uid);
        
        if (!currentUserData) {
            // Create minimal user data if it doesn't exist
            currentUserData = {
                displayName: window.currentUser.displayName || window.currentUser.email.split('@')[0],
                email: window.currentUser.email,
                level: 'high',
                role: 'student'
            };
        }
        
        // Populate form fields
        const displayNameInput = document.getElementById('display-name');
        const emailInput = document.getElementById('profile-email');
        const levelSelect = document.getElementById('profile-level');
        const avatarPreview = document.getElementById('current-avatar');
        
        if (displayNameInput) {
            displayNameInput.value = currentUserData.displayName || '';
        }
        
        if (emailInput) {
            emailInput.value = currentUserData.email || window.currentUser.email;
        }
        
        if (levelSelect && currentUserData.level) {
            levelSelect.value = currentUserData.level;
        }
        
        if (avatarPreview) {
            if (currentUserData.photoURL || window.currentUser.photoURL) {
                avatarPreview.src = currentUserData.photoURL || window.currentUser.photoURL;
            }
        }
        
    } catch (error) {
        console.error('Error loading user profile:', error);
        throw error;
    }
}

// Setup tab switching
function setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.profile-tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => {
                content.style.display = 'none';
                content.classList.remove('active');
            });
            
            const targetContent = document.getElementById(`${targetTab}-tab`);
            if (targetContent) {
                targetContent.style.display = 'block';
                targetContent.classList.add('active');
            }
            
            // Load content for specific tabs
            if (targetTab === 'history') {
                loadWatchHistory();
            } else if (targetTab === 'watchlist') {
                loadWatchlist();
            }
        });
    });
}

// Setup profile form
function setupProfileForm() {
    const profileForm = document.getElementById('profile-form');
    const avatarInput = document.getElementById('profile-avatar');
    const avatarPreview = document.getElementById('current-avatar');
    
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    if (avatarInput && avatarPreview) {
        avatarInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (file) {
                try {
                    // Validate file
                    if (!file.type.startsWith('image/')) {
                        showNotification('يرجى اختيار ملف صورة صحيح', 'error');
                        return;
                    }
                    
                    if (file.size > 5 * 1024 * 1024) {
                        showNotification('حجم الصورة يجب أن يكون أقل من 5 ميجابايت', 'error');
                        return;
                    }
                    
                    // Show preview
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        avatarPreview.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                    
                } catch (error) {
                    console.error('Error handling avatar upload:', error);
                    showNotification('حدث خطأ أثناء معالجة الصورة', 'error');
                }
            }
        });
    }
}

// Setup password change form
function setupPasswordForm() {
    const passwordForm = document.getElementById('change-password-form');
    
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }
}

// Handle profile update
async function handleProfileUpdate(event) {
    event.preventDefault();
    
    const form = event.target;
    const displayName = form['display-name'].value.trim();
    const level = form['profile-level'].value;
    const avatarFile = form['profile-avatar'].files[0];
    
    if (!displayName) {
        showNotification('يرجى إدخال الاسم المعروض', 'error');
        return;
    }
    
    try {
        showLoading();
        
        let photoURL = currentUserData.photoURL || window.currentUser.photoURL;
        
        // Upload new avatar if provided
        if (avatarFile) {
            const compressedFile = await compressImage(avatarFile, 400, 400, 0.8);
            photoURL = await uploadUserAvatar(window.currentUser.uid, compressedFile, (progress) => {
                console.log(`Upload progress: ${progress}%`);
            });
        }
        
        // Update Firebase Auth profile
        await updateProfile(window.currentUser, {
            displayName: displayName,
            photoURL: photoURL
        });
        
        // Update Firestore user document
        await updateUserData(window.currentUser.uid, {
            displayName: displayName,
            level: level,
            photoURL: photoURL
        });
        
        // Update current user data
        currentUserData = {
            ...currentUserData,
            displayName: displayName,
            level: level,
            photoURL: photoURL
        };
        
        // Update header avatar
        const headerAvatar = document.getElementById('user-avatar-img');
        if (headerAvatar && photoURL) {
            headerAvatar.src = photoURL;
        }
        
        showNotification('تم تحديث الملف الشخصي بنجاح', 'success');
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('حدث خطأ أثناء تحديث الملف الشخصي', 'error');
    } finally {
        hideLoading();
    }
}

// Handle password change
async function handlePasswordChange(event) {
    event.preventDefault();
    
    const form = event.target;
    const currentPassword = form['current-password'].value;
    const newPassword = form['new-password'].value;
    const confirmPassword = form['confirm-new-password'].value;
    
    // Validation
    if (!currentPassword) {
        showNotification('يرجى إدخال كلمة المرور الحالية', 'error');
        return;
    }
    
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
        showNotification(passwordValidation.message, 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('كلمات المرور الجديدة غير متطابقة', 'error');
        return;
    }
    
    if (currentPassword === newPassword) {
        showNotification('كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية', 'error');
        return;
    }
    
    try {
        showLoading();
        
        // Re-authenticate user
        const credential = EmailAuthProvider.credential(window.currentUser.email, currentPassword);
        await reauthenticateWithCredential(window.currentUser, credential);
        
        // Update password
        await updatePassword(window.currentUser, newPassword);
        
        // Clear form
        form.reset();
        
        showNotification('تم تغيير كلمة المرور بنجاح', 'success');
        
    } catch (error) {
        console.error('Error changing password:', error);
        
        switch (error.code) {
            case 'auth/wrong-password':
                showNotification('كلمة المرور الحالية غير صحيحة', 'error');
                break;
            case 'auth/weak-password':
                showNotification('كلمة المرور الجديدة ضعيفة جداً', 'error');
                break;
            case 'auth/requires-recent-login':
                showNotification('يرجى تسجيل الخروج والدخول مرة أخرى ثم إعادة المحاولة', 'error');
                break;
            default:
                showNotification('حدث خطأ أثناء تغيير كلمة المرور', 'error');
        }
    } finally {
        hideLoading();
    }
}

// Load watch history
async function loadWatchHistory() {
    const historyList = document.getElementById('watch-history-list');
    const historyLoading = document.getElementById('history-loading');
    const noHistory = document.getElementById('no-history');
    
    if (!historyList) return;
    
    try {
        if (historyLoading) historyLoading.style.display = 'flex';
        if (noHistory) noHistory.style.display = 'none';
        
        const watchHistory = await getWatchHistory(window.currentUser.uid, 20);
        
        historyList.innerHTML = '';
        
        if (watchHistory.length === 0) {
            if (noHistory) noHistory.style.display = 'block';
            return;
        }
        
        watchHistory.forEach(historyItem => {
            const li = document.createElement('li');
            
            const link = document.createElement('a');
            link.href = `watch.html?id=${historyItem.videoId}`;
            link.textContent = historyItem.video.title;
            
            const progressText = document.createElement('span');
            progressText.style.color = '#888';
            progressText.style.fontSize = '0.9rem';
            progressText.style.marginRight = '1rem';
            
            if (historyItem.progress >= 90) {
                progressText.textContent = '(مكتمل)';
                progressText.style.color = '#28a745';
            } else {
                progressText.textContent = `(${Math.round(historyItem.progress)}% مشاهدة)`;
            }
            
            const dateText = document.createElement('div');
            dateText.style.color = '#666';
            dateText.style.fontSize = '0.8rem';
            dateText.style.marginTop = '0.25rem';
            
            if (historyItem.lastWatched && historyItem.lastWatched.toDate) {
                dateText.textContent = formatRelativeTime(historyItem.lastWatched.toDate());
            }
            
            li.appendChild(link);
            li.appendChild(progressText);
            li.appendChild(dateText);
            
            historyList.appendChild(li);
        });
        
    } catch (error) {
        console.error('Error loading watch history:', error);
        if (noHistory) {
            noHistory.style.display = 'block';
            noHistory.querySelector('h4').textContent = 'خطأ في تحميل السجل';
            noHistory.querySelector('p').textContent = 'حدث خطأ أثناء تحميل سجل المشاهدة';
        }
    } finally {
        if (historyLoading) historyLoading.style.display = 'none';
    }
}

// Load watchlist
async function loadWatchlist() {
    const watchlistCarousel = document.getElementById('watchlist-carousel');
    const watchlistLoading = document.getElementById('watchlist-loading');
    const noWatchlist = document.getElementById('no-watchlist');
    
    if (!watchlistCarousel) return;
    
    try {
        if (watchlistLoading) watchlistLoading.style.display = 'flex';
        if (noWatchlist) noWatchlist.style.display = 'none';
        
        const watchlistVideos = await getWatchlistVideos(window.currentUser.uid);
        
        watchlistCarousel.innerHTML = '';
        
        if (watchlistVideos.length === 0) {
            if (noWatchlist) noWatchlist.style.display = 'block';
            return;
        }
        
        watchlistVideos.forEach(video => {
            const videoCard = createVideoCard(video);
            watchlistCarousel.appendChild(videoCard);
        });
        
    } catch (error) {
        console.error('Error loading watchlist:', error);
        if (noWatchlist) {
            noWatchlist.style.display = 'block';
            noWatchlist.querySelector('h4').textContent = 'خطأ في التحميل';
            noWatchlist.querySelector('p').textContent = 'حدث خطأ أثناء تحميل قائمة المتابعة';
        }
    } finally {
        if (watchlistLoading) watchlistLoading.style.display = 'none';
    }
}

// Create video card element
function createVideoCard(video) {
    const card = document.createElement('a');
    card.className = 'video-card';
    card.href = `watch.html?id=${video.id}`;
    
    // Create thumbnail
    const img = document.createElement('img');
    img.src = video.thumbnailUrl || generatePlaceholderThumbnail(video.title);
    img.alt = `صورة مصغرة لـ ${video.title}`;
    img.loading = 'lazy';
    
    // Create card info
    const cardInfo = document.createElement('div');
    cardInfo.className = 'card-info';
    
    const title = document.createElement('h4');
    title.textContent = video.title;
    
    const instructor = document.createElement('p');
    instructor.textContent = video.instructor || 'غير محدد';
    
    cardInfo.appendChild(title);
    cardInfo.appendChild(instructor);
    
    card.appendChild(img);
    card.appendChild(cardInfo);
    
    return card;
}

// Generate placeholder thumbnail
function generatePlaceholderThumbnail(title) {
    const firstLetter = title ? title.charAt(0).toUpperCase() : '📺';
    return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 180'><rect width='300' height='180' fill='%23333'/><text x='50%' y='50%' text-anchor='middle' dy='.3em' fill='white' font-size='48'>${firstLetter}</text></svg>`;
}

// Format relative time
function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) {
        return 'الآن';
    } else if (minutes < 60) {
        return `منذ ${minutes} دقيقة`;
    } else if (hours < 24) {
        return `منذ ${hours} ساعة`;
    } else if (days < 7) {
        return `منذ ${days} يوم`;
    } else {
        return date.toLocaleDateString('ar-SA');
    }
}

console.log('Profile manager module initialized');
