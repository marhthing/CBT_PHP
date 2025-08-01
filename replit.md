# Overview

This is a Computer-Based Testing (CBT) Portal application designed for secondary schools. The system provides a comprehensive platform for administering online tests with role-based access for students, teachers, and administrators. The application features secure test management, question banking, result tracking, and real-time test administration capabilities.

## Recent Changes (August 1, 2025)

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