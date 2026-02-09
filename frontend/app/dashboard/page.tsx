"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  FileText,
  Loader2,
  Trash2,
  Download,
  Eye,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getDocuments, deleteDocument, type Document } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function Dashboard() {
  const router = useRouter()
  const { token, isAuthenticated, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/sign-in")
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchDocuments()
    }
  }, [isAuthenticated, token])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      if (!token) return

      const response = await getDocuments(token, { limit: 10 })
      if (response.success && response.data) {
        setDocuments(response.data.documents)
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    try {
      setDeleting(documentId)
      if (!token) return

      const response = await deleteDocument(token, documentId)
      if (response.success) {
        setDocuments((prev) => prev.filter((doc) => doc._id !== documentId))
        toast({
          title: "Success",
          description: "Document deleted successfully",
        })
      }
    } catch (error) {
      console.error("Error deleting document:", error)
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      })
    } finally {
      setDeleting(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">St. Aurora General Hospital</h1>
          <p className="text-muted-foreground">
            123 Health Ave, Wellness City, 560001 • +91-80-1234-5678 • info@staurora.org
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Documents Processed</CardTitle>
                <FileText className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{documents.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Total uploaded PDFs</p>
            </CardContent>
          </Card>

          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Successfully Processed</CardTitle>
                <FileText className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {documents.filter(d => d.processingStatus === 'completed').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Completed with Gemini analysis</p>
            </CardContent>
          </Card>
        </div>


        {/* Processed Documents */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Processed Medical Documents</CardTitle>
            <CardDescription>
              PDF documents processed with OCR and extracted medical data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload your first PDF document to get started
                </p>
                <Button asChild>
                  <a href="/upload">Upload Document</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((doc) => {
                  const medicalTerms = Array.isArray(doc.extractedData?.medicalTerms)
                    ? doc.extractedData.medicalTerms
                    : [];
                  const dates = Array.isArray(doc.extractedData?.dates)
                    ? doc.extractedData.dates
                    : [];
                  const emails = Array.isArray(doc.extractedData?.emails)
                    ? doc.extractedData.emails
                    : [];
                  const phones = Array.isArray(doc.extractedData?.phones)
                    ? doc.extractedData.phones
                    : [];

                  return (
                    <div
                      key={doc._id}
                      className="p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <FileText className="w-8 h-8 text-primary mt-1" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground truncate">{doc.fileName}</h4>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                              <span>{formatFileSize(doc.fileSize)}</span>
                              <span>•</span>
                              <span>{formatDate(doc.createdAt)}</span>
                              {doc.metadata.pageCount && (
                                <>
                                  <span>•</span>
                                  <span>{doc.metadata.pageCount} pages</span>
                                </>
                              )}
                            </div>
                            <div className="mt-2">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  doc.processingStatus === "completed"
                                    ? "bg-green-500/20 text-green-600"
                                    : doc.processingStatus === "processing"
                                      ? "bg-blue-500/20 text-blue-600"
                                      : doc.processingStatus === "failed"
                                        ? "bg-destructive/20 text-destructive"
                                        : "bg-yellow-500/20 text-yellow-600"
                                }`}
                              >
                                {doc.processingStatus === "completed" && `✓ Completed (${doc.ocrConfidence}% confidence)`}
                                {doc.processingStatus === "processing" && "⏳ Processing..."}
                                {doc.processingStatus === "failed" && "✗ Failed"}
                                {doc.processingStatus === "pending" && "⏸ Pending"}
                              </span>
                            </div>
                            {doc.processingStatus === "completed" && doc.extractedData && (
                              <div className="mt-3 p-3 bg-background rounded border border-border">
                                <p className="text-xs font-semibold text-foreground mb-3">
                                  Extracted Information:
                                </p>
                                <div className="space-y-2 text-xs">
                                  {medicalTerms.length > 0 && (
                                    <div>
                                      <p className="text-muted-foreground font-medium">Medical Terms ({medicalTerms.length}):</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {medicalTerms.map((item, idx) => {
                                          const isObject = item && typeof item === "object";
                                          const termText = isObject ? (item as any).term ?? "" : item;
                                          const explanationText = isObject ? (item as any).explanation : undefined;

                                          if (!termText && !explanationText) {
                                            return null;
                                          }

                                          return (
                                            <span key={idx} className="bg-blue-500/10 text-blue-600 px-2 py-1 rounded text-xs">
                                              {termText || "Term"}
                                              {explanationText && (
                                                <span className="ml-1 text-[10px] text-blue-700/80">
                                                  - {explanationText}
                                                </span>
                                              )}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  {dates.length > 0 && (
                                    <div>
                                      <p className="text-muted-foreground font-medium">Dates Found ({dates.length}):</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {dates.map((item, idx) => {
                                          const isObject = item && typeof item === "object";
                                          const dateText = isObject ? (item as any).date ?? "" : item;
                                          const contextText = isObject ? (item as any).context : undefined;

                                          if (!dateText && !contextText) {
                                            return null;
                                          }

                                          return (
                                            <span key={idx} className="bg-green-500/10 text-green-600 px-2 py-1 rounded text-xs">
                                              {dateText || "Date"}
                                              {contextText && (
                                                <span className="ml-1 text-[10px] text-green-700/80">
                                                  - {contextText}
                                                </span>
                                              )}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  {emails.length > 0 && (
                                    <div>
                                      <p className="text-muted-foreground font-medium">Emails ({emails.length}):</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {emails.map((email, idx) => (
                                          <span key={idx} className="bg-purple-500/10 text-purple-600 px-2 py-1 rounded text-xs break-all">
                                            {email}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {phones.length > 0 && (
                                    <div>
                                      <p className="text-muted-foreground font-medium">Phone Numbers ({phones.length}):</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {phones.map((phone, idx) => (
                                          <span key={idx} className="bg-orange-500/10 text-orange-600 px-2 py-1 rounded text-xs">
                                            {phone}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {doc.ocrText && (
                                  <div className="mt-3 pt-3 border-t border-border">
                                    <p className="text-xs font-semibold text-foreground mb-1">Full Text Preview:</p>
                                    <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                                      {doc.ocrText.substring(0, 300)}
                                      {doc.ocrText.length > 300 && "..."}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                            {doc.processingStatus === "failed" && doc.errorMessage && (
                              <p className="mt-2 text-xs text-destructive">{doc.errorMessage}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(doc._id)}
                          disabled={deleting === doc._id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {deleting === doc._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
