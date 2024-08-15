import expressAsyncHandler from "express-async-handler";
import { ApiError } from "../utils/ApiError.js";
import { Chat } from "../models/chat.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const accessChat = expressAsyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    throw new ApiError(400, "User Id not sent");
  }

  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      {
        users: {
          $elemMatch: {
            $eq: req.user._id,
          },
        },
      },
      {
        users: {
          $elemMatch: {
            $eq: userId,
          },
        },
      },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  if (isChat.length > 0) {
    res.status(200).json(new ApiResponse(200, isChat[0]));
  } else {
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };
    try {
      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.status(200).json(new ApiResponse(200, FullChat));
    } catch (error) {
      throw new ApiError(500, error.message || "Failed to create chat");
    }
  }
});

const fetchChats = expressAsyncHandler(async (req, res) => {
  try {
    var chats = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    chats = await User.populate(chats, {
      path: "latestMessage.sender",
      select: "name pic email",
    });
    res
      .status(200)
      .json(new ApiResponse(200, chats, "Fetched chats successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "Failed to fetch chats");
  }
});

const createGroupChat = expressAsyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    throw new ApiError(400, "Please fill all the fields");
  }
  var users = JSON.parse(req.body.users);

  if (users.length < 2) {
    throw new ApiError(
      400,
      "More than 2 users are required to form a group chat"
    );
  }

  users.push(req.user);
  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");
    res
      .status(200)
      .json(
        new ApiResponse(200, fullGroupChat, "Group chat created successfully")
      );
  } catch (error) {
    throw new ApiError(500, error.message || "Failed to create group chat");
  }
});

const renameGroup = expressAsyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;
  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      chatName,
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");
  if (!updatedChat) {
    throw new ApiError(400, "Chat not found");
  }
  res
    .status(200)
    .json(new ApiResponse(200, updatedChat, "Group chat renamed successfully"));
});

const addToGroup = expressAsyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;
  const added = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: {
        users: userId,
      },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");
  if (!added) {
    throw new ApiError(400, "Chat not found");
  }
  res
    .status(200)
    .json(new ApiResponse(200, added, "User added to group successfully"));
});

const removeFromGroup = expressAsyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;
  const removed = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: {
        users: userId,
      },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");
  if (!removed) {
    throw new ApiError(400, "Chat not found");
  }
  res
    .status(200)
    .json(
      new ApiResponse(200, removed, "User removed from group successfully")
    );
});

export {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};
