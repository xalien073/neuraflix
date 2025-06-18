// src/app/api/insertMovie/route.js

import { BlobServiceClient } from "@azure/storage-blob";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { client } from "@/lib/gremlin-client";

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = "neuraflixthumbnails";

export const POST = async (req) => {
  try {
    // Parse multipart/form-data
    const formData = await req.formData();
    const file = formData.get("file");
    const title = formData.get("title");
    const genre = formData.get("genre");
    const year = formData.get("year");

    // Log incoming form data
    console.log("Received FormData:", {
      title,
      genre,
      year,
      filePresent: !!file,
    });

    // Validation check
    if (!file || !title || !genre || !year) {
      return NextResponse.json(
        {
          message: "Missing required fields",
          title: title || "Missing",
          genre: genre || "Missing",
          year: year || "Missing",
          file: file ? "OK" : "Missing",
        },
        { status: 400 }
      );
    }

    // Check if storage connection is present
    if (!AZURE_STORAGE_CONNECTION_STRING) {
      console.error("Azure connection string is missing");
      return NextResponse.json({ message: "Server misconfigured" }, { status: 500 });
    }

    // Upload to Azure Blob Storage
    const buffer = await file.arrayBuffer();
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    const blobName = `${uuidv4()}-${file.name.replace(/\s+/g, "-")}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(Buffer.from(buffer), {
      blobHTTPHeaders: { blobContentType: file.type || "application/octet-stream" },
    });

    const thumbnailUrl = blockBlobClient.url;
    console.log("Uploaded thumbnail:", thumbnailUrl);

    // Insert movie vertex using Gremlin
    await client.open();

    const movieId = title.replace(/\s+/g, "_").toLowerCase();

    const insertQuery = `
      g.addV('movie')
        .property('id', '${movieId}')
        .property('title', '${title}')
        .property('genre', '${genre}')
        .property('year', '${year}')
        .property('thumbnail', '${thumbnailUrl}')
    `;
    await client.submit(insertQuery);
    console.log("Movie inserted with ID:", movieId);

    return NextResponse.json({
      message: "Movie inserted successfully",
      movie: {
        id: movieId,
        title,
        genre,
        year,
        thumbnail: thumbnailUrl,
      },
    });

  } catch (error) {
    console.error("Error inserting movie:", error);
    return NextResponse.json({ message: "Movie insertion failed", error: error.message }, { status: 500 });
  } finally {
    await client.close();
  }
};


// import { BlobServiceClient } from "@azure/storage-blob";
// import { NextResponse } from "next/server";
// import { v4 as uuidv4 } from "uuid";

// const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
// const CONTAINER_NAME = "neuraflixthumbnails";

// export const POST = async (req) => {
//   try {
//     const formData = await req.formData();
//     const file = formData.get("file");

//     if (!file) {
//       return NextResponse.json({ message: "File is required" }, { status: 400 });
//     }

//     const buffer = await file.arrayBuffer();

//     const blobServiceClient = BlobServiceClient.fromConnectionString(
//       AZURE_STORAGE_CONNECTION_STRING
//     );
//     const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

//     const blobName = `${uuidv4()}-${file.name.replace(/\s+/g, "-")}`;
//     const blockBlobClient = containerClient.getBlockBlobClient(blobName);

//     await blockBlobClient.uploadData(Buffer.from(buffer), {
//       blobHTTPHeaders: { blobContentType: file.type || "application/octet-stream" },
//     });

//     return NextResponse.json({
//       message: "Thumbnail uploaded successfully",
//       blobUrl: blockBlobClient.url,
//     });
//   } catch (error) {
//     console.error("Error uploading thumbnail:", error);
//     return NextResponse.json({ message: "Thumbnail upload failed" }, { status: 500 });
//   }
// };
