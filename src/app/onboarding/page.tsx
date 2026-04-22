"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, Briefcase, Building2, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

const US_STATES = [
  { id: "AL", name: "Alabama" },
  { id: "AK", name: "Alaska" },
  { id: "AZ", name: "Arizona" },
  { id: "AR", name: "Arkansas" },
  { id: "CA", name: "California" },
  { id: "CO", name: "Colorado" },
  { id: "CT", name: "Connecticut" },
  { id: "DE", name: "Delaware" },
  { id: "FL", name: "Florida" },
  { id: "GA", name: "Georgia" },
  { id: "HI", name: "Hawaii" },
  { id: "ID", name: "Idaho" },
  { id: "IL", name: "Illinois" },
  { id: "IN", name: "Indiana" },
  { id: "IA", name: "Iowa" },
  { id: "KS", name: "Kansas" },
  { id: "KY", name: "Kentucky" },
  { id: "LA", name: "Louisiana" },
  { id: "ME", name: "Maine" },
  { id: "MD", name: "Maryland" },
  { id: "MA", name: "Massachusetts" },
  { id: "MI", name: "Michigan" },
  { id: "MN", name: "Minnesota" },
  { id: "MS", name: "Mississippi" },
  { id: "MO", name: "Missouri" },
  { id: "MT", name: "Montana" },
  { id: "NE", name: "Nebraska" },
  { id: "NV", name: "Nevada" },
  { id: "NH", name: "New Hampshire" },
  { id: "NJ", name: "New Jersey" },
  { id: "NM", name: "New Mexico" },
  { id: "NY", name: "New York" },
  { id: "NC", name: "North Carolina" },
  { id: "ND", name: "North Dakota" },
  { id: "OH", name: "Ohio" },
  { id: "OK", name: "Oklahoma" },
  { id: "OR", name: "Oregon" },
  { id: "PA", name: "Pennsylvania" },
  { id: "RI", name: "Rhode Island" },
  { id: "SC", name: "South Carolina" },
  { id: "SD", name: "South Dakota" },
  { id: "TN", name: "Tennessee" },
  { id: "TX", name: "Texas" },
  { id: "UT", name: "Utah" },
  { id: "VT", name: "Vermont" },
  { id: "VA", name: "Virginia" },
  { id: "WA", name: "Washington" },
  { id: "WV", name: "West Virginia" },
  { id: "WI", name: "Wisconsin" },
  { id: "WY", name: "Wyoming" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [selectedStates, setSelectedStates] = useState<string[]>([]);

  const toggleState = (stateId: string) => {
    setSelectedStates(prev => 
      prev.includes(stateId) 
        ? prev.filter(id => id !== stateId)
        : [...prev, stateId]
    );
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();

      // 1. Persist business context to auth user metadata so API routes can read it
      await supabase.auth.updateUser({
        data: {
          business_name: businessName,
          business_type: businessType,
          target_states: selectedStates,
        },
      });

      // 2. Update the public.users profile row with company name + entity type
      await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: businessName,
          business_type: businessType,
        }),
      });

      const queryParams = new URLSearchParams({
        b_name: businessName,
        b_type: businessType,
        states: selectedStates.join(","),
      }).toString();

      router.push(`/compliance-map?${queryParams}`);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-indigo-500/30">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[128px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 font-bold text-white shadow-lg shadow-indigo-500/20 mb-4">
            C
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Setup your compliance profile</h1>
          <p className="text-slate-400 mt-2">Let AI build your roadmap for multi-state expansion</p>
        </div>

        <Card className="border-white/10 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 bg-indigo-500/10">
                Step {step} of 2
              </Badge>
              <div className="flex gap-1">
                <div className={`h-1.5 w-8 rounded-full transition-colors ${step >= 1 ? 'bg-indigo-500' : 'bg-slate-800'}`} />
                <div className={`h-1.5 w-8 rounded-full transition-colors ${step >= 2 ? 'bg-indigo-500' : 'bg-slate-800'}`} />
              </div>
            </div>
            <CardTitle className="text-xl text-white">
              {step === 1 ? 'Business Details' : 'Target Jurisdictions'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {step === 1 ? 'Tell us about your company structure.' : 'Where are you looking to expand next?'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Company Name
                  </label>
                  <Input 
                    placeholder="Acme Corp" 
                    className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Legal Entity Type
                  </label>
                  <Select value={businessType} onValueChange={(val) => setBusinessType(val || "")}>
                    <SelectTrigger className="bg-slate-950/50 border-slate-800 text-white focus:ring-indigo-500">
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      <SelectItem value="llc">LLC (Limited Liability Company)</SelectItem>
                      <SelectItem value="c-corp">C-Corporation</SelectItem>
                      <SelectItem value="s-corp">S-Corporation</SelectItem>
                      <SelectItem value="sole-prop">Sole Proprietorship</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-3">
                  <Map className="w-4 h-4" /> Select States
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                  {US_STATES.map((state) => {
                    const isSelected = selectedStates.includes(state.id);
                    return (
                      <button
                        key={state.id}
                        onClick={() => toggleState(state.id)}
                        className={`p-3 rounded-lg border text-sm font-medium transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                          isSelected 
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)]' 
                            : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50'
                        }`}
                      >
                        <span className="text-xl">{state.id}</span>
                        <span className="text-xs max-w-full truncate">{state.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t border-slate-800 pt-6">
            <Button 
              variant="ghost" 
              onClick={() => step === 2 ? setStep(1) : router.push('/')}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Back
            </Button>
            
            {step === 1 ? (
              <Button 
                onClick={() => setStep(2)} 
                disabled={!businessName || !businessType}
                className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition-all"
              >
                Next Step <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button 
                onClick={handleAnalyze} 
                disabled={selectedStates.length === 0 || loading}
                className="bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-500/25 transition-all"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Generate Intelligence Map</>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
