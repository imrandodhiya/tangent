
// --- Date helpers ---

/**
 * Parse a date string (YYYY-MM-DD or DD/MM/YYYY or DD-MM-YYYY) into a UTC Date.
 * Returns null if invalid or out of range.
 */
export function parseDob(input: unknown): Date | null {
    if (!input) return null

    if (input instanceof Date && !isNaN(input.getTime())) return input

    if (typeof input !== "string") return null
    const s = input.trim()

    // ISO: 2022-04-30
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
    if (iso) {
        const [, y, m, d] = iso
        const dt = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)))
        return isNaN(dt.getTime()) ? null : dt
    }

    // DD/MM/YYYY or DD-MM-YYYY
    const dmy = /^(\d{2})[/-](\d{2})[/-](\d{4})$/.exec(s)
    if (dmy) {
        const [, d, m, y] = dmy
        const dt = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)))
        return isNaN(dt.getTime()) ? null : dt
    }

    return null
}

/**
 * Clamp a Date to a reasonable range (1900–2100).
 */
export function clampReasonableDate(dt: Date | null): Date | null {
    if (!dt) return null
    const y = dt.getUTCFullYear()
    if (y < 1900 || y > 2100) return null
    return dt
}
