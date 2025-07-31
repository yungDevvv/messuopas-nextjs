import { create } from 'zustand';

// Create a store for the sidebar's collapsed state
export const useSidebarStore = create((set) => ({
  isCollapsed: false, // Default state
  showCreateNewSection: false,
  toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  setShowCreateNewSection: (value) => set((state) => ({ showCreateNewSection: value })),
}));
