import React, { useState, useEffect } from "react";

export default function EventMenu({ event, onUpdate, onClose, onRemove }) {
  const [updatedEvent, setUpdatedEvent] = useState({
    title: event.title || "",
    start: event.start ? event.start.toISOString().slice(0, 16) : "",
    end: event.end ? event.end.toISOString().slice(0, 16) : "",
    description: event.extendedProps.description || "",
    color: event.backgroundColor || "#20669f",
  });

  useEffect(() => {
    // Update the state when the event prop changes
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
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "15px",
        zIndex: 1000,
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h3>Edit Event</h3>
      <input
        type="text"
        placeholder="Title"
        value={updatedEvent.title}
        onChange={(e) => handleChange("title", e.target.value)}
        style={{ marginBottom: "10px", padding: "5px", width: "100%" }}
      />
      <input
        type="datetime-local"
        value={updatedEvent.start}
        onChange={(e) => handleChange("start", e.target.value)}
        style={{ marginBottom: "10px", padding: "5px", width: "100%" }}
      />
      <input
        type="datetime-local"
        value={updatedEvent.end}
        onChange={(e) => handleChange("end", e.target.value)}
        style={{ marginBottom: "10px", padding: "5px", width: "100%" }}
      />
      <textarea
        placeholder="Description"
        value={updatedEvent.description}
        onChange={(e) => handleChange("description", e.target.value)}
        style={{ marginBottom: "10px", padding: "5px", width: "100%" }}
      />
      <input
        type="color"
        value={updatedEvent.color}
        onChange={(e) => handleChange("color", e.target.value)}
        style={{ marginBottom: "10px", padding: "5px", width: "100%" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button
          onClick={handleSave}
          style={{
            padding: "5px 10px",
            backgroundColor: "#20669f",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Save
        </button>
        <button
          onClick={handleRemove}
          style={{
            padding: "5px 10px",
            backgroundColor: "#ff4d4d",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Remove
        </button>
        <button
          onClick={onClose}
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
    </div>
  );
}
