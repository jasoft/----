import { getCachedCurrentUser } from "~/services/auth-cache-simple";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const startTime = performance.now();
    const user = await getCachedCurrentUser();
    const endTime = performance.now();

    return NextResponse.json({
      success: true,
      user,
      duration: endTime - startTime,
      method: "cached-auth",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        method: "cached-auth",
      },
      { status: 500 },
    );
  }
}
