/* FAQ 内容源(2026-08-02 抽出,便于契约测试直接断言 —— 手风琴收起的答案
   不进 SSR DOM)。顺序按下载前疑虑权重排:隐私 → 设备 → 电量 → 打扰 →
   原理 → 医疗。
   2026-08-02 雨钦精简(已决 #30):价格条与 AI 数据条整条删除,
   打扰条改"只在注意到异常变化时才提醒"口径。 */

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    /* "row-level security" 黑话已除(2026-07-28 评审)。措辞宪法:只承诺
       RLS 能保证的("没有其他用户能读"),不写"只有你能看" —— 一度写过
       "Only you." 开头,违宪已撤 */
    question: "Who can see my health data?",
    answer:
      "Every account is walled off at the database level, encrypted in transit and at rest, and never used to train models. No other user can ever see your data.",
  },
  {
    /* 原答案自相矛盾:先说必须 Watch,下句又说任何设备都行(2026-07-28 评审)。
       改成层级式:围绕 Watch 设计,其余来源作补充 —— 不新增事实主张 */
    question: "What do I need to run it?",
    answer:
      "An iPhone on iOS 18 or later, and an Apple Watch. That's what Ripple is designed and tested around. Under the hood it reads nine vitals from Apple Health, so readings from other devices that sync there flow in as well.",
  },
  {
    question: "Will it drain my battery?",
    answer:
      "No. Ripple reads what your iPhone and Apple Watch already record through HealthKit, and adds no sensor polling of its own.",
  },
  {
    /* 2026-08-02 雨钦改口径:只在注意到身体异常变化时才提醒,不持续推送;
       cadence 数字与 quiet hours 细节从答案撤下 */
    question: "Will Ripple nag me?",
    answer:
      "No. Ripple only reaches out when it notices an unusual change in your body — a reading drifting away from your own baseline. There are no scheduled check-ins and no constant stream of notifications. When you are within your baseline, Ripple stays silent. Most days, you do nothing.",
  },
  {
    question: "How does the baseline actually work?",
    answer:
      /* 原第三句与 how-it-works step 03 一字不差(2026-07-28 评审),换成变奏 +
         顺手去掉 deterministic 这个词 */
      "Every day, Ripple compares your last 7 days of each vital against your last 30. When the gap passes about 7% of your 30-day average, it becomes a case worth checking. Opening a case is pure arithmetic. The AI only steps in to investigate and explain. Some flagged days will turn out to be nothing: a drift is a reason to look, not a diagnosis.",
  },
  {
    question: "Is Ripple a medical device?",
    answer:
      "No. Ripple is a wellness companion. It does not diagnose, treat, cure, or prevent any condition, and it is built to point you to a healthcare professional when something looks beyond its scope.",
  },
] as const;
