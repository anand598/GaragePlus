import { createAuthResponse, apiError, handleApiError } from "@/lib/api";
import { verifyPassword } from "@/lib/auth";
import { getUserByEmail } from "@/lib/data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");
    const user = await getUserByEmail(email);

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return apiError(401, "Invalid email or password.");
    }

    return createAuthResponse(
      {
        id: user.id,
        workshopId: user.workshopId,
        name: user.name,
        email: user.email,
        role: user.role
      },
      { user }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
