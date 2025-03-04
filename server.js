require("dotenv").config();
const express = require("express");
const {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

app.get("/aws", async (req, res) => {
  // Use lowercase "patient" query parameter.
  const patientName = req.query.patient;
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
  };

  try {
    const data = await s3.send(new ListObjectsV2Command(params));
    let files = data.Contents ? data.Contents.map((item) => item.Key) : [];

    if (patientName) {
      // Convert to lowercase for a case-insensitive match.
      const prefix = patientName.toLowerCase() + "/";
      files = files.filter(
        (key) =>
          key.toLowerCase().startsWith(prefix) &&
          key.toLowerCase().endsWith(".dcm")
      );

      console.log("Files after filtering by patient name:", files);

      // Generate signed URLs for each matching file (expires in 1 hour).
      const signedUrls = await Promise.all(
        files.map(async (key) => {
          const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
          });
          const signedUrl = await getSignedUrl(s3, command, {
            expiresIn: 3600,
          });
          return signedUrl;
        })
      );
      files = signedUrls;
    }

    console.log("Final file list returned:", files);
    res.json({ files });
  } catch (err) {
    console.error("Error fetching files from S3:", err);
    res.status(500).json({ error: "Error fetching files from S3" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
