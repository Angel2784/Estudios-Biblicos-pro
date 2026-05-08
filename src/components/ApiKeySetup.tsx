"use client";
import { useState } from "react";
import { testApiKey } from "@/lib/gemini";

interface Props {
  onKeyConfirmed: (key: string) => void;
}

export default function ApiKeySetup({ onKeyConfirmed }: Props) {
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
      // Guardar en localStorage y continuar
      localStorage.setItem("gemini_api_key", key.trim());
      localStorage.setItem("gemini_active_model", result.model);
      setTimeout(() => onKeyConfirmed(key.trim()), 800);
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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md shadow-xl">
        {/* Ícono */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">📜</div>
          <h1 className="text-2xl font-bold text-yellow-400">Estudio Bíblico Pro</h1>
          <p className="text-gray-400 text-sm mt-1">Exégesis académica con inteligencia artificial</p>
        </div>

        {/* Card API Key */}
        <div className="bg-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gray-700 p-2 rounded-lg text-xl">🔑</div>
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
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
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
              status === "ok"      ? "bg-green-900 text-green-300" :
              status === "error"   ? "bg-red-900 text-red-300" :
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

        {/* Info modelos */}
        <div className="mt-4 bg-gray-800 rounded-xl p-4 text-xs text-gray-400">
          <p className="font-semibold text-gray-300 mb-2">🤖 Modelos disponibles (auto-fallback):</p>
          <ul className="space-y-1">
            <li>• Gemini 2.5 Flash <span className="text-green-400">← prioridad 1</span></li>
            <li>• Gemini 2.0 Flash Lite</li>
            <li>• Gemini 1.5 Flash</li>
            <li>• Gemini 1.5 Flash 8B <span className="text-yellow-400">← más requests gratis</span></li>
            <li>• Gemini 2.0 Flash</li>
          </ul>
          <p className="mt-2">Obtén tu key gratis en{" "}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener"
               className="text-yellow-400 underline">aistudio.google.com/apikey</a>
          </p>
        </div>
      </div>
    </div>
  );
}
