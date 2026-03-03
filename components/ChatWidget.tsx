import type { ComponentChildren } from "preact";
import { useMemo, useState } from "preact/hooks";
import chat from "../assets/chat.webp";

type Role = "user" | "assistant";

type ChatMessage = {
  role: Role;
  content: string;
};

const WELCOME_MESSAGE =
  "Hola, soy el asistente de Trenfe. Estoy para ayudarte.";

const INLINE_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g;
const EMPHASIS_PATTERN = /\*\*([^*\n]+)\*\*|\*(?!\s)([^*\n]+?)\*/g;

function parseEmphasis(segment: string, keyBase: string) {
  const nodes: ComponentChildren[] = [];
  let cursor = 0;
  let index = 0;

  for (const match of segment.matchAll(EMPHASIS_PATTERN)) {
    const start = match.index ?? 0;
    const full = match[0];
    const value = match[1] ?? match[2] ?? "";

    if (start > cursor) {
      nodes.push(segment.slice(cursor, start));
    }

    nodes.push(
      <strong key={`${keyBase}-em-${index++}`}>{value}</strong>,
    );
    cursor = start + full.length;
  }

  if (cursor < segment.length) {
    nodes.push(segment.slice(cursor));
  }

  return nodes;
}

function renderInlineText(text: string, keyBase: string) {
  const nodes: ComponentChildren[] = [];
  let cursor = 0;
  let index = 0;

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const start = match.index ?? 0;
    const full = match[0];

    if (start > cursor) {
      nodes.push(...parseEmphasis(text.slice(cursor, start), `${keyBase}-txt-${index}`));
    }

    const markdownLabel = match[1];
    const markdownHref = match[2];
    const directHref = match[3];

    if (markdownLabel && markdownHref) {
      nodes.push(
        <a
          key={`${keyBase}-a-${index++}`}
          className="chat-link"
          href={markdownHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          {markdownLabel}
        </a>,
      );
    } else if (directHref) {
      nodes.push(
        <a
          key={`${keyBase}-u-${index++}`}
          className="chat-link"
          href={directHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          {directHref}
        </a>,
      );
    }

    cursor = start + full.length;
  }

  if (cursor < text.length) {
    nodes.push(...parseEmphasis(text.slice(cursor), `${keyBase}-tail`));
  }

  return nodes;
}

function renderFormattedMessage(content: string, keyBase: string) {
  const lines = content.split("\n");

  return lines.map((line, i) => {
    const bulletMatch = line.match(/^\s*[*-]\s+(.+)$/);
    const lineNodes = bulletMatch
      ? ["• ", ...renderInlineText(bulletMatch[1], `${keyBase}-l-${i}`)]
      : renderInlineText(line, `${keyBase}-l-${i}`);

    return (
      <span key={`${keyBase}-line-${i}`}>
        {lineNodes}
        {i < lines.length - 1 ? <br /> : null}
      </span>
    );
  });
}

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: WELCOME_MESSAGE },
  ]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [
    input,
    loading,
  ]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          messages: nextMessages.slice(-12),
        }),
      });

      if (!response.ok) throw new Error("chatbot_error");

      const data = await response.json();
      const reply = typeof data?.reply === "string" && data.reply.trim()
        ? data.reply.trim()
        : "No he podido responder ahora mismo. Intentalo de nuevo en unos segundos.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (_error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "No hay conexion con el asistente en este momento. Prueba de nuevo.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-widget-root" aria-live="polite">
      {open
        ? (
          <section className="chat-panel" aria-label="Asistente Trenfe">
            <header className="chat-panel-header">
              <strong>Asistente Trenfe</strong>
              <button
                type="button"
                className="chat-icon-button chat-close"
                onClick={() => setOpen(false)}
                aria-label="Cerrar chatbot"
              >
                x
              </button>
            </header>

            <div className="chat-messages">
              {messages.map((msg, index) => (
                <p
                  className={`chat-bubble ${msg.role === "user" ? "chat-user" : "chat-assistant"}`}
                  key={`${msg.role}-${index}-${msg.content.slice(0, 8)}`}
                >
                  {renderFormattedMessage(msg.content, `msg-${index}`)}
                </p>
              ))}
              {loading && (
                <p className="chat-bubble chat-assistant">Escribiendo...</p>
              )}
            </div>

            <form
              className="chat-input-row"
              onSubmit={(event) => {
                event.preventDefault();
                void sendMessage();
              }}
            >
              <input
                type="text"
                placeholder="Escribe tu mensaje..."
                value={input}
                onInput={(event) => setInput((event.target as HTMLInputElement).value)}
                className="chat-input"
                maxLength={500}
              />
              <button type="submit" className="chat-send" disabled={!canSend}>
                Enviar
              </button>
            </form>
          </section>
        )
        : (
          <button
            type="button"
            className="chat-icon-button chat-fab"
            aria-label="Abrir chatbot"
            onClick={() => setOpen((current) => !current)}
          >
            <img
              src={chat}
              style="border-radius:50%"
              alt="Chat Icon"
              className="chat-icon"
            />
          </button>
        )}
    </div>
  );
};

export default ChatWidget;
