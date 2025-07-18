# WordPress Backup Tool

## Overview

This is a full-stack web application built for creating and managing WordPress website backups. The application uses a modern React frontend with a Node.js/Express backend, featuring real-time backup progress tracking and a comprehensive UI built with shadcn/ui components.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Style**: RESTful API with JSON responses
- **Real-time Updates**: Polling-based status updates every 2 seconds
- **Error Handling**: Centralized error middleware with structured error responses

### Data Storage Solutions
- **Database**: PostgreSQL configured with Drizzle ORM (Active)
- **Connection**: Neon Database serverless connection via @neondatabase/serverless
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Storage Implementation**: DatabaseStorage class replaces MemStorage for persistent data
- **Backup Storage**: Local file system with ZIP compression (JSZip)

## Key Components

### Database Schema
- **Users Table**: Basic user management with username/password authentication
- **Backup Jobs Table**: Comprehensive backup job tracking with status, progress, metadata, and file information
- **Shared Schema**: TypeScript types and Zod validation schemas shared between frontend and backend

### API Endpoints
- `POST /api/validate-site`: WordPress site detection and validation
- `POST /api/backup`: Create new backup job
- `GET /api/backup/:id`: Get backup job status and details
- `GET /api/backups/recent`: Retrieve recent backup jobs

### Frontend Components
- **BackupForm**: Main form for initiating backups with WordPress site validation
- **BackupStatus**: Real-time backup progress tracking with step indicators
- **BackupHistory**: List of recent backups with download functionality
- **SiteDetection**: WordPress site validation feedback
- **ProgressSteps**: Visual step-by-step backup progress indicator

### Backend Services
- **WordPressService**: Site detection, REST API checking, and metadata extraction
- **BackupService**: Asynchronous backup processing with progress updates
- **DatabaseStorage**: PostgreSQL-based data persistence with Drizzle ORM integration
- **Database Connection**: Serverless PostgreSQL via Neon Database with connection pooling

## Data Flow

1. **Site Validation**: User enters URL → Frontend validates → Backend detects WordPress → UI shows validation result
2. **Backup Creation**: User submits form → Backend creates job → Async backup process starts → Real-time progress updates
3. **Progress Tracking**: Frontend polls backup status → Backend updates job progress → UI reflects current step and percentage
4. **Backup Completion**: Process finishes → File saved locally → Download available → History updated

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm & drizzle-kit**: Database ORM and migration tools
- **axios**: HTTP client for external requests
- **cheerio**: HTML parsing for WordPress detection
- **jszip**: ZIP file creation for backups
- **zod**: Runtime type validation

### UI Dependencies
- **@radix-ui/***: Headless UI primitives for shadcn/ui
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Static type checking
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR and error overlay
- **Backend**: tsx with auto-reload for TypeScript execution
- **Database**: Managed PostgreSQL via Neon Database
- **Environment Variables**: DATABASE_URL for database connection

### Production Build
- **Frontend**: Vite production build with optimized assets
- **Backend**: esbuild bundle with external packages for Node.js
- **Static Assets**: Served by Express in production mode
- **Process Management**: Single Node.js process serving both API and static files

### Build Commands
- `npm run dev`: Start development servers
- `npm run build`: Build both frontend and backend for production
- `npm start`: Start production server
- `npm run db:push`: Push database schema changes

The application is designed for easy deployment on platforms like Replit, with automatic asset serving and environment-based configuration switching.