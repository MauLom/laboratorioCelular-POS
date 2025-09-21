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

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

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

## License

MIT