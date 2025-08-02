"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  Users,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";

interface ClientImportExportProps {
  orgId: string | undefined;
}

export function ClientImportExport({ orgId }: ClientImportExportProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Show loading state if orgId is not available
  if (!orgId) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            disabled
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Import Clients
          </Button>
          <Button
            variant="outline"
            disabled
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Clients
          </Button>
          <Button
            variant="outline"
            disabled
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Sync
          </Button>
        </div>
        <p className="text-sm text-gray-500">Loading organization data...</p>
      </div>
    );
  }

  const { toast } = useToast();
  const importClients = useMutation(api.clients.importClients);

  // Wrap the query in a try-catch to handle potential errors
  let exportClients;
  try {
    if (orgId) {
      exportClients = useQuery(api.clients.exportClients, {
        orgId: orgId as any,
      });
    } else {
      exportClients = null;
    }
  } catch (error) {
    console.error("Failed to load export data:", error);
    exportClients = null;
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid CSV file.",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !orgId) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      const text = await selectedFile.text();
      const results = await importClients({
        orgId: orgId as any,
        csvData: text,
        importSource: selectedFile.name,
      });

      setImportResults(results);
      setImportProgress(100);

      toast({
        title: "Import Complete",
        description: `Imported ${results.imported} clients, skipped ${results.skipped} duplicates.`,
      });

      if (results.errors.length > 0) {
        toast({
          title: "Import Errors",
          description: `${results.errors.length} errors occurred during import.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Import failed:", error);
      toast({
        title: "Import Failed",
        description: "Failed to import clients. Please check your file format.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      if (exportClients && typeof exportClients === "string") {
        const blob = new Blob([exportClients], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `clients-export-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Export Complete",
          description: "Client data has been exported successfully.",
        });
      } else {
        throw new Error("No export data available");
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export clients. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSync = () => {
    // TODO: Implement sync functionality
    toast({
      title: "Sync Feature",
      description: "Sync functionality will be implemented soon.",
    });
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => setImportDialogOpen(true)}
          variant="outline"
          className="flex items-center gap-2"
          data-theme-aware="true"
          data-variant="light"
        >
          <Upload className="h-4 w-4" />
          Import Clients
        </Button>

        <Button
          onClick={() => setExportDialogOpen(true)}
          variant="outline"
          className="flex items-center gap-2"
          data-theme-aware="true"
          data-variant="light"
        >
          <Download className="h-4 w-4" />
          Export Clients
        </Button>

        <Button
          onClick={() => setSyncDialogOpen(true)}
          variant="outline"
          className="flex items-center gap-2"
          data-theme-aware="true"
          data-variant="light"
        >
          <RefreshCw className="h-4 w-4" />
          Sync
        </Button>
      </div>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Clients
            </DialogTitle>
            <DialogDescription>
              Upload a CSV file to import clients. Duplicate clients (based on
              email, phone, or name) will be skipped.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!isImporting && (
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                />
                {selectedFile && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    {selectedFile.name}
                  </div>
                )}
              </div>
            )}

            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Importing clients...</span>
                  <span>{importProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            )}

            {importResults && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Import Complete</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>Imported: {importResults.imported} clients</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4 text-orange-500" />
                    <span>Skipped: {importResults.skipped} duplicates</span>
                  </div>
                  {importResults.errors.length > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span>Errors: {importResults.errors.length}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setImportDialogOpen(false);
                setSelectedFile(null);
                setImportResults(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isImporting || !orgId}
              className="bg-pink-600 hover:bg-pink-700"
            >
              {isImporting ? "Importing..." : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Clients
            </DialogTitle>
            <DialogDescription>
              Export all clients to a CSV file. The file will include all client
              information and can be used for backup or migration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Export includes:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Basic client information</li>
                <li>• Contact details</li>
                <li>• Address information</li>
                <li>• Business data</li>
                <li>• Status and tracking</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExportDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || !exportClients || !orgId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sync Dialog */}
      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Sync Clients
            </DialogTitle>
            <DialogDescription>
              Sync client data with external systems. This feature will be
              available soon.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Coming Soon</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Sync functionality will allow you to connect with external systems
              and keep client data synchronized.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSyncDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
