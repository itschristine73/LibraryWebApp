const express = require('express');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();
const MySQLStore = require('express-mysql-session')(session);
const bookRoutes = require('./routes/books');
const userRoutes = require('./routes/users');

const app = express();

// CORS setup (allow frontend apps to make requests)
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'], // Frontend domains
    credentials: true,  // Allow credentials (cookies) to be included in requests
}));

// MySQL session store configuration
const dbOptions = {
    host: process.env.DB_HOST,
    port: 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    database: process.env.DB_NAME
};

// Session store
const sessionStore = new MySQLStore(dbOptions);

// Session middleware setup (should be above routes)
app.use(session({
    secret: process.env.SESSION_SECRET, // Use environment variable for session secret
    store: sessionStore,  // MySQL session store
    resave: false,  // Don't save session if unmodified
    saveUninitialized: false,  // Don't create session until something is stored
    cookie: {
        secure: false,  // Set to true if using HTTPS
        httpOnly: true,  // Helps prevent XSS attacks
        sameSite: 'lax', // Helps prevent CSRF attacks
        maxAge: 1000 * 60 * 60 * 24,  // 1 day expiration
    }
}));

// Middleware to log session data for debugging
app.use((req, res, next) => {
    next();
});

// Static file setup for uploads
app.use('/uploads', express.static('uploads'));

// Body parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes setup
app.use('/api/books', bookRoutes);
app.use('/api/users', userRoutes);

// Function to list all registered routes
function listRoutes(app) {
    console.log("Registered Routes:");
    app.router.stack.forEach((middleware) => {
        if (middleware.route) { // Route middleware
            const { path, methods } = middleware.route;
            console.log(`${Object.keys(methods).join(', ').toUpperCase()} ${path}`);
        } else if (middleware.name === 'router') { // Router middleware
            middleware.handle.stack.forEach((handler) => {
                const route = handler.route;
                if (route) {
                    const { path, methods } = route;
                    console.log(`${Object.keys(methods).join(', ').toUpperCase()} ${path}`);
                }
            });
        }
    });
}

listRoutes(app);


// Starting the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
