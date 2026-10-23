'use client';

import React from 'react';
import { EventCalendarView } from '@/components/calendar/EventCalendarView';
import { Appointment } from '@/types';

interface WeeklyBookingMatrixProps {
  onOpenIntakeModal?: () => void;
  onPromptCompleteSession?: (apt: Appointment) => void;
  onSelectAppointment?: (apt: Appointment) => void;
  onOpenBookingForSlot?: (date: string, time: string) => void;
}

/**
 * Replaced the legacy room-by-room matrix with the standard ReUI Event Calendar block (@reui/event-calendar-1).
 * Supports Month, Week (7-day columns Mon-Sun), Day views, Calendars filter dropdown, and colored event pills.
 */
export function WeeklyBookingMatrix({
  onOpenIntakeModal,
  onPromptCompleteSession,
  onSelectAppointment,
  onOpenBookingForSlot,
}: WeeklyBookingMatrixProps) {
  return (
    <EventCalendarView
      onOpenIntakeModal={onOpenIntakeModal}
      onPromptCompleteSession={onPromptCompleteSession}
      onSelectAppointment={onSelectAppointment}
      onOpenBookingForSlot={onOpenBookingForSlot}
    />
  );
}

export default WeeklyBookingMatrix;
