import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import ControlsPanel from "../components/ControlsPanel";
import ExportButton from "../components/ExportButton";
import ImageDropZone from "../components/ImageDropZone";
import PreviewGrid from "../components/PreviewGrid";

export const Route = createFileRoute("/app-icon-maker")({
  component: AppIconMaker,
});

function AppIconMaker() {
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [squarePadding, setSquarePadding] = useState(15);
  const [roundPadding, setRoundPadding] = useState(15);
  const [bgColor, setBgColor] = useState("#4285F4");

  const handleImageLoad = useCallback((img: HTMLImageElement) => {
    setSourceImage(img);
  }, []);

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
        {/* Left panel — controls */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-sm">Source Image</h2>
              <ImageDropZone onImageLoad={handleImageLoad} />
              <ExportButton
                sourceImage={sourceImage}
                squarePadding={squarePadding}
                roundPadding={roundPadding}
                bgColor={bgColor}
              />
            </div>
          </div>

          <div className="card bg-base-200 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-sm">Settings</h2>
              <ControlsPanel
                squarePadding={squarePadding}
                roundPadding={roundPadding}
                onSquarePaddingChange={setSquarePadding}
                onRoundPaddingChange={setRoundPadding}
                bgColor={bgColor}
                onBgColorChange={setBgColor}
              />
            </div>
          </div>
        </div>

        {/* Right panel — preview */}
        <div className="flex-1 card bg-base-200 shadow-sm">
          <div className="card-body">
            <PreviewGrid
              sourceImage={sourceImage}
              squarePadding={squarePadding}
              roundPadding={roundPadding}
              bgColor={bgColor}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
