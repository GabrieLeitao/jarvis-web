import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function CalendarComponent({
  events,
  onEventClick,
  onEventAdd,
  onEventRemove,
  onDateSelect,
  onEventChange,
}) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      events={events}
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "timeGridDay,timeGridWeek,dayGridMonth",
      }}
      slotDuration="00:30:00"
      slotLabelInterval="01:00:00"
      eventClick={onEventClick} // Handle event clicks
      select={onDateSelect} // Handle date selection
      eventAdd={onEventAdd} // Handle event addition
      eventRemove={onEventRemove} // Handle event removal
      selectable={true} // Allow selecting dates
      editable={true} // Allow editing events
      eventChange={onEventChange}

      height="auto"
      dayHeaderFormat={{
        weekday: "short",
        day: "numeric",
      }}
      
      eventTimeFormat={{
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }}
      slotLabelFormat={{
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }}
    />
  );
}