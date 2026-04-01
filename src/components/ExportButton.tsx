import { useCallback, useState } from "react";
import { Download } from "lucide-react";
import { exportZip } from "../lib/exportZip";

interface ExportButtonProps {
  sourceImage: HTMLImageElement | null;
  squarePadding: number;
  roundPadding: number;
  bgColor: string;
}

function ExportButton({
  sourceImage,
  squarePadding,
  roundPadding,
  bgColor,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!sourceImage) return;
    setIsExporting(true);
    try {
      await exportZip(sourceImage, squarePadding, roundPadding, bgColor);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, [sourceImage, squarePadding, roundPadding, bgColor]);

  return (
    <button
      type="button"
      className="btn btn-primary btn-md"
      disabled={!sourceImage || isExporting}
      onClick={handleExport}
    >
      {isExporting ? (
        <>
          <span className="loading loading-spinner loading-sm" />
          Exporting…
        </>
      ) : (
        <>
          <Download className="size-4" />
          Export ZIP
        </>
      )}
    </button>
  );
}

export default ExportButton;
