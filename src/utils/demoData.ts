import type { DayPlan, TripMeta } from "../types";

const changshaCenter = {
  lat: 28.228209,
  lng: 112.938814,
};

const today = new Date();
const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

const formatISO = (d: Date) => d.toISOString().slice(0, 10);

export const demoMeta: TripMeta = {
  city: "长沙",
  dates: [formatISO(today), formatISO(tomorrow)],
  center: changshaCenter,
};

export const demoDays: DayPlan[] = [
  {
    day_index: 1,
    date: formatISO(today),
    nodes: [
      {
        id: "spot-yuelu",
        type: "spot",
        name: "岳麓山",
        location: { lat: 28.182, lng: 112.945 },
        notes: "上午爬山，视野好，记得带水。",
      },
      {
        id: "dining-pozi",
        type: "dining",
        name: "坡子街美食街",
        location: { lat: 28.194, lng: 112.973 },
        notes: "晚饭，小龙虾、臭豆腐。",
      },
    ],
  },
  {
    day_index: 2,
    date: formatISO(tomorrow),
    nodes: [
      {
        id: "spot-orange",
        type: "spot",
        name: "橘子洲头",
        location: { lat: 28.203, lng: 112.967 },
      },
    ],
  },
];

export const demoTrip = {
  meta: demoMeta,
  days: demoDays,
};


