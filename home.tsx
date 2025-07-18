import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Shield, Globe, Settings, HelpCircle, Download } from "lucide-react";
import BackupForm from "@/components/backup-form";
import BackupStatus from "@/components/backup-status";
import BackupHistory from "@/components/backup-history";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const [activeJobId, setActiveJobId] = useState<number | null>(null);

  const { data: recentBackups } = useQuery({
    queryKey: ['/api/backups/recent'],
    refetchInterval: 5000,
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="text-primary-foreground" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">WordPress Backup Tool</h1>
                <p className="text-sm text-slate-500">ابزار حرفه‌ای پشتیبان‌گیری وردپرس</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <Button variant="ghost" size="sm">
                <HelpCircle size={18} />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings size={18} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <BackupForm onBackupStart={setActiveJobId} />
          </div>

          {/* Right Column - Status & Info */}
          <div className="space-y-6">
            <BackupStatus jobId={activeJobId} />
            
            {/* Quick Info Card */}
            <Card className="bg-white shadow-sm border border-slate-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">راهنمای سریع</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-semibold text-blue-600">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">آدرس وب‌سایت را وارد کنید</p>
                      <p className="text-xs text-slate-500 mt-1">URL کامل شامل http یا https</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-semibold text-blue-600">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">نوع پشتیبان را انتخاب کنید</p>
                      <p className="text-xs text-slate-500 mt-1">کامل یا فقط دیتابیس</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-semibold text-blue-600">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">پشتیبان‌گیری را شروع کنید</p>
                      <p className="text-xs text-slate-500 mt-1">منتظر تکمیل پردازش باشید</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <BackupHistory />
          </div>
        </div>
      </div>
    </div>
  );
}
