export interface Time {
  hours?: number;
  milliseconds?: number;
  minutes?: number;
  seconds?: number;
}

interface Application {
  id: string;
  name?: string;
  imageUrl?: string;
  totalTimeSpent: Time;
}

interface Category {
  id: number;
  name?: string;
  totalTimeSpent: Time;
}

export interface Day {
  date: string;
  totalTimeSpent: Time;
}

export interface Activity {
  averageDailyTime: Time;
  applications?: Application[];
  categories?: Category[];
  days: Day[];
}
