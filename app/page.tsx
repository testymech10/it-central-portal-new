"use client";

import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleProceed = () => {
    router.push("/select");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#071A33]">

      {/* Background decoration */}
      <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />

      <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-orange-500/20 blur-3xl" />

      {/* Main container */}
      <div className="relative flex min-h-screen items-center justify-center px-6">

        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">

          {/* =========================================
              LEFT SIDE
          ========================================== */}
          <div className="hidden bg-gradient-to-br from-[#0B3A82] to-[#092653] p-12 text-white md:flex md:flex-col md:justify-between">

            <div>

              {/* Logo */}
              <div className="mb-10 flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-xl font-bold">
                  IT
                </div>

                <div>
                  <p className="font-bold">
                    IT Central
                  </p>

                  <p className="text-xs text-blue-200">
                    Infrastructure Portal
                  </p>
                </div>

              </div>

              {/* Main heading */}
              <h1 className="max-w-md text-4xl font-bold leading-tight">
                Centralized IT Infrastructure
              </h1>

              {/* Description */}
              <p className="mt-5 max-w-md text-sm leading-6 text-blue-100">
                Access IT documentation, assets, network information,
                monitoring resources, and operational records.
              </p>

            </div>

            {/* Bottom information */}
            <div className="border-t border-white/10 pt-6">

              <div className="flex items-center gap-3">

                <div className="h-2 w-2 rounded-full bg-orange-400" />

                <p className="text-xs text-blue-200">
                  Centralized IT Support Portal
                </p>

              </div>

            </div>

          </div>


          {/* =========================================
              RIGHT SIDE
          ========================================== */}
          <div className="flex min-h-[550px] items-center justify-center p-8 sm:p-12">

            <div className="w-full max-w-sm">

              {/* Mobile logo */}
              <div className="mb-10 flex items-center gap-3 md:hidden">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 font-bold text-white">
                  IT
                </div>

                <div>
                  <p className="font-bold text-slate-800">
                    IT Central
                  </p>

                  <p className="text-xs text-slate-500">
                    Infrastructure Portal
                  </p>
                </div>

              </div>


              {/* Welcome section */}
              <div className="mb-10">

                <p className="mb-3 text-sm font-semibold text-orange-500">
                  SALESRAIN IT SUPPORT
                </p>

                <h2 className="text-4xl font-bold text-slate-900">
                  Welcome
                </h2>

                <p className="mt-4 text-sm leading-6 text-slate-500">
                  Access the centralized IT infrastructure portal
                  for documentation, assets, network information,
                  monitoring resources, and operational records.
                </p>

              </div>


              {/* Proceed button */}
              <button
                type="button"
                onClick={handleProceed}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition-all hover:bg-blue-800 hover:shadow-xl hover:shadow-blue-700/30 active:scale-[0.99]"
              >
                <span>
                  Proceed
                </span>

                <span className="transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </button>


              {/* Information */}
              <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4">

                <div className="flex items-start gap-3">

                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-xs font-bold text-white">
                    IT
                  </div>

                  <div>

                    <p className="text-sm font-semibold text-slate-800">
                      IT Central Portal
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Select your site to continue to the
                      centralized IT resources.
                    </p>

                  </div>

                </div>

              </div>


              {/* Footer */}
              <p className="mt-8 text-center text-xs text-slate-400">
                SalesRain IT Support
              </p>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}