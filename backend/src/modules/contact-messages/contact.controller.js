const contactService = require('./contact.service');

exports.sendMessage = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        await contactService.createMessage(req.body);

        res.status(201).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const messages = await contactService.getAllMessages();
        res.json({ success: true, data: messages });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

exports.deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;

        await contactService.deleteMessageById(id);

        res.json({ success: true, message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};