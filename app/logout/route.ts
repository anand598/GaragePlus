import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("garagepro_session");
  return NextResponse.redirect(new URL("/login", request.url));
}
