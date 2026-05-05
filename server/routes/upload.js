require('dotenv').config();
const express = require('express');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const router = express.Router();

const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: 'when_required',
    responseChecksumValidation: 'when_required',
});

const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'application/pdf'
];

const ALLOWED_FOLDERS = ['forum', 'course-thumbnails', 'profile-pictures', 'lecture-content', 'badges'];

const MAX_FILE_SIZE_MB = 100;

// Store file in memory temporarily before sending to R2
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 }
});

// Upload a file to R2
router.post('/upload', upload.single('file'), async (req, res) => {
    const { folder } = req.body;
    const file = req.file;

    if (!folder || !ALLOWED_FOLDERS.includes(folder)) {
        return res.status(400).json({ error: 'Invalid or missing folder' });
    }

    if (!ALLOWED_TYPES.includes(file.mimetype)) {
        return res.status(400).json({ error: 'File type not allowed' });
    }

    const fileExtension = file.originalname.split('.').pop();
    const fileKey = `${folder}/${uuidv4()}.${fileExtension}`;

    try {
        await r2.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
        }));

        res.json({ fileKey, fileName: file.originalname, fileType: file.mimetype });
    } catch (error) {
        console.error('Error uploading to R2:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// generate presigned URL for viewing/downloading a file
router.get('/file-url', async (req, res) => {
    const { fileKey } = req.query;

    if (!fileKey) {
        return res.status(400).json({ error: 'fileKey is required' });
    }

    // validate folder
    const isValidKey = ALLOWED_FOLDERS.some(folder => fileKey.startsWith(`${folder}/`));
    if (!isValidKey) {
        return res.status(403).json({ error: 'Invalid file key' });
    }

    const command = new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileKey,
    });

    try {
        const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });
        res.json({ presignedUrl });
    } catch (error) {
        console.error('Error generating download URL:', error);
        res.status(500).json({ error: 'Failed to generate file URL' });
    }
});

module.exports = router;