import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user?.email! },
      include: {
        socialProfile: true,
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[PROFILE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name, username, bio, image } = await req.json();

    // Update User (name, image, username)
    // Update SocialProfile (bio)

    // Check username uniqueness if changed
    if (username) {
      const existing = await prisma.user.findUnique({
        where: { username }
      });
      if (existing && existing.email !== session.user?.email) {
        return new NextResponse("Username already taken", { status: 400 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user?.email! },
      data: {
        name,
        image,
        username,
        socialProfile: {
          upsert: {
            create: { bio },
            update: { bio }
          }
        }
      }
    });

    return NextResponse.json({ success: true, id: updatedUser.id });
  } catch (error) {
    console.error("[PROFILE_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
