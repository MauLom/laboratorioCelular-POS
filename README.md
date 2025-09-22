# Laboratorio Celular POS

A React webapp with Node.js API and MongoDB for cellphone inventory management.

## Features

### Inventory Management
- Track cellphones with different states: New, Repair, Repaired, Sold, Lost, Clearance
- Store IMEI numbers (required and unique)
- Organize by branch
- Hidden extra details support
- Additional fields: brand, model, price, notes

### Sales Management
- Record sales with required fields:
  - Description: Fair, Payment, Sale, Deposit
  - Finance: Payjoy, Lespago, Repair, Accessory, Cash, Other
  - Concept, IMEI (if applicable), payment type, reference, amount
- Customer information tracking
- Automatic inventory updates (IMEI items marked as "Sold" when sale is recorded)

### Dashboard
- Overview of inventory statistics
- Sales summary
- Quick access to main features

## Tech Stack

- **Frontend**: React with TypeScript, styled-components, React Hook Form
- **Backend**: Node.js, Express.js, MongoDB with Mongoose
- **API**: RESTful API with CRUD operations
- **Validation**: Yup schemas for form validation

## Project Structure

```
├── backend/
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── server.js         # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── types/        # TypeScript types
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB (local or cloud instance)

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Update MongoDB connection string in `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/laboratorioCelular
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Update frontend API URL in `.env` if needed:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

5. Start the development server:
   ```bash
   npm start
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Configuration

Both backend and frontend applications use environment variables for configuration. This makes it easy to maintain different settings for development, production, and other environments.

### Backend Environment Variables

The backend uses the following environment variables (see `backend/.env.example`):

- `MONGODB_URI` - MongoDB connection string
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode (development/production)
- `FRONTEND_URL` - Frontend URL for CORS configuration
- `JWT_SECRET` - JWT secret key (optional, for future authentication)

### Frontend Environment Variables

The frontend uses the following environment variables (see `frontend/.env.example`):

- `REACT_APP_API_URL` - Backend API base URL
- `REACT_APP_APP_NAME` - Application name
- `REACT_APP_ENV` - Environment mode
- `REACT_APP_API_TIMEOUT` - API request timeout in milliseconds

### Environment Setup Examples

#### Quick Setup (Recommended)
Use the provided setup script:
```bash
# For development (default)
./setup-env.sh development

# For Docker
./setup-env.sh docker

# For production
./setup-env.sh production
```

#### Manual Setup

#### For Local Development
Use the default `.env` files provided.

#### For Docker Development
Use the `.env.docker` files:
```bash
# Backend
cp backend/.env.docker backend/.env
# Frontend  
cp frontend/.env.docker frontend/.env
```

#### For Production
Use the `.env.production` files as templates:
```bash
# Backend
cp backend/.env.production backend/.env
# Frontend
cp frontend/.env.production frontend/.env
```
Then update the URLs and credentials as needed.

## API Endpoints

### Inventory
- `GET /api/inventory` - Get all inventory items (with filters)
- `GET /api/inventory/:imei` - Get specific item by IMEI
- `POST /api/inventory` - Create new inventory item
- `PUT /api/inventory/:imei` - Update inventory item
- `DELETE /api/inventory/:imei` - Delete inventory item
- `GET /api/inventory/stats/summary` - Get inventory statistics

### Sales
- `GET /api/sales` - Get all sales (with filters)
- `GET /api/sales/:id` - Get specific sale by ID
- `POST /api/sales` - Create new sale
- `PUT /api/sales/:id` - Update sale
- `DELETE /api/sales/:id` - Delete sale
- `GET /api/sales/stats/summary` - Get sales statistics

## Database Schema

### Inventory Items
- `imei`: String (required, unique)
- `state`: Enum (New, Repair, Repaired, Sold, Lost, Clearance)
- `branch`: String (required)
- `hiddenDetails`: Object
- `model`, `brand`, `price`, `notes`: Optional fields

### Sales
- `description`: Enum (Fair, Payment, Sale, Deposit)
- `finance`: Enum (Payjoy, Lespago, Repair, Accessory, Cash, Other)
- `concept`: String (required)
- `imei`: String (optional, references inventory)
- `paymentType`: String (required)
- `reference`: String (required)
- `amount`: Number (required)
- Additional fields: `customerName`, `customerPhone`, `branch`, `notes`

## Development

The application is built with modern web technologies and follows best practices:

- TypeScript for type safety
- React Hook Form for form handling
- Styled Components for styling
- Mongoose for MongoDB ODM
- Express.js for REST API
- Comprehensive error handling and validation

## Docker Deployment

The application includes Docker configuration for easy deployment:

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/MauLom/laboratorioCelular-POS.git
cd laboratorioCelular-POS

# Deploy in development mode
./deploy.sh development

# Or deploy in production mode
./deploy.sh production
```

### Docker Commands

```bash
# Development deployment (with hot reload)
./deploy.sh dev

# Production deployment
./deploy.sh prod

# Stop all services
./deploy.sh stop

# Remove all services and data
./deploy.sh down

# Show logs
./deploy.sh logs

# Show service status
./deploy.sh status
```

### Services

The Docker setup includes:

- **Frontend**: React app served with nginx (port 3000)
- **Backend**: Node.js API (port 5000) 
- **MongoDB**: Database with authentication (port 27017)
- **Nginx**: Reverse proxy for production (ports 80/443)

### Production Deployment

For production deployment on DigitalOcean VPS with Cloudflare:

1. See detailed instructions in [DEPLOYMENT.md](./DEPLOYMENT.md)
2. Configure your domain and SSL certificates
3. Set production environment variables
4. Run `./deploy.sh production`

### Environment Configuration

The application supports multiple environment configurations:

- `development` - Local development with hot reload
- `docker` - Docker development environment
- `production` - Production deployment with nginx

Use the setup script to configure environments:
```bash
./setup-env.sh docker     # For Docker development
./setup-env.sh production # For production deployment
```

## License

MIT