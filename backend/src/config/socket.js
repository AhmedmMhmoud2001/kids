const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.ALLOWED_ORIGINS?.split(',') || [
                'http://localhost:5173',
                'http://localhost:3000',
                'http://localhost:5174'
            ],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('👤 New client connected:', socket.id);

        // Join room based on user role/ID
        socket.on('join', (userId) => {
            socket.join(userId);
            console.log(`🏠 User ${userId} joined their room`);
        });

        // Join admin room
        socket.on('join_admin', () => {
            socket.join('admins');
            console.log('🛡️ Admin joined admins room');
        });

        socket.on('disconnect', () => {
            console.log('👤 Client disconnected');
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

const emitToAdmins = (event, data) => {
    if (io) {
        io.to('admins').emit(event, data);
    }
}

const emitToUser = (userId, event, data) => {
    if (io) {
        io.to(userId).emit(event, data);
    }
}

module.exports = { initSocket, getIO, emitToAdmins, emitToUser };
