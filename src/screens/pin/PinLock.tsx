import { useState } from "react";
import { PinKeypad } from "../../components/PinKeypad";
import { useLock } from "../../contexts/LockContext";
import { hashPin } from "../../lib/pin";
import { signOutAndResetLocalLock } from "../../lib/accountReset";
import { AlertTriangleIcon, LockIcon } from "../../components/icons";

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
  const [resetting, setResetting] = useState(false);

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

  const handleReset = async () => {
    setResetting(true);
    await signOutAndResetLocalLock();
  };

  if (forgot) {
    return (
      <div className="pin-screen">
        <AlertTriangleIcon width={30} height={30} style={{ color: "#f0c04b" }} />
        <div className="stack" style={{ alignItems: "center", gap: 8, maxWidth: 320 }}>
          <h1 style={{ fontSize: 20, textAlign: "center" }}>Esqueceu o PIN?</h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13.5, textAlign: "center" }}>
            Sem problema: seus dados (pacientes, agenda e financeiro) estão salvos na nuvem, não
            só neste PIN. Ao continuar, você sai deste aparelho e volta para a tela de entrar —
            é só fazer login de novo com seu e-mail e senha para recuperar tudo e criar um novo
            PIN.
          </p>
        </div>
        <div className="stack" style={{ width: "100%", maxWidth: 280 }}>
          <button className="btn btn-block" style={{ background: "#fff", color: "var(--pine-dark)" }} disabled={resetting} onClick={handleReset}>
            {resetting ? "Saindo..." : "Sair e entrar novamente"}
          </button>
          <button
            className="btn btn-block"
            style={{ background: "transparent", color: "#fff" }}
            onClick={() => setForgot(false)}
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
