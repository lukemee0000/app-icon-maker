import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";

const GITLAB_TOKEN_KEY = "gitlab_token";
const GITLAB_API = "https://gitlab.com/api/v4";

interface ProjectResult {
  name: string;
  status: "pending" | "creating" | "success" | "error";
  message?: string;
  url?: string;
}

interface GitlabGroup {
  id: number;
  name: string;
  full_path: string;
}

export const Route = createFileRoute("/bulk-gitlab")({
  component: RouteComponent,
});

function parseName(line: string): {
  primary: string;
  secondary: string | null;
} {
  const words = line.trim().split(/\s+/);
  if (words.length === 0 || words[0] === "")
    return { primary: "", secondary: null };
  const first = words[0].toLowerCase();
  const second = words.length > 1 ? words[1].toLowerCase() : null;
  return { primary: first, secondary: second };
}

function buildProjectName(line: string): { name: string; fallback: string } {
  const { primary, secondary } = parseName(line);
  if (!primary) return { name: "", fallback: "" };

  // If first word is "hk", always concat with second word
  if (primary === "hk") {
    const name = secondary ? `${primary}-${secondary}` : primary;
    return { name, fallback: secondary ? name : `${primary}-1` };
  }

  // Normal case: first word only
  const fallback = secondary ? `${primary}-${secondary}` : `${primary}-1`;
  return { name: primary, fallback };
}

async function createGitlabProject(
  token: string,
  name: string,
  namespaceId?: string,
): Promise<{ ok: boolean; duplicate: boolean; message: string; url?: string }> {
  try {
    const bodyData: any = { name, path: name };
    if (namespaceId) {
      bodyData.namespace_id = Number.parseInt(namespaceId, 10);
    }

    const res = await fetch(`${GITLAB_API}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PRIVATE-TOKEN": token,
      },
      body: JSON.stringify(bodyData),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        ok: true,
        duplicate: false,
        message: "Created successfully",
        url: data.web_url,
      };
    }

    const body = await res.json().catch(() => ({}));
    const msg =
      body?.message?.name?.[0] ||
      body?.message?.path?.[0] ||
      body?.message ||
      `HTTP ${res.status}`;
    const isDuplicate =
      typeof msg === "string" &&
      msg.toLowerCase().includes("has already been taken");
    return { ok: false, duplicate: isDuplicate, message: String(msg) };
  } catch (err) {
    return {
      ok: false,
      duplicate: false,
      message: err instanceof Error ? err.message : "Network error",
    };
  }
}

function RouteComponent() {
  const [token, setToken] = useState("");
  const [names, setNames] = useState("");
  const [groups, setGroups] = useState<GitlabGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [isFetchingGroups, setIsFetchingGroups] = useState(false);
  const [results, setResults] = useState<ProjectResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(GITLAB_TOKEN_KEY);
    if (saved) setToken(saved);
  }, []);

  const fetchGroups = useCallback(async () => {
    if (!token.trim()) return;

    localStorage.setItem(GITLAB_TOKEN_KEY, token.trim());
    setIsFetchingGroups(true);
    try {
      const res = await fetch(
        `${GITLAB_API}/groups?min_access_level=30&per_page=100`,
        {
          headers: {
            "PRIVATE-TOKEN": token.trim(),
          },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
        if (data.length > 0 && !selectedGroupId) {
          setSelectedGroupId(String(data[0].id));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingGroups(false);
    }
  }, [token, selectedGroupId]);

  const handleSubmit = useCallback(async () => {
    if (!token.trim() || !names.trim()) return;

    localStorage.setItem(GITLAB_TOKEN_KEY, token.trim());
    abortRef.current = false;
    setIsRunning(true);

    const lines = names
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const initialResults: ProjectResult[] = lines.map((line) => ({
      name: buildProjectName(line).name || line,
      status: "pending",
    }));
    setResults(initialResults);

    for (let i = 0; i < lines.length; i++) {
      if (abortRef.current) break;

      const { name, fallback } = buildProjectName(lines[i]);
      if (!name) {
        setResults((prev) => {
          const next = [...prev];
          next[i] = {
            name: lines[i],
            status: "error",
            message: "Invalid name",
          };
          return next;
        });
        continue;
      }

      // Update status to creating
      setResults((prev) => {
        const next = [...prev];
        next[i] = { ...next[i], name, status: "creating" };
        return next;
      });

      let result = await createGitlabProject(
        token.trim(),
        name,
        selectedGroupId,
      );

      // If duplicate, try fallback name
      if (!result.ok && result.duplicate && fallback && fallback !== name) {
        setResults((prev) => {
          const next = [...prev];
          next[i] = {
            ...next[i],
            name: fallback,
            status: "creating",
            message: `"${name}" taken, trying "${fallback}"...`,
          };
          return next;
        });
        result = await createGitlabProject(
          token.trim(),
          fallback,
          selectedGroupId,
        );
      }

      setResults((prev) => {
        const next = [...prev];
        next[i] = {
          name: next[i].name,
          status: result.ok ? "success" : "error",
          message: result.message,
          url: result.url,
        };
        return next;
      });
    }

    setIsRunning(false);
  }, [token, names]);

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card bg-base-200 shadow-sm h-fit">
            <div className="card-body space-y-4">
              <h2 className="card-title text-sm">
                Bulk GitLab Project Creator
              </h2>

              {/* Token input */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend">GitLab Token</legend>
                <div className="flex gap-2 w-full">
                  <input
                    type="password"
                    className="input input-bordered w-3/4"
                    placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary flex-1"
                    disabled={!token.trim() || isFetchingGroups}
                    onClick={fetchGroups}
                  >
                    {isFetchingGroups ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      "Fetch Groups"
                    )}
                  </button>
                </div>
              </fieldset>

              {/* Group Select */}
              {groups.length > 0 && (
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Target Group</legend>
                  <select
                    className="select select-bordered w-full font-mono"
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                  >
                    <option value="">Personal Namespace (Default)</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.full_path} ({g.name})
                      </option>
                    ))}
                  </select>
                </fieldset>
              )}

              {/* Names textarea */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend">
                  Project Names (one per line)
                </legend>
                <textarea
                  className="textarea textarea-bordered w-full h-40 font-mono"
                  placeholder={"HK SignalRise\nPower\nMyProject"}
                  value={names}
                  onChange={(e) => setNames(e.target.value)}
                />
              </fieldset>

              {/* Submit */}
              <button
                type="button"
                className="btn btn-primary w-full"
                disabled={isRunning || !token.trim() || !names.trim()}
                onClick={handleSubmit}
              >
                {isRunning ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Creating projects…
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Create Projects
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results */}
          {results.length > 0 ? (
            <div className="card bg-base-200 shadow-sm max-h-[600px] overflow-y-auto">
              <div className="card-body">
                <h2 className="card-title text-sm">Results</h2>
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Project Name</th>
                        <th>Status</th>
                        <th>Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, idx) => (
                        <tr key={`${r.name}-${idx}`}>
                          <td>{idx + 1}</td>
                          <td className="font-mono text-sm">{r.name}</td>
                          <td>
                            {r.status === "pending" && (
                              <span className="badge badge-ghost badge-sm">
                                Pending
                              </span>
                            )}
                            {r.status === "creating" && (
                              <span className="badge badge-info badge-sm">
                                <span className="loading loading-spinner loading-xs mr-1" />
                                Creating
                              </span>
                            )}
                            {r.status === "success" && (
                              <span className="badge badge-success badge-sm">
                                Success
                              </span>
                            )}
                            {r.status === "error" && (
                              <span className="badge badge-error badge-sm">
                                Error
                              </span>
                            )}
                          </td>
                          <td className="text-xs opacity-70">{r.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="card bg-base-200 shadow-sm h-full hidden lg:flex items-center justify-center opacity-50 p-8 text-center min-h-[400px]">
              <p>No projects pending or created</p>
            </div>
          )}
        </div>

        {/* Created Links Textarea */}
        {results.some((r) => r.url) && (
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-sm">Created Repository Links</h2>
              <textarea
                readOnly
                className="textarea textarea-bordered w-full h-32 font-mono text-sm leading-relaxed"
                value={results
                  .filter((r) => r.url)
                  .map((r) => `${r.url}.git`)
                  .join("\n")}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
