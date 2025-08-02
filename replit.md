# Overview

This project is a Computer-Based Testing (CBT) Portal designed for secondary schools. Its primary purpose is to provide a comprehensive platform for administering online tests. Key capabilities include secure test management, a robust question bank, detailed result tracking, and real-time test administration. The system features role-based access for students, teachers, and administrators, aiming to streamline the testing process in an educational setting.

## Migration Status: COMPLETED (August 2, 2025)
Successfully migrated from Replit Agent to standard Replit environment with PostgreSQL database integration. Database schema deployed with proper password hashing and all authentication verified working.

## Enhanced Test Code Management System: IMPLEMENTED (August 2, 2025)
Consolidated into single unified Test Code Management system with:
- **Single/Bulk Creation**: Generate 1-100 test codes from one interface
- **One-Time Usage Tracking**: Codes automatically mark as used after student submission
- **Professional UI**: Modern card-based interface with filters and status indicators
- **Copy to Clipboard**: Easy code distribution with click-to-copy functionality  
- **Smart Validation**: Prevents code reuse and validates available questions
- **Unified Admin Interface**: All test code operations in single streamlined component

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