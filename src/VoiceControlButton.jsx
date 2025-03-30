import React, { useState, useRef, useEffect } from "react";
import { MdMic, MdMicOff } from "react-icons/md";
import VoiceCommandProcessor from "./utils/VoiceCommandProcessor";
import VoiceControl from "./utils/VoiceControl";

export default function VoiceControlButton({ onNavigate, onAddEvent, onOptimize, onUpdateCalendar, darkMode = false }) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [finalCommand, setFinalCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false); // State for loading indicator
  const inactivityTimer = useRef(null);
  const clearCommandTimer = useRef(null);

  const handleVoiceCommand = async (command) => {
    setInterimText(command);
    setIsProcessing(true); // Show loading indicator

    setTimeout(() => {
      try {
        const result = VoiceCommandProcessor.processCommand(
          command,
          (view, date) => onNavigate(view, date),
          (eventName, date, startTime, endTime) => onAddEvent(eventName, date, startTime, endTime),
          () => onOptimize(),
          () => onUpdateCalendar()
        );

        setFinalCommand(result);

        if (clearCommandTimer.current) {
          clearTimeout(clearCommandTimer.current);
        }
        clearCommandTimer.current = setTimeout(() => {
          setFinalCommand("");
          stopListening(); // Automatically stop listening when the command disappears
          setIsProcessing(false); // Hide loading indicator
          onUpdateCalendar(); // Fetch and create events from extraData.json
        }, 7000); // Keep the loading screen and command visible for 7 seconds
      } catch (error) {
        console.error("Erro ao processar comando de voz:", error);
        setIsProcessing(false); // Ensure loading indicator is hidden on error
      }
    }, 1000); // Add 1-second delay before processing
  };

  const handleNoSpeechDetected = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = setTimeout(() => stopListening(), 5000);
  };

  const toggleListening = () => {
    if (!VoiceControl.isSupported()) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    isListening ? stopListening() : startListening();
  };

  const startListening = () => {
    VoiceControl.startListening(handleVoiceCommand, handleNoSpeechDetected);
    setIsListening(true);
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
  };

  const stopListening = () => {
    VoiceControl.stopListening();
    setIsListening(false);
    setInterimText("");
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
    onUpdateCalendar(); // Fetch and create events from extraData.json
  };

  useEffect(() => {
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      if (clearCommandTimer.current) clearTimeout(clearCommandTimer.current);
    };
  }, []);

  return (
    <div style={{ padding: "10px", textAlign: "center" }}>
      <button
        onClick={toggleListening}
        style={{
          background: "none",
          border: "2px solid",
          borderColor: darkMode ? "#fff" : "#000",
          borderRadius: "50%",
          padding: "10px",
          cursor: "pointer",
        }}
      >
        {isListening ? (
          <MdMic size={30} color={darkMode ? "#fff" : "#000"} />
        ) : (
          <MdMicOff size={30} color={darkMode ? "#fff" : "#000"} />
        )}
      </button>
      {isListening && (
        <p style={{ color: darkMode ? "#fff" : "#000", marginTop: 10 }}>
          Ouvindo: {interimText || "..."}
        </p>
      )}
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
      {finalCommand && (
        <p style={{ color: darkMode ? "#fff" : "#000", marginTop: 10 }}>
          Comando: {finalCommand}
        </p>
      )}
    </div>
  );
}
