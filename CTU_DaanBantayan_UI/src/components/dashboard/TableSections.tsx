export default function TablesSection() {
  return (
    <section className="space-y-6">
      <TablePanel title="Subject Management Preview" />
      <TablePanel title="Teacher Subject Loads" />
      <TablePanel title="Section Overview" />
    </section>
  );
}

function TablePanel({ title }: { title: string }) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <i className="bi bi-journal-bookmark" /> {title}
      </h3>
      <table className="w-full text-sm border-collapse mb-4">
        <thead>
          <tr>
            <th className="text-left py-2 px-3">Column 1</th>
            <th className="text-left py-2 px-3">Column 2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-2 px-3">Data</td>
            <td className="py-2 px-3">Data</td>
          </tr>
        </tbody>
      </table>
      <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/80 transition">
        Manage
      </button>
    </div>
  );
}
