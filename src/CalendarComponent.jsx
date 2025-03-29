import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import ptLocale from "@fullcalendar/core/locales/pt";

export default function CalendarComponent() {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ title: "", start: "", end: "" });
  const [showMenu, setShowMenu] = useState(false);

  // Fetch data (events and configurations) from the backend on component mount
  useEffect(() => {
    fetch("/api/data")
      .then((response) => response.json())
      .then((data) => {
        setEvents(data.events || []); // Load events from the JSON file
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  // Save data (events and configurations) to the backend
  const saveDataToBackend = (updatedEvents) => {
    const data = {
      events: updatedEvents,
      configurations: {}, // Add other configurations here if needed
    };
    fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch((error) => console.error("Error saving data:", error));
  };

  const handleEventAdd = (eventInfo) => {
    const newEvent = {
      title: eventInfo.event.title,
      start: eventInfo.event.start,
      end: eventInfo.event.end,
    };
    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    saveDataToBackend(updatedEvents);
  };

  const handleEventRemove = (eventInfo) => {
    const updatedEvents = events.filter(
      (event) => event.title !== eventInfo.event.title || event.start !== eventInfo.event.start
    );
    setEvents(updatedEvents);
    saveDataToBackend(updatedEvents);
  };

  // Handle adding a new event via the menu
  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.start) {
      alert("Please provide a title and start date for the event.");
      return;
    }
    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    saveDataToBackend(updatedEvents);
    setNewEvent({ title: "", start: "", end: "" }); // Reset the form
    setShowMenu(false); // Close the menu
  };

  // Set default values for the new event
  const openAddEventMenu = () => {
    const now = new Date();
    const defaultStart = now.toISOString().slice(0, 16); // Format as "YYYY-MM-DDTHH:mm"
    const defaultEnd = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16); // +1 hour
    setNewEvent({ title: "", start: defaultStart, end: defaultEnd });
    setShowMenu(true);
  };

  // Handle adding an event by selecting a time range in the calendar
  const handleSelect = (selectionInfo) => {
    const title = prompt("Enter event title:");
    if (title) {
      const newEvent = {
        title,
        start: selectionInfo.startStr,
        end: selectionInfo.endStr,
      };
      const updatedEvents = [...events, newEvent];
      setEvents(updatedEvents);
      saveDataToBackend(updatedEvents);
    }
  };

  return (
    <div style={{ width: "98%", margin: "auto", paddingTop: "20px", overflow: "hidden" }}>
      {/* Button to open the add event menu */}
      <button
        onClick={openAddEventMenu}
        style={{
          padding: "10px 15px",
          backgroundColor: "#20669f",
          color: "white",
          border: "none",
          borderRadius: "4px",
          marginBottom: "20px",
        }}
      >
        Add Event
      </button>

      {/* Add Event Menu */}
      {showMenu && (
        <div
          style={{
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "15px",
            position: "absolute",
            zIndex: 1000,
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Add New Event</h3>
          <input
            type="text"
            placeholder="Event Title"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            style={{ marginBottom: "10px", padding: "5px", width: "100%" }}
          />
          <input
            type="datetime-local"
            placeholder="Start Date"
            value={newEvent.start}
            onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
            style={{ marginBottom: "10px", padding: "5px", width: "100%" }}
          />
          <input
            type="datetime-local"
            placeholder="End Date (optional)"
            value={newEvent.end}
            onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
            style={{ marginBottom: "10px", padding: "5px", width: "100%" }}
          />
          <button
            onClick={handleAddEvent}
            style={{
              padding: "5px 10px",
              backgroundColor: "#20669f",
              color: "white",
              border: "none",
              borderRadius: "4px",
              marginRight: "10px",
            }}
          >
            Save Event
          </button>
          <button
            onClick={() => setShowMenu(false)}
            style={{
              padding: "5px 10px",
              backgroundColor: "#ccc",
              color: "black",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridDay,timeGridWeek,dayGridMonth,listWeek",
        }}
        locale={ptLocale}
        editable={true}
        selectable={true} // Enable selecting time ranges
        select={handleSelect} // Handle time range selection
        height="auto"
        dayHeaderFormat={{
          weekday: "short",
          day: "numeric",
        }}
        events={events}
        eventAdd={handleEventAdd}
        eventRemove={handleEventRemove}
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
    </div>
  );
}

