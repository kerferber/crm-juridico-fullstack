import dayjs from 'dayjs';
import { Goal, GoalCheckpoint } from '../types/types';

export const getGoalProgressPercentage = (goal: Goal): number => {
  if (!goal.targetValue || goal.targetValue <= 0) return 0;
  const ratio = goal.currentValue / goal.targetValue;
  return Math.max(0, Math.min(1, ratio)) * 100;
};

export const groupGoalCheckpoints = (
  checkpoints: GoalCheckpoint[]
): Map<string, GoalCheckpoint[]> => {
  const map = new Map<string, GoalCheckpoint[]>();
  checkpoints.forEach(checkpoint => {
    if (!map.has(checkpoint.goalId)) {
      map.set(checkpoint.goalId, []);
    }
    map.get(checkpoint.goalId)!.push(checkpoint);
  });
  return map;
};

export const getLatestGoalCheckpoint = (
  checkpoints: GoalCheckpoint[] | undefined
): GoalCheckpoint | undefined => {
  if (!checkpoints || checkpoints.length === 0) return undefined;
  return checkpoints.reduce<GoalCheckpoint | undefined>((latest, current) => {
    if (!latest) return current;
    return dayjs(current.recordedAt).isAfter(dayjs(latest.recordedAt)) ? current : latest;
  }, undefined);
};
