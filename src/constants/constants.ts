import 'dotenv/config';

export const MONGO_DB_URI = process.env.MONGO_DB_URI as string;
export const APP_BASE_URL = process.env.APP_BASE_URL as string;
export const PORT = Number(process.env.PORT) as number;
export const JWT_SECRET = process.env.JWT_SECRET as string;
export const VERIFICATION_LINK = process.env.VERIFICATION_LINK as string;
export const MAILTRAP_HOSTNAME = process.env.MAILTRAP_HOSTNAME as string;
export const MAILTRAP_PORT = Number(process.env.MAILTRAP_PORT) as number;
export const MAILTRAP_USER = process.env.MAILTRAP_USER as string;
export const MAILTRAP_PASS = process.env.MAILTRAP_PASS as string;
export const PASSWORD_RESET_LINK = process.env.PASSWORD_RESET_LINK as string;


export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY as string;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET as string;
export const CLOUDINARY_API_CLOUDNAME = process.env.CLOUDINARY_API_CLOUDNAME as string;


const STAGE = process.env.NODE_ENV === "production" ? "production" : "development";


const env = {
    production: {
        MONGO_DB_URI,
        PORT,
        APP_BASE_URL,
        JWT_SECRET,
        VERIFICATION_LINK,
        MAILTRAP_HOSTNAME,
        MAILTRAP_PORT,
        MAILTRAP_USER,
        MAILTRAP_PASS,
        PASSWORD_RESET_LINK,
        CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET,
        CLOUDINARY_API_CLOUDNAME,
    },
    development:{
        MONGO_DB_URI,
        PORT,
        APP_BASE_URL,
        JWT_SECRET,
        VERIFICATION_LINK,
        MAILTRAP_HOSTNAME,
        MAILTRAP_PORT,
        MAILTRAP_USER,
        MAILTRAP_PASS,
        PASSWORD_RESET_LINK,
        CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET,
        CLOUDINARY_API_CLOUDNAME,
    }
}


const currentENV = env[STAGE];


export default currentENV;