// Firebase Storage operations
import { app } from './main.js';
import {
    getStorage,
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    listAll,
    getMetadata
} from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js';

// Initialize Storage
const storage = getStorage(app);

// Upload progress callback type
const DEFAULT_PROGRESS_CALLBACK = (progress) => {
    console.log(`Upload progress: ${progress}%`);
};

// Upload user avatar
export async function uploadUserAvatar(userId, file, progressCallback = DEFAULT_PROGRESS_CALLBACK) {
    try {
        // Validate file
        if (!file) {
            throw new Error('No file provided');
        }
        
        if (!file.type.startsWith('image/')) {
            throw new Error('File must be an image');
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            throw new Error('File size must be less than 5MB');
        }
        
        // Create storage reference
        const fileName = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `avatars/${userId}/${fileName}`);
        
        // Upload file
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    progressCallback(Math.round(progress));
                },
                (error) => {
                    console.error('Upload failed:', error);
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        console.log('Avatar upload completed:', downloadURL);
                        resolve(downloadURL);
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        throw error;
    }
}

// Upload video file
export async function uploadVideoFile(file, metadata = {}, progressCallback = DEFAULT_PROGRESS_CALLBACK) {
    try {
        // Validate file
        if (!file) {
            throw new Error('No file provided');
        }
        
        if (!file.type.startsWith('video/')) {
            throw new Error('File must be a video');
        }
        
        if (file.size > 100 * 1024 * 1024) { // 100MB limit
            throw new Error('Video file size must be less than 100MB');
        }
        
        // Create storage reference
        const fileName = `${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `videos/${fileName}`);
        
        // Set metadata
        const uploadMetadata = {
            contentType: file.type,
            customMetadata: {
                ...metadata,
                uploadedAt: new Date().toISOString()
            }
        };
        
        // Upload file
        const uploadTask = uploadBytesResumable(storageRef, file, uploadMetadata);
        
        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    progressCallback(Math.round(progress));
                },
                (error) => {
                    console.error('Video upload failed:', error);
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        console.log('Video upload completed:', downloadURL);
                        resolve({
                            url: downloadURL,
                            path: uploadTask.snapshot.ref.fullPath,
                            name: fileName
                        });
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    } catch (error) {
        console.error('Error uploading video:', error);
        throw error;
    }
}

// Upload video thumbnail
export async function uploadVideoThumbnail(file, videoId, progressCallback = DEFAULT_PROGRESS_CALLBACK) {
    try {
        // Validate file
        if (!file) {
            throw new Error('No file provided');
        }
        
        if (!file.type.startsWith('image/')) {
            throw new Error('File must be an image');
        }
        
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            throw new Error('Thumbnail size must be less than 2MB');
        }
        
        // Create storage reference
        const fileName = `thumbnail_${videoId}_${Date.now()}.jpg`;
        const storageRef = ref(storage, `thumbnails/${fileName}`);
        
        // Upload file
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    progressCallback(Math.round(progress));
                },
                (error) => {
                    console.error('Thumbnail upload failed:', error);
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        console.log('Thumbnail upload completed:', downloadURL);
                        resolve(downloadURL);
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    } catch (error) {
        console.error('Error uploading thumbnail:', error);
        throw error;
    }
}

// Delete file from storage
export async function deleteFile(filePath) {
    try {
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
        console.log('File deleted successfully:', filePath);
        return true;
    } catch (error) {
        if (error.code === 'storage/object-not-found') {
            console.log('File not found, already deleted:', filePath);
            return true;
        }
        console.error('Error deleting file:', error);
        throw error;
    }
}

// Get file metadata
export async function getFileMetadata(filePath) {
    try {
        const fileRef = ref(storage, filePath);
        const metadata = await getMetadata(fileRef);
        return metadata;
    } catch (error) {
        console.error('Error getting file metadata:', error);
        throw error;
    }
}

// List files in a directory
export async function listFiles(directoryPath) {
    try {
        const directoryRef = ref(storage, directoryPath);
        const result = await listAll(directoryRef);
        
        const files = await Promise.all(
            result.items.map(async (itemRef) => {
                const url = await getDownloadURL(itemRef);
                const metadata = await getMetadata(itemRef);
                return {
                    name: itemRef.name,
                    fullPath: itemRef.fullPath,
                    url: url,
                    metadata: metadata
                };
            })
        );
        
        return files;
    } catch (error) {
        console.error('Error listing files:', error);
        throw error;
    }
}

// Generate thumbnail from video (client-side)
export function generateVideoThumbnail(videoFile, timeInSeconds = 1) {
    return new Promise((resolve, reject) => {
        try {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            video.addEventListener('loadeddata', () => {
                video.currentTime = timeInSeconds;
            });
            
            video.addEventListener('seeked', () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to generate thumbnail'));
                    }
                }, 'image/jpeg', 0.8);
            });
            
            video.addEventListener('error', () => {
                reject(new Error('Error loading video for thumbnail generation'));
            });
            
            video.src = URL.createObjectURL(videoFile);
            video.load();
        } catch (error) {
            reject(error);
        }
    });
}

// Compress image before upload
export function compressImage(file, maxWidth = 800, maxHeight = 600, quality = 0.8) {
    return new Promise((resolve, reject) => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to compress image'));
                    }
                }, 'image/jpeg', quality);
            };
            
            img.onerror = () => {
                reject(new Error('Error loading image for compression'));
            };
            
            img.src = URL.createObjectURL(file);
        } catch (error) {
            reject(error);
        }
    });
}

// Get storage usage for user
export async function getUserStorageUsage(userId) {
    try {
        const userAvatarsRef = ref(storage, `avatars/${userId}`);
        const avatarFiles = await listAll(userAvatarsRef);
        
        let totalSize = 0;
        for (const fileRef of avatarFiles.items) {
            const metadata = await getMetadata(fileRef);
            totalSize += metadata.size;
        }
        
        return {
            totalSize: totalSize,
            fileCount: avatarFiles.items.length,
            formattedSize: formatFileSize(totalSize)
        };
    } catch (error) {
        console.error('Error getting storage usage:', error);
        return {
            totalSize: 0,
            fileCount: 0,
            formattedSize: '0 B'
        };
    }
}

// Utility function to format file size
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Validate file type
export function validateFileType(file, allowedTypes) {
    if (!file || !file.type) {
        return { valid: false, message: 'Invalid file' };
    }
    
    const isAllowed = allowedTypes.some(type => file.type.startsWith(type));
    
    if (!isAllowed) {
        return {
            valid: false,
            message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
        };
    }
    
    return { valid: true, message: 'File type is valid' };
}

// Validate file size
export function validateFileSize(file, maxSizeInBytes) {
    if (!file) {
        return { valid: false, message: 'No file provided' };
    }
    
    if (file.size > maxSizeInBytes) {
        return {
            valid: false,
            message: `File size too large. Maximum size: ${formatFileSize(maxSizeInBytes)}`
        };
    }
    
    return { valid: true, message: 'File size is valid' };
}

console.log('Storage module initialized');

