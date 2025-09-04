import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// helpers (same as in POST)
const toNull = (v: unknown) => {
  if (v === undefined || v === null) return null
  const s = String(v).trim()
  return s === "" ? null : s
}
const normalizeUrl = (v: unknown) => {
  const s = toNull(v) as string | null
  if (!s) return null
  if (/^https?:\/\//i.test(s)) return s
  return `https://${s}`
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const member = await prisma.member.findFirst({
      where: { id, deletedAt: null },
      include: {
        state: true, city: true, brand: true,
        teamMembers: {
          where: { deletedAt: null },
          include: {
            team: {
              include: { tournament: { select: { name: true, status: true } } },
            },
          },
        },
      },
    })

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    return NextResponse.json(member, { status: 200 })
  } catch (error) {
    console.error("Error fetching member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    // Uniqueness checks (excluding the current member)
    if (data.mobile) {
      const existingMobile = await prisma.member.findFirst({
        where: {
          mobile: data.mobile,
          id: { not: id },
          deletedAt: null,
        },
        select: { id: true },
      })
      if (existingMobile) {
        return NextResponse.json({ error: "Member with this mobile number already exists" }, { status: 400 })
      }
    }

    if (data.email) {
      const existingEmail = await prisma.member.findFirst({
        where: {
          email: data.email,
          id: { not: id },
          deletedAt: null,
        },
        select: { id: true },
      })
      if (existingEmail) {
        return NextResponse.json({ error: "Member with this email already exists" }, { status: 400 })
      }
    }

    // Normalize inputs
    const normalized = {
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      dob: data.dob ? new Date(data.dob) : null,
      mobile: data.mobile,
      email: data.email ?? null,
      address: data.address ?? null,
      stateId: data.stateId,
      cityId: data.cityId,
      education: data.education ?? null,
      experienceYears: data.experienceYears ?? null,
      notes: data.notes ?? null,
      photoUrl: data.photoUrl ?? null,
      brandId: data.brandId && data.brandId !== "none" ? data.brandId : null,

      companyName: toNull(data.companyName) as string | null,
      companyWebsite: normalizeUrl(data.companyWebsite),
      companyInstagram: normalizeUrl(data.companyInstagram),
      companyYoutube: normalizeUrl(data.companyYoutube),
      companyFacebook: normalizeUrl(data.companyFacebook),
      companyLinkedin: normalizeUrl(data.companyLinkedin),


      updatedBy: session.user.id,
    }

    const updated = await prisma.member.update({
      where: { id },
      data: normalized,
      include: {
        state: true,
        city: true,
        brand: true,
      },
    })

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error("Error updating member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
