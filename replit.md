# Overview

This project is a Computer-Based Testing (CBT) Portal for secondary schools, providing a comprehensive platform for administering online tests. Key capabilities include secure test management, a robust question bank, detailed result tracking, and real-time test administration. The system features role-based access for students, teachers, and administrators, aiming to streamline the testing process in an educational setting. The project is fully functional with dynamic, database-driven academic data (subjects, terms, sessions, class levels) and features a sophisticated batch-based test code management system.

# User Preferences

Preferred communication style: Simple, everyday language.

# Migration Notes

Successfully migrated from Replit Agent to standard Replit environment on August 4, 2025:
- Created PostgreSQL database and imported complete schema
- Optimized API performance by combining multiple database queries
- Added database indexes for improved query performance  
- Both frontend (React/TypeScript on port 5000) and backend (PHP on port 8000) running successfully
- All authentication and role-based access working properly
- Fixed main URL routing: Added automatic redirect from backend root path to frontend (port 5000)
- Users now access the React frontend by default when visiting the main Replit app URL

## Complete Database Compatibility (August 20, 2025)
- **Universal Database Support**: Full compatibility with both MySQL and PostgreSQL databases
- **Automatic Database Detection**: Smart detection of database type from connection strings or environment variables
- **Query Abstraction Layer**: Database-specific SQL syntax handled automatically (RAND/RANDOM, DATE_SUB/INTERVAL, LIMIT syntax)
- **Cross-Platform Deployment**: Works on shared hosting (MySQL) and cloud platforms (PostgreSQL) without code changes
- **Comprehensive Testing**: Included complete compatibility test suite and documentation
- **Performance Optimizations**: Database-specific optimizations for both MySQL and PostgreSQL
- **Migration Support**: Easy switching between database types with automatic query adaptation

## Environment Variable Configuration (August 20, 2025)
- **Flexible API Configuration**: Frontend uses environment variables for backend communication
- **Same-Server Deployment**: Use `/api` for deployments where frontend and backend share the same domain
- **Cross-Platform Deployment**: Use full URLs (e.g., `https://api.domain.com/api`) for separate hosting platforms
- **Production Build Support**: Environment variables properly embedded in production builds
- **Development vs Production**: Separate environment files for different deployment scenarios
- **Comprehensive Documentation**: Complete deployment guide for various hosting platforms

## Final Migration Complete (August 21, 2025)
- **Delete Method Override Fix**: Updated assignments.php and test-codes.php to handle POST with `_method: 'DELETE'` for InfinityFree compatibility
- **Consistent API Behavior**: All admin endpoints now properly handle both native DELETE requests and method override patterns
- **Enhanced Error Handling**: Improved ID parsing from URL paths, query parameters, and request body
- **Cross-Platform Compatibility**: Backend APIs work seamlessly across different hosting environments
- **Complete Testing**: All CRUD operations for admin assignments and test codes now function properly
- **Test Code Creation Fix**: Fixed bulk endpoint path detection to properly handle `/admin/test-codes/bulk` requests
- **Robust Path Parsing**: Enhanced path parsing logic with fallback detection for bulk operations
- **Teacher Question Management**: Added method override handling for edit (PUT) and delete operations
- **Student Test Compatibility**: Fixed database boolean field handling for cross-platform compatibility
- **Teacher Bulk Question Creation**: Fixed missing `/api/teacher/questions/bulk` endpoint by creating proper file structure and resolving include path conflicts
- **Database Connection Resolution**: Created PostgreSQL database and imported complete schema, resolving all 500 database connection errors
- **Complete API Functionality**: All teacher, student, and admin endpoints now working properly with correct authentication and database connectivity

## InfinityFree Deployment Ready (August 20, 2025)
- **Custom Build System**: InfinityFree-optimized build process with flat file structure (no assets folder)
- **JWT Token Management**: Advanced JWT system specifically designed for InfinityFree's hosting environment
- **Smart Header Detection**: Multiple authentication header fallback methods for InfinityFree proxy compatibility
- **Apache Configuration**: Optimized .htaccess files with CORS, security headers, and URL rewriting
- **File Structure Optimization**: Single CSS/JS files (app.css, app.js) instead of complex folder structures
- **Environment Configuration**: Pre-configured .env file with InfinityFree-specific settings
- **Database Compatibility**: Full MySQL support with shared hosting optimization
- **Security Features**: Protected .env files, input sanitization, and secure JWT token generation
- **Mobile Responsive**: PWA-ready deployment with mobile optimization for shared hosting
- **Complete Documentation**: Step-by-step InfinityFree deployment guide with troubleshooting

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
- **Professional Test Code Management**: Consolidated card-based interface with bulk creation, usage tracking, status filters, and copy-to-clipboard functionality.
- **Styling Consistency**: Consistent professional styling with SFGS branding, responsive design, loading states with animated spinners, empty states, and error handling.
- **Interactivity**: Interactive hover effects, smooth transitions, and real-time data updates with progress bars.

## Technical Implementations
- **Performance Optimization**: Comprehensive memoization (useCallback, useMemo), parallel data fetching (Promise.all), and optimized file structures.
- **Edit Functionality**: Full edit question functionality with interactive modal interface and PUT endpoint for updates.
- **API Integration**: Robust RESTful API endpoints, proper error handling.
- **Enhanced Database Schema**: One-time usage tracking columns (`is_used`, `used_at`, `used_by`) to `test_codes` table.
- **Unified Test Code System**: Single interface for individual and bulk code generation (1-100 codes), automatic usage tracking, and streamlined admin management.
- **Dynamic Data Handling**: All academic data (subjects, terms, sessions, class levels) is dynamically loaded from the database, eliminating hardcoded values.
- **Question Randomization**: Implemented complete question and option shuffling for unique test experience per student.

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
- **Database**: Full compatibility with both MySQL and PostgreSQL databases, with automatic detection and query adaptation
- **Security**: CORS configuration with SSL support for cloud databases and compatibility with shared hosting
- **Academic Features**: Term, Session, Subject, and Class Level tracking.
- **File Upload**: Support for bulk question uploads via CSV/Excel.
- **Real-time Features**: Timed tests with automatic submission capabilities.