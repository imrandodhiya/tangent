import { Server } from "socket.io"
import type { NextApiRequest } from "next"
import type { NextApiResponseServerIO } from "@/types/socket"

declare global {
  // eslint-disable-next-line no-var
  var __io: Server | undefined
}

export function getIO(): Server | undefined {
  return global.__io
}

export function emitToTournament(tournamentId: string, event: string, payload: unknown) {
  try {
    const io = getIO()
    if (!io) return
    io.to(`tournament-${tournamentId}`).emit(event, payload)
  } catch {
    // swallow to avoid breaking API responses
  }
}

export default function SocketHandler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (res.socket.server.io) {
    console.log("Socket is already running")
    if (!global.__io) {
      // @ts-ignore
      global.__io = res.socket.server.io
    }
  } else {
    console.log("Socket is initializing")
    const io = new Server(res.socket.server)
    res.socket.server.io = io
    global.__io = io

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id)

      // Join tournament room
      socket.on("join-tournament", (tournamentId: string) => {
        socket.join(`tournament-${tournamentId}`)
        console.log(`Client ${socket.id} joined tournament ${tournamentId}`)
      })

      // Handle score updates (client-originated)
      socket.on("score-update", (data) => {
        // Broadcast to all clients in the tournament room
        socket.to(`tournament-${data.tournamentId}`).emit("score-updated", data)
      })

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id)
      })
    })
  }
  res.end()
}
