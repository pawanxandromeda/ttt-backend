// app.js

require('dotenv').config();
const express       = require('express');
const helmet        = require('helmet');
const cors          = require('cors');
const rateLimit     = require('express-rate-limit');
const cookieParser  = require('cookie-parser');

const userRoutes    = require('./routes/userRoutes');
const authRoutes    = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const packageRoutes = require('./routes/packageRoutes');
const adminLogRouter = require('./routes/adminLogRoutes');

const app = express();

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(cookieParser());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.use('/api/auth',  authRoutes);
app.use('/api/users', userRoutes);
app.use('api/orders', orderRoutes);
app.use('api/newsletters', newsletterRoutes);
app.use('api/packages', packageRoutes);
app.use('api/adminLogs', adminLogRouter);

module.exports = app;
