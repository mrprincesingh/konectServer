import * as dotenv from "dotenv";
import express, { Request, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { requireAuth } from "../middlewares/require-auth.middleware";
import { validate } from "../middlewares/req-validator.middleware";
import { RequestWithUser } from "../types/request-with-user.type";
dotenv.config();
const User = mongoose.model("User");
export const profileRouter = express.Router();

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
    profileBackground:z.string().optional()
  });

  const EditProfileSchema = z.object({
    body: UserSchema.pick({ email: true,
       firstName: true,
      lastName: true,
      dob: true,
      quailification: true,
      expInYear: true,
      skills: true,
      maritalStatus: true,
      city: true,
      profilePic:true,
      profileBackground:true
     }),
  });

  profileRouter.put(
    "/edit-profile",
    requireAuth,
    validate(EditProfileSchema),
    async (req: RequestWithUser, res: Response) => {
      try {
        const {
          firstName,
          lastName,
          dob,
          quailification,
          expInYear,
          skills,
          maritalStatus,
          city,
          email,
          profilePic,
          profileBackground
        } = req.body;
  
    
   const user = req.user;
  
  
        if (!user){
               return res.status(400).send({ message: "User not Authorised" });
        }
        await User.findByIdAndUpdate(user, {
          firstName,
          lastName,
          dob,
          quailification,
          expInYear,
          skills,
          maritalStatus,
          city,
          email,
          profilePic:process.env.S3_BASE_URL+(profilePic ?? ""),
          profileBackground:process.env.S3_BASE_URL+(profileBackground ?? "")
        });
  
        res.status(200).send({ status: "success" });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Something went wrong" });
      }
    }
  );

  profileRouter.get(
    "/me",
    requireAuth,
    async (req: RequestWithUser, res: Response) => {
      try {

        console.log("user" )
        const user = req?.user;
        
        if (!user) return res.status(400).send({ message: "User not found" });
  
        res.status(200).send({ user });
      } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Something went wrong" });
      }
    }
  );