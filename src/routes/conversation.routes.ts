import express from "express";
import { getConversation, getLastChats, getOrCreateConversation, updateChatSeenStatus } from "src/controllers/conversation.controller";
import { isAuth } from "src/middlewares/isAuth";

const conversationRouter = express.Router();

conversationRouter.get("/with/:peerId", isAuth, getOrCreateConversation)
conversationRouter.get("/chats/:conversationId", isAuth, getConversation)
conversationRouter.get("/last-chats", isAuth, getLastChats)
conversationRouter.patch("/seen/:conversationId/:peerId", isAuth, updateChatSeenStatus)

export default conversationRouter;