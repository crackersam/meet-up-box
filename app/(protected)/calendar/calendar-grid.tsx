"use client";

import { useNextCalendarApp, ScheduleXCalendar } from "@schedule-x/react";
import {
  createViewDay,
  createViewMonthAgenda,
  createViewMonthGrid,
  createViewWeek,
  viewWeek,
} from "@schedule-x/calendar";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import { createEventModalPlugin } from "@schedule-x/event-modal";
import "@schedule-x/theme-default/dist/index.css";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { format } from "date-fns";

function CalendarGrid({
  names,
  dates,
  descriptions,
}: {
  names: string[];
  dates: Date[];
  descriptions: string[];
}) {
  const { theme } = useTheme();
  const eventsService = useState(() => createEventsServicePlugin())[0];
  const events = names.map((name, index) => {
    const startDate = dates[index];
    const endDate = new Date(startDate); // Clone the start date
    endDate.setHours(endDate.getHours() + 1); // Add 1 hour to the end date

    return {
      id: index.toString(),
      title: name,
      description: descriptions[index],
      start: format(startDate, "yyyy-MM-dd HH:mm"),
      end: format(endDate, "yyyy-MM-dd HH:mm"), // Use the updated end date
    };
  });

  const calendar = useNextCalendarApp({
    defaultView: viewWeek.name,
    weekOptions: {
      nDays: 7,
    },
    isDark: theme === "dark" ? true : false,
    views: [
      createViewWeek(),
      createViewDay(),
      createViewMonthGrid(),
      createViewMonthAgenda(),
    ],

    events: events,

    plugins: [eventsService, createEventModalPlugin()],
    callbacks: {
      onRender: () => {
        // get all events
        eventsService.getAll();
      },
    },
  });

  useEffect(() => {
    if (calendar) {
      calendar.setTheme(theme === "dark" ? "dark" : "light");
    }
  }, [calendar, theme]);

  return (
    <div>
      <ScheduleXCalendar calendarApp={calendar} />
    </div>
  );
}

export default CalendarGrid;
