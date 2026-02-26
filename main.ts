import { App, staticFiles } from "fresh";
import { define, type State } from "./utils.ts";
import dotenv from "dotenv";

export const app = new App<State>();
app.use(staticFiles());

dotenv.config();

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
    if(result.error=="Anti-BruteForce Triggered") {
      return new Response(
        JSON.stringify({ error: "Email bloqueado por seguridad" }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }
    if(result.error=="Too many requests") {
      return new Response(
        JSON.stringify({ error: "Demasiadas solicitudes, inténtalo más tarde" }),
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
    return new Response(
      JSON.stringify({ error: `Error interno` }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
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

app.use("/tickets/(main)", checkAuth);
app.use("/(me)", checkAuth);

app.use("/(main)", alreadylogged);

app.fsRoutes();
