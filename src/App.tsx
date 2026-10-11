import { useState } from "react";
import { CollectionsSidebar } from "@/components/sidebar/CollectionsSidebar";
import { Toaster } from "@/components/ui/sonner";

function App() {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <CollectionsSidebar
        selectedId={selectedCollectionId}
        onSelect={setSelectedCollectionId}
      />
      <main className="flex flex-1 items-center justify-center text-muted-foreground">
        {selectedCollectionId ? "No commands yet" : "Select a collection"}
      </main>
      <Toaster />
    </div>
  );
}

export default App;
