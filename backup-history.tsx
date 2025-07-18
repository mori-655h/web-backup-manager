import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileArchive, Download, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function BackupHistory() {
  const { data: recentBackups, isLoading } = useQuery({
    queryKey: ['/api/backups/recent'],
    refetchInterval: 30000,
  });

  const handleDownload = async (jobId: number) => {
    try {
      const response = await fetch(`/api/backup/${jobId}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${jobId}-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">پشتیبان‌های اخیر</h3>
        
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg animate-pulse">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-4 h-4 bg-slate-300 rounded"></div>
                  <div>
                    <div className="w-24 h-3 bg-slate-300 rounded mb-1"></div>
                    <div className="w-16 h-2 bg-slate-300 rounded"></div>
                  </div>
                </div>
                <div className="w-6 h-6 bg-slate-300 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {recentBackups && recentBackups.length > 0 && (
          <div className="space-y-3">
            {recentBackups.map((backup: any) => (
              <div key={backup.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <FileArchive className="text-slate-400" size={16} />
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {new URL(backup.websiteUrl).hostname}
                    </p>
                    <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-500">
                      <Clock size={12} />
                      <span>
                        {formatDistanceToNow(new Date(backup.createdAt), { 
                          addSuffix: true
                        })}
                      </span>
                      <span>•</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        backup.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : backup.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                      }`}>
                        {backup.status === 'completed' ? 'کامل' : 
                         backup.status === 'failed' ? 'ناموفق' : 'در حال پردازش'}
                      </span>
                    </div>
                  </div>
                </div>
                {backup.status === 'completed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(backup.id)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Download size={16} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {recentBackups && recentBackups.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <FileArchive className="mx-auto mb-2" size={24} />
            <p className="text-sm">هنوز پشتیبانی ایجاد نشده است</p>
          </div>
        )}

        {recentBackups && recentBackups.length > 0 && (
          <div className="text-center pt-4 border-t border-slate-200 mt-4">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-blue-600">
              مشاهده همه
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
