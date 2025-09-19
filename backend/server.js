import 'dotenv/config';
import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/authRoutes.js";

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3000/'
];

// Handle preflight requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Regular CORS for all other requests
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the backend server!' });
});

// Auth routes
app.use('/auth', authRoutes);

// Start server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
