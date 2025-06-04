import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const startTime = performance.now();
    const user = await currentUser();
    const endTime = performance.now();
    
    return NextResponse.json({
      success: true,
      user,
      duration: endTime - startTime,
      method: "clerk-direct"
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        method: "clerk-direct"
      },
      { status: 500 }
    );
  }
}
