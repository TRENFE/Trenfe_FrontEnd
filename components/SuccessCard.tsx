import { useEffect, useState } from "preact/hooks";
import Loading from "../components/Loading.tsx";
import styles from "../assets/SuccessCard.module.css";

type Ticket = {
  ticketid: string;
  origin: string;
  destination: string;
  date: string;
  price: string;
  available: number;
};

export default function SuccesCard() {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const load = async () => {
      try {
        const path = globalThis.location?.pathname ?? "";
        const id = path.split("/").pop() ?? null;
        if (!id) {
          globalThis.location.replace("/tickets");
          return;
        }
        const bdata = atob(id);
        const finaldata = bdata.split("+");
        const ticketid = finaldata[0];
        const  quantity = finaldata[1];
        const res = await fetch(`/api/ticket/${ticketid}`);
        if (!res.ok) {
          globalThis.location.replace("/tickets");
          return;
        }

        const data = await res.json();
        const ticket: Ticket = {
          ticketid: data.ticketid,
          origin: data.origin,
          destination: data.destination,
          date: data.date,
          price: data.price,
          available: data.available,
        };

        if (!cancelled) setTicket(ticket);setQuantity(parseInt(quantity));
      } catch (err) {
        console.error(err);
        if (!cancelled) globalThis.location.replace("/tickets");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Loading />;
  if (ticket) {
    return (
    <div style="width:700px" className={styles.maincontent}>
      <div
        className={styles.liquidglass2}
        style={{
          textAlign: "center",
          padding: "20px",
        }}
      >
        <h1
          style={{
            fontSize: "25px",
            fontWeight: "bold",
            color: "#22c55e",
          }}
        >
          🎉 ¡COMPRA REALIZADA CON EXITO! 🎉
        </h1>
      </div>
      <div
        key={ticket.ticketid}
        className={styles.liquidglass2}
        style={{
          padding: "25px",
          marginTop: "20px",
          textAlign: "center",
          borderRadius: "20px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
        }}
      >
        <h2
          className={styles.sectionTitle}
          style={{
            fontSize: "22px",
            fontWeight: "bold",
            color: "#00e6a8",
            marginBottom: "10px",
          }}
        >
          {ticket.origin} ➡️ {ticket.destination}
        </h2>

        <div
          style={{
            textAlign: "left",
            margin: "0 auto",
            width: "80%",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "12px",
            padding: "15px",
            backdropFilter: "blur(8px)",
          }}
        >
          <p className={styles.sectionText}>🆔 <b>ID:</b> {ticket.ticketid}</p>
          <p className={styles.sectionText}>📅 <b>Fecha:</b> {ticket.date}</p>
          <p className={styles.sectionText}>💰 <b>Precio:</b> {ticket.price} $</p>
        </div>

        <p
          style={{
            marginTop: "20px",
            color: "rgb(70 255 154);",
            fontSize: "0.95rem",
          }}
        >
          ¡Gracias por tu compra! 💖
        </p>

        <a
          href="/tickets"
          style={{
            display: "inline-block",
            marginTop: "15px",
            background: "linear-gradient(90deg, #22c55e, #16a34a)",
            color: "white",
            padding: "10px 25px",
            borderRadius: "12px",
            textDecoration: "none",
            fontWeight: "600",
            transition: "all 0.3s ease",
          }}
        >
          🔙 Volver a tickets
        </a>
      </div>
    </div>
  );
    
  }
}
