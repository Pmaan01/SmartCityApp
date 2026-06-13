import type { Issue, User, Comment, IssueStatus, IssueCategory, Role } from "@prisma/client";

export type IssueWithRelations = Issue & {
  reportedBy: Pick<User, "id" | "name" | "image">;
  assignedTo: Pick<User, "id" | "name"> | null;
  _count?: { comments: number };
  comments?: (Comment & { author: Pick<User, "id" | "name" | "image"> })[];
};

export type { IssueStatus, IssueCategory, Role };
