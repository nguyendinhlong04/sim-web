import { NextResponse } from "next/server";

// GET /api/chat/online-status
// Check if any agents are online via the Socket.io server
export async function GET() {
  const io = (global as any).__socketio;

  if (!io) {
    return NextResponse.json({ online: false });
  }

  const agentRoom = io.sockets.adapter.rooms.get("agents");
  const online = agentRoom ? agentRoom.size > 0 : false;

  return NextResponse.json({ online });
}
