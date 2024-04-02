import express, { Request, Response } from "express";
import { getS3SignedUrl } from "../utils/s3.utils";

export const s3Router = express.Router();

s3Router.get("/signed-upload-url", async (req: Request, res: Response) => {
  const { contentType } = req.query;
  console.log(contentType);
  if (!contentType)
    res
      .status(400)
      .send({ message: "Missing required contentType query param" });
  const { fileName, uploadUrl } = await getS3SignedUrl(contentType as string);
  res.status(200).send({ fileName, uploadUrl });
});
