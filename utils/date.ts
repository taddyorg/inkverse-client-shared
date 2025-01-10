import { formatDate } from 'date-fns/format'

const currentTime = new Date()
const currentYear = currentTime.getFullYear()

export function prettyFormattedDate(date: Date, showTime = false): string {
  if (!date) { return "" }
  
  const isCurrentYear = date.getFullYear() === currentYear
  const format = [
    'MMM Do',                    // Base format (e.g., "Jan 1st")
    !isCurrentYear && ', YYYY',  // Add year if not current
    showTime && ' h:mm a'        // Add time if requested
  ]
    .filter(Boolean)
    .join('')
    
  return formatDate(date, format)
}

export function prettyFormattedFreeInDays (date: number | undefined): number | undefined {
  if (!date) { return undefined }
  const newDate = new Date(date * 1000);
  const day = newDate.getDate();
  const days = day - new Date().getDate();
  return days
};
