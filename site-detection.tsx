import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SiteDetectionProps {
  siteInfo: any;
  isValidating: boolean;
  isValidated: boolean;
}

export default function SiteDetection({ siteInfo, isValidating, isValidated }: SiteDetectionProps) {
  if (isValidating) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="font-medium text-blue-800">در حال بررسی وب‌سایت...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!siteInfo) {
    return null;
  }

  if (!siteInfo.isWordPress) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">وب‌سایت وردپرس تشخیص داده نشد</span>
          </div>
          <p className="text-sm text-red-700 mt-2">
            این ابزار فقط برای وب‌سایت‌های وردپرس قابل استفاده است.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-4">
        <div className="flex items-center space-x-2 space-x-reverse">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="font-medium text-green-800">وب‌سایت وردپرس تشخیص داده شد</span>
        </div>
        <div className="mt-3 space-y-2 text-sm text-green-700">
          {siteInfo.version && (
            <div className="flex justify-between">
              <span>نسخه وردپرس:</span>
              <span>{siteInfo.version}</span>
            </div>
          )}
          {siteInfo.theme && (
            <div className="flex justify-between">
              <span>قالب فعال:</span>
              <span>{siteInfo.theme}</span>
            </div>
          )}
          {siteInfo.hasRestApi !== undefined && (
            <div className="flex justify-between">
              <span>REST API:</span>
              <span>{siteInfo.hasRestApi ? "فعال" : "غیرفعال"}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
