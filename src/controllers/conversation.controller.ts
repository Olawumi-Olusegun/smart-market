import { RequestHandler } from "express";
import { ObjectId, Types, isValidObjectId } from "mongoose";
import { errorHandler } from "src/helpers/errorHandler";
import ConversationModel from "src/models/conversation";
import UserModel from "src/models/user.model";

interface UserProfile {
    avatar?: string;
    name: string;
    id: string;
}

interface Chat {
    text: string;
    time: string;
    id: string;
    user: UserProfile;
}

export interface Conversation {
    id: string;
    chats: Chat[];
    peerProfile: UserProfile;
}

export type PopulatedChat = {
    _id: ObjectId;
    content: string;
    timestamp: Date;
    sentBy: { name: string; _id: ObjectId, avatar?: { url: string } }
}

export type PopulatedParticipants = {
    _id: ObjectId;
    name: string;
    avatar?: { url: string }
}


export const getOrCreateConversation: RequestHandler = async (req, res, next) => {

    const {peerId} = req.params;

    if(!isValidObjectId(peerId)) {
        return errorHandler(res, "Invalid peer ID", 422);
    }

   const user =  await UserModel.findById(peerId);

   if(!user) {
    return errorHandler(res, "User not found", 404);
   }

   const participants = [req.user.id, peerId]
   const participantsId = participants.sort().join("_");

  const conversation = await ConversationModel.findOneAndUpdate({ participantsId }, {
    $setOnInsert: {
        participantsId,
        participants,
    }
   }, { upsert: true, new: true } );


   res.status(200).json({ conversationId: conversation.id })

}

export const getConversation: RequestHandler = async (req, res, next) => {

    const {conversationId} = req.params;

    if(!isValidObjectId(conversationId)) {
        return errorHandler(res, "Invalid conversation ID", 422);
    }

   const conversation =  await ConversationModel.findById(conversationId)
   .populate<{chats: PopulatedChat[]}>({path: "chats.sentBy", select: "name avatar.url"})
   .populate<{participants: PopulatedParticipants[]}>({ 
    path: "participants", 
    match: { _id: { $ne: req.user.id } }, // Filter out the logged-in-user
    select: "name avatar.url"
   }).select("sentBy chats._id chats.content chats.timestamp participants")

   if(!conversation) {
    return errorHandler(res, "Conversation details not found", 404);
   }

   const peerProfile = conversation.participants[0];

   const finalConversation: Conversation = {
    id: conversation._id.toString(),
    chats: conversation.chats.map((chat) => ({ id: chat._id.toString(), text: chat.content, time: chat.timestamp.toISOString(), user: { id: chat._id.toString(), name: chat.sentBy.name, avatar: chat.sentBy?.avatar?.url } })),
    peerProfile: {
        id: peerProfile._id.toString(),
        name: peerProfile.name,
        avatar: peerProfile.avatar?.url,
    }
}


return res.status(200).json({ conversation: finalConversation })

}

type LastChats = {
    id: string;
    lastMessage: string;
    timestamp: Date;
    unreadChatCounts: number;
    peerProfile: UserProfile;
}

export const getLastChats: RequestHandler = async (req, res) => {

  const chats =  await ConversationModel.aggregate([
        {
            $match: {
                participants: new Types.ObjectId(req.user.id),
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "participants",
                foreignField: "_id",
                as: "participantsInfo"
            }
        },
        {
            $project: {
                _id: 0,
                id: "$_id",
                participants: {
                    $filter: {
                        input: "$participantsInfo",
                        as: "participant",
                        cond: { $ne: ["$$participant._id", req.user.id] }
                    }
                },
                lastChat: {
                    $slice: ["$chats", -1]
                },
                unreadChatCount: {
                    $size:{
                        $filter: {
                            input: "$chats",
                            as: "chat",
                            cond: {
                                $and: [
                                    {
                                        $eq: ["$$chat.viewed", false]
                                    },
                                    {
                                        $ne: ["$$chat.sentBy", req.user.id]
                                    },
                                ]
                            }
                        }
                    }
                }
            }
        },
        {
            $unwind: "$participants"
        },
        {
            $unwind: "$lastChat"
        },
        {
            $project: {
                id: "$id",
                lastMessage: "$lastChat.content",
                timestamp: "$lastChat.timestamp",
                unreadChatCount: "$lastChat.content",
                peerProfile: {
                    id: "$participants._id",
                    name: "$participants.name",
                    avatar: "$participants.avatar.url",
                }
            }
        }
    ]);

    if(!chats) {
        return errorHandler(res, "No chats found", 404);
    }


    return res.status(200).json({chats})

}

export const updateChatSeenStatus: RequestHandler = async (req, res) => {

    const { peerId, conversationId } = req.params;

    if(!isValidObjectId(peerId) || !isValidObjectId(conversationId) ) {
        return errorHandler(res, "Invalid conversation or peer ID" , 422);
    }

   const conversations =  await ConversationModel.findByIdAndUpdate(conversationId, {
        $set: {
            "chats.$[elem].viewed": true
        },
    },
    {
        arrayFilters: [{"elem.sentBy": peerId}]
    }

)

return res.status(200).json({conversations})
}