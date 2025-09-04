import { NextResponse } from "next/server"
import { put } from "@vercel/blob"

export const runtime = "edge" // optional, fast

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // You can add validation on type/size here server-side too
    const objectName = `brands/${Date.now()}-${file.name.replace(/\s+/g, "_")}`

    // Requires BLOB_READ_WRITE_TOKEN in your env on Vercel or local
    const blob = await put(objectName, file, {
      access: "public",
      // token: process.env.BLOB_READ_WRITE_TOKEN, // if needed locally
    })

    return NextResponse.json({ url: blob.url })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Upload failed" }, { status: 500 })
  }
}
