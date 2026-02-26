import { useState } from "preact/hooks";
import styles from "../assets/TrackForm.module.css";
import AlertIsland from "../islands/Alert.tsx";
import { alertVisible } from "../signals.ts";

const TrackForm = () => {
  const [ticketid, setTicketid] = useState("");
  const [msg, setMsg] = useState({ message: "", visible: false });
  const [loading, setLoading] = useState(false);

  async function handleTrack(e: Event) {
    e.preventDefault();
    setLoading(true);
    setMsg({ message: "", visible: false });

    const cleanId = ticketid.trim();
    if (!cleanId) {
      setLoading(false);
      setMsg({ message: "❌ Ticket inválido", visible: true });
      alertVisible.value = true;
      return;
    }

    const res = await fetch(`/api/track/${encodeURIComponent(cleanId)}`);
    setLoading(false);

    if (res.ok) {
      globalThis.location.replace(`/track/${encodeURIComponent(cleanId)}`);
      return;
    }

    setMsg({ message: "❌ Ticket no encontrado", visible: true });
    alertVisible.value = true;
  }

  return (
    <div className={styles.container}>
      <div className={styles.glassBox}>
        <h1 className={styles.title}>Rastrear Ticket</h1>

        {msg.visible && alertVisible.value && (
          <AlertIsland type={1} message={msg.message} error={true} />
        )}

        <form onSubmit={handleTrack} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="ID del ticket"
              value={ticketid}
              onInput={(e) => setTicketid((e.target as HTMLInputElement).value)}
              className={styles.input}
              required
            />
            <span className={styles.icon}>🎫</span>
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </form>

        <p className={styles.register}>
          <a href="/tickets" className={styles.registerLink}>Ir a tickets</a>
        </p>
      </div>
    </div>
  );
};

export default TrackForm;
