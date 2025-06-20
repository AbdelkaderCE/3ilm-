// Search functionality and home page content loading
import {
    searchVideos,
    getRecentVideos,
    getVideosBySubject,
    getVideosByLevel,
    getPopularVideos,
    getWatchHistory,
    getUserData
} from './firestore.js';
import { showNotification, showLoading, hideLoading, debounce } from './utils.js';

let searchTimeout = null;
let currentSearchTerm = '';

// Initialize search functionality
export async function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    if (searchInput) {
        // Setup search input with debounced search
        const debouncedSearch = debounce(performSearch, 300);
        
        searchInput.addEventListener('input', (event) => {
            const searchTerm = event.target.value.trim();
            currentSearchTerm = searchTerm;
            
            if (searchTerm.length >= 2) {
                debouncedSearch(searchTerm);
            } else {
                hideSearchResults();
            }
        });
        
        // Handle Enter key
        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const searchTerm = searchInput.value.trim();
                if (searchTerm.length >= 2) {
                    performSearch(searchTerm);
                }
            }
        });
        
        // Handle search button click
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const searchTerm = searchInput.value.trim();
                if (searchTerm.length >= 2) {
                    performSearch(searchTerm);
                } else {
                    showNotification('يرجى إدخال كلمة البحث (حرفين على الأقل)', 'warning');
                }
            });
        }
        
        // Hide search results when clicking outside
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.search-bar') && !event.target.closest('.search-results')) {
                hideSearchResults();
            }
        });
    }
}

// Perform search
async function performSearch(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) {
        hideSearchResults();
        return;
    }
    
    try {
        const results = await searchVideos(searchTerm);
        displaySearchResults(results, searchTerm);
    } catch (error) {
        console.error('Error performing search:', error);
        showNotification('حدث خطأ أثناء البحث', 'error');
    }
}

// Display search results
function displaySearchResults(results, searchTerm) {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    // Remove existing results
    hideSearchResults();
    
    // Create results container
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'search-results';
    resultsContainer.id = 'search-results';
    
    if (results.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'search-no-results';
        noResults.textContent = `لا توجد نتائج للبحث عن "${searchTerm}"`;
        resultsContainer.appendChild(noResults);
    } else {
        results.slice(0, 8).forEach(video => {
            const resultItem = createSearchResultItem(video);
            resultsContainer.appendChild(resultItem);
        });
        
        if (results.length > 8) {
            const moreResults = document.createElement('div');
            moreResults.className = 'search-result-item';
            moreResults.style.fontWeight = 'bold';
            moreResults.style.textAlign = 'center';
            moreResults.style.color = '#007BFF';
            moreResults.textContent = `عرض ${results.length - 8} نتيجة إضافية...`;
            moreResults.addEventListener('click', () => {
                // TODO: Navigate to full search results page
                showNotification('صفحة النتائج الكاملة قيد التطوير', 'info');
            });
            resultsContainer.appendChild(moreResults);
        }
    }
    
    // Position and show results
    const searchBar = searchInput.closest('.search-bar');
    if (searchBar) {
        searchBar.style.position = 'relative';
        searchBar.appendChild(resultsContainer);
    }
}

// Create search result item
function createSearchResultItem(video) {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    
    // Thumbnail
    const thumbnail = document.createElement('img');
    thumbnail.className = 'search-result-thumbnail';
    thumbnail.src = video.thumbnailUrl || generatePlaceholderThumbnail(video.title);
    thumbnail.alt = video.title;
    thumbnail.loading = 'lazy';
    
    // Info container
    const info = document.createElement('div');
    info.className = 'search-result-info';
    
    const title = document.createElement('div');
    title.className = 'search-result-title';
    title.textContent = video.title;
    
    const instructor = document.createElement('div');
    instructor.className = 'search-result-instructor';
    instructor.textContent = video.instructor || 'غير محدد';
    
    info.appendChild(title);
    info.appendChild(instructor);
    
    item.appendChild(thumbnail);
    item.appendChild(info);
    
    // Add click handler
    item.addEventListener('click', () => {
        window.location.href = `watch.html?id=${video.id}`;
    });
    
    return item;
}

// Hide search results
function hideSearchResults() {
    const existingResults = document.getElementById('search-results');
    if (existingResults) {
        existingResults.remove();
    }
}

// Load home page content
export async function loadHomeContent() {
    if (!window.currentUser) {
        return;
    }
    
    try {
        const loadingContent = document.getElementById('loading-content');
        const contentContainer = document.getElementById('content-container');
        const emptyState = document.getElementById('empty-state');
        
        if (loadingContent) loadingContent.style.display = 'flex';
        if (contentContainer) contentContainer.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
        
        // Load all content sections
        const [
            continueWatchingData,
            mathVideos,
            scienceVideos,
            languagesVideos,
            recentVideos,
            featuredVideo
        ] = await Promise.all([
            loadContinueWatching(),
            getVideosBySubject('math', 10),
            getVideosBySubject('science', 10),
            getVideosBySubject('arabic', 10),
            getRecentVideos(10),
            loadFeaturedContent()
        ]);
        
        // Populate sections
        populateCarousel('continue-watching-carousel', continueWatchingData);
        populateCarousel('math-carousel', mathVideos);
        populateCarousel('science-carousel', scienceVideos);
        populateCarousel('languages-carousel', languagesVideos);
        populateCarousel('recent-carousel', recentVideos);
        
        // Update featured content
        if (featuredVideo) {
            updateFeaturedContent(featuredVideo);
        }
        
        // Show/hide continue watching section
        const continueSection = document.getElementById('continue-watching-section');
        if (continueSection) {
            continueSection.style.display = continueWatchingData.length > 0 ? 'block' : 'none';
        }
        
        // Check if we have any content
        const hasContent = mathVideos.length > 0 || scienceVideos.length > 0 || 
                          languagesVideos.length > 0 || recentVideos.length > 0;
        
        if (hasContent) {
            if (contentContainer) contentContainer.style.display = 'block';
        } else {
            if (emptyState) emptyState.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error loading home content:', error);
        const emptyState = document.getElementById('empty-state');
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.querySelector('h3').textContent = 'خطأ في التحميل';
            emptyState.querySelector('p').textContent = 'حدث خطأ أثناء تحميل المحتوى. حاول إعادة تحميل الصفحة.';
        }
    } finally {
        const loadingContent = document.getElementById('loading-content');
        if (loadingContent) loadingContent.style.display = 'none';
    }
}

// Load continue watching data
async function loadContinueWatching() {
    try {
        const watchHistory = await getWatchHistory(window.currentUser.uid, 5);
        
        // Filter videos that are not completed (less than 90% watched)
        const incompleteVideos = watchHistory.filter(item => 
            item.progress < 90 && item.progress > 5
        );
        
        return incompleteVideos.map(item => ({
            ...item.video,
            progress: item.progress
        }));
    } catch (error) {
        console.error('Error loading continue watching:', error);
        return [];
    }
}

// Load featured content
async function loadFeaturedContent() {
    try {
        // Get user data to personalize featured content
        const userData = await getUserData(window.currentUser.uid);
        let featuredVideos;
        
        if (userData && userData.level) {
            // Get videos for user's level
            featuredVideos = await getVideosByLevel(userData.level, 1);
        }
        
        if (!featuredVideos || featuredVideos.length === 0) {
            // Fallback to popular videos
            featuredVideos = await getPopularVideos(1);
        }
        
        if (!featuredVideos || featuredVideos.length === 0) {
            // Final fallback to recent videos
            featuredVideos = await getRecentVideos(1);
        }
        
        return featuredVideos.length > 0 ? featuredVideos[0] : null;
    } catch (error) {
        console.error('Error loading featured content:', error);
        return null;
    }
}

// Update featured content
function updateFeaturedContent(video) {
    const featuredTitle = document.getElementById('featured-title');
    const featuredDescription = document.getElementById('featured-description');
    const featuredWatchBtn = document.getElementById('featured-watch-btn');
    const featuredThumbnail = document.getElementById('featured-thumbnail');
    
    if (featuredTitle) {
        featuredTitle.textContent = video.title;
    }
    
    if (featuredDescription) {
        featuredDescription.textContent = video.description || 'اكتشف هذا المحتوى التعليمي المميز';
    }
    
    if (featuredWatchBtn) {
        featuredWatchBtn.href = `watch.html?id=${video.id}`;
    }
    
    if (featuredThumbnail) {
        featuredThumbnail.src = video.thumbnailUrl || generatePlaceholderThumbnail(video.title);
        featuredThumbnail.alt = video.title;
    }
}

// Populate carousel with videos
function populateCarousel(carouselId, videos) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;
    
    carousel.innerHTML = '';
    
    if (videos.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = 'لا توجد فيديوهات متاحة';
        emptyMessage.style.color = '#888';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.padding = '2rem';
        carousel.appendChild(emptyMessage);
        return;
    }
    
    videos.forEach(video => {
        const videoCard = createVideoCard(video);
        carousel.appendChild(videoCard);
    });
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
    
    // Handle image load error
    img.addEventListener('error', () => {
        img.src = generatePlaceholderThumbnail(video.title);
    });
    
    // Create card info
    const cardInfo = document.createElement('div');
    cardInfo.className = 'card-info';
    
    const title = document.createElement('h4');
    title.textContent = video.title;
    
    const instructor = document.createElement('p');
    instructor.textContent = video.instructor || 'غير محدد';
    
    cardInfo.appendChild(title);
    cardInfo.appendChild(instructor);
    
    // Add progress bar if video has progress
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
    
    // Add views count if available
    if (video.views && video.views > 0) {
        const viewsText = document.createElement('div');
        viewsText.style.fontSize = '0.8rem';
        viewsText.style.color = '#888';
        viewsText.style.marginTop = '0.25rem';
        viewsText.textContent = `${video.views.toLocaleString('ar')} مشاهدة`;
        cardInfo.appendChild(viewsText);
    }
    
    card.appendChild(img);
    card.appendChild(cardInfo);
    
    return card;
}

// Generate placeholder thumbnail
function generatePlaceholderThumbnail(title) {
    const firstLetter = title ? title.charAt(0).toUpperCase() : '📺';
    return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 180'><rect width='300' height='180' fill='%23333'/><text x='50%' y='50%' text-anchor='middle' dy='.3em' fill='white' font-size='48'>${firstLetter}</text></svg>`;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeSearch();
});

console.log('Search module initialized');
