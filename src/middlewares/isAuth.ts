import { RequestHandler } from "express";
import { errorHandler } from "src/helpers/errorHandler";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import UserModel from "src/models/user.model";
import PasswordResetTokenModel from "src/models/password-reset-token.model";
import { JWT_SECRET } from "src/constants/constants";

interface UserProfile {
    id: string; 
    name: string;
    email: string;
    verified: boolean;
    avatar?: string;
}


declare global {
    namespace Express {
        interface Request {
            user: UserProfile;
        }
    }
}



export const isAuth: RequestHandler = async (req, res, next) => {

    try {
        const authToken = req.headers.authorization;
    
        if(!authToken) {
            return errorHandler(res, "Unauthorized request", 403)
        }
    
        const token = authToken.split("Bearer ")[1];
    
        if(!token) {
            return errorHandler(res, "Unauthorized request", 403)
        }
    
        const payload = jwt.verify(token, JWT_SECRET) as { id: string };
    
        const user = await UserModel.findById(payload.id);
    
        if(!user) {
            return errorHandler(res, "Unauthorized request", 403)
        }
    
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            verified: user.verified,
            avatar: user.avatar?.url,
        }
    
        next();
        
    } catch (error) {
        if(error instanceof TokenExpiredError) {
            return errorHandler(res, "Session expired", 401)
        }
        if(error instanceof JsonWebTokenError) {
            return errorHandler(res, "Unauthorized access", 401)
        }
        next(error)
    }

}

export const isValidPasswordResetToken: RequestHandler = async (req, res, next) => { 
    
    const { id, token } = req.body;

    const resetPassToken = await PasswordResetTokenModel.findOne({ owner: id })

    if(!resetPassToken) {
        return errorHandler(res, "Unauthorized access, invalid token", 401)
    }

    const isvalidToken = await resetPassToken.compareToken(token);

    if(!isvalidToken) {
        return errorHandler(res, "Unauthorized access, invalid token", 401) 
    }

    next();

}
