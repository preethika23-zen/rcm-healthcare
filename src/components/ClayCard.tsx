import React from "react";
import { cn } from "../utils/cn";

interface ClayCardProps {
  children: React.ReactNode;
  className?: string;
  floating?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export function ClayCard({
  children,
  className,
  floating,
  glow,
  onClick
}: ClayCardProps) {
  return (
    <div
      className={cn(
        "clay-card",
        floating && "floating",
        glow && "ai-glow",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface ClayButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "accent" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}

export function ClayButton({
  children,
  className,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  type = "button"
}: ClayButtonProps) {
  const baseClass =
    variant === "ghost"
      ? "clay-button-ghost"
      : variant === "secondary"
      ? "clay-button clay-button-secondary"
      : variant === "accent"
      ? "clay-button clay-button-accent"
      : "clay-button";

  const sizeClass =
    size === "sm"
      ? "px-4 py-2 text-sm min-h-[40px]"
      : size === "lg"
      ? "px-8 py-4 text-lg min-h-[52px]"
      : "px-6 py-3 min-h-[46px]";

  return (
    <button
      type={type}
      className={cn(
        baseClass,
        sizeClass,
        "font-semibold transition-all duration-200 flex items-center justify-center gap-2",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

interface ClayInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number" | "email";
  error?: string;
  className?: string;
  maxLength?: number;
  required?: boolean;
}

export function ClayInput({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  error,
  className,
  maxLength,
  required
}: ClayInputProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-sm font-medium" style={{ color: "var(--text-main)" }}>
          {label}
          {required && <span style={{ color: "var(--risk-high)", marginLeft: 4 }}>*</span>}
        </label>
      )}

      <input
        type={type}
        className={cn("clay-input w-full", error && "input-error")}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
      />

      {error && (
        <p className="text-sm" style={{ color: "var(--risk-high)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

interface ClaySelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  required?: boolean;
}

export function ClaySelect({
  label,
  value,
  onChange,
  options,
  className,
  required
}: ClaySelectProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-sm font-medium" style={{ color: "var(--text-main)" }}>
          {label}
          {required && <span style={{ color: "var(--risk-high)", marginLeft: 4 }}>*</span>}
        </label>
      )}

      <select
        className="clay-select w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface ClayToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function ClayToggle({
  label,
  checked,
  onChange,
  className
}: ClayToggleProps) {
  return (
    <label className={cn("flex items-center gap-3 cursor-pointer", className)}>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className="w-12 h-6 rounded-full transition-all duration-300"
          style={{
            background: checked ? "var(--brand)" : "var(--surface-deep)",
            boxShadow: "var(--shadow-inset)"
          }}
        >
          <div
            className={cn(
              "absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-300",
              checked ? "translate-x-6" : "translate-x-0.5"
            )}
            style={{
              background: "var(--surface-raised)",
              boxShadow: "var(--shadow-neo-soft)"
            }}
          />
        </div>
      </div>

      <span className="text-sm font-medium" style={{ color: "var(--text-main)" }}>
        {label}
      </span>
    </label>
  );
}

interface ClayProgressProps {
  value: number;
  max?: number;
  variant?: "low" | "medium" | "high" | "blue" | "purple";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function ClayProgress({
  value,
  max = 100,
  variant = "blue",
  showLabel = true,
  label,
  className
}: ClayProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const barClass =
    variant === "low"
      ? "clay-progress-low"
      : variant === "medium"
      ? "clay-progress-medium"
      : variant === "high"
      ? "clay-progress-high"
      : "";

  const inlineBarStyle =
    variant === "purple"
      ? { background: "linear-gradient(90deg, var(--accent), var(--brand))" }
      : variant === "blue"
      ? { background: "linear-gradient(90deg, var(--brand), var(--brand-2))" }
      : undefined;

  return (
    <div className={cn("space-y-2", className)}>
      {(showLabel || label) && (
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--text-soft)" }}>{label || "Progress"}</span>
          <span className="font-medium" style={{ color: "var(--text-main)" }}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}

      <div className="clay-progress">
        <div
          className={cn("clay-progress-bar", barClass)}
          style={{
            width: `${percentage}%`,
            ...(inlineBarStyle || {})
          }}
        />
      </div>
    </div>
  );
}

interface RiskBadgeProps {
  level: "low" | "medium" | "high";
  score?: number;
  className?: string;
}

export function RiskBadge({ level, score, className }: RiskBadgeProps) {
  const badgeClass =
    level === "low"
      ? "risk-badge-low"
      : level === "medium"
      ? "risk-badge-medium"
      : "risk-badge-high";

  const icon = level === "low" ? "✓" : level === "medium" ? "⚠" : "✕";

  return (
    <span className={cn("risk-badge", badgeClass, className)}>
      <span>{icon}</span>
      <span className="capitalize">
        {level}
        {score !== undefined && ` (${score})`}
      </span>
    </span>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: "blue" | "teal" | "green" | "amber" | "red" | "purple";
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  variant = "blue",
  icon,
  className
}: StatCardProps) {
  return (
    <div className={cn("clay-card p-5", `stat-card-${variant}`, className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text-soft)" }}>
            {title}
          </p>
          <p className="text-2xl font-bold mt-1" style={{ color: "var(--text-main)" }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm mt-1" style={{ color: "var(--text-soft)" }}>
              {subtitle}
            </p>
          )}
        </div>

        {icon && <div style={{ color: "var(--brand)", opacity: 0.85 }}>{icon}</div>}
      </div>
    </div>
  );
}

interface ClayTabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function ClayTabs({
  tabs,
  activeTab,
  onChange,
  className
}: ClayTabsProps) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexWrap: "nowrap",
        gap: "12px",
        padding: "6px",
        borderRadius: "16px",
        overflowX: "auto",
        background: "var(--surface)",
        boxShadow: "var(--shadow-neo-soft)",
        alignItems: "center"
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={cn("clay-tab", activeTab === tab.id && "clay-tab-active")}
          onClick={() => onChange(tab.id)}
          type="button"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            whiteSpace: "nowrap",
            flex: "0 0 auto"
          }}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  accept: string;
  label: string;
  sublabel?: string;
  className?: string;
  loading?: boolean;
}

export function FileUploadZone({
  onFileSelect,
  accept,
  label,
  sublabel,
  className,
  loading
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div
      className={cn(
        "clay-upload",
        isDragging && "clay-upload-active",
        loading && "opacity-50 pointer-events-none",
        className
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <div className="text-4xl mb-3">📁</div>
      <p className="font-medium" style={{ color: "var(--text-main)" }}>
        {label}
      </p>
      {sublabel && (
        <p className="text-sm mt-1" style={{ color: "var(--text-soft)" }}>
          {sublabel}
        </p>
      )}
      {loading && (
        <p className="mt-2" style={{ color: "var(--brand)" }}>
          Processing...
        </p>
      )}
    </div>
  );
}