# BuildStock Pro - Backend

This is the Laravel backend for the BuildStock Pro application, a construction project management system with inventory tracking, cost management, and team collaboration features.

## Features

- User Authentication (Registration, Login, Logout)
- Company Management
- Project Management
- Inventory/Material Management
- Supplier Management
- Order Management
- Stock Movement Tracking

## Tech Stack

- Laravel 12.x
- PHP 8.2+
- MySQL
- Laravel Sanctum for API Authentication

## Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```
   cd backend
   ```

3. Install PHP dependencies:
   ```
   composer install
   ```

4. Copy and configure the environment file:
   ```
   cp .env.example .env
   ```

5. Generate application key:
   ```
   php artisan key:generate
   ```

6. Configure your database settings in the `.env` file

7. Run database migrations:
   ```
   php artisan migrate
   ```

8. Install Laravel Sanctum:
   ```
   php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
   ```

9. Run the development server:
   ```
   php artisan serve
   ```

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login user
- `POST /api/logout` - Logout user (authenticated)
- `GET /api/user` - Get authenticated user (authenticated)

### Companies
- `GET /api/companies` - Get all companies (authenticated)
- `POST /api/companies` - Create a new company (authenticated)
- `GET /api/companies/{company}` - Get a specific company (authenticated)
- `PUT /api/companies/{company}` - Update a company (authenticated)
- `DELETE /api/companies/{company}` - Delete a company (authenticated)

### Projects
- `GET /api/projects` - Get all projects (authenticated)
- `POST /api/projects` - Create a new project (authenticated)
- `GET /api/projects/{project}` - Get a specific project (authenticated)
- `PUT /api/projects/{project}` - Update a project (authenticated)
- `DELETE /api/projects/{project}` - Delete a project (authenticated)

### Materials
- `GET /api/materials` - Get all materials (authenticated)
- `POST /api/materials` - Create a new material (authenticated)
- `GET /api/materials/{material}` - Get a specific material (authenticated)
- `PUT /api/materials/{material}` - Update a material (authenticated)
- `DELETE /api/materials/{material}` - Delete a material (authenticated)

### Suppliers
- `GET /api/suppliers` - Get all suppliers (authenticated)
- `POST /api/suppliers` - Create a new supplier (authenticated)
- `GET /api/suppliers/{supplier}` - Get a specific supplier (authenticated)
- `PUT /api/suppliers/{supplier}` - Update a supplier (authenticated)
- `DELETE /api/suppliers/{supplier}` - Delete a supplier (authenticated)

### Orders
- `GET /api/orders` - Get all orders (authenticated)
- `POST /api/orders` - Create a new order (authenticated)
- `GET /api/orders/{order}` - Get a specific order (authenticated)
- `PUT /api/orders/{order}` - Update an order (authenticated)
- `DELETE /api/orders/{order}` - Delete an order (authenticated)

### Stock Movements
- `GET /api/stock-movements` - Get all stock movements (authenticated)
- `POST /api/stock-movements` - Create a new stock movement (authenticated)
- `GET /api/stock-movements/{stockMovement}` - Get a specific stock movement (authenticated)

## Database Structure

The application uses the following database tables:

1. `users` - Stores user information
2. `companies` - Stores company information
3. `projects` - Stores project information
4. `materials` - Stores inventory/material information
5. `suppliers` - Stores supplier information
6. `orders` - Stores order information
7. `stock_movements` - Tracks stock movements (in/out)
8. `project_material` - Pivot table for project-material relationships
9. `personal_access_tokens` - Laravel Sanctum tokens

See [database_complete.txt](database/database_complete.txt) for the complete MySQL schema with all tables in the correct creation order, including commands to handle existing tables.

## Environment Variables

The following environment variables need to be configured in the `.env` file:

- `DB_CONNECTION` - Database connection type (mysql, sqlite, etc.)
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_DATABASE` - Database name
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password

## Frontend Integration

The backend is designed to work with the Next.js frontend. The API endpoints are structured to match the frontend's expectations.

To connect the frontend to this backend:

1. Update the frontend's API base URL to point to this backend (typically `http://localhost:8000/api`)
2. Ensure CORS is properly configured in `config/cors.php`
3. The frontend should send the Sanctum token in the Authorization header for authenticated requests

## License

This project is proprietary and confidential. All rights reserved.