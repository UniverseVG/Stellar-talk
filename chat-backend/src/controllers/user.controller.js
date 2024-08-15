import asyncHandler from "express-async-handler";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAuthToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const token = await user.generateAccessToken();
    user.token = token;
    user.save({ validateBeforeSave: false });
    return token;
  } catch (error) {
    throw new ApiError(500, "Failed to generate token");
  }
};
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Please enter all the fields");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new ApiError(400, "User already exists, please login instead");
  }
  const user = await User.create({
    name,
    email,
    password,
    pic,
  });

  if (!user) {
    throw new ApiError(500, "Failed to create the user");
  }
  const token = await generateAuthToken(user._id);

  res.status(201).json(
    new ApiResponse(
      201,
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        pic: user.pic,
        token: token,
      },
      "User created successfully"
    )
  );
});
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new ApiError(400, "Please enter all the fields");
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(400);
    throw new ApiError(400, "Invalid credentials");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid credentials");
  }
  const token = await generateAuthToken(user._id);
  res.status(200).json(
    new ApiResponse(
      200,
      {
        _id: user._id,
        token,
        name: user.name,
        email: user.email,
        pic: user.pic,
      },
      "Logged in successfully"
    )
  );
});

const allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search;
  let users = [];
  if (keyword) {
    users = await User.find({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        {
          email: { $regex: keyword, $options: "i" },
        },
      ],
    }).find({ _id: { $ne: req.user._id } });
  }

  res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));
});

export { registerUser, loginUser, allUsers };
