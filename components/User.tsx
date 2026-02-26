import { useEffect, useState } from "preact/hooks";
import Loading from "../components/Loading.tsx";
import styles from "../assets/IndividualUser.module.css";

type UserType = {
  userid: string;
  name: string;
  email: string;
  password: string;
  coins: string;
};

export default function IndividualUser() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const load = async () => {
      try {
        const tkn = document.cookie
          .split(";")
          .find((row) => row.trim().startsWith("bearer="))
          ?.split("=")[1];
        const res = await fetch("/api/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bearer: tkn }),
        });

        if (!res.ok) {
          globalThis.location.replace("/");
          return;
        }

        const data = await res.json();
        if (!cancelled) setUser(data);
      } catch (_err) {
        if (!cancelled) globalThis.location.replace("/");
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
  if (user) {
    return (
  <div
    key={user.userid}
    className={styles.liquidglass2}
    style={{ cursor: "pointer",width:"700px" }}
  >
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" ,margin:"30px",alignItems: "center"}}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBlock: "15px" }}>
        <span style={{ fontSize: "1.5rem" }}>👤</span>
        <h2 className={styles.sectionTitle}>{user.userid}</h2>
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBlock: "15px" }}>
        <span style={{ fontSize: "1.25rem", minWidth: "1.5rem" }}>📧</span>
        <p className={styles.sectionText}>{user.email}</p>
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBlock: "15px" }}>
        <span style={{ fontSize: "1.25rem", minWidth: "1.5rem" }}>✨</span>
        <p className={styles.sectionText}>{user.name}</p>
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBlock: "15px" }}>
        <span style={{ fontSize: "1.25rem", minWidth: "1.5rem" }}>🪙</span>
        <p className={styles.sectionText}>{user.coins}</p>
      </div>
    </div>
  </div>
);
  }
}
