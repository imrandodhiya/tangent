import type { NextRequest } from "next/server"
import SocketHandler from "@/lib/websocket-server"

export async function GET(req: NextRequest) {
  // @ts-ignore
  return SocketHandler(req, {
    socket: {
      server: global.socketServer || {},
    },
    end: () => new Response("Socket initialized", { status: 200 }),
  })
}
