"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertCircle, CheckCircle2, MapPin, ChevronLeft, Download } from "lucide-react";

interface Requirement {
  id: string;
  state: string;
  name: string;
  description: string;
  urgency: "Critical" | "Moderate" | "Standard";
  agency: string;
  estimatedDays: number;
}

// Separate component to handle query params inside Suspense
function ComplianceMapContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const b_type = searchParams.get("b_type") || "";
  const b_name = searchParams.get("b_name") || "Your Company";
  const states = searchParams.get("states") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requirements, setRequirements] = useState<Requirement[]>([]);

  useEffect(() => {
    if (!states || !b_type) {
      router.push("/onboarding");
      return;
    }

    const fetchMap = async () => {
      try {
        const res = await fetch("/api/analyze-jurisdiction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessName: b_name, businessType: b_type, states })
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to analyze compliance map.");
        }
        
        setRequirements(data.requirements);
      } catch (err: any) {
        setError(err.message || "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchMap();
  }, [b_type, b_name, states, router]);

  const urgencyFormat = {
    Critical: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    Moderate: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Standard: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  const urgencyIcon = {
    Critical: <AlertCircle className="w-3 h-3 mr-1" />,
    Moderate: <AlertCircle className="w-3 h-3 mr-1" />,
    Standard: <CheckCircle2 className="w-3 h-3 mr-1" />
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] w-full animate-in fade-in duration-1000">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="text-indigo-400 w-8 h-8 animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Analyzing Jurisdictions...</h2>
        <p className="text-slate-400">Claude is cross-referencing {states.split(",").length} states for {b_type.toUpperCase()} regulations.</p>
        
        {/* Fake processing steps */}
        <div className="mt-8 space-y-3 w-64 text-sm text-slate-500">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Connecting to AI models</div>
          <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 text-indigo-400 animate-spin" /> Querying state database</div>
          <div className="flex items-center gap-2 opacity-50"><Loader2 className="w-4 h-4" /> Synthesizing requirements</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-rose-500/10 border border-rose-500/20 rounded-xl max-w-lg mx-auto mt-20">
        <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Analysis Failed</h2>
        <p className="text-slate-400 text-center mb-6">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="border-rose-500/50 hover:bg-rose-500/20 text-rose-300">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-4 md:px-6 mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <Button variant="ghost" className="text-slate-400 hover:text-white pl-0 mb-4" onClick={() => router.push("/onboarding")}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Setup
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Compliance Map</h1>
            <Badge variant="outline" className="border-indigo-500/50 text-indigo-300 bg-indigo-500/10">AI Generated</Badge>
          </div>
          <p className="text-slate-400">
            Identified <strong className="text-white">{requirements.length}</strong> requirements across <strong className="text-white">{states.split(",").length}</strong> states for <strong>{b_name}</strong>.
          </p>
        </div>
        <Button className="bg-white text-slate-950 hover:bg-slate-200 shadow-lg shrink-0">
          <Download className="w-4 h-4 mr-2" /> Export Brief
        </Button>
      </div>

      <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden rounded-xl border border-indigo-500/10">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-950/80 border-b border-white/5">
              <TableRow className="hover:bg-transparent border-transparent">
                <TableHead className="text-slate-400 w-24">State</TableHead>
                <TableHead className="text-slate-400">Requirement</TableHead>
                <TableHead className="text-slate-400">Agency</TableHead>
                <TableHead className="text-slate-400 w-32">Avg Days</TableHead>
                <TableHead className="text-slate-400 w-36 text-right">Urgency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requirements.map((req, i) => (
                <TableRow key={req.id || i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <TableCell className="font-medium">
                    <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center font-bold text-white border border-white/10">
                      {req.state}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-200">{req.name}</div>
                    <div className="text-sm text-slate-500 max-w-md line-clamp-2 mt-1">{req.description}</div>
                  </TableCell>
                  <TableCell className="text-slate-400">{req.agency}</TableCell>
                  <TableCell className="text-slate-400">~{req.estimatedDays} days</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={`\${urgencyFormat[req.urgency] || urgencyFormat.Standard} border whitespace-nowrap`}>
                      <span className="flex items-center">
                        {urgencyIcon[req.urgency] || urgencyIcon.Standard} {req.urgency}
                      </span>
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// Main page component wrapping the suspense query logic
export default function ComplianceMapPage() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-indigo-500/30 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Wrap everything in Suspense for the useSearchParams hook inside Next.js 14 CSR */}
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
           <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      }>
        <ComplianceMapContent />
      </Suspense>
    </div>
  );
}
