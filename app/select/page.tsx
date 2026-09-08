"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Shortcut = {
  id: string;
  name: string;
  created_at?: string;
};

export default function SelectPage() {
  const router = useRouter();

  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [loading, setLoading] = useState(true);

  // modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    fetchShortcuts();
  }, []);

 async function fetchShortcuts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("shortcuts")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching shortcuts:", error.message, error.details, error.hint, error.code);
    } else {
      setShortcuts(data || []);
    }
    setLoading(false);
  }

  function openAddModal() {
    setEditingShortcut(null);
    setNameInput("");
    setIsModalOpen(true);
  }

  function openEditModal(shortcut: Shortcut) {
    setEditingShortcut(shortcut);
    setNameInput(shortcut.name);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingShortcut(null);
    setNameInput("");
  }

  async function handleSave() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;

    if (editingShortcut) {
      // Edit existing
      const { error } = await supabase
        .from("shortcuts")
        .update({ name: trimmed })
        .eq("id", editingShortcut.id);

      if (error) {
        console.error("Error updating shortcut:", error);
        return;
      }
    } else {
      // Add new
      const { error } = await supabase
        .from("shortcuts")
        .insert({ name: trimmed });

      if (error) {
        console.error("Error adding shortcut:", error);
        return;
      }
    }

    closeModal();
    fetchShortcuts();
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this shortcut?");
    if (!confirmed) return;

    const { error } = await supabase.from("shortcuts").delete().eq("id", id);
    if (error) {
      console.error("Error deleting shortcut:", error);
      return;
    }
    fetchShortcuts();
  }

  return (
    <main className="min-h-screen bg-[#071A33] text-white">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-orange-500/15 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-[#071A33]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 font-bold text-white shadow-lg shadow-orange-500/20">
              IT
            </div>
            <div>
              <h1 className="font-bold tracking-wide text-white">
                IT Central
              </h1>
              <p className="text-[11px] text-blue-200">
                Infrastructure Portal
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/")}
            className="group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-blue-100 transition hover:bg-white/10 hover:text-white"
          >
            <span className="transition-transform group-hover:-translate-x-1">
              ←
            </span>
            Back
          </button>
        </div>
      </header>

      {/* Main content */}
      <section className="relative z-10 flex min-h-[calc(100vh-81px)] items-center justify-center px-6 py-16">
        <div className="w-full max-w-3xl text-center">
          <div className="mb-10 flex items-center justify-center gap-4">
            <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              Please Select
            </h2>
            <button
              onClick={openAddModal}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-xl font-bold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-400"
              title="Add shortcut"
            >
              +
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {/* Fixed, functional button */}
            <button
              onClick={() => router.push("/sites")}
              className="rounded-lg bg-blue-600 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-blue-900/30 transition-all hover:-translate-y-0.5 hover:bg-blue-500"
            >
              All Sites
            </button>

            {/* Dynamic shortcuts */}
            {shortcuts.map((shortcut) => (
              <div key={shortcut.id} className="group relative">
              <button onClick={() =>
    router.push(`/select/${shortcut.name.toLowerCase()}`)
  }
  className="w-full rounded-lg bg-white/10 px-4 py-4 text-sm font-bold text-blue-100 transition-all hover:-translate-y-0.5 hover:bg-white/20"
>
  {shortcut.name}
</button>

                {/* Edit / Delete controls */}
                <div className="absolute -top-2 -right-2 hidden gap-1 group-hover:flex">
                  <button
                    onClick={() => openEditModal(shortcut)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white shadow hover:bg-blue-500"
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDelete(shortcut.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white shadow hover:bg-red-500"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}

            {!loading && shortcuts.length === 0 && (
              <p className="col-span-2 text-sm text-blue-200/60 sm:col-span-4">
                No shortcuts yet — click + to add one.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-[#0C2340] p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-white">
              {editingShortcut ? "Edit Shortcut" : "Add Shortcut"}
            </h3>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Shortcut name"
              autoFocus
              className="mb-4 w-full rounded-lg bg-white/10 px-4 py-2 text-sm text-white placeholder-blue-200/50 outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="rounded-lg px-4 py-2 text-sm font-medium text-blue-100 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-400"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}