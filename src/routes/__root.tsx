import { useCallback, useEffect, useState } from "react";
import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <div className="navbar sticky top-0 z-50 bg-base-200/70 backdrop-blur-lg shadow-sm px-4">
        <div className="flex-1 flex items-center gap-2">
          <Link to="/" className="btn btn-ghost text-lg font-bold">
            Luke Tools
          </Link>
          <ul className="menu menu-horizontal px-1">
            <li>
              <Link
                to="/app-icon-maker"
                activeProps={{ className: "menu-active" }}
              >
                App Icon Maker
              </Link>
            </li>
            <li>
              <Link
                to="/bulk-gitlab"
                activeProps={{ className: "menu-active" }}
              >
                Bulk GitLab
              </Link>
            </li>
          </ul>
        </div>
        <div className="flex-none flex items-center gap-2">
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

      {/* Route content */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
