import { create } from "zustand";

interface BreadcrumbStore {
  titles: Record<string, string>;
  setBreadcrumbTitle: (segment: string, title: string) => void;
}

export const useBreadcrumbStore = create<BreadcrumbStore>((set) => ({
  titles: {},
  setBreadcrumbTitle: (segment, title) =>
    set((state) => ({
      titles: {
        ...state.titles,
        [segment]: title,
      },
    })),
}));
