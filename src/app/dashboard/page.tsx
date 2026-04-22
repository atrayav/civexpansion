"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  CalendarDays, AlertTriangle, ArrowUpRight, CheckCircle2,
  Clock, Map, PlusCircle, Loader2, FileText
} from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import AppNav from "@/components/AppNav";

interface StateGroup {
  state: string;
  stateName: string;
  stateRiskLevel: "high" | "medium" | "low";
  requirements: { id: string; title: string; urgency: string; estimatedCost: string; typicalTimeline: string; filingAuthority: string }[];
}

interface Analysis {
  id: string;
  business_name: string | null;
  business_type: string | null;
  states: string[];
  results: StateGroup[];
  created_at: string;
}

interface TrackedLicense {
  id: string;
  status: string;
  expiration_date: string | null;
  requirements: {
    name: string;
    jurisdictions: { code: string; name: string } | null;
  } | null;
}

function expiryStatus(expDate: string | null): { label: string; cls: string } {
  if (!expDate) return { label: "No date", cls: "bg-slate-500/20 text-slate-400 border-slate-500/30" };
  const now = new Date();
  const exp = new Date(expDate);
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: "Expired", cls: "bg-rose-500/20 text-rose-400 border-rose-500/30" };
  if (diffDays <= 30) return { label: `${diffDays}d left`, cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
  return { label: "Active", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
}

function riskBadgeClass(level: string) {
  if (level === "high") return "bg-rose-500/20 text-rose-400 border-rose-500/30";
  if (level === "medium") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
}

function urgencyBadgeClass(urgency: string) {
  if (urgency === "critical") return "bg-rose-500/20 text-rose-400 border border-rose-500/30";
  if (urgency === "high") return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
  if (urgency === "medium") return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
  return "bg-slate-500/20 text-slate-400 border border-slate-500/30";
}

export default function DashboardPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [licenses, setLicenses] = useState<TrackedLicense[]>([]);
  const [licensesLoading, setLicensesLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    supabase
      .from("analyses")
      .select("id, business_name, business_type, states, results, created_at")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data, error }: { data: Analysis[] | null; error: unknown }) => {
        if (!error && data) setAnalyses(data);
        setLoading(false);
      });

    supabase
      .from("company_licenses")
      .select(`
        id,
        status,
        expiration_date,
        requirements (
          name,
          jurisdictions ( code, name )
        )
      `)
      .order("expiration_date", { ascending: true })
      .then(({ data, error }: { data: TrackedLicense[] | null; error: unknown }) => {
        if (!error && data) setLicenses(data);
        setLicensesLoading(false);
      });
  }, []);

  // Derive stats from fetched analyses
  const totalStates = new Set(analyses.flatMap((a) => a.states ?? [])).size;
  const totalRequirements = analyses.flatMap((a) =>
    Array.isArray(a.results) ? a.results.flatMap((sg: StateGroup) => sg.requirements ?? []) : []
  );
  const criticalCount = totalRequirements.filter((r) => r.urgency === "critical").length;
  const highCount = totalRequirements.filter((r) => r.urgency === "high").length;

  const stats = [
    { label: "Compliance Maps", value: String(analyses.length), icon: <Map className="w-4 h-4 text-indigo-400" /> },
    { label: "States Analyzed", value: String(totalStates), icon: <ArrowUpRight className="w-4 h-4 text-indigo-400" /> },
    { label: "Total Requirements", value: String(totalRequirements.length), icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
    { label: "Critical Items", value: String(criticalCount + highCount), icon: <AlertTriangle className="w-4 h-4 text-rose-400" /> },
  ];

  // Flatten all requirements into a table-friendly list, newest analysis first
  const tableRows = analyses.flatMap((analysis) =>
    Array.isArray(analysis.results)
      ? analysis.results.flatMap((sg: StateGroup) =>
          (sg.requirements ?? []).map((req) => ({
            analysisId: analysis.id,
            businessName: analysis.business_name ?? analysis.business_type ?? "Unknown",
            state: sg.state,
            stateName: sg.stateName,
            riskLevel: sg.stateRiskLevel,
            requirementTitle: req.title,
            filingAuthority: req.filingAuthority,
            timeline: req.typicalTimeline,
            urgency: req.urgency,
            createdAt: analysis.created_at,
          }))
        )
      : []
  ).slice(0, 20);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-4 md:p-8">
      <AppNav />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto mt-28 relative z-10 animate-in fade-in duration-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Compliance Dashboard</h1>
            <p className="text-slate-400 text-sm">Your jurisdiction intelligence hub</p>
          </div>
          <Link href="/onboarding">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hidden md:flex">
              <PlusCircle className="w-4 h-4 mr-2" /> New Analysis
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <Card key={i} className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-slate-400">{stat.label}</div>
                  <div className="p-2 bg-slate-800 rounded-md">{stat.icon}</div>
                </div>
                <div className="text-3xl font-bold text-white">
                  {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-600" /> : stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Requirements Table */}
        <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl shadow-2xl">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-xl text-white flex items-center">
              <CalendarDays className="w-5 h-5 mr-2 text-indigo-400" /> Requirements & Action Items
            </CardTitle>
            <CardDescription className="text-slate-400">
              All requirements across your analyzed jurisdictions, sorted by urgency.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading your analyses...
              </div>
            ) : tableRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Map className="w-12 h-12 mb-4 text-slate-700" />
                <p className="font-medium text-slate-400 mb-2">No analyses yet</p>
                <p className="text-sm mb-6">Run your first jurisdiction analysis to see requirements here.</p>
                <Link href="/onboarding">
                  <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
                    <PlusCircle className="w-4 h-4 mr-2" /> Start Compliance Map
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-950/80">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-slate-400 w-16 text-center">State</TableHead>
                    <TableHead className="text-slate-400">Requirement</TableHead>
                    <TableHead className="text-slate-400 hidden md:table-cell">Filing Authority</TableHead>
                    <TableHead className="text-slate-400 hidden lg:table-cell w-28">Timeline</TableHead>
                    <TableHead className="text-slate-400 w-28 text-right">Urgency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRows.map((row, i) => (
                    <TableRow key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <TableCell>
                        <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center font-bold text-white border border-white/10 mx-auto text-xs">
                          {row.state}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-200 text-sm">{row.requirementTitle}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{row.businessName}</div>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm hidden md:table-cell">
                        {row.filingAuthority}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm hidden lg:table-cell">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" /> {row.timeline}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={`capitalize text-xs ${urgencyBadgeClass(row.urgency)}`}>
                          {row.urgency}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Tracked Licenses */}
        <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl shadow-2xl mt-8">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-xl text-white flex items-center">
              <FileText className="w-5 h-5 mr-2 text-indigo-400" /> Tracked Licenses
            </CardTitle>
            <CardDescription className="text-slate-400">
              Licenses uploaded via Gap Analysis, ordered by expiry date.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {licensesLoading ? (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mr-3" /> Loading licenses...
              </div>
            ) : licenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-slate-500 px-6 text-center">
                <FileText className="w-10 h-10 mb-4 text-slate-700" />
                <p className="font-medium text-slate-400 mb-1">No licenses tracked yet</p>
                <p className="text-sm text-slate-500">
                  Upload documents in{" "}
                  <Link href="/gap-analysis" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                    Gap Analysis
                  </Link>{" "}
                  to get started.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-950/80">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-slate-400 w-16 text-center">State</TableHead>
                    <TableHead className="text-slate-400">License Name</TableHead>
                    <TableHead className="text-slate-400 hidden md:table-cell w-36">Expiry Date</TableHead>
                    <TableHead className="text-slate-400 w-28 text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licenses.map((lic) => {
                    const stateCode = lic.requirements?.jurisdictions?.code ?? "—";
                    const name = lic.requirements?.name ?? "Unknown License";
                    const { label, cls } = expiryStatus(lic.expiration_date);
                    return (
                      <TableRow key={lic.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <TableCell>
                          <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center font-bold text-white border border-white/10 mx-auto text-xs">
                            {stateCode}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-200 text-sm">{name}</div>
                          <div className="text-xs text-slate-500 mt-0.5 capitalize">{lic.status}</div>
                        </TableCell>
                        <TableCell className="text-slate-300 font-mono text-sm hidden md:table-cell">
                          {lic.expiration_date
                            ? new Date(lic.expiration_date).toLocaleDateString("en-US", {
                                month: "short", day: "numeric", year: "numeric",
                              })
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={`text-xs border ${cls}`}>{label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Analyses */}
        {analyses.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-white mb-4">Recent Compliance Maps</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analyses.map((analysis) => (
                <Card key={analysis.id} className="bg-slate-900/50 border-white/10 backdrop-blur-xl hover:border-indigo-500/20 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-white text-sm">
                          {analysis.business_name || analysis.business_type || "Unnamed"}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {new Date(analysis.created_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric"
                          })}
                        </div>
                      </div>
                      <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                        {analysis.business_type?.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(analysis.states ?? []).map((s) => (
                        <span key={s} className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                          {s}
                        </span>
                      ))}
                    </div>
                    {Array.isArray(analysis.results) && (
                      <div className="flex gap-2 flex-wrap">
                        {analysis.results.map((sg: StateGroup) => (
                          <Badge
                            key={sg.state}
                            variant="outline"
                            className={`text-xs border capitalize ${riskBadgeClass(sg.stateRiskLevel)}`}
                          >
                            {sg.state}: {sg.stateRiskLevel} risk
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
