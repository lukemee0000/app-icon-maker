import { useMemo } from "react";
import type { IconShape } from "../lib/iconRenderer";
import { DENSITIES, renderIconToDataURL } from "../lib/iconRenderer";

interface PreviewGridProps {
  sourceImage: HTMLImageElement | null;
  squarePadding: number;
  roundPadding: number;
  bgColor: string;
}

function PreviewCard({
  label,
  size,
  dataUrl,
  shape,
}: {
  label: string;
  size: number;
  dataUrl: string;
  shape: IconShape;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="bg-base-200 flex items-center justify-center max-w-full"
        style={{
          width: size,
          height: size,
          borderRadius: shape === "round" ? "50%" : size * 0.1,
          overflow: "hidden",
        }}
      >
        <img
          src={dataUrl}
          alt={`${label} ${shape}`}
          width={size}
          height={size}
          style={{ imageRendering: size < 80 ? "pixelated" : "auto" }}
        />
      </div>
      <span className="text-xs opacity-50">
        {size}×{size}
      </span>
    </div>
  );
}

function PreviewGrid({
  sourceImage,
  squarePadding,
  roundPadding,
  bgColor,
}: PreviewGridProps) {
  const previews = useMemo(() => {
    if (!sourceImage) return null;

    return DENSITIES.map((density) => ({
      density,
      square: renderIconToDataURL(
        sourceImage,
        density.size,
        squarePadding,
        bgColor,
        "square",
      ),
      round: renderIconToDataURL(
        sourceImage,
        density.size,
        roundPadding,
        bgColor,
        "round",
      ),
    }));
  }, [sourceImage, squarePadding, roundPadding, bgColor]);

  if (!previews) {
    return (
      <div className="flex items-center justify-center text-center h-full opacity-40">
        <p>Upload an image to see previews</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm opacity-70">Preview</h3>
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Density</th>
              <th className="text-center">Square</th>
              <th className="text-center">Round</th>
            </tr>
          </thead>
          <tbody>
            {previews.map(({ density, square, round }) => (
              <tr key={density.name}>
                <td>
                  <div>
                    <span className="font-mono text-sm">{density.name}</span>
                  </div>
                </td>
                <td>
                  <div className="flex justify-center">
                    <PreviewCard
                      label={density.name}
                      size={density.size}
                      dataUrl={square}
                      shape="square"
                    />
                  </div>
                </td>
                <td>
                  <div className="flex justify-center">
                    <PreviewCard
                      label={density.name}
                      size={density.size}
                      dataUrl={round}
                      shape="round"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PreviewGrid;
