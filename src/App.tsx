function App() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
        <h1 className="px-4 py-3 font-heading text-lg font-semibold">cmdbox</h1>
      </aside>
      <main className="flex flex-1 items-center justify-center text-muted-foreground">
        Select a command
      </main>
    </div>
  );
}

export default App;
