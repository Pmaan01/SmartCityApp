import { handlers } from "@/lib/auth";
import type { NextRequest } from "next/server";

// next-auth beta handlers don't match Next.js 16's strict route handler signature — cast needed
export const GET = handlers.GET as (req: NextRequest) => Promise<Response>;
export const POST = handlers.POST as (req: NextRequest) => Promise<Response>;
