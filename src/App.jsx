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

  const doesOverlap = (start, end, allEvents) => {
    return allEvents.some(
      (event) =>
        new Date(event.start) < end && new Date(event.end) > start // Check for any overlap, even less than 1 minute
    );
  };

  const generateWeeklySchedule = (existingEvents) => {
    const predefinedTasks = [
      { title: "Study Session", minDuration: 30, maxDuration: 120, backgroundColor: "#28a745" },
      { title: "Work Session", minDuration: 60, maxDuration: 120, backgroundColor: "#007bff" },
      { title: "Exercise", minDuration: 30, maxDuration: 60, backgroundColor: "#ff5733" },
      { title: "Break", minDuration: 15, maxDuration: 25, backgroundColor: "#17a2b8" },
      { title: "Piano", duration: 40, backgroundColor: "#f7a2b8" },
    ];

    const fixedTasks = [
      { title: "Lunch", duration: 30, backgroundColor: "#ffcc00" }, // Lunch duration is fixed at 30 minutes
      { title: "Dinner", duration: 30, backgroundColor: "#dc3545", time: "19:00" },
    ];

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const schedule = [];

    daysOfWeek.forEach((day, index) => {
      const today = new Date();
      const dayOffset = index - today.getDay() + (today.getDay() === 0 ? 1 : 0); // Adjust for Sunday (0)
      const currentDay = new Date(today);
      currentDay.setDate(today.getDate() + dayOffset);
      currentDay.setHours(8, 0, 0, 0); // Start at 8 AM

      const endOfDay = new Date(currentDay);
      endOfDay.setHours(21, 0, 0, 0); // End at 9 PM

      let currentTime = new Date(currentDay);
      const taskCounts = {}; // Track the number of each task type added per day
      let lastTaskType = null; // Track the last added task type

      // Initialize task counts
      predefinedTasks.forEach((task) => {
        taskCounts[task.title] = 0;
      });

      // Add lunch randomly between 11:30 AM and 2:30 PM
      const lunchStart = new Date(currentDay);
      lunchStart.setHours(11, 30, 0, 0); // 11:30 AM
      const lunchEnd = new Date(currentDay);
      lunchEnd.setHours(14, 30, 0, 0); // 2:30 PM

      let lunchScheduled = false;
      while (!lunchScheduled) {
        const randomMinutes = Math.floor(Math.random() * (180 - 30 + 1)); // Random offset within 3 hours
        const lunchTimeStart = new Date(lunchStart);
        lunchTimeStart.setMinutes(lunchTimeStart.getMinutes() + randomMinutes);
        const lunchTimeEnd = new Date(lunchTimeStart);
        lunchTimeEnd.setMinutes(lunchTimeEnd.getMinutes() + fixedTasks[0].duration);

        if (!doesOverlap(lunchTimeStart, lunchTimeEnd, [...existingEvents, ...schedule])) {
          schedule.push({
            id: `lunch_${day.toLowerCase()}`,
            title: fixedTasks[0].title, // "Lunch"
            start: lunchTimeStart.toISOString(),
            end: lunchTimeEnd.toISOString(),
            backgroundColor: fixedTasks[0].backgroundColor,
          });
          lunchScheduled = true;
        }
      }

      // Add dinner at a fixed time
      const dinnerTask = fixedTasks[1];
      const dinnerStart = new Date(currentDay);
      dinnerStart.setHours(...dinnerTask.time.split(":").map(Number), 0, 0);
      const dinnerEnd = new Date(dinnerStart);
      dinnerEnd.setMinutes(dinnerEnd.getMinutes() + dinnerTask.duration);

      if (!doesOverlap(dinnerStart, dinnerEnd, [...existingEvents, ...schedule])) {
        schedule.push({
          id: `dinner_${day.toLowerCase()}`,
          title: dinnerTask.title, // "Dinner"
          start: dinnerStart.toISOString(),
          end: dinnerEnd.toISOString(),
          backgroundColor: dinnerTask.backgroundColor,
        });
      }

      // Add variable tasks (Study, Work, Exercise, Breaks)
      while (currentTime < endOfDay) {
        const availableTasks = predefinedTasks.filter(
          (task) =>
            taskCounts[task.title] < 3 && // Limit each task type to a maximum of 3 per day
            (task.title !== "Break" || lastTaskType === "Study Session" || lastTaskType === "Work Session") && // Add breaks only after study or work sessions
            task.title !== lastTaskType // Avoid consecutive tasks of the same type
        );

        if (availableTasks.length === 0) break; // Stop if no tasks are available to add

        const randomTask = availableTasks[Math.floor(Math.random() * availableTasks.length)];
        const taskDuration =
          Math.floor(Math.random() * (randomTask.maxDuration - randomTask.minDuration + 1)) +
          randomTask.minDuration;

        const taskStart = new Date(currentTime);
        const taskEnd = new Date(currentTime);
        taskEnd.setMinutes(taskEnd.getMinutes() + taskDuration);

        // Skip if the task overlaps with existing events or fixed tasks
        if (doesOverlap(taskStart, taskEnd, [...existingEvents, ...schedule])) {
          currentTime.setMinutes(currentTime.getMinutes() + 15); // Skip 15 minutes
          continue;
        }

        if (taskEnd > endOfDay) break; // Stop if the task exceeds the end of the day

        schedule.push({
          id: Math.random().toString(36).substr(2, 9),
          title: randomTask.title, // Only the task title
          start: taskStart.toISOString(),
          end: taskEnd.toISOString(),
          backgroundColor: randomTask.backgroundColor,
        });

        taskCounts[randomTask.title] += 1; // Increment the count for this task type
        lastTaskType = randomTask.title; // Update the last added task type
        currentTime = new Date(taskEnd); // Move to the next available time slot
      }
    });

    return schedule;
  };

  const processVoiceCommand = useCallback((command) => {
    if (command.toLowerCase().includes("optimize schedule")) {
      const generatedTasks = generateWeeklySchedule(events);
      setEvents((prevEvents) => [...prevEvents, ...generatedTasks]);
      setFeedback("Weekly schedule optimized with predefined tasks.");
      setTimeout(() => setFeedback(""), 3000); // Clear feedback after 3 seconds
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
  }, [events]);

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
            backgroundColor: updatedProps.backgroundColor, // Update the color
            extendedProps: { description: updatedProps.description },
          }
        : event
    );

    setEvents(updatedEvents); // Update the events in memory

    selectedEvent.setProp("title", updatedProps.title);
    selectedEvent.setExtendedProp("description", updatedProps.description);
    selectedEvent.setStart(updatedProps.start);
    selectedEvent.setEnd(updatedProps.end);
    selectedEvent.setProp("backgroundColor", updatedProps.backgroundColor); // Update the color in the calendar

    setSelectedEvent(null); // Close the EventMenu
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

  const handleEventChange = (changeInfo) => {
    const updatedEvent = {
      id: changeInfo.event.id,
      title: changeInfo.event.title,
      start: changeInfo.event.start.toISOString(),
      end: changeInfo.event.end ? changeInfo.event.end.toISOString() : null,
      backgroundColor: changeInfo.event.backgroundColor || "#20669f",
      extendedProps: {
        description: changeInfo.event.extendedProps?.description || "",
      },
    };

    // Update the event in memory
    const updatedEvents = events.map((event) =>
      event.id === updatedEvent.id ? updatedEvent : event
    );
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
          onEventChange={handleEventChange} // Handle event changes
          editable={true} // Allow editing events
          selectable={true} // Allow selecting dates
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

