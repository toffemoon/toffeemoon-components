"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FOCUS_RING } from "@/lib/motion";
import { FAQ_ITEMS } from "@/content/faq";

/* 文案在 src/content/faq.ts(2026-08-02 抽出,契约测试直接对内容源断言) */

export default function FAQ1() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="w-full scroll-mt-24 px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_2fr] lg:gap-16 xl:gap-20">
          {/* Left column */}
          <div className="flex flex-col space-y-3 lg:sticky lg:top-28 lg:self-start">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-xs font-medium uppercase tracking-[0.2em] text-caramel"
            >
              FAQ
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="font-display text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl"
            >
              Questions
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="max-w-[28ch] text-lg leading-relaxed text-ink-muted"
            >
              Straight answers to the ones people actually ask.
            </motion.p>
          </div>

          {/* Accordion */}
          <div className="flex flex-col">
            {FAQ_ITEMS.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.05 * index }}
                className={`border-b border-line ${index === 0 ? "border-t" : ""}`}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={openIndex === index}
                  aria-controls={`faq-panel-${index}`}
                  className={`group flex w-full cursor-pointer items-start justify-between gap-4 rounded-md py-6 text-left sm:py-7 ${FOCUS_RING}`}
                >
                  <span className="text-base font-medium text-ink transition-colors duration-200 group-hover:text-accent sm:text-lg">
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="mt-1 shrink-0"
                  >
                    <ChevronDown className="h-5 w-5 text-ink-muted sm:h-6 sm:w-6" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {openIndex === index && (
                    <motion.div
                      id={`faq-panel-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: { duration: 0.3, ease: "easeInOut" },
                        opacity: { duration: 0.2, ease: "easeInOut" },
                      }}
                      className="overflow-hidden"
                    >
                      <div className="pb-6 pr-8 sm:pb-7">
                        <p className="text-sm leading-relaxed text-ink-muted sm:text-base">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
