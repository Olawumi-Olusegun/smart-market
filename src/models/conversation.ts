import { Model, ObjectId, Schema, model, models } from "mongoose";

interface Chat {
    _id: ObjectId;
    sentBy: ObjectId;
    content: string;
    timestamp: Date;
    viewed: boolean;
}

interface ConversationDocument extends Document {
    participants: ObjectId[];
    participantsId: string;
    chats: Chat;
}

const conversationSchema = new Schema<ConversationDocument>({
    participants: [
        {
            type: Schema.Types.ObjectId, ref: "User", required: true
        }
    ],
    participantsId: { type: String, unique: true, required: true },
    chats: [
        {
            sentBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
            content: {  type: String, required: true },
            timestamp: {  type: Date, default: Date.now },
            viewed: {  type: Boolean, default: false }
        }
    ]
}, { timestamps: true });


const ConversationModel = models.Conversation || model("Conversation", conversationSchema);


export default ConversationModel as Model<ConversationDocument>;