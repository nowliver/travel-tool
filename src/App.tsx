import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
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
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "rgba(24, 24, 27, 0.95)",
            color: "#e4e4e7",
            border: "1px solid rgba(255, 255, 255, 0.04)",
            borderRadius: "12px",
            backdropFilter: "blur(12px)",
            padding: "12px 16px",
            fontSize: "13px",
            fontWeight: "500",
          },
          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#18181b",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#18181b",
            },
          },
        }}
      />
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


