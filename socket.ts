import type { Server as NetServer, Socket } from "net"
import type { NextApiResponse } from "next"
import type { Server as SocketIOServer } from "socket.io"

export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer
    }
  }
}

export interface LiveScore {
  id: string
  tournamentId: string
  teamId: string
  memberId: string
  frame: number
  roll1: number | null
  roll2: number | null
  roll3: number | null
  frameScore: number
  totalScore: number
  isStrike: boolean
  isSpare: boolean
  updatedAt: string
}

export interface TeamPosition {
  teamId: string
  laneNumber: number
  position: "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | "L7" | "L8" | "L9" | "L10"
  color: string
}
