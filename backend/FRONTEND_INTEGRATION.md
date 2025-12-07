# Frontend Integration Guide

This document explains how to connect the Next.js frontend to the Laravel backend.

## API Endpoints

All API endpoints are prefixed with `/api`. Here's a summary of the available endpoints:

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login user
- `POST /api/logout` - Logout user (requires authentication)
- `GET /api/user` - Get authenticated user (requires authentication)

### Companies
- `GET /api/companies` - Get all companies (requires authentication)
- `POST /api/companies` - Create a new company (requires authentication)
- `GET /api/companies/{company}` - Get a specific company (requires authentication)
- `PUT /api/companies/{company}` - Update a company (requires authentication)
- `DELETE /api/companies/{company}` - Delete a company (requires authentication)

### Projects
- `GET /api/projects` - Get all projects (requires authentication)
- `POST /api/projects` - Create a new project (requires authentication)
- `GET /api/projects/{project}` - Get a specific project (requires authentication)
- `PUT /api/projects/{project}` - Update a project (requires authentication)
- `DELETE /api/projects/{project}` - Delete a project (requires authentication)

### Materials
- `GET /api/materials` - Get all materials (requires authentication)
- `POST /api/materials` - Create a new material (requires authentication)
- `GET /api/materials/{material}` - Get a specific material (requires authentication)
- `PUT /api/materials/{material}` - Update a material (requires authentication)
- `DELETE /api/materials/{material}` - Delete a material (requires authentication)

### Suppliers
- `GET /api/suppliers` - Get all suppliers (requires authentication)
- `POST /api/suppliers` - Create a new supplier (requires authentication)
- `GET /api/suppliers/{supplier}` - Get a specific supplier (requires authentication)
- `PUT /api/suppliers/{supplier}` - Update a supplier (requires authentication)
- `DELETE /api/suppliers/{supplier}` - Delete a supplier (requires authentication)

### Orders
- `GET /api/orders` - Get all orders (requires authentication)
- `POST /api/orders` - Create a new order (requires authentication)
- `GET /api/orders/{order}` - Get a specific order (requires authentication)
- `PUT /api/orders/{order}` - Update an order (requires authentication)
- `DELETE /api/orders/{order}` - Delete an order (requires authentication)

### Stock Movements
- `GET /api/stock-movements` - Get all stock movements (requires authentication)
- `POST /api/stock-movements` - Create a new stock movement (requires authentication)
- `GET /api/stock-movements/{stockMovement}` - Get a specific stock movement (requires authentication)

## Authentication Flow

1. **Registration**: 
   - Send a POST request to `/api/register` with the following data:
     ```json
     {
       "company_name": "Company Name",
       "siret": "12345678901234",
       "name": "User Name",
       "email": "user@example.com",
       "password": "password123",
       "password_confirmation": "password123"
     }
     ```
   - On success, you'll receive a user object and an authentication token.

2. **Login**:
   - Send a POST request to `/api/login` with the following data:
     ```json
     {
       "email": "user@example.com",
       "password": "password123"
     }
     ```
   - On success, you'll receive a user object and an authentication token.

3. **Authenticated Requests**:
   - For all subsequent requests that require authentication, include the token in the Authorization header:
     ```
     Authorization: Bearer YOUR_TOKEN_HERE
     ```

4. **Logout**:
   - Send a POST request to `/api/logout` with the Authorization header.
   - On success, the token will be invalidated.

## Data Structures

### User
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "company_id": 1,
  "role": "admin",
  "created_at": "2023-01-01T00:00:00.000000Z",
  "updated_at": "2023-01-01T00:00:00.000000Z"
}
```

### Company
```json
{
  "id": 1,
  "name": "Construction Company",
  "siret": "12345678901234",
  "created_at": "2023-01-01T00:00:00.000000Z",
  "updated_at": "2023-01-01T00:00:00.000000Z"
}
```

### Project
```json
{
  "id": 1,
  "company_id": 1,
  "name": "Building Project",
  "location": "City, Country",
  "status": "active",
  "budget": "500000.00",
  "spent": "250000.00",
  "start_date": "2023-01-01",
  "end_date": "2024-01-01",
  "created_at": "2023-01-01T00:00:00.000000Z",
  "updated_at": "2023-01-01T00:00:00.000000Z"
}
```

### Material
```json
{
  "id": 1,
  "company_id": 1,
  "name": "Cement",
  "category": "concrete",
  "unit": "bags",
  "available": "100.00",
  "minimum": "50.00",
  "price": "10.00",
  "created_at": "2023-01-01T00:00:00.000000Z",
  "updated_at": "2023-01-01T00:00:00.000000Z"
}
```

### Supplier
```json
{
  "id": 1,
  "company_id": 1,
  "name": "Supplier Name",
  "contact_person": "Contact Person",
  "email": "contact@supplier.com",
  "phone": "+1234567890",
  "address": "123 Supplier Street, City, Country",
  "created_at": "2023-01-01T00:00:00.000000Z",
  "updated_at": "2023-01-01T00:00:00.000000Z"
}
```

### Order
```json
{
  "id": 1,
  "company_id": 1,
  "supplier_id": 1,
  "order_number": "ORD-001",
  "total_amount": "5000.00",
  "status": "pending",
  "order_date": "2023-01-01",
  "expected_delivery_date": "2023-01-15",
  "actual_delivery_date": null,
  "created_at": "2023-01-01T00:00:00.000000Z",
  "updated_at": "2023-01-01T00:00:00.000000Z"
}
```

## Frontend Modifications

To connect the frontend to this backend, you'll need to:

1. Update the API base URL in your frontend configuration to point to the Laravel backend (typically `http://localhost:8000/api`)

2. Modify the authentication context to use the Laravel API endpoints instead of localStorage:
   - Replace the mock login function with a real API call to `/api/login`
   - Store the token in localStorage or cookies
   - Include the token in the Authorization header for authenticated requests
   - Implement proper logout functionality that calls `/api/logout`

3. Update all data fetching functions to use the Laravel API endpoints

4. Handle API responses appropriately, including error handling

## Example Frontend Implementation

Here's an example of how to implement the login functionality:

```javascript
// In your auth context or service file
const login = async (email, password) => {
  try {
    const response = await fetch('http://localhost:8000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    
    // Store the token
    localStorage.setItem('auth_token', data.token);
    
    // Store the user data
    localStorage.setItem('buildstock_user', JSON.stringify(data.user));
    
    return data.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// For authenticated requests, include the token:
const getProjects = async () => {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch('http://localhost:8000/api/projects', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }

  return await response.json();
};
```

## CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000` (Next.js default)
- `http://localhost:8000` (Laravel default)

If you're using different ports, update the `allowed_origins` array in `config/cors.php`.

## Error Handling

API responses follow standard HTTP status codes:
- 200: Success
- 201: Created
- 204: No Content (successful deletion)
- 400: Bad Request (validation errors)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Unprocessable Entity (validation errors)
- 500: Internal Server Error

Validation errors are returned in the following format:
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "field_name": [
      "Error message for the field"
    ]
  }
}
```