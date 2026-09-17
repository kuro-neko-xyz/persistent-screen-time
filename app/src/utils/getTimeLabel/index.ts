import type { Time } from "@persistent-screen-time/shared";

const getTimeLabel = (totalTimeSpent: Time) => {
  if (totalTimeSpent.hours || totalTimeSpent.minutes) {
    return `${totalTimeSpent.hours ? totalTimeSpent.hours + "h " : ""} ${totalTimeSpent.minutes ? totalTimeSpent.minutes + "m " : ""}`;
  }
  return `${totalTimeSpent.seconds ? totalTimeSpent.seconds + "s" : "1s"}`;
};

export default getTimeLabel;
