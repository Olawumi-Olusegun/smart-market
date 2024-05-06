import express from "express";
import { signOut, grandAccessToken, createNewUser, generateVerificationLink, sendProfile, signIn, verifyEmail, generateForgetPasswordLink, grantValid, updatePassword, updateProfile, updateAvatar, sendPublicProfile } from "src/controllers/auth.controllers";
import { newUserSchema, resetPassSchema, verifyTokenSchema } from "src/helpers/validationSchema";
import fileParser from "src/middlewares/fileParser";
import { isAuth, isValidPasswordResetToken } from "src/middlewares/isAuth";
import validate from "src/middlewares/validator";

const authRouter = express.Router();

authRouter.post("/sign-up", validate(newUserSchema), createNewUser);
authRouter.post("/sign-in", signIn);
authRouter.post("/verify", validate(verifyTokenSchema), verifyEmail);
authRouter.post("/verify-token", isAuth, generateVerificationLink);
authRouter.post("/refresh-token", isAuth, grandAccessToken);
authRouter.post("/sign-out", isAuth, signOut );
authRouter.get("/profile", isAuth, sendProfile);
authRouter.post("/forget-password", generateForgetPasswordLink);
authRouter.post("/verify-password-reset-token", validate(verifyTokenSchema), isValidPasswordResetToken, grantValid);
authRouter.post("/reset-password", validate(resetPassSchema), updatePassword);
authRouter.patch("/update-profile", isAuth, updateProfile);
authRouter.patch("/update-avatar", isAuth, fileParser, updateAvatar);
authRouter.get("/profile/:profileId", isAuth, sendPublicProfile);

authRouter.post("/access-token", isAuth);


export default authRouter;