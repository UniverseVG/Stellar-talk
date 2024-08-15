import express from "express";
import { verifyJWT } from "../../middleware/auth.middleware.js";
import { allMessages, sendMessage } from "../controllers/message.controller.js";

const messageRouter = express.Router();

messageRouter.use(verifyJWT);

messageRouter.route("/").post(sendMessage);
messageRouter.route("/:chatId").get(allMessages);

export default messageRouter;
