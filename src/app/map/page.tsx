import { prisma } from "@/lib/prisma";
import PublicMap from "./PublicMap";

export const metadata = { title: "City Issue Map — SmartCity" };

export default async function MapPage() {
  const issues = await prisma.issue.findMany({
    where: { status: { not: "CLOSED" } },
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      priority: true,
      lat: true,
      lng: true,
      address: true,
      createdAt: true,
    },
  });

  return (
    <main className="h-screen flex flex-col">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <a href="/" className="font-bold text-indigo-600 text-lg">SmartCity</a>
        <h1 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          City Issue Map — {issues.length} open issues
        </h1>
        <a href="/report" className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition">
          + Report Issue
        </a>
      </div>
      <div className="flex-1">
        <PublicMap issues={issues} />
      </div>
    </main>
  );
}
