// src/pages/Dashboard.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import styles from "./Dashboard.module.css";

function TokenDisplay({ token }) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const truncated = token
    ? `${token.slice(0, 28)}...${token.slice(-12)}`
    : "";

  return (
    <div className={styles.tokenCard}>
      <div className={styles.tokenHeader}>
        <span className={styles.tokenLabel}>🔑 ID Token (JWT)</span>
        <div className={styles.tokenActions}>
          <button
            className={styles.tokenBtn}
            onClick={() => setRevealed((r) => !r)}
          >
            {revealed ? "Hide" : "Reveal"}
          </button>
          <button className={styles.tokenBtn} onClick={handleCopy}>
            {copied ? "✓ Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <div className={styles.tokenValue}>
        <code>{revealed ? token : truncated}</code>
      </div>
      <p className={styles.tokenNote}>
        Stored in <code>localStorage</code> as <code>fb_user_token</code>. 
        Attach to API requests as <code>Authorization: Bearer &lt;token&gt;</code>
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { user, token, logout, refreshToken } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshed, setRefreshed] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshToken();
    setRefreshing(false);
    setRefreshed(true);
    setTimeout(() => setRefreshed(false), 2000);
  };

  const tokenData = token ? parseJwtPayload(token) : null;

  return (
    <div className={styles.page}>
      <div className={styles.grid} />
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.logoRow}>
            <span className={styles.logoIcon}>◈</span>
            <span className={styles.logoText}>AUTHWAVE</span>
          </div>
          <button className={styles.logoutBtn} onClick={logout}>
            Sign Out
          </button>
        </header>

        <main className={styles.main}>
          <div className={styles.welcome}>
            <div className={styles.avatar}>
              {user?.phoneNumber?.slice(-2) ?? "✓"}
            </div>
            <div>
              <h1 className={styles.title}>
                Authenticated
                <span className={styles.badge}>✓ Verified</span>
              </h1>
              <p className={styles.phone}>{user?.phoneNumber}</p>
            </div>
          </div>

          <div className={styles.statsRow}>
            <StatCard label="UID" value={user?.uid?.slice(0, 16) + "…"} />
            <StatCard
              label="Token Expires"
              value={
                tokenData?.exp
                  ? new Date(tokenData.exp * 1000).toLocaleTimeString()
                  : "—"
              }
            />
            <StatCard
              label="Sign-in Provider"
              value={user?.providerData?.[0]?.providerId ?? "phone"}
            />
          </div>

          <TokenDisplay token={token} />

          <div className={styles.actions}>
            <button
              className={styles.refreshBtn}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <span className={styles.spinner} />
              ) : refreshed ? (
                "✓ Refreshed!"
              ) : (
                "↻ Refresh Token"
              )}
            </button>
            <p className={styles.refreshNote}>
              Tokens expire after 1 hour. Click to force-refresh.
            </p>
          </div>

          <div className={styles.codeBlock}>
            <div className={styles.codeHeader}>
              <span className={styles.codeLabel}>Usage Example</span>
            </div>
            <pre className={styles.code}>{`// Attach token to API requests
const token = localStorage.getItem('fb_user_token');

const res = await fetch('/api/protected', {
  headers: {
    Authorization: \`Bearer \${token}\`,
    'Content-Type': 'application/json',
  }
});`}</pre>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </div>
  );
}

function parseJwtPayload(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}
