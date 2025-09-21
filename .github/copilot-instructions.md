# Laboratorio Celular POS

React webapp with Node.js API and MongoDB for cellphone inventory management system.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap, Build, and Test the Repository

- Install dependencies for both backend and frontend:
  ```bash
  npm run install-all
  ```
  Takes approximately 1 minute. NEVER CANCEL. Set timeout to 120+ seconds.

- Build the frontend application:
  ```bash
  npm run build
  ```
  Takes approximately 15 seconds. NEVER CANCEL. Set timeout to 60+ seconds.

- Install root dependencies (for concurrency):
  ```bash
  npm install
  ```
  Takes approximately 10 seconds.

### Environment Setup

- Copy backend environment file:
  ```bash
  cp backend/.env.example backend/.env
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
  1. Navigate to Dashboard (http://localhost:3000) - should show "Panel de Control"
  2. Navigate to Inventory page (/inventory) - should show "Gestión de Inventario" 
  3. Navigate to Sales page (/sales) - should show "Gestión de Ventas"
- The application displays properly in Spanish and shows loading states without MongoDB
- Backend API runs on http://localhost:5000/api (check with http://localhost:5000/api/health)
- Frontend runs on http://localhost:3000

## Timing Expectations

- **Dependency installation**: ~48 seconds for all packages. NEVER CANCEL before 2 minutes.
- **Frontend build**: ~15 seconds. NEVER CANCEL before 1 minute.
- **Application startup**: ~20 seconds for both services. NEVER CANCEL before 1 minute.
- **Root dependencies**: ~10 seconds. NEVER CANCEL before 30 seconds.

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

- **Frontend**: React 19, TypeScript, React Router, Styled Components, Axios
- **Backend**: Node.js, Express, MongoDB/Mongoose, CORS, dotenv
- **Development**: Concurrently, Nodemon, Create React App

## Environment Variables

### Backend (.env)
- `MONGODB_URI=mongodb://localhost:27017/laboratorioCelular`
- `PORT=5000`
- `NODE_ENV=development`
- `FRONTEND_URL=http://localhost:3000`

### Frontend (optional)
- `REACT_APP_API_URL=http://localhost:5000/api` (default)
- Other React environment variables as needed

## API Information

The backend provides RESTful APIs for:
- Inventory management (`/api/inventory`)
- Sales management (`/api/sales`)  
- Health check (`/api/health`)

## Development Workflow

1. Always run `npm run install-all` after cloning
2. Copy backend environment: `cp backend/.env.example backend/.env`
3. Install root dependencies: `npm install`
4. Start development: `npm run dev`
5. Test changes manually by navigating through all three main pages
6. Build for production: `npm run build`

## Common Commands Reference

```bash
# Quick setup
npm run install-all && npm install && cp backend/.env.example backend/.env

# Development
npm run dev                    # Start both services
npm run build                 # Build frontend for production

# Individual services  
npm run start:backend         # Backend only
npm run start:frontend        # Frontend only
```