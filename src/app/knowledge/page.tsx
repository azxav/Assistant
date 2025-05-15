"use client"; // For file input handling and table state

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/common/PageHeader";
import { BookOpenText, UploadCloud, FileText, Trash2, AlertTriangle } from "lucide-react";
import React, { useState, ChangeEvent } from "react";
import { Progress } from "@/components/ui/progress";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: string; // e.g., "2.5 MB"
  uploadDate: string;
  status: 'processing' | 'completed' | 'failed';
}

const initialFiles: UploadedFile[] = [
  { id: "1", name: "product_manual_v2.pdf", type: "PDF", size: "2.3MB", uploadDate: "2024-07-15", status: "completed" },
  { id: "2", name: "faq_updates_q3.txt", type: "TXT", size: "150KB", uploadDate: "2024-07-14", status: "completed" },
  { id: "3", name: "api_documentation.pdf", type: "PDF", size: "5.1MB", uploadDate: "2024-07-16", status: "processing" },
];


export default function KnowledgePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(initialFiles);

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

    // Simulate upload
    const newFileEntry: UploadedFile = {
      id: String(Date.now()),
      name: selectedFile.name,
      type: selectedFile.type.split('/')[1]?.toUpperCase() || 'File',
      size: `${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB`,
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'processing',
    };
    setUploadedFiles(prev => [newFileEntry, ...prev]);


    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setUploadProgress(i);
    }
    
    setUploadedFiles(prev => prev.map(f => f.id === newFileEntry.id ? {...f, status: 'completed'} : f));
    setIsUploading(false);
    setSelectedFile(null); 
    // Reset file input visually if possible (browser specific)
    // Consider using a key on the input to force re-render or reset the form field
  };

  const handleDeleteFile = (fileId: string) => {
    // Simulate deletion
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    alert(`File with ID ${fileId} would be deleted.`);
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
