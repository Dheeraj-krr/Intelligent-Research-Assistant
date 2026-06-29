import { useState, useEffect } from "react";
import { PlusCircle, Folder, Sparkles, RefreshCw } from 'lucide-react';

export default function ProjectsViewEnhanced() {
  const [projects, setProjects] = useState<any[]>([]);
  const [projectName, setProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isDeletingProjectId, setIsDeletingProjectId] = useState<number | null>(null);
  const [projectDocuments, setProjectDocuments] = useState<any[]>([]);
  const [metadataModalOpen, setMetadataModalOpen] = useState(false);
  const [selectedMetadataDoc, setSelectedMetadataDoc] = useState<any | null>(null);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);

  const fetchProjects = async () => {
    try {

      setError(null);
      setIsLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://127.0.0.1:8000/projects",
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      setProjects(data);

    } catch (err) {

      setError(
        "Unable to load projects. Please check your workspace connection."
      );

    } finally {

      setIsLoading(false);

    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const createProject = async () => {

    if (!projectName.trim()) {
      setError("Project name cannot be empty.");
      return;
    }

    try {

      setError(null);
      setIsCreating(true);

      const token = localStorage.getItem("token");

      await fetch("http://127.0.0.1:8000/projects", {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },

        body: JSON.stringify({
          project_name: projectName.trim()
        })

      });

      setProjectName("");
      await fetchProjects();

    } catch (err) {

      setError(
        "Could not create project. Try again in a moment."
      );

    } finally {

      setIsCreating(false);

    }
  };

  const fetchProjectDocuments = async (
    projectId: number
  ) => {

    const token =
      localStorage.getItem("token");

    const response = await fetch(

      `http://127.0.0.1:8000/projects/${projectId}/documents`,

      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }

    );

    const data = await response.json();

    setProjectDocuments(data);
  };

  const openProject = async (
    id: number
  ) => {

    setSelectedProjectId(id);

    await fetchProjectDocuments(id);
  };

  const deleteProject = async (projectId: number) => {
    const confirmed = window.confirm(
      "Delete this workspace and all associated documents?"
    );

    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem("token");

    try {
      setIsDeletingProjectId(projectId);

      const response = await fetch(
        `http://127.0.0.1:8000/projects/${projectId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        alert(data.detail || "Unable to delete workspace.");
        return;
      }

      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
        setProjectDocuments([]);
      }

      await fetchProjects();
    } catch (err) {
      alert("Could not delete workspace. Try again later.");
    } finally {
      setIsDeletingProjectId(null);
    }
  };

  const deleteDocument = async (
    docId: number
  ) => {

    const token =
      localStorage.getItem("token");

    const response =
      await fetch(

        `http://127.0.0.1:8000/documents/${docId}`,

        {

          method: "DELETE",

          headers: {

            Authorization:
              `Bearer ${token}`

          }

        }

      );

    const data =
      await response.json();

    if (!response.ok) {

      alert(
        data.detail ||
        "Delete failed"
      );

      return;

    }

    if (
      selectedProjectId
    ) {

      await fetchProjectDocuments(
        selectedProjectId
      );

    }

  };

  const openDocument = async (
    documentId: number
  ) => {

    const token =
      localStorage.getItem("token");

    const response = await fetch(

      `http://127.0.0.1:8000/documents/${documentId}/open`,

      {

        headers: {

          Authorization:
            `Bearer ${token}`

        }

      }

    );

    if (!response.ok) {

      alert("Unable to open document");

      return;

    }

    const blob =
      await response.blob();

    const url =
      window.URL.createObjectURL(blob);

    window.open(
      url,
      "_blank"
    );

  };

  const openMetadata = async (doc: any) => {
    try {
      setIsMetadataLoading(true);
      setMetadataModalOpen(true);
      setSelectedMetadataDoc(null);

      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://127.0.0.1:8000/documents/${doc.id}/metadata`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load metadata");
      }

      setSelectedMetadataDoc(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to load metadata");
      setMetadataModalOpen(false);
    } finally {
      setIsMetadataLoading(false);
    }
  };

  const formatCharacterCount = (count: number) => {
    return count.toLocaleString();
  };


  return (
    <section className="glass-panel rounded-3xl border border-brand-border bg-brand-surface/80 p-6 shadow-xl backdrop-blur-xl">
      <div className="flex flex-col gap-4 md:gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary-container/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-brand-on-primary-container">
            <Sparkles className="h-3.5 w-3.5" />
            Research workspace
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-brand-text-primary">Manage your project workspaces</h2>
          <p className="mt-2 text-sm leading-6 text-brand-on-secondary-container">
            Create new research projects, organize active workspaces, and keep your team aligned with a clean project overview.
          </p>
        </div>

        <div className="rounded-3xl bg-brand-surface-high px-4 py-3 text-sm font-semibold text-brand-secondary-container border border-brand-border">
          {projects.length} active {projects.length === 1 ? 'project' : 'projects'}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="glass-panel rounded-3xl border border-brand-border p-6 bg-brand-surface/90 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
              <PlusCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-brand-text-primary">Create a new project</h3>
              <p className="text-sm text-brand-on-secondary-container">Start a dedicated workspace for your next research initiative.</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <label className="text-sm font-medium text-brand-secondary" htmlFor="project-name">
              Project name
            </label>
            <input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Example: AI compliance study"
              className="w-full rounded-2xl border border-brand-border bg-brand-surface-container px-4 py-3 text-sm text-brand-text-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            />
            <button
              type="button"
              onClick={createProject}
              disabled={isCreating}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-primary px-5 py-3 text-sm font-semibold text-brand-on-primary transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlusCircle className="h-4 w-4" />
              {isCreating ? 'Creating...' : 'Create project'}
            </button>
            {error ? (
              <p className="text-sm text-brand-error mt-1">{error}</p>
            ) : null}
          </div>
        </div>

        <div className="glass-panel rounded-3xl border border-brand-border p-6 bg-brand-surface/90 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-brand-text-primary">Project activity</h3>
              <p className="text-sm text-brand-on-secondary-container">Refresh to sync the latest workspaces from your server.</p>
            </div>
            <button
              type="button"
              onClick={fetchProjects}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-2xl border border-brand-border bg-brand-surface-container px-4 py-2 text-sm text-brand-secondary transition hover:border-brand-primary hover:text-brand-primary"
            >
              <RefreshCw className="h-4 w-4" />
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          <div className="mt-5 rounded-3xl border border-brand-border/80 bg-brand-surface-low p-4">
            <div className="flex items-center gap-3 text-sm text-brand-on-secondary-container">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                <Folder className="h-4 w-4" />
              </span>
              <span>{projects.length ? `Latest ${Math.min(3, projects.length)} workspaces` : 'No projects yet'}</span>
            </div>
            <ul className="mt-4 space-y-3">
              {isLoading ? (
                <li className="animate-pulse rounded-3xl bg-brand-surface-high px-4 py-4" />
              ) : projects.length > 0 ? (
                projects.slice(0, 3).map((project) => (
                  <li key={project.id} className="rounded-3xl border border-brand-border bg-brand-surface-container px-4 py-3 text-sm text-brand-text-primary">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{project.project_name}</span>
                      <span className="text-xs uppercase tracking-[0.24em] text-brand-on-secondary-container">Active</span>
                    </div>
                    <p className="mt-2 text-xs text-brand-on-secondary-container">Workspace ID: {project.id}</p>
                  </li>
                ))
              ) : (
                <li className="rounded-3xl border border-dashed border-brand-border bg-brand-surface-high px-4 py-4 text-sm text-brand-on-secondary-container">
                  Start by creating your first project. It will appear here instantly.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading && projects.length === 0 ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-3xl bg-brand-surface-high p-5 h-32" />
          ))
        ) : projects.length > 0 ? (
          projects.map((project) => (
            <article key={project.id} className="glass-panel rounded-3xl border border-brand-border bg-brand-surface/90 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-secondary">Project workspace</p>
                  <h3 className="mt-3 text-xl font-semibold text-brand-text-primary">{project.project_name}</h3>
                </div>
                <div className="rounded-2xl bg-brand-primary/10 p-3 text-brand-primary">
                  <Folder className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-brand-on-secondary-container">
                <span>ID: {project.id}</span>
                <span>{project.project_name.length > 18 ? 'Ready to launch' : 'Ready'}</span>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <button
                  onClick={() => openProject(project.id)}
                  className="w-full rounded-2xl bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-on-primary"
                >
                  Open Workspace
                </button>
                <button
                  onClick={() => deleteProject(project.id)}
                  disabled={isDeletingProjectId === project.id}
                  className="w-full rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isDeletingProjectId === project.id ? 'Deleting...' : 'Delete Workspace'}
                </button>
              </div>
            </article>
          ))
        ) : null}

        {selectedProjectId && (

          <div className="mt-8 rounded-3xl border border-brand-border bg-brand-surface p-6">

            <h3 className="text-xl font-semibold text-brand-text-primary">
              Project Documents
            </h3>
            <button
              className="mt-3 mb-4 rounded-2xl bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-on-primary"
              onClick={() => window.alert(
                "Open Uploads page from sidebar to add documents."
              )}
            >
              Go to Uploads
            </button>
            <ul className="mt-4 space-y-3">

              {projectDocuments.length > 0 ? (

                projectDocuments.map((doc: any) => (

                  <li
                    key={doc.id}
                    className="rounded-2xl border border-brand-border p-4"
                  >

                    <h4 className="font-semibold">
                      {doc.file_name}
                    </h4>

                    <p className="mt-2 text-sm">
                      <b>Notes:</b> {doc.notes}
                    </p>

                    <p className="text-sm">
                      <b>Type:</b> {doc.document_type}
                    </p>

                    <p className="text-sm">
                      <b>Uploaded:</b> {doc.upload_date}
                    </p>

                    <p className="text-sm">
                      <b>Size:</b> {doc.file_size}
                    </p>
                    <p className="text-sm">
                      <b>Chunks:</b> {doc.chunk_count ?? 0}
                    </p>
                    <p className="text-sm">
                      <b>Characters:</b> {formatCharacterCount(doc.character_count ?? 0)}
                    </p>
                    <button
                      onClick={() => openMetadata(doc)}
                      className="mt-3 mr-2 rounded-xl bg-sky-600 px-3 py-1 text-white"
                    >
                      View Metadata
                    </button>
                    <button

                      onClick={() =>
                        openDocument(
                          doc.id
                        )
                      }

                      className="mt-3 mr-2 rounded-xl bg-blue-500 px-3 py-1 text-white"

                    >

                      Open

                    </button>
                    <button

                      onClick={() =>
                        deleteDocument(doc.id)
                      }

                      className="mt-3 rounded-xl bg-red-500 px-3 py-1 text-white"

                    >

                      Delete

                    </button>

                  </li>

                ))

              ) : (

                <li>
                  No documents found for this project.
                </li>

              )}

            </ul>

          </div>

        )}
      </div>

      {metadataModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-brand-border bg-brand-surface p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-secondary">Document metadata</p>
                <h3 className="mt-2 text-xl font-semibold text-brand-text-primary">
                  {selectedMetadataDoc?.file_name || "Document details"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMetadataModalOpen(false)}
                className="rounded-2xl border border-brand-border px-3 py-2 text-sm text-brand-secondary"
              >
                Close
              </button>
            </div>

            {isMetadataLoading ? (
              <div className="mt-5 animate-pulse space-y-3">
                <div className="h-4 rounded bg-brand-surface-high" />
                <div className="h-4 rounded bg-brand-surface-high" />
                <div className="h-4 rounded bg-brand-surface-high" />
              </div>
            ) : selectedMetadataDoc ? (
              <div className="mt-5 space-y-3 text-sm text-brand-on-secondary-container">
                <p><span className="font-semibold text-brand-text-primary">Title:</span> {selectedMetadataDoc.title || "N/A"}</p>
                <p><span className="font-semibold text-brand-text-primary">File name:</span> {selectedMetadataDoc.file_name || "N/A"}</p>
                <p><span className="font-semibold text-brand-text-primary">Type:</span> {selectedMetadataDoc.document_type || "N/A"}</p>
                <p><span className="font-semibold text-brand-text-primary">Uploaded:</span> {selectedMetadataDoc.upload_date || "N/A"}</p>
                <p><span className="font-semibold text-brand-text-primary">File size:</span> {selectedMetadataDoc.file_size || "N/A"}</p>
                <p><span className="font-semibold text-brand-text-primary">Notes:</span> {selectedMetadataDoc.notes || "No notes"}</p>
                <p><span className="font-semibold text-brand-text-primary">Authors:</span> {Array.isArray(selectedMetadataDoc.authors) ? selectedMetadataDoc.authors.join(", ") : selectedMetadataDoc.authors || "N/A"}</p>
                <p><span className="font-semibold text-brand-text-primary">Chunks:</span> {selectedMetadataDoc.chunk_count ?? 0}</p>
                <p><span className="font-semibold text-brand-text-primary">Characters:</span> {formatCharacterCount(selectedMetadataDoc.character_count ?? 0)}</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
