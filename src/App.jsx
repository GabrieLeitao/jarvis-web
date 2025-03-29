import React, { useState, useEffect } from "react";
import CalendarComponent from "./CalendarComponent";
import EventMenu from "./EventMenu";

export default function App() {
  const [events, setEvents] = useState([]);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedEvent, setSelectedEvent] = useState(null);

  const API_BASE_URL = "http://localhost:5000"; // Ensure this matches your backend server

  useEffect(() => {
    // Fetch events from the backend
    fetch(`${API_BASE_URL}/api/data`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.events && Array.isArray(data.events)) {
          setEvents(
            data.events.map((event) => ({
              id: event.id || Math.random().toString(36).substr(2, 9), // Ensure each event has a unique ID
              title: event.title || "Untitled Event",
              start: event.start,
              end: event.end,
              backgroundColor: event.color || "#20669f",
              extendedProps: {
                description: event.description || "",
              },
            }))
          );
        } else {
          console.error("Invalid events data structure:", data);
        }
      })
      .catch((error) => console.error("Error fetching events:", error));
  }, []);

  const saveEventsToBackend = (updatedEvents) => {
    fetch(`${API_BASE_URL}/api/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: updatedEvents }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to save events: ${response.statusText}`);
        }
        return response.json();
      })
      .then(() => console.log("Events saved successfully"))
      .catch((error) => console.error("Error saving events:", error));
  };

  const handleEventClick = (eventInfo) => {
    setSelectedEvent(eventInfo.event);
    const rect = eventInfo.jsEvent.target.getBoundingClientRect();
    setMenuPosition({ top: rect.top, left: rect.left });
  };

  const handleEventUpdate = (updatedProps) => {
    const updatedEvents = events.map((event) =>
      event.id === selectedEvent.id
        ? {
            ...event,
            title: updatedProps.title,
            start: updatedProps.start,
            end: updatedProps.end,
            backgroundColor: updatedProps.color,
            extendedProps: { description: updatedProps.description },
          }
        : event
    );

    setEvents(updatedEvents);
    saveEventsToBackend(updatedEvents);

    selectedEvent.setProp("title", updatedProps.title);
    selectedEvent.setExtendedProp("description", updatedProps.description);
    selectedEvent.setStart(updatedProps.start);
    selectedEvent.setEnd(updatedProps.end);
    selectedEvent.setProp("backgroundColor", updatedProps.color);

    setSelectedEvent(null);
  };

  const handleDateSelect = (selectInfo) => {
    const newEvent = {
      id: Math.random().toString(36).substr(2, 9), // Generate a unique ID
      title: "New Event",
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      backgroundColor: "#20669f",
      extendedProps: { description: "" },
    };
    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    saveEventsToBackend(updatedEvents);
    selectInfo.view.calendar.unselect(); // Clear selection
  };

  const handleEventAdd = (addInfo) => {
    const updatedEvents = [...events, addInfo.event];
    setEvents(updatedEvents);
    saveEventsToBackend(updatedEvents);
  };

  const handleEventRemove = (eventToRemove) => {
    const updatedEvents = events.filter((event) => event.id !== eventToRemove.id);
    setEvents(updatedEvents);
    saveEventsToBackend(updatedEvents);
    setSelectedEvent(null); // Close the menu
  };

  const handleEventChange = (changeInfo) => {
    const updatedEvents = events.map((event) =>
      event.id === changeInfo.event.id
        ? {
            ...event,
            start: changeInfo.event.start.toISOString(),
            end: changeInfo.event.end ? changeInfo.event.end.toISOString() : null,
          }
        : event
    );
    setEvents(updatedEvents);
    saveEventsToBackend(updatedEvents);

    // Update the event in FullCalendar
    changeInfo.event.setStart(changeInfo.event.start);
    changeInfo.event.setEnd(changeInfo.event.end);
  };

  return (
    <div style={{ display: "flex", flexDirection: "row", gap: "20px", padding: "20px", position: "relative" }}>
      <div style={{ flex: 1 }}>
        <CalendarComponent
          events={events}
          onEventClick={handleEventClick}
          onEventAdd={handleEventAdd}
          onEventRemove={handleEventRemove}
          onDateSelect={handleDateSelect}
          onEventChange={handleEventChange} // Pass the event change handler
        />
      </div>
      {selectedEvent && (
        <div
          style={{
            position: "fixed",
            top: menuPosition.top,
            left: menuPosition.left,
            zIndex: 1000,
          }}
        >
          <EventMenu
            event={selectedEvent}
            onUpdate={handleEventUpdate}
            onRemove={handleEventRemove}
            onClose={() => setSelectedEvent(null)}
          />
        </div>
      )}
    </div>
  );
}

