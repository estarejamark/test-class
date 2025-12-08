"use client";
import { useState } from "react";

export default function QuickActions() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <section className="space-y-4">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search by section, student, or teacher..."
        className="w-full max-w-md px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {/* Conditional rendering of search results */}
    </section>
  );
}
