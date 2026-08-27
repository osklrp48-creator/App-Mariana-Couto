import { useState } from "react";
import { isCloudConfigured, supabase } from "../../lib/supabaseClient";
import { seedDefaultTreatments } from "../../lib/cloudRepo";
import { AlertTriangleIcon, LockIcon } from "../../components/icons";

export function AuthGate() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isCloudConfigured) {
    return (
      <div className="pin-screen" style={{ gap: 18 }}>
        <AlertTriangleIcon width={30} height={30} style={{ color: "#f0c04b" }} />
        <h1 style={{ fontSize: 20, textAlign: "center" }}>Banco de dados não configurado</h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13.5, textAlign: "center", maxWidth: 320 }}>
          As variáveis <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> ainda
          não foram definidas nas configurações do projeto (Vercel &gt; Environment Variables).
          Configure-as e faça um novo deploy para continuar.
        </p>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!email.trim() || password.length < 6) {
      setError("Informe um e-mail válido e uma senha com pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error: signUpError, data } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpError) {
          setError(traduzErro(signUpError.message));
          return;
        }
        if (!data.session) {
          setInfo(
            "Conta criada! Verifique seu e-mail para confirmar o cadastro e depois volte aqui para entrar."
          );
          setMode("signin");
        } else {
          await seedDefaultTreatments();
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          setError(traduzErro(signInError.message));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pin-screen" style={{ justifyContent: "flex-start", paddingTop: 64, gap: 20 }}>
      <LockIcon width={30} height={30} />
      <div className="stack" style={{ alignItems: "center", gap: 6 }}>
        <h1>{mode === "signin" ? "Entrar" : "Criar conta"}</h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, textAlign: "center", maxWidth: 300 }}>
          {mode === "signin"
            ? "Use o mesmo e-mail e senha em todos os seus aparelhos para ver os mesmos dados."
            : "Crie a conta uma vez. Nos outros aparelhos, use a opção “Entrar” com este mesmo e-mail e senha."}
        </p>
      </div>

      <form onSubmit={submit} className="stack" style={{ width: "100%", maxWidth: 300 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          autoCapitalize="none"
          autoComplete="email"
          style={inputStyle}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha (mín. 6 caracteres)"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          style={inputStyle}
        />
        {error && <p style={{ color: "#f4b8c6", fontSize: 13 }}>{error}</p>}
        {info && <p style={{ color: "#bfe3c9", fontSize: 13 }}>{info}</p>}
        <button className="btn btn-block" style={{ background: "#fff", color: "var(--pine-dark)" }} type="submit" disabled={loading}>
          {loading ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta"}
        </button>
      </form>

      <button
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError("");
          setInfo("");
        }}
        style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.75)", fontSize: 13 }}
      >
        {mode === "signin" ? "Ainda não tenho conta — criar" : "Já tenho conta — entrar"}
      </button>
    </div>
  );
}

function traduzErro(message: string): string {
  if (message.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (message.includes("User already registered")) return "Este e-mail já tem uma conta — use “Entrar”.";
  if (message.includes("Password should be at least")) return "A senha precisa ter pelo menos 6 caracteres.";
  return message;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: 10,
  border: "1.5px solid rgba(255,255,255,0.3)",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
};
