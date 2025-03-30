import React, { useState, useEffect } from "react";
import "./EventMenu.css"; // Import the CSS file

export default function EventMenu({ event, onUpdate, onClose, onRemove }) {
  const [updatedEvent, setUpdatedEvent] = useState({
    title: event.title || "",
    start: event.start ? event.start.toISOString().slice(0, 16) : "",
    end: event.end ? event.end.toISOString().slice(0, 16) : "",
    description: event.extendedProps.description || "",
    color: event.backgroundColor || "#20669f",
  });

  useEffect(() => {
    setUpdatedEvent({
      title: event.title || "",
      start: event.start ? event.start.toISOString().slice(0, 16) : "",
      end: event.end ? event.end.toISOString().slice(0, 16) : "",
      description: event.extendedProps.description || "",
      color: event.backgroundColor || "#20669f",
    });
  }, [event]);

  const handleChange = (field, value) => {
    setUpdatedEvent({ ...updatedEvent, [field]: value });
  };

  const handleSave = () => {
    onUpdate(updatedEvent);
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
