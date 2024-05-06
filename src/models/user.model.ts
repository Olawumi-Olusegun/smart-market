
import { compare, genSalt, hash } from "bcrypt";
import { Schema, model, models, Document, Model } from "mongoose";

export interface UserDocument extends Document {
    name: string;
    email: string;
    password: string;
    verified: boolean;
    tokens: string[];
    avatar?: { url: string, id: string; }
}

interface Methods {
    comparePassword: (password: string) => Promise<boolean>
}

const userSchema = new Schema<UserDocument, {}, Methods>({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    password: { type: String, required: true, trim: true },
    verified: { type: Boolean, default: false },
    tokens: [String],
    avatar: { type: Object, url: String, id: String }
}, { timestamps: true });


userSchema.pre("save", async function(next) {
    if(this.isModified("password")) {
        const salt = await genSalt(10);
        this.password = await hash(this.password, salt);
    }
    next();
});

userSchema.methods.comparePassword = async function(password) {
    return await compare(password, this.password);
}


const UserModel = models.User || model("User", userSchema);

export default UserModel as Model<UserDocument, {}, Methods>;