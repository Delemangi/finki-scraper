import { z } from 'zod';

export enum Strategy {
  Announcements = 'announcements',
  Course = 'course',
  Diplomas = 'diplomas',
  Events = 'events',
  Jobs = 'jobs',
  Partners = 'partners',
  Projects = 'projects',
  Timetables = 'timetables',
}

export const StrategySchema = z.nativeEnum(Strategy);
