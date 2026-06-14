import { NextResponse } from "next/server";
import { joinCollective } from "@/lib/actions";

// POST /api/join  { email, phone, referredByCode? }
// Membership is immediate and permanent: creates the user, credits +50,
// and fires the Klaviyo welcome flow. See joinCollective for the auth note.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : undefined;
    const phone = typeof body.phone === "string" ? body.phone.trim() : undefined;
    const referredByCode =
      typeof body.referredByCode === "string" ? body.referredByCode : undefined;

    if (!email && !phone) {
      return NextResponse.json(
        { ok: false, message: "Enter an email or phone number." },
        { status: 400 }
      );
    }

    const result = await joinCollective({ email, phone, referredByCode });
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Could not join right now." },
      { status: 500 }
    );
  }
}
