// Simple MySQL connection for Edge runtime
// This uses fetch to communicate with a MySQL API endpoint
// You'll need to set up a separate MySQL API service or use a hosted solution

interface QueryResult {
  rows: any[];
  affectedRows?: number;
  insertId?: number;
}

// Global mock data store to persist data across requests
declare global {
  var mockDataStore: { users: any[], companies: any[] } | undefined;
}

const getMockDataStore = () => {
  if (typeof global.mockDataStore === 'undefined') {
    global.mockDataStore = {
      users: [{
        id: '1',
        email: 'admin@example.com',
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S', // bcrypt hash for 'admin123'
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        company_id: '1',
        phone: '+1234567890',
        active: 1,
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00'
      }],
      companies: [{
        id: '1',
        name: 'Default Company',
        email: 'admin@company.com',
        currency: 'MAD',
        country: 'Maroc',
        timezone: 'Africa/Casablanca',
        is_active: 1,
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00',
      }]
    };
  }
  return global.mockDataStore;
};

class EdgeMySQL {
  private apiUrl: string;
  private mockData: { users: any[], companies: any[] };

  constructor(config: { 
    host: string; 
    port: number; 
    user: string; 
    password: string; 
    database: string 
  }) {
    // In a real implementation, you'd point this to your MySQL API endpoint
    // For now, we'll simulate the behavior
    this.apiUrl = `${process.env.MYSQL_API_URL || 'http://localhost:3001'}/api/mysql`;
    // Use the global mock data store to persist data across requests
    this.mockData = getMockDataStore();
  }

  async query(sql: string, params: any[] = []): Promise<QueryResult> {
    try {
      // Simulate MySQL query for development
      // In production, this would call your MySQL API
      console.log('🔍 MySQL Query:', sql, params);
      
      // Return mock data for common queries
      if (sql.includes('SELECT 1')) {
        return { rows: [{ '1': 1 }] };
      }
      
      if (sql.includes('users') && sql.includes('WHERE email = ?') && sql.includes('active = 1')) {
        // Mock user lookup - find user by email with active status
        const email = params[0];
        
        // Find user by email
        const user = this.mockData.users.find(u => u.email === email && u.active === 1);
        if (user) {
          return { rows: [user] };
        }
        return { rows: [] };
      }
      
      if (sql.includes('SELECT * FROM users WHERE id = ?') && sql.includes('active = 1')) {
        // Mock user lookup by ID with active status
        const userId = params[0];
        const user = this.mockData.users.find(u => u.id === userId && u.active === 1);
        if (user) {
          return { rows: [user] };
        }
        return { rows: [] };
      }
      
      if (sql.includes('SELECT * FROM users WHERE id = ?')) {
        // Mock user lookup by ID without active status requirement
        const userId = params[0];
        const user = this.mockData.users.find(u => u.id === userId);
        if (user) {
          return { rows: [user] };
        }
        return { rows: [] };
      }
      
      if (sql.includes('SELECT * FROM companies WHERE id = ?')) {
        // Mock company lookup by ID
        const companyId = params[0];
        const company = this.mockData.companies.find(c => c.id === companyId);
        if (company) {
          return { rows: [company] };
        }
        return { rows: [] };
      }
      
      if (sql.includes('INSERT INTO users')) {
        // Mock user creation
        const userData = params; // In a real implementation, you'd extract this from the SQL
        const newUser = {
          id: (this.mockData.users.length + 1).toString(),
          ...userData[0], // Assuming the first param is the user data
          created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        };
        this.mockData.users.push(newUser);
        return { rows: [newUser], insertId: parseInt(newUser.id) };
      }
      
      if (sql.includes('UPDATE users') && sql.includes('WHERE id = ?')) {
        // Mock user update
        const userId = params[params.length - 1]; // Last param is typically the user ID in WHERE clause
        const userIndex = this.mockData.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
          return { rows: [], affectedRows: 0 };
        }
        
        // Extract update fields (excluding the ID at the end)
        const updates = {};
        // In a real implementation, you'd parse the SQL to know which fields to update
        // For this mock, we'll just return the user as if the update succeeded
        return { rows: [this.mockData.users[userIndex]], affectedRows: 1 };
      }
      
      if (sql.includes('DELETE FROM users') && sql.includes('WHERE id = ?')) {
        // Mock user deletion
        const userId = params[0];
        
        // Find index of user to delete
        const userIndex = this.mockData.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
          return { rows: [], affectedRows: 0 };
        }
        
        // Simulate successful deletion for any user ID except '1' (admin)
        if (userId === '1') {
          throw new Error('Cannot delete admin user');
        }
        
        this.mockData.users.splice(userIndex, 1);
        
        return { 
          rows: [], 
          affectedRows: 1 
        };
      }
      
      // Default mock response
      return { rows: [] };
      
    } catch (error: any) {
      console.error('MySQL Query Error:', error);
      throw error;
    }
  }

  async end() {
    // Cleanup connection (no-op for this mock implementation)
    return Promise.resolve();
  }
}

// Create connection factory
export function getDb() {
  return new EdgeMySQL({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'stock_management'
  });
}

export default getDb;