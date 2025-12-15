import { createUploadthing, type FileRouter } from "uploadthing/next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const f = createUploadthing()

console.log("UploadThing Init - Secret:", process.env.UPLOADTHING_SECRET ? "Set" : "Missing");
console.log("UploadThing Init - AppID:", process.env.UPLOADTHING_APP_ID ? "Set" : "Missing");

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  studyMaterialUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 5 }, pdf: { maxFileSize: "16MB", maxFileCount: 10 } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      // Get actual authenticated user instead of hardcoded userId
      try {
        const session = await getServerSession(authOptions)
        const userId = (session?.user as any)?.id || "anonymous"
        return { userId }
      } catch (error) {
        console.error("UploadThing middleware auth error:", error)
        return { userId: "anonymous" }
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId)
      console.log("file url", file.url)

      // Return anything you want to be accessible on the client
      return { uploadedBy: metadata.userId }
    }),

  backgroundImageUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 10 } })
    .middleware(async ({ req }) => {
      try {
        const session = await getServerSession(authOptions)
        const userId = (session?.user as any)?.id || "anonymous"
        return { userId }
      } catch (error) {
        console.error("Background upload middleware auth error:", error)
        return { userId: "anonymous" }
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Background upload complete for userId:", metadata.userId)
      console.log("background file url", file.url)

      return { uploadedBy: metadata.userId, url: file.url }
    }),

  profileImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions)
      const userId = (session?.user as any)?.id || "anonymous"
      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Profile upload complete:", file.url)
      return { uploadedBy: metadata.userId, url: file.url }
    }),

  postAttachment: f({
    image: { maxFileSize: "16MB", maxFileCount: 5 },
    video: { maxFileSize: "32MB", maxFileCount: 1 },
    pdf: { maxFileSize: "16MB", maxFileCount: 5 },
    text: { maxFileSize: "64KB", maxFileCount: 5 },
  })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions)
      const userId = (session?.user as any)?.id || "anonymous"
      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Post attachment upload complete:", file.url)
      return { uploadedBy: metadata.userId, url: file.url, name: file.name, size: file.size }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
