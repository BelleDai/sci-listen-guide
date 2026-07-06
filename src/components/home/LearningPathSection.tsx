import Link from "next/link";
import { ArrowRight, BookOpen, Gamepad2, Headphones } from "lucide-react";

const learningSteps = [
  {
    icon: Headphones,
    title: "聽故事",
    description: "通勤、睡前、親子共聽，隨時開始科學冒險。",
    href: "#listen-platforms",
    cta: "去聽故事",
  },
  {
    icon: BookOpen,
    title: "讀科普",
    description: "聽完再讀，讓好奇變成說得出口的知識。",
    href: "#latest-guides",
    cta: "閱讀科普",
  },
  {
    icon: Gamepad2,
    title: "玩遊戲",
    description: "用闖關和收集徽章，讓聽過的內容留下來。",
    href: "/games",
    cta: "開始闖關",
  },
];

export default function LearningPathSection() {
  return (
    <section id="learning-path-section" className="px-4 py-8 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 text-center sm:mb-8">
          <h2 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">一集 Podcast，可以這樣學</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm font-normal leading-6 text-white/70 sm:mt-3 sm:text-lg sm:leading-8">
            把聽、讀、玩串成一條清楚的學習路徑。
          </p>
        </div>

        <div className="grid gap-2.5 md:grid-cols-3 md:gap-4 lg:gap-6">
          {learningSteps.map((step, index) => {
            const Icon = step.icon;

            return (
              <Link
                key={step.title}
                href={step.href}
                className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-[#1e1c2a]/80 px-3.5 py-3 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-[#252236]/90 md:min-h-[240px] md:flex-col md:items-stretch md:gap-0 md:rounded-2xl md:p-6 md:hover:-translate-y-1 md:hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)]"
              >
                {/* Ambient gradient orb */}
                <div
                  className="absolute -right-10 -top-10 hidden h-32 w-32 rounded-full opacity-40 blur-3xl transition-opacity duration-500 group-hover:opacity-70 md:block"
                  style={{
                    background:
                      index === 0
                        ? "radial-gradient(circle, rgba(255,116,115,0.5), transparent 70%)"
                        : index === 1
                          ? "radial-gradient(circle, rgba(151,229,255,0.5), transparent 70%)"
                          : "radial-gradient(circle, rgba(255,201,82,0.5), transparent 70%)",
                  }}
                  aria-hidden="true"
                />

                {/* Top bar accent */}
                <div
                  className="absolute left-0 top-0 h-full w-1 opacity-70 transition-opacity duration-500 group-hover:opacity-100 md:h-1 md:w-full md:opacity-60"
                  style={{
                    background:
                      index === 0
                        ? "linear-gradient(90deg, #ff7473, #ffc952)"
                        : index === 1
                          ? "linear-gradient(90deg, #97e5ff, #47b8e0)"
                          : "linear-gradient(90deg, #ffc952, #ff7473)",
                  }}
                />

                {/* Icon + Number container */}
                <div className="relative flex shrink-0 items-center justify-between md:mb-5">
                  <div className="flex items-center gap-2.5 md:gap-3">
                    <div
                      className="grid h-10 w-10 place-items-center rounded-lg border transition-all duration-300 group-hover:shadow-lg md:h-14 md:w-14 md:rounded-xl md:group-hover:scale-110"
                      style={{
                        backgroundColor:
                          index === 0
                            ? "rgba(255, 116, 115, 0.15)"
                            : index === 1
                              ? "rgba(151, 229, 255, 0.15)"
                              : "rgba(255, 201, 82, 0.15)",
                        borderColor:
                          index === 0
                            ? "rgba(255, 116, 115, 0.4)"
                            : index === 1
                              ? "rgba(151, 229, 255, 0.4)"
                              : "rgba(255, 201, 82, 0.4)",
                        boxShadow: `0 0 20px ${
                          index === 0
                            ? "rgba(255, 116, 115, 0.16)"
                            : index === 1
                              ? "rgba(151, 229, 255, 0.16)"
                              : "rgba(255, 201, 82, 0.16)"
                        }`,
                      }}
                    >
                      <Icon
                        className="h-5 w-5 transition-transform duration-300 group-hover:rotate-6 md:h-7 md:w-7"
                        style={{
                          color:
                            index === 0 ? "#ff7473" : index === 1 ? "#97e5ff" : "#ffc952",
                        }}
                      />
                    </div>
                    <span
                      className="hidden text-2xl font-black md:inline md:text-3xl"
                      style={{
                        color:
                          index === 0
                            ? "rgba(255, 116, 115, 0.25)"
                            : index === 1
                              ? "rgba(151, 229, 255, 0.25)"
                              : "rgba(255, 201, 82, 0.25)",
                      }}
                    >
                      0{index + 1}
                    </span>
                  </div>

                  {/* Decorative step connector (hidden on last item and mobile) */}
                  {index < learningSteps.length - 1 && (
                    <div className="hidden md:block">
                      <ArrowRight
                        className="h-5 w-5 text-white/20 transition-all duration-300 group-hover:text-white/40 group-hover:translate-x-1"
                      />
                    </div>
                  )}
                </div>

                {/* Text content */}
                <div className="relative min-w-0 flex-1 md:block">
                  <div className="flex min-w-0 items-center justify-between gap-3 md:block">
                    <div className="min-w-0">
                      <div
                        className="mb-0.5 text-xs font-black md:hidden"
                        style={{
                          color:
                            index === 0
                              ? "rgba(255, 116, 115, 0.82)"
                              : index === 1
                                ? "rgba(151, 229, 255, 0.82)"
                                : "rgba(255, 201, 82, 0.82)",
                        }}
                      >
                        STEP 0{index + 1}
                      </div>
                      <h3 className="truncate text-base font-extrabold leading-tight text-white sm:text-lg md:text-2xl">
                        {step.title}
                      </h3>
                    </div>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-white/45 transition-transform duration-300 group-hover:translate-x-1 md:hidden"
                    />
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs font-normal leading-5 text-white/65 sm:text-sm sm:leading-6 md:mt-3 md:line-clamp-none md:text-base md:leading-7 md:text-white/70">
                    {step.description}
                  </p>

                  {/* CTA */}
                  <div className="mt-4 hidden items-center gap-2 text-sm font-bold transition-colors duration-300 md:mt-6 md:inline-flex md:text-base"
                    style={{
                      color: index === 0 ? "#ff7473" : index === 1 ? "#97e5ff" : "#ffc952",
                    }}
                  >
                    <span className="relative">
                      {step.cta}
                      <span
                        className="absolute -bottom-0.5 left-0 h-px w-0 transition-all duration-300 group-hover:w-full"
                        style={{
                          backgroundColor:
                            index === 0 ? "#ff7473" : index === 1 ? "#97e5ff" : "#ffc952",
                        }}
                      />
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
