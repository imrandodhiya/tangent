import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Gender } from "@prisma/client"
import { parseDob, clampReasonableDate } from "@/lib/common"

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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(
      searchParams.get("pageSize") || searchParams.get("per_page") || searchParams.get("perPage") || "10",
    )
    const search = (searchParams.get("search") || searchParams.get("q") || "").trim()
    const brandId = searchParams.get("brandId")
    const gender = searchParams.get("gender") as Gender | null
    const stateId = searchParams.get("stateId")

    const skip = (page - 1) * pageSize

    const where = {
      deletedAt: null,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { mobile: { contains: search, mode: "insensitive" as const } },
          { companyName: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(brandId && brandId !== "all" && { brandId }),
      ...(gender && gender !== ("all" as any) && { gender }),
      ...(stateId && stateId !== "all" && { stateId }),
    }

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        include: {
          state: true,
          city: true,
          brand: true,
          teamMembers: {
            where: { deletedAt: null },
            include: {
              team: {
                include: { tournament: { select: { name: true, status: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.member.count({ where }),
    ])

    return NextResponse.json({
      members,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error("Error fetching members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // ✅ Validate and normalize dob
    const rawDob = data.dob
    const dob = clampReasonableDate(parseDob(rawDob))
    if (rawDob && !dob) {
      return NextResponse.json(
        { error: "Invalid dob format. Use YYYY-MM-DD or DD/MM/YYYY." },
        { status: 400 }
      )
    }

    // Check if member with same mobile already exists
    const existingMember = await prisma.member.findFirst({
      where: {
        mobile: data.mobile,
        deletedAt: null,
      },
    })

    if (existingMember) {
      return NextResponse.json({ error: "Member with this mobile number already exists" }, { status: 400 })
    }

    // Check email uniqueness if provided
    if (data.email) {
      const existingEmail = await prisma.member.findFirst({
        where: {
          email: data.email,
          deletedAt: null,
        },
      })

      if (existingEmail) {
        return NextResponse.json({ error: "Member with this email already exists" }, { status: 400 })
      }
    }

    const member = await prisma.member.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        dob: data.dob ? new Date(data.dob) : null,
        mobile: data.mobile,
        email: data.email,
        address: data.address,
        stateId: data.stateId,
        cityId: data.cityId,
        education: data.education,
        experienceYears: data.experienceYears,
        notes: data.notes,
        photoUrl: data.photoUrl,
        brandId: data.brandId,
        companyName: toNull(data.companyName) as string | null,
        companyWebsite: normalizeUrl(data.companyWebsite),
        companyInstagram: normalizeUrl(data.companyInstagram),
        companyYoutube: normalizeUrl(data.companyYoutube),
        companyFacebook: normalizeUrl(data.companyFacebook),
        companyLinkedin: normalizeUrl(data.companyLinkedin),
        createdBy: session.user.id,
      },
      include: {
        state: true,
        city: true,
        brand: true,
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error("Error creating member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
