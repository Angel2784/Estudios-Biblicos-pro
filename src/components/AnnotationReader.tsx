"use client";
import { useState } from "react";
import { testApiKey } from "@/lib/gemini";

interface Props {
  onSave: (key: string) => void;
}

// ─── Componente: instrucciones para obtener la API Key ───────────────────────
function HowToGetKey() {
  const [open, setOpen] = useState(false);

  const steps = [
    {
      icon: "🌐",
      text: (
        <>
          Ve a{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener"
            className="text-yellow-400 underline hover:text-yellow-300 font-medium"
          >
            aistudio.google.com/apikey
          </a>
        </>
      ),
    },
    { icon: "🔐", text: "Inicia sesión con tu cuenta de Google (es gratis)." },
    { icon: "➕", text: 'Haz clic en "Create API key" y selecciona un proyecto.' },
    { icon: "📋", text: 'Copia la key que empieza con "AIza..." y pégala arriba.' },
    { icon: "✅", text: "¡Listo! La key se guarda solo en tu dispositivo." },
  ];

  return (
    <div className="mt-4">
      {/* Encabezado clickeable */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-yellow-400 transition-colors px-1"
      >
        <span className="flex items-center gap-1">
          <span>❓</span>
          <span>¿Cómo obtengo mi API Key?</span>
        </span>
        <span
          className="transition-transform duration-300"
          style={{ display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▼
        </span>
      </button>

      {/* Pasos desplegables */}
      {open && (
        <div
          className="mt-3 rounded-xl p-4 border border-yellow-900/30 text-xs space-y-3"
          style={{ background: "rgba(10, 22, 50, 0.7)" }}
        >
          <p className="text-yellow-400 font-semibold mb-1">📖 Pasos para obtener tu API Key gratuita:</p>
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              {/* Número */}
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs"
                style={{ background: "linear-gradient(135deg, #d4a017, #f0c040)", color: "#0a1628" }}
              >
                {i + 1}
              </span>
              {/* Texto */}
              <p className="text-gray-300 leading-relaxed">
                <span className="mr-1">{step.icon}</span>
                {step.text}
              </p>
            </div>
          ))}

          {/* Nota final */}
          <div className="mt-2 bg-yellow-900/20 border border-yellow-800/30 rounded-lg px-3 py-2 text-yellow-300/80">
            💡 <strong> Google ofrece 1,500 requests/día sin costo ni tarjeta de crédito. </strong> 
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ApiKeySetup({ onSave }: Props) {
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  const handleTest = async () => {
    if (!key.trim()) return;
    setStatus("testing");
    setStatusMsg("Probando modelos disponibles...");

    const result = await testApiKey(key.trim());

    if (result.ok) {
      setStatus("ok");
      setStatusMsg(`✅ Conectado con "${result.model}"`);
      localStorage.setItem("gemini_api_key", key.trim());
      localStorage.setItem("gemini_active_model", result.model);
      setTimeout(() => onSave(key.trim()), 800);
    } else {
      setStatus("error");
      setStatusMsg(
        result.error?.includes("Cuota agotada")
          ? "⚠️ Cuota agotada en todos los modelos. Espera unas horas o genera una nueva API Key."
          : `❌ Error: ${result.error}`
      );
    }
  };

  return (
    // ✅ CAMBIO 1: fondo azul oscuro + dorado en degradado
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #0a1628 0%, #0f2347 35%, #1a3a6b 55%, #2c1f06 80%, #3d2a08 100%)",
      }}
    >
      {/* ✅ CAMBIO 2: card con fondo semitransparente azul oscuro */}
      <div
        className="rounded-2xl p-8 w-full max-w-md shadow-2xl border border-yellow-900/30"
        style={{ background: "rgba(10, 22, 50, 0.85)", backdropFilter: "blur(10px)" }}
      >
        {/* Ícono */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">📜</div>
          <h1 className="text-2xl font-bold text-yellow-400">Estudio Bíblico Pro</h1>
          <p className="text-gray-400 text-sm mt-1">Exégesis académica con inteligencia artificial</p>
        </div>

        {/* Card API Key */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-yellow-900/40 p-2 rounded-lg text-xl">🔑</div>
            <div>
              <p className="font-semibold text-white">Conecta tu API Key de Gemini</p>
              <p className="text-xs text-gray-400">Gratis · Se guarda solo en tu dispositivo</p>
            </div>
          </div>

          {/* Input */}
          <div className="relative mb-3">
            <input
              type={show ? "text" : "password"}
              value={key}
              onChange={(e) => { setKey(e.target.value); setStatus("idle"); }}
              onKeyDown={(e) => e.key === "Enter" && handleTest()}
              placeholder="AIza..."
              className="w-full bg-white/10 text-white rounded-lg px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-yellow-400 text-sm placeholder-gray-500"
            />
            <button
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {show ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Status */}
          {status !== "idle" && (
            <div className={`text-xs rounded-lg px-3 py-2 mb-3 ${
              status === "ok"    ? "bg-green-900 text-green-300" :
              status === "error" ? "bg-red-900 text-red-300" :
                                   "bg-blue-900 text-blue-300"
            }`}>
              {statusMsg}
            </div>
          )}

          {/* Botón */}
          <button
            onClick={handleTest}
            disabled={!key.trim() || status === "testing"}
            className="w-full font-semibold rounded-lg py-3 text-sm transition-all"
            style={
              !key.trim() || status === "testing"
                ? { background: "#4b5563", color: "#9ca3af", cursor: "not-allowed" }
                : { background: "#f0c040", color: "#0a1628", cursor: "pointer", boxShadow: "0 0 14px rgba(240,192,64,0.5)" }
            }
          >
            {status === "testing" ? "Probando modelos..." : "Conectar"}
          </button>
        </div>

        {/* Sección: Cómo obtener la API Key */}
        <HowToGetKey />
      </div>
    </div>
  );
}
