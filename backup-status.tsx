import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Check, Download, AlertCircle } from "lucide-react";
import ProgressSteps from "./progress-steps";

interface BackupStatusProps {
  jobId: number | null;
}

export default function BackupStatus({ jobId }: BackupStatusProps) {
  const { data: job, isLoading } = useQuery({
    queryKey: ['/api/backup', jobId],
    enabled: !!jobId,
    refetchInterval: jobId ? 2000 : false,
  });

  const handleDownload = async () => {
    if (!job) return;
    
    const response = await fetch(`/api/backup/${job.id}/download`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">وضعیت فعلی</h3>
        
        {!jobId && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="text-slate-400" size={32} />
            </div>
            <p className="text-slate-500">آماده دریافت درخواست</p>
          </div>
        )}

        {jobId && isLoading && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-slate-500">در حال بارگذاری...</p>
          </div>
        )}

        {job && job.status === 'processing' && (
          <div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">در حال پردازش...</span>
                <span className="text-sm text-slate-500">{job.progress}%</span>
              </div>
              <Progress value={job.progress} className="w-full" />
              {job.currentStep && (
                <div className="text-sm text-slate-600">{job.currentStep}</div>
              )}
            </div>
            <ProgressSteps currentStep={job.currentStep} progress={job.progress} />
          </div>
        )}

        {job && job.status === 'completed' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="text-green-600" size={32} />
            </div>
            <h4 className="font-semibold text-slate-900 mb-2">پشتیبان‌گیری کامل شد!</h4>
            <p className="text-sm text-slate-500 mb-4">فایل پشتیبان آماده دانلود است</p>
            <Button onClick={handleDownload} className="bg-green-600 hover:bg-green-700">
              <Download className="ml-2" size={16} />
              دانلود فایل
            </Button>
          </div>
        )}

        {job && job.status === 'failed' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-red-600" size={32} />
            </div>
            <h4 className="font-semibold text-slate-900 mb-2">خطا در پشتیبان‌گیری</h4>
            <p className="text-sm text-slate-500 mb-4">
              {job.errorMessage || "خطای ناشناخته‌ای رخ داده است"}
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              تلاش مجدد
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
