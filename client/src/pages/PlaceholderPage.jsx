export default function PlaceholderPage({ title }) {
  return (
    <>
      <div className="page-header">
        <h1>{title}</h1>
      </div>
      <div className="card empty">Coming soon</div>
    </>
  );
}
