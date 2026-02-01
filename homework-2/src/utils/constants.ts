import { Category, Priority, Status, Source, DeviceType } from '../types';

export const CATEGORIES = Object.values(Category);
export const PRIORITIES = Object.values(Priority);
export const STATUSES = Object.values(Status);
export const SOURCES = Object.values(Source);
export const DEVICE_TYPES = Object.values(DeviceType);

export const SUBJECT_MIN_LENGTH = 1;
export const SUBJECT_MAX_LENGTH = 200;
export const DESCRIPTION_MIN_LENGTH = 10;
export const DESCRIPTION_MAX_LENGTH = 2000;

export const DEFAULT_PORT = 3000;
