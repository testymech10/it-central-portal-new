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

type SheetRecord = {
  id: number;
  site: string;
  category: string;
  name: string;
  data: string[][];
  created_at: string;
};

type Entry =
  | { type: "file"; created_at: string; record: FileRecord }
  | { type: "sheet"; created_at: string; record: SheetRecord };

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

const DEFAULT_SHEET_ROWS = 6;
const DEFAULT_SHEET_COLS = 4;

function createEmptyGrid(rows: number, cols: number): string[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => "")
  );
}

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
  const [sheets, setSheets] = useState<SheetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [activeSheet, setActiveSheet] = useState<SheetRecord | null>(null);

  /* LOAD FILES + SHEETS */
  const loadAll = async () => {
    setLoading(true);

    const [filesResult, sheetsResult] = await Promise.all([
      supabase
        .from("files")
        .select("*")
        .eq("site", site)
        .eq("category", category)
        .order("created_at", { ascending: false }),
      supabase
        .from("sheets")
        .select("*")
        .eq("site", site)
        .eq("category", category)
        .order("created_at", { ascending: false }),
    ]);

    if (filesResult.error) {
      console.error("Failed to load files:", filesResult.error);
    } else if (filesResult.data) {
      setFiles(filesResult.data as FileRecord[]);
    }

    if (sheetsResult.error) {
      console.error("Failed to load sheets:", sheetsResult.error);
    } else if (sheetsResult.data) {
      setSheets(sheetsResult.data as SheetRecord[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (site && category) {
      loadAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site, category]);

  const getStoragePath = (fileUrl: string) => {
    const marker = "/documents/";
    const index = fileUrl.indexOf(marker);
    if (index === -1) return null;
    return fileUrl.substring(index + marker.length);
  };

  /* UPLOAD FILE */
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
    loadAll();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  };

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

  const startRenameFile = (file: FileRecord) => {
    setRenamingId(`file-${file.id}`);
    setRenameValue(file.file_name);
  };

  const saveRenameFile = async (file: FileRecord) => {
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
      current.map((f) => (f.id === file.id ? { ...f, file_name: trimmed } : f))
    );

    setRenamingId(null);
    setRenameValue("");
  };

  /* SHEETS */
  const createSheet = async () => {
    const name = window.prompt("Name this spreadsheet:", "Untitled Sheet");
    if (!name || !name.trim()) return;

    const { data, error } = await supabase
      .from("sheets")
      .insert({
        site,
        category,
        name: name.trim(),
        data: createEmptyGrid(DEFAULT_SHEET_ROWS, DEFAULT_SHEET_COLS),
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create sheet:", error);
      alert("Failed to create spreadsheet. Please try again.");
      return;
    }

    await loadAll();
    if (data) setActiveSheet(data as SheetRecord);
  };

  const deleteSheet = async (sheet: SheetRecord) => {
    const confirmed = window.confirm(`Delete "${sheet.name}"?`);
    if (!confirmed) return;

    const { error } = await supabase.from("sheets").delete().eq("id", sheet.id);

    if (error) {
      console.error("Failed to delete sheet:", error);
      alert("Failed to delete this spreadsheet. Please try again.");
      return;
    }

    setSheets((current) => current.filter((s) => s.id !== sheet.id));
  };

  const startRenameSheet = (sheet: SheetRecord) => {
    setRenamingId(`sheet-${sheet.id}`);
    setRenameValue(sheet.name);
  };

  const saveRenameSheet = async (sheet: SheetRecord) => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      alert("Sheet name cannot be empty.");
      return;
    }

    const { error } = await supabase
      .from("sheets")
      .update({ name: trimmed })
      .eq("id", sheet.id);

    if (error) {
      console.error("Failed to rename sheet:", error);
      alert("Failed to rename this spreadsheet. Please try again.");
      return;
    }

    setSheets((current) =>
      current.map((s) => (s.id === sheet.id ? { ...s, name: trimmed } : s))
    );

    setRenamingId(null);
    setRenameValue("");
  };

  const isPdf = (fileName: string) => fileName.toLowerCase().endsWith(".pdf");
  const isImage = (fileName: string) =>
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);

  /* COMBINE FILES + SHEETS INTO ONE SORTED LIST */
  const entries: Entry[] = [
    ...files.map((f) => ({
      type: "file" as const,
      created_at: f.created_at,
      record: f,
    })),
    ...sheets.map((s) => ({
      type: "sheet" as const,
      created_at: s.created_at,
      record: s,
    })),
  ].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

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

        {/* ADD OPTIONS */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* UPLOAD ZONE */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all ${
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

          {/* NEW SPREADSHEET */}
          <div
            onClick={createSheet}
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/20 bg-white/[0.04] px-6 py-10 text-center transition-all hover:border-blue-400/50 hover:bg-white/[0.06]"
          >
            <div className="mb-3 text-4xl">📊</div>

            <p className="text-sm font-semibold text-white">
              Create a new spreadsheet
            </p>

            <p className="mt-1 text-xs text-blue-200">
              Add and edit rows and columns, like a simple sheet
            </p>
          </div>
        </div>

        {/* ENTRY LIST */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading...
            </div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Nothing here yet.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {entries.map((entry) => {
                if (entry.type === "file") {
                  const file = entry.record;
                  const key = `file-${file.id}`;

                  return (
                    <li
                      key={key}
                      className="flex items-center justify-between gap-4 px-5 py-4"
                    >
                      <div
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                        onClick={() => {
                          if (renamingId !== key) setPreviewFile(file);
                        }}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg">
                          {isPdf(file.file_name) ? "📕" : "📄"}
                        </span>

                        {renamingId === key ? (
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveRenameFile(file);
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
                          {renamingId === key ? (
                            <>
                              <button
                                onClick={() => saveRenameFile(file)}
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
                                onClick={() => startRenameFile(file)}
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
                  );
                }

                const sheet = entry.record;
                const key = `sheet-${sheet.id}`;

                return (
                  <li
                    key={key}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                      onClick={() => {
                        if (renamingId !== key) setActiveSheet(sheet);
                      }}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-lg">
                        📊
                      </span>

                      {renamingId === key ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveRenameSheet(sheet);
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-blue-500"
                        />
                      ) : (
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {sheet.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            Spreadsheet ·{" "}
                            {new Date(sheet.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {isEditMode ? (
                      <div className="flex shrink-0 gap-2">
                        {renamingId === key ? (
                          <>
                            <button
                              onClick={() => saveRenameSheet(sheet)}
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
                              onClick={() => startRenameSheet(sheet)}
                              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700"
                            >
                              Rename
                            </button>
                            <button
                              onClick={() => deleteSheet(sheet)}
                              className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="shrink-0 text-sm font-medium text-blue-600">
                        Open ›
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* PDF / FILE PREVIEW MODAL */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="flex h-[85vh] min-h-0 w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
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

            <div className="min-h-0 flex-1 overflow-auto bg-slate-100">
              {isPdf(previewFile.file_name) ? (
                <iframe
                  src={previewFile.file_url}
                  className="h-full w-full"
                  title={previewFile.file_name}
                />
              ) : isImage(previewFile.file_name) ? (
                <div className="flex min-h-full w-max min-w-full items-start justify-center p-6">
                  <img
                    src={previewFile.file_url}
                    alt={previewFile.file_name}
                    className="block max-w-none rounded-lg shadow-lg"
                  />
                </div>
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

      {/* SPREADSHEET EDITOR MODAL */}
      {activeSheet && (
        <SheetEditorModal
          sheet={activeSheet}
          onClose={() => {
            setActiveSheet(null);
            loadAll();
          }}
        />
      )}
    </main>
  );
}

/* ---------- SPREADSHEET EDITOR ---------- */

function SheetEditorModal({
  sheet,
  onClose,
}: {
  sheet: SheetRecord;
  onClose: () => void;
}) {
  const [grid, setGrid] = useState<string[][]>(
    sheet.data && sheet.data.length > 0
      ? sheet.data
      : createEmptyGrid(DEFAULT_SHEET_ROWS, DEFAULT_SHEET_COLS)
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSaveStatus("saving");

    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(async () => {
      const { error } = await supabase
        .from("sheets")
        .update({ data: grid })
        .eq("id", sheet.id);

      if (error) {
        console.error("Failed to save sheet:", error);
        setSaveStatus("idle");
        return;
      }

      setSaveStatus("saved");
    }, 800);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid]);

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    setGrid((current) =>
      current.map((row, r) =>
        r === rowIndex
          ? row.map((cell, c) => (c === colIndex ? value : cell))
          : row
      )
    );
  };

  const addRow = () => {
    setGrid((current) => [
      ...current,
      Array.from({ length: current[0]?.length || DEFAULT_SHEET_COLS }, () => ""),
    ]);
  };

  const addColumn = () => {
    setGrid((current) => current.map((row) => [...row, ""]));
  };

  const deleteRow = (rowIndex: number) => {
    if (grid.length <= 1) return;
    setGrid((current) => current.filter((_, r) => r !== rowIndex));
  };

  const deleteColumn = (colIndex: number) => {
    if ((grid[0]?.length || 0) <= 1) return;
    setGrid((current) => current.map((row) => row.filter((_, c) => c !== colIndex)));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {sheet.name}
            </p>
            <p className="text-xs text-slate-400">
              {saveStatus === "saving"
                ? "Saving..."
                : saveStatus === "saved"
                ? "All changes saved"
                : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600 transition hover:bg-slate-200"
          >
            ×
          </button>
        </div>

        <div className="flex gap-2 border-b border-slate-100 px-5 py-3">
          <button
            onClick={addRow}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700"
          >
            + Row
          </button>
          <button
            onClick={addColumn}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700"
          >
            + Column
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-slate-50 p-5">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {grid.map((row, rowIndex) => (
                <tr key={rowIndex} className="group/row">
                  {row.map((cell, colIndex) => (
                    <td
                      key={colIndex}
                      className={`min-w-[140px] border border-slate-200 bg-white p-0 ${
                        rowIndex === 0 ? "bg-slate-50" : ""
                      }`}
                    >
                      <input
                        value={cell}
                        onChange={(e) =>
                          updateCell(rowIndex, colIndex, e.target.value)
                        }
                        className={`w-full bg-transparent px-3 py-2 outline-none focus:bg-blue-50 ${
                          rowIndex === 0
                            ? "font-semibold text-slate-900"
                            : "text-slate-700"
                        }`}
                        placeholder={rowIndex === 0 ? "Header" : ""}
                      />
                    </td>
                  ))}
                  <td className="w-10 border border-slate-200 bg-white p-0 text-center">
                    <button
                      onClick={() => deleteRow(rowIndex)}
                      className="px-2 py-2 text-xs text-red-400 opacity-0 transition hover:text-red-600 group-hover/row:opacity-100"
                      title="Delete row"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                {grid[0]?.map((_, colIndex) => (
                  <td
                    key={colIndex}
                    className="border border-slate-200 bg-white p-0 text-center"
                  >
                    <button
                      onClick={() => deleteColumn(colIndex)}
                      className="w-full px-2 py-1 text-xs text-red-300 transition hover:text-red-600"
                      title="Delete column"
                    >
                      ×
                    </button>
                  </td>
                ))}
                <td className="border border-slate-200 bg-white" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
