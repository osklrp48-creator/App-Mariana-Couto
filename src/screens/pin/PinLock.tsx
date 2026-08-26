import { useState } from "react";
import { PinKeypad } from "../../components/PinKeypad";
import { db } from "../../db/db";
import { useLock } from "../../contexts/LockContext";
import { hashPin } from "../../lib/pin";
import { AlertTriangleIcon, LockIcon } from "../../components/icons";

const WIPE_WORD = "APAGAR";

function Dots({ length, error }: { length: number; error: boolean }) {
  return (
    <div className="pin-dots">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`pin-dot ${i < length ? "filled" : ""} ${error ? "error" : ""}`} />
      ))}
    </div>
  );
}

export function PinLock() {
  const { settings, unlock } = useLock();
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [wipeText, setWipeText] = useState("");
  const [wiping, setWiping] = useState(false);

  const handleDigit = async (d: string) => {
    if (value.length >= 4 || !settings) return;
    const next = value + d;
    setValue(next);
    if (next.length === 4) {
      const candidate = await hashPin(next, settings.pinSalt ?? "");
      if (candidate === settings.pinHash) {
        setError(false);
        unlock();
      } else {
        setError(true);
        setTimeout(() => {
          setValue("");
          setError(false);
        }, 450);
      }
    }
  };

  const handleBackspace = () => setValue((v) => v.slice(0, -1));

  const wipeEverything = async () => {
    setWiping(true);
    try {
      await db.delete();
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  if (forgot) {
    return (
      <div className="pin-screen">
        <AlertTriangleIcon width={30} height={30} style={{ color: "#f0c04b" }} />
        <div className="stack" style={{ alignItems: "center", gap: 8, maxWidth: 320 }}>
          <h1 style={{ fontSize: 20, textAlign: "center" }}>Esqueceu o PIN?</h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13.5, textAlign: "center" }}>
            Não existe servidor nem forma de recuperar o PIN. A única opção é apagar todos os
            dados deste app do aparelho — pacientes, agenda e financeiro serão perdidos
            permanentemente.
          </p>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13.5, textAlign: "center" }}>
            Para confirmar, digite <strong>{WIPE_WORD}</strong> abaixo.
          </p>
        </div>
        <input
          value={wipeText}
          onChange={(e) => setWipeText(e.target.value.toUpperCase())}
          placeholder={WIPE_WORD}
          style={{
            width: "100%",
            maxWidth: 280,
            padding: "13px 14px",
            borderRadius: 10,
            border: "1.5px solid rgba(255,255,255,0.3)",
            background: "rgba(255,255,255,0.08)",
            color: "#fff",
            textAlign: "center",
            fontWeight: 700,
            letterSpacing: "0.08em",
          }}
        />
        <div className="stack" style={{ width: "100%", maxWidth: 280 }}>
          <button
            className="btn btn-danger btn-block"
            disabled={wipeText !== WIPE_WORD || wiping}
            onClick={wipeEverything}
          >
            {wiping ? "Apagando..." : "Apagar todos os dados"}
          </button>
          <button
            className="btn btn-block"
            style={{ background: "transparent", color: "#fff" }}
            onClick={() => {
              setForgot(false);
              setWipeText("");
            }}
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pin-screen">
      <LockIcon width={32} height={32} />
      <h1>Digite seu PIN</h1>
      <Dots length={value.length} error={error} />
      {error && (
        <p style={{ color: "#f4b8c6", fontSize: 13, marginTop: -12 }}>PIN incorreto, tente de novo</p>
      )}
      <PinKeypad onDigit={handleDigit} onBackspace={handleBackspace} />
      <button
        onClick={() => setForgot(true)}
        style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 4 }}
      >
        Esqueci meu PIN
      </button>
    </div>
  );
}
