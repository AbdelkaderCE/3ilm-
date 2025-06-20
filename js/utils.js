// Utility functions

// Show loading state
export function showLoading(target = null) {
    if (target) {
        // Show loading on specific element
        target.style.position = 'relative';
        
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
            </div>
        `;
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(20, 20, 20, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        target.appendChild(overlay);
    } else {
        // Show global loading
        let loadingOverlay = document.getElementById('global-loading');
        
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'global-loading';
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>جاري التحميل...</p>
                </div>
            `;
            loadingOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(20, 20, 20, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;
            document.body.appendChild(loadingOverlay);
        } else {
            loadingOverlay.style.display = 'flex';
        }
    }
}

// Hide loading state
export function hideLoading(target = null) {
    if (target) {
        // Hide loading on specific element
        const overlay = target.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    } else {
        // Hide global loading
        const loadingOverlay = document.getElementById('global-loading');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
}

// Email validation
export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Password validation
export function validatePassword(password) {
    const result = {
        isValid: true,
        message: '',
        score: 0
    };
    
    if (!password) {
        result.isValid = false;
        result.message = 'كلمة المرور مطلوبة';
        return result;
    }
    
    if (password.length < 6) {
        result.isValid = false;
        result.message = 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل';
        return result;
    }
    
    if (password.length < 8) {
        result.score = 1;
        result.message = 'كلمة مرور ضعيفة - استخدم 8 أحرف على الأقل';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        result.score = 2;
        result.message = 'كلمة مرور متوسطة - استخدم أحرف كبيرة وصغيرة وأرقام';
    } else if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
        result.score = 3;
        result.message = 'كلمة مرور جيدة - أضف رموز خاصة لتحسينها';
    } else {
        result.score = 4;
        result.message = 'كلمة مرور قوية';
    }
    
    return result;
}

// Format file size
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 بايت';
    
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت', 'تيرابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format duration (seconds to MM:SS or HH:MM:SS)
export function formatDuration(seconds) {
    if (!seconds || seconds < 0) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

// Format number with Arabic locale
export function formatNumber(number) {
    if (typeof number !== 'number') return '0';
    
    return number.toLocaleString('ar-SA', {
        maximumFractionDigits: 0
    });
}

// Format relative time (e.g., "منذ دقيقتين")
export function formatRelativeTime(date) {
    if (!date) return '';
    
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    if (seconds < 30) {
        return 'الآن';
    } else if (seconds < 60) {
        return 'منذ أقل من دقيقة';
    } else if (minutes === 1) {
        return 'منذ دقيقة واحدة';
    } else if (minutes === 2) {
        return 'منذ دقيقتين';
    } else if (minutes < 60) {
        return `منذ ${minutes} دقيقة`;
    } else if (hours === 1) {
        return 'منذ ساعة واحدة';
    } else if (hours === 2) {
        return 'منذ ساعتين';
    } else if (hours < 24) {
        return `منذ ${hours} ساعة`;
    } else if (days === 1) {
        return 'منذ يوم واحد';
    } else if (days === 2) {
        return 'منذ يومين';
    } else if (days < 7) {
        return `منذ ${days} أيام`;
    } else if (days < 30) {
        const weeks = Math.floor(days / 7);
        return weeks === 1 ? 'منذ أسبوع واحد' : weeks === 2 ? 'منذ أسبوعين' : `منذ ${weeks} أسابيع`;
    } else if (months === 1) {
        return 'منذ شهر واحد';
    } else if (months === 2) {
        return 'منذ شهرين';
    } else if (months < 12) {
        return `منذ ${months} أشهر`;
    } else if (years === 1) {
        return 'منذ سنة واحدة';
    } else if (years === 2) {
        return 'منذ سنتين';
    } else {
        return `منذ ${years} سنوات`;
    }
}

// Debounce function
export function debounce(func, wait, immediate = false) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        
        if (callNow) func(...args);
    };
}

// Throttle function
export function throttle(func, limit) {
    let inThrottle;
    
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Deep clone object
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

// Generate random ID
export function generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
}

// Sanitize string for use as CSS class or ID
export function sanitizeString(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

// Check if element is in viewport
export function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Smooth scroll to element
export function scrollToElement(element, offset = 0) {
    if (!element) return;
    
    const elementPosition = element.offsetTop - offset;
    
    window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
    });
}

// Get query parameter
export function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Set query parameter
export function setQueryParam(name, value) {
    const url = new URL(window.location);
    url.searchParams.set(name, value);
    window.history.pushState({}, '', url);
}

// Copy text to clipboard
export async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            textArea.remove();
        }
        
        showNotification('تم النسخ إلى الحافظة', 'success');
        return true;
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        showNotification('فشل في النسخ إلى الحافظة', 'error');
        return false;
    }
}

// Local storage helpers
export const storage = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    },
    
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    },
    
    clear: () => {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
};

// Device detection
export const device = {
    isMobile: () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isTablet: () => /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent),
    isDesktop: () => !device.isMobile() && !device.isTablet(),
    
    getScreenSize: () => {
        const width = window.innerWidth;
        
        if (width < 576) return 'xs';
        if (width < 768) return 'sm';
        if (width < 992) return 'md';
        if (width < 1200) return 'lg';
        return 'xl';
    }
};

// Network status
export const network = {
    isOnline: () => navigator.onLine,
    
    onStatusChange: (callback) => {
        window.addEventListener('online', () => callback(true));
        window.addEventListener('offline', () => callback(false));
    }
};

// Performance monitoring
export const performance = {
    measureFunction: (func, name) => {
        return async (...args) => {
            const start = performance.now();
            const result = await func(...args);
            const end = performance.now();
            console.log(`${name} took ${end - start} milliseconds`);
            return result;
        };
    },
    
    measurePageLoad: () => {
        window.addEventListener('load', () => {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            console.log(`Page load time: ${loadTime}ms`);
        });
    }
};

// Error handling
export function handleError(error, context = '') {
    console.error(`Error in ${context}:`, error);
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
        // TODO: Send to error tracking service
    }
    
    // Show user-friendly message
    if (error.code === 'auth/network-request-failed') {
        showNotification('مشكلة في الاتصال بالإنترنت', 'error');
    } else if (error.code === 'permission-denied') {
        showNotification('ليس لديك صلاحية لهذا الإجراء', 'error');
    } else {
        showNotification('حدث خطأ غير متوقع', 'error');
    }
}

console.log('Utils module initialized');
