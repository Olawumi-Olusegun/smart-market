import "dotenv/config";
import "express-async-errors";
import express, { Application } from "express";
import authRouter from "src/routes/auth.routes";
import productRouter from "src/routes/product.routes";
import connectDB from "src/database";
import currentENV from "./constants/constants";
import formidable from "formidable";
import path from "path";
import http from "http"
import {Server} from "socket.io"
import morgan from "morgan"
import { errorHandler } from "./helpers/errorHandler";
import { TokenExpiredError, verify } from "jsonwebtoken";
import conversationRouter from "./routes/conversation.routes";
import ConversationModel from "./models/conversation";


const PORT: number = currentENV.PORT || 8000;
const APP_BASE_URL = currentENV.APP_BASE_URL;


const app: Application = express();

const server = http.createServer(app)

const io =  new Server(server, {
    path: "/socket-message"
});

io.use((socket, next) => {
   const socketRequest =  socket.handshake.auth as { token: string } | undefined;
   if(!socketRequest?.token) {
    return next(new Error("Unauthorized request"))
   }
   
   
   try {
       
       const decodedToken = verify(socketRequest.token, currentENV.JWT_SECRET);
       socket.data.jwtDecode = decodedToken;

  } catch (error) {
    if(error instanceof TokenExpiredError) {
        return next(new Error("jwt expired"))
    }

    return next(new Error("Invalid token")) 

  }

    next();
})


app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static('src/public'))


app.use("/auth", authRouter)
app.use("/product", productRouter)
app.use("/conversation", conversationRouter)

type MessageProfile = {
    id: string;
    name: string;
    avatar?: string;
}

type IncomingMessage = {
    message: {
      id: string;
      time: string;
      text: string;
      user: MessageProfile;
    },
    to: string;
    conversationId: string;
  }

type OutGoingMessageResponse = {
    message: {
      id: string;
      time: string;
      text: string;
      user: MessageProfile;
    },
    from: MessageProfile;
    conversationId: string;
  }
  

io.on("connection", (socket) => {
    
    const socketData = socket.data as { jwtDecode: { id: string } };

    const userId = socketData.jwtDecode.id;

    socket.join(userId);

    socket.on("chat:new", async (data: IncomingMessage) => {

        const { conversationId, to, message} = data;

       await ConversationModel.findByIdAndUpdate(conversationId, {
            $push: {
                chats: {
                    sentBy: message.user.id,
                    content: message.text,
                    timestamp: message.time
                }
            }
        })

        const messageResponse: OutGoingMessageResponse = {
            from: message.user,
            conversationId,
            message,
        }

        socket.to(to).emit("chat:message", messageResponse);


    })
})

app.use("/upload-file", async (req, res) => {
    const form =  formidable({ 
        uploadDir: path.join(__dirname, 'public'),
        filename: (name, ext, part, form) => {
            return `${Date.now()}_${part.originalFilename}`;
        }
    });
    await form.parse(req);
    return res.status(200).send("ok");
});


app.use(function(error, req, res, next) {
    res.status(500).json({message: error.message});
} as express.ErrorRequestHandler)

app.use("*", (req, res) => {
    errorHandler(res, "Not found!", 404);
});

connectDB()
.then(() => {
    server.listen(PORT, () => console.log(`Application listening on port: ${APP_BASE_URL}`))
}).catch(() => {
    console.log(`Error in network connection`)
})


