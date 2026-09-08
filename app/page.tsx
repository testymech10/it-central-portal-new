"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

 const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    router.push("/select");
  };

  return (
    <main className="min-h-screen bg-[#071A33] relative overflow-hidden">

      {/* Background decoration */}
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />

      <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-orange-500/20 blur-3xl" />

      {/* Main container */}
      <div className="relative flex min-h-screen items-center justify-center px-6">

        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">

          {/* LEFT SIDE */}
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

              <h1 className="max-w-md text-4xl font-bold leading-tight">
                Centralized IT Infrastructure
              </h1>

              <p className="mt-5 max-w-md text-sm leading-6 text-blue-100">
                Access IT documentation, assets, network information,
                monitoring resources, and operational records.
              </p>

            </div>

            <div className="border-t border-white/10 pt-6">

              <div className="flex items-center gap-3">

                <div className="h-2 w-2 rounded-full bg-orange-400" />

                <p className="text-xs text-blue-200">
                  Secure centralized Portal
                </p>

              </div>

            </div>

          </div>


          {/* LOGIN SIDE */}
          <div className="flex items-center justify-center p-8 sm:p-12">

            <div className="w-full max-w-sm">

              {/* Mobile logo */}
              <div className="mb-8 flex items-center gap-3 md:hidden">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-white font-bold">
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


              <div className="mb-8">

                <p className="mb-2 text-sm font-semibold text-orange-500">
                  SALESRAIN IT SUPPORT
                </p>

                <h2 className="text-3xl font-bold text-slate-900">
                  Sign in
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Please sign in to access the IT Centralized Portal.
                </p>

              </div>


              <form onSubmit={handleLogin} className="space-y-5">

                {/* Username */}
                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Username
                  </label>

                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                  />

                </div>


                {/* Password */}
                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Password
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                  />

                </div>


                {/* Login */}
                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-700 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 active:scale-[0.99]"
                >
                  Sign In
                </button>

              </form>


              <p className="mt-8 text-center text-xs text-slate-400">
                IT Central Portal
              </p>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}