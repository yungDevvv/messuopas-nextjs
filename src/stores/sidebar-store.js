import { create } from 'zustand';

// Create a store for the sidebar's collapsed state
export const useSidebarStore = create((set) => ({
  isCollapsed: false, // Default state
  toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
}));
