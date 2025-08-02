# Overview

This is a Computer-Based Testing (CBT) Portal application designed for secondary schools. The system provides a comprehensive platform for administering online tests with role-based access for students, teachers, and administrators. The application features secure test management, question banking, result tracking, and real-time test administration capabilities.

## Recent Changes (August 2, 2025)

### Final API Integration Fixes Complete ✅
- ✓ Fixed PostgreSQL GROUP BY errors in test-codes API endpoint
- ✓ Added missing badRequest method to Response class for proper error handling
- ✓ Corrected database column references (question_count → total_questions, removed updated_at)
- ✓ Verified all admin dashboard APIs working correctly with authentication
- ✓ Test codes, dashboard stats, lookup data, and health check endpoints all functional
- ✓ Admin interface now loads without any API errors
- ✓ Authentication system stable with proper JWT token validation

### Migration to Replit Environment Complete ✅
- ✓ Created PostgreSQL database and installed complete schema with 9 tables
- ✓ Loaded all lookup data: subjects, terms, sessions, and class levels  
- ✓ Created sample users: admin/password123, teacher1/password123, student1/password123
- ✓ Verified backend API endpoints responding correctly (auth, system, health check)
- ✓ Cleaned up unused Node.js files (removed server/db.ts)
- ✓ Both workflows running cleanly: Frontend (port 5000) and Backend (port 8000)
- ✓ Database connection confirmed with health status "ok"
- ✓ All migration checklist items completed successfully

### Backend API Integration Fixed
- ✓ Fixed authentication system - JWT tokens now working correctly with PHP backend
- ✓ Fixed API proxy configuration to properly route frontend requests to backend
- ✓ Fixed database schema mismatches in dashboard-stats and questions APIs
- ✓ Updated SQL queries to use correct column names (subject_id vs subject, submitted_at vs completed_at) 
- ✓ Made lookup endpoints public (no authentication required) for dropdown data
- ✓ All backend endpoints now return proper JSON data with authentication
- ✓ Updated schema.sql with current database structure (9 tables with proper foreign keys)
- ✓ Verified all admin functionality: dashboard stats, questions list, lookup data working

### Migration Cleanup Complete  
- ✓ Removed unnecessary server folder and db.ts (Node.js/Drizzle files)
- ✓ Removed difficulty column from PostgreSQL database
- ✓ Updated schema.sql to remove all difficulty references  
- ✓ Fixed PostCSS configuration with @tailwindcss/postcss dependency
- ✓ Migration from Replit Agent to Replit environment complete

## Recent Changes (August 2, 2025)

### Complete Admin Interface Overhaul
- ✓ Completely rebuilt AdminDashboard with modern professional design:
  - Interactive stat cards with hover effects and real-time data
  - Recent test codes section with quick activation/deactivation
  - Quick actions sidebar with gradient buttons
  - System status monitoring and health indicators
- ✓ Rebuilt AllQuestions component with comprehensive functionality:
  - Advanced filtering by search, subject, class, difficulty, and type
  - Professional question stats dashboard with overview cards
  - Clickable question details modal with full option display
  - Delete functionality with proper confirmation
  - Empty states and responsive design
- ✓ Rebuilt TeacherAssignment component with full CRUD operations:
  - Create assignment modal with teacher/subject/class selection
  - Comprehensive filtering system for assignments
  - Statistics cards showing assignment metrics
  - Card-based layout with teacher information and assignment details
  - Delete functionality with confirmation
- ✓ Enhanced TestCodeManager with professional interface:
  - Create test code modal with all required fields
  - Advanced filtering by subject, class, term, session, and status
  - Card-based layout showing test code details and usage stats
  - Activation/deactivation functionality with visual feedback
  - Delete functionality for unused test codes
- ✓ All admin components now feature:
  - Consistent professional styling with SFGS branding
  - Responsive design for all screen sizes
  - Loading states with animated spinners
  - Empty states with helpful messaging
  - Proper error handling and user feedback
  - Interactive hover effects and smooth transitions

### Project Migration to Replit Environment Complete
- ✓ Successfully migrated CBT Portal from Replit Agent to Replit environment
- ✓ Created and configured PostgreSQL database with complete schema
- ✓ Fixed PostCSS configuration by installing missing @tailwindcss/postcss dependency
- ✓ Loaded all database tables, lookup data, and sample test users
- ✓ Verified authentication system works correctly with proper error feedback
- ✓ Cleaned up file structure by removing duplicate components:
  - Removed redundant Login.tsx (kept SimpleLogin.tsx which is functional)
  - Removed Layout.tsx wrapper (using ResponsiveLayout.tsx directly)
  - Removed unused MobileLayout.tsx and Sidebar.tsx components
  - Updated App.tsx imports to use cleaned structure
- ✓ Both Frontend (port 5000) and Backend (port 8000) workflows running cleanly
- ✓ Sample users available: admin/password123, teacher1/password123, 2023001/password123

## Previous Changes (August 1, 2025)

### Complete Migration to Replit Environment
- ✓ Successfully migrated from Replit Agent to Replit environment
- ✓ Fixed Tailwind CSS PostCSS configuration issues
- ✓ Provisioned PostgreSQL database with comprehensive schema
- ✓ Added missing database columns (reg_number, current_term, current_session)
- ✓ Updated all user passwords with proper hashes for 'password123'
- ✓ Fixed authentication system with automatic role detection and navigation
- ✓ Implemented proper lookup tables for terms, sessions, and subjects
- ✓ Added system/lookup API endpoint for normalized data filtering
- ✓ Resolved login page refresh issue with proper route handling
- ✓ Both workflows (Frontend on port 5000, Backend on port 8000) running cleanly

### Database Normalization Update (Latest)
- ✓ Created separate lookup tables: terms, sessions, subjects
- ✓ Updated all tables to use foreign keys instead of text columns
- ✓ Removed old subject columns from questions, test_codes, teacher_assignments
- ✓ Updated schema.sql with proper normalized structure
- ✓ Fixed authentication redirect to prevent login page loops
- ✓ All API endpoints now use lookup table relationships

### Authentication System Fix (Latest)
- ✓ Fixed API URL configuration to point to backend on port 8000
- ✓ Corrected login redirect flow to prevent infinite loops
- ✓ Simplified authentication state management
- ✓ Backend JWT authentication working correctly
- ✓ Frontend properly handles user state and navigation

### Complete UI Overhaul (Latest Update)
- ✓ Professional SFGS branding implemented across all pages
- ✓ Modern gradient-based login page with school identity
- ✓ Elegant dark sidebar with SFGS logo and comprehensive navigation
- ✓ Completely redesigned Admin Dashboard with stats cards and action sections
- ✓ Professional Teacher Dashboard with class management and question overview
- ✓ Student-friendly dashboard with test availability and results tracking
- ✓ Responsive design optimized for all screen sizes
- ✓ Consistent color scheme using purple gradients and professional typography
- ✓ Interactive elements with hover effects and smooth transitions
- ✓ All components now use inline styles for reliable rendering

### Professional Styling Applied to All Pages (August 1, 2025)
- ✓ Admin Pages: AllQuestions, TeacherAssignment, TestCodeManager with consistent design
- ✓ Teacher Pages: QuestionManager, BulkUpload with professional forms and file upload
- ✓ Student Pages: TestResults, TakeTest with interactive test interface and progress tracking
- ✓ All modals, tables, and forms styled with modern design patterns
- ✓ Consistent loading states, error handling, and empty states across all pages
- ✓ Fixed API endpoints to use correct backend URLs (removing /api prefix)
- ✓ Applied SFGS color scheme and typography throughout the application

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 19 with TypeScript for type safety and modern development
- **Build Tool**: Vite for fast development builds and hot module replacement
- **UI Framework**: Shadcn/ui component library built on Radix UI primitives for accessibility
- **Styling**: Tailwind CSS v4 with CSS custom properties for theming and responsive design
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: React Router DOM v7 for client-side navigation and protected routes
- **Authentication**: Context-based authentication with JWT token storage

## Component Architecture
- **Design System**: Modular UI components with consistent styling and behavior
- **Layout**: Responsive sidebar layout with role-based navigation menus
- **Forms**: Controlled components with validation and error handling
- **Data Display**: Tables, cards, and dashboards with real-time data updates

## Role-Based Access Control
- **Student Interface**: Test taking, result viewing, and dashboard access
- **Teacher Interface**: Question management, bulk upload capabilities, and class assignments
- **Admin Interface**: System-wide management, test code generation, and teacher assignments

## State Management Strategy
- **Server State**: React Query for API data fetching, caching, and synchronization
- **Authentication State**: React Context for user session management
- **Local State**: React hooks for component-level state management
- **Form State**: Controlled components with validation patterns

## Development Workflow
- **Hot Reload**: Vite development server with instant updates
- **TypeScript**: Strict type checking for better code quality and developer experience
- **Path Aliases**: Configured "@/" alias for clean import statements
- **Code Organization**: Feature-based folder structure with shared components

# External Dependencies

## Core Dependencies
- **React Ecosystem**: React 19, React DOM, React Router DOM for frontend framework
- **TanStack React Query**: Server state management and data fetching
- **Axios**: HTTP client for API communication with interceptors

## UI and Styling
- **Radix UI**: Accessible component primitives for dialogs, selects, and slots
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Type-safe variant handling for components

## Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking and enhanced development experience
- **PostCSS**: CSS processing with Tailwind and Autoprefixer plugins

## Backend Integration
- **API Communication**: RESTful API endpoints for all data operations
- **Authentication**: JWT token-based authentication with role-based login (reg_number for students, email/username for teachers/admins)
- **Database**: PostgreSQL with comprehensive schema including users, questions, test_codes, test_results, and test_answers
- **Security**: CORS configuration, rate limiting, and security headers
- **Academic Features**: Term and Session tracking for all academic activities
- **File Upload**: Support for bulk question uploads via CSV/Excel files
- **Real-time Features**: Timed tests with automatic submission capabilities

## Database Schema
- **Users**: Multi-role system (student/teacher/admin) with term/session tracking
- **Authentication**: Registration number for students, email/username for teachers/admins
- **Academic Structure**: Term (First/Second/Third) and Session (e.g., 2024/2025) integration
- **Test Management**: Complete test lifecycle from question creation to result tracking
- **Question Banking**: Subject and class-level organization with difficulty levels
- **Result Tracking**: Comprehensive scoring and analytics system