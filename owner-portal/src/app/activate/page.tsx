import { ActivationForm } from "@/components/activation-form";

export default function ActivatePage() {
  return (
    <main className="login-shell">
      <section className="login-visual">
        <div className="brand">
          <span className="brand-mark">S</span>
          <span>
            <strong>Saxlem</strong>
            <small>Secure account setup</small>
          </span>
        </div>
        <div>
          <p>One-time activation</p>
          <h1>Create your password. Your credential works only once.</h1>
        </div>
        <p>
          Credentials expire after 30 minutes and are never stored in plaintext.
        </p>
      </section>
      <section className="login-panel">
        <div className="card login-card">
          <h2>Activate account</h2>
          <p>
            Enter the credential sent to you by an authorized administrator.
          </p>
          <ActivationForm />
        </div>
      </section>
    </main>
  );
}
