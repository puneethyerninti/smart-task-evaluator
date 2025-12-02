"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const path = usePathname();

  return (
    <nav className="container-xl flex items-center justify-between py-4">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-lg font-semibold text-white">
          SmartTask
        </Link>
        <div className="hidden items-center gap-3 text-sm text-slate-300 md:flex">
          <Link href="/dashboard" className={`px-3 py-1 rounded ${path === '/dashboard' ? 'bg-white/6 text-white' : 'text-slate-300 hover:bg-white/3'}`}>
            Dashboard
          </Link>
          <Link href="/tasks/new" className="px-3 py-1 rounded text-slate-300 hover:bg-white/3">
            New Task
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/login" className="btn btn-ghost">
          Sign in
        </Link>
      </div>
    </nav>
  );
}
