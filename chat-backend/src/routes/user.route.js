import express from "express";
import {
  allUsers,
  loginUser,
  registerUser,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../../middleware/auth.middleware.js";

const userRouter = express.Router();

userRouter.route("/").post(registerUser).get(verifyJWT, allUsers);
userRouter.route("/login").post(loginUser);

export default userRouter;
