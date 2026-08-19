"use client";

import { useRouter } from "next/navigation";

const sites = [
  {
    name: "BGC",
    location: "Bonifacio Global City",
    description: "BGC Site",
  },
  {
    name: "CEBU",
    location: "Cebu",
    description: "Cebu Site",
  },
  {
    name: "ILOILO",
    location: "Iloilo City",
    description: "Iloilo Site",
  },
  {
    name: "INOZA",
    location: "Inoza",
    description: "Inoza Site",
  },
];

export default function SelectSitePage() {
  const router = useRouter();

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
              Choose what site you wanted to access. Each site has its own set of resources and information.
            </p>
          </div>

          {/* Site Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {sites.map((site) => {
              const route = site.name.toLowerCase();

              return (
                <button
                  key={site.name}
                  onClick={() => router.push(`/sites/${route}`)}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-6 text-left backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-400/50 hover:bg-white/[0.10] hover:shadow-2xl hover:shadow-blue-950/40"
                >
                  {/* Orange accent */}
                  <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-blue-500 to-orange-500 opacity-70 transition-opacity group-hover:opacity-100" />

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
                  <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-blue-300 transition-colors group-hover:text-orange-400">
                    Access Site
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer information */}
          <div className="mt-12 flex items-center justify-center gap-3">
            <div className="h-2 w-2 rounded-full bg-orange-400" />

            <p className="text-xs text-blue-300">
              Secure IT Operations Portal
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}