import { Check, Loader2 } from "lucide-react";

interface ProgressStepsProps {
  currentStep: string | null;
  progress: number;
}

const steps = [
  { id: 1, label: "تشخیص نوع وب‌سایت", keyword: "تشخیص" },
  { id: 2, label: "استخراج محتوا", keyword: "استخراج" },
  { id: 3, label: "دانلود فایل‌ها", keyword: "دانلود" },
  { id: 4, label: "ایجاد فایل نهایی", keyword: "ایجاد" },
];

export default function ProgressSteps({ currentStep, progress }: ProgressStepsProps) {
  const getCurrentStepIndex = () => {
    if (!currentStep) return 0;
    
    const foundStep = steps.find(step => 
      currentStep.includes(step.keyword) || currentStep.includes(step.label)
    );
    
    return foundStep ? foundStep.id : Math.ceil((progress / 100) * steps.length);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="mt-6 space-y-3">
      {steps.map((step) => {
        const isCompleted = currentStepIndex > step.id;
        const isCurrent = currentStepIndex === step.id;
        const isPending = currentStepIndex < step.id;

        return (
          <div key={step.id} className="flex items-center space-x-3 space-x-reverse">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              isCompleted 
                ? "bg-green-100" 
                : isCurrent 
                  ? "bg-blue-600" 
                  : "bg-slate-200"
            }`}>
              {isCompleted && (
                <Check className="text-green-600" size={12} />
              )}
              {isCurrent && (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
              {isPending && (
                <span className="text-xs text-slate-500">{step.id}</span>
              )}
            </div>
            <span className={`text-sm ${
              isCompleted 
                ? "text-slate-600" 
                : isCurrent 
                  ? "text-slate-900 font-medium" 
                  : "text-slate-400"
            }`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
