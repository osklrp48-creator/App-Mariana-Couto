import { useState } from "react";
import { PinKeypad } from "../../components/PinKeypad";
import { db } from "../../db/db";
import { useLock } from "../../contexts/LockContext";
import { hashPin, randomSalt } from "../../lib/pin";
import { LockIcon } from "../../components/icons";

function Dots({ length, error }: { length: number; error: boolean }) {
  return (
    <div className="pin-dots">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`pin-dot ${i < length ? "filled" : ""} ${error ? "error" : ""}`} />
      ))}
    </div>
  );
}

export function PinSetup() {
  const { unlock } = useLock();
  const [stage, setStage] = useState<"create" | "confirm">("create");
  const [first, setFirst] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const handleDigit = async (d: string) => {
    if (value.length >= 4) return;
    const next = value + d;
    setValue(next);
    setError(false);
    if (next.length === 4) {
      if (stage === "create") {
        setTimeout(() => {
          setFirst(next);
          setValue("");
          setStage("confirm");
        }, 150);
      } else {
        if (next === first) {
          const salt = randomSalt();
          const pinHash = await hashPin(next, salt);
          await db.settings.update("app", { pinHash, pinSalt: salt, onboardingDone: true });
          unlock();
        } else {
          setError(true);
          setTimeout(() => {
            setValue("");
            setError(false);
          }, 500);
        }
      }
    }
  };

  const handleBackspace = () => setValue((v) => v.slice(0, -1));

  return (
    <div className="pin-screen">
      <LockIcon width={32} height={32} />
      <div className="stack" style={{ alignItems: "center", gap: 6 }}>
        <h1>{stage === "create" ? "Crie um PIN" : "Confirme o PIN"}</h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, textAlign: "center" }}>
          {stage === "create"
            ? "Escolha 4 dígitos para proteger o app."
            : "Digite novamente para confirmar."}
        </p>
      </div>
      <Dots length={value.length} error={error} />
      <PinKeypad onDigit={handleDigit} onBackspace={handleBackspace} />
    </div>
  );
}
