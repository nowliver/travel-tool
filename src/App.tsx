import { useEffect, useState } from "react";
import { Shell } from "./components/layout/Shell";
import { ItineraryPanel } from "./components/itinerary/ItineraryPanel";
import { MapContainer } from "./components/map/MapContainer";
import { AuthModal, PlansModal } from "./components/auth";
import { useAuthStore } from "./store/authStore";

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
      <Shell
        left={
          <ItineraryPanel
            onOpenAuth={() => setShowAuthModal(true)}
            onOpenPlans={() => setShowPlansModal(true)}
          />
        }
        right={<MapContainer />}
      />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <PlansModal isOpen={showPlansModal} onClose={() => setShowPlansModal(false)} />
    </>
  );
}

export default App;


