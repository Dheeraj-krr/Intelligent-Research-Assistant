import { useState, useEffect } from "react";

export default function UploadsView() {
  const [fileName, setFileName] = useState("");
  const [notes, setNotes] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchProjects = async () => {
    const token = localStorage.getItem("token");

    const response = await fetch("http://127.0.0.1:8000/projects", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    setProjects(data);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const uploadDocument = async () => {
    if (!selectedProjectId || !selectedFile) {
      alert("Select Project and Choose File");
      return;
    }

    const token = localStorage.getItem("token");
    const formData = new FormData();

    formData.append("project_id", selectedProjectId.toString());
    formData.append("notes", notes);
    formData.append("file", selectedFile);

    const response = await fetch("http://127.0.0.1:8000/upload-file", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      const chunkCount = data.chunk_count ?? 0;
      const characterCount = data.character_count ?? 0;
      alert(`Document uploaded successfully.\nChunks: ${chunkCount}\nCharacters: ${characterCount.toLocaleString()}`);
      setSelectedFile(null);
      setFileName("");
      setNotes("");
    } else {
      alert(data.detail);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    uploadDocument();
  };

  return (
    <div className="mx-auto max-w-2xl rounded-[32px] border border-slate-700 bg-slate-950/80 p-6 shadow-2xl shadow-slate-950/40 glass-panel">
      <div className="mb-6 space-y-2">
        <p className="text-sm uppercase tracking-[0.22em] text-sky-300/80">Document Upload</p>
        <h2 className="text-3xl font-semibold text-slate-100">Upload Documents</h2>
        <p className="max-w-xl text-sm text-slate-400">
          Choose a project, attach your file, and add optional notes. The upload will preserve the existing backend behavior.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-200">
          Select Project
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="" disabled>
              Select Project
            </option>
            {projects.map((project: any) => (
              <option key={project.id} value={project.id}>
                {project.project_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-200">
          File Name
          <input
            type="text"
            placeholder="Enter file name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-200">
            Document File
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-3 text-sm text-slate-100 outline-none file:mr-4 file:rounded-full file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-100 file:hover:bg-slate-700"
            />
            {selectedFile ? (
              <p className="mt-2 text-xs text-slate-400">Selected: {selectedFile.name}</p>
            ) : (
              <p className="mt-2 text-xs text-slate-500">PDF, DOC, DOCX, or TXT only.</p>
            )}
          </label>

          <label className="block text-sm font-medium text-slate-200">
            Notes
            <textarea
              placeholder="Enter notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="mt-2 h-full w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-400">
            Make sure you choose the correct project before uploading.
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
          >
            Upload Document
          </button>
        </div>
      </form>
    </div>
  );
}
