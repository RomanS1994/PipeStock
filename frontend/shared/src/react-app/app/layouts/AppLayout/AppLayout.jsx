import './AppLayout.css';

export function AppLayout({ children }) {
  return (
    <div className="appLayout appLayout--workspace">
      <div className="appLayout-workspaceBody">
        <div className="pageContainer">
          <main className="appLayout-main">{children}</main>
        </div>
      </div>
    </div>
  );
}
