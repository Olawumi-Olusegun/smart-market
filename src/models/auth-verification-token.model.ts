
import { compare, genSalt, hash } from "bcrypt";
import { Document, Schema, model, models } from "mongoose";

interface AuthVerificationTokenDocument extends Document {
    owner: Schema.Types.ObjectId;
    token: string;
    createdAt: Date;
}

interface Methods {
    compareToken: (token: string) => Promise<boolean>
}

const authVerificationToken = new Schema<AuthVerificationTokenDocument, {}, Methods>({
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true },
    createdAt: { type: Date, expires: 86400, default: Date.now() } // 60 * 60 * 24 (60minutes * 60 seconds * 24hours)
});


authVerificationToken.pre("save", async function(next) {
    if(this.isModified("token")) {
        const salt = await genSalt(10);
        this.token = await hash(this.token, salt);
    }
    next();
});

authVerificationToken.methods.compareToken = async function(token) {
    return await compare(token, this.token);
}

const AuthVerificationTokenModel = models.AuthVerificationToken || model("AuthVerificationToken", authVerificationToken);

export default AuthVerificationTokenModel;