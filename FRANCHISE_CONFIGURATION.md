# Franchise Configuration Module

## Overview

The Franchise Configuration module provides a comprehensive interface for Master admin users to manage franchise locations and their associated users. This module addresses the requirement to "setup a module within the application so franchises could be setup edited and users attached to franchises."

## Features Implemented

### 🏢 Franchise Location Management
- **Create New Locations**: Complete form with validation for all location details
- **Edit Existing Locations**: Modify any location properties
- **Activate/Deactivate Locations**: Soft delete functionality with user validation
- **View Location Details**: Comprehensive display of location information
- **Pagination**: Handle large numbers of locations efficiently

### 👥 User Assignment Management
- **View Assigned Users**: See all users currently assigned to each location
- **User Integration**: Seamless integration with existing user management system
- **Role-based Filtering**: Only show users that require location assignment

### 🔐 Security & Access Control
- **Master Admin Only**: Module is restricted to Master admin role
- **Protected Routes**: All functionality requires authentication
- **Data Validation**: Comprehensive form validation and error handling

## Technical Implementation

### Frontend Components

#### FranchiseConfiguration.tsx
- **Location**: `frontend/src/pages/FranchiseConfiguration.tsx`
- **Features**:
  - Card-based UI for displaying franchise locations
  - Modal forms for creating/editing locations
  - User viewing functionality
  - Pagination with smart navigation
  - Real-time success/error messaging
  - Responsive design optimized for desktop and mobile

#### Navigation Integration
- **Location**: `frontend/src/components/common/Navigation.tsx`
- **Enhancement**: Added "Configuración" link visible only to Master admin users

#### Route Configuration
- **Location**: `frontend/src/App.tsx`
- **Route**: `/configuration` - Protected route requiring Master admin role

### Backend Integration

The module leverages existing backend infrastructure:

#### Franchise Locations API (`/api/franchise-locations`)
- `GET /` - List all locations with pagination
- `GET /active` - Get active locations for dropdowns
- `GET /:id` - Get specific location details
- `POST /` - Create new location
- `PUT /:id` - Update existing location
- `DELETE /:id` - Deactivate location (soft delete)

#### User Management Integration
- Utilizes existing user management API for viewing assigned users
- Maintains relationship between users and franchise locations
- Prevents deletion of locations with active users

## UI/UX Design

### Visual Elements
- **Card Layout**: Each franchise location displayed in an informative card
- **Status Indicators**: Visual badges for location type (Sucursal/Oficina) and status
- **Action Buttons**: Contextual buttons for view, edit, and activate/deactivate operations
- **Modal Forms**: Clean, accessible forms with proper validation
- **Spanish Interface**: All text and labels in Spanish for Mexican market

### User Experience
- **Intuitive Navigation**: Clear breadcrumbs and consistent navigation
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Loading States**: Visual feedback during API operations
- **Error Handling**: Clear error messages with actionable information
- **Success Feedback**: Confirmation messages for completed operations

## Data Structure

### Franchise Location Model
```typescript
interface FranchiseLocation {
  _id?: string;
  name: string;                    // Display name
  code: string;                    // Unique identifier (uppercase alphanumeric)
  type: 'Sucursal' | 'Oficina';   // Location type
  address: {                       // Complete address information
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  contact: {                       // Contact information
    phone?: string;
    email?: string;
  };
  isActive: boolean;               // Status flag
  notes?: string;                  // Additional information
  createdBy?: string;              // Master admin who created it
  createdAt?: string;              // Creation timestamp
  updatedAt?: string;              // Last update timestamp
}
```

## Usage Instructions

### Accessing the Module
1. Login as a Master admin user
2. Navigate to "Configuración" in the main navigation
3. The franchise configuration interface will load

### Creating a New Franchise Location
1. Click "Crear Nueva Ubicación"
2. Fill in required fields:
   - **Name**: Display name for the location
   - **Code**: Unique identifier (uppercase letters and numbers only)
   - **Type**: Select either "Sucursal" (Branch) or "Oficina" (Office)
3. Optionally fill in address and contact information
4. Add notes if needed
5. Click "Crear" to save

### Editing an Existing Location
1. Find the location card on the main page
2. Click "Editar" button
3. Modify the desired fields
4. Click "Actualizar" to save changes

### Viewing Users Assigned to a Location
1. Find the location card on the main page
2. Click "Ver Usuarios" button
3. A modal will display all users assigned to that location
4. Users are shown with their name, role, and status

### Deactivating a Location
1. Find the location card on the main page
2. Click "Desactivar" button
3. The location will be deactivated (soft delete)
4. Note: Locations with active users cannot be deactivated

## Integration with Existing Systems

### User Management Integration
- The module integrates seamlessly with the existing user management system
- Users can be assigned to franchise locations through the user management interface
- The franchise configuration module displays these relationships

### Role-based Access Control
- Leverages existing authentication and authorization middleware
- Only Master admin users can access the configuration module
- All API calls are properly authenticated and authorized

### Data Consistency
- Maintains referential integrity between users and franchise locations
- Prevents orphaned data through proper validation
- Supports both existing "branch" field and new "franchiseLocation" field for backward compatibility

## Error Handling

### Form Validation
- Required field validation
- Format validation (e.g., code format, email format)
- Length limits on all text fields
- Real-time validation feedback

### API Error Handling
- Network connectivity issues
- Authentication/authorization errors
- Server-side validation errors
- Database constraint violations
- User-friendly error messages in Spanish

### Business Logic Validation
- Unique code enforcement
- Active user checks before deactivation
- Role-based access control
- Data integrity checks

## Future Enhancements

### Potential Improvements
1. **Bulk Operations**: Import/export franchise locations
2. **Advanced Filtering**: Filter by type, status, region
3. **User Assignment Interface**: Direct user assignment from configuration module
4. **Location Analytics**: Usage statistics and performance metrics
5. **Geographic Integration**: Map view of franchise locations
6. **Audit Trail**: Track all changes to franchise locations

### Scalability Considerations
- Pagination handles large datasets efficiently
- API responses are optimized for performance
- Frontend components are designed for reusability
- Proper loading states prevent UI blocking

## Testing Considerations

### Manual Testing Scenarios
1. **Authentication Flow**: Verify only Master admin users can access
2. **CRUD Operations**: Test create, read, update, and deactivate functionality
3. **Form Validation**: Test all validation rules and error cases
4. **User Relationships**: Verify user-location relationships display correctly
5. **Responsive Design**: Test on various screen sizes
6. **Error Handling**: Test network failures and server errors

### API Testing
- All franchise location endpoints respond correctly
- Authentication middleware works properly
- Data validation is enforced
- Pagination works correctly
- User filtering by location functions properly

## Security Considerations

### Access Control
- Route-level protection with role checking
- API-level authentication and authorization
- Input sanitization and validation
- CSRF protection through proper request handling

### Data Protection
- Sensitive information is properly handled
- User data is displayed only to authorized personnel
- Audit trails for administrative actions
- Proper error messaging without information leakage