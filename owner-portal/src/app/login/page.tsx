import { LoginForm } from "@/components/login-form";
import { BrandMark } from "@/components/brand-mark";

export default async function LoginPage() {
  return (
    <main className="login-shell">
      <section className="login-visual">
        <div className="brand">
          <BrandMark className="brand-mark" />
          <span>
            <strong>Saxlem</strong>
            <small>Owner Portal</small>
          </span>
        </div>
        <div>
          <p>Platform administration</p>
          <h1>A calm command center for the future of healthcare.</h1>
        </div>
        <p>Authorized Saxlem platform administrators only.</p>
      </section>
      <section className="login-panel">
        <div className="card login-card">
          <h2>Welcome back</h2>
          <p>Sign in with your Saxlem administrator account.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
