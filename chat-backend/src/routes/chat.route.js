import express from "express";

import { verifyJWT } from "../../middleware/auth.middleware.js";
import {
  accessChat,
  addToGroup,
  createGroupChat,
  fetchChats,
  removeFromGroup,
  renameGroup,
} from "../controllers/chat.controller.js";

const chatRouter = express.Router();

chatRouter.use(verifyJWT);

chatRouter.route("/").post(accessChat).get(fetchChats);
chatRouter.route("/group").post(createGroupChat);
// .get(fetchGroupChats);
chatRouter.route("/rename").put(renameGroup);
chatRouter.route("/groupremove").put(removeFromGroup);
chatRouter.route("/groupadd").put(addToGroup);

export default chatRouter;
