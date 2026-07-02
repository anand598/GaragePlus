import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { ReminderActivity } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const reminderLogPath = path.join(dataDir, "reminder-log.json");

async function ensureReminderLog() {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(reminderLogPath, "utf8");
  } catch {
    await writeFile(reminderLogPath, "[]", "utf8");
  }
}

export async function getReminderActivities() {
  await ensureReminderLog();
  const content = await readFile(reminderLogPath, "utf8");
  return JSON.parse(content) as ReminderActivity[];
}

export async function appendReminderActivity(activity: ReminderActivity) {
  const activities = await getReminderActivities();
  activities.unshift(activity);
  await writeFile(reminderLogPath, JSON.stringify(activities, null, 2), "utf8");
}
