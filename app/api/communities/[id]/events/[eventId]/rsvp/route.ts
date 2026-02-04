import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: { id: string; eventId: string } }
) { // Schema defines eventId, but folder structure matches
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { status } = await req.json(); // "going", "maybe", "not_going"

        if (!["going", "maybe", "not_going"].includes(status)) {
            return new NextResponse("Invalid status", { status: 400 });
        }

        const rsvp = await (prisma as any).eventAttendee.upsert({
            where: {
                eventId_userId: {
                    eventId: params.eventId,
                    userId: userId
                }
            },
            update: {
                status
            },
            create: {
                eventId: params.eventId,
                userId: userId,
                status
            }
        });

        return NextResponse.json(rsvp);
    } catch (error) {
        console.error("[RSVP_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
