const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: './config.env' });

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cliqpat', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Connected to MongoDB successfully!');
})
.catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('💡 Make sure MongoDB is running locally or update MONGODB_URI in config.env');
    console.log('💡 You can start MongoDB locally or use MongoDB Atlas');
    // Don't exit the process, let the server run without DB for now
});

// Import Routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const ehrRoutes = require('./routes/ehr');
const webhookRoutes = require('./routes/webhook');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!require('fs').existsSync(uploadsDir)) {
    require('fs').mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files (with authentication middleware would be better in production)
app.use('/uploads', express.static(uploadsDir));

// Serve port file for frontend
app.get('/.port', (req, res) => {
    const portFile = path.join(__dirname, '.port');
    if (require('fs').existsSync(portFile)) {
        const port = require('fs').readFileSync(portFile, 'utf8');
        res.send(port);
    } else {
        res.send('5000');
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/ehr', ehrRoutes);
app.use('/api/webhook', webhookRoutes);

// Serve frontend routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const PORT = process.env.PORT || 5000;

// Function to find an available port
const findAvailablePort = async (startPort) => {
    const net = require('net');
    
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(startPort, () => {
            const { port } = server.address();
            server.close(() => resolve(port));
        });
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(findAvailablePort(startPort + 1));
            } else {
                reject(err);
            }
        });
    });
};

// Function to start server with automatic port selection
const startServer = async () => {
    try {
        // Force use port 5000 for consistency
        const desiredPort = 5000;
        const availablePort = await findAvailablePort(desiredPort);
        
        const server = app.listen(availablePort)
            .on('listening', () => {
                console.log(`🚀 Server running on port ${availablePort}`);
                console.log(`🌐 Frontend: http://localhost:${availablePort}`);
                console.log(`🔌 API: http://localhost:${availablePort}/api`);
                
                // Store the port in a file for frontend to read
                require('fs').writeFileSync('.port', availablePort.toString());
            })
            .on('error', (err) => {
                console.error('❌ Server error:', err.message);
                process.exit(1);
            });
        
        // Graceful shutdown
        const gracefulShutdown = (signal) => {
            console.log(`🛑 ${signal} received, shutting down gracefully...`);
            server.close(() => {
                console.log('✅ Server closed');
                // Clean up port file
                try {
                    require('fs').unlinkSync('.port');
                } catch (e) {
                    // File might not exist, ignore
                }
                process.exit(0);
            });
            
            // Force close after 10 seconds
            setTimeout(() => {
                console.error('⚠️ Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };
        
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        
        // Handle uncaught exceptions
        process.on('uncaughtException', (err) => {
            console.error('❌ Uncaught Exception:', err);
            gracefulShutdown('uncaughtException');
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('unhandledRejection');
        });
        
    } catch (err) {
        console.error('❌ Failed to start server:', err.message);
        process.exit(1);
    }
};

// Start the server
startServer();
