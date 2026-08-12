import { FOCUS_RING } from "@/lib/motion";

/** Ripple Health AI · 2026-07-14 上架 · 免费 · min iOS 18 */
export const APP_STORE_URL =
  "https://apps.apple.com/app/ripple-health-ai/id6786394791";

/* 2026-07-28 评审整改:弃用自绘 teal 徽章(Apple 营销规范只允许官方黑/白
   原版 artwork,自绘版是全站最大"山寨感"来源)。/app-store-badge.svg 是
   Apple marketingtools 官方黑底白边变体,原样使用、不改色不改几何。 */
export default function AppStoreBadge({
  className = "",
}: {
  className?: string;
}) {
  return (
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block rounded-[13px] transition-opacity hover:opacity-85 ${FOCUS_RING} ${className}`}
    >
      <img
        src="/app-store-badge.svg"
        alt="Download on the App Store"
        className="h-[52px] w-auto"
        draggable={false}
      />
    </a>
  );
}
