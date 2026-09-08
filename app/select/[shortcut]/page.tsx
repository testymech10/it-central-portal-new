"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Shortcut = {
  id: number;
  name: string;
};

type ShortcutItem = {
  id: number;
  shortcut_id: number;
  name: string;
  description: string;
};

export default function ShortcutDetailPage() {
  const router = useRouter();
  const params = useParams();
  const shortcutSlug = String(params.shortcut);

  const [shortcut, setShortcut] = useState<Shortcut | null>(null);
  const [items, setItems] = useState<ShortcutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ShortcutItem | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");

  useEffect(() => {
    loadShortcutAndItems();
  }, [shortcutSlug]);

  async function loadShortcutAndItems() {
    setLoading(true);

    const { data: shortcuts, error: shortcutError } = await supabase
      .from("shortcuts")
      .select("*");

    if (shortcutError || !shortcuts) {
      console.error("Failed to load shortcut:", shortcutError);
      setLoading(false);
      return;
    }

    const matched = shortcuts.find(
      (s: Shortcut) => s.name.toLowerCase() === shortcutSlug.toLowerCase()
    );

    if (!matched) {
      console.error("No shortcut found for slug:", shortcutSlug);
      setLoading(false);
      return;
    }

    setShortcut(matched);

    const { data: itemsData, error: itemsError } = await supabase
      .from("shortcut_items")
      .select("*")
      .eq("shortcut_id", matched.id)
      .order("id", { ascending: true });

    if (itemsError) {
      console.error("Failed to load items:", itemsError);
    } else {
      setItems(itemsData || []);
    }

    setLoading(false);
  }

  function openAddModal() {
    setEditingItem(null);
    setItemName("");
    setItemDescription("");
    setShowModal(true);
  }

  function openEditModal(item: ShortcutItem) {
    setEditingItem(item);
    setItemName(item.name);
    setItemDescription(item.description);
    setShowModal(true);
  }

  async function saveItem() {
    if (!itemName.trim() || !shortcut) return;

    if (editingItem) {
      const { error } = await supabase
        .from("shortcut_items")
        .update({
          name: itemName.trim(),
          description: itemDescription.trim(),
        })
        .eq("id", editingItem.id);

      if (error) {
        console.error("Failed to update item:", error);
        alert("Failed to update. Please try again.");
        return;
      }
    } else {
      const { error } = await supabase.from("shortcut_items").insert({
        shortcut_id: shortcut.id,
        name: itemName.trim(),
        description: itemDescription.trim(),
      });

      if (error) {
        console.error("Failed to add item:", error);
        alert("Failed to add. Please try again.");
        return;
      }
    }

    setShowModal(false);
    setEditingItem(null);
    loadShortcutAndItems();
  }

  async function deleteItem(item: ShortcutItem) {
    const confirmed = window.confirm(`Delete "${item.name}"?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from("shortcut_items")
      .delete()
      .eq("id", item.id);

    if (error) {
      console.error("Failed to delete item:", error);
      alert("Failed to delete. Please try again.");
      return;
    }

    setItems((current) => current.filter((i) => i.id !== item.id));
  }

  return (
    <main className="min-h-screen bg-[#071A33] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-orange-500/15 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-white/10 bg-[#071A33]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 font-bold text-white shadow-lg shadow-orange-500/20">
              IT
            </div>
            <div>
              <h1 className="font-bold tracking-wide text-white">IT Central</h1>
              <p className="text-[11px] text-blue-200">Infrastructure Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/select")}
              className="group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-blue-100 transition hover:bg-white/10 hover:text-white"
            >
              <span className="transition-transform group-hover:-translate-x-1">←</span>
              Back
            </button>

            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`rounded-lg px-5 py-2 text-sm font-bold transition ${
                isEditMode
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "bg-white text-blue-700 hover:bg-blue-50"
              }`}
            >
              {isEditMode ? "Done" : "Edit"}
            </button>
          </div>
        </div>
      </header>

      <section className="relative z-10 flex min-h-[calc(100vh-81px)] items-center justify-center px-6 py-16">
        <div className="w-full max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              {shortcut ? shortcut.name : "Loading..."}
            </h2>
          </div>

          {isEditMode && (
            <div className="mx-auto mb-8 max-w-4xl rounded-xl border border-orange-400/30 bg-orange-500/10 px-5 py-3 text-center text-sm text-orange-200">
              Edit mode is enabled. You can edit or delete items.
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-sm text-blue-200">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-6 text-left backdrop-blur-sm transition-all duration-300 ${
                    isEditMode
                      ? "border-orange-400/60"
                      : "hover:-translate-y-1 hover:border-orange-400/50 hover:bg-white/[0.10]"
                  }`}
                >
                  <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-blue-500 to-orange-500 opacity-70 transition-opacity group-hover:opacity-100" />

                  {isEditMode && (
                    <div className="absolute right-3 top-3 flex gap-1">
                      <button
                        onClick={() => openEditModal(item)}
                        className="rounded-md bg-blue-600 px-2 py-1 text-xs font-bold text-white transition hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteItem(item)}
                        className="rounded-md bg-red-500 px-2 py-1 text-xs font-bold text-white transition hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  )}

                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600/20 text-2xl ring-1 ring-blue-400/20">
                    📄
                  </div>

                  <h3 className="text-xl font-bold tracking-wide text-white">
                    {item.name}
                  </h3>
                  <p className="mt-3 text-xs leading-5 text-blue-200/70">
                    {item.description}
                  </p>
                </div>
              ))}

              {!loading && items.length === 0 && (
                <p className="col-span-full text-center text-sm text-blue-200/60">
                  No items yet — click &quot;Add&quot; below to create one.
                </p>
              )}
            </div>
          )}

          <div className="mt-10 flex justify-center">
            <button
              onClick={openAddModal}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-900/30 transition-all hover:-translate-y-0.5 hover:bg-blue-500"
            >
              Add New Item
            </button>
          </div>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-7 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingItem ? "Edit Item" : "Add New Item"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600 transition hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Name
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Item name"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Description
              </label>
              <textarea
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="Description"
                rows={3}
                className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={saveItem}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                {editingItem ? "Save Changes" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}