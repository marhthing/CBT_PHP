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

## Multi-Platform Hosting Compatibility (August 4, 2025)
- **Universal Compatibility**: Enhanced system to work on ALL major hosting platforms
- **Automatic Platform Detection**: Added environment.php to detect and optimize for specific hosts
- **Advanced CORS**: Wildcard pattern matching for InfinityFree, 000webhost, Netlify, Vercel, Heroku, Render
- **Dual Database Support**: Smart auto-detection between MySQL (shared hosting) and PostgreSQL (cloud platforms)
- **Apache Configuration**: Complete .htaccess files for security, routing, and performance
- **Deployment Ready**: /dist/ and /backend/ folders optimized for any hosting platform
- **Comprehensive Documentation**: Created HOSTING_GUIDE.md and PLATFORM_COMPATIBILITY_SUMMARY.md

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
- **Database**: PostgreSQL with comprehensive schema including users, questions, test_codes, test_results, test_answers, subjects, terms, sessions, and class_levels.
- **Security**: CORS configuration with SSL support for Neon database.
- **Academic Features**: Term, Session, Subject, and Class Level tracking.
- **File Upload**: Support for bulk question uploads via CSV/Excel.
- **Real-time Features**: Timed tests with automatic submission capabilities.