import type { User } from "firebase/auth";
import "../styles/Account.css";

type AppHeaderProps = {
  user: User | null;
  showAccountMenu: boolean;
  onToggleAccountMenu: () => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onGoogleSignIn: () => void;
  onEmailSignUp: () => void;
  onEmailSignIn: () => void;
  onSignOut: () => void;
};

export function AppHeader(props: AppHeaderProps) {
  return (
    <header className="app-header">
      <div>
        <h1 className="app-title">Volleyball Rotation Visualizer</h1>
        <p className="app-subtitle">Tool to help visualize volleyball rotations</p>
      </div>
      <div style={{ position: "relative" }}>
        <button
          type="button"
          className="account-chip"
          onClick={props.onToggleAccountMenu}
        >
          <div className={`account-avatar ${props.user && !props.user.isAnonymous ? "signed-in" : "guest"}`}>
            {props.user && !props.user.isAnonymous ? (props.user.email?.[0]?.toUpperCase() ?? "U") : "G"}
          </div>
          <div style={{ textAlign: "left" }}>
            <div className="account-label">{props.user?.isAnonymous ? "Guest" : "Signed in"}</div>
            <div className="account-value">
              {props.user && !props.user.isAnonymous ? props.user.email || "Google user" : "Sign in to sync"}
            </div>
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>▾</span>
        </button>
        {props.showAccountMenu && (
          <div className="account-dropdown">
            <p>
              {props.user?.isAnonymous
                ? "You're in a guest session. Link an account to sync configs across devices."
                : "You're signed in. Your configs are synced across devices."}
            </p>
            <button
              type="button"
              className="btn"
              onClick={props.onGoogleSignIn}
              style={{
                width: "100%",
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #333",
                background: "#2a2a2a",
                color: "white",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
                cursor: "pointer",
              }}
            >
              <span>Continue with Google</span>
              <span style={{ fontSize: 16 }}>🟢</span>
            </button>
            <hr className="account-dropdown-divider" />
            <input
              type="email"
              placeholder="Email"
              value={props.email}
              onChange={(e) => props.setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={props.password}
              onChange={(e) => props.setPassword(e.target.value)}
            />
            <div className="btn-group">
              <button type="button" className="btn" style={{ flex: 1, background: "var(--accent)", color: "white", fontWeight: 600 }} onClick={props.onEmailSignUp}>
                {props.user?.isAnonymous ? "Create & Link" : "Create account"}
              </button>
              <button type="button" className="btn" style={{ flex: 1 }} onClick={props.onEmailSignIn}>
                Sign in
              </button>
            </div>
            {!props.user?.isAnonymous && (
              <button type="button" className="btn-sign-out" onClick={props.onSignOut}>
                Sign out
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
