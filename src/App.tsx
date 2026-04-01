import { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import ControlsPanel from "./components/ControlsPanel";
import ExportButton from "./components/ExportButton";
import ImageDropZone from "./components/ImageDropZone";
import PreviewGrid from "./components/PreviewGrid";

function App() {
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [squarePadding, setSquarePadding] = useState(15);
  const [roundPadding, setRoundPadding] = useState(15);
  const [bgColor, setBgColor] = useState("#4285F4");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const handleImageLoad = useCallback((img: HTMLImageElement) => {
    setSourceImage(img);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <div className="navbar sticky top-0 z-50 bg-base-200/70 backdrop-blur-lg shadow-sm px-4">
        <div className="flex-1 flex items-center gap-2"></div>
        <div className="flex-none flex items-center gap-2">
          <ExportButton
            sourceImage={sourceImage}
            squarePadding={squarePadding}
            roundPadding={roundPadding}
            bgColor={bgColor}
          />
          <label className="swap swap-rotate btn btn-ghost btn-circle">
            <input
              type="checkbox"
              checked={theme === "dark"}
              onChange={toggleTheme}
            />
            <Sun className="swap-off h-5 w-5" />
            <Moon className="swap-on h-5 w-5" />
          </label>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
          {/* Left panel — controls */}
          <div className="w-full lg:w-80 shrink-0 space-y-4">
            <div className="card bg-base-200 shadow-sm">
              <div className="card-body">
                <h2 className="card-title text-sm">Source Image</h2>
                <ImageDropZone onImageLoad={handleImageLoad} />
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
    </div>
  );
}

export default App;
