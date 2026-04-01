import JSZip from "jszip";
import {
  DENSITIES,
  renderBackgroundToBlob,
  renderForegroundToBlob,
  renderIconToBlob,
  renderMonochromeToBlob,
} from "./iconRenderer";

const ADAPTIVE_ICON_LAUNCHER = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@mipmap/ic_launcher_background"/>
  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
  <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>
</adaptive-icon>`;

const ADAPTIVE_ICON_LAUNCHER_ROUND = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@mipmap/ic_launcher_round_background"/>
  <foreground android:drawable="@mipmap/ic_launcher_round_foreground"/>
  <monochrome android:drawable="@mipmap/ic_launcher_round_monochrome"/>
</adaptive-icon>`;

export async function exportZip(
  sourceImage: HTMLImageElement,
  squarePadding: number,
  roundPadding: number,
  bgColor: string,
): Promise<void> {
  const zip = new JSZip();

  // Generate PNGs for each density
  const tasks = DENSITIES.map(async (density) => {
    const folder = zip.folder(`mipmap-${density.name}`);
    if (!folder) return;

    const [
      squareBlob,
      roundBlob,
      fgBlob,
      bgBlob,
      roundFgBlob,
      roundBgBlob,
      monoBlob,
      roundMonoBlob,
    ] = await Promise.all([
      renderIconToBlob(
        sourceImage,
        density.size,
        squarePadding,
        bgColor,
        "square",
      ),
      renderIconToBlob(
        sourceImage,
        density.size,
        roundPadding,
        bgColor,
        "round",
      ),
      renderForegroundToBlob(sourceImage, density.size, squarePadding),
      renderBackgroundToBlob(density.size, bgColor),
      renderForegroundToBlob(sourceImage, density.size, roundPadding),
      renderBackgroundToBlob(density.size, bgColor),
      renderMonochromeToBlob(sourceImage, density.size, squarePadding),
      renderMonochromeToBlob(sourceImage, density.size, roundPadding),
    ]);

    folder.file("ic_launcher.png", squareBlob);
    folder.file("ic_launcher_round.png", roundBlob);
    folder.file("ic_launcher_foreground.png", fgBlob);
    folder.file("ic_launcher_background.png", bgBlob);
    folder.file("ic_launcher_monochrome.png", monoBlob);
    folder.file("ic_launcher_round_foreground.png", roundFgBlob);
    folder.file("ic_launcher_round_background.png", roundBgBlob);
    folder.file("ic_launcher_round_monochrome.png", roundMonoBlob);
  });

  await Promise.all(tasks);

  // Add adaptive-icon XMLs
  const anydpiFolder = zip.folder("mipmap-anydpi-v26");
  if (anydpiFolder) {
    anydpiFolder.file("ic_launcher.xml", ADAPTIVE_ICON_LAUNCHER);
    anydpiFolder.file("ic_launcher_round.xml", ADAPTIVE_ICON_LAUNCHER_ROUND);
  }

  // Generate and download the ZIP
  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mipmap-icons.zip";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
