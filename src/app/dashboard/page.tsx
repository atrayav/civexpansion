"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, AlertTriangle, ArrowUpRight, CheckCircle2, Clock, Mail } from "lucide-react";

export default function DashboardPage() {
  // Mock data for MVP demonstration
  const stats = [
    { label: "Active Licenses", value: "12", icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
    { label: "Pending Renewals", value: "3", icon: <Clock className="w-4 h-4 text-amber-400" /> },
    { label: "Critical Expirations", value: "1", icon: <AlertTriangle className="w-4 h-4 text-rose-400" /> },
    { label: "States Covered", value: "4", icon: <ArrowUpRight className="w-4 h-4 text-indigo-400" /> },
  ];

  const deadlines = [
    { 
      id: 1, 
      state: "CA", 
      name: "Foreign Qualification", 
      expires: "2026-05-15", 
      status: "30 Days", 
      urgency: "High",
      agency: "Secretary of State"
    },
    { 
      id: 2, 
      state: "NY", 
      name: "Biennial Statement", 
      expires: "2026-04-20", 
      status: "7 Days", 
      urgency: "Critical",
      agency: "Department of State"
    },
    { 
      id: 3, 
      state: "TX", 
      name: "Franchise Tax Report", 
      expires: "2026-08-01", 
      status: "Valid", 
      urgency: "Normal",
      agency: "Comptroller"
    },
    { 
      id: 4, 
      state: "CA", 
      name: "Statement of Information", 
      expires: "2026-07-30", 
      status: "60 Days", 
      urgency: "Medium",
      agency: "Secretary of State"
    }
  ].sort((a, b) => new Date(a.expires).getTime() - new Date(b.expires).getTime());

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "7 Days": return <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30">7 Days</Badge>;
      case "30 Days": return <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">30 Days</Badge>;
      case "60 Days": return <Badge className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">60 Days</Badge>;
      default: return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Valid</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-4 md:p-8">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto mt-8 relative z-10 animate-in fade-in duration-700">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Compliance Dashboard</h1>
            <p className="text-slate-400 text-sm">Managing requirements across multiple states.</p>
          </div>
          <Badge variant="outline" className="hidden md:flex border-indigo-500/30 text-indigo-300 bg-indigo-500/10 py-1.5 px-4 rounded-full items-center">
            <Mail className="w-3 h-3 mr-2" /> Alerting via Resend Active
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <Card key={i} className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-slate-400">{stat.label}</div>
                  <div className="p-2 bg-slate-800 rounded-md">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Timeline Table */}
        <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl shadow-2xl">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-xl text-white flex items-center">
              <CalendarDays className="w-5 h-5 mr-2 text-indigo-400" /> Upcoming Renewals & Deadlines
            </CardTitle>
            <CardDescription className="text-slate-400">
              Emails are automatically dispatched to team members at 60, 30, and 7 days.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-950/80">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-slate-400 w-16 text-center">State</TableHead>
                  <TableHead className="text-slate-400">License / Requirement</TableHead>
                  <TableHead className="text-slate-400 hidden md:table-cell">Agency</TableHead>
                  <TableHead className="text-slate-400 w-32">Expiration</TableHead>
                  <TableHead className="text-slate-400 w-32 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deadlines.map((item) => (
                  <TableRow key={item.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <TableCell>
                      <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center font-bold text-white border border-white/10 mx-auto">
                        {item.state}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-200">{item.name}</div>
                      <div className="text-xs text-slate-500 md:hidden mt-1">{item.agency}</div>
                    </TableCell>
                    <TableCell className="text-slate-400 hidden md:table-cell">{item.agency}</TableCell>
                    <TableCell className="text-slate-300 font-mono text-sm pl-4">
                      {new Date(item.expires).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-right">
                      {getStatusBadge(item.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
