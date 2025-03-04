const express = require("express");
const {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const cors = require("cors");
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

app.use(cors());

async function listAllObjects(bucket, prefix) {
  let allObjects = [];
  let isTruncated = true;
  let continuationToken;

  while (isTruncated) {
    const params = {
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    };

    try {
      const data = await s3.send(new ListObjectsV2Command(params));
      allObjects = allObjects.concat(data.Contents);
      isTruncated = data.IsTruncated;
      continuationToken = data.NextContinuationToken;
    } catch (err) {
      throw new Error("Error listing objects: " + err.message);
    }
  }

  return allObjects;
}

function groupBySeries(objects) {
  const seriesGroups = {};
  const annotations = {};

  objects.forEach((obj) => {
    const keyParts = obj.Key.split("/");
    const seriesPath = keyParts.slice(1, -1).join("/"); // This is the full path excluding the filename
    const fileName = keyParts[keyParts.length - 1];

    // Determine if this is an annotation or a series file
    if (fileName === "annotation.json") {
      const seriesName = seriesPath.split("/").pop(); // Extracts the last part of the series path as series name
      annotations[seriesName] = obj.Key;
    } else {
      const seriesName = seriesPath.split("/").pop(); // Extracts the last part of the series path as series name
      if (!seriesGroups[seriesName]) {
        seriesGroups[seriesName] = [];
      }
      seriesGroups[seriesName].push(obj.Key);
    }
  });

  return { seriesGroups, annotations };
}

app.get("/:institute/:doctor/:name", async (req, res) => {
  const patientName = req.params.name;
  const institute = req.params.institute;
  const doctor = req.params.doctor;
  const bucketName = process.env.BUCKET_NAME;
  const prefix = `${patientName}/`;

  try {
    const data = await listAllObjects(bucketName, prefix);

    if (!data || data.length === 0) {
      return res
        .status(404)
        .send("No files found for the specified patient name.");
    }

    const { seriesGroups, annotations } = groupBySeries(data);

    const fileURLs = {};
    for (const [seriesName, keys] of Object.entries(seriesGroups)) {
      fileURLs[seriesName] = await Promise.all(
        keys.map(async (key) => {
          const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
          });
          return getSignedUrl(s3, command, { expiresIn: 3600 });
        })
      );
    }

    const annotationURLs = {};
    for (const [seriesName, key] of Object.entries(annotations)) {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      annotationURLs[seriesName] = await getSignedUrl(s3, command, {
        expiresIn: 3600,
      });
    }

    res.json({
      InstituteName: institute,
      DoctorName: doctor,
      SeriesUrls: fileURLs,
      Annotations: annotationURLs,
      Report: {}, // Assuming you'll fill this in later
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving files from S3.");
  }
});

// Utility function to convert stream to string
function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

app.get("/annotation/:name/:seriesname/:annotation", async (req, res) => {
  try {
    const patientName = req.params.name;
    const seriesName = req.params.seriesname;
    const annotation = JSON.parse(decodeURIComponent(req.params.annotation));

    const jsonContent = JSON.stringify(annotation, null, 2);

    const uploadParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: `${patientName}/${seriesName}/annotation.json`,
      Body: jsonContent,
      ContentType: "application/json",
    };

    await s3.send(new PutObjectCommand(uploadParams));

    res.json({
      message: "Annotation received and uploaded successfully",
      patientName,
      annotation,
    });
  } catch (err) {
    console.error("Error processing request:", err.message);
    res.status(400).send("Invalid annotation data.");
  }
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.BUCKET_NAME,
    key: function (req, file, cb) {
      const patientName = req.params.name;
      const reportName = req.params.report;
      const fileName = `${patientName}/${reportName}-${Date.now()}${path.extname(
        file.originalname
      )}`;
      cb(null, fileName);
    },
  }),
});

app.post("/report/:name/:report", upload.single("file"), async (req, res) => {
  try {
    const patientName = req.params.name;
    const reportName = req.params.report;

    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    res.json({
      message: "PDF uploaded successfully",
      fileLocation: req.file.location,
      patientName,
      reportName,
    });
  } catch (err) {
    console.error("Error uploading PDF:", err.message);
    res.status(500).send("Failed to upload PDF.");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
