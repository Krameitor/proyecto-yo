import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
// We need to import the handler config from our auth route to get the correct session setup
import { GET as handler } from "../auth/[...nextauth]/route"
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

// Re-declare authOptions since we can't easily import the wrapped handler's options
const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly"
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, account }: any) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }: any) {
      session.accessToken = token.accessToken
      return session
    }
  }
}

export async function GET() {
  const session: any = await getServerSession(authOptions)

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Fetch events from Google Calendar API
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${today.toISOString()}&timeMax=${tomorrow.toISOString()}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    )

    if (!res.ok) {
      throw new Error(`Google API responded with ${res.status}`)
    }

    const data = await res.json()
    return NextResponse.json({ events: data.items || [] })
  } catch (error) {
    console.error("Calendar API error:", error)
    return NextResponse.json({ error: "Failed to fetch calendar" }, { status: 500 })
  }
}
