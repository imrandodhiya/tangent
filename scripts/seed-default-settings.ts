import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function seedDefaultSettings() {
  console.log("🌱 Seeding default settings...")

  const defaultSettings = [
    // System Configuration
    {
      key: "system.app_name",
      value: "Bowling Tournament Manager",
      category: "system",
      description: "Application name displayed in the header",
      type: "string",
    },
    {
      key: "system.app_version",
      value: "1.0.0",
      category: "system",
      description: "Current application version",
      type: "string",
    },
    {
      key: "system.maintenance_mode",
      value: "false",
      category: "system",
      description: "Enable maintenance mode to restrict access",
      type: "boolean",
    },
    {
      key: "system.max_file_size",
      value: "10485760",
      category: "system",
      description: "Maximum file upload size in bytes (10MB)",
      type: "number",
    },

    // Tournament Settings
    {
      key: "tournament.default_frames",
      value: "10",
      category: "tournament",
      description: "Default number of frames per game",
      type: "number",
    },
    {
      key: "tournament.default_handicap_base",
      value: "200",
      category: "tournament",
      description: "Default handicap base score",
      type: "number",
    },
    {
      key: "tournament.default_handicap_percent",
      value: "90",
      category: "tournament",
      description: "Default handicap percentage",
      type: "number",
    },
    {
      key: "tournament.female_adjustment_pins",
      value: "8",
      category: "tournament",
      description: "Default female adjustment pins",
      type: "number",
    },

    // Security Settings
    {
      key: "security.session_timeout",
      value: "3600",
      category: "security",
      description: "Session timeout in seconds (1 hour)",
      type: "number",
    },
    {
      key: "security.password_min_length",
      value: "8",
      category: "security",
      description: "Minimum password length",
      type: "number",
    },
    {
      key: "security.require_password_complexity",
      value: "true",
      category: "security",
      description: "Require complex passwords (uppercase, lowercase, numbers, symbols)",
      type: "boolean",
    },
    {
      key: "security.max_login_attempts",
      value: "5",
      category: "security",
      description: "Maximum login attempts before account lockout",
      type: "number",
    },

    // Notification Settings
    {
      key: "notifications.email_enabled",
      value: "true",
      category: "notifications",
      description: "Enable email notifications",
      type: "boolean",
    },
    {
      key: "notifications.smtp_host",
      value: "",
      category: "notifications",
      description: "SMTP server hostname",
      type: "string",
    },
    {
      key: "notifications.smtp_port",
      value: "587",
      category: "notifications",
      description: "SMTP server port",
      type: "number",
    },
    {
      key: "notifications.from_email",
      value: "noreply@tournament.com",
      category: "notifications",
      description: "Default sender email address",
      type: "string",
    },

    // Appearance Settings
    {
      key: "appearance.theme",
      value: "light",
      category: "appearance",
      description: "Default application theme",
      type: "string",
    },
    {
      key: "appearance.primary_color",
      value: "#3b82f6",
      category: "appearance",
      description: "Primary brand color",
      type: "color",
    },
    {
      key: "appearance.logo_url",
      value: "",
      category: "appearance",
      description: "Application logo URL",
      type: "string",
    },
    {
      key: "appearance.favicon_url",
      value: "",
      category: "appearance",
      description: "Application favicon URL",
      type: "string",
    },

    // Display Settings
    {
      key: "display.page_order",
      value: "[]",
      category: "display",
      description:
        "Ordered list of route paths to show on display; first is highest priority (e.g., '/(public)/leaderboard/ABC123')",
      type: "json",
    },
  ]

  for (const settingData of defaultSettings) {
    const existingSetting = await prisma.setting.findUnique({
      where: { key: settingData.key },
    })

    if (!existingSetting) {
      await prisma.setting.create({
        data: settingData,
      })
      console.log(`✅ Created setting: ${settingData.key}`)
    } else {
      console.log(`⏭️  Setting already exists: ${settingData.key}`)
    }
  }

  console.log("✅ Default settings seeding completed!")
}

seedDefaultSettings()
  .catch((e) => {
    console.error("❌ Error seeding default settings:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
