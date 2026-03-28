import { CheckCircle, Clock, Loader2, LogIn } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import { AdminBar } from "../components/AdminBar";
import {
  FINISH_TARGET,
  LAUNCH_TARGET,
  SingleCountdown,
} from "../components/Countdown";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useIsCallerAdmin,
  useIsCallerApproved,
  useRequestApproval,
} from "../hooks/useQueries";

interface LandingPageProps {
  onNavigateDashboard: () => void;
}

export function LandingPage({ onNavigateDashboard }: LandingPageProps) {
  const { login, identity, isInitializing, isLoggingIn } =
    useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: isApproved, isLoading: approvedLoading } =
    useIsCallerApproved();
  const requestApproval = useRequestApproval();

  const isAuthenticated = !!identity;
  const registeredRef = useRef(false);
  const mutate = requestApproval.mutate;

  const registerUser = useCallback(() => {
    mutate();
  }, [mutate]);

  useEffect(() => {
    if (isAuthenticated && actor && !actorFetching && !registeredRef.current) {
      registeredRef.current = true;
      registerUser();
    }
  }, [isAuthenticated, actor, actorFetching, registerUser]);

  const isLoading =
    isInitializing ||
    isLoggingIn ||
    actorFetching ||
    approvedLoading ||
    requestApproval.isPending;

  function renderAccessButton() {
    if (!isAuthenticated) {
      return (
        <button
          type="button"
          className="btn-primary-blue inline-flex items-center gap-2.5 px-8 py-3.5 rounded-lg text-white font-semibold text-sm tracking-wide transition-all duration-300 disabled:opacity-50"
          onClick={login}
          disabled={isLoading}
          data-ocid="landing.request_access.button"
        >
          {isLoggingIn ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogIn className="w-4 h-4" />
          )}
          {isLoggingIn ? "Connecting..." : "Provisionary Access"}
        </button>
      );
    }
    if (isLoading) {
      return (
        <button
          type="button"
          className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-lg font-semibold text-sm tracking-wide cursor-not-allowed"
          style={{
            border: "1px solid oklch(0.24 0.018 245)",
            color: "oklch(0.77 0.015 240 / 0.4)",
          }}
          disabled
          data-ocid="landing.loading_state"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          Checking status...
        </button>
      );
    }
    // Approved or pending users both get Access button (provisionary access)
    if (isApproved) {
      return (
        <button
          type="button"
          className="btn-green inline-flex items-center gap-2.5 px-8 py-3.5 rounded-lg font-semibold text-sm tracking-wide transition-all duration-300"
          onClick={onNavigateDashboard}
          data-ocid="landing.access.button"
        >
          <CheckCircle className="w-4 h-4" />
          Access
        </button>
      );
    }
    // Authenticated but not yet resolved — show pending with access allowed
    return (
      <button
        type="button"
        className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-lg font-semibold text-sm tracking-wide transition-all duration-300"
        style={{
          background: "oklch(0.72 0.19 145 / 0.12)",
          border: "1px solid oklch(0.72 0.19 145 / 0.4)",
          color: "oklch(0.72 0.19 145 / 0.85)",
        }}
        onClick={onNavigateDashboard}
        data-ocid="landing.pending_access.button"
      >
        <Clock className="w-4 h-4" />
        Access (Authorization Pending)
      </button>
    );
  }

  function renderNavButton() {
    if (!isAuthenticated) {
      return (
        <button
          type="button"
          onClick={login}
          disabled={isLoading}
          className="btn-outline-blue px-4 py-2 rounded-md text-xs font-semibold tracking-wide transition-all duration-200 disabled:opacity-40"
          data-ocid="nav.access.button"
        >
          {isLoggingIn ? "Connecting..." : "Connect"}
        </button>
      );
    }
    if (isApproved) {
      return (
        <button
          type="button"
          onClick={onNavigateDashboard}
          className="px-4 py-2 rounded-md text-xs font-semibold tracking-wide transition-all duration-200"
          style={{
            background: "oklch(0.72 0.19 145 / 0.15)",
            border: "1px solid oklch(0.72 0.19 145 / 0.5)",
            color: "oklch(0.72 0.19 145)",
          }}
          data-ocid="nav.dashboard.button"
        >
          Access
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={onNavigateDashboard}
        className="px-4 py-2 rounded-md text-xs font-semibold tracking-wide transition-all duration-200"
        style={{
          background: "oklch(0.41 0.10 240 / 0.1)",
          border: "1px solid oklch(0.41 0.10 240 / 0.3)",
          color: "oklch(0.77 0.015 240 / 0.6)",
        }}
        data-ocid="nav.pending.button"
      >
        Access
      </button>
    );
  }

  return (
    <div className="min-h-screen network-grid vignette flex flex-col">
      {isAdmin && <AdminBar />}

      {/* Pill Nav */}
      <div className="relative z-10 flex justify-center pt-6 px-4">
        <motion.nav
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="pill-glow w-full max-w-4xl flex items-center justify-between px-5 py-3 rounded-full"
          style={{ background: "oklch(0.13 0.012 245 / 0.95)" }}
          data-ocid="nav.panel"
        >
          <div className="flex items-center gap-3">
            <img
              src="https://grupoiasa.cl/wp-content/uploads/2024/05/GRUPO-IASA.png"
              alt="Grupo IASA"
              className="h-7 object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          {renderNavButton()}
        </motion.nav>
      </div>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-3xl flex flex-col items-center text-center gap-10">
          {/* Hero Logo — 2x size, centered */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src="https://grupoiasa.cl/wp-content/uploads/2024/05/GRUPO-IASA.png"
              alt="Grupo IASA"
              className="h-28 object-contain mx-auto"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-3"
          >
            <p
              className="text-[10px] uppercase tracking-[0.35em] font-semibold"
              style={{ color: "oklch(0.45 0.10 210)" }}
            >
              Internet Computer Protocol · ICP
            </p>
            <h1
              className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-none"
              style={{ color: "oklch(0.96 0.005 240)" }}
            >
              IASA Challenge:
              <br />
              <span style={{ color: "oklch(0.96 0.005 240 / 0.85)" }}>
                alpha sandbox
              </span>{" "}
              <span className="" style={{ color: "oklch(0.41 0.10 240)" }}>
                v0.4
              </span>
            </h1>
            <p
              className="text-sm font-medium tracking-widest uppercase"
              style={{ color: "oklch(0.77 0.015 240 / 0.7)" }}
            >
              Behavioral Governance Sandbox · 30th Anniversary Edition
            </p>
          </motion.div>

          {/* Two Countdowns */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Countdown 1: Launch */}
            <div
              className="rounded-xl p-5 teal-glow"
              style={{
                background: "oklch(0.14 0.013 245)",
                border: "1px solid oklch(0.24 0.018 245)",
              }}
              data-ocid="countdown.launch.card"
            >
              <p
                className="text-[9px] uppercase tracking-[0.25em] font-bold mb-3"
                style={{ color: "oklch(0.45 0.10 210)" }}
              >
                IASA Challenge Launch
              </p>
              <p
                className="text-[10px] mb-3"
                style={{ color: "oklch(0.77 0.015 240 / 0.5)" }}
              >
                Monday 30.03.2026 · 03:00 CLT
              </p>
              <SingleCountdown target={LAUNCH_TARGET} doneText="LAUNCHED" />
            </div>

            {/* Countdown 2: Finish Line */}
            <div
              className="rounded-xl p-5"
              style={{
                background: "oklch(0.14 0.013 245)",
                border: "1px solid oklch(0.24 0.018 245)",
              }}
              data-ocid="countdown.finish.card"
            >
              <p
                className="text-[9px] uppercase tracking-[0.25em] font-bold mb-3"
                style={{ color: "oklch(0.72 0.19 145)" }}
              >
                Finish Line
              </p>
              <p
                className="text-[10px] mb-3"
                style={{ color: "oklch(0.77 0.015 240 / 0.5)" }}
              >
                Monday 26.10.2026 · 15:00 CLT
              </p>
              <SingleCountdown target={FINISH_TARGET} doneText="FINISHED" />
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {renderAccessButton()}
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="w-full flex items-center gap-4"
          >
            <div
              className="flex-1 h-px"
              style={{ background: "oklch(0.96 0.005 240 / 0.06)" }}
            />
            <div
              className="w-1 h-1 rounded-full"
              style={{ background: "oklch(0.45 0.10 210 / 0.6)" }}
            />
            <div
              className="flex-1 h-px"
              style={{ background: "oklch(0.96 0.005 240 / 0.06)" }}
            />
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-sm md:text-base leading-relaxed max-w-2xl"
            style={{ color: "oklch(0.77 0.015 240)" }}
            data-ocid="landing.description"
          >
            The IASA Challenge Sandbox{" "}
            <span style={{ color: "oklch(0.96 0.005 240 / 0.85)" }}>
              &lsquo;30th Anniversary Edition&rsquo;
            </span>{" "}
            (also referred to as the{" "}
            <span style={{ color: "oklch(0.96 0.005 240 / 0.85)" }}>
              &lsquo;Behavioral Governance Sandbox&rsquo;
            </span>
            ) is a live testing environment for professional collaboration and a
            functional prototype designed to stress-test the decentralized
            governance architecture (DAO) of the{" "}
            <span style={{ color: "oklch(0.41 0.10 240)" }}>
              proteus.exchange
            </span>{" "}
            platform. Deployed on the Internet Computer Protocol (ICP), it
            serves as the critical{" "}
            <span style={{ color: "oklch(0.96 0.005 240 / 0.85)" }}>
              &lsquo;Living Lab&rsquo;
            </span>{" "}
            for the consortium&rsquo;s R&amp;D effort.
          </motion.p>
        </div>
      </main>

      <footer
        className="relative z-10 py-4"
        style={{ borderTop: "1px solid oklch(0.96 0.005 240 / 0.04)" }}
      >
        <p
          className="text-center text-[10px]"
          style={{ color: "oklch(0.77 0.015 240 / 0.25)" }}
        >
          &copy; {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "oklch(0.41 0.10 240 / 0.6)" }}
            className="hover:opacity-100 transition-opacity"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
