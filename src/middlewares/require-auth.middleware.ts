import * as dotenv from "dotenv";
import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { RequestWithUser } from "../types/request-with-user.type";
dotenv.config();

const User = mongoose.model("User");

export const requireAuth = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).send({ error: "You must be logged in." });
  }

  const token = authorization.replace("Bearer ", "");

  try {
    const verificationResponse = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY as string
    ) as { userId: string };
    const id = verificationResponse["userId"];
    const user = await User.findById(id);
    if (user) {
      req.user = user;
      next();
    } else {
      return res.status(401).send({ error: "You must be logged in." });
    }
  } catch (err) {
    return res.status(401).send({ error: "You must be logged in." });
  }
};
