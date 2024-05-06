import { v2 as cloudinary } from "cloudinary";
import currentENV from "./constants";


cloudinary.config({
    cloud_name: currentENV.CLOUDINARY_API_CLOUDNAME,
    api_key: currentENV.CLOUDINARY_API_KEY,
    api_secret: currentENV.CLOUDINARY_API_SECRET,
    secure: true,
});

const cloudUploader = cloudinary.uploader;

export const cloudApi = cloudinary.api;


export default cloudUploader;