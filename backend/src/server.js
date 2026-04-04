require('dotenv').config();
const http = require('http');
const app = require('./app');
const prisma = require('./config/db');
const { initSocket } = require('./config/socket');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

async function startServer() {
    try {
        // Validate Database Connection
        await prisma.$connect();
        console.log('✅ Connected to MySQL Database via Prisma');

        server.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
