# App Icon Maker

A powerful, web-based tool for generating Android-compatible launcher icons, inspired by Icon Kitchen.

## Features

- **Drag-and-Drop Interface**: Easily upload your source images to use as icon foregrounds.
- **Real-Time Previews**: Instantly view your icon across all Android mipmap densities (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`) in both square and round variants.
- **Advanced Customization**:
  - **Padding Control**: Adjust foreground scale precisely using either a slider or direct numerical input.
  - **Background Colors**: Choose background colors using an interactive color picker or explicitly with RGB inputs.
- **One-Click Export**: Generates and downloads a complete `.zip` archive containing:
  - Required PNG assets for all density buckets.
  - Properly structured `adaptive-icon` XML files.
  - Support for foreground, background, and monochrome icon layers.

## Tech Stack

This project is built using modern web development tools:

- **Framework**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Color Picker**: [React Colorful](https://omgovich.github.io/react-colorful/)
- **File Archiving**: [JSZip](https://stuk.github.io/jszip/)
- **Linting & Formatting**: [Biome](https://biomejs.dev/)

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) and a package manager like [pnpm](https://pnpm.io/) (or `npm`/`yarn`) installed on your system.

### Installation

1. Copy the repository and navigate into the project directory:

   ```bash
   cd app-icon-maker
   ```

2. Install the dependencies:
   ```bash
   pnpm install
   ```

### Development Server

Start the Vite development server with Hot Module Replacement (HMR):

```bash
pnpm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

### Building for Production

Compile the TypeScript and build the project for production:

```bash
pnpm run build
```

This will create a `dist` directory with the optimized production assets.

### Linting & Formatting

The project uses Biome for ultra-fast linting and formatting.

- Check code quality:
  ```bash
  pnpm run lint
  ```
- Automatically format code:
  ```bash
  pnpm run format
  ```
