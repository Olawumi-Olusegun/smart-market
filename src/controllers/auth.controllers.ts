import { RequestHandler } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken"
import AuthVerificationTokenModel from "src/models/auth-verification-token.model";
import UserModel from "src/models/user.model";
import { errorHandler } from "src/helpers/errorHandler";
import mail from "src/helpers/mail";
import  { JWT_SECRET, PASSWORD_RESET_LINK, VERIFICATION_LINK } from "src/constants/constants";
import PasswordResetTokenModel from "src/models/password-reset-token.model";
import { isValidObjectId } from "mongoose";
import cloudUploader from "src/constants/cloudinary";


 
export const createNewUser: RequestHandler = async (req, res) => {

    const { email, password, name } = req.body;

        const userExist = await UserModel.findOne({ email });

        if(userExist) {
            return errorHandler(res, "User already exist", 422)
        }

        const newUser = await UserModel.create({email, password, name});

        if(!newUser) {
            return errorHandler(res, "User not created", 422)
        }

        const token = crypto.randomBytes(36).toString("hex");

        const verificationToken = await AuthVerificationTokenModel.create({ owner: newUser?.id, token });

        if(!verificationToken) {
            return errorHandler(res, "User verification error", 422)
        }
        const tokenLink = `${VERIFICATION_LINK}?id=${newUser?.id}&token=${token}`;

        const mailResponse = await mail.sendVerification(newUser.email, tokenLink);

        return res.status(201).json({message: "Please check your inbox"})


}

export const verifyEmail: RequestHandler = async (req, res) => {
    
    const { id, token } = req.body;

    const authToken = await AuthVerificationTokenModel.findOne({ owner: id });

    if(!authToken) {
        return errorHandler(res, "Unauthorized request", 403)
    }

    const isvalidToken = await authToken.compareToken(token);

    if(!isvalidToken) {
        return errorHandler(res, "Unauthorized request, invalid token", 403)
    }

   const findUserAndUpdate = await UserModel.findByIdAndUpdate(id, { $set: { verified: true } })

    if(!findUserAndUpdate) {
        return errorHandler(res, "Unauthorized request, invalid user", 403)
    }

    const authTokens = await AuthVerificationTokenModel.findByIdAndDelete(authToken.id);

    return res.status(200).json({ message: "Thank you for joining us, your email is verified"});


}

export const signIn: RequestHandler = async (req, res) => {
   
    const { email, password } = req.body;

    const userExist = await UserModel.findOne({ email});

    if(!userExist) {
        return errorHandler(res, "Email and or password mismatch", 403)
    }

    const isvalidPassword = await userExist.comparePassword(password);

    if(!isvalidPassword) {
        return errorHandler(res, "Email and or password mismatch", 403)
    }

    const payload = { id: userExist.id };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, JWT_SECRET,);

    if(!userExist.tokens) {
        userExist.tokens = [refreshToken]
    }else {
        userExist.tokens.push(refreshToken)
    }

    await userExist.save();

    return res.status(200).json({
        profile: {
            id: userExist.id,
            email: userExist.email,
            name: userExist.name,
            verified: userExist.verified,
            avatar: userExist.avatar?.url,
        },
        tokens: {
            accessToken,
            refreshToken,
        },
    });
}

export const sendProfile: RequestHandler = async (req, res) => { 
    return res.json({ profile: req.user, });
 }

export const generateVerificationLink: RequestHandler = async (req, res) => {
    
    const { id } = req.body;

    const token = crypto.randomBytes(36).toString("hex");
    
    await AuthVerificationTokenModel.findOne({ owner: id });

    await AuthVerificationTokenModel.findOne({ owner: id, token });
    
    const tokenLink = `${VERIFICATION_LINK}?id=${req.user?.id}&token=${token}`;

    const mailResponse = await mail.sendVerification(req.user.email, tokenLink);

    return errorHandler(res, "Please check your inbox", 201)

 }



export const grandAccessToken: RequestHandler = async (req, res) => {

    const { refreshToken } = req.body;

    if(!refreshToken) {
        return errorHandler(res, "Unauthorized request", 403)
    }

    const payload = jwt.verify(refreshToken, "secret") as { id: string };

    if(!payload.id) {
        return errorHandler(res, "Unauthorized request", 401)
    }

    const user  = await UserModel.findOne({ _id: payload.id, tokens: refreshToken });

    if(!user) {
        await UserModel.findByIdAndUpdate(payload.id, {$set: { tokens: [] } } );
        return errorHandler(res, "Unauthorized request", 401)
    }

    const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
    const newRefreshToken = jwt.sign(payload, JWT_SECRET,);

    const filteredToken = user.tokens.filter((token: string) => token !== refreshToken);

    user.tokens = filteredToken;
    user.tokens.push(newRefreshToken)
    await user.save();

    res.json({
        profile: {
            id: user.id,
            email: user.email,
            name: user.name,
            verified: user.verified,
            avatar: user.avatar?.url,
        },
        tokens: {accessToken, newAccessToken, refreshToken: newRefreshToken }
    })

 }


export const signOut: RequestHandler = async (req, res) => { 
    const { refreshToken } = req.body;

    const user = await UserModel.findOne({ _id: req.user.id, tokens: refreshToken  });

    if(!user) {
        return errorHandler(res, "Unauthorized request, user not found", 403)
    }

    const newTokens = user.tokens.filter((token: string) => token !== refreshToken);

    user.tokens = newTokens;

    await user.save();

    res.send();


}


export const generateForgetPasswordLink: RequestHandler = async (req, res) => { 
    const { email }  = req.body;

    const user = await UserModel.findOne({ email });

    if(!user){
        return errorHandler(res, "Account not found", 404)
    }

    const token  = crypto.randomBytes(36).toString("hex");

    await PasswordResetTokenModel.findOneAndDelete({ owner: user.id });
    await PasswordResetTokenModel.create({ owner: user.id, token });

    const passwordResetLink = `${PASSWORD_RESET_LINK}?id=${user.id}&token={token}`;

    mail.sendVerification(user.email, passwordResetLink);

    return res.status(200).json({ message: "Please check your email"});


 }

 export const grantValid: RequestHandler = async (req, res) => { 
    return res.status(200).json({ valid: true });
 }

export const updatePassword: RequestHandler = async (req, res) => {

    const { id, password } = req.body;

    const user = await UserModel.findById(id);

    if(!user) {
        return errorHandler(res, "Unauthorized access", 403)
    }

     const isvalidPassword = await user.comparePassword(password);

    if(!isvalidPassword) {
        return errorHandler(res, "The new password must be different", 422)
    }

    user.password = password;

    await user.save();

    await PasswordResetTokenModel.findOneAndDelete({ owner: user.id });

    await mail.sendPasswordUpdateMessage(user.email);

 }


export const updateProfile: RequestHandler = async (req, res) => { 
    
    const { name } = req.body;

    if(typeof name !== "string" || name.trim().length < 3) {
        return errorHandler(res, "Invalid name", 422)
    }

    const user = UserModel.findByIdAndUpdate(req.user.id, { $set: { name } })

    return res.status(200).json({ profile: { ...req.user, name } })
 }


export const updateAvatar: RequestHandler = async (req, res) => { 
    
    const { avatar } = req.files;

    if(Array.isArray(avatar)) {
        return errorHandler(res, "Multiple files arenot allowed", 422);
    }

    if(!avatar.mimetype?.startsWith("image")) {
        return errorHandler(res, "Invalid image file", 422);
    }

    const user = await UserModel.findById(req.user.id) 

    if(!user) {
        return errorHandler(res, "User not found", 404);
    }

    if(user.avatar?.id) {
        // remove avatar
        await cloudUploader.destroy(user.avatar?.id);
    }

    const { secure_url: url, public_id: id } = await cloudUploader.upload(avatar.filepath, {
        width: 300,
        height: 300,
        crop: "thumb",
        gravity: "face"
    });
    
    user.avatar = { url, id }

    await user.save();

    return res.status(200).json({ profile: { ...req.user, avatar: user.avatar.url } })


 }
export const sendPublicProfile: RequestHandler = async (req, res) => { 
    const profileId = req.params.profileId;
    if(!isValidObjectId(profileId)) {
        return errorHandler(res, "Invalid profile ID", 422);
    }
    const user = await UserModel.findById(profileId)

    if(!user) {
        return errorHandler(res, "User not found", 404);
    }

    return res.status(200).json({ profile: { id: user.id, name: user.name, avatar: user.avatar?.url } })
 }

export const accessToken: RequestHandler = async (req, res) => { }


