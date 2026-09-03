"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportButtonProps {
  filename: string;
  rows: (string | number)[][];
}

function exportCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function ExportButton({
  filename,
  rows,
}: ExportButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => exportCsv(filename, rows)}
    >
      <Download className="mr-2 h-4 w-4" />
      Export CSV
    </Button>
  );
}