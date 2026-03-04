import { App, staticFiles } from "fresh";
import { define, type State } from "./utils.ts";
import dotenv from "dotenv";

export const app = new App<State>();
app.use(staticFiles());

dotenv.config();
const backendUrl = (Deno.env.get("BACKEND_URL") || "https://backend-renfe.sergioom9.deno.net").replace(/\/$/, "");

const apiCachePolicy = define.middleware(async (ctx: any) => {
  const response = await ctx.next();
  const path = new URL(ctx.req.url).pathname;

  const isCacheableGet = ctx.req.method === "GET" &&
    (path === "/api/news" || path === "/api/tickets" ||
      path.startsWith("/api/ticket/") || path.startsWith("/api/track/"));

  if (isCacheableGet) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=60, stale-while-revalidate=30",
    );
  } else {
    response.headers.set("Cache-Control", "no-store");
  }

  return response;
});

async function getDbContext(tkn:string): Promise<string> {
  const loggedIn = await checkToken(tkn);
  let context = "";
  try {
    const [ticketsRes, newsRes,trackRes] = await Promise.all([
      fetch("https://backend-renfe.sergioom9.deno.net/ticket"),
      fetch("https://backend-renfe.sergioom9.deno.net/news"),
      fetch("https://backend-renfe.sergioom9.deno.net/track"),
    ]);
    if(loggedIn){
      const userRes = await fetch(
        "https://backend-renfe.sergioom9.deno.net/token/user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bearer: tkn }),
        },
      );
      if (userRes.ok) {
        const userData = await userRes.json();
        context += `[USUARIO]\n${JSON.stringify(userData, null, 2)}\n`;
      }
    }
    if (ticketsRes.ok) {
      const tickets = await ticketsRes.json();
      context += `\n[TICKETS / TRENES DISPONIBLES]\n`;
      context += JSON.stringify(tickets, null, 2);
    }

    if (newsRes.ok) {
      const news = await newsRes.json();
      context += `\n[NOTICIAS / AVISOS]\n`;
      context += JSON.stringify(news, null, 2);
    }
    if(trackRes.ok){
      const track = await trackRes.json();
      context += `\n[SEGUIMIENTO DE TRENES]\n`;
      context += JSON.stringify(track, null, 2);
    }
  } catch (_e) {
    context += `\n[ERROR OBTENIENDO DATOS]\n`;
  }

  return context
}

app.use("/api", apiCachePolicy);

app.post("/api/login", async (ctx: any) => {
  try {
    const data = await ctx.req.json();
    if (!data) {
      return new Response(
        JSON.stringify({ error: "Body vacío" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const { email, password } = data;
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Campos vacíos" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const apiResponse = await fetch(
      "https://backend-renfe.sergioom9.deno.net/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );
    const result = await apiResponse.json();
    if (result.error == "Anti-BruteForce Triggered") {
      return new Response(
        JSON.stringify({ error: "Email bloqueado por seguridad" }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }
    if (result.error == "Too many requests") {
      return new Response(
        JSON.stringify({
          error: "Demasiadas solicitudes, inténtalo más tarde",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }
    if (!apiResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Credenciales Incorrectas" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: apiResponse.headers },
    );
  } catch (error) {
    console.error("Error en /api/login:", error);
    return new Response(
      JSON.stringify({ error: `Error interno` }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

app.get("/api/oauth/google/client-id", async () => {
  const clientId = (Deno.env.get("GOOGLE_OAUTH_CLIENT_ID") || Deno.env.get("ID_OAUTH2") || "").trim();
  if (!clientId) {
    return new Response(JSON.stringify({ error: "Google OAuth client ID missing" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ clientId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

app.post("/api/login/google", async (ctx: any) => {
  try {
    const data = await ctx.req.json();
    const idToken = String(data?.idToken || "").trim();

    if (!idToken) {
      return new Response(JSON.stringify({ error: "Missing idToken" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiResponse = await fetch(`${backendUrl}/login/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    const result = await apiResponse.json();

    if (!apiResponse.ok) {
      return new Response(
        JSON.stringify({ error: result?.error || "Google login failed" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: apiResponse.headers,
    });
  } catch (_error) {
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

app.post("/api/register", async (ctx: any) => {
  try {
    const data = await ctx.req.json();
    if (!data) {
      return new Response(
        JSON.stringify({ error: "Body vacío" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const { email, password, userid, name } = data;
    if (!email || !password || !userid || !name) {
      return new Response(
        JSON.stringify({ error: "Campos vacíos" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const apiResponse = await fetch(
      "https://backend-renfe.sergioom9.deno.net/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );
    if (!apiResponse.ok) {
      return new Response(
        JSON.stringify({ error: apiResponse.statusText }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    const result = await apiResponse.json();
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: apiResponse.headers },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Error interno` }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

app.post("/api/token", async (ctx: any) => {
  try {
    const data = await ctx.req.json();
    if (!data) {
      return new Response(
        JSON.stringify({ error: "Body vacío" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const { email, bearer } = data;
    if (!email || !bearer) {
      return new Response(
        JSON.stringify({ error: "Campos vacíos" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const apiResponse = await fetch(
      "https://backend-renfe.sergioom9.deno.net/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );
    if (!apiResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Credenciales Incorrectas" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    const result = await apiResponse.json();
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: apiResponse.headers },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Error interno` }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

app.post("/api/user", async (ctx: any) => {
  try {
    const data = await ctx.req.json();
    const { bearer } = data;
    const apiResponse = await fetch(
      "https://backend-renfe.sergioom9.deno.net/token/user",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bearer }),
      },
    );
    if (!apiResponse.ok) {
      return new Response(
        JSON.stringify({ error: apiResponse.statusText }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    const result = await apiResponse.json();
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Error interno` }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

app.get("/api/news", async () => {
  try {
    const apiResponse = await fetch(
      "https://backend-renfe.sergioom9.deno.net/news",
    );
    if (!apiResponse.ok) {
      return new Response(
        JSON.stringify({ error: apiResponse.statusText }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    const result = await apiResponse.json();
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Error interno` }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

app.get("/api/tickets", async () => {
  try {
    const apiResponse = await fetch(
      "https://backend-renfe.sergioom9.deno.net/ticket",
    );
    if (!apiResponse.ok) {
      return new Response(
        JSON.stringify({ error: apiResponse.statusText }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    const result = await apiResponse.json();
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Error interno` }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

app.get("/api/ticket/:ticketid", async (ctx: any) => {
  try {
    const ticketid = ctx.params.ticketid;
    const apiResponse = await fetch(
      `https://backend-renfe.sergioom9.deno.net/ticket/${ticketid}`,
    );
    if (!apiResponse.ok) {
      return new Response(
        JSON.stringify({ error: apiResponse.statusText }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    const result = await apiResponse.json();
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Error interno` }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

app.post("/api/tickets", async (ctx: any) => {
  try {
    const data = await ctx.req.json();
    if (!data) {
      return new Response(
        JSON.stringify({ error: "Body vacío" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const { ticketid } = data;
    if (!ticketid) {
      return new Response(
        JSON.stringify({ error: "Campos vacíos" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const apiResponse = await fetch(
      `https://backend-renfe.sergioom9.deno.net/ticket/${ticketid}`,
    );
    if (!apiResponse.ok) {
      return new Response(
        JSON.stringify({ error: apiResponse.statusText }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    const result = await apiResponse.json();
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Error interno` }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

app.post("/api/news", async (ctx: any) => {
  try {
    const data = await ctx.req.json();
    if (!data) {
      return new Response(
        JSON.stringify({ error: "Body vacío" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const { newid } = data;
    if (!newid) {
      return new Response(
        JSON.stringify({ error: "Campos vacíos" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const apiResponse = await fetch(
      `https://backend-renfe.sergioom9.deno.net/news/${newid}`,
    );
    if (!apiResponse.ok) {
      return new Response(
        JSON.stringify({ error: apiResponse.statusText }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    const result = await apiResponse.json();
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Error interno` }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

app.post("/api/buy", async (ctx: any) => {
  try {
    const cookie = ctx.req.headers.get("cookie") || "";
    const match = cookie.match(/bearer=([^;]+)/);
    const token = match?.[1];
    if (!token) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/login" },
      });
    }
    const data = await ctx.req.json();
    if (!data) {
      return new Response(
        JSON.stringify({ error: "Body vacío" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const { ticketid, quantity } = data;
    if (!ticketid || !Number.isInteger(quantity) || quantity <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid params" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const apiResponse = await fetch(
      "https://backend-renfe.sergioom9.deno.net/token/user",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bearer: token }),
      },
    );
    if (!apiResponse.ok) {
      return new Response(
        JSON.stringify({ error: apiResponse.statusText }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    const result = await apiResponse.json();
    const { userid } = result;
    const apires2 = await fetch(
      "https://backend-renfe.sergioom9.deno.net/ticket/sell",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `bearer=${token}`,
        },
        body: JSON.stringify({ ticketid, userid, quantity }),
      },
    );
    if (!apires2.ok) {
      return new Response(
        JSON.stringify({ error: apires2.statusText }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    const resjson2 = await apires2.json();
    return new Response(
      JSON.stringify(resjson2),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (_error) {
    return new Response(
      JSON.stringify({ error: `Error interno` }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

app.get("/api/track/:ticketid", async (ctx: any) => {
  try {
    const ticketid = ctx.params.ticketid;
    const apiResponse = await fetch(
      `https://backend-renfe.sergioom9.deno.net/track/${ticketid}`,
    );
    if (!apiResponse.ok) {
      return new Response(
        JSON.stringify({ error: apiResponse.statusText }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    const result = await apiResponse.json();
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Error interno` }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

app.post("/api/chatbot", async (ctx: any) => {
  try {
    const cookie = ctx?.req?.headers?.get("cookie") || "";
    const match = cookie.match(/bearer=([^;]+)/);
    const token = match?.[1];
    const data = await ctx.req.json();
    if (!data) {
      return new Response(
        JSON.stringify({ error: "Body vacío" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { messages, message } = data;
    if (!message) {
      return new Response(
        JSON.stringify({ error: "Invalid params" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    } 

    const dbContext = await getDbContext(token);

    const systemPrompt = `Eres el asistente virtual de RENFE. Ayuda a los clientes con información sobre trenes, tickets, horarios y noticias.
                          Usa siempre los datos en tiempo real que se te proporcionan para responder con precisión.
                          Responde siempre en español.
                          ${dbContext}
                          Si no encuentras la información solicitada en los datos, indícalo amablemente.`;
    const geminiMessages = (messages ?? [{ role: "user", content: message }])
      .map((msg: { role: string; content: string }) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));


    const apiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
    const configuredModel = (Deno.env.get("GEMINI_MODEL") || "").trim();
    const fallbackModels = [
      "gemini-3.1-pro-preview",
      "gemini-3-flash-preview",
      "gemini-2.5-flash",
    ];
    const candidateModels = configuredModel
      ? [configuredModel, ...fallbackModels.filter((m) => m !== configuredModel)]
      : fallbackModels;

    const payload = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: geminiMessages,
      generationConfig: { maxOutputTokens: 1024, temperature: 1.0 },
    };

    let geminiData: any = null;
    let geminiRes: Response | null = null;

    for (const model of candidateModels) {
      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      geminiRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      geminiData = await geminiRes.json();
      if (geminiRes.ok) break;
      if (geminiData?.error?.code !== 404) break;
    }

    if (!geminiRes?.ok) {
      const listUrl =
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const listRes = await fetch(listUrl);
      if (listRes.ok) {
        const listData = await listRes.json();
        const firstCompatible = (listData?.models ?? []).find((m: any) =>
          Array.isArray(m?.supportedGenerationMethods) &&
          m.supportedGenerationMethods.includes("generateContent")
        );
        if (firstCompatible?.name) {
          const modelName = String(firstCompatible.name).replace("models/", "");
          const url =
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
          geminiRes = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          geminiData = await geminiRes.json();
        }
      }
    }

    if (!geminiRes?.ok) {
      return new Response(
        JSON.stringify({
          error: geminiData?.error?.message ||
            "No hay un modelo Gemini compatible con esta API key.",
        }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
      ?? "Lo siento, no pude generar una respuesta.";

    return new Response(
      JSON.stringify({ reply }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (_error) {
    return new Response(
      JSON.stringify({ error: "Error interno" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

const checkAuth = define.middleware(async (ctx: any) => {
  const cookie = ctx.req.headers.get("cookie") || "";
  const match = cookie.match(/bearer=([^;]+)/);
  const token = match?.[1];
  if (!token) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/login" },
    });
  }
  try {
    const apiResponse = await fetch(
      "https://backend-renfe.sergioom9.deno.net/token/user",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bearer: token }),
      },
    );
    if (!apiResponse.ok) {
      document.cookie =
        "bearer=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      return new Response(
        JSON.stringify({ error: apiResponse.statusText }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    return await ctx.next();
  } catch (_e) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/login" },
    });
  }
});

const alreadylogged = define.middleware(async (ctx: any) => {
  const cookie = ctx.req.headers.get("cookie") || "";
  const match = cookie.split("=");
  const token = match?.[1];
  if (!token) return await ctx.next();
  try {
    const apiResponse = await fetch(
      "https://backend-renfe.sergioom9.deno.net/token/user",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bearer: token }),
      },
    );
    if (!apiResponse.ok) {
      document.cookie =
        "bearer=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      return new Response(
        JSON.stringify({ error: apiResponse.statusText }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(null, {
      status: 302,
      headers: { Location: "/profile" },
    });
  } catch (_err) {
    return await ctx.next();
  }
});

const checkToken = async (token:string) => {
  if (!token) {
    return false
  }
  try {
    const apiResponse = await fetch(
      "https://backend-renfe.sergioom9.deno.net/token/user",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bearer: token }),
      },
    );
    if (!apiResponse.ok) {
      return false;
    }
    return true;
  } catch (_e) {
    return false;

  }
};

app.use("/tickets/(main)", checkAuth);
app.use("/(me)", checkAuth);

app.use("/(main)", alreadylogged);

app.fsRoutes();
