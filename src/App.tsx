import { Shell } from "./components/layout/Shell";
import { ItineraryPanel } from "./components/itinerary/ItineraryPanel";
import { MapContainer } from "./components/map/MapContainer";

function App() {
  return (
    <Shell
      left={<ItineraryPanel />}
      right={<MapContainer />}
    />
  );
}

export default App;


