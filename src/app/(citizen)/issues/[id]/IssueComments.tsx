"use client";

import { useState, useTransition, useRef } from "react";

interface Author {
  id: string;
  name: string | null;
  image: string | null;
}

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: Author;
}

interface Props {
  issueId: string;
  initialComments: Comment[];
  currentUserId: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function IssueComments({ issueId, initialComments, currentUserId }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    if (!text.trim()) return;
    const draft = text.trim();
    setText("");
    setError("");

    startTransition(async () => {
      const res = await fetch(`/api/issues/${issueId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft }),
      });

      if (!res.ok) {
        setError("Failed to post comment. Please try again.");
        setText(draft);
        return;
      }

      const comment: Comment = await res.json();
      comment.createdAt = new Date(comment.createdAt).toISOString();
      setComments((prev) => [...prev, comment]);
    });
  };

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
        Comments
        {comments.length > 0 && (
          <span className="ml-2 text-xs font-normal text-gray-400">({comments.length})</span>
        )}
      </h2>

      {comments.length === 0 && (
        <p className="text-sm text-gray-400 mb-5">No comments yet. Be the first to comment.</p>
      )}

      <div className="space-y-4 mb-6">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            {c.author.image ? (
              <img src={c.author.image} alt="" className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                  {c.author.name?.[0]?.toUpperCase() ?? "?"}
                </span>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {c.author.name ?? "Anonymous"}
                  {c.author.id === currentUserId && (
                    <span className="ml-1.5 text-xs text-indigo-400 font-normal">you</span>
                  )}
                </span>
                <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{c.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
          placeholder="Add a comment… (Ctrl+Enter to post)"
          rows={3}
          className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={submit}
            disabled={!text.trim() || isPending}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? "Posting…" : "Post comment"}
          </button>
        </div>
      </div>
    </div>
  );
}
