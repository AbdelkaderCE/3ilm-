// Firestore database operations
import { app } from './main.js';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    addDoc,
    serverTimestamp,
    increment,
    arrayUnion,
    arrayRemove,
    writeBatch
} from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';

// Initialize Firestore
const db = getFirestore(app);

// User operations
export async function createUserDocument(userId, userData) {
    try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            ...userData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        console.log('User document created successfully');
        return true;
    } catch (error) {
        console.error('Error creating user document:', error);
        throw error;
    }
}

export async function getUserData(userId) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            return { id: userSnap.id, ...userSnap.data() };
        } else {
            console.log('No user document found');
            return null;
        }
    } catch (error) {
        console.error('Error getting user data:', error);
        throw error;
    }
}

export async function updateUserData(userId, updates) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        console.log('User data updated successfully');
        return true;
    } catch (error) {
        console.error('Error updating user data:', error);
        throw error;
    }
}

export async function getAllUsers() {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        
        return users;
    } catch (error) {
        console.error('Error getting all users:', error);
        throw error;
    }
}

// Video operations
export async function createVideoDocument(videoData) {
    try {
        const videosRef = collection(db, 'videos');
        const docRef = await addDoc(videosRef, {
            ...videoData,
            views: 0,
            likes: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        console.log('Video document created with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error creating video document:', error);
        throw error;
    }
}

export async function getVideoData(videoId) {
    try {
        const videoRef = doc(db, 'videos', videoId);
        const videoSnap = await getDoc(videoRef);
        
        if (videoSnap.exists()) {
            return { id: videoSnap.id, ...videoSnap.data() };
        } else {
            console.log('No video document found');
            return null;
        }
    } catch (error) {
        console.error('Error getting video data:', error);
        throw error;
    }
}

export async function getVideosBySubject(subject, limitCount = 10) {
    try {
        const videosRef = collection(db, 'videos');
        const q = query(
            videosRef,
            where('subject', '==', subject),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);
        
        const videos = [];
        querySnapshot.forEach((doc) => {
            videos.push({ id: doc.id, ...doc.data() });
        });
        
        return videos;
    } catch (error) {
        console.error('Error getting videos by subject:', error);
        throw error;
    }
}

export async function getVideosByLevel(level, limitCount = 10) {
    try {
        const videosRef = collection(db, 'videos');
        const q = query(
            videosRef,
            where('level', '==', level),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);
        
        const videos = [];
        querySnapshot.forEach((doc) => {
            videos.push({ id: doc.id, ...doc.data() });
        });
        
        return videos;
    } catch (error) {
        console.error('Error getting videos by level:', error);
        throw error;
    }
}

export async function getRecentVideos(limitCount = 10) {
    try {
        const videosRef = collection(db, 'videos');
        const q = query(
            videosRef,
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);
        
        const videos = [];
        querySnapshot.forEach((doc) => {
            videos.push({ id: doc.id, ...doc.data() });
        });
        
        return videos;
    } catch (error) {
        console.error('Error getting recent videos:', error);
        throw error;
    }
}

export async function getPopularVideos(limitCount = 10) {
    try {
        const videosRef = collection(db, 'videos');
        const q = query(
            videosRef,
            orderBy('views', 'desc'),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);
        
        const videos = [];
        querySnapshot.forEach((doc) => {
            videos.push({ id: doc.id, ...doc.data() });
        });
        
        return videos;
    } catch (error) {
        console.error('Error getting popular videos:', error);
        throw error;
    }
}

export async function getAllVideos() {
    try {
        const videosRef = collection(db, 'videos');
        const q = query(videosRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const videos = [];
        querySnapshot.forEach((doc) => {
            videos.push({ id: doc.id, ...doc.data() });
        });
        
        return videos;
    } catch (error) {
        console.error('Error getting all videos:', error);
        throw error;
    }
}

export async function searchVideos(searchTerm) {
    try {
        const videosRef = collection(db, 'videos');
        const querySnapshot = await getDocs(videosRef);
        
        const videos = [];
        const searchLower = searchTerm.toLowerCase();
        
        querySnapshot.forEach((doc) => {
            const videoData = { id: doc.id, ...doc.data() };
            const title = videoData.title?.toLowerCase() || '';
            const description = videoData.description?.toLowerCase() || '';
            const instructor = videoData.instructor?.toLowerCase() || '';
            const subject = videoData.subject?.toLowerCase() || '';
            
            if (title.includes(searchLower) || 
                description.includes(searchLower) || 
                instructor.includes(searchLower) || 
                subject.includes(searchLower)) {
                videos.push(videoData);
            }
        });
        
        return videos;
    } catch (error) {
        console.error('Error searching videos:', error);
        throw error;
    }
}

export async function updateVideoViews(videoId) {
    try {
        const videoRef = doc(db, 'videos', videoId);
        await updateDoc(videoRef, {
            views: increment(1),
            updatedAt: serverTimestamp()
        });
        console.log('Video views updated');
    } catch (error) {
        console.error('Error updating video views:', error);
        throw error;
    }
}

export async function deleteVideoDocument(videoId) {
    try {
        const videoRef = doc(db, 'videos', videoId);
        await deleteDoc(videoRef);
        console.log('Video document deleted');
        return true;
    } catch (error) {
        console.error('Error deleting video document:', error);
        throw error;
    }
}

// Watch history operations
export async function addToWatchHistory(userId, videoId, progress = 0) {
    try {
        const historyRef = collection(db, 'watchHistory');
        const q = query(
            historyRef,
            where('userId', '==', userId),
            where('videoId', '==', videoId)
        );
        const existing = await getDocs(q);
        
        if (!existing.empty) {
            // Update existing entry
            const docRef = existing.docs[0].ref;
            await updateDoc(docRef, {
                progress: progress,
                lastWatched: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        } else {
            // Create new entry
            await addDoc(historyRef, {
                userId: userId,
                videoId: videoId,
                progress: progress,
                lastWatched: serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
        
        console.log('Watch history updated');
    } catch (error) {
        console.error('Error updating watch history:', error);
        throw error;
    }
}

export async function getWatchHistory(userId, limitCount = 20) {
    try {
        const historyRef = collection(db, 'watchHistory');
        const q = query(
            historyRef,
            where('userId', '==', userId),
            orderBy('lastWatched', 'desc'),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);
        
        const history = [];
        for (const doc of querySnapshot.docs) {
            const historyData = { id: doc.id, ...doc.data() };
            // Get video data
            const videoData = await getVideoData(historyData.videoId);
            if (videoData) {
                history.push({
                    ...historyData,
                    video: videoData
                });
            }
        }
        
        return history;
    } catch (error) {
        console.error('Error getting watch history:', error);
        throw error;
    }
}

// Watchlist operations
export async function addToWatchlist(userId, videoId) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            watchlist: arrayUnion(videoId),
            updatedAt: serverTimestamp()
        });
        console.log('Video added to watchlist');
        return true;
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        throw error;
    }
}

export async function removeFromWatchlist(userId, videoId) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            watchlist: arrayRemove(videoId),
            updatedAt: serverTimestamp()
        });
        console.log('Video removed from watchlist');
        return true;
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        throw error;
    }
}

export async function getWatchlistVideos(userId) {
    try {
        const userData = await getUserData(userId);
        if (!userData || !userData.watchlist || userData.watchlist.length === 0) {
            return [];
        }
        
        const videos = [];
        for (const videoId of userData.watchlist) {
            const videoData = await getVideoData(videoId);
            if (videoData) {
                videos.push(videoData);
            }
        }
        
        return videos;
    } catch (error) {
        console.error('Error getting watchlist videos:', error);
        throw error;
    }
}

// Comments operations
export async function addComment(videoId, userId, commentText) {
    try {
        const commentsRef = collection(db, 'comments');
        const docRef = await addDoc(commentsRef, {
            videoId: videoId,
            userId: userId,
            text: commentText,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        console.log('Comment added with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error adding comment:', error);
        throw error;
    }
}

export async function getVideoComments(videoId, limitCount = 50) {
    try {
        const commentsRef = collection(db, 'comments');
        const q = query(
            commentsRef,
            where('videoId', '==', videoId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);
        
        const comments = [];
        for (const doc of querySnapshot.docs) {
            const commentData = { id: doc.id, ...doc.data() };
            // Get user data for the comment
            const userData = await getUserData(commentData.userId);
            if (userData) {
                comments.push({
                    ...commentData,
                    user: {
                        displayName: userData.displayName || 'مستخدم',
                        photoURL: userData.photoURL
                    }
                });
            }
        }
        
        return comments;
    } catch (error) {
        console.error('Error getting video comments:', error);
        throw error;
    }
}

export async function deleteComment(commentId, userId) {
    try {
        const commentRef = doc(db, 'comments', commentId);
        const commentSnap = await getDoc(commentRef);
        
        if (commentSnap.exists() && commentSnap.data().userId === userId) {
            await deleteDoc(commentRef);
            console.log('Comment deleted');
            return true;
        } else {
            throw new Error('Unauthorized to delete this comment');
        }
    } catch (error) {
        console.error('Error deleting comment:', error);
        throw error;
    }
}

// Analytics operations
export async function getAnalyticsData() {
    try {
        const [users, videos] = await Promise.all([
            getAllUsers(),
            getAllVideos()
        ]);
        
        const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);
        const thisMonth = new Date();
        thisMonth.setDate(1);
        
        const newUsersThisMonth = users.filter(user => 
            user.createdAt && user.createdAt.toDate() >= thisMonth
        ).length;
        
        const newVideosThisMonth = videos.filter(video => 
            video.createdAt && video.createdAt.toDate() >= thisMonth
        ).length;
        
        return {
            totalUsers: users.length,
            totalVideos: videos.length,
            totalViews: totalViews,
            newUsersThisMonth: newUsersThisMonth,
            newVideosThisMonth: newVideosThisMonth,
            activeUsers: users.filter(user => {
                const lastLogin = user.lastLoginAt;
                if (!lastLogin) return false;
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                return lastLogin.toDate() >= sevenDaysAgo;
            }).length
        };
    } catch (error) {
        console.error('Error getting analytics data:', error);
        throw error;
    }
}

// Batch operations
export async function batchUpdateVideos(updates) {
    try {
        const batch = writeBatch(db);
        
        updates.forEach(({ videoId, data }) => {
            const videoRef = doc(db, 'videos', videoId);
            batch.update(videoRef, {
                ...data,
                updatedAt: serverTimestamp()
            });
        });
        
        await batch.commit();
        console.log('Batch update completed');
        return true;
    } catch (error) {
        console.error('Error in batch update:', error);
        throw error;
    }
}

console.log('Firestore module initialized');

