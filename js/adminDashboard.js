// Admin dashboard module
import { auth } from './main.js';
import {
    getAllUsers,
    getAllVideos,
    createVideoDocument,
    deleteVideoDocument,
    updateUserData,
    getAnalyticsData
} from './firestore.js';
import { uploadVideoFile, uploadVideoThumbnail, deleteFile, formatFileSize } from './storage.js';
import { showNotification, showLoading, hideLoading, formatRelativeTime } from './utils.js';

let currentSection = 'users';
let currentAdminTab = 'upload';

// Initialize admin dashboard
export async function initializeAdminDashboard() {
    if (!window.isAdmin) {
        showNotification('ليس لديك صلاحية للوصول إلى هذه الصفحة', 'error');
        window.location.href = 'home.html';
        return;
    }
    
    try {
        showLoading();
        setupSidebarNavigation();
        setupAdminTabs();
        await loadUsersSection();
        await loadAnalytics();
        setupVideoUploadForm();
    } catch (error) {
        console.error('Error initializing admin dashboard:', error);
        showNotification('حدث خطأ أثناء تحميل لوحة الإدارة', 'error');
    } finally {
        hideLoading();
    }
}

// Setup sidebar navigation
function setupSidebarNavigation() {
    const sidebarLinks = document.querySelectorAll('.admin-sidebar a[data-section]');
    const sections = document.querySelectorAll('.admin-section');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', async (event) => {
            event.preventDefault();
            
            const targetSection = link.getAttribute('data-section');
            
            // Update active link
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Update active section
            sections.forEach(section => {
                section.style.display = 'none';
                section.classList.remove('active');
            });
            
            const targetSectionElement = document.getElementById(`${targetSection}-section`);
            if (targetSectionElement) {
                targetSectionElement.style.display = 'block';
                targetSectionElement.classList.add('active');
            }
            
            currentSection = targetSection;
            
            // Load section-specific content
            try {
                showLoading();
                switch (targetSection) {
                    case 'users':
                        await loadUsersSection();
                        break;
                    case 'content':
                        await loadContentSection();
                        break;
                    case 'analytics':
                        await loadAnalyticsSection();
                        break;
                    case 'settings':
                        loadSettingsSection();
                        break;
                }
            } catch (error) {
                console.error(`Error loading ${targetSection} section:`, error);
                showNotification(`حدث خطأ أثناء تحميل قسم ${getSectionDisplayName(targetSection)}`, 'error');
            } finally {
                hideLoading();
            }
        });
    });
}

// Setup admin tabs
function setupAdminTabs() {
    const tabButtons = document.querySelectorAll('.admin-tab-btn');
    const tabContents = document.querySelectorAll('.admin-tab-content');
    
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
            
            currentAdminTab = targetTab;
            
            // Load tab-specific content
            if (targetTab === 'manage') {
                loadVideosManagement();
            }
        });
    });
}

// Load users section
async function loadUsersSection() {
    try {
        const users = await getAllUsers();
        updateUsersStats(users);
        populateUsersTable(users);
    } catch (error) {
        console.error('Error loading users section:', error);
        throw error;
    }
}

// Update users statistics
function updateUsersStats(users) {
    const totalUsersElement = document.getElementById('total-users');
    const newUsersElement = document.getElementById('new-users');
    const activeUsersElement = document.getElementById('active-users');
    
    if (totalUsersElement) {
        totalUsersElement.textContent = users.length.toLocaleString('ar');
    }
    
    // Calculate new users this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const newUsersThisMonth = users.filter(user => {
        if (!user.createdAt || !user.createdAt.toDate) return false;
        return user.createdAt.toDate() >= thisMonth;
    }).length;
    
    if (newUsersElement) {
        newUsersElement.textContent = newUsersThisMonth.toLocaleString('ar');
    }
    
    // Calculate active users (logged in within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeUsers = users.filter(user => {
        if (!user.lastLoginAt || !user.lastLoginAt.toDate) return false;
        return user.lastLoginAt.toDate() >= sevenDaysAgo;
    }).length;
    
    if (activeUsersElement) {
        activeUsersElement.textContent = activeUsers.toLocaleString('ar');
    }
}

// Populate users table
function populateUsersTable(users) {
    const tableBody = document.getElementById('users-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (users.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" class="text-center">لا يوجد مستخدمون</td>';
        tableBody.appendChild(row);
        return;
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        
        const nameCell = document.createElement('td');
        nameCell.textContent = user.displayName || 'غير محدد';
        
        const emailCell = document.createElement('td');
        emailCell.textContent = user.email || 'غير محدد';
        
        const roleCell = document.createElement('td');
        roleCell.textContent = getRoleDisplayName(user.role);
        
        const dateCell = document.createElement('td');
        if (user.createdAt && user.createdAt.toDate) {
            dateCell.textContent = user.createdAt.toDate().toLocaleDateString('ar-SA');
        } else {
            dateCell.textContent = 'غير محدد';
        }
        
        const actionsCell = document.createElement('td');
        const editButton = document.createElement('button');
        editButton.className = 'btn btn-secondary btn-small';
        editButton.textContent = 'تعديل';
        editButton.addEventListener('click', () => openUserEditModal(user));
        
        actionsCell.appendChild(editButton);
        
        row.appendChild(nameCell);
        row.appendChild(emailCell);
        row.appendChild(roleCell);
        row.appendChild(dateCell);
        row.appendChild(actionsCell);
        
        tableBody.appendChild(row);
    });
}

// Load content section
async function loadContentSection() {
    try {
        const videos = await getAllVideos();
        updateVideosStats(videos);
        
        if (currentAdminTab === 'manage') {
            populateVideosTable(videos);
        }
    } catch (error) {
        console.error('Error loading content section:', error);
        throw error;
    }
}

// Update videos statistics
function updateVideosStats(videos) {
    const totalVideosElement = document.getElementById('total-videos');
    const newVideosElement = document.getElementById('new-videos');
    const totalViewsElement = document.getElementById('total-views');
    
    if (totalVideosElement) {
        totalVideosElement.textContent = videos.length.toLocaleString('ar');
    }
    
    // Calculate new videos this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const newVideosThisMonth = videos.filter(video => {
        if (!video.createdAt || !video.createdAt.toDate) return false;
        return video.createdAt.toDate() >= thisMonth;
    }).length;
    
    if (newVideosElement) {
        newVideosElement.textContent = newVideosThisMonth.toLocaleString('ar');
    }
    
    // Calculate total views
    const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);
    
    if (totalViewsElement) {
        totalViewsElement.textContent = totalViews.toLocaleString('ar');
    }
}

// Load videos management
async function loadVideosManagement() {
    try {
        const videosLoading = document.getElementById('videos-loading');
        if (videosLoading) videosLoading.style.display = 'flex';
        
        const videos = await getAllVideos();
        populateVideosTable(videos);
    } catch (error) {
        console.error('Error loading videos management:', error);
        showNotification('حدث خطأ أثناء تحميل إدارة الفيديوهات', 'error');
    } finally {
        const videosLoading = document.getElementById('videos-loading');
        if (videosLoading) videosLoading.style.display = 'none';
    }
}

// Populate videos table
function populateVideosTable(videos) {
    const tableBody = document.getElementById('videos-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (videos.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="7" class="text-center">لا توجد فيديوهات</td>';
        tableBody.appendChild(row);
        return;
    }
    
    videos.forEach(video => {
        const row = document.createElement('tr');
        
        const titleCell = document.createElement('td');
        titleCell.textContent = video.title || 'غير محدد';
        
        const instructorCell = document.createElement('td');
        instructorCell.textContent = video.instructor || 'غير محدد';
        
        const subjectCell = document.createElement('td');
        subjectCell.textContent = getSubjectDisplayName(video.subject);
        
        const levelCell = document.createElement('td');
        levelCell.textContent = getLevelDisplayName(video.level);
        
        const viewsCell = document.createElement('td');
        viewsCell.textContent = (video.views || 0).toLocaleString('ar');
        
        const dateCell = document.createElement('td');
        if (video.createdAt && video.createdAt.toDate) {
            dateCell.textContent = video.createdAt.toDate().toLocaleDateString('ar-SA');
        } else {
            dateCell.textContent = 'غير محدد';
        }
        
        const actionsCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-secondary btn-small';
        deleteButton.textContent = 'حذف';
        deleteButton.style.backgroundColor = '#dc3545';
        deleteButton.addEventListener('click', () => confirmDeleteVideo(video));
        
        actionsCell.appendChild(deleteButton);
        
        row.appendChild(titleCell);
        row.appendChild(instructorCell);
        row.appendChild(subjectCell);
        row.appendChild(levelCell);
        row.appendChild(viewsCell);
        row.appendChild(dateCell);
        row.appendChild(actionsCell);
        
        tableBody.appendChild(row);
    });
}

// Setup video upload form
function setupVideoUploadForm() {
    const uploadForm = document.getElementById('add-video-form');
    if (!uploadForm) return;
    
    uploadForm.addEventListener('submit', handleVideoUpload);
}

// Handle video upload
async function handleVideoUpload(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = {
        title: form['video-title'].value.trim(),
        description: form['video-description'].value.trim(),
        instructor: form['video-instructor'].value.trim(),
        subject: form['video-subject'].value,
        level: form['video-level'].value
    };
    
    const videoFile = form['video-file'].files[0];
    const thumbnailFile = form['video-thumbnail'].files[0];
    
    // Validation
    if (!formData.title) {
        showNotification('يرجى إدخال عنوان الفيديو', 'error');
        return;
    }
    
    if (!formData.subject) {
        showNotification('يرجى اختيار المادة', 'error');
        return;
    }
    
    if (!formData.level) {
        showNotification('يرجى اختيار المستوى', 'error');
        return;
    }
    
    if (!videoFile) {
        showNotification('يرجى اختيار ملف الفيديو', 'error');
        return;
    }
    
    // Validate video file
    if (!videoFile.type.startsWith('video/')) {
        showNotification('يرجى اختيار ملف فيديو صحيح', 'error');
        return;
    }
    
    if (videoFile.size > 100 * 1024 * 1024) { // 100MB
        showNotification('حجم الفيديو يجب أن يكون أقل من 100 ميجابايت', 'error');
        return;
    }
    
    try {
        const uploadBtn = document.getElementById('upload-video-btn');
        const progressContainer = document.getElementById('upload-progress');
        const progressFill = document.getElementById('upload-progress-fill');
        const progressText = document.getElementById('upload-progress-text');
        
        // Disable form and show progress
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'جاري الرفع...';
        progressContainer.style.display = 'block';
        
        // Upload video file
        const videoResult = await uploadVideoFile(videoFile, {
            title: formData.title,
            subject: formData.subject,
            level: formData.level,
            uploadedBy: window.currentUser.uid
        }, (progress) => {
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
        });
        
        let thumbnailUrl = null;
        
        // Upload thumbnail if provided
        if (thumbnailFile) {
            uploadBtn.textContent = 'جاري رفع الصورة المصغرة...';
            progressFill.style.width = '0%';
            progressText.textContent = '0%';
            
            thumbnailUrl = await uploadVideoThumbnail(thumbnailFile, 'temp_id', (progress) => {
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `${progress}%`;
            });
        }
        
        // Create video document
        uploadBtn.textContent = 'جاري حفظ البيانات...';
        
        const videoData = {
            ...formData,
            videoUrl: videoResult.url,
            videoPath: videoResult.path,
            thumbnailUrl: thumbnailUrl,
            uploadedBy: window.currentUser.uid,
            uploadedByName: window.currentUser.displayName || window.currentUser.email
        };
        
        const videoId = await createVideoDocument(videoData);
        
        // Reset form
        form.reset();
        progressContainer.style.display = 'none';
        
        showNotification('تم رفع الفيديو بنجاح!', 'success');
        
        // Refresh videos list if on manage tab
        if (currentAdminTab === 'manage') {
            await loadVideosManagement();
        }
        
        // Update stats
        await loadContentSection();
        
    } catch (error) {
        console.error('Error uploading video:', error);
        showNotification('حدث خطأ أثناء رفع الفيديو', 'error');
    } finally {
        const uploadBtn = document.getElementById('upload-video-btn');
        const progressContainer = document.getElementById('upload-progress');
        
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'رفع الفيديو';
        progressContainer.style.display = 'none';
    }
}

// Confirm delete video
function confirmDeleteVideo(video) {
    if (confirm(`هل أنت متأكد من حذف الفيديو "${video.title}"؟\nلا يمكن التراجع عن هذا الإجراء.`)) {
        deleteVideo(video);
    }
}

// Delete video
async function deleteVideo(video) {
    try {
        showLoading();
        
        // Delete video file from storage
        if (video.videoPath) {
            await deleteFile(video.videoPath);
        }
        
        // Delete thumbnail from storage
        if (video.thumbnailUrl && video.thumbnailUrl.includes('firebase')) {
            try {
                const thumbnailPath = extractPathFromUrl(video.thumbnailUrl);
                if (thumbnailPath) {
                    await deleteFile(thumbnailPath);
                }
            } catch (error) {
                console.warn('Error deleting thumbnail:', error);
            }
        }
        
        // Delete video document
        await deleteVideoDocument(video.id);
        
        showNotification('تم حذف الفيديو بنجاح', 'success');
        
        // Refresh videos list
        await loadVideosManagement();
        await loadContentSection();
        
    } catch (error) {
        console.error('Error deleting video:', error);
        showNotification('حدث خطأ أثناء حذف الفيديو', 'error');
    } finally {
        hideLoading();
    }
}

// Load analytics section
async function loadAnalyticsSection() {
    try {
        const analyticsData = await getAnalyticsData();
        updateAnalyticsStats(analyticsData);
        // TODO: Implement charts
    } catch (error) {
        console.error('Error loading analytics section:', error);
        throw error;
    }
}

// Update analytics statistics
function updateAnalyticsStats(data) {
    const totalViewsElement = document.getElementById('analytics-total-views');
    const avgWatchTimeElement = document.getElementById('avg-watch-time');
    const mostWatchedElement = document.getElementById('most-watched');
    
    if (totalViewsElement) {
        totalViewsElement.textContent = data.totalViews.toLocaleString('ar');
    }
    
    if (avgWatchTimeElement) {
        avgWatchTimeElement.textContent = '15 دقيقة'; // Placeholder
    }
    
    if (mostWatchedElement) {
        mostWatchedElement.textContent = 'مقدمة في الجبر'; // Placeholder
    }
}

// Load analytics
async function loadAnalytics() {
    try {
        const analyticsData = await getAnalyticsData();
        
        // Update dashboard stats
        const totalUsersElement = document.getElementById('total-users');
        const totalVideosElement = document.getElementById('total-videos');
        const totalViewsElement = document.getElementById('total-views');
        
        if (totalUsersElement) {
            totalUsersElement.textContent = analyticsData.totalUsers.toLocaleString('ar');
        }
        
        if (totalVideosElement) {
            totalVideosElement.textContent = analyticsData.totalVideos.toLocaleString('ar');
        }
        
        if (totalViewsElement) {
            totalViewsElement.textContent = analyticsData.totalViews.toLocaleString('ar');
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Load settings section
function loadSettingsSection() {
    const settingsForm = document.getElementById('site-settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleSettingsUpdate);
    }
}

// Handle settings update
function handleSettingsUpdate(event) {
    event.preventDefault();
    showNotification('تم حفظ الإعدادات بنجاح', 'success');
}

// Open user edit modal
function openUserEditModal(user) {
    const newRole = prompt(`تعديل دور المستخدم: ${user.displayName}\nالدور الحالي: ${getRoleDisplayName(user.role)}\n\nأدخل الدور الجديد (student/admin):`, user.role);
    
    if (newRole && (newRole === 'student' || newRole === 'admin')) {
        updateUserRole(user.id, newRole);
    } else if (newRole) {
        showNotification('دور غير صحيح. استخدم student أو admin', 'error');
    }
}

// Update user role
async function updateUserRole(userId, newRole) {
    try {
        showLoading();
        await updateUserData(userId, { role: newRole });
        showNotification('تم تحديث دور المستخدم بنجاح', 'success');
        await loadUsersSection();
    } catch (error) {
        console.error('Error updating user role:', error);
        showNotification('حدث خطأ أثناء تحديث دور المستخدم', 'error');
    } finally {
        hideLoading();
    }
}

// Utility functions
function getSectionDisplayName(section) {
    const sections = {
        'users': 'المستخدمين',
        'content': 'المحتوى',
        'analytics': 'التحليلات',
        'settings': 'الإعدادات'
    };
    return sections[section] || section;
}

function getRoleDisplayName(role) {
    const roles = {
        'student': 'طالب',
        'admin': 'مدير',
        'instructor': 'مدرس'
    };
    return roles[role] || role || 'غير محدد';
}

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
    return subjects[subject] || subject || 'غير محدد';
}

function getLevelDisplayName(level) {
    const levels = {
        'middle': 'متوسط',
        'high': 'ثانوي',
        'university': 'جامعي'
    };
    return levels[level] || level || 'غير محدد';
}

function extractPathFromUrl(url) {
    try {
        const decodedUrl = decodeURIComponent(url);
        const match = decodedUrl.match(/\/o\/(.+?)\?/);
        return match ? match[1] : null;
    } catch (error) {
        console.error('Error extracting path from URL:', error);
        return null;
    }
}

console.log('Admin dashboard module initialized');
