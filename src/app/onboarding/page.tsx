"use client";

import { useActionState, useState } from 'react';
import { completeOnboarding } from '@/app/login/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Receipt, Palette, Settings2, ShieldCheck, 
  Store, Truck, Briefcase, Phone, MapPin, Hash, Printer,
  CheckCircle2, ChevronRight, ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STEPS = [
  { id: 'business', title: 'Business Profile', description: 'Tell us about your organization', icon: Building2 },
  { id: 'tax', title: 'Tax & Compliance', description: 'Configure GST and billing rules', icon: Receipt },
  { id: 'operational', title: 'Operations', description: 'Configure invoice and hardware settings', icon: Settings2 },
  { id: 'branding', title: 'Brand Identity', description: 'Customize your visual presence', icon: Palette },
  { id: 'features', title: 'Modules', description: 'Enable specialized ERP tools', icon: ShieldCheck }
];

const INDUSTRIES = [
  { id: 'retail', name: 'Retail / Store', icon: Store },
  { id: 'distribution', name: 'Wholesale / Distribution', icon: Truck },
  { id: 'services', name: 'Services / Professional', icon: Briefcase },
  { id: 'manufacturing', name: 'Manufacturing', icon: Building2 }
];

const COLORS = [
  { name: 'Classic Blue', value: '#3B82F6' },
  { name: 'Steel Red', value: '#ef4444' },
  { name: 'Forest Green', value: '#10B981' },
  { name: 'Royal Purple', value: '#8B5CF6' },
  { name: 'Slate Gray', value: '#475569' }
];

const AVAILABLE_FEATURES = [
  { id: 'digital_khata', name: 'Digital Khata', description: 'Manage customer credit ledgers and automated reminders' },
  { id: 'gst_vault', name: 'GST Vault', description: 'Secure digital billing, GSTR data, and HSN compliance' },
  { id: 'inventory_ai', name: 'AI Inventory', description: 'Predictive stock ordering and visual inventory analysis' },
  { id: 'loyalty', name: 'Loyalty Engine', description: 'Reward repeat customers with point-based incentives' }
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [industry, setIndustry] = useState('retail');
  const [state, formAction, isPending] = useActionState(completeOnboarding, null);

  const nextStep = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const prevStep = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa] dark:bg-zinc-950 p-4 md:p-8">
      <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20"></div>

      <Card className="w-full max-w-4xl border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row h-full">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-72 bg-zinc-50 dark:bg-zinc-800/50 p-8 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800 flex flex-col gap-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Settings2 className="text-white h-5 w-5" />
              </div>
              <div>
                <h1 className="font-black uppercase italic tracking-tighter text-sm">Enterprise</h1>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Setup Wizard</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {STEPS.map((step, idx) => (
                <div key={step.id} className={cn(
                  "flex items-center gap-3 p-3 rounded-2xl transition-all duration-300",
                  idx === currentStep ? "bg-white dark:bg-zinc-800 shadow-md translate-x-1" : "opacity-40"
                )}>
                  <div className={cn(
                    "h-8 w-8 rounded-xl flex items-center justify-center transition-colors",
                    idx <= currentStep ? "bg-primary text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"
                  )}>
                    {idx < currentStep ? <CheckCircle2 className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] font-black uppercase tracking-widest truncate">{step.title}</span>
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter truncate">Phase 0{idx + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 p-8 md:p-12">
            <form action={formAction} className="h-full flex flex-col">
              <AnimatePresence mode="wait">
                {currentStep === 0 && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black uppercase italic tracking-tight leading-none">Business Profile</h2>
                      <p className="text-zinc-500 text-sm font-medium">Your formal identity for invoices and tax reports.</p>
                    </div>

                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="business_name" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Business Name</Label>
                        <div className="relative">
                          <Store className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
                          <Input id="business_name" name="business_name" placeholder="Joyram Steel & Co." required className="h-12 pl-12 rounded-xl bg-zinc-50 border-zinc-100" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Industry Type</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {INDUSTRIES.map((ind) => (
                            <label key={ind.id} className="relative cursor-pointer group">
                              <input
                                type="radio"
                                name="industry"
                                value={ind.id}
                                className="sr-only"
                                checked={industry === ind.id}
                                onChange={() => setIndustry(ind.id)}
                              />
                              <div className={cn(
                                "flex flex-col items-center gap-2 p-4 border rounded-2xl transition-all",
                                industry === ind.id ? "border-primary bg-primary/5 shadow-inner" : "border-zinc-100 hover:border-zinc-200"
                              )}>
                                <ind.icon className={cn("h-6 w-6", industry === ind.id ? "text-primary" : "text-zinc-400")} />
                                <span className="text-[9px] text-center font-black uppercase tracking-widest">{ind.name}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Contact Phone</Label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
                            <Input id="phone" name="phone" placeholder="+91 ..." required className="h-12 pl-12 rounded-xl bg-zinc-50 border-zinc-100" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Store Address</Label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
                            <Input id="address" name="address" placeholder="Mumbai, India" required className="h-12 pl-12 rounded-xl bg-zinc-50 border-zinc-100" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button type="button" className="w-full h-14 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 group" onClick={nextStep}>
                      Next: Compliance <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </motion.div>
                )}

                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black uppercase italic tracking-tight leading-none">Tax & GST</h2>
                      <p className="text-zinc-500 text-sm font-medium">Enable GST features for professional billing.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest">Enable GST Billing</p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase">Required for B2B Invoices</p>
                          </div>
                          <CheckCircle2 className="text-primary h-6 w-6" />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="gstin" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">GSTIN Number</Label>
                          <div className="relative">
                            <Hash className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
                            <Input id="gstin" name="gstin" placeholder="22AAAAA0000A1Z5" className="h-12 pl-12 rounded-xl bg-white border-zinc-100 font-mono text-lg uppercase" />
                          </div>
                          <p className="text-[9px] text-zinc-400 italic">Leave blank if you are an unregistered dealer.</p>
                        </div>
                      </div>

                      <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex gap-3">
                        <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
                        <p className="text-[10px] font-medium text-amber-800 dark:text-amber-400 uppercase tracking-tight">GSTIN enables automatic SGST/CGST/IGST splitting on your invoices according to Indian regulations.</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button type="button" variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest" onClick={prevStep}>Back</Button>
                      <Button type="button" className="flex-[2] h-14 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 group" onClick={nextStep}>
                        Continue <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black uppercase italic tracking-tight leading-none">Operations</h2>
                      <p className="text-zinc-500 text-sm font-medium">Fine-tune your daily workflow settings.</p>
                    </div>

                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="invoice_prefix" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Invoice Number Prefix</Label>
                        <Input id="invoice_prefix" name="invoice_prefix" placeholder="INV" defaultValue="INV" className="h-12 rounded-xl bg-zinc-50 border-zinc-100 font-black uppercase tracking-[0.2em]" />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Receipt Printer Width</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {['58mm', '80mm'].map((w) => (
                            <label key={w} className="relative cursor-pointer group">
                              <input type="radio" name="printer_width" value={w} className="sr-only" defaultChecked={w === '80mm'} />
                              <div className="flex items-center gap-3 p-4 border rounded-2xl border-zinc-100 group-has-[:checked]:border-primary group-has-[:checked]:bg-primary/5 transition-all">
                                <Printer className="h-5 w-5 text-zinc-400 group-has-[:checked]:text-primary" />
                                <span className="text-xs font-black uppercase tracking-widest">{w} Thermal</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button type="button" variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest" onClick={prevStep}>Back</Button>
                      <Button type="button" className="flex-[2] h-14 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 group" onClick={nextStep}>
                        Finalize Branding <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black uppercase italic tracking-tight leading-none">Branding</h2>
                      <p className="text-zinc-500 text-sm font-medium">Choose your signature look and feel.</p>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Theme Color</Label>
                      <div className="grid grid-cols-5 gap-3">
                        {COLORS.map((color) => (
                          <label key={color.value} className="relative cursor-pointer group">
                            <input
                              type="radio"
                              name="theme_color"
                              value={color.value}
                              className="sr-only"
                              defaultChecked={color.value === '#3B82F6'}
                            />
                            <div className="flex flex-col items-center gap-2 p-2 border rounded-2xl group-has-[:checked]:border-primary group-has-[:checked]:bg-primary/5 transition-all">
                              <div className="w-10 h-10 rounded-xl shadow-lg" style={{ backgroundColor: color.value }} />
                              <span className="text-[8px] text-center font-black uppercase tracking-tighter truncate w-full">{color.name}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button type="button" variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest" onClick={prevStep}>Back</Button>
                      <Button type="button" className="flex-[2] h-14 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 group" onClick={nextStep}>
                        Select Modules <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black uppercase italic tracking-tight leading-none">Deployment</h2>
                      <p className="text-zinc-500 text-sm font-medium">Enable the tools you need for your business.</p>
                    </div>

                    <div className="grid gap-3">
                      {AVAILABLE_FEATURES.map((f) => (
                        <label key={f.id} className="flex items-start gap-4 p-5 border rounded-3xl cursor-pointer hover:bg-zinc-50/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all group">
                          <input type="checkbox" name="features" value={f.id} className="mt-1.5 h-5 w-5 rounded-lg border-zinc-300 text-primary accent-primary" defaultChecked />
                          <div className="flex flex-col">
                            <span className="font-black text-xs uppercase tracking-tight italic group-hover:text-primary transition-colors">{f.name}</span>
                            <span className="text-[11px] text-zinc-500 font-medium leading-tight mt-1">{f.description}</span>
                          </div>
                        </label>
                      ))}
                    </div>

                    {state?.error && (
                      <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest border border-red-100">{state.error}</div>
                    )}

                    <div className="flex gap-4">
                      <Button type="button" variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest" onClick={prevStep} disabled={isPending}>Back</Button>
                      <Button type="submit" className="flex-[2] h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black uppercase tracking-widest rounded-2xl shadow-2xl active:scale-95 transition-all group" disabled={isPending}>
                        {isPending ? 'Deploying...' : 'Launch Workspace'} <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>
      </Card>
    </div>
  );
}
