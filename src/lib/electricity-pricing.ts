// ── Electricity pricing data from tokusurudenki.com/details (April 2025) ──

export type BasicFeeRow = {
  ampere: number;
  oldPrice: number;
  newPrice: number;
};

export type VolumeTier = {
  tier: string;
  price: number;
};

export type RegionPricing = {
  regionKey: string;
  providerName: string;
  prefectures: string[];
  isMinimumFee: boolean;
  basicFee: BasicFeeRow[];
  minimumFee?: {
    oldPrice: number;
    newPrice: number;
    includedKwh: number;
  };
  volumeRate: VolumeTier[];
  newVolumeRate: VolumeTier[];
  note: string;
};

export const REGIONS: RegionPricing[] = [
  // ── Hokkaido ──
  {
    regionKey: "hokkaido",
    providerName: "北海道電力",
    prefectures: ["北海道"],
    isMinimumFee: false,
    basicFee: [
      { ampere: 30, oldPrice: 1122.0, newPrice: 770 },
      { ampere: 40, oldPrice: 1496.0, newPrice: 770 },
      { ampere: 50, oldPrice: 1870.0, newPrice: 770 },
      { ampere: 60, oldPrice: 2244.0, newPrice: 770 },
    ],
    volumeRate: [
      { tier: "1~120kWh", price: 35.35 },
      { tier: "120~300kWh", price: 41.64 },
      { tier: "301kWh~", price: 45.36 },
    ],
    newVolumeRate: [
      { tier: "1~200kWh", price: 32.80 },
      { tier: "201kWh~", price: 30.80 },
    ],
    note: "※2025年4月の単価",
  },
  // ── Tohoku ──
  {
    regionKey: "tohoku",
    providerName: "東北電力",
    prefectures: ["青森", "岩手", "宮城", "秋田", "山形", "福島", "新潟"],
    isMinimumFee: false,
    basicFee: [
      { ampere: 30, oldPrice: 1108.8, newPrice: 770 },
      { ampere: 40, oldPrice: 1478.4, newPrice: 770 },
      { ampere: 50, oldPrice: 1848.0, newPrice: 770 },
      { ampere: 60, oldPrice: 2217.6, newPrice: 770 },
    ],
    volumeRate: [
      { tier: "1~120kWh", price: 29.62 },
      { tier: "120~300kWh", price: 36.37 },
      { tier: "301kWh~", price: 40.32 },
    ],
    newVolumeRate: [
      { tier: "1~200kWh", price: 29.60 },
      { tier: "201kWh~", price: 27.60 },
    ],
    note: "※2025年4月の単価",
  },
  // ── Tokyo ──
  {
    regionKey: "tokyo",
    providerName: "東京電力",
    prefectures: ["東京", "神奈川", "埼玉", "千葉", "茨城", "栃木", "群馬", "山梨", "静岡東部"],
    isMinimumFee: false,
    basicFee: [
      { ampere: 30, oldPrice: 935.25, newPrice: 770 },
      { ampere: 40, oldPrice: 1247.0, newPrice: 770 },
      { ampere: 50, oldPrice: 1558.75, newPrice: 770 },
      { ampere: 60, oldPrice: 1870.5, newPrice: 770 },
    ],
    volumeRate: [
      { tier: "1~120kWh", price: 29.80 },
      { tier: "120~300kWh", price: 36.40 },
      { tier: "301kWh~", price: 40.49 },
    ],
    newVolumeRate: [
      { tier: "1~200kWh", price: 29.60 },
      { tier: "201kWh~", price: 27.60 },
    ],
    note: "※2025年4月の単価",
  },
  // ── Chubu ──
  {
    regionKey: "chubu",
    providerName: "中部電力",
    prefectures: ["愛知", "岐阜", "三重", "長野", "静岡西部"],
    isMinimumFee: false,
    basicFee: [
      { ampere: 30, oldPrice: 963.42, newPrice: 770 },
      { ampere: 40, oldPrice: 1284.56, newPrice: 770 },
      { ampere: 50, oldPrice: 1605.7, newPrice: 770 },
      { ampere: 60, oldPrice: 1926.84, newPrice: 770 },
    ],
    volumeRate: [
      { tier: "1~120kWh", price: 21.20 },
      { tier: "120~300kWh", price: 25.67 },
      { tier: "301kWh~", price: 28.62 },
    ],
    newVolumeRate: [
      { tier: "1~200kWh", price: 28.70 },
      { tier: "201kWh~", price: 27.30 },
    ],
    note: "※2025年4月の単価",
  },
  // ── Hokuriku ──
  {
    regionKey: "hokuriku",
    providerName: "北陸電力",
    prefectures: ["富山", "石川", "福井"],
    isMinimumFee: false,
    basicFee: [
      { ampere: 30, oldPrice: 907.5, newPrice: 770 },
      { ampere: 40, oldPrice: 1210.0, newPrice: 770 },
      { ampere: 50, oldPrice: 1512.5, newPrice: 770 },
      { ampere: 60, oldPrice: 1815.0, newPrice: 770 },
    ],
    volumeRate: [
      { tier: "1~120kWh", price: 30.86 },
      { tier: "120~300kWh", price: 34.75 },
      { tier: "301kWh~", price: 36.46 },
    ],
    newVolumeRate: [
      { tier: "1~200kWh", price: 26.30 },
      { tier: "201kWh~", price: 24.30 },
    ],
    note: "※2025年4月の単価",
  },
  // ── Kansai ──
  {
    regionKey: "kansai",
    providerName: "関西電力",
    prefectures: ["大阪", "京都", "兵庫", "奈良", "滋賀", "和歌山"],
    isMinimumFee: true,
    basicFee: [],
    minimumFee: {
      oldPrice: 522.58,
      newPrice: 290,
      includedKwh: 15,
    },
    volumeRate: [
      { tier: "1~120kWh", price: 20.21 },
      { tier: "120~300kWh", price: 25.61 },
      { tier: "301kWh~", price: 28.59 },
    ],
    newVolumeRate: [
      { tier: "1~200kWh", price: 28.50 },
      { tier: "201kWh~", price: 26.50 },
    ],
    note: "※2025年4月の単価",
  },
  // ── Chugoku ──
  {
    regionKey: "chugoku",
    providerName: "中国電力",
    prefectures: ["広島", "岡山", "山口", "鳥取", "島根"],
    isMinimumFee: true,
    basicFee: [],
    minimumFee: {
      oldPrice: 759.68,
      newPrice: 560,
      includedKwh: 15,
    },
    volumeRate: [
      { tier: "1~120kWh", price: 32.75 },
      { tier: "120~300kWh", price: 39.43 },
      { tier: "301kWh~", price: 41.55 },
    ],
    newVolumeRate: [
      { tier: "1~200kWh", price: 28.30 },
      { tier: "201kWh~", price: 26.30 },
    ],
    note: "※2025年4月の単価",
  },
  // ── Shikoku ──
  {
    regionKey: "shikoku",
    providerName: "四国電力",
    prefectures: ["香川", "徳島", "愛媛", "高知"],
    isMinimumFee: true,
    basicFee: [],
    minimumFee: {
      oldPrice: 666.89,
      newPrice: 550,
      includedKwh: 11,
    },
    volumeRate: [
      { tier: "1~120kWh", price: 30.65 },
      { tier: "120~300kWh", price: 37.27 },
      { tier: "301kWh~", price: 40.78 },
    ],
    newVolumeRate: [
      { tier: "1~200kWh", price: 28.70 },
      { tier: "201kWh~", price: 26.70 },
    ],
    note: "※2025年4月の単価",
  },
  // ── Kyushu ──
  {
    regionKey: "kyushu",
    providerName: "九州電力",
    prefectures: ["福岡", "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島"],
    isMinimumFee: false,
    basicFee: [
      { ampere: 30, oldPrice: 948.72, newPrice: 840 },
      { ampere: 40, oldPrice: 1264.96, newPrice: 840 },
      { ampere: 50, oldPrice: 1581.2, newPrice: 840 },
      { ampere: 60, oldPrice: 1897.44, newPrice: 840 },
    ],
    volumeRate: [
      { tier: "1~120kWh", price: 18.37 },
      { tier: "120~300kWh", price: 23.97 },
      { tier: "301kWh~", price: 26.97 },
    ],
    newVolumeRate: [
      { tier: "1~200kWh", price: 26.80 },
      { tier: "201kWh~", price: 24.80 },
    ],
    note: "※2025年4月の単価",
  },
];

// ── Region display names (for i18n fallback) ──
export const REGION_NAMES: Record<string, string> = {
  hokkaido: "北海道",
  tohoku: "東北",
  tokyo: "東京",
  chubu: "中部",
  hokuriku: "北陸",
  kansai: "関西",
  chugoku: "中国",
  shikoku: "四国",
  kyushu: "九州",
};

// ── Calculation helpers ──

/** Calculate old provider monthly bill from kWh */
export function calcOldBill(region: RegionPricing, kwh: number, ampere: number): number {
  let basicFee = 0;
  if (region.isMinimumFee && region.minimumFee) {
    basicFee = region.minimumFee.oldPrice;
  } else {
    const row = region.basicFee.find((r) => r.ampere === ampere);
    basicFee = row?.oldPrice ?? 0;
  }

  let volumeCost = 0;
  let remaining = kwh;

  // 3-tier: 0-120, 120-300, 300+
  const t1 = Math.min(remaining, 120);
  volumeCost += t1 * region.volumeRate[0].price;
  remaining -= t1;

  if (remaining > 0) {
    const t2 = Math.min(remaining, 180);
    volumeCost += t2 * region.volumeRate[1].price;
    remaining -= t2;
  }

  if (remaining > 0) {
    volumeCost += remaining * region.volumeRate[2].price;
  }

  return Math.round(basicFee + volumeCost);
}

/** Calculate Tokusuru Denki monthly bill from kWh */
export function calcNewBill(region: RegionPricing, kwh: number, ampere: number): number {
  let basicFee = 0;
  if (region.isMinimumFee && region.minimumFee) {
    basicFee = region.minimumFee.newPrice;
  } else {
    const row = region.basicFee.find((r) => r.ampere === ampere);
    basicFee = row?.newPrice ?? 0;
  }

  let volumeCost = 0;
  let remaining = kwh;

  // 2-tier: 0-200, 200+
  const t1 = Math.min(remaining, 200);
  volumeCost += t1 * region.newVolumeRate[0].price;
  remaining -= t1;

  if (remaining > 0) {
    volumeCost += remaining * region.newVolumeRate[1].price;
  }

  return Math.round(basicFee + volumeCost);
}

/** Estimate kWh from old provider bill amount */
export function estimateKwhFromBill(region: RegionPricing, bill: number, ampere: number): number {
  let basicFee = 0;
  if (region.isMinimumFee && region.minimumFee) {
    basicFee = region.minimumFee.oldPrice;
  } else {
    const row = region.basicFee.find((r) => r.ampere === ampere);
    basicFee = row?.oldPrice ?? 0;
  }

  let remaining = bill - basicFee;
  if (remaining <= 0) return 0;

  let kwh = 0;

  // Tier 1: 0-120kWh
  const t1Cost = 120 * region.volumeRate[0].price;
  if (remaining <= t1Cost) {
    kwh += remaining / region.volumeRate[0].price;
    return Math.round(kwh);
  }
  kwh += 120;
  remaining -= t1Cost;

  // Tier 2: 120-300kWh
  const t2Cost = 180 * region.volumeRate[1].price;
  if (remaining <= t2Cost) {
    kwh += remaining / region.volumeRate[1].price;
    return Math.round(kwh);
  }
  kwh += 180;
  remaining -= t2Cost;

  // Tier 3: 300+
  kwh += remaining / region.volumeRate[2].price;
  return Math.round(kwh);
}
