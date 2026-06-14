import type { CSSProperties } from 'react';
import type { EpisodeQuizGameId } from './episodeQuizzes';

type ThemeColor = 'primary' | 'secondary' | 'accent';

const createGameCardStyle = (colorVar: ThemeColor): CSSProperties => ({
  background: `linear-gradient(180deg, hsl(var(--card) / 0.92), hsl(var(--${colorVar}) / 0.2))`,
  border: `2px solid hsl(var(--${colorVar}) / 0.42)`,
  boxShadow: `0 0 14px hsl(var(--${colorVar}) / 0.24), inset 0 -3px 8px rgba(0,0,0,0.35)`,
});

const createGameBadgeStyle = (colorVar: ThemeColor): CSSProperties => ({
  background: `radial-gradient(circle at 30% 30%, hsl(var(--${colorVar}) / 0.5), hsl(var(--card) / 0.85))`,
  border: `1px solid hsl(var(--${colorVar}) / 0.55)`,
});

export const GAME_METADATA: Record<EpisodeQuizGameId, {
  label: string;
  emoji: string;
  badgeClassName: CSSProperties;
  cardStyle: CSSProperties;
  accentColor: string;
}> = {
  'colorful-balloons': {
    label: '七彩氣球',
    emoji: '🎈',
    badgeClassName: createGameBadgeStyle('primary'),//'border-primary/50 bg-primary text-primary-foreground',
    accentColor: 'hsl(var(--primary))',
    cardStyle: createGameCardStyle('primary'),
  },
  'golden-coins': {
    label: '知識接接樂',
    emoji: '🪙',
    badgeClassName: createGameBadgeStyle('secondary'),//'border-secondary/50 bg-secondary text-primary-foreground',
    accentColor: 'hsl(var(--secondary))',
    cardStyle: createGameCardStyle('secondary'),
  },
  'treasure-hunter': {
    label: '尋寶獵人',
    emoji: '💎',
    badgeClassName: createGameBadgeStyle('accent'),//'border-accent/50 bg-accent text-primary-foreground',
    accentColor: 'hsl(var(--accent))',
    cardStyle: createGameCardStyle('accent'),
  },
};
