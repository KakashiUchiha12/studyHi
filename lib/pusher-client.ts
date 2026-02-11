import PusherClient from "pusher-js"

// Enable logging for debugging
PusherClient.logToConsole = true;

// Client-side Pusher instance
const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || "03c8b458570215655ea3";
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2";

export const pusherClient = new PusherClient(PUSHER_KEY === "your_pusher_key" ? "03c8b458570215655ea3" : PUSHER_KEY, {
    cluster: PUSHER_CLUSTER === "your_pusher_cluster" ? "ap2" : PUSHER_CLUSTER,
});
