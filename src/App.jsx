import React, { useState, useEffect } from "react";
import CalendarComponent from "./CalendarComponent";
import EventMenu from "./EventMenu";

export default function App() {
  const [events, setEvents] = useState([]);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [listening, setListening] = useState(false); // State to track if microphone is active
  const [feedback, setFeedback] = useState(""); // State for feedback message

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

  const handleVoiceCommand = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setFeedback("Listening...");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setFeedback(`Heard: "${transcript}"`);
      processVoiceCommand(transcript);
    };

    recognition.onerror = (event) => {
      setFeedback("Error occurred during recognition.");
      console.error("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  const processVoiceCommand = (command) => {
    if (command.includes("add event")) {
      const titleMatch = command.match(/title:\s*([^,]+)/i);
      const startMatch = command.match(/start:\s*([^,]+)/i);
      const endMatch = command.match(/end:\s*([^,]+)/i);
      const descriptionMatch = command.match(/description:\s*([^,]+)/i);

      const newEvent = {
        id: Math.random().toString(36).substr(2, 9),
        title: titleMatch ? titleMatch[1].trim() : "New Event",
        start: startMatch ? startMatch[1].trim() : new Date().toISOString(),
        end: endMatch ? endMatch[1].trim() : new Date().toISOString(),
        backgroundColor: "#20669f",
        extendedProps: {
          description: descriptionMatch ? descriptionMatch[1].trim() : "",
        },
      };

      const updatedEvents = [...events, newEvent];
      setEvents(updatedEvents);
      saveEventsToBackend(updatedEvents);
      setFeedback("Event added successfully!");
    } else if (command.includes("optimize schedule")) {
      optimizeSchedule();
    } else {
      setFeedback("Command not recognized. Try 'Add event' or 'Optimize schedule'.");
    }
  };

  const optimizeSchedule = () => {
    const sortedEvents = [...events].sort((a, b) => new Date(a.start) - new Date(b.start));
    setEvents(sortedEvents);
    saveEventsToBackend(sortedEvents);
    alert("Schedule optimized!");
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
      <button
        onClick={handleVoiceCommand}
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

