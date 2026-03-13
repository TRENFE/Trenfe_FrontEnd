import { useState,useEffect } from "preact/hooks";

interface BuyButtonProps {
  availableTickets: number;
}

export default function BuyButton({ availableTickets }: BuyButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  
  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    if (quantity < availableTickets) setQuantity(quantity + 1);
  };

  const getDiscount = async () => {
    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bearer: document.cookie
          .split(";")
          .find((row) => row.trim().startsWith("bearer="))
          ?.split("=")[1],
      }),
    });
    if (!res.ok) {
      setDiscount(0);
    }
    const data = await res.json();
    const descuento = data.coins / 100;
    setDiscount(descuento);
  };

  const handleClick = async (e: MouseEvent) => {
    e.preventDefault();
    const path = globalThis.location?.pathname ?? "";
    const id = path.split("/").pop() ?? null;
    if (!id) {
      globalThis.location.replace("/tickets");
      return;
    }
    const res = await fetch("/api/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, quantity }),
    });
    if (!res.ok) {
      globalThis.location.replace("/tickets");
      return;
    }
    if (res.status === 302) {
    const location = res.headers.get("Location");
    if (location) {
      console.log(location)
      globalThis.location.href = location;
      return;
    }
  }
    return
  };

  useEffect(() => {
    getDiscount();
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-center gap-4">
        <button
          style="margin:20px"
          onClick={handleDecrease}
          disabled={quantity <= 1}
          className="w-10 h-10 rounded-full border-2 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          -
        </button>
        <span className="text-xl font-semibold min-w-[3ch] text-center">
          {quantity}
        </span>
        <button
          style="margin:20px"
          onClick={handleIncrease}
          disabled={quantity >= availableTickets}
          className="w-10 h-10 rounded-full border-2 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          +
        </button>
      </div>
      <p>Descuento aplicado a la compra : {discount} $</p>
      <button
        style="margin:20px"
        onClick={handleClick}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        🎟️ Comprar {quantity} {quantity === 1 ? "billete" : "billetes"}
      </button>
      <p className="text-sm text-gray-600 text-center">
        {availableTickets} disponibles
      </p>
    </div>
  );
}
