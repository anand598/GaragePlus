import { createStaffUserAction, deleteStaffUserAction, updateStaffUserAction } from "@/app/(app)/actions";
import { ActionFeedbackBanner, Panel, SectionHeading, StatusBadge } from "@/components/ui";
import { canManageSettings, requireSession } from "@/lib/auth";
import { getUsers } from "@/lib/data";

export default async function UsersPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; message?: string }>;
}) {
  const session = await requireSession();
  const { status, message } = await searchParams;
  const users = await getUsers();
  const canManage = canManageSettings(session.role);

  return (
    <div className="space-y-6">
      <ActionFeedbackBanner status={status} message={message} />
      <Panel className="p-6">
        <SectionHeading title="Team Access & Roles" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["OWNER", "Full control over setup, billing, and staff access."],
            ["MANAGER", "Can manage customers, catalog, billing, and status flows."],
            ["CASHIER", "Can create invoices, manage customers, and record payments."],
            ["STAFF", "Can view operations and update vehicle work status."]
          ].map(([role, summary]) => (
            <div key={role} className="rounded-3xl border border-slate-100 p-5">
              <StatusBadge label={role} tone={role === "OWNER" ? "blue" : role === "MANAGER" ? "violet" : role === "CASHIER" ? "amber" : "green"} />
              <p className="mt-3 text-sm text-slate-600">{summary}</p>
            </div>
          ))}
        </div>
      </Panel>

      {canManage && (
        <Panel className="p-6">
          <SectionHeading title="Add Team Member" />
          <form action={createStaffUserAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <input type="hidden" name="redirectTo" value="/users" />
            <input type="hidden" name="successMessage" value="User created successfully." />
            <input name="name" placeholder="Full Name" className="field" required />
            <input name="email" placeholder="Email" className="field" required />
            <input name="password" type="password" placeholder="Temporary Password" className="field" required />
            <select name="role" className="field" defaultValue="STAFF">
              <option value="MANAGER">Manager</option>
              <option value="CASHIER">Cashier</option>
              <option value="STAFF">Staff</option>
            </select>
            <button className="btn-primary xl:col-span-4">Create User</button>
          </form>
        </Panel>
      )}

      <Panel className="p-6">
        <SectionHeading title="Current Users" />
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex flex-col justify-between gap-3 rounded-3xl border border-slate-100 p-5 md:flex-row md:items-center">
              {canManage && user.role !== "OWNER" ? (
                <div className="w-full space-y-2">
                  <form action={updateStaffUserAction} className="flex w-full flex-col gap-3 lg:flex-row lg:items-center">
                    <input type="hidden" name="redirectTo" value="/users" />
                    <input type="hidden" name="successMessage" value="User updated successfully." />
                    <input type="hidden" name="userId" value={user.id} />
                    <input name="name" defaultValue={user.name} className="field lg:max-w-xs" />
                    <input name="email" defaultValue={user.email} className="field lg:max-w-sm" />
                    <select name="role" defaultValue={user.role} className="field lg:max-w-[180px]">
                      <option value="MANAGER">Manager</option>
                      <option value="CASHIER">Cashier</option>
                      <option value="STAFF">Staff</option>
                    </select>
                    <button className="btn-primary">Save</button>
                  </form>
                  <form action={deleteStaffUserAction} className="flex justify-end">
                    <input type="hidden" name="redirectTo" value="/users" />
                    <input type="hidden" name="successMessage" value="User removed successfully." />
                    <input type="hidden" name="userId" value={user.id} />
                    <button className="text-sm text-rose-600">
                      Remove
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  <div>
                    <p className="font-semibold text-slate-900">{user.name}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                  <StatusBadge label={user.role} tone={user.role === "OWNER" ? "blue" : user.role === "MANAGER" ? "violet" : user.role === "CASHIER" ? "amber" : "green"} />
                </>
              )}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
