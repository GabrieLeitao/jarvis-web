export default class VoiceCommandProcessor {
  static processCommand(command, navigateCallback, addEventCallback, optimizeCalendarCallback, updateCalendarCallback) {
    console.log("Processing command:", command); // Log the command being processed
    updateCalendarCallback(); // Always call the update calendar callback
    return "Atualizando o horário."; // Always return this message
  }
}
