"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertCircle,
  MapPin,
  ChevronLeft,
  Download,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Building2,
  AlertTriangle,
} from "lucide-react";

// ---------- Types ---------------------------------------------------------

interface Requirement {
  id: string;
  category: string;
  title: string;
  description: string;
  urgency: "critical" | "high" | "medium" | "low";
  urgencyReason: string;
  typicalTimeline: string;
  estimatedCost: string;
  filingAuthority: string;
  filingUrl: string | null;
  penaltyForNonCompliance: string;
  isIndustrySpecific: boolean;
  commonMistakes: string[];
  confidenceScore?: number;
  confidenceLabel?: "High" | "Medium" | "Low";
  confidenceReason?: string;
  verifyUrl?: string;
}

interface StateGroup {
  state: string;
  stateName: string;
  requirements: Requirement[];
  stateRiskLevel: "high" | "medium" | "low";
  stateRiskRationale: string;
  priorityOrder: string[];
  overallStateConfidence?: number;
  lastRegulationCheck?: string;
}

// ---------- Urgency config ------------------------------------------------

const urgencyBadge: Record<string, string> = {
  critical: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  high:     "bg-amber-500/20 text-amber-400 border-amber-500/30",
  medium:   "bg-blue-500/20  text-blue-400  border-blue-500/30",
  low:      "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const riskBadge: Record<string, string> = {
  high:   "bg-rose-500/20 text-rose-400 border-rose-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low:    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const confidenceBadge: Record<string, string> = {
  High:   "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Low:    "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

// ---------- Requirement card ----------------------------------------------

function RequirementCard({ req }: { req: Requirement }) {
  const [mistakesOpen, setMistakesOpen] = useState(false);

  return (
    <div className="rounded-xl border border-white/[0.07] bg-slate-900/60 backdrop-blur-sm p-5 space-y-3 hover:border-indigo-500/20 transition-colors">
      {/* Title row */}
      <div className="flex flex-wrap items-start gap-2">
        <span className="flex-1 font-bold text-slate-100 text-sm leading-snug">
          {req.title}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {req.isIndustrySpecific && (
            <Badge
              variant="outline"
              className="border-violet-500/30 bg-violet-500/10 text-violet-400 text-[10px] px-2"
            >
              Industry-specific
            </Badge>
          )}
          <Badge
            variant="outline"
            className={`border text-[10px] px-2 capitalize ${urgencyBadge[req.urgency] ?? urgencyBadge.low}`}
          >
            {req.urgency}
          </Badge>
        </div>
      </div>

      {/* Category */}
      <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
        {req.category}
      </p>

      {/* Description */}
      <p className="text-sm text-slate-400 leading-relaxed">{req.description}</p>

      {/* Metadata row */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-slate-600" />
          {req.filingAuthority}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-600" />
          {req.typicalTimeline}
        </span>
        <span className="flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-slate-600" />
          {req.estimatedCost}
        </span>
        {req.filingUrl && (
          <a
            href={req.filingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
          >
            Official filing →
          </a>
        )}
      </div>

      {/* Penalty note */}
      {req.penaltyForNonCompliance && (
        <div className="flex items-start gap-2 rounded-lg bg-rose-500/5 border border-rose-500/10 px-3 py-2 text-xs text-rose-400">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {req.penaltyForNonCompliance}
        </div>
      )}

      {/* Common mistakes accordion */}
      {req.commonMistakes?.length > 0 && (
        <div>
          <button
            onClick={() => setMistakesOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {mistakesOpen ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            Common mistakes ({req.commonMistakes.length})
          </button>
          {mistakesOpen && (
            <ul className="mt-2 space-y-1 pl-4 border-l border-slate-700">
              {req.commonMistakes.map((m, i) => (
                <li key={i} className="text-xs text-slate-400 leading-relaxed">
                  {m}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Confidence badge + low-confidence callout */}
      {req.confidenceLabel && (
        <div className="pt-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`border text-[10px] px-2 ${confidenceBadge[req.confidenceLabel] ?? confidenceBadge.Medium}`}
            >
              {req.confidenceLabel} Confidence
              {req.confidenceScore !== undefined && (
                <span className="ml-1 opacity-70">· {Math.round(req.confidenceScore * 100)}%</span>
              )}
            </Badge>
            {req.confidenceReason && (
              <span className="text-[10px] text-slate-500 leading-tight">{req.confidenceReason}</span>
            )}
          </div>

          {req.confidenceLabel === "Low" && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/5 border border-amber-500/15 px-3 py-2 text-xs text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                This requirement has a low confidence score. Verify directly with the state agency before filing.
                {(req.verifyUrl || req.filingUrl) && (
                  <>
                    {" "}
                    <a
                      href={req.verifyUrl ?? req.filingUrl ?? ""}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-amber-300"
                    >
                      Verify here →
                    </a>
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- State section -------------------------------------------------

function StateSection({ group }: { group: StateGroup }) {
  // Sort requirements by priorityOrder; items not in the list go to the end.
  const sorted = [...group.requirements].sort((a, b) => {
    const ai = group.priorityOrder.indexOf(a.id);
    const bi = group.priorityOrder.indexOf(b.id);
    return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
  });

  return (
    <section className="space-y-4">
      {/* State header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-extrabold text-indigo-300 text-sm">
          {group.state}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-white">{group.stateName}</h2>
            <Badge
              variant="outline"
              className={`border text-xs capitalize ${riskBadge[group.stateRiskLevel] ?? riskBadge.low}`}
            >
              {group.stateRiskLevel} risk
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{group.stateRiskRationale}</p>
          {group.lastRegulationCheck && (
            <p className="text-xs text-slate-600 mt-1 italic">{group.lastRegulationCheck}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-sm text-slate-500">
            {sorted.length} requirement{sorted.length !== 1 ? "s" : ""}
          </span>
          {group.overallStateConfidence !== undefined && (
            <Badge
              variant="outline"
              className={`text-[10px] border ${
                group.overallStateConfidence >= 0.85
                  ? confidenceBadge.High
                  : group.overallStateConfidence >= 0.60
                  ? confidenceBadge.Medium
                  : confidenceBadge.Low
              }`}
            >
              {Math.round(group.overallStateConfidence * 100)}% avg confidence
            </Badge>
          )}
        </div>
      </div>

      {/* Requirement cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-4 border-l border-slate-800">
        {sorted.map((req) => (
          <RequirementCard key={req.id} req={req} />
        ))}
      </div>
    </section>
  );
}

// ---------- Main content --------------------------------------------------

function ComplianceMapContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const b_type = searchParams.get("b_type") || "";
  const b_name = searchParams.get("b_name") || "Your Company";
  const statesParam = searchParams.get("states") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stateGroups, setStateGroups] = useState<StateGroup[]>([]);

  useEffect(() => {
    if (!statesParam || !b_type) {
      router.push("/onboarding");
      return;
    }

    const statesArray = statesParam.split(",").map((s) => s.trim()).filter(Boolean);

    const fetchMap = async () => {
      try {
        const res = await fetch("/api/analyze-jurisdiction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessName: b_name,
            businessType: b_type,
            states: statesArray,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to analyze compliance map.");
        }

        setStateGroups(Array.isArray(data.requirements) ? data.requirements : []);
      } catch (err: any) {
        setError(err.message || "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchMap();
  }, [b_type, b_name, statesParam, router]);

  const stateCount = statesParam.split(",").filter(Boolean).length;
  const reqCount = stateGroups.reduce((n, g) => n + g.requirements.length, 0);

  const exportBrief = () => {
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const lines: string[] = [
      "CIVEXPANDER COMPLIANCE BRIEF",
      "============================",
      `This report was generated by CivExpander AI on ${today}.`,
      "Confidence scores reflect AI certainty at time of generation.",
      "Regulations change — verify all requirements before filing.",
      "This is not legal advice.",
      "",
      `Company: ${b_name}`,
      `Business Type: ${b_type.toUpperCase()}`,
      `Generated: ${today}`,
      `Total Requirements: ${reqCount} across ${stateGroups.length} state(s)`,
      "",
    ];

    for (const group of stateGroups) {
      lines.push(`${"=".repeat(60)}`);
      lines.push(`STATE: ${group.stateName} (${group.state})`);
      lines.push(`Risk Level: ${group.stateRiskLevel.toUpperCase()}`);
      lines.push(`Rationale: ${group.stateRiskRationale}`);
      if (group.overallStateConfidence !== undefined) {
        lines.push(`Avg Confidence: ${Math.round(group.overallStateConfidence * 100)}%`);
      }
      if (group.lastRegulationCheck) {
        lines.push(`Note: ${group.lastRegulationCheck}`);
      }
      lines.push("");

      const sorted = [...group.requirements].sort((a, b) => {
        const ai = group.priorityOrder.indexOf(a.id);
        const bi = group.priorityOrder.indexOf(b.id);
        return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
      });

      for (const req of sorted) {
        lines.push(`  [${req.urgency.toUpperCase()}] ${req.title}`);
        lines.push(`  Category: ${req.category}`);
        lines.push(`  Filing Authority: ${req.filingAuthority}`);
        lines.push(`  Timeline: ${req.typicalTimeline}  |  Cost: ${req.estimatedCost}`);
        lines.push(`  Description: ${req.description}`);
        if (req.penaltyForNonCompliance) {
          lines.push(`  Penalty: ${req.penaltyForNonCompliance}`);
        }
        if (req.filingUrl) {
          lines.push(`  Official URL: ${req.filingUrl}`);
        }
        // Confidence line
        if (req.confidenceLabel && req.confidenceScore !== undefined) {
          const score = `${Math.round(req.confidenceScore * 100)}%`;
          if (req.confidenceLabel === "Low") {
            const verifyLink = req.verifyUrl ?? req.filingUrl ?? "";
            lines.push(`  Confidence: ${req.confidenceLabel} (${score}) — ${req.confidenceReason ?? "Verify with state agency"}${verifyLink ? `: ${verifyLink}` : ""}`);
          } else {
            lines.push(`  Confidence: ${req.confidenceLabel} (${score}) — ${req.confidenceReason ?? ""}`);
          }
        }
        lines.push("");
      }
    }

    lines.push("Generated by CivExpander — AI-Powered Multi-State Compliance Intelligence");

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-brief-${b_name.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] w-full animate-in fade-in duration-1000">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="text-indigo-400 w-8 h-8 animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Analyzing Jurisdictions...</h2>
        <p className="text-slate-400">
          Claude is cross-referencing {stateCount} state{stateCount !== 1 ? "s" : ""} for{" "}
          {b_type.toUpperCase()} regulations.
        </p>
        <div className="mt-8 space-y-3 w-64 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
            Querying compliance database
          </div>
          <div className="flex items-center gap-2 opacity-50">
            <Loader2 className="w-4 h-4" />
            Synthesizing requirements
          </div>
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
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="border-rose-500/50 hover:bg-rose-500/20 text-rose-300"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-4 md:px-6 mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white pl-0 mb-4"
            onClick={() => router.push("/onboarding")}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Setup
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">
              Compliance Map
            </h1>
            <Badge
              variant="outline"
              className="border-indigo-500/50 text-indigo-300 bg-indigo-500/10"
            >
              AI Generated
            </Badge>
          </div>
          <p className="text-slate-400">
            Identified{" "}
            <strong className="text-white">{reqCount}</strong> requirements across{" "}
            <strong className="text-white">{stateGroups.length}</strong> states for{" "}
            <strong className="text-white">{b_name}</strong>.
          </p>
        </div>
        <Button
          onClick={exportBrief}
          disabled={stateGroups.length === 0}
          className="bg-white text-slate-950 hover:bg-slate-200 shadow-lg shrink-0"
        >
          <Download className="w-4 h-4 mr-2" /> Export Brief
        </Button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3 mb-10 text-sm text-slate-400">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />
        <span>
          AI-generated analysis · Accuracy varies by jurisdiction and business type ·{" "}
          <strong className="text-slate-300">Always verify with a licensed attorney or state agency before filing.</strong>
          {" "}Confidence scores reflect AI certainty at time of generation.
        </span>
      </div>

      {/* State sections */}
      <div className="space-y-12">
        {stateGroups.map((group) => (
          <StateSection key={group.state} group={group} />
        ))}
      </div>
    </div>
  );
}

// ---------- Page wrapper --------------------------------------------------

export default function ComplianceMapPage() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-indigo-500/30 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none" />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        }
      >
        <ComplianceMapContent />
      </Suspense>
    </div>
  );
}
