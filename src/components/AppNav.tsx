"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Map, FileSearch, LayoutDashboard, PlusCircle } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

const NAV_LINKS = [
  { href: "/dashboard",    label: "Dashboard",     icon: LayoutDashboard },
  { href: "/gap-analysis", label: "Gap Analysis",  icon: FileSearch },
  { href: "/onboarding",   label: "New Map",       icon: PlusCircle },
];

export default function AppNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    getSupabaseBrowser()
      .auth.getUser()
      .then(({ data }: { data: { user: { email?: string } | null } }) =>
        setEmail(data.user?.email ?? null)
      );
  }, []);

  const handleSignOut = async () => {
    await getSupabaseBrowser().auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="fixed top-0 w-full z-50 border-b border-white/[0.06] bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
            C
          </div>
          <span className="font-bold text-white hidden sm:block">CivExpander</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-600/20 text-indigo-300"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:block">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {email && (
            <span className="hidden lg:block text-xs text-slate-600 max-w-[160px] truncate">
              {email}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-slate-400 hover:text-white hover:bg-slate-800 gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:block text-xs">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
