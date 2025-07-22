import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'
import dotenv from 'dotenv'
import { apiError } from "./apiError.js";
dotenv.config({
    path: '../.env'
})

// console.log("cloudinary config = ",process.env.CLOUDINARY_CLOUD_NAME,process.env.CLOUDINARY_API_KEY,process.env.CLOUDINARY_API_SECRET,);


// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // const response = true
        // console.log("✅ File uploaded successfully:", response);
        // console.log("✅ File uploaded successfully:", response.url);
        fs.unlinkSync(localFilePath); // remove temp file
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); // remove temp file
        console.error("❌ Upload failed, local file deleted");
        throw new apiError(400, error?.message || "Error while uploading");
    }
};

const deleteFromCloudinary = async (filePublicId) => {
    try {
        if (!filePublicId) return null
        let response = await cloudinary.uploader.destroy(filePublicId, { resource_type: "image" })
        if (response.result !== "ok") {
            response = await cloudinary.uploader.destroy(filePublicId, { resource_type: "video" })
        }
        if (response.result !== "ok") {
            response = await cloudinary.uploader.destroy(filePublicId, { resource_type: "raw" })
        }
        return response
    } catch (error) {
        throw new apiError(400, error?.message || "Error while Deleting old image");

    }
}

export { uploadOnCloudinary, deleteFromCloudinary }