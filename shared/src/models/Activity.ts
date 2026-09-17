export interface Time {
  hours?: number;
  milliseconds?: number;
  minutes?: number;
  seconds?: number;
}

export interface Application {
  id: string;
  name?: string;
  imageUrl?: string;
  totalTimeSpent: Time;
}

export type Applications = Application[];

interface Category {
  id: number;
  name?: string;
  totalTimeSpent: Time;
}

export type Categories = Category[];

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
