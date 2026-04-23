"use client";

import { useActionState, useState } from 'react';
import { completeOnboarding } from '@/app/login/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { id: 'business', title: 'Business Info', description: 'Tell us about your store' },
  { id: 'theme', title: 'Brand Identity', description: 'Choose your signature color' },
  { id: 'features', title: 'Capabilities', description: 'Enable specialized modules' }
];

const COLORS = [
  { name: 'Classic Blue', value: '#3B82F6' },
  { name: 'Steel Red', value: '#ef4444' },
  { name: 'Forest Green', value: '#10B981' },
  { name: 'Royal Purple', value: '#8B5CF6' },
  { name: 'Slate Gray', value: '#475569' }
];

const AVAILABLE_FEATURES = [
  { id: 'digital_khata', name: 'Digital Khata', description: 'Track customer credit and payments' },
  { id: 'gst_vault', name: 'GST Vault', description: 'Secure digital billing and GST records' },
  { id: 'inventory_ai', name: 'AI Inventory', description: 'Predict stock needs with machine learning' }
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [state, formAction, isPending] = useActionState(completeOnboarding, null);

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  idx <= currentStep ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {idx + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
          <CardTitle className="text-2xl font-bold">{STEPS[currentStep].title}</CardTitle>
          <CardDescription>{STEPS[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business / Store Name</Label>
                    <Input id="business_name" name="business_name" placeholder="Joyram Steel" required />
                  </div>
                  <Button type="button" className="w-full mt-4" onClick={nextStep}>
                    Next: Branding
                  </Button>
                </motion.div>
              )}

              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <Label>Primary Brand Color</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {COLORS.map((color) => (
                      <label key={color.value} className="relative cursor-pointer group">
                        <input
                          type="radio"
                          name="theme_color"
                          value={color.value}
                          className="sr-only"
                          defaultChecked={color.value === '#3B82F6'}
                        />
                        <div className="flex flex-col items-center gap-2 p-3 border rounded-lg group-has-[:checked]:border-primary group-has-[:checked]:bg-primary/5">
                          <div className="w-8 h-8 rounded-full" style={{ backgroundColor: color.value }} />
                          <span className="text-[10px] text-center font-medium">{color.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button type="button" variant="outline" className="flex-1" onClick={prevStep}>Back</Button>
                    <Button type="button" className="flex-1" onClick={nextStep}>Next: Features</Button>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <Label>Select Active Modules</Label>
                  <div className="space-y-3">
                    {AVAILABLE_FEATURES.map((f) => (
                      <label key={f.id} className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <input type="checkbox" name="features" value={f.id} className="mt-1 h-4 w-4 rounded border-gray-300 text-primary" defaultChecked />
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{f.name}</span>
                          <span className="text-xs text-gray-500">{f.description}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  {state?.error && (
                    <p className="text-sm font-medium text-destructive">{state.error}</p>
                  )}
                  <div className="flex gap-3 mt-4">
                    <Button type="button" variant="outline" className="flex-1" onClick={prevStep} disabled={isPending}>Back</Button>
                    <Button type="submit" className="flex-1" disabled={isPending}>
                      {isPending ? 'Finalizing...' : 'Launch Store'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
