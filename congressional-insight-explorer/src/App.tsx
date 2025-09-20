import { useEffect, useState } from 'react';
import { Header } from './components/Layout/Header';
import { ExplorerShell } from './components/MultiModal/ExplorerShell';
import { CongressionalDataProcessor } from './lib/data-processor';
import type { CongressionalData, GraphData, TranscriptData } from './lib/types';
import dataUrl from './data/data.jsonld';
import transcriptUrl from './data/transcript.jsonld';
import { SearchModal } from './components/Search/SearchModal';

function App() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [rawData, setRawData] = useState<CongressionalData | null>(null);
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // Process the data
  useEffect(() => {
    const processor = new CongressionalDataProcessor();
    async function load() {
      try {
        // Load congressional data
        const res = await fetch(dataUrl as unknown as string);
        const json = (await res.json()) as CongressionalData;
        setRawData(json);
        const processedData = processor.parseJsonLD(json);
        setGraphData(processedData);

        // Load transcript data
        const transcriptRes = await fetch(transcriptUrl as unknown as string);
        const transcriptJson = (await transcriptRes.json()) as TranscriptData;
        setTranscriptData(transcriptJson);
      } catch (e) {
        console.error('Failed to load data', e);
      }
    }
    load();
  }, []);


  if (!graphData || !transcriptData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading congressional data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <Header onSearchClick={() => setSearchOpen(!searchOpen)} />
      
      <main className="flex-1 min-h-0 overflow-hidden">
        <ExplorerShell
          transcriptData={transcriptData}
          congressionalData={rawData!}
          graphData={graphData}
        />

        {/* Search */}
        {rawData && (
          <SearchModal
            open={searchOpen}
            onClose={() => setSearchOpen(false)}
            data={rawData}
          />
        )}
      </main>
    </div>
  );
}

export default App;