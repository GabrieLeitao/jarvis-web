import React, { useState, useEffect } from "react";
import CalendarComponent from "./CalendarComponent";
import EventMenu from "./EventMenu";
import VoiceControlButton from "./VoiceControlButton";
import extraData from "./api/extraData.json"; // Importando o JSON diretamente

export default function App() {
  const [events, setEvents] = useState([]);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const API_BASE_URL = "http://localhost:5000";

  useEffect(() => {
    fetchEventsAndTasks(); // Carregar eventos e tasks juntos
  }, []);

  const fetchEventsAndTasks = () => {
    setIsProcessing(true);

    // Fetch eventos do backend
    fetch(`${API_BASE_URL}/api/data`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        const backendEvents = data.events.map((event) => ({
          id: event.id || Math.random().toString(36).substr(2, 9),
          title: event.title || "Untitled Event",
          start: event.start,
          end: event.end,
          backgroundColor: event.color || "#20669f",
          extendedProps: {
            description: event.description || "",
          },
        }));

        // Processar tasks do extraData.json
        const tasks = extraData.events.map((task) => ({
          id: task.id || Math.random().toString(36).substr(2, 9),
          title: task.title,
          start: task.start,
          end: task.end,
          backgroundColor: task.color,
          extendedProps: {
            description: task.description,
          },
        }));

        // Combine eventos do backend com tasks do extraData.json
        setEvents([...backendEvents, ...tasks]);
      })
      .catch((error) => console.error("Error fetching events or tasks:", error))
      .finally(() => setIsProcessing(false));
  };

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

  const handleDateSelect = (selectInfo) => {
    const newEvent = {
      id: Math.random().toString(36).substr(2, 9),
      title: "New Event",
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      backgroundColor: "#20669f",
      extendedProps: { description: "" },
    };

    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    saveEventsToBackend(updatedEvents);
    selectInfo.view.calendar.unselect();
  };

  const handleEventAdd = (addInfo) => {
    const newEvent = {
      id: addInfo.event.id || Math.random().toString(36).substr(2, 9),
      title: addInfo.event.title,
      start: addInfo.event.start.toISOString(),
      end: addInfo.event.end ? addInfo.event.end.toISOString() : null,
      backgroundColor: addInfo.event.backgroundColor || "#20669f",
      extendedProps: addInfo.event.extendedProps || {},
    };

    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    saveEventsToBackend(updatedEvents);
  };

  const handleEventRemove = (eventToRemove) => {
    const updatedEvents = events.filter((event) => event.id !== eventToRemove.id);
    setEvents(updatedEvents);
    saveEventsToBackend(updatedEvents);
    setSelectedEvent(null);
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

    changeInfo.event.setStart(changeInfo.event.start);
    changeInfo.event.setEnd(changeInfo.event.end);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "20px", position: "relative" }}>
      <VoiceControlButton
        darkMode={false}
        onNavigate={(view, date) => console.log("Navigate to:", view, date)}
        onAddEvent={(eventName, date, startTime, endTime) =>
          console.log("Add event:", eventName, date, startTime, endTime)
        }
        onUpdateCalendar={fetchEventsAndTasks} // Atualiza eventos e tasks juntos
      />
      <div style={{ flex: 1, position: "relative" }}>
        {isProcessing && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1000,
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)",
            }}
          >
            <p style={{ fontSize: "18px", fontWeight: "bold", color: "#20669f" }}>Carregando...</p>
          </div>
        )}
        <CalendarComponent
          events={events} // Exibe eventos e tasks combinados
          onEventClick={(eventInfo) => {
            setSelectedEvent(eventInfo.event);
            const rect = eventInfo.jsEvent.target.getBoundingClientRect();
            setMenuPosition({ top: rect.top, left: rect.left });
          }}
          onEventAdd={handleEventAdd}
          onEventRemove={handleEventRemove}
          onDateSelect={handleDateSelect}
          onEventChange={handleEventChange}
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
            onUpdate={(updatedProps) => {
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
            }}
            onRemove={(eventToRemove) => {
              const updatedEvents = events.filter((event) => event.id !== eventToRemove.id);
              setEvents(updatedEvents);
              saveEventsToBackend(updatedEvents);
              setSelectedEvent(null);
            }}
            onClose={() => setSelectedEvent(null)}
          />
        </div>
      )}
    </div>
  );
}