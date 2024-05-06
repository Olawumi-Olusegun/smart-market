
import { compare, genSalt, hash } from "bcrypt";
import { Document, Schema, model, models } from "mongoose";

interface PasswordResetTokenDocument extends Document {
    owner: Schema.Types.ObjectId;
    token: string;
    createdAt: Date;
}

interface Methods {
    compareToken: (token: string) => Promise<boolean>
}

const passwordResetTokenSchema = new Schema<PasswordResetTokenDocument, {}, Methods>({
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true },
    createdAt: { type: Date, expires: 86400, default: Date.now() } // 60 * 60 * 24 (60minutes * 60 seconds * 24hours)
});


passwordResetTokenSchema.pre("save", async function(next) {
    if(this.isModified("token")) {
        const salt = await genSalt(10);
        this.token = await hash(this.token, salt);
    }
    next();
});

passwordResetTokenSchema.methods.compareToken = async function(token) {
    return await compare(token, this.token);
}

const PasswordResetTokenModel = models.PasswordResetToken || model("PasswordResetToken", passwordResetTokenSchema);

export default PasswordResetTokenModel;