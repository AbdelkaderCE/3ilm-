// Comments system for videos
import { addComment, getVideoComments, deleteComment } from './firestore.js';
import { showNotification, showLoading, hideLoading, formatRelativeTime } from './utils.js';

let currentVideoId = null;
let comments = [];

// Initialize comments system
export async function initializeComments() {
    const urlParams = new URLSearchParams(window.location.search);
    currentVideoId = urlParams.get('id');
    
    if (!currentVideoId) {
        console.error('No video ID found for comments');
        return;
    }
    
    try {
        await loadComments();
        setupCommentForm();
    } catch (error) {
        console.error('Error initializing comments:', error);
        showCommentsError();
    }
}

// Load comments for current video
async function loadComments() {
    const commentsLoading = document.getElementById('comments-loading');
    const commentsList = document.getElementById('comments-list');
    const noComments = document.getElementById('no-comments');
    
    try {
        if (commentsLoading) commentsLoading.style.display = 'flex';
        if (noComments) noComments.style.display = 'none';
        
        comments = await getVideoComments(currentVideoId);
        
        if (commentsList) {
            commentsList.innerHTML = '';
            
            if (comments.length === 0) {
                if (noComments) noComments.style.display = 'block';
                return;
            }
            
            comments.forEach(comment => {
                const commentElement = createCommentElement(comment);
                commentsList.appendChild(commentElement);
            });
        }
        
    } catch (error) {
        console.error('Error loading comments:', error);
        showCommentsError();
    } finally {
        if (commentsLoading) commentsLoading.style.display = 'none';
    }
}

// Setup comment form
function setupCommentForm() {
    const postCommentBtn = document.getElementById('post-comment-btn');
    const commentText = document.getElementById('comment-text');
    const commentInputSection = document.getElementById('comment-input-section');
    
    // Show/hide comment form based on auth status
    if (commentInputSection) {
        if (window.currentUser) {
            commentInputSection.style.display = 'flex';
        } else {
            commentInputSection.style.display = 'none';
            
            // Add login prompt
            const loginPrompt = document.createElement('div');
            loginPrompt.className = 'empty-state';
            loginPrompt.innerHTML = `
                <p>يجب <a href="login.html">تسجيل الدخول</a> لإضافة تعليق</p>
            `;
            commentInputSection.parentNode.insertBefore(loginPrompt, commentInputSection);
        }
    }
    
    if (postCommentBtn && commentText) {
        postCommentBtn.addEventListener('click', handlePostComment);
        
        // Handle Enter key (with Shift+Enter for new line)
        commentText.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handlePostComment();
            }
        });
        
        // Auto-resize textarea
        commentText.addEventListener('input', () => {
            commentText.style.height = 'auto';
            commentText.style.height = commentText.scrollHeight + 'px';
        });
    }
}

// Handle posting a comment
async function handlePostComment() {
    if (!window.currentUser) {
        showNotification('يجب تسجيل الدخول لإضافة تعليق', 'warning');
        return;
    }
    
    const commentText = document.getElementById('comment-text');
    const postCommentBtn = document.getElementById('post-comment-btn');
    
    if (!commentText || !postCommentBtn) return;
    
    const text = commentText.value.trim();
    
    if (!text) {
        showNotification('يرجى كتابة تعليق', 'error');
        commentText.focus();
        return;
    }
    
    if (text.length > 500) {
        showNotification('التعليق طويل جداً (الحد الأقصى 500 حرف)', 'error');
        return;
    }
    
    try {
        // Disable form
        postCommentBtn.disabled = true;
        postCommentBtn.textContent = 'جاري النشر...';
        commentText.disabled = true;
        
        // Post comment
        const commentId = await addComment(currentVideoId, window.currentUser.uid, text);
        
        // Clear form
        commentText.value = '';
        commentText.style.height = 'auto';
        
        // Show success message
        showNotification('تم نشر التعليق بنجاح', 'success');
        
        // Reload comments to show the new one
        await loadComments();
        
    } catch (error) {
        console.error('Error posting comment:', error);
        showNotification('حدث خطأ أثناء نشر التعليق', 'error');
    } finally {
        // Re-enable form
        postCommentBtn.disabled = false;
        postCommentBtn.textContent = 'نشر التعليق';
        commentText.disabled = false;
        commentText.focus();
    }
}

// Create comment element
function createCommentElement(comment) {
    const commentItem = document.createElement('div');
    commentItem.className = 'comment-item';
    commentItem.setAttribute('data-comment-id', comment.id);
    
    // Comment header with author and date
    const commentHeader = document.createElement('div');
    commentHeader.style.display = 'flex';
    commentHeader.style.justifyContent = 'space-between';
    commentHeader.style.alignItems = 'center';
    commentHeader.style.marginBottom = '0.5rem';
    
    const authorInfo = document.createElement('div');
    authorInfo.style.display = 'flex';
    authorInfo.style.alignItems = 'center';
    authorInfo.style.gap = '0.5rem';
    
    // User avatar (if available)
    if (comment.user.photoURL) {
        const avatar = document.createElement('img');
        avatar.src = comment.user.photoURL;
        avatar.alt = 'صورة المستخدم';
        avatar.style.width = '24px';
        avatar.style.height = '24px';
        avatar.style.borderRadius = '50%';
        avatar.style.objectFit = 'cover';
        authorInfo.appendChild(avatar);
    }
    
    const authorName = document.createElement('span');
    authorName.className = 'comment-author';
    authorName.textContent = comment.user.displayName || 'مستخدم';
    authorInfo.appendChild(authorName);
    
    const commentActions = document.createElement('div');
    commentActions.style.display = 'flex';
    commentActions.style.gap = '0.5rem';
    commentActions.style.alignItems = 'center';
    
    // Comment date
    const commentDate = document.createElement('span');
    commentDate.className = 'comment-date';
    if (comment.createdAt && comment.createdAt.toDate) {
        commentDate.textContent = formatRelativeTime(comment.createdAt.toDate());
    } else {
        commentDate.textContent = 'الآن';
    }
    commentActions.appendChild(commentDate);
    
    // Delete button (only for comment owner or admin)
    if (window.currentUser && 
        (comment.userId === window.currentUser.uid || window.isAdmin)) {
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'حذف';
        deleteBtn.className = 'btn btn-flat';
        deleteBtn.style.fontSize = '0.8rem';
        deleteBtn.style.padding = '0.25rem 0.5rem';
        deleteBtn.style.color = '#dc3545';
        deleteBtn.addEventListener('click', () => handleDeleteComment(comment.id));
        commentActions.appendChild(deleteBtn);
    }
    
    commentHeader.appendChild(authorInfo);
    commentHeader.appendChild(commentActions);
    
    // Comment text
    const commentTextElement = document.createElement('p');
    commentTextElement.className = 'comment-text';
    commentTextElement.textContent = comment.text;
    
    // Make links clickable and safe
    commentTextElement.innerHTML = linkifyText(escapeHtml(comment.text));
    
    commentItem.appendChild(commentHeader);
    commentItem.appendChild(commentTextElement);
    
    return commentItem;
}

// Handle deleting a comment
async function handleDeleteComment(commentId) {
    if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) {
        return;
    }
    
    try {
        showLoading();
        await deleteComment(commentId, window.currentUser.uid);
        showNotification('تم حذف التعليق', 'success');
        
        // Remove comment from DOM
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement) {
            commentElement.remove();
        }
        
        // Update comments array
        comments = comments.filter(comment => comment.id !== commentId);
        
        // Show no comments message if list is now empty
        if (comments.length === 0) {
            const noComments = document.getElementById('no-comments');
            if (noComments) noComments.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error deleting comment:', error);
        if (error.message.includes('Unauthorized')) {
            showNotification('ليس لديك صلاحية لحذف هذا التعليق', 'error');
        } else {
            showNotification('حدث خطأ أثناء حذف التعليق', 'error');
        }
    } finally {
        hideLoading();
    }
}

// Show comments error state
function showCommentsError() {
    const commentsList = document.getElementById('comments-list');
    const noComments = document.getElementById('no-comments');
    
    if (commentsList) {
        commentsList.innerHTML = `
            <div class="empty-state">
                <p style="color: #dc3545;">حدث خطأ أثناء تحميل التعليقات</p>
                <button class="btn btn-secondary btn-small" onclick="location.reload()">إعادة تحميل</button>
            </div>
        `;
    }
    
    if (noComments) {
        noComments.style.display = 'none';
    }
}

// Utility function to escape HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Utility function to linkify text (basic implementation)
function linkifyText(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
}

// Auto-refresh comments periodically (optional)
let commentsRefreshInterval = null;

export function startCommentsAutoRefresh(intervalMs = 60000) {
    if (commentsRefreshInterval) {
        clearInterval(commentsRefreshInterval);
    }
    
    commentsRefreshInterval = setInterval(async () => {
        try {
            const newComments = await getVideoComments(currentVideoId);
            
            // Only update if there are new comments
            if (newComments.length > comments.length) {
                await loadComments();
            }
        } catch (error) {
            console.error('Error auto-refreshing comments:', error);
        }
    }, intervalMs);
}

export function stopCommentsAutoRefresh() {
    if (commentsRefreshInterval) {
        clearInterval(commentsRefreshInterval);
        commentsRefreshInterval = null;
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopCommentsAutoRefresh();
});

console.log('Comments module initialized');
