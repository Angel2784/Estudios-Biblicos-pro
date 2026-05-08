"use client";
import { useState } from "react";
import { testApiKey } from "@/lib/gemini";

interface Props {
  onSave: (key: string) => void;
}

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
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold rounded-lg py-3 text-sm transition-colors"
          >
            {status === "testing" ? "Probando modelos..." : "Conectar"}
          </button>
        </div>

        {/* ✅ CAMBIO 3: sección de modelos eliminada */}
        {/* Solo dejamos el link a la API Key como texto sutil */}
        <p className="text-center text-xs text-gray-500 mt-4">
          Obtén tu key gratis en{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener"
            className="text-yellow-400 underline hover:text-yellow-300"
          >
            aistudio.google.com/apikey
          </a>
        </p>
      </div>
    </div>
  );
}
