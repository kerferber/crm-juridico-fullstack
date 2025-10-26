import dayjs from "dayjs";
const getGoalProgressPercentage = (goal) => {
  if (!goal.targetValue || goal.targetValue <= 0) return 0;
  const ratio = goal.currentValue / goal.targetValue;
  return Math.max(0, Math.min(1, ratio)) * 100;
};
const groupGoalCheckpoints = (checkpoints) => {
  const map = /* @__PURE__ */ new Map();
  checkpoints.forEach((checkpoint) => {
    if (!map.has(checkpoint.goalId)) {
      map.set(checkpoint.goalId, []);
    }
    map.get(checkpoint.goalId).push(checkpoint);
  });
  return map;
};
const getLatestGoalCheckpoint = (checkpoints) => {
  if (!checkpoints || checkpoints.length === 0) return void 0;
  return checkpoints.reduce((latest, current) => {
    if (!latest) return current;
    return dayjs(current.recordedAt).isAfter(dayjs(latest.recordedAt)) ? current : latest;
  }, void 0);
};
export {
  getGoalProgressPercentage,
  getLatestGoalCheckpoint,
  groupGoalCheckpoints
};
