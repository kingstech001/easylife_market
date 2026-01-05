import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

function bufferToStream(buffer: Buffer): Readable {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const data = await req.formData();
  const file = data.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise<NextResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "store-images" },
      (error, result) => {
        if (error) {
          console.error(error);
          return resolve(
            NextResponse.json({ error: "Upload failed" }, { status: 500 })
          );
        }
        resolve(NextResponse.json({ secure_url: result?.secure_url }));
      }
    );

    bufferToStream(buffer).pipe(stream);
  });
}