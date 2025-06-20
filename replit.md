# 3ilm+ Educational Streaming Platform

## Overview

3ilm+ is an educational streaming platform designed specifically for Algerian students across university, high school, and middle school levels. The platform features a modern, Netflix-like dark interface with a blue accent color scheme, providing an engaging video learning experience with user authentication, content management, and administrative capabilities.

## System Architecture

### Frontend Architecture
- **Static File Serving**: Pure HTML/CSS/JavaScript frontend served by a custom Python HTTP server
- **Modular JavaScript Design**: ES6 modules for different functionalities (auth, video player, admin dashboard, etc.)
- **Responsive Design**: Mobile-first approach with flexbox and grid layouts
- **Component-Based CSS**: Organized into base styles, layout components, and page-specific styles

### Backend Architecture
- **Custom Python HTTP Server**: Simple HTTP server (`server.py`) with enhanced security headers and routing
- **Firebase Integration**: Complete Firebase ecosystem integration including:
  - Firebase Authentication (email/password and Google Sign-in)
  - Cloud Firestore for data storage
  - Cloud Storage for video and file uploads
  - Potential Cloud Functions for server-side logic

### Database Design (Firestore)
- **Users Collection**: User profiles, roles (student/admin), preferences, and metadata
- **Videos Collection**: Video metadata, thumbnails, descriptions, subjects, and levels
- **Comments Collection**: User comments on videos with moderation capabilities
- **Analytics Collection**: Usage statistics and learning progress tracking

## Key Components

### Authentication System
- Email/password authentication
- Google OAuth integration
- Role-based access control (student/admin)
- Protected route handling with automatic redirects

### Video Management
- Video upload and storage via Firebase Storage
- Metadata management through Firestore
- Video player with custom controls and progress tracking
- Related content suggestions and playlist functionality

### User Profile Management
- Personal information updates
- Password changes with re-authentication
- Watch history tracking
- Watchlist functionality
- Avatar upload with image compression

### Admin Dashboard
- User management and role assignment
- Content upload and moderation
- Analytics and reporting
- System settings and configuration

### Search and Discovery
- Real-time search with debouncing
- Content categorization by subject and level
- Popular and recent content recommendations
- Personalized content suggestions

## Data Flow

1. **User Authentication**: Users authenticate via Firebase Auth, with user data stored in Firestore
2. **Content Discovery**: Homepage loads categorized content from Firestore based on user preferences
3. **Video Streaming**: Videos are served from Firebase Storage with metadata from Firestore
4. **Progress Tracking**: Watch history and progress are updated in real-time to Firestore
5. **Admin Operations**: Administrative actions modify Firestore documents and Storage objects
6. **Search Operations**: Search queries filter Firestore collections based on metadata

## External Dependencies

### Firebase Services
- **Firebase Authentication**: User authentication and authorization
- **Cloud Firestore**: NoSQL document database for all application data
- **Cloud Storage**: File storage for videos, thumbnails, and user uploads
- **Firebase Hosting**: Potential hosting solution (currently using custom Python server)

### Frontend Libraries
- **Google Fonts**: Roboto font family for consistent typography
- **Firebase SDK**: Version 10.0.0 for all Firebase integrations
- **Native Web APIs**: Video API, File API, Fetch API for core functionality

### Development Tools
- **Python HTTP Server**: Custom server with CORS support and security headers
- **ES6 Modules**: Modern JavaScript module system for code organization

## Deployment Strategy

### Current Setup
- **Development Server**: Python HTTP server serving static files on port 5000
- **Firebase Configuration**: Project configured with all necessary services enabled
- **Environment Variables**: Firebase configuration can be managed via environment variables

### Production Considerations
- **Firebase Hosting**: Recommended for production deployment
- **CDN Integration**: Firebase Storage provides global CDN for video content
- **Database Scaling**: Firestore handles automatic scaling and replication
- **Security Rules**: Firestore security rules needed for data protection

### Deployment Process
1. Configure Firebase project with production settings
2. Deploy static files to Firebase Hosting or alternative CDN
3. Set up Firestore security rules for data access control
4. Configure Cloud Storage CORS and access policies
5. Implement proper environment variable management

## Changelog
- June 20, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.