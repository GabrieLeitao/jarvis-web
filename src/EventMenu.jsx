import React, { useState, useEffect } from "react";
import "./EventMenu.css"; // Import the CSS file

export default function EventMenu({ event, onUpdate, onClose, onRemove }) {
  const [updatedEvent, setUpdatedEvent] = useState({
    title: event.title || "",
    start: event.start ? new Date(event.start).toISOString().slice(0, 16) : "",
    end: event.end ? new Date(event.end).toISOString().slice(0, 16) : "",
    description: event.extendedProps?.description || "",
    color: event.backgroundColor || "#20669f",
  });

  useEffect(() => {
    const toLocalDateTime = (isoString) => {
      if (!isoString) return "";
      const date = new Date(isoString);
      const offset = date.getTimezoneOffset() * 60000; // Convert minutes to milliseconds
      return new Date(date.getTime() - offset).toISOString().slice(0, 16); // Convert to local datetime
    };

    setUpdatedEvent({
      title: event.title || "",
      start: toLocalDateTime(event.start), // Convert to local datetime
      end: toLocalDateTime(event.end), // Convert to local datetime
      description: event.extendedProps?.description || "",
      color: event.backgroundColor || "#20669f",
    });
  }, [event]);

  const handleChange = (field, value) => {
    setUpdatedEvent({ ...updatedEvent, [field]: value });
  };

  const handleSave = () => {
    const toISOStringWithoutOffset = (localDateTime) => {
      const [date, time] = localDateTime.split("T");
      const [year, month, day] = date.split("-").map(Number);
      const [hours, minutes] = time.split(":").map(Number);
      const localDate = new Date(year, month - 1, day, hours, minutes);
      return localDate.toISOString(); // Convert directly to ISO string
    };

    onUpdate({
      ...updatedEvent,
      start: toISOStringWithoutOffset(updatedEvent.start), // Convert to ISO string
      end: toISOStringWithoutOffset(updatedEvent.end), // Convert to ISO string
      backgroundColor: updatedEvent.color, // Ensure the color is saved
    });
  };

  const handleRemove = () => {
    onRemove(event);
  };

  return (
    <div className="event-menu-overlay">
      <div className="event-menu">
        <h3>Edit Event</h3>
        <label>
          Title
          <input
            type="text"
            value={updatedEvent.title}
            onChange={(e) => handleChange("title", e.target.value)}
          />
        </label>
        <label>
          Start
          <input
            type="datetime-local"
            value={updatedEvent.start}
            onChange={(e) => handleChange("start", e.target.value)}
          />
        </label>
        <label>
          End
          <input
            type="datetime-local"
            value={updatedEvent.end}
            onChange={(e) => handleChange("end", e.target.value)}
          />
        </label>
        <label>
          Description
          <textarea
            value={updatedEvent.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </label>
        <label>
          Color
          <input
            type="color"
            value={updatedEvent.color}
            onChange={(e) => handleChange("color", e.target.value)}
          />
        </label>
        <div className="event-menu-buttons">
          <button onClick={handleSave}>Save</button>
          <button onClick={handleRemove}>Remove</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
