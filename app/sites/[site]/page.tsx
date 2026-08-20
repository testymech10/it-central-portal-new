"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Category = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

const defaultCategories: Category[] = [
  {
    id: "manual",
    name: "Manual",
    description: "Guides and technical manuals",
    icon: "📖",
  },
  {
    id: "forms",
    name: "Forms",
    description: "Request forms, templates, and documents",
    icon: "📋",
  },
  {
    id: "policy",
    name: "Policy",
    description: "Company policies and compliance documents",
    icon: "👤",
  },
  {
    id: "floor-plans",
    name: "Floor Plans",
    description: "Office layouts and equipment mapping",
    icon: "🗺️",
  },
  {
    id: "client-list",
    name: "Client List",
    description: "Directory of clients and contact information",
    icon: "☷",
  },
  {
    id: "tracker",
    name: "Tracker",
    description: "Client requests tracker",
    icon: "◎",
  },
  {
    id: "network-diagram",
    name: "Network Diagram",
    description: "Network topology and infrastructure maps",
    icon: "🔗",
  },
  {
    id: "zabbix",
    name: "Zabbix",
    description: "Monitoring, alerts, and system status",
    icon: "▦",
  },
];

const siteNames: Record<string, string> = {
  bgc: "BGC",
  cebu: "CEBU",
  iloilo: "ILOILO",
  inoza: "INOZA",
};

export default function SiteDashboard() {
  const router = useRouter();
  const params = useParams();

  const siteParam = Array.isArray(params.site)
    ? params.site[0]
    : params.site;

  const site = siteParam?.toLowerCase() || "iloilo";

  const siteName =
    siteNames[site] ||
    siteParam?.toUpperCase() ||
    "SITE";

  const storageKey = `it-central-categories-${site}`;

  const [categories, setCategories] =
    useState<Category[]>(defaultCategories);

  const [isEditMode, setIsEditMode] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] =
    useState("");
  const [categoryIcon, setCategoryIcon] = useState("📁");

  /*
   * LOAD CATEGORIES
   */
  useEffect(() => {
    try {
      const savedCategories = localStorage.getItem(storageKey);

      if (savedCategories) {
        const parsed = JSON.parse(savedCategories);

        if (Array.isArray(parsed)) {
          setCategories(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  }, [storageKey]);

  /*
   * SAVE CATEGORIES
   */
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(categories)
      );
    } catch (error) {
      console.error("Failed to save categories:", error);
    }
  }, [categories, storageKey]);

  /*
   * OPEN ADD MODAL
   */
  const openAddModal = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryDescription("");
    setCategoryIcon("📁");
    setShowModal(true);
  };

  /*
   * OPEN EDIT MODAL
   */
  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryDescription(category.description);
    setCategoryIcon(category.icon);
    setShowModal(true);
  };

  /*
   * SAVE CATEGORY
   */
  const saveCategory = () => {
    if (!categoryName.trim()) {
      alert("Please enter a category name.");
      return;
    }

    if (!categoryDescription.trim()) {
      alert("Please enter a description.");
      return;
    }

    if (editingCategory) {
      setCategories((current) =>
        current.map((category) =>
          category.id === editingCategory.id
            ? {
                ...category,
                name: categoryName.trim(),
                description: categoryDescription.trim(),
                icon: categoryIcon || "📁",
              }
            : category
        )
      );
    } else {
      const newCategory: Category = {
        id:
          categoryName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") +
          "-" +
          Date.now(),

        name: categoryName.trim(),

        description: categoryDescription.trim(),

        icon: categoryIcon || "📁",
      };

      setCategories((current) => [
        ...current,
        newCategory,
      ]);
    }

    setShowModal(false);
    setEditingCategory(null);
    setCategoryName("");
    setCategoryDescription("");
    setCategoryIcon("📁");
  };

  /*
   * DELETE CATEGORY
   */
  const deleteCategory = (category: Category) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`
    );

    if (!confirmed) return;

    setCategories((current) =>
      current.filter(
        (item) => item.id !== category.id
      )
    );
  };

  /*
   * VIEW CATEGORY
   */
  const viewCategory = (category: Category) => {
    router.push(`/sites/${site}/${category.id}`);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#071A33] text-white">

      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute -top-60 -right-60 h-[650px] w-[650px] rounded-full bg-blue-600/25 blur-3xl" />

        <div className="absolute -bottom-60 -left-60 h-[650px] w-[650px] rounded-full bg-orange-500/20 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-3xl" />

      </div>

      {/* HEADER */}
      <header className="relative z-10">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8">

          {/* BACK */}
          <button
            onClick={() => router.push("/sites")}
            className="group flex items-center gap-3 text-sm font-semibold text-white transition hover:text-orange-400"
          >

            <span className="text-3xl font-light leading-none text-blue-400 transition group-hover:-translate-x-1">
              ‹
            </span>

            Back

          </button>


          {/* SITE TITLE */}
          <div className="hidden text-center sm:block">

            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-orange-400">
              IT Central Portal
            </p>

            <p className="mt-1 text-xs text-blue-200">
              {siteName} Infrastructure
            </p>

          </div>


          {/* EDIT */}
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
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-16">

        {/* PAGE TITLE */}
        <div className="mb-10 text-center">

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
            Site Dashboard
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            {siteName}
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-blue-200">
            Access documentation, forms, policies, network
            information, monitoring resources, and other
            IT infrastructure records.
          </p>

        </div>


        {/* EDIT MODE NOTICE */}
        {isEditMode && (
          <div className="mx-auto mb-8 max-w-4xl rounded-xl border border-orange-400/30 bg-orange-500/10 px-5 py-3 text-center text-sm text-orange-200">
            Edit mode is enabled. You can edit or delete
            categories.
          </div>
        )}


        {/* CATEGORY GRID */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {categories.map((category) => (

            <div
              key={category.id}
              className={`group relative flex min-h-[225px] flex-col rounded-xl bg-white p-6 text-center shadow-xl transition-all duration-300 ${
                isEditMode
                  ? "border-2 border-orange-400/60"
                  : "hover:-translate-y-1 hover:shadow-2xl"
              }`}
            >

              {/* EDIT CONTROLS */}
              {isEditMode && (
                <div className="absolute right-3 top-3 flex gap-1">

                  <button
                    onClick={() =>
                      openEditModal(category)
                    }
                    className="rounded-md bg-blue-600 px-2 py-1 text-xs font-bold text-white transition hover:bg-blue-700"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      deleteCategory(category)
                    }
                    className="rounded-md bg-red-500 px-2 py-1 text-xs font-bold text-white transition hover:bg-red-600"
                  >
                    Delete
                  </button>

                </div>
              )}


              {/* ICON */}
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-3xl transition-all duration-300 group-hover:bg-blue-100">
                {category.icon}
              </div>


              {/* NAME */}
              <h2 className="text-xl font-semibold text-slate-900">
                {category.name}
              </h2>


              {/* DESCRIPTION */}
              <p className="mx-auto mt-1 max-w-[190px] text-[11px] leading-4 text-slate-500">
                {category.description}
              </p>


              {/* VIEW */}
              {!isEditMode && (
                <button
                  onClick={() =>
                    viewCategory(category)
                  }
                  className="mx-auto mt-auto flex min-w-[105px] items-center justify-center gap-2 rounded-lg border-2 border-slate-900 px-4 py-1.5 text-sm font-medium text-blue-600 transition-all hover:border-blue-600 hover:bg-blue-600 hover:text-white"
                >
                  View

                  <span className="text-lg leading-none">
                    ›
                  </span>

                </button>
              )}

            </div>

          ))}

        </div>


        {/* ADD NEW CATEGORY */}
        <div className="mt-10 flex justify-center">

          <button
            onClick={openAddModal}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-900/30 transition-all hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-900/50"
          >
            + Add New Category
          </button>

        </div>


        {/* FOOTER */}
        <div className="mt-10 flex items-center justify-center gap-3">

          <div className="h-2 w-2 rounded-full bg-orange-400" />

          <p className="text-xs text-blue-300">
            Secure IT Operations Portal
          </p>

        </div>

      </section>


      {/* ADD / EDIT MODAL */}
      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-7 shadow-2xl">

            {/* MODAL HEADER */}
            <div className="mb-6 flex items-center justify-between">

              <div>

                <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">
                  Category
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {editingCategory
                    ? "Edit Category"
                    : "Add New Category"}
                </h2>

              </div>

              <button
                onClick={() => setShowModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600 transition hover:bg-slate-200"
              >
                ×
              </button>

            </div>


            {/* CATEGORY NAME */}
            <div className="mb-4">

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Category Name
              </label>

              <input
                type="text"
                value={categoryName}
                onChange={(e) =>
                  setCategoryName(e.target.value)
                }
                placeholder="Example: CCTV"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>


            {/* DESCRIPTION */}
            <div className="mb-4">

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Description
              </label>

              <textarea
                value={categoryDescription}
                onChange={(e) =>
                  setCategoryDescription(e.target.value)
                }
                placeholder="Example: CCTV cameras and monitoring"
                rows={3}
                className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>


            {/* ICON */}
            <div className="mb-6">

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Icon
              </label>

              <div className="flex gap-3">

                <input
                  type="text"
                  value={categoryIcon}
                  onChange={(e) =>
                    setCategoryIcon(e.target.value)
                  }
                  maxLength={4}
                  placeholder="📁"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <div className="flex h-12 w-14 items-center justify-center rounded-lg bg-slate-100 text-2xl">
                  {categoryIcon || "📁"}
                </div>

              </div>

              <p className="mt-2 text-xs text-slate-400">
                You can use an emoji as the category icon.
              </p>

            </div>


            {/* ACTIONS */}
            <div className="flex gap-3">

              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                onClick={saveCategory}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                {editingCategory
                  ? "Save Changes"
                  : "Add Category"}
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}