import { useEffect, useState } from "react";

// IASA Challenge Launch: March 30, 2026 03:00 CLT (UTC-3) = 06:00 UTC
const LAUNCH_TARGET = new Date("2026-03-30T06:00:00Z").getTime();
// Finish Line: October 26, 2026 15:00 CLT (UTC-3) = 18:00 UTC
const FINISH_TARGET = new Date("2026-10-26T18:00:00Z").getTime();

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

function calcTimeLeft(target: number): TimeLeft {
  const diff = target - Date.now();
  if (diff <= 0)
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    done: false,
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function DigitBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="digit-tile rounded px-2.5 py-1.5 min-w-[52px] text-center">
        <span className="block text-3xl md:text-4xl font-black text-foreground digit-glow tabular-nums font-mono">
          {value}
        </span>
      </div>
      <span
        className="text-[9px] font-semibold tracking-[0.2em] uppercase"
        style={{ color: "oklch(0.77 0.015 240 / 0.6)" }}
      >
        {label}
      </span>
    </div>
  );
}

function Colon() {
  return (
    <span
      className="text-2xl md:text-3xl font-black mb-4 select-none"
      style={{ color: "oklch(0.41 0.10 240 / 0.5)" }}
    >
      :
    </span>
  );
}

interface SingleCountdownProps {
  target: number;
  doneText?: string;
  compact?: boolean;
}

export function SingleCountdown({
  target,
  doneText = "LAUNCHED",
  compact = false,
}: SingleCountdownProps) {
  const [time, setTime] = useState<TimeLeft>(() => calcTimeLeft(target));

  useEffect(() => {
    const timer = setInterval(() => setTime(calcTimeLeft(target)), 1000);
    return () => clearInterval(timer);
  }, [target]);

  if (time.done) {
    return (
      <span
        className="font-black tracking-widest uppercase"
        style={{
          color: "oklch(0.45 0.10 210)",
          fontSize: compact ? "1rem" : "2rem",
        }}
      >
        {doneText}
      </span>
    );
  }

  if (compact) {
    return (
      <span
        className="font-mono tabular-nums"
        style={{ color: "oklch(0.77 0.015 240)" }}
      >
        {pad(time.days)}d {pad(time.hours)}h {pad(time.minutes)}m{" "}
        {pad(time.seconds)}s
      </span>
    );
  }

  return (
    <div
      className="flex items-center justify-center gap-1.5 md:gap-2"
      data-ocid="countdown.timer"
    >
      <DigitBlock value={pad(time.days)} label="DAYS" />
      <Colon />
      <DigitBlock value={pad(time.hours)} label="HOURS" />
      <Colon />
      <DigitBlock value={pad(time.minutes)} label="MIN" />
      <Colon />
      <DigitBlock value={pad(time.seconds)} label="SEC" />
    </div>
  );
}

// Legacy export for any existing usages
export function Countdown() {
  return <SingleCountdown target={FINISH_TARGET} doneText="FINISHED" />;
}

export { LAUNCH_TARGET, FINISH_TARGET };
