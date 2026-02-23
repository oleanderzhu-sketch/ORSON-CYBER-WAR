export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE'
}

export interface Point {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  active: boolean;
}

export enum RobotPathType {
  LINEAR = 'LINEAR',
  SINE = 'SINE',
  ZIGZAG = 'ZIGZAG',
  PARABOLIC = 'PARABOLIC',
  HOMING = 'HOMING'
}

export interface Robot extends Entity {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  speed: number;
  color: string;
  pathType: RobotPathType;
  amplitude: number;
  frequency: number;
  phase: number;
}

export interface Missile extends Entity {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  speed: number;
  progress: number; // 0 to 1
  targetRobotId?: string;
}

export interface Explosion extends Entity {
  radius: number;
  maxRadius: number;
  growthRate: number;
  shrinking: boolean;
}

export interface Battery extends Entity {
  ammo: number;
  maxAmmo: number;
  destroyed: boolean;
  shieldActive: boolean;
}

export interface City extends Entity {
  destroyed: boolean;
  canRecover: boolean;
}

export interface LeaderboardEntry {
  id?: number;
  name: string;
  score: number;
  date: string;
}

export enum Difficulty {
  SIMPLE = 'SIMPLE',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export type Language = 'en' | 'zh';
