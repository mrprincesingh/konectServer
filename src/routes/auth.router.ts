import * as dotenv from "dotenv";
import express, { Request, Response } from "express";
import { z } from "zod";
import { validate } from "../middlewares/req-validator.middleware";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { requireAuth } from "../middlewares/require-auth.middleware";
import { RequestWithUser } from "../types/request-with-user.type";
import {
  sendResetPasswordEmail,
  sendVerifyAccountEmail,
} from "../utils/email.utils";
import { v4 as uuid } from "uuid";
import { generateOTP } from "../utils/number.utils";
dotenv.config();

const User = mongoose.model("User");
export const authRouter = express.Router();

const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  userType: z.enum(["individual", "business"]),
  firstName: z.string(),
  lastName: z.string(),
  about: z.string().optional(),
  mobile: z.string().max(15),
  countryCode: z.string().max(5),
  country: z.string(),
  pincode: z.string(),
  city: z.string(),
  quailification:z.string(),
  dob:z.string(),
  expInYear:z.string(),
  skills:z.string(),
  maritalStatus:z.string(),
  profilePic: z.string().optional(),
  profileBackground:z.string().optional(),
});

const SignupSchema = z.object({
  body: UserSchema,
});

const LoginSchema = z.object({
  body: UserSchema.pick({ email: true, password: true }),
});



authRouter.post(
  "/signup",
  validate(SignupSchema),
  async (req: Request, res: Response) => {
    try {
      const {
        email,
        password,
        userType,
        firstName,
        lastName,
        about,
        mobile,
        countryCode,
        country,
        quailification,
        dob,
        expInYear,
        skills,
        pincode,
        city,
        maritalStatus,
        profilePic,
        profileBackground
      } = req.body;

      const user = await User.findOne({ email }, { _id: 1 });
      if (user) return res.status(400).send({ message: "User already exists" });
      const otp = generateOTP();
      const newUser = new User({
        email: email.toLowerCase(),
        password,
        userType,
        firstName,
        lastName,
        about: about ?? "",
        mobile,
        countryCode,
        dob,
        quailification,
        expInYear,
        skills,
        maritalStatus,
        country,
        pincode,
        city,
        profilePic: profilePic ?? "",
        profileBackground:profileBackground ?? "",
        emailVerificationOTP: String(otp),
      });

      await newUser.save();

      await sendVerifyAccountEmail({
        email,
        userId: newUser._id,
        otp: String(otp),
      });

      res.status(200).send({ status: "success" });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: "Something went wrong" });
    }
  }
);



authRouter.post(
  "/login",
  validate(LoginSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user)
        return res.status(400).send({ message: "Invalid Email or password" });

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid)
        return res.status(400).send({ message: "Invalid Email or password" });
      if (!user.emailVerified)
        return res.status(400).send({ message: "Please verify your email" });
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET_KEY as string
      );
      res.status(200).send({ token, user });
    } catch (error) {
      console.log(error);
      res.status(400).send({ message: "Invalid Email or password" });
    }
  }
);



authRouter.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({ message: "Must provide Email" });
    }

    const user = await User.findOne({ email }, { _id: 1, email: 1 });

    if (user === null) {
      return res
        .status(400)
        .send({ message: "We didn't find any user with this email address" });
    }
    const token = uuid();

    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 1);

    await User.findOneAndUpdate(
      { _id: user._id },
      {
        resetPasswordToken: token,
        resetPasswordExpires: new Date(currentDate.toISOString()),
      }
    );

    await sendResetPasswordEmail({ email, token });

    res.status(200).send({ status: "success" });
  } catch (err) {
    console.log(err);
    return res.status(422).send({ error: "Something went wrong" });
  }
});

authRouter.post("/verify-email", async (req: Request, res: Response) => {
  try {
    const { otp, email } = req.body;

    if (!email) {
      return res.status(400).send({ message: "Must provide Email" });
    }

    const user = await User.findOne(
      { email },
      { _id: 1, email: 1, emailVerificationOTP: 1, emailVerified: 1 }
    );

    if (user === null) {
      return res
        .status(400)
        .send({ message: "We didn't find any user with this email address" });
    }
    if (user.emailVerificationOTP !== otp) {
      return res.status(400).send({ message: "Invalid OTP" });
    }

    await User.findOneAndUpdate(
      { _id: user._id },
      {
        emailVerified: true,
        emailVerificationOTP: null,
      }
    );

    res
      .status(200)
      .send({ status: true, message: "Account verified successfully" });
  } catch (err) {
    console.log(err);
    return res.status(422).send({ error: "Something went wrong" });
  }
});

authRouter.post(
  "/resend-verification-email",
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).send({ message: "Must provide Email" });
      }

      const user = await User.findOne(
        { email },
        { _id: 1, email: 1, emailVerificationOTP: 1, emailVerified: 1 }
      );

      if (user === null) {
        return res
          .status(400)
          .send({ message: "We didn't find any user with this email address" });
      }
      if (user.emailVerified) {
        return res.status(400).send({ message: "Account already verified" });
      }

      let otp = user.emailVerificationOTP;

      if (!otp || otp === "") {
        otp = generateOTP();
        await User.findOneAndUpdate(
          { _id: user._id },
          {
            emailVerificationOTP: String(otp),
          }
        );
      }

      await sendVerifyAccountEmail({
        email,
        userId: user._id,
        otp: String(otp),
      });
      res.status(200).send({
        status: true,
        message: "Verification Email sent successfully",
      });
    } catch (err) {
      console.log(err);
      return res.status(422).send({ error: "Something went wrong" });
    }
  }
);
