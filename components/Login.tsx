import { useEffect, useState } from "preact/hooks";
import styles from "../assets/Login.module.css";
import AlertIsland from "../islands/Alert.tsx";
import { alertVisible } from "../signals.ts";

type Message = {
  message: string;
  visible: boolean;
};

declare global {
  interface Window {
    google?: any;
  }
}

const LoginPage = () => {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [msg, setMsg] = useState<Message>({ message: "", visible: false });

  const showMessage = (message: string) => {
    setMsg({ message, visible: true });
    alertVisible.value = true;
  };

  async function handleLogin(e: Event) {
    e.preventDefault();
    const bodyData = { email, password };
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    });
    const data = await res.json();
    if (res.ok) {
      showMessage("✅ Login correcto");
      const bearer = document.cookie
        .split("; ")
        .find((c) => c.startsWith("bearer="))
        ?.split("=")[1];
      if (!bearer) {
        showMessage("❌ No valid token found");
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
        showMessage("❌ Invalid Token");
      }
    } else {
        showMessage(`❌ ${data.error}`);
        return;
    }
  }

  useEffect(() => {
    let cancelled = false;

    const loadGoogleScript = () => {
      return new Promise<void>((resolve, reject) => {
        const existing = document.getElementById("google-identity-script") as
          | HTMLScriptElement
          | null;

        if (existing) {
          if (window.google?.accounts?.id) {
            resolve();
          } else {
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener("error", () => reject(), { once: true });
          }
          return;
        }

        const script = document.createElement("script");
        script.id = "google-identity-script";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.head.appendChild(script);
      });
    };

    const setupGoogleSignIn = async () => {
      try {
        const clientRes = await fetch("/api/oauth/google/client-id");
        if (!clientRes.ok) return;
        const clientData = await clientRes.json();
        const clientId = String(clientData?.clientId || "").trim();
        if (!clientId) return;

        await loadGoogleScript();
        if (cancelled || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential?: string }) => {
            const idToken = String(response?.credential || "").trim();
            if (!idToken) {
              showMessage("❌ No se pudo obtener credencial de Google");
              return;
            }

            const loginRes = await fetch("/api/login/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken }),
            });

            if (!loginRes.ok) {
              const errData = await loginRes.json().catch(() => ({ error: "Error OAuth" }));
              showMessage(`❌ ${errData.error || "Error OAuth"}`);
              return;
            }

            showMessage("✅ Login con Google correcto");
            globalThis.location.replace("/profile");
          },
        });

        const googleContainer = document.getElementById("google-signin-button");
        if (googleContainer) {
          googleContainer.innerHTML = "";
          window.google.accounts.id.renderButton(googleContainer, {
            theme: "outline",
            size: "large",
            shape: "pill",
            text: "signin_with",
            locale: "es",
            width: 320,
          });
        }
      } catch (error) {
        console.error("Error setting up Google login:", error);
      }
    };

    void setupGoogleSignIn();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.glassBox}>
        <h1 className={styles.title}>Iniciar Sesion</h1>
        {msg.visible && alertVisible.value && (
          <AlertIsland
            type={1}
            message={msg.message}
            error={!msg.message.toLowerCase().includes("✅")}
          />
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
                onChange={(e) =>
                  setRememberMe((e.target as HTMLInputElement).checked)}
              />
              Recuerdame
            </label>
            <a href="#" className={styles.link}>Olvido su contraseña?</a>
          </div>

          <button type="submit" className={styles.button}>
            Iniciar Sesion
          </button>
        </form>

        <div className={styles.oauthDivider}>o continúa con</div>
        <div className={styles.googleWrap}>
          <div id="google-signin-button" />
        </div>

        <p className={styles.register}>
          No tienes una cuenta?{" "}
          <a href="/register" className={styles.registerLink}>Registro</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
