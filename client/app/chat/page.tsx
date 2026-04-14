"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";

const Chat = () => {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hello! Ask me anything about your PDF." },
  ]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages = [
      ...messages,
      { role: "user", text: input },
      { role: "bot", text: "Thinking..." },
    ];

    setMessages(newMessages);
    setInput("");

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BASE_URL}/chat`,
      {
        question: input,
      },
    );

    if (response.data.success) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "bot", text: response.data.data },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b text-lg font-semibold">Chat</div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                msg.role === "user" ?
                  "bg-blue-500 text-white"
                : "bg-gray-200 text-black"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t flex gap-2">
        <Input
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button onClick={handleSend}>Send</Button>
      </div>
    </div>
  );
};

export default Chat;
