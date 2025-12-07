# Database Setup

This directory contains the MySQL database schema for the BuildStock Pro application.

## Database Schema

The [database_complete.txt](database_complete.txt) file contains the complete MySQL schema with all CREATE TABLE statements in the correct order for:

1. Companies
2. Users and Authentication
3. Projects
4. Materials/Inventory
5. Suppliers
6. Orders
7. Stock Movements
8. Project-Material relationships
9. Laravel System Tables (cache, sessions, jobs, etc.)

## Setting Up the Database

1. Create a MySQL database:
   ```sql
   CREATE DATABASE buildstock_pro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. Create a database user (optional but recommended):
   ```sql
   CREATE USER 'buildstock_user'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON buildstock_pro.* TO 'buildstock_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. Execute the SQL statements from [database_complete.txt](database_complete.txt) to create all tables. This file includes:
   - Commands to drop existing tables (if they exist)
   - Commands to create all tables in the correct order
   - Sample data insertion (optional)

## Using with Laravel

1. Update your `.env` file with your database credentials:
   ```
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=buildstock_pro
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   ```

2. Run Laravel migrations (optional, as the schema is already defined):
   ```bash
   php artisan migrate
   ```

## Database Relationships

The database schema implements the following relationships:

- Users belong to Companies (one-to-many)
- Projects belong to Companies (one-to-many)
- Materials belong to Companies (one-to-many)
- Suppliers belong to Companies (one-to-many)
- Orders belong to Companies and Suppliers (many-to-one)
- Stock Movements belong to Companies, Materials, and Orders (many-to-one)
- Projects and Materials have a many-to-many relationship through the project_material table

All foreign key constraints are properly defined to maintain data integrity.