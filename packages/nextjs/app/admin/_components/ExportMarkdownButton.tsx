"use client";

import { useState } from "react";

export default function ExportMarkdownButton({ markdown }: { markdown: string }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      alert("Failed to copy!");
    }
  };

  return (
    <>
      <button
        className="mb-6 self-end px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() => setShow(true)}
      >
        Export All Grants
      </button>
      {show && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-2xl w-full">
            <h2 className="text-xl font-bold mb-4">Exported Markdown</h2>
            <textarea className="w-full h-64 p-2 border rounded mb-4" value={markdown} readOnly />
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={handleCopy}>
                {copied ? "Copied!" : "Copy to Clipboard"}
              </button>
              <button className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" onClick={() => setShow(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
