import * as dotenv from "dotenv";
import { S3Client } from "@aws-sdk/client-s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";
dotenv.config();

const s3Client = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY as string,
    secretAccessKey: process.env.S3_SECRET_KEY as string,
  },
});

export const getS3SignedUrl = async (
  contentType: string
): Promise<{ fileName: string; uploadUrl: string }> => {
  const fileExtension = contentType.split("/")[1];
  const key = `${uuid()}.${fileExtension}`;
  const s3Params = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(s3Client, s3Params, { expiresIn: 3600 });
  return {
    fileName: key,
    uploadUrl,
  };
};
