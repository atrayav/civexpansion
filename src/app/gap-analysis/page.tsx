"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UploadCloud, FileImage, ShieldAlert, ShieldCheck, Loader2, ArrowRight } from "lucide-react";

interface GapReport {
  foundLicenses: { name: string, state: string, status: string }[];
  missingLicenses: { name: string, state: string, urgency: string, description: string }[];
}

export default function GapAnalysisPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<GapReport | null>(null);
  
  // Dummy fields for the MVP (in real app, this comes from their profile/onboarding)
  const targetStates = "CA, NY";
  const businessType = "LLC";

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...droppedFiles].slice(0, 3)); // Max 3 for MVP demo
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      setFiles(prev => [...prev, ...selectedFiles].slice(0, 3)); // Max 3
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const runAnalysis = async () => {
    if (files.length === 0) return;
    setLoading(true);

    try {
      const docs = await Promise.all(files.map(async file => ({
        type: file.type,
        data: await convertToBase64(file)
      })));

      const res = await fetch("/api/analyze-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: docs, targetStates, businessType })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setReport(data.analysis);
    } catch (e: any) {
      console.error(e);
      alert("Error checking gaps: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-4 md:p-8">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="max-w-5xl mx-auto mt-12 relative z-10">
        <div className="mb-10 text-center">
          <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 bg-indigo-500/10 mb-4 py-1.5 px-4 rounded-full">
            Vision AI Powered
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Compliance Gap Analysis
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Upload images of your current licenses. Claude will cross-reference them against requirements for a <strong className="text-white">{businessType}</strong> expanding to <strong className="text-white">{targetStates}</strong> to identify missing red-tape.
          </p>
        </div>

        {!report ? (
          <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8">
            <CardContent className="p-8">
              <div 
                className="border-2 border-dashed border-slate-700 bg-slate-950/50 hover:bg-slate-900/80 hover:border-indigo-500/50 rounded-xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer group"
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input 
                  id="file-upload" 
                  type="file" 
                  accept="image/jpeg, image/png, image/webp" 
                  multiple 
                  className="hidden" 
                  onChange={handleFileSelect}
                />
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-6 text-slate-400 group-hover:text-indigo-400 group-hover:scale-110 transition-all shadow-inner shadow-black/50">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Drag & Drop License Documents</h3>
                <p className="text-slate-500 text-center">Support for JPG, PNG. Max 3 files for MVP.</p>
              </div>

              {files.length > 0 && (
                <div className="mt-8 space-y-3">
                  <h4 className="text-sm font-medium text-slate-300">Selected Documents ({files.length})</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {files.map((file, i) => (
                      <div key={i} className="flex items-center p-3 rounded-lg border border-slate-800 bg-slate-950 font-mono text-xs text-slate-300 gap-3">
                        <FileImage className="w-5 h-5 text-indigo-400" />
                        <span className="truncate">{file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-slate-950/50 border-t border-slate-800 p-6 flex justify-between items-center">
              <Button variant="ghost" className="text-slate-400" onClick={() => setFiles([])} disabled={files.length === 0 || loading}>
                Clear
              </Button>
              <Button 
                onClick={runAnalysis} 
                disabled={files.length === 0 || loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 shadow-lg shadow-indigo-500/25 transition-all"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cross-referencing database...</>
                ) : (
                  <>Run Gap Analysis <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Found */}
              <Card className="bg-emerald-950/20 border-emerald-500/20 shadow-2xl overflow-hidden border">
                <CardHeader className="bg-emerald-900/10 border-b border-emerald-500/10">
                  <CardTitle className="flex items-center text-emerald-400">
                    <ShieldCheck className="w-5 h-5 mr-3" /> Validated Licenses ({report.foundLicenses?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableBody>
                      {(report.foundLicenses || []).map((lic, i) => (
                        <TableRow key={i} className="border-b border-emerald-500/10 hover:bg-emerald-900/20">
                          <TableCell className="font-medium text-slate-200">{lic.name}</TableCell>
                          <TableCell className="text-slate-400 w-16 text-center">{lic.state}</TableCell>
                          <TableCell className="text-right w-24">
                            <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40">
                              {lic.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!report.foundLicenses?.length && (
                        <TableRow><TableCell colSpan={3} className="text-center text-slate-500 py-6">No validated licenses found in upload.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Missing */}
              <Card className="bg-rose-950/20 border-rose-500/20 shadow-2xl overflow-hidden border">
                <CardHeader className="bg-rose-900/10 border-b border-rose-500/10">
                  <CardTitle className="flex items-center text-rose-400">
                    <ShieldAlert className="w-5 h-5 mr-3" /> Missing / Gap Identified ({report.missingLicenses?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableBody>
                      {(report.missingLicenses || []).map((lic, i) => (
                        <TableRow key={i} className="border-b border-rose-500/10 hover:bg-rose-900/20">
                          <TableCell>
                            <div className="font-bold text-slate-200">{lic.name}</div>
                            <div className="text-xs text-slate-500 mt-1 line-clamp-1">{lic.description}</div>
                          </TableCell>
                          <TableCell className="text-slate-400 w-16 text-center">{lic.state}</TableCell>
                          <TableCell className="text-right w-28">
                            <Badge variant="outline" className={`border whitespace-nowrap \${lic.urgency === 'Critical' ? 'border-rose-500/50 bg-rose-500/20 text-rose-300' : 'border-amber-500/50 bg-amber-500/20 text-amber-300'}`}>
                              {lic.urgency}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-center mt-10">
              <Button onClick={() => setReport(null)} variant="outline" className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8">
                Upload More Documents
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
