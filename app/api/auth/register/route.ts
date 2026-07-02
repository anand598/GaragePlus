import bcrypt from "bcryptjs";
import { createAuthResponse, handleApiError } from "@/lib/api";
import { registerOwner } from "@/lib/data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await registerOwner({
      ownerName: String(body.ownerName ?? "").trim(),
      workshopName: String(body.workshopName ?? "").trim(),
      email: String(body.email ?? "").trim(),
      phone: String(body.phone ?? "").trim(),
      address: String(body.address ?? "").trim(),
      passwordHash: await bcrypt.hash(String(body.password ?? ""), 10)
    });

    return createAuthResponse(
      {
        id: user.id,
        workshopId: user.workshopId,
        name: user.name,
        email: user.email,
        role: user.role
      },
      { user },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
