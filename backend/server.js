import 'dotenv/config';
import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/authRoutes.js";
import userInfoRoutes from "./src/routes/userInfoRoutes.js";

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

// Start server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
