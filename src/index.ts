
import "./models/Post"
import "./models/User";
import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authRouter } from "./routes/auth.router";
import { errorHandler } from "./middlewares/error.middleware";
import { notFoundHandler } from "./middlewares/not-found.middleware";
import mongoose from "mongoose";
import { s3Router } from "./routes/s3.router";
import { profileRouter } from "./routes/me.router";
import { postRouter } from "./routes/post.router";


dotenv.config();

if (!process.env.PORT) {
  process.exit(1);
}

const PORT: number = parseInt(process.env.PORT as string, 10);

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/uploader", s3Router);
app.use("/api/me", profileRouter);
app.use("/api/post", postRouter);


app.use(errorHandler);
app.use(notFoundHandler);

mongoose
  .connect(process.env.MONGO_DB_URL as string)
  .then(() => console.log("Connected! to DB"));

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
