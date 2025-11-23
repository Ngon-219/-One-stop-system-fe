export const parseAndFormatMessage = (message: string): string => {
  if (!message || typeof message !== 'string') {
    return message || '';
  }
  
  console.log("Message to parse:", message);
  console.log("Message length:", message.length);
  console.log("Message char codes:", Array.from(message).map(c => c.charCodeAt(0)));
  
  const lockPattern = /MFA is locked until (\d+)\s*\(too many failed attempts\)!/;
  const match = message.match(lockPattern);
  
  console.log("Pattern match:", match);
  console.log("Pattern test result:", lockPattern.test(message));
  
  if (!match) {
    const simplePattern = /until (\d+)/;
    const simpleMatch = message.match(simplePattern);
    console.log("Simple pattern match:", simpleMatch);
    
    if (simpleMatch && simpleMatch[1]) {
      const timestamp = parseInt(simpleMatch[1], 10);
      console.log("Extracted timestamp:", timestamp);
    
      const date = new Date(timestamp * 1000);
      console.log("Converted date:", date);
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      const timezoneOffset = -date.getTimezoneOffset(); // Offset in minutes
      const timezoneHours = Math.floor(Math.abs(timezoneOffset) / 60);
      const timezoneMinutes = Math.abs(timezoneOffset) % 60;
      const timezoneSign = timezoneOffset >= 0 ? '+' : '-';
      const timezoneString = `UTC${timezoneSign}${String(timezoneHours).padStart(2, '0')}:${String(timezoneMinutes).padStart(2, '0')}`;
      
      const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${timezoneString}`;
      console.log("Formatted time:", formattedTime);
      
      const result = message.replace(
        `until ${timestamp}`,
        `until ${formattedTime}`
      );
      console.log("Final result:", result);
      
      return result;
    }
  } else if (match && match[1]) {
    const timestamp = parseInt(match[1], 10);
    console.log("Extracted timestamp:", timestamp);
    
    const date = new Date(timestamp * 1000);
    console.log("Converted date:", date);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    const timezoneOffset = -date.getTimezoneOffset();
    const timezoneHours = Math.floor(Math.abs(timezoneOffset) / 60);
    const timezoneMinutes = Math.abs(timezoneOffset) % 60;
    const timezoneSign = timezoneOffset >= 0 ? '+' : '-';
    const timezoneString = `UTC${timezoneSign}${String(timezoneHours).padStart(2, '0')}:${String(timezoneMinutes).padStart(2, '0')}`;
    
    const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${timezoneString}`;
    console.log("Formatted time:", formattedTime);
    
    const result = message.replace(
      `until ${timestamp}`,
      `until ${formattedTime}`
    );
    console.log("Final result:", result);
    
    return result;
  }
  
  console.log("No match found, returning original message");
  return message;
};

