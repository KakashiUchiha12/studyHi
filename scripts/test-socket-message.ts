
import { io } from "socket.io-client";
import { PrismaClient } from "@prisma/client";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
const prisma = new PrismaClient();

async function main() {
    console.log("Starting socket test...");

    // 1. Get a test user and a channel
    const users = await prisma.user.findMany({ take: 5 });
    console.log(`Found ${users.length} users.`);

    if (users.length < 2) {
        console.log("Not enough users for DM test.");
    }

    const channels = await prisma.channel.findMany({
        take: 5,
        include: { community: { include: { members: true } } }
    });
    console.log(`Found ${channels.length} channels.`);

    const user1 = users[0];
    const user2 = users[1];

    console.log("User 1:", user1?.name);
    console.log("User 2:", user2?.name);

    // Testing DM
    if (user1 && user2) {
        console.log(`Testing DM from ${user1.name} to ${user2.name}`);

        const socket = io("http://localhost:3000", {
            path: "/api/socket/io",
            transports: ["websocket"],
        });

        socket.on("connect", () => {
            console.log("Connected to local socket server");

            const messageData = {
                content: "Test DM " + new Date().toISOString(),
                receiverId: user2.id,
                senderId: user1.id
            };

            console.log("Emitting send-message...", messageData);
            socket.emit("send-message", messageData);
        });

        socket.on("new-dm", (msg) => {
            console.log("Received new-dm event:", msg.id);
            console.log("SUCCESS: DM sent and received.");
            socket.disconnect();
            process.exit(0);
        });

        socket.on("connect_error", (err) => {
            console.error("Connection error:", err.message);
            // Don't exit immediately, retry might happen? 
            // Actually for this test, exit.
            process.exit(1);
        });

        setTimeout(() => {
            console.log("Timeout waiting for new-dm event");
            socket.disconnect();
            process.exit(1);
        }, 8000);

        return;
    }

    console.log("Skipped DM test branch.");
}

main();
