"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";

export function TokenDebug() {
  const [tokenStatus, setTokenStatus] = useState<{
    hasToken: boolean;
    tokenLength: number;
    tokenPreview: string;
  }>({
    hasToken: false,
    tokenLength: 0,
    tokenPreview: "",
  });

  const checkToken = () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("google_calendar_access_token");
      setTokenStatus({
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? token.substring(0, 20) + "..." : "",
      });
    }
  };

  useEffect(() => {
    checkToken();
  }, []);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Token Debug
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge
              variant={tokenStatus.hasToken ? "default" : "destructive"}
              className={
                tokenStatus.hasToken ? "bg-green-100 text-green-800" : ""
              }
            >
              {tokenStatus.hasToken ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Token Found
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  No Token
                </>
              )}
            </Badge>
          </div>

          {tokenStatus.hasToken && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Token Length: {tokenStatus.tokenLength}
              </p>
              <p className="text-sm text-gray-600">
                Token Preview: {tokenStatus.tokenPreview}
              </p>
            </div>
          )}

          <Button onClick={checkToken} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Token Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
