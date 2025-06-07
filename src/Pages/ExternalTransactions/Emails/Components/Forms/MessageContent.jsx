import { Textarea } from "@/components/ui/textarea";

/* eslint-disable react/prop-types */
const MessageContent = ({ message, setMessage, error, ...props }) => {
  // const characterCount = message ? message.length : 0;
  const maxLength = 160; // Standard SMS character limit
  // const isOverLimit = characterCount > maxLength;

  const handleChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    // This ensures the react-hook-form onChange is also called
    if (props.onChange) {
      props.onChange(e);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Message Content</label>
      <Textarea
        className="w-full p-2 border rounded-md min-h-[150px]"
        value={message}
        onChange={handleChange}
        maxLength={maxLength * 3} // Allowing some extra space for user to see when they're typing
        {...props}
      />
      {/* <div className={`text-xs text-right ${isOverLimit ? 'text-red-600' : 'text-muted-foreground'}`}>
        {characterCount}/{maxLength} characters
        {isOverLimit && (
          <span className="ml-2">(Message will be split into multiple SMS)</span>
        )}
      </div> */}
      {error && <p className="text-red-600 text-sm">{error.message}</p>}
    </div>
  );
};

export default MessageContent;