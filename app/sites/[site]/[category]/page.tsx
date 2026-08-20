"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type FileRecord = {
  id: number;
  site: string;
  category: string;
  file_name: string;
  file_url: string;
  created_at: string;
};

const siteNames: Record<string, string> = {
  bgc: "BGC",
  cebu: "CEBU",
  iloilo: "ILOILO",
  inoza: "INOZA",
};

const categoryNames: Record<string, string> = {
  manual: "Manual",
  forms: "Forms",
  policy: "Policy",
  "floor-plans": "Floor Plans",
  "client-list": "Client List",
  tracker: "Tracker",
  "network-diagram": "Network Diagram",
  zabbix: "Zabbix",
};

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const siteParam = Array.isArray(params.site) ? params.site[0] : params.site;
  const categoryParam = Array.isArray(params.category)
    ? params.category[0]
    : params.category;

  const site = siteParam?.toLowerCase() || "";
  const category = categoryParam?.toLowerCase() || "";

  const siteName = siteNames[site] || site.toUpperCase();
  const categoryName =
    categoryNames[category] ||
    category
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  /* LOAD FILES */
  const loadFiles = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("files")
      .select("*")
      .eq("site", site)
      .eq("category", category)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load files:", error);
    } else if (data) {
      setFiles(data as FileRecord[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (site && category) {
      loadFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site, category]);

  /* GET STORAGE PATH FROM PUBLIC URL */
  const getStoragePath = (fileUrl: string) => {
    const marker = "/documents/";
    const index = fileUrl.indexOf(marker);
    if (index === -1) return null;
    return fileUrl.substring(index + marker.length);
  };

  /* UPLOAD HANDLER */
  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setUploading(true);

    for (const file of Array.from(fileList)) {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const storagePath = `${site}/${category}/${timestamp}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, file);

      if (uploadError) {
        console.error("Upload failed:", uploadError);
        alert(`Failed to upload "${file.name}": ${uploadError.message}`);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from("documents")
        .getPublicUrl(storagePath);

      const { error: insertError } = await supabase.from("files").insert({
        site,
        category,
        file_name: file.name,
        file_url: publicUrlData.publicUrl,
      });

      if (insertError) {
        console.error("Failed to save file record:", insertError);
        alert(`Uploaded "${file.name}" but failed to save it to the list.`);
      }
    }

    setUploading(false);
    loadFiles();
  };

  /* DRAG AND DROP */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  };

  /* DELETE FILE */
  const deleteFile = async (file: FileRecord) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${file.file_name}"?`
    );
    if (!confirmed) return;

    const storagePath = getStoragePath(file.file_url);

    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([storagePath]);

      if (storageError) {
        console.error("Failed to delete from storage:", storageError);
      }
    }

    const { error: dbError } = await supabase
      .from("files")
      .delete()
      .eq("id", file.id);

    if (dbError) {
      console.error("Failed to delete file record:", dbError);
      alert("Failed to delete this file. Please try again.");
      return;
    }

    setFiles((current) => current.filter((f) => f.id !== file.id));
  };

  /* RENAME FILE */
  const startRename = (file: FileRecord) => {
    setRenamingId(file.id);
    setRenameValue(file.file_name);
  };

  const saveRename = async (file: FileRecord) => {
    const trimmed = renameValue.trim();

    if (!trimmed) {
      alert("File name cannot be empty.");
      return;
    }

    const { error } = await supabase
      .from("files")
      .update({ file_name: trimmed })
      .eq("id", file.id);

    if (error) {
      console.error("Failed to rename file:", error);
      alert("Failed to rename this file. Please try again.");
      return;
    }

    setFiles((current) =>
      current.map((f) =>
        f.id === file.id ? { ...f, file_name: trimmed } : f
      )
    );

    setRenamingId(null);
    setRenameValue("");
  };

  const isPdf = (fileName: string) =>
    fileName.toLowerCase().endsWith(".pdf");

  return (
    <main className="min-h-screen overflow-hidden bg-[#071A33] text-white">
      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 -right-60 h-[650px] w-[650px] rounded-full bg-blue-600/25 blur-3xl" />
        <div className="absolute -bottom-60 -left-60 h-[650px] w-[650px] rounded-full bg-orange-500/20 blur-3xl" />
      </div>

      {/* HEADER */}
      <header className="relative z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
          <button
            onClick={() => router.push(`/sites/${site}`)}
            className="group flex items-center gap-3 text-sm font-semibold text-white transition hover:text-orange-400"
          >
            <span className="text-3xl font-light leading-none text-blue-400 transition group-hover:-translate-x-1">
              ‹
            </span>
            Back
          </button>

          <div className="hidden text-center sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-orange-400">
              {siteName}
            </p>
            <p className="mt-1 text-xs text-blue-200">IT Central Portal</p>
          </div>

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
      </header>

      {/* MAIN */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-16">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            {categoryName}
          </h1>
        </div>

        {/* UPLOAD ZONE */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mb-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all ${
            isDragging
              ? "border-orange-400 bg-orange-400/10"
              : "border-white/20 bg-white/[0.04] hover:border-blue-400/50 hover:bg-white/[0.06]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />

          <div className="mb-3 text-4xl">📤</div>

          <p className="text-sm font-semibold text-white">
            {uploading
              ? "Uploading..."
              : "Drag and drop files here, or click to browse"}
          </p>

          <p className="mt-1 text-xs text-blue-200">
            PDF and other file types supported
          </p>
        </div>

        {/* FILE LIST */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading files...
            </div>
          ) : files.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No files uploaded yet.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {files.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                    onClick={() => {
                      if (renamingId !== file.id) setPreviewFile(file);
                    }}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg">
                      {isPdf(file.file_name) ? "📕" : "📄"}
                    </span>

                    {renamingId === file.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveRename(file);
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-blue-500"
                      />
                    ) : (
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {file.file_name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {isEditMode ? (
                    <div className="flex shrink-0 gap-2">
                      {renamingId === file.id ? (
                        <>
                          <button
                            onClick={() => saveRename(file)}
                            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setRenamingId(null)}
                            className="rounded-md bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-300"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startRename(file)}
                            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => deleteFile(file)}
                            className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="shrink-0 text-sm font-medium text-blue-600">
                      View ›
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* PDF PREVIEW MODAL */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <p className="truncate text-sm font-semibold text-slate-900">
                {previewFile.file_name}
              </p>
              <button
                onClick={() => setPreviewFile(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600 transition hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <div className="flex-1 bg-slate-100">
              {isPdf(previewFile.file_name) ? (
                <iframe
                  src={previewFile.file_url}
                  className="h-full w-full"
                  title={previewFile.file_name}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                  <p className="text-sm text-slate-500">
                    Preview isn&apos;t available for this file type.
                  </p>
                  <a
                    href={previewFile.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    Open File
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
