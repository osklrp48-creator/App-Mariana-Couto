import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Sheet } from "../components/Sheet";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { db } from "../db/db";
import { useAuth } from "../contexts/AuthContext";
import { hashPin, randomSalt } from "../lib/pin";
import { wipeAllCloudAndLocalData } from "../lib/accountReset";
import { getPermissionState, requestNotificationPermission } from "../lib/notifications";
import { BellIcon, CloudIcon, LockIcon, LogOutIcon, TrashIcon } from "../components/icons";
import { useToast } from "../contexts/ToastContext";

const WIPE_WORD = "APAGAR";

function ChangePinSheet({ onClose }: { onClose: () => void }) {
  const { show } = useToast();
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError("O PIN deve ter 4 dígitos.");
      return;
    }
    if (pin !== confirm) {
      setError("Os PINs não coincidem.");
      return;
    }
    setSaving(true);
    try {
      const salt = randomSalt();
      const pinHash = await hashPin(pin, salt);
      await db.settings.update("app", { pinHash, pinSalt: salt, onboardingDone: true });
      show("PIN atualizado");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet title="Trocar PIN" onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <div className="field">
          <label>Novo PIN (4 dígitos)</label>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            type="password"
            maxLength={4}
            autoFocus
          />
        </div>
        <div className="field">
          <label>Confirmar novo PIN</label>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            type="password"
            maxLength={4}
          />
        </div>
        {error && <p style={{ color: "var(--red)", fontSize: 13 }}>{error}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar novo PIN"}
        </button>
      </form>
    </Sheet>
  );
}

export function Settings() {
  const { show } = useToast();
  const { session, signOut } = useAuth();
  const settings = useLiveQuery(() => db.settings.get("app"), []);
  const [permission, setPermission] = useState(getPermissionState());
  const [showChangePin, setShowChangePin] = useState(false);
  const [confirmRemovePin, setConfirmRemovePin] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [wipeText, setWipeText] = useState("");
  const [wiping, setWiping] = useState(false);

  if (!settings) return null;

  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === "granted") show("Notificações ativadas!");
    else if (result === "denied") show("Permissão negada. Ative pelas configurações do navegador.", "error");
  };

  const removePin = async () => {
    await db.settings.update("app", { pinHash: null, pinSalt: null });
    setConfirmRemovePin(false);
    show("PIN removido. O app não pedirá mais senha ao abrir.");
  };

  const wipeAll = async () => {
    setWiping(true);
    await wipeAllCloudAndLocalData();
  };

  const permissionLabel =
    permission === "granted" ? "Ativadas" : permission === "denied" ? "Bloqueadas pelo navegador" : permission === "unsupported" ? "Não suportadas neste navegador" : "Desativadas";

  return (
    <div className="stack">
      <PageHeader title="Configurações" back />

      <div>
        <p className="section-title">Notificações</p>
        <div className="card" style={{ marginTop: 8 }}>
          <div className="row-between">
            <div className="row">
              <BellIcon width={20} height={20} style={{ color: "var(--pine)" }} />
              <div>
                <p style={{ fontWeight: 600 }}>Lembretes de consulta</p>
                <p style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>{permissionLabel}</p>
              </div>
            </div>
            {permission !== "granted" && permission !== "unsupported" && (
              <button className="btn btn-sm btn-primary" onClick={handleEnableNotifications}>
                Ativar
              </button>
            )}
          </div>
          <p style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 10 }}>
            Avisamos 1 hora e 30 minutos antes de cada consulta agendada. Em segundo plano, a
            confiabilidade depende do sistema: no Android o app tenta se manter ativo via
            sincronização periódica (melhor esforço); no iPhone (Safari), notificações de apps
            instalados só chegam enquanto o app está aberto ou recentemente em uso.
          </p>
        </div>
      </div>

      <div>
        <p className="section-title">Segurança</p>
        <div className="card" style={{ marginTop: 8 }}>
          <div className="row-between" style={{ marginBottom: 14 }}>
            <div className="row">
              <LockIcon width={20} height={20} style={{ color: "var(--pine)" }} />
              <p style={{ fontWeight: 600 }}>PIN de acesso</p>
            </div>
            <span className={`pill ${settings.pinHash ? "pill-green" : "pill-amber"}`}>
              {settings.pinHash ? "Ativo" : "Desativado"}
            </span>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            <button className="btn btn-outline btn-block" onClick={() => setShowChangePin(true)}>
              {settings.pinHash ? "Trocar PIN" : "Criar PIN"}
            </button>
            {settings.pinHash && (
              <button className="btn btn-block" style={{ background: "var(--pine-tint)", color: "var(--pine-dark)" }} onClick={() => setConfirmRemovePin(true)}>
                Remover PIN
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <p className="section-title">Conta</p>
        <div className="card" style={{ marginTop: 8 }}>
          <div className="row" style={{ marginBottom: 12 }}>
            <CloudIcon width={20} height={20} style={{ color: "var(--pine)" }} />
            <div>
              <p style={{ fontWeight: 600 }}>Sincronizado na nuvem</p>
              <p style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>{session?.user.email}</p>
            </div>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--ink-faint)", marginBottom: 12 }}>
            Use este mesmo e-mail e senha em qualquer aparelho para ver os mesmos dados,
            atualizados em tempo real.
          </p>
          <button className="btn btn-outline btn-block" onClick={() => setConfirmSignOut(true)}>
            <LogOutIcon width={16} height={16} /> Sair da conta
          </button>
        </div>
      </div>

      <div>
        <p className="section-title">Dados da conta</p>
        <div className="card" style={{ marginTop: 8 }}>
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            Os dados ficam salvos na nuvem, vinculados à sua conta. Apagar aqui remove tudo
            permanentemente — pacientes, agenda e financeiro — em todos os aparelhos. Não há como
            desfazer.
          </p>
          <button className="btn btn-danger btn-block" style={{ marginTop: 12 }} onClick={() => setConfirmWipe(true)}>
            <TrashIcon width={16} height={16} /> Apagar todos os dados
          </button>
        </div>
      </div>

      {showChangePin && <ChangePinSheet onClose={() => setShowChangePin(false)} />}

      {confirmRemovePin && (
        <ConfirmDialog
          title="Remover PIN"
          message="O app deixará de pedir senha ao abrir. Você pode criar um novo PIN quando quiser."
          confirmLabel="Remover"
          danger
          onConfirm={removePin}
          onCancel={() => setConfirmRemovePin(false)}
        />
      )}

      {confirmSignOut && (
        <ConfirmDialog
          title="Sair da conta"
          message="Você volta para a tela de entrar. Seus dados continuam salvos na nuvem — é só entrar de novo com o mesmo e-mail e senha."
          confirmLabel="Sair"
          danger
          onConfirm={signOut}
          onCancel={() => setConfirmSignOut(false)}
        />
      )}

      {confirmWipe && (
        <div className="center-overlay" onClick={() => !wiping && setConfirmWipe(false)}>
          <div className="center-card stack" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18 }}>Apagar todos os dados</h3>
            <p style={{ fontSize: 13.5, color: "var(--ink-soft)" }}>
              Isso remove permanentemente pacientes, consultas, financeiro e configurações da sua
              conta — em todos os aparelhos. Não é possível desfazer. Digite{" "}
              <strong>{WIPE_WORD}</strong> para confirmar.
            </p>
            <input
              value={wipeText}
              onChange={(e) => setWipeText(e.target.value.toUpperCase())}
              placeholder={WIPE_WORD}
              style={{
                textAlign: "center",
                fontWeight: 700,
                letterSpacing: "0.08em",
                border: "1.5px solid var(--line)",
                borderRadius: "var(--radius-sm)",
                padding: "12px 13px",
                minHeight: 46,
              }}
            />
            <div className="row">
              <button className="btn btn-outline btn-block" disabled={wiping} onClick={() => setConfirmWipe(false)}>
                Cancelar
              </button>
              <button className="btn btn-danger btn-block" disabled={wipeText !== WIPE_WORD || wiping} onClick={wipeAll}>
                {wiping ? "Apagando..." : "Apagar tudo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
