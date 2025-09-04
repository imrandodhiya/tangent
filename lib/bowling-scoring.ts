export interface Frame {
  roll1: number | null
  roll2: number | null
  roll3?: number | null // Only for 10th frame
  isStrike: boolean
  isSpare: boolean
  frameScore: number | null
  runningTotal: number | null
}

export interface BowlingGame {
  frames: Frame[]
  totalScore: number
  handicap: number
  finalScore: number
}

export class BowlingScorer {
  static calculateFrameScore(frames: Frame[], frameIndex: number): number | null {
    const frame = frames[frameIndex]

    if (frameIndex === 9) {
      // 10th frame special scoring
      return this.calculate10thFrame(frame)
    }

    if (frame.isStrike) {
      return this.calculateStrikeScore(frames, frameIndex)
    }

    if (frame.isSpare) {
      return this.calculateSpareScore(frames, frameIndex)
    }

    // Regular frame
    return (frame.roll1 || 0) + (frame.roll2 || 0)
  }

  private static calculate10thFrame(frame: Frame): number | null {
    if (frame.roll1 === null) return null

    let total = frame.roll1

    if (frame.roll2 !== null) {
      total += frame.roll2

      // If strike or spare in 10th frame, need 3rd roll
      if ((frame.roll1 === 10 || total === 10) && frame.roll3 !== null) {
        total += frame.roll3
      }
    }

    return total
  }

  private static calculateStrikeScore(frames: Frame[], frameIndex: number): number | null {
    if (frameIndex >= 8) return null // Need next frame(s) for strike bonus

    const nextFrame = frames[frameIndex + 1]
    if (!nextFrame || nextFrame.roll1 === null) return null

    let bonus = nextFrame.roll1

    if (nextFrame.isStrike && frameIndex < 8) {
      // Strike in next frame, need roll from frame after
      const frameAfterNext = frames[frameIndex + 2]
      if (!frameAfterNext || frameAfterNext.roll1 === null) return null
      bonus += frameAfterNext.roll1
    } else if (nextFrame.roll2 !== null) {
      bonus += nextFrame.roll2
    } else {
      return null // Need second roll of next frame
    }

    return 10 + bonus
  }

  private static calculateSpareScore(frames: Frame[], frameIndex: number): number | null {
    if (frameIndex >= 9) return null // Need next frame for spare bonus

    const nextFrame = frames[frameIndex + 1]
    if (!nextFrame || nextFrame.roll1 === null) return null

    return 10 + nextFrame.roll1
  }

  static calculateRunningTotal(frames: Frame[]): Frame[] {
    let runningTotal = 0

    return frames.map((frame, index) => {
      const frameScore = this.calculateFrameScore(frames, index)

      if (frameScore !== null) {
        runningTotal += frameScore
        return {
          ...frame,
          frameScore,
          runningTotal,
        }
      }

      return {
        ...frame,
        frameScore: null,
        runningTotal: null,
      }
    })
  }

  static calculateHandicap(average: number, handicapBase = 200): number {
    if (average >= handicapBase) return 0
    return Math.floor((handicapBase - average) * 0.8)
  }

  static validateRoll(roll: number, previousRoll?: number): boolean {
    if (roll < 0 || roll > 10) return false
    if (previousRoll !== undefined && previousRoll + roll > 10) return false
    return true
  }

  static createEmptyGame(): BowlingGame {
    const frames: Frame[] = Array.from({ length: 10 }, () => ({
      roll1: null,
      roll2: null,
      isStrike: false,
      isSpare: false,
      frameScore: null,
      runningTotal: null,
    }))

    // 10th frame can have 3 rolls
    frames[9].roll3 = null

    return {
      frames,
      totalScore: 0,
      handicap: 0,
      finalScore: 0,
    }
  }
}
