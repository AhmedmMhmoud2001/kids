const fs = require('fs');
const path = require('path');

/**
 * Delete a file from the server using its URL
 * @param {string} imageUrl - Full URL of the image
 * @param {string} subFolder - Optional subfolder where images are stored (e.g. 'users', 'categories')
 */
const deleteFileFromUrl = async (imageUrl, subFolder = '') => {
    if (!imageUrl || typeof imageUrl !== 'string') return;

    try {
        // Only attempt to delete files that are on our server
        // Example URL: http://localhost:5000/uploads/users/filename.webp
        const uploadsMarker = '/uploads/';
        if (!imageUrl.includes(uploadsMarker)) return;

        // Extract the filename and the path parts after /uploads/
        const urlParts = imageUrl.split(uploadsMarker);
        const relativePath = urlParts[1];

        // Construct the absolute path
        // __dirname is in src/utils, so we go up 2 levels to backend/
        const filePath = path.join(__dirname, '../../uploads', relativePath);

        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
            console.log(`Successfully deleted file: ${filePath}`);
        }
    } catch (error) {
        console.error('Error deleting file:', imageUrl, error.message);
    }
};

module.exports = {
    deleteFileFromUrl
};
