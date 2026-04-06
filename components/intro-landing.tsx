"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PCCC_GALLERY, PCCC_PERSON } from "@/lib/pccc-gallery-images";

/** Đỏ báo cháy — nền dải nhấn */
const RED_DIM = "#9f1818";
/** Vàng an toàn */
const AMBER = "#f5b800";
const AMBER_SOFT = "#fcd34d";

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 2s2.5 3.2 2.5 6.2c0 1.6-.7 3-1.8 3.8 1.4-.3 2.5-1.5 2.8-3 .2 3.5-1.5 6.2-4.2 7.5-.3-2-1.2-3.4-2.5-4.2-.4 2.8-2.2 4.7-4.8 5.5C6.5 16.8 5 14.5 5 11.8c0-2.5 1.2-4.7 3-5.8.2 2.2 1.5 3.8 3.2 4.5-.5-1-.8-2.2-.8-3.5 0-2 1-3.8 2.5-5z"
        fill="currentColor"
        fillOpacity={0.9}
      />
    </svg>
  );
}

function GalleryCarousel() {
  const n = PCCC_GALLERY.length;
  const slideCount = Math.ceil(n / 2);
  const [slide, setSlide] = useState(0);
  const [autoEpoch, setAutoEpoch] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      setSlide((s) => (s + 1) % slideCount);
    }, 6000);
    return () => window.clearInterval(t);
  }, [slideCount, autoEpoch]);

  function goPrev() {
    setSlide((s) => (s - 1 + slideCount) % slideCount);
    setAutoEpoch((e) => e + 1);
  }

  function goNext() {
    setSlide((s) => (s + 1) % slideCount);
    setAutoEpoch((e) => e + 1);
  }

  function goTo(i: number) {
    setSlide(i);
    setAutoEpoch((e) => e + 1);
  }

  const left = PCCC_GALLERY[slide * 2];
  const right = PCCC_GALLERY[slide * 2 + 1];

  return (
    <div className="w-full">
      <div className="relative">
        <button
          type="button"
          aria-label="Nhóm ảnh trước"
          onClick={goPrev}
          className="absolute left-1 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-2 border-amber-400/60 bg-zinc-950/85 text-xl font-bold text-amber-300 shadow-[0_0_24px_rgba(200,30,30,0.35)] backdrop-blur-sm transition hover:border-amber-300 hover:bg-red-950/90 sm:left-2 sm:h-12 sm:w-12 sm:text-2xl md:left-3"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Nhóm ảnh sau"
          onClick={goNext}
          className="absolute right-1 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-2 border-amber-400/60 bg-zinc-950/85 text-xl font-bold text-amber-300 shadow-[0_0_24px_rgba(200,30,30,0.35)] backdrop-blur-sm transition hover:border-amber-300 hover:bg-red-950/90 sm:right-2 sm:h-12 sm:w-12 sm:text-2xl md:right-3"
        >
          ›
        </button>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
          {[left, right].map((item, idx) =>
            item ? (
              <figure
                key={`${slide}-${item.src}-${idx}`}
                className="group overflow-hidden rounded-2xl border-2 border-red-600/35 bg-gradient-to-b from-zinc-900/80 to-zinc-950 shadow-[0_12px_40px_rgba(0,0,0,0.45),0_0_0_1px_rgba(245,184,0,0.12)] transition hover:border-amber-400/40"
              >
                <div className="relative w-full min-h-[240px] h-[42vh] max-h-[620px] bg-zinc-900 sm:min-h-[280px] md:h-[min(50vh,600px)]">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.02]"
                    priority={slide === 0 && idx === 0}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/50 via-transparent to-transparent" />
                </div>
                <figcaption className="border-t border-amber-500/20 bg-zinc-950/60 px-3 py-2.5 text-center text-xs font-semibold text-amber-100/95 sm:text-sm">
                  {item.caption}
                </figcaption>
              </figure>
            ) : null,
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {Array.from({ length: slideCount }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Xem nhóm ảnh ${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-2.5 rounded-full transition sm:h-3 ${
              i === slide
                ? "w-8 bg-gradient-to-r from-amber-400 to-red-500"
                : "w-2.5 bg-white/30 hover:bg-amber-200/50 sm:w-3"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function SectionTitle({
  children,
  kicker,
}: {
  children: React.ReactNode;
  kicker?: string;
}) {
  return (
    <div className="mb-8 text-center sm:mb-10">
      {kicker ? (
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-400/90">
          {kicker}
        </p>
      ) : null}
      <div className="mx-auto flex items-center justify-center gap-3">
        <span
          className="hidden h-px w-8 bg-gradient-to-r from-transparent to-red-500 sm:block sm:w-12"
          aria-hidden
        />
        <h2 className="text-balance text-xl font-extrabold uppercase tracking-tight text-white sm:text-2xl md:text-3xl">
          {children}
        </h2>
        <span
          className="hidden h-px w-8 bg-gradient-to-l from-transparent to-red-500 sm:block sm:w-12"
          aria-hidden
        />
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-red-600/25 bg-gradient-to-br from-zinc-900/90 to-zinc-950 p-5 shadow-lg transition hover:border-amber-400/35 hover:shadow-[0_0_32px_rgba(200,30,30,0.15)]">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-red-600/10 blur-2xl transition group-hover:bg-amber-500/10" />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-red-950/80 text-2xl ring-2 ring-amber-500/30">
        {icon}
      </div>
      <h3 className="relative mt-4 text-lg font-bold text-white">{title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-zinc-400">
        {desc}
      </p>
    </div>
  );
}

export default function IntroLanding() {
  return (
    <div
      className="relative min-h-screen overflow-x-hidden text-white"
      style={{
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        background:
          "linear-gradient(180deg, #120808 0%, #0c1412 22%, #080c10 55%, #0a1014 100%)",
      }}
    >
      {/* Sọc cảnh báo nhẹ — gợi băng dính an toàn PCCC */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-1.5 opacity-90"
        style={{
          background: `repeating-linear-gradient(
            -45deg,
            ${AMBER} 0px,
            ${AMBER} 10px,
            #1a1a1a 10px,
            #1a1a1a 20px
          )`,
        }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute left-1/2 top-24 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-red-600/20 blur-[100px] animate-pulse"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-0 top-[40%] h-64 w-64 rounded-full bg-amber-500/10 blur-[80px] animate-pulse [animation-delay:1s]"
        aria-hidden
      />

      <header className="sticky top-0 z-20 border-b border-red-900/40 bg-zinc-950/90 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8 sm:py-4">
          <div className="flex min-w-0 flex-1 items-start gap-2 sm:items-center sm:gap-3">
            <FlameIcon className="mt-0.5 h-8 w-8 shrink-0 text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.5)] sm:h-9 sm:w-9" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 sm:text-xs">
                Phòng cháy chữa cháy
              </p>
              <p className="text-xs font-bold uppercase leading-snug tracking-wide text-white sm:text-sm md:text-base">
                Phần mềm tính toán nguồn điện phục vụ hệ thống PCCC
              </p>
            </div>
          </div>
          <nav className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-lg border-2 border-white/25 bg-transparent px-3 py-2 text-xs font-bold text-white transition hover:border-amber-400/60 hover:bg-white/5 sm:px-4 sm:text-sm"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="rounded-lg px-3 py-2 text-xs font-bold text-zinc-950 shadow-lg transition hover:brightness-110 sm:px-4 sm:text-sm"
              style={{
                background: `linear-gradient(180deg, ${AMBER_SOFT} 0%, ${AMBER} 100%)`,
                boxShadow: `0 4px 20px rgba(200, 30, 30, 0.35)`,
              }}
            >
              Đăng ký
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        <section className="relative px-4 py-14 text-center sm:px-8 sm:py-20 md:py-24">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 inline-flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full border border-red-500/40 bg-red-950/50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-red-200 backdrop-blur-sm sm:text-xs">
                Đại học PCCC
              </span>
              <span className="rounded-full border border-amber-500/35 bg-amber-950/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-200 sm:text-xs">
                Khoa Phòng cháy
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-zinc-300 sm:text-xs">
                Sáng kiến giảng viên
              </span>
            </div>

            <h1 className="text-balance text-3xl font-extrabold uppercase leading-[1.15] tracking-tight text-white drop-shadow-md sm:text-4xl md:text-5xl lg:text-[2.75rem]">
              <span className="bg-gradient-to-r from-white via-amber-100 to-amber-200/90 bg-clip-text text-transparent">
                Giới thiệu
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-pretty text-base font-semibold leading-relaxed text-red-100/95 sm:text-lg">
              Phần mềm tính toán nguồn điện phục vụ hệ thống phòng cháy, chữa
              cháy
            </p>
            <p className="mx-auto mt-3 max-w-3xl text-pretty text-sm leading-relaxed text-zinc-300 sm:text-base">
              Sản phẩm sáng kiến của Giảng viên Khoa Phòng cháy — Đại học PCCC
            </p>
            <p className="mx-auto mt-2 max-w-3xl text-pretty text-sm text-amber-200/85 sm:text-base">
              <span className="font-semibold text-amber-300">Chủ trì:</span>{" "}
              ThS. Nguyễn Quang Trung — Vũ Xuân Hùng
            </p>

            <p className="mx-auto mt-8 max-w-2xl text-pretty text-sm leading-relaxed text-zinc-400 sm:text-base">
              Phần mềm hỗ trợ tính toán nguồn điện cho hệ thống PCCC, tập trung
              vào hai bài toán thực tế: phụ tải trạm bơm chữa cháy (công suất
              máy biến áp, máy phát điện dự phòng…) và nguồn cấp cho hệ thống
              báo cháy tự động (dòng tĩnh, dòng báo cháy, dung lượng ắc quy,
              dòng nạp…).
            </p>
          </div>
        </section>

        {/* Dải nhấn mạnh PCCC */}
        <div
          className="border-y border-red-800/50 py-3 text-center text-[11px] font-bold uppercase tracking-[0.25em] text-amber-200/90 sm:text-xs"
          style={{ backgroundColor: `${RED_DIM}cc` }}
        >
          An toàn phòng cháy · Thiết kế điện PCCC · Hồ sơ minh bạch
        </div>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-8 sm:py-16">
          <SectionTitle kicker="Năng lực">Tổng quan phần mềm</SectionTitle>
          <div className="mx-auto mb-12 grid gap-4 sm:grid-cols-3">
            <FeatureCard
              icon={<span aria-hidden>🛢️</span>}
              title="Trạm bơm chữa cháy"
              desc="Tính phụ tải bơm, máy biến áp, máy phát điện dự phòng — bám sát bài toán nguồn điện trạm bơm PCCC."
            />
            <FeatureCard
              icon={<span aria-hidden>🔔</span>}
              title="Báo cháy tự động"
              desc="Dòng tĩnh, dòng báo cháy, ắc quy dự phòng và nguồn chính — đầy đủ cho hệ thống TTBC."
            />
            <FeatureCard
              icon={<span aria-hidden>📄</span>}
              title="Xuất báo cáo Word"
              desc="Trình bày kết quả theo mẫu hồ sơ, tiện đính kèm thiết kế và thẩm duyệt."
            />
          </div>
          <div className="mx-auto max-w-3xl space-y-5 text-center text-sm leading-relaxed text-zinc-400 sm:text-base">
            <p>
              Phần mềm tập trung hai bài toán thực tế thường gặp trong thiết kế
              điện PCCC: cấp điện trạm bơm và cấp điện báo cháy. Kết quả được
              trình bày rõ ràng, bám sát các công thức tính toán thực tế, giúp
              người dùng dễ dàng kiểm tra và đối chiếu.
            </p>
            <p>
              Công cụ hỗ trợ xuất báo cáo Word phục vụ hồ sơ tư vấn, đảm bảo
              tính nhanh chóng và chính xác trong quá trình lựa chọn thiết bị.
            </p>
          </div>
        </section>

        <section className="border-y border-red-900/30 bg-gradient-to-b from-red-950/20 to-transparent px-4 py-14 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-7xl">
            <SectionTitle>Thiết bị & hiện trường</SectionTitle>
            <GalleryCarousel />
          </div>
        </section>

        <section className="px-4 py-14 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-5xl text-center">
            <SectionTitle>Đội ngũ &amp; hỗ trợ</SectionTitle>
            <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
              {PCCC_PERSON.map((person) => (
                <figure
                  key={person.src}
                  className="group overflow-hidden rounded-2xl border-2 border-red-600/30 bg-zinc-900/50 shadow-[0_20px_50px_rgba(0,0,0,0.45)] ring-1 ring-amber-500/20"
                >
                  <div className="relative aspect-[3/4] w-full sm:aspect-[4/5]">
                    <Image
                      src={person.src}
                      alt={person.alt}
                      fill
                      className="object-cover object-top transition duration-700 group-hover:scale-[1.02]"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent" />
                    <figcaption className="absolute inset-x-0 bottom-0 px-4 py-4 text-center">
                      <p className="text-sm font-bold text-amber-200 sm:text-base">
                        {person.caption}
                      </p>
                    </figcaption>
                  </div>
                </figure>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-red-900/40 bg-zinc-950 px-4 py-8 text-center">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1 opacity-80"
          style={{
            background: `repeating-linear-gradient(
              -45deg,
              ${AMBER} 0px,
              ${AMBER} 8px,
              #1a1a1a 8px,
              #1a1a1a 16px
            )`,
          }}
          aria-hidden
        />
        <p className="mt-2 text-xs text-zinc-500">
          © {new Date().getFullYear()} — Tính toán nguồn điện phục vụ hệ thống
          PCCC · Đại học PCCC
        </p>
      </footer>
    </div>
  );
}
