const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadStream = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "hackcbs_problems" },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

exports.uploadFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files provided' });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      const mockUrls = req.files.map(file => ({
        url: `https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80`,
        mediaType: file.mimetype.startsWith('video/') ? 'video' : 'image',
        name: file.originalname
      }));
      return res.status(200).json({
        success: true,
        message: 'Files uploaded successfully (Dev mock mode: configure CLOUDINARY_CLOUD_NAME for live cloud upload)',
        data: mockUrls
      });
    }

    const uploadedUrls = [];

    for (const file of req.files) {
      const result = await uploadStream(file.buffer);
      
      uploadedUrls.push({
        url: result.secure_url,
        mediaType: file.mimetype.startsWith('video/') ? 'video' : 'image',
        name: file.originalname
      });
    }

    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully to Cloudinary',
      data: uploadedUrls
    });
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload files to Cloudinary',
      error: error.message
    });
  }
};
