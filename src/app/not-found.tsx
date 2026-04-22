import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center px-4 selection:bg-indigo-500/30">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="relative z-10">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20">
          <MapPin className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-6xl font-extrabold text-white mb-3">404</h1>
        <p className="text-xl text-slate-400 mb-2">Jurisdiction not found</p>
        <p className="text-slate-600 text-sm mb-10">
          This page doesn&apos;t exist — or you may need to log in to access it.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button variant="outline" className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6">
              Go home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-6 shadow-lg shadow-indigo-500/20">
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
