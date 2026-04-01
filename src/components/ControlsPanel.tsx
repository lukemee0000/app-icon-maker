import { useCallback } from "react";
import { HexColorPicker } from "react-colorful";

interface ControlsPanelProps {
  squarePadding: number;
  roundPadding: number;
  onSquarePaddingChange: (value: number) => void;
  onRoundPaddingChange: (value: number) => void;
  bgColor: string;
  onBgColorChange: (value: string) => void;
}

function ControlsPanel({
  squarePadding,
  roundPadding,
  onSquarePaddingChange,
  onRoundPaddingChange,
  bgColor,
  onBgColorChange,
}: ControlsPanelProps) {
  const handleHexInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Accept valid hex colors (with or without #)
      if (/^#?[0-9a-fA-F]{0,6}$/.test(value)) {
        const hex = value.startsWith("#") ? value : `#${value}`;
        if (hex.length === 7) {
          onBgColorChange(hex);
        }
      }
    },
    [onBgColorChange],
  );

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return (
      "#" +
      ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()
    );
  };

  const rgb = hexToRgb(bgColor);

  const handleRgbChange = (channel: "r" | "g" | "b", val: string) => {
    let num = parseInt(val, 10);
    if (Number.isNaN(num)) num = 0;
    if (num < 0) num = 0;
    if (num > 255) num = 255;
    const newRgb = { ...rgb, [channel]: num };
    onBgColorChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  return (
    <div className="space-y-6">
      {/* Square Padding control */}
      <div className="form-control flex flex-col gap-2">
        <label className="label p-0" htmlFor="square-padding-range">
          <span className="label-text font-medium">Square Padding</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            id="square-padding-range"
            type="range"
            min={0}
            max={50}
            value={squarePadding}
            onChange={(e) => onSquarePaddingChange(Number(e.target.value))}
            className="range range-primary range-sm flex-1"
          />
          <input
            type="number"
            min={0}
            max={100}
            value={squarePadding}
            onChange={(e) => onSquarePaddingChange(Number(e.target.value))}
            className="input input-bordered input-sm w-16 text-right font-mono"
          />
          <span className="text-sm opacity-60">%</span>
        </div>
      </div>

      {/* Round Padding control */}
      <div className="form-control flex flex-col gap-2">
        <label className="label p-0" htmlFor="round-padding-range">
          <span className="label-text font-medium">Round Padding</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            id="round-padding-range"
            type="range"
            min={0}
            max={50}
            value={roundPadding}
            onChange={(e) => onRoundPaddingChange(Number(e.target.value))}
            className="range range-primary range-sm flex-1"
          />
          <input
            type="number"
            min={0}
            max={100}
            value={roundPadding}
            onChange={(e) => onRoundPaddingChange(Number(e.target.value))}
            className="input input-bordered input-sm w-16 text-right font-mono"
          />
          <span className="text-sm opacity-60">%</span>
        </div>
      </div>

      <div className="form-control flex flex-col gap-2">
        <div className="label p-0">
          <span className="label-text font-medium">Background Color</span>
        </div>

        {/* Color picker */}
        <div className="color-picker-container">
          <HexColorPicker color={bgColor} onChange={onBgColorChange} />
        </div>

        {/* Hex input */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-md border border-base-content/20 shrink-0"
            style={{ backgroundColor: bgColor }}
          />
          <input
            type="text"
            value={bgColor}
            onChange={handleHexInput}
            placeholder="#4285F4"
            className="input input-bordered input-sm flex-1 font-mono"
            maxLength={7}
          />
        </div>

        {/* RGB input */}
        <div className="flex items-center gap-2">
          <label className="input input-bordered input-sm flex items-center gap-2 flex-1 w-full font-mono relative">
            <span className="opacity-50 text-xs">R</span>
            <input
              type="number"
              min={0}
              max={255}
              value={rgb.r}
              onChange={(e) => handleRgbChange("r", e.target.value)}
              className="w-full text-right bg-transparent outline-none focus:outline-none"
            />
          </label>
          <label className="input input-bordered input-sm flex items-center gap-2 flex-1 w-full font-mono relative">
            <span className="opacity-50 text-xs">G</span>
            <input
              type="number"
              min={0}
              max={255}
              value={rgb.g}
              onChange={(e) => handleRgbChange("g", e.target.value)}
              className="w-full text-right bg-transparent outline-none focus:outline-none"
            />
          </label>
          <label className="input input-bordered input-sm flex items-center gap-2 flex-1 w-full font-mono relative">
            <span className="opacity-50 text-xs">B</span>
            <input
              type="number"
              min={0}
              max={255}
              value={rgb.b}
              onChange={(e) => handleRgbChange("b", e.target.value)}
              className="w-full text-right bg-transparent outline-none focus:outline-none"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

export default ControlsPanel;
