# User Management System

This document describes the user management and authentication system implemented for the Laboratorio Celular POS application.

## Overview

The system provides role-based access control with the following features:
- JWT-based authentication
- Password hashing with bcrypt
- Role-based authorization
- Franchise location assignment
- User management interface (Master admin only)

## User Roles

### 1. **Master admin**
- **Permissions**: Full system access
- **Capabilities**:
  - Create and manage all users
  - Create and manage franchise locations
  - Access all system features
  - Cannot be deleted by other users

### 2. **Supervisor de oficina** (Office Supervisor)
- **Permissions**: Manage office operations
- **Franchise Location**: Not required
- **Capabilities**: Access to inventory and sales management

### 3. **Supervisor de sucursales** (Branches Supervisor)
- **Permissions**: Manage multiple branch operations
- **Franchise Location**: Not required
- **Capabilities**: Access to inventory and sales management

### 4. **Supervisor de sucursal** (Branch Supervisor)
- **Permissions**: Manage specific branch operations
- **Franchise Location**: **Required** - Must be assigned to a specific branch
- **Capabilities**: Access to inventory and sales management for their branch

### 5. **Oficina** (Office)
- **Permissions**: Office-level operations
- **Franchise Location**: **Required** - Must be assigned to a specific office
- **Capabilities**: Limited access to office operations

### 6. **Cajero** (Cashier)
- **Permissions**: Basic sales operations
- **Franchise Location**: **Required** - Must be assigned to a specific location
- **Capabilities**: Access to sales management for their location

## Getting Started

### 1. Setup Environment
Ensure your `.env` file includes the JWT_SECRET:
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 2. Create Master Administrator
Run the following command to create the initial Master admin user:
```bash
cd backend
npm run create-admin
```

**Default Master Admin Credentials:**
- Username: `admin`
- Password: `admin123`
- Email: `admin@laboratoirocelular.com`

⚠️ **Important**: Change the default password after first login!

### 3. Login to the System
1. Navigate to `http://localhost:3000`
2. You'll be redirected to the login page
3. Enter the Master admin credentials
4. You'll be redirected to the dashboard

## User Management Interface

### Accessing User Management
Only Master admin users can access the user management interface:
1. Login as Master admin
2. Click "Usuarios" in the navigation bar
3. The interface allows you to:
   - View all users
   - Create new users
   - Edit existing users
   - Deactivate users
   - Reset passwords

### Creating Users
1. Click "Crear Usuario"
2. Fill in the required information:
   - Username (unique)
   - Email (unique)
   - Password (minimum 6 characters)
   - First Name
   - Last Name
   - Role
   - Franchise Location (if required by role)

### Role-Location Requirements
Some roles require assignment to a franchise location:
- **Cajero**: Must be assigned to a location
- **Supervisor de sucursal**: Must be assigned to a location
- **Oficina**: Must be assigned to a location

## Franchise Locations

### Creating Locations
Master admins can create franchise locations with the following information:
- **Name**: Display name of the location
- **Code**: Unique identifier (uppercase letters and numbers only)
- **Type**: Either "Sucursal" (Branch) or "Oficina" (Office)
- **Address**: Complete address information
- **Contact**: Phone and email information
- **Notes**: Additional information

### Location Management
- Only Master admins can create, edit, or deactivate locations
- Locations with active users assigned cannot be deleted
- Locations can be filtered by type (Sucursal/Oficina)

## Authentication Flow

### Frontend Authentication
1. **AuthContext**: Manages authentication state
2. **ProtectedRoute**: Protects routes requiring authentication
3. **Role-based Access**: Components check user roles before rendering

### Backend Security
1. **JWT Tokens**: 24-hour expiration
2. **Password Hashing**: bcrypt with salt rounds
3. **Middleware**: Authentication and authorization middleware
4. **Input Validation**: Comprehensive validation on all inputs

## API Endpoints

### Authentication (`/api/auth`)
- `POST /login` - User login
- `GET /profile` - Get current user profile
- `PUT /profile` - Update user profile
- `PUT /change-password` - Change password
- `GET /verify` - Verify JWT token
- `POST /logout` - Logout user

### User Management (`/api/users`) - Master admin only
- `GET /` - Get all users (with pagination)
- `GET /:id` - Get user by ID
- `POST /` - Create new user
- `PUT /:id` - Update user
- `DELETE /:id` - Deactivate user
- `POST /:id/reset-password` - Reset user password
- `GET /stats/summary` - Get user statistics

### Franchise Locations (`/api/franchise-locations`)
- `GET /` - Get all locations (Master admin only)
- `GET /active` - Get active locations (for dropdowns)
- `GET /:id` - Get location by ID
- `POST /` - Create location (Master admin only)
- `PUT /:id` - Update location (Master admin only)
- `DELETE /:id` - Deactivate location (Master admin only)
- `GET /stats/summary` - Get location statistics

## Security Features

### Password Security
- Minimum 6 characters
- bcrypt hashing with salt rounds
- No passwords stored in plain text
- Password change functionality

### Token Security
- JWT tokens with 24-hour expiration
- Tokens stored in localStorage
- Automatic logout on token expiration
- Token verification on protected routes

### Input Validation
- Email format validation
- Username uniqueness
- Role-location requirement validation
- XSS protection with helmet middleware

## Troubleshooting

### Cannot Login
1. Verify MongoDB is running and connected
2. Check that Master admin user exists (`npm run create-admin`)
3. Verify correct credentials
4. Check browser console for errors

### Cannot Access User Management
- Only Master admin users can access user management
- Verify you're logged in as Master admin
- Check the navigation bar for "Usuarios" link

### Franchise Location Errors
- Ensure roles requiring locations have locations assigned
- Verify location codes are unique
- Check that location is active

## Database Schema

### Users Collection
```javascript
{
  username: String (unique, required),
  email: String (unique, required),
  password: String (hashed, required),
  firstName: String (required),
  lastName: String (required),
  role: String (enum, required),
  franchiseLocation: ObjectId (ref to FranchiseLocation),
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdBy: ObjectId (ref to User),
  createdAt: Date,
  updatedAt: Date
}
```

### FranchiseLocations Collection
```javascript
{
  name: String (required),
  code: String (unique, uppercase, required),
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String (default: "Mexico")
  },
  contact: {
    phone: String,
    email: String
  },
  type: String (enum: ["Sucursal", "Oficina"]),
  isActive: Boolean (default: true),
  createdBy: ObjectId (ref to User),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Development Notes

### Adding New Roles
To add a new role:
1. Update the `UserRole` type in `frontend/src/types/index.ts`
2. Update the role enum in `backend/models/User.js`
3. Update the role list in `frontend/src/pages/UserManagement.tsx`
4. Add role to location requirement check if needed

### Extending Permissions
The permission system is role-based. To add new permissions:
1. Update authorization middleware in `backend/middleware/auth.js`
2. Update frontend role checks in components
3. Add new role-based routes if needed

## Security Considerations

⚠️ **Production Deployment**:
1. Change default JWT_SECRET
2. Use strong passwords
3. Enable HTTPS
4. Regular password rotation
5. Monitor failed login attempts
6. Regular security updates