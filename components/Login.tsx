import { useState } from "preact/hooks";
import styles from "../assets/Login.module.css";
import AlertIsland from "../islands/Alert.tsx";
import { alertVisible } from "../signals.ts";

type Message = {
  message:string,
  visible:boolean
}


const LoginPage=()=> {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [msg, setMsg] = useState<Message>({message:"", visible:false});
  
  async function handleLogin (e: Event){
    e.preventDefault();
    const bodyData = { email: email, password: password };
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg({message:"✅ Login correcto",visible:true});
      alertVisible.value = true;
      const bearer = document.cookie
        .split("; ")
        .find((c) => c.startsWith("bearer="))
        ?.split("=")[1];
      if (!bearer) {
        setMsg({ message: "❌ No valid token found", visible: true });
        alertVisible.value = true;
        return;
      }
      const verifyRes = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bearer, email }),
      });
      if (verifyRes.ok) {
        const verified = await verifyRes.json();
        if (verified.success === "OK") {
          const token = String(verified.bearer ?? "");
          document.cookie = `bearer=${encodeURIComponent(token)}; Path=/; Max-Age=${3600}; SameSite=Lax${
            location.protocol === "https:" ? "; Secure" : ""
          }`;
          globalThis.location.replace("/profile");
          return;
        }
        } else {
          setMsg({ message: "❌ Invalid Token", visible: true });
          alertVisible.value = true;
        }
    } else {
      if(res.status === 429){
        setMsg({ message: `❌ ${data.error}`, visible: true });
        alertVisible.value = true;
        return;
      }else{
      setMsg({ message: `❌ Login Incorrecto`, visible: true });
      alertVisible.value = true;
      }
    }
}


  return (
    <div className={styles.container}>
      <div className={styles.glassBox}>
        <h1 className={styles.title}>Iniciar Sesion</h1>
       {msg.visible && alertVisible.value && (
        <AlertIsland type={1} message={msg.message} error={!msg.message.toLowerCase().includes("✅")}/>
    )}
        <form onSubmit={handleLogin} className={styles.form} action="javascript:void(0)">
          
            <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="Email"
              value={email}
              onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
              className={styles.input}
            />
            <span className={styles.icon}>✉️</span>
          </div>

          <div className={styles.inputGroup}>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
              className={styles.input}
            />
            <span className={styles.icon}>🔒</span>
          </div>

          <div className={styles.options}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe((e.target as HTMLInputElement).checked)}
              />
              Recuerdame
            </label>
            <a href="#" className={styles.link}>Olvido su contraseña?</a>
          </div>

          <button type="submit" className={styles.button}>
            Iniciar Sesion
          </button>
        </form>

        <p className={styles.register}>
          No tienes una cuenta? <a href="/register" className={styles.registerLink}>Registro</a>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;