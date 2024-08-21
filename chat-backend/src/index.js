import dotenv from "dotenv";
import express from "express";
import connectDB from "./db/mongodb.js";
import colors from "colors";
import userRouter from "./routes/user.route.js";
import { errorHandler, notFound } from "../middleware/error.middleware.js";
import chatRouter from "./routes/chat.route.js";
import messageRouter from "./routes/message.route.js";
import { Server } from "socket.io";
import path from "path";
import notificationRouter from "./routes/notification.route.js";

dotenv.config();

connectDB();
const app = express();

const port = process.env.PORT;

app.use(express.json());

app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);
app.use("/api/notification", notificationRouter);

/* Deployment */

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/chat-frontend/dist")));
  app.get("*", (req, res) =>
    res.sendFile(
      path.resolve(__dirname1, "chat-frontend", "dist", "index.html")
    )
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

app.use(notFound);
app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`Server listening at port ${port}`.yellow.bold);
});

const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.CLIENT_URL,
  },
});

const activeUsersInChats = {};

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on("setup", (userData) => {
    socket.userId = userData._id;
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (chat, user) => {
    socket.join(chat._id);

    if (!activeUsersInChats[chat._id]) {
      activeUsersInChats[chat._id] = [];
    }

    if (!activeUsersInChats[chat._id].includes(user._id)) {
      activeUsersInChats[chat._id].push(user._id);
    }
    io.to(chat._id).emit("active users", activeUsersInChats[chat._id]);
  });

  socket.on("leave chat", (chat, user) => {
    if (activeUsersInChats[chat?._id]) {
      activeUsersInChats[chat._id] = activeUsersInChats[chat._id].filter(
        (userId) => userId !== user._id
      );

      io.to(chat._id).emit("active users", activeUsersInChats[chat._id]);
    }
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("notification received", () => {
    io.emit("notification");
  });

  socket.on("new message", (newMessageReceived) => {
    var chat = newMessageReceived.chat;

    if (!chat.users) {
      return console.log("Chat not found");
    }
    chat?.users?.map((user) => {
      if (user._id == newMessageReceived.sender._id) return;

      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });

  socket.on("disconnect", () => {
    console.log("USER DISCONNECTED");
    for (let chatId in activeUsersInChats) {
      activeUsersInChats[chatId] = activeUsersInChats[chatId].filter(
        (userId) => userId !== socket.userId
      );

      io.to(chatId).emit("active users", activeUsersInChats[chatId]);
    }
  });

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
  });
});
