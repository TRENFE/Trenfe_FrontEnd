import { useEffect, useState } from "preact/hooks";
import Loading from "../components/Loading.tsx";
import styles from "../assets/IndividualTicket.module.css";
import BuyButton from "./BuyTicketButton.tsx";

type Ticket = {
  ticketid: string;
  origin: string;
  destination: string;
  date: string;
  price: string;
  available: number;
};

export default function IndividualTicket() {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
   useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const load = async () => {
      try {
        const path = globalThis.location?.pathname ?? "";
        const datatic = path.split("/").pop() ?? null;
        if (!datatic) {
          globalThis.location.replace("/tickets");
          return;
        }

        const ticketid = atob(datatic);
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
        if (!cancelled) setTicket(ticket);
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
              fontSize: "28px",
              fontWeight: "bold",
              marginLeft: "30%",
            }}
          >
            🚆 BILLETE 🚆
          </h1>
        </div>
        <div
          key={ticket.ticketid}
          className={`${styles.liquidglass2} ${
            ticket.available<1 ? styles.sold : ""
          }`}
          style={{
            cursor: ticket.available<1 ? "not-allowed" : "pointer",
            pointerEvents: ticket.available<1 ? "none" : "auto",
            opacity: ticket.available<1 ? 0.5 : 1,
            transition: "all 0.3s ease-in-out",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {ticket.available<1 && (
            <div
              style={{
                position: "absolute",
                top: "30px",
                right: "-35px",
                background: "linear-gradient(45deg, #dc2626, #ef4444)",
                color: "white",
                padding: "8px 50px",
                transform: "rotate(45deg)",
                fontSize: "14px",
                fontWeight: "bold",
                boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                zIndex: 10,
                letterSpacing: "1px",
              }}
            >
              LLENO
            </div>
          )}

          <div
            style={{
              opacity: ticket.available<1 ? 0.5 : 1,
              filter: ticket.available<1 ? "blur(1px)" : "none",
              transition: "all 0.3s ease-in-out",
            }}
          >
            <h2 className={styles.sectionTitle}>
              {ticket.origin} ➡️ {ticket.destination}
            </h2>
            <p className={styles.sectionText}>
              📅 {ticket.date}
            </p>
            <p style="color: #44eb44;" className={styles.sectionText}>
              💰 {ticket.price} €
            </p>
            <p style="color: #44eb44;" className={styles.sectionText}>
              Disponibles : {ticket.available} 
            </p>
            <BuyButton availableTickets={ticket.available}/>
          </div>
        </div>
      </div>
    );
  }
}
