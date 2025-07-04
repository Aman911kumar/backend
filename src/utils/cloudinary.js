import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SCERET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        const responce = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        console.log('file uploaded successfull', responce.url);
        return responce

    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null;
    }
}

export {uploadOnCloudinary}