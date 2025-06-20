// Video player functionality
import { updateVideoViews, addToWatchHistory, getVideoData } from './firestore.js';
import { showNotification, formatDuration, showLoading, hideLoading } from './utils.js';

let currentVideoId = null;
let watchHistoryTimer = null;
let progressUpdateTimer = null;

// Initialize video player
export async function initializeVideoPlayer() {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('id');
    
    if (!videoId) {
        showNotification('معرف الفيديو مفقود', 'error');
        window.location.href = 'home.html';
        return;
    }
    
    currentVideoId = videoId;
    
    try {
        showLoading();
        await loadVideoData(videoId);
        await loadRelatedVideos(videoId);
        await loadLessons(videoId);
        setupVideoPlayer();
        setupVideoControls();
    } catch (error) {
        console.error('Error initializing video player:', error);
        showNotification('حدث خطأ أثناء تحميل الفيديو', 'error');
        window.location.href = 'home.html';
    } finally {
        hideLoading();
    }
}

// Load video data
async function loadVideoData(videoId) {
    try {
        const videoData = await getVideoData(videoId);
        
        if (!videoData) {
            throw new Error('Video not found');
        }
        
        // Update video information
        const videoTitle = document.getElementById('video-title');
        const videoInstructor = document.getElementById('video-instructor');
        const videoDescription = document.getElementById('video-description');
        const videoMetaTags = document.getElementById('video-meta-tags');
        const videoPlayer = document.getElementById('main-video-player');
        
        if (videoTitle) videoTitle.textContent = videoData.title || 'عنوان الفيديو';
        if (videoInstructor) videoInstructor.textContent = videoData.instructor || 'غير محدد';
        if (videoDescription) videoDescription.textContent = videoData.description || 'لا يوجد وصف متاح';
        
        // Update meta tags
        if (videoMetaTags) {
            videoMetaTags.innerHTML = '';
            
            if (videoData.subject) {
                const subjectTag = document.createElement('span');
                subjectTag.textContent = `المادة: ${getSubjectDisplayName(videoData.subject)}`;
                videoMetaTags.appendChild(subjectTag);
            }
            
            if (videoData.level) {
                const levelTag = document.createElement('span');
                levelTag.textContent = `المستوى: ${getLevelDisplayName(videoData.level)}`;
                videoMetaTags.appendChild(levelTag);
            }
            
            if (videoData.duration) {
                const durationTag = document.createElement('span');
                durationTag.textContent = `المدة: ${formatDuration(videoData.duration)}`;
                videoMetaTags.appendChild(durationTag);
            }
            
            if (videoData.views) {
                const viewsTag = document.createElement('span');
                viewsTag.textContent = `المشاهدات: ${videoData.views.toLocaleString('ar')}`;
                videoMetaTags.appendChild(viewsTag);
            }
        }
        
        // Set video source
        if (videoPlayer && videoData.videoUrl) {
            const source = videoPlayer.querySelector('source');
            if (source) {
                source.src = videoData.videoUrl;
                videoPlayer.load();
            }
            
            // Set poster if available
            if (videoData.thumbnailUrl) {
                videoPlayer.poster = videoData.thumbnailUrl;
            }
        }
        
        // Update page title
        document.title = `${videoData.title} - 3ilm+`;
        
        // Update views count
        await updateVideoViews(videoId);
        
        return videoData;
    } catch (error) {
        console.error('Error loading video data:', error);
        throw error;
    }
}

// Load related videos
async function loadRelatedVideos(videoId) {
    try {
        const { getVideosBySubject } = await import('./firestore.js');
        const videoData = await getVideoData(videoId);
        
        if (!videoData || !videoData.subject) {
            return;
        }
        
        const relatedVideos = await getVideosBySubject(videoData.subject, 5);
        const filteredVideos = relatedVideos.filter(video => video.id !== videoId);
        
        const carousel = document.getElementById('related-videos-carousel');
        if (carousel) {
            carousel.innerHTML = '';
            
            if (filteredVideos.length === 0) {
                carousel.innerHTML = '<p class="text-center" style="color: #888;">لا توجد فيديوهات ذات صلة</p>';
                return;
            }
            
            filteredVideos.forEach(video => {
                const videoCard = createVideoCard(video);
                carousel.appendChild(videoCard);
            });
        }
    } catch (error) {
        console.error('Error loading related videos:', error);
    }
}

// Load lessons (mock data for now)
async function loadLessons(videoId) {
    try {
        const lessonsList = document.getElementById('lesson-list');
        if (!lessonsList) return;
        
        // For now, create mock lessons
        const lessons = [
            { id: 'lesson1', title: 'مقدمة في الجبر: المفاهيم الأساسية', active: true },
            { id: 'lesson2', title: 'حل المعادلات الخطية' },
            { id: 'lesson3', title: 'المتباينات وحلولها' },
            { id: 'lesson4', title: 'مقدمة في الرسم البياني' },
            { id: 'lesson5', title: 'أنظمة المعادلات' }
        ];
        
        lessonsList.innerHTML = '';
        
        lessons.forEach(lesson => {
            const li = document.createElement('li');
            li.className = 'lesson-item';
            if (lesson.active) {
                li.classList.add('active');
            }
            
            const a = document.createElement('a');
            a.href = `watch.html?id=${lesson.id}`;
            a.textContent = lesson.title;
            
            li.appendChild(a);
            lessonsList.appendChild(li);
        });
    } catch (error) {
        console.error('Error loading lessons:', error);
    }
}

// Setup video player event listeners
function setupVideoPlayer() {
    const videoPlayer = document.getElementById('main-video-player');
    if (!videoPlayer) return;
    
    // Video loaded
    videoPlayer.addEventListener('loadedmetadata', () => {
        console.log('Video metadata loaded');
        hideVideoLoading();
    });
    
    // Video can play
    videoPlayer.addEventListener('canplay', () => {
        console.log('Video can play');
        hideVideoLoading();
    });
    
    // Video error
    videoPlayer.addEventListener('error', (e) => {
        console.error('Video error:', e);
        showNotification('حدث خطأ أثناء تحميل الفيديو', 'error');
        hideVideoLoading();
    });
    
    // Video started playing
    videoPlayer.addEventListener('play', () => {
        startWatchHistoryTimer();
    });
    
    // Video paused
    videoPlayer.addEventListener('pause', () => {
        stopWatchHistoryTimer();
    });
    
    // Video ended
    videoPlayer.addEventListener('ended', () => {
        stopWatchHistoryTimer();
        updateWatchProgress(100);
        showNotification('انتهى الفيديو!', 'success');
    });
    
    // Time update for progress tracking
    videoPlayer.addEventListener('timeupdate', () => {
        updateProgressDisplay();
    });
    
    // Seeking
    videoPlayer.addEventListener('seeking', () => {
        console.log('Video seeking');
    });
    
    // Volume change
    videoPlayer.addEventListener('volumechange', () => {
        const volume = Math.round(videoPlayer.volume * 100);
        console.log('Volume changed to:', volume);
    });
}

// Setup video controls
function setupVideoControls() {
    const addToWatchlistBtn = document.getElementById('add-to-watchlist-btn');
    const downloadNotesBtn = document.getElementById('download-notes-btn');
    
    if (addToWatchlistBtn) {
        addToWatchlistBtn.addEventListener('click', async () => {
            if (!window.currentUser) {
                showNotification('يجب تسجيل الدخول أولاً', 'warning');
                return;
            }
            
            try {
                const { addToWatchlist } = await import('./firestore.js');
                await addToWatchlist(window.currentUser.uid, currentVideoId);
                showNotification('تم إضافة الفيديو إلى قائمة المتابعة', 'success');
                addToWatchlistBtn.textContent = 'تمت الإضافة';
                addToWatchlistBtn.disabled = true;
            } catch (error) {
                console.error('Error adding to watchlist:', error);
                if (error.message.includes('already exists')) {
                    showNotification('الفيديو موجود بالفعل في قائمة المتابعة', 'info');
                } else {
                    showNotification('حدث خطأ أثناء إضافة الفيديو', 'error');
                }
            }
        });
    }
    
    if (downloadNotesBtn) {
        downloadNotesBtn.addEventListener('click', () => {
            showNotification('ملاحظات الدرس غير متاحة حالياً', 'info');
        });
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
    
    // Add progress bar if available
    if (video.progress && video.progress > 0) {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-bar-container';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.style.width = `${video.progress}%`;
        
        const progressText = document.createElement('div');
        progressText.className = 'progress-text';
        progressText.textContent = `${Math.round(video.progress)}%`;
        
        progressContainer.appendChild(progressBar);
        cardInfo.appendChild(progressContainer);
        cardInfo.appendChild(progressText);
    }
    
    card.appendChild(img);
    card.appendChild(cardInfo);
    
    return card;
}

// Start watch history timer
function startWatchHistoryTimer() {
    if (watchHistoryTimer) {
        clearInterval(watchHistoryTimer);
    }
    
    // Update watch history every 30 seconds
    watchHistoryTimer = setInterval(() => {
        updateWatchHistory();
    }, 30000);
    
    // Update immediately
    updateWatchHistory();
}

// Stop watch history timer
function stopWatchHistoryTimer() {
    if (watchHistoryTimer) {
        clearInterval(watchHistoryTimer);
        watchHistoryTimer = null;
    }
    
    // Final update
    updateWatchHistory();
}

// Update watch history
async function updateWatchHistory() {
    if (!window.currentUser || !currentVideoId) return;
    
    const videoPlayer = document.getElementById('main-video-player');
    if (!videoPlayer) return;
    
    const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    
    try {
        await addToWatchHistory(window.currentUser.uid, currentVideoId, progress);
    } catch (error) {
        console.error('Error updating watch history:', error);
    }
}

// Update watch progress
async function updateWatchProgress(progress) {
    if (!window.currentUser || !currentVideoId) return;
    
    try {
        await addToWatchHistory(window.currentUser.uid, currentVideoId, progress);
    } catch (error) {
        console.error('Error updating watch progress:', error);
    }
}

// Update progress display
function updateProgressDisplay() {
    const videoPlayer = document.getElementById('main-video-player');
    if (!videoPlayer || !videoPlayer.duration) return;
    
    const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    
    // Update any progress indicators on the page
    const progressBars = document.querySelectorAll('.video-progress-fill');
    progressBars.forEach(bar => {
        bar.style.width = `${progress}%`;
    });
}

// Show/hide video loading
function showVideoLoading() {
    const loadingOverlay = document.getElementById('video-loading');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

function hideVideoLoading() {
    const loadingOverlay = document.getElementById('video-loading');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// Generate placeholder thumbnail
function generatePlaceholderThumbnail(title) {
    const firstLetter = title ? title.charAt(0).toUpperCase() : '📺';
    return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 180'><rect width='300' height='180' fill='%23333'/><text x='50%' y='50%' text-anchor='middle' dy='.3em' fill='white' font-size='48'>${firstLetter}</text></svg>`;
}

// Get subject display name
function getSubjectDisplayName(subject) {
    const subjects = {
        'math': 'الرياضيات',
        'science': 'العلوم',
        'physics': 'الفيزياء',
        'chemistry': 'الكيمياء',
        'biology': 'الأحياء',
        'arabic': 'اللغة العربية',
        'english': 'اللغة الإنجليزية',
        'french': 'اللغة الفرنسية',
        'history': 'التاريخ',
        'geography': 'الجغرافيا'
    };
    
    return subjects[subject] || subject;
}

// Get level display name
function getLevelDisplayName(level) {
    const levels = {
        'middle': 'متوسط',
        'high': 'ثانوي',
        'university': 'جامعي'
    };
    
    return levels[level] || level;
}

// Keyboard shortcuts for video player
document.addEventListener('keydown', (event) => {
    const videoPlayer = document.getElementById('main-video-player');
    if (!videoPlayer || event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }
    
    switch (event.code) {
        case 'Space':
            event.preventDefault();
            if (videoPlayer.paused) {
                videoPlayer.play();
            } else {
                videoPlayer.pause();
            }
            break;
            
        case 'ArrowLeft':
            event.preventDefault();
            videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 10);
            break;
            
        case 'ArrowRight':
            event.preventDefault();
            videoPlayer.currentTime = Math.min(videoPlayer.duration, videoPlayer.currentTime + 10);
            break;
            
        case 'ArrowUp':
            event.preventDefault();
            videoPlayer.volume = Math.min(1, videoPlayer.volume + 0.1);
            break;
            
        case 'ArrowDown':
            event.preventDefault();
            videoPlayer.volume = Math.max(0, videoPlayer.volume - 0.1);
            break;
            
        case 'KeyM':
            event.preventDefault();
            videoPlayer.muted = !videoPlayer.muted;
            break;
            
        case 'KeyF':
            event.preventDefault();
            if (videoPlayer.requestFullscreen) {
                videoPlayer.requestFullscreen();
            }
            break;
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopWatchHistoryTimer();
});

console.log('Video player module initialized');

