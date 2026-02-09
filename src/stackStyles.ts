interface StackMetrics {
  offsetXStep: number;
  offsetYStep: number;
  scaleStep: number;
  translateZStep: number;
}

const DESKTOP_STACK_METRICS: StackMetrics = {
  offsetXStep: 14,
  offsetYStep: 18,
  scaleStep: 0.04,
  translateZStep: 40,
};

const COMPACT_STACK_METRICS: StackMetrics = {
  offsetXStep: 9,
  offsetYStep: 12,
  scaleStep: 0.03,
  translateZStep: 28,
};

export const STACK_CARD_LIMIT = 3;

export const getStackCardVisualStyle = (depth: number, isCompact: boolean) => {
  const metrics = isCompact ? COMPACT_STACK_METRICS : DESKTOP_STACK_METRICS;
  const offsetX = depth * metrics.offsetXStep;
  const offsetY = depth * metrics.offsetYStep;
  const scale = 1 - depth * metrics.scaleStep;
  const translateZ = depth * -metrics.translateZStep;
  const isTop = depth === 0;

  return {
    isTop,
    transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) translateZ(${translateZ}px) scale(${scale})`,
    pointerEvents: isTop ? "auto" : "none",
    filter: isTop ? "none" : "saturate(0.6)",
  };
};
