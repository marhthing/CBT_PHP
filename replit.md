# Overview

This project is a Computer-Based Testing (CBT) Portal designed for secondary schools. Its primary purpose is to provide a comprehensive platform for administering online tests. Key capabilities include secure test management, a robust question bank, detailed result tracking, and real-time test administration. The system features role-based access for students, teachers, and administrators, aiming to streamline the testing process in an educational setting.

## Migration Status: COMPLETED (August 3, 2025 - 4:30 PM)
Successfully migrated from Replit Agent to standard Replit environment with PostgreSQL database integration. Database schema deployed with proper password hashing and all authentication verified working. All hardcoded class levels removed and replaced with dynamic database-driven system. Complete educational data structure implemented with 15 subjects, 3 terms, 3 sessions, and configurable class levels. Project fully functional with no hardcoded academic data.

### Dynamic Data Implementation (August 3, 2025 - 4:44 PM)
✓ **Class Levels Table**: Created class_levels database table with 6 standard levels (JSS1-JSS3, SS1-SS3)
✓ **Backend APIs Updated**: All validation and lookup endpoints now use database-driven class levels
✓ **Frontend Components Updated**: All forms and filters now dynamically load class levels from API
✓ **No Hardcoded Data**: Completely eliminated hardcoded class levels from all backend PHP files and React components
✓ **Type Safety**: Updated all LookupData interfaces to include class_levels property
✓ **Consistent Data Structure**: All academic data now follows the same pattern of database-driven dynamic loading
✓ **Test Duration System**: Added duration input field to test code creation form, backend already supports configurable duration
✓ **Score Calculation Fix**: Fixed student results to show proper score using score_per_question (e.g., 20/20 instead of 20/4)
✓ **Question Randomization**: Implemented complete question and option shuffling system for unique test experience per student
✓ **Dynamic Question Selection**: Each student gets randomly selected questions from available pool (e.g., 20 from 60 questions)
✓ **Option Shuffling**: A, B, C, D options randomly reordered for each question per student with proper answer mapping

### Latest Data Setup (August 3, 2025 - 4:26 PM)
✓ **Complete Sample Data**: Added 15 subjects, 3 terms, 3 sessions, 6 class levels, and 8 teacher assignments
✓ **Dynamic Class Management**: Created class_levels table with configurable class structure
✓ **Removed Hardcoded Data**: Eliminated all hardcoded class levels from frontend and backend
✓ **Database Schema Updated**: All academic data now dynamically loaded from database
✓ **TypeScript Interfaces Updated**: LookupData interfaces include class_levels across all components
✓ **Application Ready**: Frontend and backend fully operational with no hardcoded academic data

### Latest Migration Update (August 3, 2025 - 11:54 AM)
✓ **Fresh Database Setup**: Created new PostgreSQL database with complete schema
✓ **Secure Password Hashing**: All user passwords properly hashed using PHP password_hash()
✓ **Sample Data Populated**: 3 users, 15 subjects, 3 terms, 3 sessions loaded
✓ **Teacher Assignments**: Sample assignments created for testing
✓ **Both Servers Running**: Frontend (port 5000) and Backend (port 8000) fully operational
✓ **Score per Question Feature**: Added configurable scoring system to test code batches

### Latest Updates (August 3, 2025)
✓ **Migration Completed**: Successfully migrated from Replit Agent to standard Replit environment
✓ **Database Setup**: PostgreSQL database created with complete schema and secure password hashing
✓ **Enhanced CSV Template**: Bulk upload template now includes subject ID reference table for easy identification
✓ **Manual Question Creation**: Added comprehensive manual form with filter setup and bulk creation capabilities
✓ **Question Bank Features**: Both CSV upload and manual creation now fully functional with proper validation
✓ **Score per Question System**: Implemented configurable scoring in test code batch creation with admin UI and backend support
✓ **Difficulty Level Removal**: Completely removed difficulty_level field from all components, APIs, and database per user preference

### Final Migration Verification (August 2, 2025)
✓ PostgreSQL database created and fully configured with Neon
✓ Complete schema.sql executed with all tables, indexes, and sample data
✓ Password hashes updated with proper PHP password_hash() for 'password123'
✓ Database connection verified - 3 users, 15 subjects, 3 terms, 3 sessions loaded
✓ batch_id column added to test_codes table for enhanced functionality
✓ Both frontend (port 5000) and backend (port 8000) servers running successfully

## Enhanced Test Code Management System: IMPLEMENTED (August 2, 2025)
Fully batch-based test code creation system with:
- **Batch-Only Creation**: All test codes created as batches (1-100 codes) for optimal organization
- **Unified Batch System**: Even single codes get batch_id for consistent organization
- **One-Time Usage Tracking**: Codes automatically mark as used after student submission
- **Professional UI**: Modern card-based interface with filters and status indicators
- **Copy to Clipboard**: Easy code distribution with click-to-copy functionality  
- **Smart Validation**: Prevents code reuse and validates available questions
- **Batch Organization**: All codes properly grouped with batch_id for better management

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 19 with TypeScript.
- **Build Tool**: Vite.
- **UI Framework**: Shadcn/ui built on Radix UI primitives.
- **Styling**: Tailwind CSS v4 with CSS custom properties.
- **State Management**: TanStack React Query for server state and caching; React Context for authentication state; React hooks for local state.
- **Routing**: React Router DOM v7 for client-side navigation and protected routes.
- **Authentication**: Context-based authentication with JWT token storage.

## Component Architecture
- **Design System**: Modular UI components with consistent styling and behavior.
- **Layout**: Responsive sidebar layout with role-based navigation menus.
- **Forms**: Controlled components with validation.
- **Data Display**: Tables, cards, and dashboards with real-time data updates.

## Role-Based Access Control
- **Student Interface**: Test taking, result viewing, dashboard access, one-time test code validation.
- **Teacher Interface**: Question management, bulk upload, class assignments.
- **Admin Interface**: System-wide management, professional test code batch management, individual code tracking, teacher assignments.

## Development Workflow
- **Hot Reload**: Vite development server.
- **TypeScript**: Strict type checking.
- **Path Aliases**: "@/" alias for clean import statements.
- **Code Organization**: Feature-based folder structure.

## UI/UX Decisions
- **Branding**: SFGS branding across all pages with modern professional design.
- **Design Elements**: Gradient-based login page, dark sidebar, interactive stat cards, quick actions sidebar, system status monitoring.
- **Component Design**: Rebuilt AdminDashboard, AllQuestions, TeacherAssignment, and unified TestCodeManager for enhanced functionality and aesthetics.
- **Professional Test Code Management**: Consolidated card-based interface with bulk creation, usage tracking, status filters, and copy-to-clipboard functionality.
- **Styling Consistency**: Consistent professional styling with SFGS branding, responsive design, loading states with animated spinners, empty states, and error handling.
- **Interactivity**: Interactive hover effects, smooth transitions, and real-time data updates with progress bars.

## Technical Implementations
- **Performance Optimization**: Comprehensive memoization (useCallback, useMemo), parallel data fetching (Promise.all), and optimized file structures for admin components.
- **Edit Functionality**: Full edit question functionality with interactive modal interface and PUT endpoint for updates.
- **API Integration**: Robust RESTful API endpoints, proper error handling (e.g., badRequest method), and corrected database column references.
- **Enhanced Database Schema**: Added one-time usage tracking columns (is_used, used_at, used_by) to test_codes table for comprehensive usage monitoring.
- **Unified Test Code System**: Single interface for individual and bulk code generation (1-100 codes), automatic usage tracking, and streamlined admin management.

# Migration Status

**Project successfully migrated from Replit Agent to standard Replit environment on August 2, 2025**

✓ PostgreSQL database created and configured with complete schema
✓ All required packages installed and verified  
✓ Frontend React app running on port 5000 with Vite
✓ Backend PHP API server running on port 8000
✓ Proper client/server separation with secure proxy configuration
✓ Sample data populated (15 subjects, 3 terms, 3 sessions, 3 users)
✓ Database indexes created for optimal performance

## Final Implementation: Batch-Only Test Code System (August 2, 2025)

**System fully implemented with user-requested batch-only approach:**

✓ **Unified Batch Creation**: ALL test codes now created exclusively through batch endpoints (1-100 codes)
✓ **Batch-Level Management**: Activation/deactivation operates on entire batches, not individual codes
✓ **Business Rule Enforcement**: Batches with used codes cannot be reactivated (prevents cheating)
✓ **Professional UI**: Clean batch-focused interface with copy-to-clipboard for easy distribution
✓ **Complete API Integration**: Backend routing supports batch operations with proper error handling
✓ **Data Consistency**: All codes assigned batch_id for unified organization system

**Key Features Delivered:**
- Batch creation from 1-100 codes with automatic batch_id assignment
- Batch activation/deactivation with business rule validation
- Copy functionality for easy test code distribution
- Professional card-based UI showing batch details and individual codes
- Filter system by subject, class, term, session, and status
- Comprehensive error handling and user feedback

## Sample Login Credentials
- **Admin**: username: `admin`, password: `password123`
- **Teacher**: username: `teacher1`, password: `password123`  
- **Student**: reg_number: `2023001`, password: `password123`

## Agent Setup Instructions

When setting up this project from scratch, agents should ensure proper password security by updating all user password hashes in the database. The system uses PHP's `password_hash()` function with `PASSWORD_DEFAULT` for secure password storage.

**Required Step**: After database creation and sample data insertion, run the password hash update script to convert all plain text passwords to properly hashed versions:

```php
// Update all user passwords to proper hashes
$users = [
    ['id' => 1, 'password' => 'password123'], // admin
    ['id' => 2, 'password' => 'password123'], // teacher1  
    ['id' => 3, 'password' => 'password123']  // student (2023001)
];

foreach ($users as $user) {
    $hashed = password_hash($user['password'], PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
    $stmt->execute([$hashed, $user['id']]);
}
```

This ensures all authentication uses secure password verification via `password_verify()` rather than plain text comparison.

# External Dependencies

## Core Dependencies
- **React Ecosystem**: React 19, React DOM, React Router DOM.
- **TanStack React Query**: Server state management and data fetching.
- **Axios**: HTTP client for API communication.

## UI and Styling
- **Radix UI**: Accessible component primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **Class Variance Authority**: Type-safe variant handling.

## Development Tools
- **Vite**: Build tool and development server.
- **TypeScript**: Static type checking.
- **PostCSS**: CSS processing.

## Backend Integration
- **API Communication**: RESTful API endpoints for all data operations.
- **Authentication**: JWT token-based authentication with role-based login (reg_number for students, email/username for teachers/admins).
- **Database**: PostgreSQL with comprehensive schema including users, questions, test_codes, test_results, test_answers, subjects, terms, and sessions.
- **Security**: CORS configuration with SSL support for Neon database.
- **Academic Features**: Term and Session tracking with 15 predefined subjects.
- **File Upload**: Support for bulk question uploads via CSV/Excel.
- **Real-time Features**: Timed tests with automatic submission capabilities.
- **Test Credentials**: Admin (admin/password123), Teacher (teacher1/password123), Student (2023001/password123).