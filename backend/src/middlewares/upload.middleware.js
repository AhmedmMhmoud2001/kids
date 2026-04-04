const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Use memory storage for processing with sharp
const storage = multer.memoryStorage();

// File filter (images only)
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (JPEG, PNG, WebP, GIF)'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit (will be reduced after conversion)
    }
});

// Excel upload (memory, .xlsx / .xls only)
const excelFilter = (req, file, cb) => {
    const allowed = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
};
const uploadExcel = multer({
    storage: multer.memoryStorage(),
    fileFilter: excelFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports.uploadExcel = uploadExcel;

/**
 * Process and convert image to WebP
 * @param {Buffer} buffer - Image buffer
 * @param {Object} options - Processing options
 * @returns {Promise<{buffer: Buffer, info: Object}>}
 */
const processImage = async (buffer, options = {}) => {
    const {
        maxWidth = 1920,
        maxHeight = 1920,
        quality = 80,
        isProfile = false
    } = options;

    let sharpInstance = sharp(buffer);
    
    // Get image metadata
    const metadata = await sharpInstance.metadata();
    
    // Resize if image is larger than max dimensions
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
        sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true
        });
    }

    // For profile pictures, crop to square
    if (isProfile) {
        const size = Math.min(metadata.width, metadata.height, 500);
        sharpInstance = sharp(buffer)
            .resize(size, size, {
                fit: 'cover',
                position: 'center'
            });
    }

    // Convert to WebP
    const result = await sharpInstance
        .webp({ quality })
        .toBuffer({ resolveWithObject: true });

    return result;
};

/**
 * Middleware to convert uploaded image to WebP
 */
const convertToWebP = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    try {
        // Determine if this is a profile image
        const isProfile = req.path.includes('profile') || req.body.type === 'profile';
        
        // Process and convert to WebP
        const { data: buffer, info } = await processImage(req.file.buffer, {
            quality: 80,
            isProfile
        });

        // Generate filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = uniqueSuffix + '.webp';
        const filepath = path.join(uploadDir, filename);

        // Save to disk
        await fs.promises.writeFile(filepath, buffer);

        // Update req.file with new info
        req.file.filename = filename;
        req.file.path = filepath;
        req.file.size = info.size;
        req.file.mimetype = 'image/webp';
        
        // Add conversion info
        req.file.originalSize = req.file.buffer.length;
        req.file.convertedSize = info.size;
        req.file.savings = Math.round((1 - info.size / req.file.buffer.length) * 100);

        // Remove buffer from memory
        delete req.file.buffer;

        next();
    } catch (error) {
        console.error('Image conversion error:', error);
        next(error);
    }
};

/**
 * Process multiple images
 */
const convertMultipleToWebP = async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return next();
    }

    try {
        const processedFiles = await Promise.all(
            req.files.map(async (file) => {
                const { data: buffer, info } = await processImage(file.buffer, {
                    quality: 80
                });

                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const filename = uniqueSuffix + '.webp';
                const filepath = path.join(uploadDir, filename);

                await fs.promises.writeFile(filepath, buffer);

                return {
                    ...file,
                    filename,
                    path: filepath,
                    size: info.size,
                    mimetype: 'image/webp',
                    originalSize: file.buffer.length,
                    convertedSize: info.size,
                    savings: Math.round((1 - info.size / file.buffer.length) * 100)
                };
            })
        );

        req.files = processedFiles;
        next();
    } catch (error) {
        console.error('Multiple image conversion error:', error);
        next(error);
    }
};

module.exports = upload;
module.exports.uploadExcel = uploadExcel;
module.exports.convertToWebP = convertToWebP;
module.exports.convertMultipleToWebP = convertMultipleToWebP;
module.exports.processImage = processImage;
