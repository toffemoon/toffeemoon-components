import { motion } from "motion/react";
import AppStoreBadge from "@/components/ui/app-store-badge";

/**
 * 分页尾部的轻量下载位:一句话 + 官方徽章。
 * 首页收尾用的仍是完整 FinalCta(waitlist-6),这里刻意更安静,
 * 不与之抢戏;CTA 层级维持全站两级(官方徽章主 / teal 胶囊次)。
 */
export default function PageCta({ line }: { line: string }) {
  return (
    <section className="w-full px-4 pb-24 pt-8 sm:px-6 sm:pb-28 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto flex w-full max-w-[1200px] flex-col items-start gap-6 border-t border-line pt-12 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="max-w-md font-display text-2xl font-semibold leading-snug tracking-tight text-ink">
          {line}
        </p>
        <AppStoreBadge />
      </motion.div>
    </section>
  );
}
