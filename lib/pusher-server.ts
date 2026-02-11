import Pusher from "pusher"

// Server-side Pusher instance
const APP_ID = process.env.PUSHER_APP_ID || "2107345";
const KEY = process.env.PUSHER_KEY || "03c8b458570215655ea3";
const SECRET = process.env.PUSHER_SECRET || "447b4e7fb1e016284ebf";
const CLUSTER = process.env.PUSHER_CLUSTER || "ap2";

export const pusherServer = new Pusher({
    appId: APP_ID === "your_pusher_app_id" ? "2107345" : APP_ID,
    key: KEY === "your_pusher_key" ? "03c8b458570215655ea3" : KEY,
    secret: SECRET === "your_pusher_secret" ? "447b4e7fb1e016284ebf" : SECRET,
    cluster: CLUSTER === "your_pusher_cluster" ? "ap2" : CLUSTER,
    useTLS: true,
});
