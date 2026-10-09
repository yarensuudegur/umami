import Svg, { Circle, Ellipse, G } from 'react-native-svg';

/** Five taste colors, one petal each: sweet, sour, salty, bitter and umami. */
export const TASTE_PETALS = ['#F2A38E', '#F2C14E', '#6FB1C8', '#8DAA6A', '#2E7D5B'] as const;

/**
 * The Umami mark: five petals spaced 72° apart around a deep-green core. Umami, the fifth taste,
 * is what balances the other four. Same geometry as the generated app icon and splash image.
 */
export function UmamiMark({ size = 40, dot = '#FFF8EC' }: { size?: number; dot?: string }) {
  return (
    <Svg width={size} height={size} viewBox="-100 -100 200 200" accessibilityLabel="Umami">
      {TASTE_PETALS.map((color, i) => (
        <G key={color} rotation={i * 72}>
          <Ellipse cx={0} cy={-46} rx={26} ry={40} fill={color} />
        </G>
      ))}
      <Circle r={26} fill="#1F5C42" />
      <Circle r={11} fill={dot} />
    </Svg>
  );
}
