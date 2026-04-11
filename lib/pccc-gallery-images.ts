export type PcccGalleryItem = {
  src: string;
  alt: string;
  caption: string;
};

/** Ảnh minh họa PCCC — file trong `public/images/pccc/` */
export const PCCC_GALLERY: PcccGalleryItem[] = [
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
    src: "/images/pccc/tủ-báo-cháy.png",
    alt: "Tủ nguồn trung tâm báo cháy",
    caption: "Tủ báo cháy",
  },
  {
    src: "/images/pccc/Ac-quy-du-phong.png",
    alt: "Minh họa nguồn dự phòng ắc quy",
    caption: "Dự phòng ắc quy",
  },
  {
    src: "/images/pccc/may-bom-chua-chay-pentax-15hp-scaled-e1658512891131.jpg",
    alt: "Bơm chữa cháy dự phòng",
    caption: "Bơm chữa cháy",
  },
];

/** Ảnh chủ trì / đội ngũ — `public/images/pccc/` */
export const PCCC_PERSON: PcccGalleryItem[] = [
  {
    src: "/images/pccc/11e3ce13-35b2-46e4-8b2e-8fb7933cc6c5.jpg",
    alt: "ThS. Nguyễn Quang Trung",
    caption: "ThS. Nguyễn Quang Trung",
  },
  {
    src: "/images/pccc/6292fc33-d6ef-4292-92f3-266fa1fc0486.jpg",
    alt: "Vũ Xuân Hùng",
    caption: "Vũ Xuân Hùng",
  },
];
