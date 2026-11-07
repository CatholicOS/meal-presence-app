import type { Formats } from 'next-intl'

/**
 * Named date formats, shared by server and client. Calendar dates (meal days, season bounds) are
 * stored as UTC midnight, so their formats pin UTC; instants (log entries, refresh time) follow
 * the community time zone set in the request config.
 */
export const formats = {
  dateTime: {
    dayShort: { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' },
    dayLong: { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' },
    monthDay: { day: 'numeric', month: 'long', timeZone: 'UTC' },
    month: { month: 'long', timeZone: 'UTC' },
    dateTime: { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' },
    time: { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' },
  },
} satisfies Formats
