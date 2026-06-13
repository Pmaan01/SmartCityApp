import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ReportForm from "./ReportForm";

export const metadata = { title: "Report an Issue — SmartCity" };

export default async function ReportPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <ReportForm />
    </main>
  );
}
