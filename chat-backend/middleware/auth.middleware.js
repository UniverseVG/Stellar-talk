import asyncHandler from "express-async-handler";
import { ApiError } from "../src/utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../src/models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token = req?.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken._id).select("-password");
    if (!user) {
      throw new ApiError(401, "Unauthorized request");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Unauthorized request");
  }
});
