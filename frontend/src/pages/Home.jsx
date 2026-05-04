
import React, { useState } from "react";
import NoteCard from "./NoteCard";

const NoteList = ({ notes }) => {
  const [viewMode, setViewMode] = useState("grid");

  const toggleView = () => {
    setViewMode((prev) => (prev === "grid" ? "list" : "grid"));
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">My Notes</h2>

        <button
          onClick={toggleView}
          className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
        >
          {viewMode === "grid" ? "List View" : "Grid View"}
        </button>
      </div>
      <div
        className={`gap-4 transition-all duration-300 ${
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "flex flex-col"
        }`}
      >
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    </div>
  );
};

export default NoteList;