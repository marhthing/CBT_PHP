# Overview

This project is a Computer-Based Testing (CBT) Portal designed for secondary schools. Its primary purpose is to provide a comprehensive platform for administering online tests. Key capabilities include secure test management, a robust question bank, detailed result tracking, and real-time test administration. The system features role-based access for students, teachers, and administrators, aiming to streamline the testing process in an educational setting.

## Migration Status: COMPLETED (August 2, 2025)
Successfully migrated from Replit Agent to standard Replit environment with PostgreSQL database integration. All authentication and core functionality verified working.

## Enhanced Test Code Management System: IMPLEMENTED (August 2, 2025)
Implemented professional-grade Test Code Management system with:
- **Batch Creation**: Bulk generation of test codes with centralized management
- **Individual Code Tracking**: Each code tracks usage status and one-time activation
- **Professional UI**: Modern card-based interface with progress indicators and usage statistics
- **Advanced Analytics**: Real-time usage tracking, progress bars, and batch performance metrics
- **One-Time Usage**: Test codes automatically deactivate after use to prevent reuse
- **Comprehensive Admin Controls**: Batch activation/deactivation, individual code viewing, and deletion protection

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
- **Component Design**: Rebuilt AdminDashboard, AllQuestions, TeacherAssignment, TestCodeManager, and NEW TestCodeBatchManager components for enhanced functionality and aesthetics.
- **Professional Test Code Management**: Card-based batch interface with progress indicators, usage statistics, color-coded status badges, and interactive modals for individual code viewing.
- **Styling Consistency**: Consistent professional styling with SFGS branding, responsive design, loading states with animated spinners, empty states, and error handling.
- **Interactivity**: Interactive hover effects, smooth transitions, and real-time data updates with progress bars.

## Technical Implementations
- **Performance Optimization**: Comprehensive memoization (useCallback, useMemo), parallel data fetching (Promise.all), and optimized file structures for admin components.
- **Edit Functionality**: Full edit question functionality with interactive modal interface and PUT endpoint for updates.
- **API Integration**: Robust RESTful API endpoints, proper error handling (e.g., badRequest method), and corrected database column references.
- **Enhanced Database Schema**: New test_code_batches table with relationships, one-time usage tracking (is_used, used_at, used_by), and comprehensive indexing for performance.
- **Professional Test Code System**: Bulk generation with batch management, individual code tracking, automatic deactivation after use, and comprehensive usage analytics.

# Migration Status

**Project successfully migrated from Replit Agent to standard Replit environment on August 2, 2025**

✓ PostgreSQL database created and configured with complete schema
✓ All required packages installed and verified  
✓ Frontend React app running on port 5000 with Vite
✓ Backend PHP API server running on port 8000
✓ Proper client/server separation with secure proxy configuration
✓ Sample data populated (15 subjects, 3 terms, 3 sessions, 3 users)
✓ Database indexes created for optimal performance

## Sample Login Credentials
- **Admin**: username: `admin`, password: `password123`
- **Teacher**: username: `teacher1`, password: `password123`  
- **Student**: reg_number: `2023001`, password: `password123`

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