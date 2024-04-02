import { Request } from "express";
import { UserType } from "../models/User";

export type RequestWithUser = Request & { user?: UserType };
