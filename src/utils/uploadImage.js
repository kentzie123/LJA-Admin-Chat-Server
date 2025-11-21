import cloudinary from '../config/cloudinary.js';

export const uploadImage = async (filePath, folder) => {
  try {
    // console.log('Uploading image from:', filePath);
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `web-chat-app/${folder}`,
    });
    
    return { success: true, url: result.secure_url };
  } catch (error) {
    console.error('Upload failed:', error.message);
    return { success: false, error: error.message };
  }
};