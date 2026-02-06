import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const subfolder = formData.get("subfolder") as string || "";

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        // Sanitize subfolder to prevent directory traversal
        const sanitizedSubfolder = subfolder.replace(/\.\./g, "").replace(/^[/\\]+|[/\\]+$/g, "");

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${uuidv4()}${path.extname(file.name)}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads", sanitizedSubfolder);
        const filePath = path.join(uploadDir, filename);

        await mkdir(uploadDir, { recursive: true });
        await writeFile(filePath, buffer);

        const relativePath = sanitizedSubfolder
            ? `/uploads/${sanitizedSubfolder}/${filename}`.replace(/\/+/g, "/")
            : `/uploads/${filename}`;

        return NextResponse.json({ url: relativePath });
    } catch (error) {
        console.error("Error saving file:", error);
        return NextResponse.json(
            { error: "Error saving file" },
            { status: 500 }
        );
    }
}
