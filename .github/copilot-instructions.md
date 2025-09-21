# Laboratorio Celular POS

React webapp with Node.js API and MongoDB for cellphone inventory management system.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap, Build, and Test the Repository

- Install dependencies for both backend and frontend:
  ```bash
  npm run install-all
  ```
  Takes approximately 1 minute. NEVER CANCEL. Set timeout to 180+ seconds.

- Build the frontend application:
  ```bash
  npm run build
  ```
  Takes approximately 20 seconds. NEVER CANCEL. Set timeout to 60+ seconds.

- Install root dependencies (for concurrency):
  ```bash
  npm install
  ```
  Takes approximately 5 seconds.

### Environment Setup

- Copy backend environment file:
  ```bash
  cp backend/.env.example backend/.env
  ```

- Copy frontend environment file:
  ```bash
  cp frontend/.env.example frontend/.env
  ```
  
- **OR** use the setup script for quick environment setup:
  ```bash
  ./setup-env.sh development
  ```
  
- The application works without MongoDB for development (connection will timeout gracefully)
  
- MongoDB is required for full functionality but not for basic development and testing

### Run the Applications

- **RECOMMENDED**: Run both backend and frontend concurrently:
  ```bash
  npm run dev
  ```
  NEVER CANCEL. Both services take ~20 seconds to start. Set timeout to 60+ seconds.
  
- Backend only (on port 5000):
  ```bash
  npm run start:backend
  # OR for development with nodemon
  cd backend && npm run dev
  ```
  
- Frontend only (on port 3000):
  ```bash
  npm run start:frontend
  # OR
  cd frontend && npm start
  ```

### Tests

- Frontend tests exist but have dependency resolution issues with react-router-dom:
  ```bash
  cd frontend && npm test -- --watchAll=false --passWithNoTests
  ```
  Tests currently fail due to module resolution - this is a known issue, not your responsibility to fix.
  
- Backend tests are not implemented (`npm run test` returns error)

## Validation

- Always manually validate changes by running the full application with `npm run dev`
- ALWAYS test complete user workflows after making changes:
  1. Navigate to application (http://localhost:3000) - should show "Laboratorio Celular POS" login page in Spanish
  2. Backend API health check (http://localhost:5000/api/health) - should return `{"status":"OK","timestamp":"..."}`
- **Authentication Required**: Full user workflow testing (Dashboard, Inventory, Sales) requires:
  - MongoDB running locally, OR
  - Creating a test user with `npm run create-admin` (requires MongoDB)
- The application displays properly in Spanish and shows loading states without MongoDB
- Backend API runs on http://localhost:5000/api (check with http://localhost:5000/api/health)
- Frontend runs on http://localhost:3000

## Timing Expectations

- **Dependency installation**: ~54 seconds for all packages. NEVER CANCEL before 3 minutes.
- **Frontend build**: ~20 seconds. NEVER CANCEL before 1 minute.
- **Application startup**: ~20 seconds for both services. NEVER CANCEL before 1 minute.
- **Root dependencies**: ~5 seconds. NEVER CANCEL before 30 seconds.

## Common Issues

- MongoDB connection warnings are normal - application works without MongoDB for development
- Frontend tests fail due to react-router-dom dependency resolution - ignore this issue
- Deprecation warnings for webpack dev server are normal and can be ignored
- Some npm audit vulnerabilities exist but don't affect development

## Repository Structure

```
├── backend/                 # Node.js Express API
│   ├── models/             # MongoDB models  
│   ├── routes/             # API routes
│   ├── server.js           # Express server entry point
│   ├── .env.example        # Environment variables template
│   └── package.json        # Backend dependencies
├── frontend/               # React TypeScript application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components (Dashboard, Inventory, Sales)
│   │   ├── services/       # API services (axios)
│   │   └── types/          # TypeScript types
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies  
└── package.json            # Root scripts for concurrent development
```

## Key Technologies

- **Frontend**: React 19, TypeScript, React Router, Styled Components, Chakra UI, Axios
- **Backend**: Node.js, Express, MongoDB/Mongoose, CORS, dotenv, JWT, bcrypt
- **Development**: Concurrently, Nodemon, Create React App
- **Authentication**: JWT tokens, bcrypt password hashing, role-based access control

## Environment Variables

### Backend (.env)
- `MONGODB_URI=mongodb://localhost:27017/laboratorioCelular`
- `PORT=5000`
- `NODE_ENV=development`
- `FRONTEND_URL=http://localhost:3000`
- `JWT_SECRET=your-super-secret-jwt-key-change-this-in-production`

### Frontend (.env)
- `REACT_APP_API_URL=http://localhost:5000/api` (default)
- `REACT_APP_APP_NAME=Laboratorio Celular POS`
- `REACT_APP_ENV=development`
- `REACT_APP_API_TIMEOUT=10000`

## API Information

The backend provides RESTful APIs for:
- User authentication (`/api/auth`)
- User management (`/api/users`) - Master admin only
- Inventory management (`/api/inventory`)
- Sales management (`/api/sales`)
- Franchise locations (`/api/franchise-locations`)
- Health check (`/api/health`)

## Development Workflow

1. Always run `npm run install-all` after cloning
2. Copy environment files: `cp backend/.env.example backend/.env && cp frontend/.env.example frontend/.env`
3. Install root dependencies: `npm install`
4. Start development: `npm run dev`
5. Test changes manually by navigating to http://localhost:3000 (shows login page)
6. Build for production: `npm run build`

## Common Commands Reference

```bash
# Quick setup
npm run install-all && npm install && cp backend/.env.example backend/.env && cp frontend/.env.example frontend/.env

# Development
npm run dev                    # Start both services
npm run build                 # Build frontend for production

# Individual services  
npm run start:backend         # Backend only
npm run start:frontend        # Frontend only

# Create test user (requires MongoDB)
cd backend && npm run create-admin
```

## Authentication System

The application includes a complete JWT-based authentication system:
- User roles: Cajero, Supervisor de sucursal, Supervisor de sucursales, Oficina, Supervisor de oficina, Master admin
- Master admin user creation: `npm run create-admin` (requires MongoDB)
- Login credentials are stored in JWT tokens with 24-hour expiration
- All main pages (Dashboard, Inventory, Sales, Users) require authentication
- Without authentication, users are redirected to the login page

## Manual Testing Notes

**With MongoDB**: Full functionality including user creation, authentication, and all CRUD operations
**Without MongoDB**: 
- Application starts successfully with connection warnings (expected)
- Login page displays correctly in Spanish
- Health check endpoint works (`/api/health`)
- Protected routes redirect to login as expected
- No data persistence, but UI components render correctly

## Validated Commands

All commands in these instructions have been thoroughly tested:
✅ `npm run install-all` - 54 seconds, works correctly
✅ `npm install` - 5 seconds, works correctly  
✅ `npm run build` - 20 seconds, successful production build
✅ `npm run dev` - Both services start in ~20 seconds
✅ `cp backend/.env.example backend/.env` - Works correctly
✅ `cp frontend/.env.example frontend/.env` - Works correctly
✅ `./setup-env.sh development` - Works correctly
✅ Health check endpoint responds correctly
✅ Frontend displays professional Spanish UI
✅ Authentication system redirects work properly