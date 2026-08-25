"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Site = {
  id: number;
  name: string;
  location: string;
  description: string;
};

export default function SelectSitePage() {
  const router = useRouter();

  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  const [siteName, setSiteName] = useState("");
  const [siteLocation, setSiteLocation] = useState("");
  const [siteDescription, setSiteDescription] = useState("");

  /* LOAD SITES */
  const loadSites = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("sites")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Failed to load sites:", error);
    } else if (data) {
      setSites(data as Site[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadSites();
  }, []);

  /* OPEN ADD MODAL */
  const openAddModal = () => {
    setEditingSite(null);
    setSiteName("");
    setSiteLocation("");
    setSiteDescription("");
    setShowModal(true);
  };

  /* OPEN EDIT MODAL */
  const openEditModal = (site: Site) => {
    setEditingSite(site);
    setSiteName(site.name);
    setSiteLocation(site.location);
    setSiteDescription(site.description);
    setShowModal(true);
  };

  /* SAVE SITE (ADD OR EDIT) */
  const saveSite = async () => {
    if (!siteName.trim()) {
      alert("Please enter a site name.");
      return;
    }

    if (!siteLocation.trim()) {
      alert("Please enter a location.");
      return;
    }

    if (editingSite) {
      const { error } = await supabase
        .from("sites")
        .update({
          name: siteName.trim().toUpperCase(),
          location: siteLocation.trim(),
          description: siteDescription.trim(),
        })
        .eq("id", editingSite.id);

      if (error) {
        console.error("Failed to update site:", error);
        alert("Failed to update this site. Please try again.");
        return;
      }
    } else {
      const { error } = await supabase.from("sites").insert({
        name: siteName.trim().toUpperCase(),
        location: siteLocation.trim(),
        description: siteDescription.trim(),
      });

      if (error) {
        console.error("Failed to add site:", error);
        alert("Failed to add this site. Please try again.");
        return;
      }
    }

    setShowModal(false);
    setEditingSite(null);
    loadSites();
  };

  /* DELETE SITE */
  const deleteSite = async (site: Site) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${site.name}"? This will not delete its uploaded files.`
    );

    if (!confirmed) return;

    const { error } = await supabase.from("sites").delete().eq("id", site.id);

    if (error) {
      console.error("Failed to delete site:", error);
      alert("Failed to delete this site. Please try again.");
      return;
    }

    setSites((current) => current.filter((s) => s.id !== site.id));
  };

  return (
    <main className="min-h-screen bg-[#071A33] text-white">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-orange-500/15 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-[#071A33]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          {/* Logo */}
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
            {/* Back button */}
            <button
              onClick={() => router.push("/")}
              className="group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-blue-100 transition hover:bg-white/10 hover:text-white"
            >
              <span className="transition-transform group-hover:-translate-x-1">
                ←
              </span>
              Back
            </button>

            {/* Edit toggle */}
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

      {/* Main content */}
      <section className="relative z-10 flex min-h-[calc(100vh-81px)] items-center justify-center px-6 py-16">
        <div className="w-full max-w-6xl">
          {/* Heading */}
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-orange-400">
              SR-Centralized Infrastructure Portal
            </p>
            <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              Please Select Site
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-blue-200 md:text-base">
              Choose what site you wanted to access. Each site has its own
              set of resources and information.
            </p>
          </div>

          {isEditMode && (
            <div className="mx-auto mb-8 max-w-4xl rounded-xl border border-orange-400/30 bg-orange-500/10 px-5 py-3 text-center text-sm text-orange-200">
              Edit mode is enabled. You can edit or delete sites.
            </div>
          )}

          {/* Site Cards */}
          {loading ? (
            <div className="py-16 text-center text-sm text-blue-200">
              Loading sites...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {sites.map((site) => {
                const route = site.name.toLowerCase();

                return (
                  <div
                    key={site.id}
                    onClick={() => {
                      if (!isEditMode) router.push(`/sites/${route}`);
                    }}
                    className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-6 text-left backdrop-blur-sm transition-all duration-300 ${
                      isEditMode
                        ? "border-orange-400/60"
                        : "cursor-pointer hover:-translate-y-1 hover:border-orange-400/50 hover:bg-white/[0.10] hover:shadow-2xl hover:shadow-blue-950/40"
                    }`}
                  >
                    {/* Orange accent */}
                    <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-blue-500 to-orange-500 opacity-70 transition-opacity group-hover:opacity-100" />

                    {/* Edit controls */}
                    {isEditMode && (
                      <div className="absolute right-3 top-3 flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(site);
                          }}
                          className="rounded-md bg-blue-600 px-2 py-1 text-xs font-bold text-white transition hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSite(site);
                          }}
                          className="rounded-md bg-red-500 px-2 py-1 text-xs font-bold text-white transition hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    )}

                    {/* Icon */}
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600/20 text-2xl ring-1 ring-blue-400/20 transition-all duration-300 group-hover:bg-orange-500 group-hover:ring-orange-400/40">
                      🏢
                    </div>

                    {/* Site name */}
                    <h3 className="text-xl font-bold tracking-wide text-white">
                      {site.name}
                    </h3>

                    {/* Location */}
                    <p className="mt-2 text-sm font-medium text-orange-400">
                      {site.location}
                    </p>

                    <p className="mt-3 text-xs leading-5 text-blue-200/70">
                      {site.description}
                    </p>

                    {/* Enter */}
                    {!isEditMode && (
                      <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-blue-300 transition-colors group-hover:text-orange-400">
                        Access Site
                        <span className="transition-transform duration-300 group-hover:translate-x-1">
                          →
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {}
          <div className="mt-10 flex justify-center">
            <button
              onClick={openAddModal}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-900/30 transition-all hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-900/50"
            >
               Add New Site
            </button>
          </div>

          {}
          <div className="mt-12 flex items-center justify-center gap-3">
            <div className="h-2 w-2 rounded-full bg-orange-400" />
            <p className="text-xs text-blue-300">
               SALESRAIN IT SUPPORT
            </p>
          </div>
        </div>
      </section>

      {}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-7 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">
                  Site
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {editingSite ? "Edit Site" : "Add New Site"}
                </h2>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600 transition hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Site Name
              </label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Example: DAVAO"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-xs text-slate-400">
                This becomes part of the site&apos;s URL, so keep it short.
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Location
              </label>
              <input
                type="text"
                value={siteLocation}
                onChange={(e) => setSiteLocation(e.target.value)}
                placeholder="Example: Davao City"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Description
              </label>
              <textarea
                value={siteDescription}
                onChange={(e) => setSiteDescription(e.target.value)}
                placeholder="Example: Davao Site"
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
                onClick={saveSite}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                {editingSite ? "Save Changes" : "Add Site"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
