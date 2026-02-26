import { useEffect, useState } from "preact/hooks";
import Loading from "../components/Loading.tsx";
import styles from "../assets/Tracking.module.css";

type TrackingType = {
  ticketid: string;
  name: string;
  reverse: boolean;
  OriginX: number;
  OriginY: number;
  DestinationX: number;
  DestinationY: number;
  ActualX: number;
  ActualY: number;
  speed: number;
};

export default function Tracking() {
  const [tracking, setTracking] = useState<TrackingType | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const getID = () => {
    const path = globalThis.location?.pathname ?? "";
    const ticketid = path.split("/").pop() ?? "";
    if (!ticketid) {
      globalThis.location.replace("/tickets");
      return null;
    }
    return decodeURIComponent(ticketid);
  };

  const getInfo = async () => {
    const ticketid = getID();
    if (!ticketid) return;

    const res = await fetch(`/api/track/${encodeURIComponent(ticketid)}`);
    if (!res.ok) {
      globalThis.location.replace("/tickets");
      return;
    }

    const data = await res.json();
    setTracking(data);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getInfo()
      .catch(() => {
        if (!cancelled) globalThis.location.replace("/tickets");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!tracking || mapLoaded) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const L = (globalThis as any).L;
      const map = L.map("train-map").setView([
        tracking.ActualY,
        tracking.ActualX,
      ], 6);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      L.marker([tracking.OriginY, tracking.OriginX]).addTo(map).bindPopup(
        "🟢 Origen",
      );
      L.marker([tracking.DestinationY, tracking.DestinationX]).addTo(map)
        .bindPopup(
          "🔴 Destino",
        );

      L.polyline(
        [
          [tracking.OriginY, tracking.OriginX],
          [tracking.DestinationY, tracking.DestinationX],
        ],
        { color: "#c60b1e", dashArray: "8,8", weight: 3 },
      ).addTo(map);

      const trainIcon = L.divIcon({
        html: "🚄",
        className: "",
        iconSize: [24, 24],
      });
      L.marker([tracking.ActualY, tracking.ActualX], { icon: trainIcon })
        .addTo(map)
        .bindPopup(`🚄 ${tracking.name}`)
        .openPopup();

      setMapLoaded(true);
    };
    document.head.appendChild(script);
  }, [tracking, mapLoaded]);

  if (loading) return <Loading />;
  if (!tracking) return null;

  const totalDist = Math.sqrt(
    Math.pow(tracking.DestinationX - tracking.OriginX, 2) +
      Math.pow(tracking.DestinationY - tracking.OriginY, 2),
  );
  const currentDist = Math.sqrt(
    Math.pow(tracking.ActualX - tracking.OriginX, 2) +
      Math.pow(tracking.ActualY - tracking.OriginY, 2),
  );
  const progress = totalDist > 0
    ? Math.min(Math.round((currentDist / totalDist) * 100), 100)
    : 0;

  const [originName, destinationName] = tracking.name.split(" - ");

  return (
    <div className={styles.maincontent}>
      <div
        className={styles.liquidglass2}
        style={{ textAlign: "center", padding: "20px" }}
      >
        <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>
          🚆 {originName ?? "Origen"} - {destinationName ?? "Destino"}
        </h1>
        <p style={{ marginBottom: "8px", fontWeight: "bold", color: "#ddd" }}>
          📍 Progreso del trayecto: {progress}%
        </p>
        <div className={styles.progressTrack}>
          <div
            style={{ width: `${progress}%` }}
            className={styles.progressFill}
          />
        </div>
      </div>

      <div id="train-map" className={styles.map} />
    </div>
  );
}
