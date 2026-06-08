import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetScanHistory, getGetScanHistoryQueryKey, ScanResultType } from "@/services";
import { keepPreviousData } from "@tanstack/react-query";
import { format } from "date-fns";
import { RiskBadge } from "@/components/risk-badge";
import { FileText, Download, Link as LinkIcon, Mail, Filter, ChevronLeft, ChevronRight, FileJson, FileDown } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

type RiskFilter = "all" | "safe" | "suspicious" | "high_risk";

type ScanRow = {
  id: number;
  type: string;
  target: string;
  riskScore: number;
  riskLevel: string;
  createdAt: string;
};

function exportCsv(rows: ScanRow[]) {
  const headers = ["ID", "Type", "Target", "Risk Score", "Risk Level", "Scanned At"];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [r.id, r.type, `"${r.target.replace(/"/g, '""')}"`, r.riskScore, r.riskLevel, r.createdAt].join(",")
    ),
  ];
  download(lines.join("\n"), "phishguard-report.csv", "text/csv");
}

function exportJson(rows: ScanRow[]) {
  download(JSON.stringify(rows, null, 2), "phishguard-report.json", "application/json");
}

function exportPdf(rows: ScanRow[]) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  let y = margin;

  // Header
  doc.setFillColor(10, 25, 47);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(6, 182, 212);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("PHISHGUARD", margin, 14);
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text("AI Phishing Detection Platform — Threat Report", margin, 22);
  doc.setFontSize(9);
  doc.text(`Generated: ${format(new Date(), "PPpp")}`, 210 - margin, 22, { align: "right" });

  y = 38;

  // Summary box
  const high = rows.filter(r => r.riskLevel === "high_risk").length;
  const suspicious = rows.filter(r => r.riskLevel === "suspicious").length;
  const safe = rows.filter(r => r.riskLevel === "safe").length;

  doc.setFillColor(17, 34, 64);
  doc.roundedRect(margin, y, 182, 22, 3, 3, "F");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("Total Records", margin + 6, y + 7);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(String(rows.length), margin + 6, y + 16);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("High Risk", 80, y + 7);
  doc.setTextColor(239, 68, 68);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(String(high), 80, y + 16);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("Suspicious", 120, y + 7);
  doc.setTextColor(249, 115, 22);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(String(suspicious), 120, y + 16);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("Safe", 160, y + 7);
  doc.setTextColor(34, 197, 94);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(String(safe), 160, y + 16);

  y += 30;

  // Table header
  const colWidths = [12, 18, 90, 20, 30];
  const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2], margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]];
  const headers = ["ID", "Type", "Target", "Score", "Risk Level"];

  doc.setFillColor(17, 34, 64);
  doc.rect(margin, y, 182, 8, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(6, 182, 212);
  headers.forEach((h, i) => doc.text(h, colX[i] + 1, y + 5.5));
  y += 8;

  // Rows
  doc.setFont("helvetica", "normal");
  rows.forEach((row, idx) => {
    if (y > 270) {
      doc.addPage();
      y = margin;
    }

    const bg = idx % 2 === 0 ? [15, 28, 50] : [12, 22, 40];
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.rect(margin, y, 182, 7, "F");

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7.5);
    doc.text(`#${row.id}`, colX[0] + 1, y + 5);
    doc.text(row.type.toUpperCase(), colX[1] + 1, y + 5);

    const targetText = row.target.length > 52 ? row.target.slice(0, 50) + "…" : row.target;
    doc.text(targetText, colX[2] + 1, y + 5);
    doc.text(String(row.riskScore), colX[3] + 1, y + 5);

    const riskColor: [number, number, number] =
      row.riskLevel === "high_risk" ? [239, 68, 68] :
      row.riskLevel === "suspicious" ? [249, 115, 22] :
      [34, 197, 94];
    doc.setTextColor(...riskColor);
    doc.text(row.riskLevel.replace("_", " ").toUpperCase(), colX[4] + 1, y + 5);

    y += 7;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`PhishGuard AI Platform — Confidential — Page ${i} of ${pageCount}`, 210 / 2, 290, { align: "center" });
  }

  doc.save("phishguard-report.pdf");
}

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function rowsFromData(scans: { id: number; type: string; target: string; riskScore: number; riskLevel: string; createdAt: string }[]): ScanRow[] {
  return scans.map((s) => ({
    id: s.id,
    type: s.type,
    target: s.type === "email" ? "Email Payload" : s.target,
    riskScore: s.riskScore,
    riskLevel: s.riskLevel,
    createdAt: s.createdAt,
  }));
}

export default function Reports() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [type, setType] = useState<ScanResultType | "all">("all");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const limit = 20;

  const queryParams = {
    page,
    limit,
    ...(type !== "all" ? { type } : {}),
    ...(riskFilter !== "all" ? { riskLevel: riskFilter } : {}),
  };

  const { data, isLoading } = useGetScanHistory(queryParams, {
    query: {
      queryKey: getGetScanHistoryQueryKey(queryParams),
      placeholderData: keepPreviousData,
    },
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 1;
  const rows = data?.scans ? rowsFromData(data.scans) : [];

  const handleCsvExport = () => {
    if (!rows.length) { toast({ variant: "destructive", title: "No Data", description: "Apply filters or scan something first." }); return; }
    exportCsv(rows);
    toast({ title: "CSV Exported", description: `${rows.length} records downloaded.` });
  };

  const handleJsonExport = () => {
    if (!rows.length) { toast({ variant: "destructive", title: "No Data", description: "Apply filters or scan something first." }); return; }
    exportJson(rows);
    toast({ title: "JSON Exported", description: `${rows.length} records downloaded.` });
  };

  const handlePdfExport = () => {
    if (!rows.length) { toast({ variant: "destructive", title: "No Data", description: "Apply filters or scan something first." }); return; }
    exportPdf(rows);
    toast({ title: "PDF Exported", description: `${rows.length} records exported to PDF.` });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Threat Reports
            </h1>
            <p className="text-muted-foreground mt-1">Filter, review, and export your threat intelligence data.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCsvExport} className="gap-2 border-primary/30 hover:bg-primary/10">
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleJsonExport} className="gap-2 border-primary/30 hover:bg-primary/10">
              <FileJson className="h-4 w-4" /> JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handlePdfExport} className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10">
              <FileDown className="h-4 w-4" /> PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filter Parameters
              </CardTitle>
              <CardDescription>Narrow results before exporting to CSV, JSON, or PDF.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Vector:</span>
                  <Select value={type} onValueChange={(v: string) => { setType(v as ScanResultType | "all"); setPage(1); }}>
                    <SelectTrigger className="w-[150px] bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vectors</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Risk:</span>
                  <Select value={riskFilter} onValueChange={(v: string) => { setRiskFilter(v as RiskFilter); setPage(1); }}>
                    <SelectTrigger className="w-[160px] bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="safe">Safe</SelectItem>
                      <SelectItem value="suspicious">Suspicious</SelectItem>
                      <SelectItem value="high_risk">High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="ml-auto text-sm text-muted-foreground font-mono">
                  {data ? `${data.total} records` : "Loading..."}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Table */}
        <Card className="border-border shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead className="w-[100px]">Vector</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead className="w-[110px]">Score</TableHead>
                  <TableHead className="w-[140px]">Classification</TableHead>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !rows.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No records match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, idx) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-border hover:bg-secondary/20 transition-colors"
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">#{row.id}</TableCell>
                      <TableCell>
                        {row.type === "url" ? (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1">
                            <LinkIcon className="h-3 w-3" /> URL
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-chart-5/10 text-chart-5 border-chart-5/20 gap-1">
                            <Mail className="h-3 w-3" /> Email
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[280px] truncate" title={row.target}>
                        {row.target}
                      </TableCell>
                      <TableCell className="font-mono font-bold">
                        <span className={row.riskScore >= 61 ? "text-destructive" : row.riskScore >= 31 ? "text-chart-4" : "text-chart-3"}>
                          {row.riskScore}
                        </span>
                        <span className="text-muted-foreground">/100</span>
                      </TableCell>
                      <TableCell>
                        <RiskBadge level={row.riskLevel as "safe" | "suspicious" | "high_risk"} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(row.createdAt), "MMM d, yyyy HH:mm")}
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {data && data.total > limit && (
          <div className="flex items-center justify-between border border-border bg-card/50 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground">Page {page} of {totalPages}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
