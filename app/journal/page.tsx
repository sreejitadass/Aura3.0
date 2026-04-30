"use client";

import { useEffect, useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function JournalPage() {
  const searchParams = useSearchParams();
  const selectedDate = searchParams.get("date");

  const [content, setContent] = useState("");
  const [entries, setEntries] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [entryDate, setEntryDate] = useState(
    selectedDate || new Date().toISOString().split("T")[0],
  );

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Group entries by date
  function groupEntriesByDate(entries: any[]) {
    return entries.reduce((acc: any, entry) => {
      const date = new Date(entry.createdAt).toDateString();

      if (!acc[date]) {
        acc[date] = [];
      }

      acc[date].push(entry);

      return acc;
    }, {});
  }

  const groupedEntries = groupEntriesByDate(entries);

  // Fetch entries
  useEffect(() => {
    async function fetchEntries() {
      try {
        const res = await fetch("http://localhost:3001/api/journal", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setEntries(data);
      } catch (err) {
        console.error(err);
      }
    }

    if (token) fetchEntries();
  }, [token]);

  // Save entry
  const handleSave = async () => {
    if (!content.trim()) return;

    try {
      const res = await fetch("http://localhost:3001/api/journal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content,
          createdAt: entryDate,
        }),
      });

      const newEntry = await res.json();

      setEntries([newEntry, ...entries]);
      setContent("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`http://localhost:3001/api/journal/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // remove from UI
      setEntries(entries.filter((e) => e._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const startEditing = (entry: any) => {
    setEditingId(entry._id);
    setEditContent(entry.content);
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/journal/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editContent }),
      });

      const updated = await res.json();

      setEntries(entries.map((e) => (e._id === id ? updated : e)));

      setEditingId(null);
      setEditContent("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 px-6 pb-6">
      {" "}
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Journal</h1>

        {/* Editor */}
        <div className="border rounded-xl p-4 bg-card">
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="mb-3 px-2 py-1 border rounded"
          />
          <textarea
            placeholder="Write your thoughts..."
            className="w-full h-32 bg-transparent outline-none resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <button
            onClick={handleSave}
            className="mt-3 px-4 py-2 bg-primary text-white rounded-lg"
          >
            Save Entry
          </button>
        </div>

        {/* Entries grouped by date */}
        <div className="space-y-6">
          {Object.entries(groupedEntries).map(([date, entriesForDate]: any) => (
            <div key={date}>
              {/* Date */}
              <h2 className="text-lg font-semibold text-muted-foreground mb-2">
                {new Date(date).toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h2>

              {/* Entries */}
              <div className="space-y-3">
                {entriesForDate.map((entry: any) => (
                  <div
                    key={entry._id}
                    className="border rounded-xl p-4 bg-card relative group"
                  >
                    {/* Action buttons */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                      {/* Edit */}
                      <button onClick={() => startEditing(entry)}>
                        <Pencil className="w-4 h-4 text-blue-400 hover:text-blue-600" />
                      </button>

                      {/* Delete */}
                      <button onClick={() => handleDelete(entry._id)}>
                        <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                      </button>
                    </div>

                    {/* Time */}
                    <p className="text-xs text-muted-foreground mb-2">
                      {new Date(entry.createdAt).toLocaleTimeString()}
                    </p>

                    {/* CONTENT */}
                    {editingId === entry._id ? (
                      <>
                        <textarea
                          className="w-full bg-transparent outline-none border rounded p-2 text-sm"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                        />

                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleUpdate(entry._id)}
                            className="px-3 py-1 bg-primary text-white rounded"
                          >
                            Save
                          </button>

                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 border rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm leading-relaxed">{entry.content}</p>
                    )}
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {entry.tags.map((tag: string, i: number) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
