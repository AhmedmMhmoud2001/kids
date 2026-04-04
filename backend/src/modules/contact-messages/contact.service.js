const prisma = require('../../config/db');

exports.createMessage = async (data) => {
    return prisma.contactMessage.create({
        data: {
            name: data.name,
            email: data.email,
            subject: data.subject,
            message: data.message
        }
    });
};

exports.getAllMessages = async () => {
    return prisma.contactMessage.findMany({
        orderBy: {
            createdAt: 'desc'
        }
    });
};

exports.deleteMessageById = async (id) => {
    return prisma.contactMessage.delete({
        where: { id }
    });
};
