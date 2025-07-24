# CBT Portal - Computer-Based Test System

## Overview

This is a comprehensive Computer-Based Test (CBT) portal designed for secondary schools, built with PHP, MySQL, and AJAX. The system supports three distinct user roles (Student, Teacher, Admin) with role-based access control and features real-time test management, automated grading, and detailed analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Migration to Replit Environment (July 24, 2025)
- ✓ Successfully migrated CBT Portal from Replit Agent to Replit environment
- ✓ Created and configured PostgreSQL database with complete schema
- ✓ Initialized all tables with sample data and proper relationships
- ✓ Fixed password hashing issue with proper PHP password_hash() implementation
- ✓ Verified PHP 8.3.23 server running on port 5000
- ✓ Confirmed JavaScript initialization and asset loading working correctly
- ✓ All user authentication now working with secure bcrypt password hashes

### Authentication Credentials
- Admin: username: `admin`, password: `admin123`
- Teachers: username: `teacher1`/`teacher2`, password: `teacher123`
- Students: username: `student1`/`student2`/`student3`, password: `student123`

### School Branding Implementation
- ✓ Added settings table for dynamic school information
- ✓ Configured school name: "SURE FOUNDATION COMPREHENSIVE SCHOOL"
- ✓ Configured school abbreviation: "SFGS"
- ✓ Updated all pages to use dynamic school settings
- ✓ Removed placeholder user guide content from all pages
- ✓ Login page and navigation now display proper school branding

### User Interface Improvements (July 24, 2025)
- ✓ Removed ALL user guide content from every page in the system
- ✓ Clean, professional interface without instructional clutter
- ✓ Added bulk delete functionality for teacher assignments
- ✓ Professional checkbox selection interface with enhanced CSS styling
- ✓ Bulk action buttons with animated appearance and count display
- ✓ Confirmation modal for bulk operations with detailed list
- ✓ Fixed PDO rowCount() method error in bulk delete operations
- ✓ Enhanced table selection with row highlighting and smooth animations

## Recent Changes

### Migration to Replit Environment (July 24, 2025)
- ✓ Successfully migrated CBT Portal from Replit Agent to Replit environment
- ✓ Created and configured PostgreSQL database with complete schema
- ✓ Initialized all tables with sample data and proper relationships
- ✓ Fixed password hashing issue with proper PHP password_hash() implementation
- ✓ Verified PHP 8.3.23 server running on port 5000
- ✓ Confirmed JavaScript initialization and asset loading working correctly
- ✓ All user authentication now working with secure bcrypt password hashes

### Authentication Credentials
- Admin: username: `admin`, password: `admin123`
- Teachers: username: `teacher1`/`teacher2`, password: `teacher123`
- Students: username: `student1`/`student2`/`student3`, password: `student123`

## System Architecture

### Frontend Architecture
- **Technology Stack**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5
- **AJAX Implementation**: Native XMLHttpRequest and Fetch API for real-time data exchange
- **UI Framework**: Bootstrap 5 with custom CSS variables for consistent theming
- **JavaScript Architecture**: Modular approach with specialized classes (TestTimer, form validation)

### Backend Architecture
- **Server-Side Language**: PHP 7.4+ with object-oriented programming patterns
- **Database**: MySQL with normalized schema design
- **Session Management**: PHP native sessions with role-based access control
- **API Structure**: RESTful endpoints for AJAX communication

### Security Framework
- **Authentication**: Session-based authentication with role verification
- **Authorization**: Role-based access control (RBAC) for Student, Teacher, Admin roles
- **Data Validation**: Server-side input validation and sanitization
- **Test Security**: One-time test access, randomized questions and options

## Key Components

### 1. User Management System
- **Student Module**: Dashboard, test taking interface, results viewing
- **Teacher Module**: Question management, test creation, student monitoring
- **Admin Module**: System-wide management, user administration, analytics

### 2. Test Engine
- **Timer System**: Precision JavaScript timer with persistence across page reloads
- **Question Randomization**: Server-side shuffling of questions and answer options
- **Auto-save Mechanism**: AJAX-based automatic answer saving every few seconds
- **One-time Access**: Database-enforced single attempt per student per test

### 3. Question Management
- **Bulk Upload**: Support for multiple question formats
- **Question Types**: Multiple choice with configurable options
- **Media Support**: Image attachments for questions
- **Category Organization**: Subject and class-based categorization

### 4. Real-time Features
- **Live Timer**: Client-side countdown with server synchronization
- **Auto-save**: Periodic answer submission without page refresh
- **Network Monitoring**: Connection status tracking with offline handling
- **Toast Notifications**: User-friendly feedback system

## Data Flow

### Test Taking Process
1. Student enters test code → Server validates and returns test metadata
2. Test preview displayed → Student confirms and starts test
3. Questions loaded with randomization → Timer starts
4. Answers auto-saved periodically → Progress tracked in real-time
5. Test submission → Immediate scoring and result display

### Question Management Flow
1. Teacher uploads questions → Server validates and stores
2. Test codes generated → Questions associated with specific tests
3. Student access → Dynamic question selection and presentation
4. Answer collection → Automated grading and result generation

## External Dependencies

### Frontend Libraries
- **Bootstrap 5**: UI framework for responsive design
- **Custom CSS**: CSS variables for theming and consistent styling
- **Native JavaScript**: ES6+ features without external frameworks

### Backend Dependencies
- **PHP Extensions**: mysqli/PDO for database connectivity
- **File Upload**: PHP native file handling for question media
- **Session Management**: PHP built-in session handling

### Database Requirements
- **MySQL 5.7+**: Primary data storage
- **InnoDB Engine**: ACID compliance and foreign key support

## Deployment Strategy

### Development Environment
- **Local XAMPP/WAMP**: For development and testing
- **File Structure**: Organized MVC-like pattern with assets separation
- **Database Setup**: SQL migration scripts for schema creation

### Production Considerations
- **Web Server**: Apache/Nginx with PHP-FPM
- **Database**: MySQL with proper indexing for performance
- **Security**: HTTPS enforcement, secure session configuration
- **Backup Strategy**: Regular database backups and file system snapshots

### Performance Optimizations
- **Database Indexing**: Optimized queries for large question pools
- **AJAX Caching**: Client-side caching for repeated requests
- **Session Optimization**: Efficient session storage and cleanup
- **Timer Precision**: JavaScript-based timing with server validation

## Key Features

### Test Security
- **Single Attempt Enforcement**: Database-level constraints prevent retakes
- **Question Randomization**: Different question sets per student
- **Option Shuffling**: Answer choices randomized for each question
- **Time Management**: Strict time limits with automatic submission

### User Experience
- **Responsive Design**: Mobile-friendly interface
- **Real-time Feedback**: Instant notifications and status updates
- **Accessibility**: Screen reader compatible and keyboard navigation
- **Network Resilience**: Offline detection and graceful degradation

### Administrative Features
- **Role Management**: Granular permissions for different user types
- **Analytics Dashboard**: Test performance and usage statistics
- **Bulk Operations**: Efficient management of users and questions
- **Audit Trail**: Comprehensive logging of system activities

## Production Readiness

### Data Integrity
- **No Hardcoded Data**: All information is dynamically fetched from database
- **Real-time Statistics**: Dashboard metrics calculated from actual data
- **Proper Timezone Handling**: Database and PHP timezone synchronization
- **Activity Logging**: Complete audit trail with IP addresses and timestamps

### Security Measures
- **Password Hashing**: Secure bcrypt password storage
- **Session Management**: Secure session configuration
- **File Upload Security**: Restricted file types and execution prevention
- **CSRF Protection**: Built-in token validation
- **Role-based Access Control**: Proper permission checking

### Performance Optimization
- **Database Indexing**: Optimized queries for large datasets
- **Efficient Pagination**: Memory-conscious data loading
- **Session Cleanup**: Automated maintenance procedures