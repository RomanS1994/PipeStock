import './HomePage.css';

export function HomePage() {
  return (
    <div className="pageStack pipeStockHome">
      <header className="compactHeader">
        <span className="sectionEyebrow">PipeStock</span>
        <h1>Матеріали без паперу</h1>
        <p>Базова архітектура проєкту готова до першого продуктового flow.</p>
      </header>

      <section className="screenCard">
        <strong>React + Vite + RTK Query</strong>
        <p className="pipeStockHome-note">
          UI використовує ті самі базові design tokens і mobile-first правила, що й WorkTrack.
        </p>
      </section>
    </div>
  );
}
