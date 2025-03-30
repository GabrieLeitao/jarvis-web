import React, { useState, useEffect, useCallback } from "react";
import annyang from "annyang";
import { parseNaturalDate } from "./utils/dateParser"; // Import the date parser utility
import CalendarComponent from "./CalendarComponent";
import EventMenu from "./EventMenu"; // Import EventMenu

export default function App() {
  const [events, setEvents] = useState([]);
  const [feedback, setFeedback] = useState(""); // State for feedback message
  const [listening, setListening] = useState(false); // State to track if voice commands are active
  const [selectedEvent, setSelectedEvent] = useState(null); // State for the selected event
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 }); // State for menu position

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

  const loadTasksToCalendar = useCallback(() => {
    fetch(`${API_BASE_URL}/api/data`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch tasks: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.tasks && Array.isArray(data.tasks)) {
          const taskEvents = data.tasks.map((task) => ({
            id: task.id,
            title: task.title,
            start: task.start,
            end: task.end,
            backgroundColor: task.backgroundColor,
          }));
          setEvents((prevEvents) => [...prevEvents, ...taskEvents]);
          setFeedback("Tasks loaded into the calendar.");
          setTimeout(() => setFeedback(""), 3000); // Clear feedback after 3 seconds
        } else {
          console.error("Invalid tasks data structure:", data);
        }
      })
      .catch((error) => console.error("Error fetching tasks:", error));
  }, [API_BASE_URL]);

  const processVoiceCommand = useCallback((command) => {
    if (command.toLowerCase().includes("optimize schedule")) {
      loadTasksToCalendar();
    } else {
      const parsed = extractEventDetails(command);
      if (parsed) {
        const newEvent = {
          id: Math.random().toString(36).substr(2, 9),
          title: parsed.title,
          start: parsed.start,
          end: parsed.end,
          backgroundColor: "#20669f",
          extendedProps: { description: parsed.description || "" },
        };

        const updatedEvents = [...events, newEvent];
        setEvents(updatedEvents);

        setFeedback(`Added: "${newEvent.title}" from ${new Date(newEvent.start).toLocaleString()} to ${new Date(newEvent.end).toLocaleString()}`);
        setTimeout(() => setFeedback(""), 3000); // Clear feedback after 3 seconds
      } else {
        setFeedback("Could not understand. Try: 'Meeting on Monday at 10 AM for 2 hours'.");
        setTimeout(() => setFeedback(""), 3000); // Clear feedback after 3 seconds
      }
    }
  }, [events, loadTasksToCalendar]);

  const setupVoiceCommands = useCallback(() => {
    if (!annyang) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    const commands = {
      "*details": processVoiceCommand, // Match any command and pass it to the processor
    };

    annyang.addCommands(commands);
    annyang.start({ autoRestart: true, continuous: false });
    setListening(true);
    setFeedback("Listening for commands...");
    setTimeout(() => setFeedback(""), 3000); // Clear feedback after 3 seconds
  }, [processVoiceCommand]);

  const stopVoiceCommands = () => {
    if (annyang) {
      annyang.abort();
      setListening(false);
      setFeedback("Voice commands stopped.");
      setTimeout(() => setFeedback(""), 3000); // Clear feedback after 3 seconds
    }
  };

  useEffect(() => {
    return () => stopVoiceCommands(); // Cleanup on unmount
  }, []);

  const extractEventDetails = (text) => {
    const regex = /(?<title>.+?) (on|at) (?<start>.+?)( for (?<duration>.+?))?/i;
    const match = text.match(regex);
    if (!match) return null;

    const { title, start, duration } = match.groups;
    const startDate = parseNaturalDate(start);
    if (!startDate) return null;

    let endDate = new Date(startDate);
    if (duration) {
      const durationParts = duration.match(/(\d+) (hour|minute|day)s?/);
      if (durationParts) {
        const value = parseInt(durationParts[1], 10);
        if (durationParts[2].includes("hour")) endDate.setHours(endDate.getHours() + value);
        if (durationParts[2].includes("minute")) endDate.setMinutes(endDate.getMinutes() + value);
        if (durationParts[2].includes("day")) endDate.setDate(endDate.getDate() + value);
      }
    }

    return { title, start: startDate.toISOString(), end: endDate.toISOString() };
  };

  const handleEventClick = (eventInfo) => {
    setSelectedEvent(eventInfo.event);
    const rect = eventInfo.jsEvent.target.getBoundingClientRect();
    setMenuPosition({ top: rect.top + window.scrollY, left: rect.left + window.scrollX });
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

    selectedEvent.setProp("title", updatedProps.title);
    selectedEvent.setExtendedProp("description", updatedProps.description);
    selectedEvent.setStart(updatedProps.start);
    selectedEvent.setEnd(updatedProps.end);
    selectedEvent.setProp("backgroundColor", updatedProps.color);

    setSelectedEvent(null);
  };

  const handleEventAdd = (addInfo) => {
    const newEvent = {
      id: Math.random().toString(36).substr(2, 9),
      title: addInfo.event.title || "New Event",
      start: addInfo.event.start.toISOString(),
      end: addInfo.event.end ? addInfo.event.end.toISOString() : null,
      backgroundColor: addInfo.event.backgroundColor || "#20669f",
      extendedProps: {
        description: addInfo.event.extendedProps?.description || "",
      },
    };

    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
  };

  return (
    <div style={{ display: "flex", flexDirection: "row", gap: "20px", padding: "20px", position: "relative" }}>
      <div style={{ flex: 1 }}>
        <CalendarComponent
          events={events}
          onEventClick={handleEventClick} // Open EventMenu on event click
          onEventAdd={handleEventAdd} // Handle adding events
          onEventRemove={(eventToRemove) => setEvents(events.filter((event) => event.id !== eventToRemove.id))}
          onDateSelect={(selectInfo) => {
            const newEvent = {
              id: Math.random().toString(36).substr(2, 9),
              title: "New Event",
              start: selectInfo.startStr,
              end: selectInfo.endStr,
              backgroundColor: "#20669f",
              extendedProps: { description: "" },
            };
            setEvents([...events, newEvent]);
          }}
          onEventChange={(changeInfo) => {
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
          }}
        />
      </div>
      {selectedEvent && (
        <div
          style={{
            position: "absolute",
            top: menuPosition.top,
            left: menuPosition.left,
            zIndex: 1000,
          }}
        >
          <EventMenu
            event={selectedEvent}
            onUpdate={handleEventUpdate}
            onRemove={(eventToRemove) => {
              setEvents(events.filter((event) => event.id !== eventToRemove.id));
              setSelectedEvent(null);
            }}
            onClose={() => setSelectedEvent(null)}
          />
        </div>
      )}
      <button
        onClick={listening ? stopVoiceCommands : setupVoiceCommands}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
          backgroundColor: listening ? "#ff4d4d" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "60px",
          height: "60px",
          fontSize: "1.5rem",
          cursor: "pointer",
        }}
      >
        🎤
      </button>
      {feedback && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "20px",
            backgroundColor: "#ffffff",
            padding: "10px",
            borderRadius: "8px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            zIndex: 1000,
          }}
        >
          {feedback}
        </div>
      )}
    </div>
  );
}

