import expressAsyncHandler from "express-async-handler";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Notification } from "../models/notification.mode.js";
import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.model.js";

const createNotification = expressAsyncHandler(async (req, res) => {
  const { sender, chat, isGroupChat, readBy } = req.body;
  if (!sender || !chat) {
    throw new ApiError(400, "Please fill all the fields");
  }

  try {
    var notification = await Notification.create({
      sender,
      chat,
      readBy: readBy,
      isGroupChat,
    });

    notification = await notification.populate("sender", "name pic email");
    notification = await notification.populate("chat");
    notification = await User.populate(notification, {
      path: "chat.users",
      select: "name pic email",
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, notification, "Notification created successfully")
      );
  } catch (error) {
    throw new ApiError(500, "Failed to create notification");
  }
});

const getNotifications = expressAsyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    const userChats = await Chat.find({ users: userId }).select("_id");
    const chatIds = userChats.map((chat) => chat._id);
    var notifications = await Notification.find({
      chat: { $in: chatIds },
      readBy: {
        $nin: [userId],
      },
    })
      .populate("sender", "name pic email")
      .populate("chat")
      .populate("readBy", "name pic email")
      .sort({ createdAt: -1 });

    notifications = await User.populate(notifications, {
      path: "chat.users",
      select: "name pic email",
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          notifications,
          "Notifications retrieved successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error.message || "Failed to get notifications");
  }
});

const readNotification = expressAsyncHandler(async (req, res) => {
  const notificationId = req.params.id;
  try {
    var notification = await Notification.findByIdAndUpdate(
      notificationId,
      {
        $addToSet: {
          readBy: req.user._id,
        },
      },
      {
        new: true,
      }
    )
      .populate("sender", "name pic email")
      .populate("chat")
      .populate("readBy", "name pic email")
      .sort({ createdAt: -1 });

    notification = await User.populate(notification, {
      path: "chat.users",
      select: "name pic email",
    });

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    if (!notification.isGroupChat) {
      await notification.deleteOne({
        _id: notificationId,
      });
    }

    const isTrue = arraysAreEqual(
      notification.readBy,
      notification.chat.users,
      "_id"
    );

    if (isTrue) {
      await notification.deleteOne({
        _id: notificationId,
      });
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, notification, "Notifications read successfully")
      );
  } catch (error) {
    throw new ApiError(500, error.message || "Failed to read notification");
  }
});

const readChatNotifications = expressAsyncHandler(async (req, res) => {
  const chatId = req.params.id;
  try {
    var notifications = await Notification.find({
      chat: chatId,
      readBy: {
        $elemMatch: {
          $ne: req.user._id,
        },
      },
    })
      .populate("sender", "name pic email")
      .populate("chat")
      .populate("readBy", "name pic email")
      .sort({ createdAt: -1 });

    notifications = await User.populate(notifications, {
      path: "chat.users",
      select: "name pic email",
    });

    notifications = notifications.map(async (notification) => {
      await notification.updateOne(
        {
          $addToSet: {
            readBy: req.user._id,
          },
        },
        {
          new: true,
        }
      );
      if (!notification.isGroupChat) {
        await notification.deleteOne({ _id: notification._id });
      }
      const isTrue = arraysAreEqual(
        notification.readBy,
        notification.chat.users,
        "_id"
      );

      if (isTrue) {
        await notification.deleteOne({
          _id: notification._id,
        });
      }
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, notifications, "Notifications read successfully")
      );
  } catch (error) {
    throw new ApiError(500, error.message || "Failed to get notifications");
  }
});

export {
  createNotification,
  getNotifications,
  readNotification,
  readChatNotifications,
};

function arraysAreEqual(arr1, arr2, key) {
  if (arr1.length !== arr2.length) return false;

  arr1.sort((a, b) => (a[key].toString() > b[key].toString() ? 1 : -1));
  arr2.sort((a, b) => (a[key].toString() > b[key].toString() ? 1 : -1));

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i][key].toString() !== arr2[i][key].toString()) {
      return false;
    }
  }
  return true;
}
