const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

// Route imports
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const contactRoutes = require('./routes/contactRoutes');
const orderRoutes = require('./routes/orderRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const packageRoutes = require('./routes/packageRoutes');
const adminLogRouter = require('./routes/adminLogRoutes');
const blogRoutes = require('./routes/blogRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const ipfsRoutes = require('./routes/ipfsRoutes');
const calendarRoutes= require('./routes/calenderRoutes');
const chatbotRoutes = require("./routes/chatbotRoutes");

const bookingRoutes = require("./routes/booking");
const app = express();

// --- ✅ CORS Configuration ---
const corsOptions = {
  origin: 'https://www.teenytechtrek.com', // Your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions)); // Enable CORS
app.options('*', cors(corsOptions)); // Handle preflight OPTIONS requests

// --- Middlewares ---
app.use(helmet());
app.use(cors({
    origin: 'https://www.teenytechtrek.com',
    credentials: true
  }));  
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/newsletters', newsletterRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/adminLogs', adminLogRouter);
app.use('/api/blogs', blogRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/ipfs', ipfsRoutes);
app.use('/api/calendar', calendarRoutes); 
app.use("/api", chatbotRoutes);
app.use("/api", bookingRoutes);
// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

module.exports = app;
