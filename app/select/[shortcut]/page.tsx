
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
  file_url: string | null;
  file_name: string | null;
};

export default function ShortcutDetailPage() {
  const router = useRouter();
  const params = useParams();
  const shortcutSlug = String(params.shortcut);

  const [shortcut, setShortcut] = useState<Shortcut | null>(null);
  const [items, setItems] = useState<ShortcutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ShortcutItem | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [previewItem, setPreviewItem] = useState<ShortcutItem | null>(null);

  useEffect(() => {
    loadShortcutAndItems();

    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      (s: Shortcut) =>
        s.name.toLowerCase() === shortcutSlug.toLowerCase()
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
    setSelectedFile(null);
    setShowModal(true);
  }

  function openEditModal(item: ShortcutItem) {
    setEditingItem(item);
    setItemName(item.name);
    setItemDescription(item.description);
    setSelectedFile(null);
    setShowModal(true);
  }

  async function saveItem() {
    if (!itemName.trim() || !shortcut) return;

    setUploading(true);

    let fileUrl = editingItem?.file_url || null;
    let fileName = editingItem?.file_name || null;

    if (selectedFile) {
      const timestamp = Date.now();
      const safeName = selectedFile.name.replace(
        /[^a-zA-Z0-9.\-_]/g,
        "_"
      );

      const storagePath = `shortcuts/${shortcut.id}/${timestamp}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, selectedFile);

      if (uploadError) {
        console.error("Upload failed:", uploadError);

        alert(
          `Failed to upload "${selectedFile.name}": ${uploadError.message}`
        );

        setUploading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("documents")
        .getPublicUrl(storagePath);

      fileUrl = publicUrlData.publicUrl;
      fileName = selectedFile.name;
    }

    if (editingItem) {
      const { error } = await supabase
        .from("shortcut_items")
        .update({
          name: itemName.trim(),
          description: itemDescription.trim(),
          file_url: fileUrl,
          file_name: fileName,
        })
        .eq("id", editingItem.id);

      if (error) {
        console.error("Failed to update item:", error);
        alert("Failed to update. Please try again.");
        setUploading(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("shortcut_items")
        .insert({
          shortcut_id: shortcut.id,
          name: itemName.trim(),
          description: itemDescription.trim(),
          file_url: fileUrl,
          file_name: fileName,
        });

      if (error) {
        console.error("Failed to add item:", error);
        alert("Failed to add. Please try again.");
        setUploading(false);
        return;
      }
    }

    setUploading(false);
    setShowModal(false);
    setEditingItem(null);
    setSelectedFile(null);

    loadShortcutAndItems();
  }

  async function deleteItem(item: ShortcutItem) {
    const confirmed = window.confirm(`Delete "${item.name}"?`);

    if (!confirmed) return;

    if (item.file_url) {
      const marker = "/documents/";
      const index = item.file_url.indexOf(marker);

      if (index !== -1) {
        const storagePath = item.file_url.substring(
          index + marker.length
        );

        await supabase.storage
          .from("documents")
          .remove([storagePath]);
      }
    }

    const { error } = await supabase
      .from("shortcut_items")
      .delete()
      .eq("id", item.id);

    if (error) {
      console.error("Failed to delete item:", error);
      alert("Failed to delete. Please try again.");
      return;
    }

    setItems((current) =>
      current.filter((i) => i.id !== item.id)
    );
  }

  function handleCardClick(item: ShortcutItem) {
    if (isEditMode) return;

    if (!item.file_url) {
      alert("No file attached to this item yet.");
      return;
    }

    setPreviewItem(item);
  }

  /* ================================
     FILE TYPE HELPERS
  ================================= */

  function isPdf(fileName: string | null) {
    return !!fileName && /\.pdf$/i.test(fileName);
  }

  function isImage(fileName: string | null) {
    return (
      !!fileName &&
      /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileName)
    );
  }

  function isVideo(fileName: string | null) {
    return (
      !!fileName &&
      /\.(mp4|webm|ogg|mov)$/i.test(fileName)
    );
  }

  function isAudio(fileName: string | null) {
    return (
      !!fileName &&
      /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(fileName)
    );
  }

  function isText(fileName: string | null) {
    return (
      !!fileName &&
      /\.(txt|csv|json|xml|log|md)$/i.test(fileName)
    );
  }

  function getFileIcon(fileName: string | null) {
    if (!fileName) return "📄";

    if (isPdf(fileName)) return "📕";

    if (isImage(fileName)) return "🖼️";

    if (isVideo(fileName)) return "🎥";

    if (isAudio(fileName)) return "🎵";

    if (isText(fileName)) return "📝";

    if (
      /\.(doc|docx)$/i.test(fileName)
    ) {
      return "📘";
    }

    if (
      /\.(xls|xlsx)$/i.test(fileName)
    ) {
      return "📊";
    }

    if (
      /\.(ppt|pptx)$/i.test(fileName)
    ) {
      return "📙";
    }

    if (
      /\.(zip|rar|7z)$/i.test(fileName)
    ) {
      return "🗜️";
    }

    return "📄";
  }

  return (
    <main className="min-h-screen bg-[#071A33] text-white">

      {/* BACKGROUND EFFECTS */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-3xl" />

        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-orange-500/15 blur-3xl" />
      </div>

      {/* HEADER */}
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

          <div className="flex items-center gap-3">

            <button
              onClick={() => router.push("/select")}
              className="group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-blue-100 transition hover:bg-white/10 hover:text-white"
            >
              <span className="transition-transform group-hover:-translate-x-1">
                ←
              </span>

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

      {/* MAIN CONTENT */}
      <section className="relative z-10 flex min-h-[calc(100vh-81px)] items-center justify-center px-6 py-16">

        <div className="w-full max-w-6xl">

          {/* TITLE */}
          <div className="mb-12 text-center">

            <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              {shortcut ? shortcut.name : "Loading..."}
            </h2>

          </div>

          {/* EDIT MODE MESSAGE */}
          {isEditMode && (
            <div className="mx-auto mb-8 max-w-4xl rounded-xl border border-orange-400/30 bg-orange-500/10 px-5 py-3 text-center text-sm text-orange-200">
              Edit mode is enabled. You can edit or delete items.
            </div>
          )}

          {/* ITEMS */}
          {loading ? (
            <div className="py-16 text-center text-sm text-blue-200">
              Loading...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

              {items.map((item) => (

                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-6 text-left backdrop-blur-sm transition-all duration-300 ${
                    isEditMode
                      ? "border-orange-400/60"
                      : "cursor-pointer hover:-translate-y-1 hover:border-orange-400/50 hover:bg-white/[0.10]"
                  }`}
                >

                  {/* TOP LINE */}
                  <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-blue-500 to-orange-500 opacity-70 transition-opacity group-hover:opacity-100" />

                  {/* EDIT / DELETE BUTTONS */}
                  {isEditMode && (
                    <div className="absolute right-3 top-3 flex gap-1">

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(item);
                        }}
                        className="rounded-md bg-blue-600 px-2 py-1 text-xs font-bold text-white transition hover:bg-blue-700"
                      >
                        Edit
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItem(item);
                        }}
                        className="rounded-md bg-red-500 px-2 py-1 text-xs font-bold text-white transition hover:bg-red-600"
                      >
                        Delete
                      </button>

                    </div>
                  )}

                  {/* FILE ICON */}
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600/20 text-2xl ring-1 ring-blue-400/20">
                    {item.file_url
                      ? getFileIcon(item.file_name)
                      : "📄"}
                  </div>

                  {/* NAME */}
                  <h3 className="text-xl font-bold tracking-wide text-white">
                    {item.name}
                  </h3>

                  {/* DESCRIPTION */}
                  <p className="mt-3 text-xs leading-5 text-blue-200/70">
                    {item.description}
                  </p>

                  {/* FILE STATUS */}
                  {!isEditMode && (
                    <p className="mt-4 text-xs font-semibold text-blue-300">
                      {item.file_url
                        ? "Click to view file ›"
                        : "No file attached"}
                    </p>
                  )}

                </div>

              ))}

              {/* EMPTY STATE */}
              {!loading && items.length === 0 && (
                <p className="col-span-full text-center text-sm text-blue-200/60">
                  No items yet — click &quot;Add&quot; below to create one.
                </p>
              )}

            </div>
          )}

          {/* ADD BUTTON */}
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

      {/* ================================
          ADD / EDIT MODAL
      ================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-7 shadow-2xl">

            {/* MODAL HEADER */}
            <div className="mb-6 flex items-center justify-between">

              <h2 className="text-2xl font-bold text-slate-900">
                {editingItem
                  ? "Edit Item"
                  : "Add New Item"}
              </h2>

              <button
                onClick={() => setShowModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600 transition hover:bg-slate-200"
              >
                ×
              </button>

            </div>

            {/* NAME */}
            <div className="mb-4">

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Name
              </label>

              <input
                type="text"
                value={itemName}
                onChange={(e) =>
                  setItemName(e.target.value)
                }
                placeholder="Item name"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            {/* DESCRIPTION */}
            <div className="mb-4">

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Description
              </label>

              <textarea
                value={itemDescription}
                onChange={(e) =>
                  setItemDescription(e.target.value)
                }
                placeholder="Description"
                rows={3}
                className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            {/* FILE */}
            <div className="mb-6">

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                File{" "}
                {editingItem?.file_name
                  ? "(optional — replaces current file)"
                  : ""}
              </label>

              {editingItem?.file_name &&
                !selectedFile && (
                  <p className="mb-2 text-xs text-slate-500">
                    Current file:{" "}
                    {editingItem.file_name}
                  </p>
                )}

              <input
                type="file"
                onChange={(e) =>
                  setSelectedFile(
                    e.target.files?.[0] || null
                  )
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              {selectedFile && (
                <p className="mt-2 text-xs text-blue-600">
                  Selected: {selectedFile.name}
                </p>
              )}

            </div>

            {/* BUTTONS */}
            <div className="flex gap-3">

              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                onClick={saveItem}
                disabled={uploading}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {uploading
                  ? "Saving..."
                  : editingItem
                  ? "Save Changes"
                  : "Add Item"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ================================
          FILE PREVIEW MODAL
      ================================= */}
      {previewItem && previewItem.file_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setPreviewItem(null)}
        >

          <div
            className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* PREVIEW HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">

              <p className="truncate pr-4 text-sm font-semibold text-slate-900">
                {previewItem.file_name}
              </p>

              <div className="flex items-center gap-2">

                {/* OPEN FILE */}
                <a
                  href={previewItem.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                >
                  Open File
                </a>

                {/* CLOSE */}
                <button
                  onClick={() =>
                    setPreviewItem(null)
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600 transition hover:bg-slate-200"
                >
                  ×
                </button>

              </div>

            </div>

            {/* PREVIEW CONTENT */}
            <div className="flex-1 overflow-auto bg-slate-100">

              {/* =========================
                  PDF
              ========================== */}
              {isPdf(previewItem.file_name) ? (

                <iframe
                  src={previewItem.file_url}
                  className="h-full w-full"
                  title={
                    previewItem.file_name ||
                    "PDF preview"
                  }
                />

              ) : /* =========================
                   IMAGE
              ========================== */
              isImage(previewItem.file_name) ? (

                <div className="flex h-full w-full items-center justify-center overflow-auto p-6">

                  <img
                    src={previewItem.file_url}
                    alt={
                      previewItem.file_name ||
                      "Image preview"
                    }
                    className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
                  />

                </div>

              ) : /* =========================
                   VIDEO
              ========================== */
              isVideo(previewItem.file_name) ? (

                <div className="flex h-full w-full items-center justify-center p-6">

                  <video
                    src={previewItem.file_url}
                    controls
                    className="max-h-full max-w-full rounded-lg shadow-lg"
                  >
                    Your browser does not support video playback.
                  </video>

                </div>

              ) : /* =========================
                   AUDIO
              ========================== */
              isAudio(previewItem.file_name) ? (

                <div className="flex h-full w-full items-center justify-center">

                  <div className="w-full max-w-xl rounded-2xl bg-white p-8 text-center shadow-lg">

                    <div className="mb-6 text-6xl">
                      🎵
                    </div>

                    <h3 className="mb-6 text-lg font-bold text-slate-900">
                      {previewItem.file_name}
                    </h3>

                    <audio
                      src={previewItem.file_url}
                      controls
                      className="w-full"
                    >
                      Your browser does not support audio playback.
                    </audio>

                  </div>

                </div>

              ) : /* =========================
                   TEXT
              ========================== */
              isText(previewItem.file_name) ? (

                <iframe
                  src={previewItem.file_url}
                  className="h-full w-full bg-white"
                  title={
                    previewItem.file_name ||
                    "Text preview"
                  }
                />

              ) : /* =========================
                   UNSUPPORTED FILE
              ========================== */
              (

                <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">

                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-4xl">
                    {getFileIcon(
                      previewItem.file_name
                    )}
                  </div>

                  <div>

                    <h3 className="text-lg font-bold text-slate-900">
                      Preview not available
                    </h3>

                    <p className="mt-2 max-w-md text-sm text-slate-500">
                      Your browser cannot preview
                      this file type directly.
                      You can open the file using
                      the button above.
                    </p>

                  </div>

                  <a
                    href={previewItem.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    Open{" "}
                    {previewItem.file_name ||
                      "File"}
                  </a>

                </div>

              )}

            </div>

          </div>

        </div>
      )}

    </main>
  );
}