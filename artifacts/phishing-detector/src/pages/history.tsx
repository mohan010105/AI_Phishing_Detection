import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { useGetScanHistory, getGetScanHistoryQueryKey, ScanResultType } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { RiskBadge } from "@/components/risk-badge";
import { Link as LinkIcon, Mail, Database, ChevronLeft, ChevronRight } from "lucide-react";

export default function History() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState<ScanResultType | "all">("all");
  const limit = 10;

  const queryParams = {
    page,
    limit,
    ...(type !== "all" ? { type } : {})
  };

  const { data, isLoading } = useGetScanHistory(queryParams, {
    query: {
      queryKey: getGetScanHistoryQueryKey(queryParams),
      placeholderData: keepPreviousData,
    }
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            Scan Ledger
          </h1>
          <p className="text-muted-foreground mt-1">Immutable record of all previous threat analyses.</p>
        </div>

        <div className="flex justify-between items-center bg-card/50 p-4 rounded-lg border border-border">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Filter by Vector:</span>
            <Select value={type} onValueChange={(val) => { setType(val as ScanResultType | "all"); setPage(1); }}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="All Vectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vectors</SelectItem>
                <SelectItem value="url">URL Target</SelectItem>
                <SelectItem value="email">Email Payload</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground font-mono">
            {data ? `Total Records: ${data.total}` : "Loading..."}
          </div>
        </div>

        <Card className="border-border shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow>
                  <TableHead className="w-[100px]">Vector</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead className="w-[120px]">Score</TableHead>
                  <TableHead className="w-[150px]">Classification</TableHead>
                  <TableHead className="w-[200px]">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    </TableRow>
                  ))
                ) : !data || data.scans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No records found matching criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.scans.map((scan) => (
                    <TableRow key={scan.id} className="hover:bg-secondary/20">
                      <TableCell>
                        {scan.type === 'url' ? (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1">
                            <LinkIcon className="h-3 w-3" /> URL
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-chart-5/10 text-chart-5 border-chart-5/20 gap-1">
                            <Mail className="h-3 w-3" /> Email
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[300px] truncate" title={scan.target}>
                        {scan.type === 'email' ? 'Email Payload Analysis' : scan.target}
                      </TableCell>
                      <TableCell className="font-mono font-bold">
                        <span className={
                          scan.riskScore >= 75 ? "text-destructive" :
                          scan.riskScore >= 40 ? "text-chart-4" : "text-chart-3"
                        }>
                          {scan.riskScore}
                        </span>
                        <span className="text-muted-foreground">/100</span>
                      </TableCell>
                      <TableCell>
                        <RiskBadge level={scan.riskLevel} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(scan.createdAt), "MMM d, yyyy HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {data && data.total > limit && (
          <div className="flex items-center justify-between border border-border bg-card/50 p-4 rounded-lg">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
