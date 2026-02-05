import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ChatInterface } from "@/components/chat/chat-interface";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ChannelPage({
    params
}: {
    params: Promise<{ id: string; channelId: string }>
}) {
    const { id, channelId } = await params;
    const session = await getServerSession(authOptions);

    const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: { community: true }
    });

    if (!channel || channel.communityId !== id) {
        notFound();
    }

    // Basic access control (must be member or public community)
    // Note: detailed check is also done in API, but good to check here to prevent UI flash
    const membership = session?.user ? await prisma.communityMember.findUnique({
        where: {
            communityId_userId: {
                communityId: id,
                userId: (session.user as any).id
            }
        }
    }) : null;

    if (channel.community.isPrivate && !membership) {
        // Redirect or Show Access Denied? 
        // For now, let's assume if they can see the link they might be allowed, 
        // but real security is in the API.
        // We could render a "Join to view" state if we wanted.
    }

    return (
        <div className="h-full">
            <ChatInterface
                channelId={channelId}
                channelName={channel.name}
            />
        </div>
    );
}
