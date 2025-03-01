const REGEX = RegExp('^[+-]\\d{2}:\\d{2}$');

export class DateUtils {
  static parseDate(strDate: string): Date {
    const dateParts = strDate.split('-');
    return new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
  }

  static formatDateToYYYYMMDD(date: Date): string {
    return `${date.getFullYear()}-${DateUtils.padWithLeadingZeros(
      date.getMonth() + 1,
      2,
    )}-${DateUtils.padWithLeadingZeros(date.getDate(), 2)}`;
  }

  static padWithLeadingZeros(num: number, totalLength: number): string {
    return String(num).padStart(totalLength, '0');
  }

  //timezone format in "(+/-)(HH:mm)"
  static parseDateWithTimezoneToUTC(strDate: string, timezone: string): string {
    const date = DateUtils.parseDate(strDate);

    if (REGEX.test(timezone)) {
      if (timezone.startsWith('+')) {
        date.setDate(date.getDate() - 1);
        const parts = timezone.substring(1).split(':');
        let hoursStr;
        let minsStr;
        const mins = 60 - parseInt(parts[1]);
        if (mins == 60) {
          const hours = 24 - parseInt(parts[0]);
          minsStr = DateUtils.padWithLeadingZeros(0, 2);
          hoursStr = DateUtils.padWithLeadingZeros(hours, 2);
        } else {
          const hours = 24 - parseInt(parts[0]) - 1;
          minsStr = DateUtils.padWithLeadingZeros(mins, 2);
          hoursStr = DateUtils.padWithLeadingZeros(hours, 2);
        }
        return `${date.getFullYear()}-${DateUtils.padWithLeadingZeros(
          date.getMonth() + 1,
          2,
        )}-${DateUtils.padWithLeadingZeros(date.getDate(), 2)}T${hoursStr}:${minsStr}:00Z`;
      } else {
        return `${date.getFullYear()}-${DateUtils.padWithLeadingZeros(
          date.getMonth() + 1,
          2,
        )}-${DateUtils.padWithLeadingZeros(date.getDate(), 2)}T${timezone.substring(1)}:00Z`;
      }
    } else {
      throw Error('wrong format timezone');
    }
  }

  // Eg: format 2024-02-16 (timezone '+07:00') to 2024-02-15 17:00:00 (instead of 2024-02-15T17:00:00Z in above function)
  static parseDateWithTimezoneToNonStandardUTC(strDate: string, timezone: string): string {
    const date = DateUtils.parseDate(strDate);

    if (REGEX.test(timezone)) {
      if (timezone.startsWith('+')) {
        date.setDate(date.getDate() - 1);
        const parts = timezone.substring(1).split(':');
        let hoursStr;
        let minsStr;
        const mins = 60 - parseInt(parts[1]);
        if (mins == 60) {
          const hours = 24 - parseInt(parts[0]);
          minsStr = DateUtils.padWithLeadingZeros(0, 2);
          hoursStr = DateUtils.padWithLeadingZeros(hours, 2);
        } else {
          const hours = 24 - parseInt(parts[0]) - 1;
          minsStr = DateUtils.padWithLeadingZeros(mins, 2);
          hoursStr = DateUtils.padWithLeadingZeros(hours, 2);
        }
        return `${date.getFullYear()}-${DateUtils.padWithLeadingZeros(
          date.getMonth() + 1,
          2,
        )}-${DateUtils.padWithLeadingZeros(date.getDate(), 2)} ${hoursStr}:${minsStr}:00`;
      } else {
        return `${date.getFullYear()}-${DateUtils.padWithLeadingZeros(
          date.getMonth() + 1,
          2,
        )}-${DateUtils.padWithLeadingZeros(date.getDate(), 2)} ${timezone.substring(1)}:00`;
      }
    } else {
      throw Error('wrong format timezone');
    }
  }

  /**
   * @param offset number, eg: 7 for UTC+7
   */
  static parseDateWithTimezone(
    date: Date,
    offset = 7,
  ): {
    year: string;
    month: string;
    day: string;
    hours: string;
    minutes: string;
    seconds: string;
  } {
    const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000; // get utc milliseconds
    const timezoneDate = new Date(utc + offset * 60 * 60 * 1000); // get Date instance, ISO type (can convert to any timezone)

    // Get date time from UTC +- offset. NOTE: all method below convert to local time
    const hours = timezoneDate.getHours();
    const minutes = timezoneDate.getMinutes();
    const seconds = timezoneDate.getSeconds();
    const day = timezoneDate.getDate();
    const month = timezoneDate.getMonth() + 1;
    const year = timezoneDate.getFullYear();

    return {
      year: DateUtils.padWithLeadingZeros(year, 2),
      month: DateUtils.padWithLeadingZeros(month, 2),
      day: DateUtils.padWithLeadingZeros(day, 2),
      hours: DateUtils.padWithLeadingZeros(hours, 2),
      minutes: DateUtils.padWithLeadingZeros(minutes, 2),
      seconds: DateUtils.padWithLeadingZeros(seconds, 2),
    };
  }

  static compare(date1: string, date2: string): number {
    return DateUtils.parseDate(date1).getTime() - DateUtils.parseDate(date2).getTime();
  }

  static getToday(): string {
    return DateUtils.formatDateToYYYYMMDD(new Date());
  }

  static getYesterday(): string {
    return DateUtils.getYesterdaysOf(DateUtils.getToday());
  }

  static addDays(strDate: string, numDays: number): Date {
    const date = DateUtils.parseDate(strDate);
    date.setDate(date.getDate() + numDays);
    return date;
  }

  static getNextDaysOf(strDate: string): string {
    return DateUtils.formatDateToYYYYMMDD(DateUtils.addDays(strDate, 1));
  }

  static getYesterdaysOf(strDate: string): string {
    return DateUtils.formatDateToYYYYMMDD(DateUtils.addDays(strDate, -1));
  }

  static getAfterDaysOf(strDate: string, days: number): string {
    return DateUtils.formatDateToYYYYMMDD(DateUtils.addDays(strDate, days));
  }

  static getBeforeDaysOf(strDate: string, days: number): string {
    return DateUtils.formatDateToYYYYMMDD(DateUtils.addDays(strDate, -days));
  }

  // static getMinMaxDate(dateStr1: string, dateStr2: string, isMin: boolean): string {
  //   const date1 = DateUtils.parseDate(dateStr1);
  //   const date2 = DateUtils.parseDate(dateStr2);
  //   if (isMin) {
  //     return date1 < date2 ? dateStr1 : dateStr2;
  //   } else {
  //     return date1 > date2 ? dateStr1 : dateStr2;
  //   }
  // }

  static getMinDate(dateStr1: string, dateStr2: string): string {
    const date1 = DateUtils.parseDate(dateStr1);
    const date2 = DateUtils.parseDate(dateStr2);
    return date1 < date2 ? dateStr1 : dateStr2;
  }

  static getMinDateInRange(dates: string[]): string | undefined {
    if (!dates || dates.length == 0) {
      return undefined;
    }
    let minDate = dates[0];
    dates.forEach((date) => {
      if (DateUtils.parseDate(date) < DateUtils.parseDate(minDate)) {
        minDate = date;
      }
    });
    return minDate;
  }

  static getMaxDate(dateStr1: string, dateStr2: string): string {
    const date1 = DateUtils.parseDate(dateStr1);
    const date2 = DateUtils.parseDate(dateStr2);
    return date1 > date2 ? dateStr1 : dateStr2;
  }

  static getMaxDateInRange(dates: string[]): string | undefined {
    if (!dates || dates.length == 0) {
      return undefined;
    }
    let maxDate = dates[0];
    dates.forEach((date) => {
      if (DateUtils.parseDate(date) > DateUtils.parseDate(maxDate)) {
        maxDate = date;
      }
    });
    return maxDate;
  }

  static isBefore(dateStr1: string, dateStr2: string): boolean {
    // return dateStr1 < dateStr2;
    const date1 = DateUtils.parseDate(dateStr1);
    const date2 = DateUtils.parseDate(dateStr2);
    return date1 < date2;
  }

  static isAfter(dateStr1: string, dateStr2: string): boolean {
    // return dateStr1 > dateStr2;
    const date1 = DateUtils.parseDate(dateStr1);
    const date2 = DateUtils.parseDate(dateStr2);
    return date1 > date2;
  }

  static isEquals(dateStr1: string, dateStr2: string): boolean {
    // return dateStr1 === dateStr2;
    const date1 = DateUtils.parseDate(dateStr1);
    const date2 = DateUtils.parseDate(dateStr2);
    return date1.getTime() === date2.getTime();
  }

  static isBeforeOrEquals(dateStr1: string, dateStr2: string): boolean {
    // return dateStr1 <= dateStr2;
    const date1 = DateUtils.parseDate(dateStr1);
    const date2 = DateUtils.parseDate(dateStr2);
    return date1 <= date2;
  }

  static isAfterOrEquals(dateStr1: string, dateStr2: string): boolean {
    // return dateStr1 >= dateStr2;
    const date1 = DateUtils.parseDate(dateStr1);
    const date2 = DateUtils.parseDate(dateStr2);
    return date1 >= date2;
  }

  static isBetween(dateStr: string, startDateStr: string, endDateStr: string): boolean {
    // return dateStr >= startDateStr && dateStr <= endDateStr;
    const date = DateUtils.parseDate(dateStr);
    const startDate = DateUtils.parseDate(startDateStr);
    const endDate = DateUtils.parseDate(endDateStr);
    return date >= startDate && date <= endDate;
  }

  static getNumberOfDiffDays(dateStr1: string, dateStr2: string): number {
    const date1 = DateUtils.parseDate(dateStr1);
    const date2 = DateUtils.parseDate(dateStr2);
    const diff = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);
    return Math.round(diff);
  }

  static getDateRangeOfYear(year: number): { start: string; end: string } {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    return {
      start: DateUtils.formatDateToYYYYMMDD(startDate),
      end: DateUtils.formatDateToYYYYMMDD(endDate),
    };
  }

  static getDateRangeOfQuarter(year: number, quarter: number): { start: string; end: string } {
    if (quarter < 1 || quarter > 4) {
      throw new Error('Quarter must be between 1 and 4');
    }

    const startDate = new Date(year, (quarter - 1) * 3, 1);
    const endDate = new Date(year, quarter * 3, 0);

    return {
      start: DateUtils.formatDateToYYYYMMDD(startDate),
      end: DateUtils.formatDateToYYYYMMDD(endDate),
    };
  }

  static getDateRangeOfMonth(year: number, month: number): { start: string; end: string } {
    if (month < 1 || month > 12) {
      throw new Error('Month must be between 1 and 12');
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return {
      start: DateUtils.formatDateToYYYYMMDD(startDate),
      end: DateUtils.formatDateToYYYYMMDD(endDate),
    };
  }

  static getDateRangeOfPreviousMonth(year: number, month: number): { start: string; end: string } {
    if (month == 1) {
      year -= 1;
      month = 12;
    } else {
      month -= 1;
    }
    return DateUtils.getDateRangeOfMonth(year, month);
  }

  static getDateStringListOfRange(start: string, end: string): string[] {
    const dateList: string[] = [];
    let currentDate = start;

    while (DateUtils.isBeforeOrEquals(currentDate, end)) {
      dateList.push(currentDate);
      currentDate = DateUtils.getNextDaysOf(currentDate);
    }
    return dateList;
  }

  static splitIntoNDaysIntervals(
    startDate: string,
    endDate: string,
    interval = 10,
  ): [string, string][] {
    if (interval < 1) throw new Error('Interval must be greater than 0');

    if (DateUtils.isAfter(startDate, endDate)) {
      throw new Error('Start date must be before end date');
    }

    let currentStart = startDate;
    let currentEnd = DateUtils.getAfterDaysOf(currentStart, interval - 1);

    const intervals: [string, string][] = [];

    while (DateUtils.isAfter(endDate, currentEnd)) {
      intervals.push([currentStart, currentEnd]);
      currentStart = DateUtils.getNextDaysOf(currentEnd);
      currentEnd = DateUtils.getAfterDaysOf(currentStart, interval - 1);
    }

    // Add the last interval
    intervals.push([currentStart, endDate]);
    return intervals;
  }

  static splitRangeIntoMonths(start: string, end: string): { start: string; end: string }[] {
    let startDate = new Date(start);
    const endDate = new Date(end);
    const result: { start: string; end: string }[] = [];

    while (startDate < endDate) {
      const year = startDate.getFullYear();
      const month = startDate.getMonth();
      const lastDayOfMonth = new Date(year, month + 1, 0);

      if (lastDayOfMonth < endDate) {
        result.push({
          start: DateUtils.formatDateToYYYYMMDD(startDate),
          end: DateUtils.formatDateToYYYYMMDD(lastDayOfMonth),
        });
      } else {
        result.push({
          start: DateUtils.formatDateToYYYYMMDD(startDate),
          end: end,
        });
      }
      startDate = new Date(year, month + 1, 1);
    }
    return result;
  }

  static getPreviousRangeOf(start: string, end: string): { start: string; end: string } {
    const daysDifference = DateUtils.getNumberOfDiffDays(start, end) + 1;
    const previousStartDate = DateUtils.getBeforeDaysOf(start, daysDifference);
    const previousEndDate = DateUtils.getBeforeDaysOf(end, daysDifference);
    // const previousEndDate = DateUtils.getBeforeDaysOf(start, 1);
    // const previousStartDate = DateUtils.getBeforeDaysOf(previousEndDate, daysDifference);
    return {
      start: previousStartDate,
      end: previousEndDate,
    };
  }

  static combineDateRanges(
    ranges: { start: string; end: string }[],
  ): { start: string; end: string }[] {
    if (ranges.length === 0) {
      return [];
    }
    ranges.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()); // sort by start date - ASC

    const result: { start: string; end: string }[] = [];
    let index = 0;
    while (index < ranges.length - 1) {
      const current = ranges[index];
      const next = ranges[index + 1];

      if (
        DateUtils.isAfterOrEquals(current.end, next.start) ||
        DateUtils.getNumberOfDiffDays(current.end, next.start) === 1
      ) {
        result.push({
          start: current.start,
          end: DateUtils.getMaxDate(current.end, next.end),
        });
        index++; // skip next range in loop
      } else {
        result.push(current);
      }
      index++;
    }

    // Add the last range if it wasn't combined
    if (index === ranges.length - 1) result.push(ranges[index]);

    return result;
  }

  static formatDateToYYYYMMDDTimestamp(date: Date): number {
    const datetimeFormatString = `${date.getFullYear()}${DateUtils.padWithLeadingZeros(
      date.getMonth() + 1,
      2,
    )}${DateUtils.padWithLeadingZeros(date.getDate(), 2)}`;
    return Number(datetimeFormatString);
  }

  static getNumberOfDiffHours(dateStr1: string, dateStr2: string): number {
    const date1 = new Date(dateStr1);
    const date2 = new Date(dateStr2);
    const diff = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60);
    return Math.round(diff);
  }

  static formatMsToTime(ms: number): string {
    const msInHour = 3600000;
    const msInMinute = 60000;
    const msInSecond = 1000;

    const hours = Math.floor(ms / msInHour);
    const minutes = Math.floor((ms % msInHour) / msInMinute);
    const seconds = Math.floor((ms % msInMinute) / msInSecond);
    const milliseconds = ms % msInSecond;

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    const formattedMilliseconds = String(milliseconds).padStart(3, '0');

    return `${formattedHours}h:${formattedMinutes}m:${formattedSeconds}s:${formattedMilliseconds}ms`;
  }

  static getFirstDateOfYear(): string {
    const date = new Date();
    return DateUtils.formatDateToYYYYMMDD(new Date(date.getFullYear(), 0, 1));
  }

  static getTodayWithTimezone(offset = 7): string {
    const { year, month, day } = this.parseDateWithTimezone(new Date(), offset);
    return `${year}-${month}-${day}`;
  }

  /**
   * Add milliseconds to HH:mm time. Eg: 23:59 + 1s = 00:00
   * @param time HH:mm
   * @param msInterval milliseconds
   * @returns
   */
  static addHHMMTime(time: string, msInterval: number): string {
    const [hours, minutes] = time.split(':').map(Number);

    const currentTimeMs = hours * 60 * 60 * 1000 + minutes * 60 * 1000;

    let newTimeMs = currentTimeMs + msInterval;
    if (newTimeMs < 0) {
      newTimeMs += 24 * 60 * 60 * 1000;
    }

    const newHours = Math.floor(newTimeMs / (60 * 60 * 1000));
    const newMinutes = Math.floor((newTimeMs % (60 * 60 * 1000)) / (60 * 1000));

    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  }
}

export type TTimeRange = { startDate: string; endDate: string };
