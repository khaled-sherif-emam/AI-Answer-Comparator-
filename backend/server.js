import 'dotenv/config';
import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/authRoutes.js";
import userInfoRoutes from "./src/routes/userInfoRoutes.js";
import sidebarRoutes from "./src/routes/sidebarRoutes.js";
import { router as chatRoutes } from "./src/routes/ChatRoutes.js";

// Initialize app
const app = express();

// CORS configuration - more permissive for development
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, you can restrict to specific origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      // Add production domains here
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the backend server!' });
});

// Auth routes
app.use('/auth', authRoutes);

// User info routes
app.use('/api/user', userInfoRoutes);

// Sidebar routes
app.use('/api/sidebar', sidebarRoutes);

app.use("/api/chat", chatRoutes);

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('Testing database connection...');
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
    console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set');
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase environment variables');
    }
    
    // Try to connect to Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    // Try a simple query
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .limit(1);
      
    if (error) throw error;
    
    res.json({
      success: true,
      message: 'Database connection successful',
      data: data || []
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
