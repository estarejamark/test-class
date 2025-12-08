export default function ChartsSection() {
  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold">Charts</h3>
      <div className="rounded-lg border-2 border-dashed border-primary p-6 text-center text-primary font-medium">
        Pie Chart: Students per Section
      </div>
      <div className="rounded-lg border-2 border-dashed border-primary p-6 text-center text-primary font-medium">
        Bar Chart: Subjects per Grade Level
      </div>
      <div className="rounded-lg border-2 border-dashed border-primary p-6 text-center text-primary font-medium">
        Line Chart: Teacher Load Status
      </div>
    </section>
  );
}
