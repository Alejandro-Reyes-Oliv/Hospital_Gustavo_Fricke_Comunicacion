export default function Card({ title, action, children, className="" }) {
  return (
    <section className={`bg-[var(--card)] rounded-2xl shadow-md p-6 ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
