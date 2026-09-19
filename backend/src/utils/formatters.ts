import { TaskStatus } from '@prisma/client';

export const formatStatusName = (status: TaskStatus): string => {
  switch (status) {
    case 'TODO':
      return 'To Do';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'IN_REVIEW':
      return 'In Review';
    case 'DONE':
      return 'Done';
    default:
      return status;
  }
};

export const formatTimeAgo = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'min' : 'mins'} ago`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
};

export const createStatusChangeDescription = (
  userName: string,
  taskNumber: number,
  fromStatus: TaskStatus,
  toStatus: TaskStatus
): string => {
  const fromFormatted = formatStatusName(fromStatus);
  const toFormatted = formatStatusName(toStatus);
  return `${userName} moved Task #${taskNumber} from ${fromFormatted} → ${toFormatted}`;
};
