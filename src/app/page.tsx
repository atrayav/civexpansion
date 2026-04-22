import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      <header className="px-6 lg:px-14 h-20 flex items-center border-b border-indigo-500/10 backdrop-blur-md fixed top-0 w-full z-50">
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
          <Link className="flex items-center gap-2 group" href="#">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
              C
            </div>
            <span className="font-bold text-xl tracking-tight text-white group-hover:text-indigo-100 transition-colors">CivExpander</span>
          </Link>
          <nav className="hidden md:flex gap-6 items-center">
            <Link className="text-sm font-medium hover:text-white text-slate-400 transition-colors" href="/dashboard">
              Dashboard
            </Link>
            <Link className="text-sm font-medium hover:text-white text-slate-400 transition-colors" href="/gap-analysis">
              Gap Analysis
            </Link>
            <Link href="/signup">
              <Button className="bg-white text-slate-950 hover:bg-slate-200 transition-all shadow-md rounded-full px-5">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 mt-20 flex items-center justify-center relative overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse duration-10000" />
        <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none" />

        <section className="w-full py-24 md:py-32 lg:py-48 px-4 flex flex-col justify-center items-center text-center relative z-10">
          <div className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-sm font-medium text-indigo-300 mb-8 backdrop-blur-sm shadow-inner shadow-indigo-500/10 transition-transform hover:scale-105 cursor-default">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400 mr-2 animate-pulse"></span>
            Compliance mapping powered by AI
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-100 to-slate-400 pb-4 drop-shadow-sm">
            Expand your footprint.<br className="hidden sm:block"/> We map the red tape.
          </h1>
          <p className="mx-auto mt-6 max-w-[600px] text-slate-400 text-lg md:text-xl leading-relaxed">
            Jurisdiction intelligence, license gap analysis, and automated renewal tracking for companies expanding across state lines.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row gap-5 items-center justify-center">
            <Link href="/signup">
              <Button size="lg" className="h-14 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-lg shadow-[0_0_30px_-5px_var(--tw-shadow-color)] shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 hover:-translate-y-1 group">
                Start Compliance Map
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
            <Link href="/gap-analysis">
              <Button size="lg" variant="outline" className="h-14 px-8 border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-white rounded-full text-lg backdrop-blur-sm transition-all duration-300 hover:border-slate-500">
                Analyze Existing Licenses
              </Button>
            </Link>
          </div>
          
          <div className="mt-24 w-full max-w-5xl mx-auto rounded-xl border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-xl">
             <div className="rounded-lg bg-slate-950 p-4 border border-white/5 h-[300px] flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]"></div>
               <div className="text-slate-500 flex flex-col items-center">
                  <svg className="w-12 h-12 mb-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Interactive Compliance Map Preview
               </div>
             </div>
          </div>
        </section>
      </main>
    </div>
  );
}
