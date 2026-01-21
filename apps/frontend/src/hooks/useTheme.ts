// Simple theme hook - returns light theme for now
// Can be expanded later with theme switching functionality
export function useTheme() {
  return {
    theme: 'light' as const,
  };
}
