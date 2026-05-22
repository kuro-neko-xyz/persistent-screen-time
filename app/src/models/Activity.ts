interface Time {
  hours?: number;
  milliseconds?: number;
  minutes?: number;
  seconds?: number;
}

interface Application {
  id: string;
  name?: string;
  totalTimeSpent: Time;
}

export interface Activity {
  averageDailyTime: Time;
  applications: Application[];
}
