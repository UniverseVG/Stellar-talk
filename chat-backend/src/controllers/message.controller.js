import expressAsyncHandler from "express-async-handler";
import { ApiError } from "../utils/ApiError.js";
import { Message } from "../models/message.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.model.js";

const sendMessage = expressAsyncHandler(async (req, res) => {
  const { content, chatId } = req.body;
  if (!content || !chatId) {
    throw new ApiError(400, "Please fill all the fields");
  }

  var newMessage = {
    sender: req.user._id,
    content,
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message,
    });
    return res
      .status(201)
      .json(new ApiResponse(201, message, "Message sent successfully"));
  } catch (error) {
    throw new ApiError(
      400,
      "Something went wrong while sending the message " + error.message
    );
  }
});

const allMessages = expressAsyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");
    return res
      .status(200)
      .json(new ApiResponse(200, messages, "Messages fetched successfully"));
  } catch (error) {
    throw new ApiError(
      400,
      "Something went wrong while fetching messages " + error.message
    );
  }
});

export { sendMessage, allMessages };
