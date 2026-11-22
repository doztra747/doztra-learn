import { faLightbulb } from "@fortawesome/free-regular-svg-icons";
import { faCircleExclamation, faCircleInfo, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

import { Icon } from "@/components/icon";

type Variant = "info" | "tip" | "warning" | "important";

const VARIANTS = {
  info: { icon: faCircleInfo, title: "Info", box: "bg-mint", iconColor: "text-forest", titleColor: "text-forest", text: "text-[#1F3533]" },
  tip: { icon: faLightbulb, title: "Astuce", box: "bg-warning-bg", iconColor: "text-warning", titleColor: "text-[#5A3A00]", text: "text-[#4A3A1A]" },
  warning: { icon: faTriangleExclamation, title: "Attention", box: "bg-danger-bg", iconColor: "text-terracotta-700", titleColor: "text-danger", text: "text-[#5A2A20]" },
  important: { icon: faCircleExclamation, title: "Important", box: "bg-danger-bg", iconColor: "text-danger", titleColor: "text-danger", text: "text-[#5A2A20]" },
} as const;

/** Encadré pédagogique (F-35) : Info, Astuce, Attention, Important. */
export function Callout({ variant, children }: { variant: Variant; children: React.ReactNode }) {
  const v = VARIANTS[variant];
  return (
    <aside className={`flex gap-3.5 rounded-lg px-[18px] py-4 ${v.box}`}>
      <Icon icon={v.icon} className={`mt-1 text-lg ${v.iconColor}`} />
      <div>
        <strong className={v.titleColor}>{v.title}</strong>
        <div className={`text-[15px] leading-relaxed ${v.text}`}>{children}</div>
      </div>
    </aside>
  );
}
