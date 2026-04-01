"use client";

import Image from "next/image";

const GALLERY: { src: string; alt: string; caption: string }[] = [
  {
    src: "/images/pccc/fire-pump-room.png",
    alt: "Phòng máy bơm chữa cháy và đường ống",
    caption: "Phòng bơm PCCC",
  },
  {
    src: "/images/pccc/pump-control-cabinet.png",
    alt: "Tủ điều khiển bơm chữa cháy",
    caption: "Tủ điều khiển bơm",
  },
  {
    src: "/images/pccc/sprinkler-installation.png",
    alt: "Hệ thống van và đường ống sprinkler",
    caption: "Hệ thống van & ống",
  },
  {
    src: "/images/pccc/fire-alarm-power-supply.png",
    alt: "Tủ nguồn trung tâm báo cháy",
    caption: "Nguồn TTBC",
  },
  {
    src: "/images/pccc/battery-backup.png",
    alt: "Minh họa nguồn dự phòng ắc quy",
    caption: "Dự phòng ắc quy",
  },
];

export default function PcccImageStrip() {
  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {GALLERY.map((item) => (
          <figure
            key={item.src}
            className="group overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-100"
          >
            <div className="relative aspect-[4/3] w-full bg-slate-100">
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover transition duration-300 group-hover:scale-[1.03]"
                priority={false}
              />
            </div>
            <figcaption className="border-t border-slate-100 px-2 py-2 text-center text-[11px] font-medium leading-tight text-slate-600">
              {item.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
