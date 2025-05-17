
"use client"; // For file input handling and table state

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/common/PageHeader";
import { BookOpenText, UploadCloud, FileText, Trash2, AlertTriangle } from "lucide-react";
import React, { useState, ChangeEvent, useEffect } from "react";
import { Progress } from "@/components/ui/progress";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: string; // e.g., "2.5 MB"
  uploadDate: string;
  status: 'processing' | 'completed' | 'failed';
}

const initialFiles: UploadedFile[] = [];

export default function KnowledgePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(initialFiles);

  useEffect(() => {
    // fetch current docs on page load
    fetch("/api/kb/knowledgebase")
      .then(r => r.json())
      .then(data => {
        const rows = data.documents.map((d: any) => ({
          id: d.file_path,
          name: d.file_path.split(/[/\\]/).pop(),
          type: d.file_path.endsWith(".pdf") ? "PDF" : "TXT",
          size: `${d.chunks} chunks`,
          uploadDate: new Date(d.metadata?.indexed_at ?? Date.now()).toISOString().split("T")[0],
          status: "completed",
        }));
        setUploadedFiles(rows);
      })
      .catch(err => {
        console.error("Failed to fetch knowledge base:", err);
      });
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setUploadProgress(0); // Reset progress for new file
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);

    const tempId = String(Date.now()); 
    const currentSelectedFile = selectedFile; // Capture selectedFile at this moment
    const newFileEntry: UploadedFile = {
      id: tempId,
      name: currentSelectedFile.name,
      type: currentSelectedFile.type.split('/')[1]?.toUpperCase() || 'File',
      size: `${(currentSelectedFile.size / (1024 * 1024)).toFixed(1)}MB`,
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'processing',
    };
    setUploadedFiles(prev => [newFileEntry, ...prev]);

    let uploadStepError = null;

    try {
      const formData = new FormData();
      formData.append("file", currentSelectedFile);

      for (let i = 0; i <= 30; i += 5) {
        await new Promise(resolve => setTimeout(resolve, 30));
        setUploadProgress(i);
      }

      const uploadResponse = await fetch("/api/kb/upload-file", {
        method: "POST",
        body: formData,
      });

      for (let i = 31; i <= 70; i += 2) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setUploadProgress(i);
      }

      if (!uploadResponse.ok) {
        let errorJson;
        try {
          errorJson = await uploadResponse.json();
          uploadStepError = `Upload API call failed: ${errorJson?.detail?.error || errorJson?.detail || errorJson?.message || `status ${uploadResponse.status}`}`;
        } catch (e) {
          uploadStepError = `Upload API call failed: ${uploadResponse.statusText || `status ${uploadResponse.status}`}`;
        }
        throw new Error(uploadStepError);
      }

      const result = await uploadResponse.json();

      if (!result.success) {
        uploadStepError = `Backend processing failed: ${result.message || "Unknown backend error."}`;
        throw new Error(uploadStepError);
      }
      
      for (let i = 71; i <= 100; i += 3) {
        await new Promise(resolve => setTimeout(resolve, 40));
        setUploadProgress(i);
      }

      alert(`File '${currentSelectedFile.name}' acknowledged by server. Refreshing list...`);
      
      await new Promise(resolve => setTimeout(resolve, 1500)); 

      const kbResponse = await fetch("/api/kb/knowledgebase");
      if (!kbResponse.ok) {
        let errorJson;
        try {
            errorJson = await kbResponse.json();
            uploadStepError = `Failed to refresh list: ${errorJson?.detail?.error || errorJson?.detail || errorJson?.message || `status ${kbResponse.status}`}`;
        } catch(e) {
            uploadStepError = `Failed to refresh list: ${kbResponse.statusText || `status ${kbResponse.status}`}`;
        }
        throw new Error(uploadStepError);
      }
      const kbData = await kbResponse.json();
      
      const rows = kbData.documents.map((d: any) => ({
        id: d.file_path, 
        name: d.file_path.split(/[/\\]/).pop(),
        type: d.file_path.endsWith(".pdf") ? "PDF" : "TXT",
        size: `${d.chunks} chunks`,
        uploadDate: new Date(d.metadata?.indexed_at ?? d.metadata?.timestamp ?? Date.now()).toISOString().split("T")[0],
        status: "completed", 
      }));
      
      setUploadedFiles(rows); // Replace completely with the fresh list from backend

    } catch (error: any) {
      console.error("Upload process failed:", error.message);
      alert(`Upload failed: ${uploadStepError || error.message}`); // Prioritize specific step error
      setUploadedFiles(prev => prev.map(f => 
        f.id === tempId ? {...f, status: 'failed'} : f
      ));
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      setUploadProgress(0);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      // Real deletion
      await fetch("/api/kb/delete-index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: fileId })
      });

      // Update UI
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      console.error(`Failed to delete file ${fileId}:`, error);
      alert(`Error deleting file: ${error}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title="Knowledge Base"
        description="Upload and manage documents for your AI assistants to learn from."
        icon={BookOpenText}
      />
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Upload New Document</CardTitle>
            <CardDescription>Supported formats: PDF, TXT. Max file size: 10MB.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="document-upload">Select Document</Label>
              <Input id="document-upload" type="file" accept=".pdf,.txt" onChange={handleFileChange} disabled={isUploading} />
            </div>
            {selectedFile && !isUploading && (
              <p className="text-sm text-muted-foreground">Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</p>
            )}
            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-primary">Uploading {selectedFile?.name}... {uploadProgress}%</p>
              </div>
            )}
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
              <UploadCloud className="mr-2 h-4 w-4" /> {isUploading ? "Uploading..." : "Upload Document"}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
            <CardDescription>Manage your existing knowledge base files.</CardDescription>
          </CardHeader>
          <CardContent>
            {uploadedFiles.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No documents uploaded yet.</p>
                <p className="text-sm text-muted-foreground">Start by uploading files using the form above.</p>
              </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Size</TableHead>
                  <TableHead className="hidden sm:table-cell">Upload Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploadedFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      {file.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{file.type}</TableCell>
                    <TableCell className="hidden md:table-cell">{file.size}</TableCell>
                    <TableCell className="hidden sm:table-cell">{file.uploadDate}</TableCell>
                    <TableCell>
                      {file.status === 'completed' && <span className="text-green-600 font-medium">Completed</span>}
                      {file.status === 'processing' && <span className="text-yellow-600 font-medium">Processing...</span>}
                      {file.status === 'failed' && <span className="text-red-600 font-medium">Failed</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteFile(file.id)} aria-label="Delete file">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
