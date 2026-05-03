export const BREAKPOINTS = {
  wide: 1200,
  medium: 900,
  narrow: 600,
};

export const getNumColumns = (width) => {
  if (width >= BREAKPOINTS.wide) return 6;
  if (width >= BREAKPOINTS.medium) return 5;
  if (width >= BREAKPOINTS.narrow) return 4;
  return 3;
};
