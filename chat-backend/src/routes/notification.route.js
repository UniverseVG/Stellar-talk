import express from "express";
import { verifyJWT } from "../../middleware/auth.middleware.js";
import {
  createNotification,
  getNotifications,
  readNotification,
  readChatNotifications,
} from "../controllers/notification.controller.js";

const notificationRouter = express.Router();

notificationRouter.use(verifyJWT);

notificationRouter.route("/").post(createNotification);
notificationRouter.route("/").get(getNotifications);
notificationRouter.route("/:id").put(readNotification);
notificationRouter.route("/chat/:id").put(readChatNotifications);

export default notificationRouter;
