import { Logo } from "@/components/logo";
import type { ChatMessage } from "@/lib/types";

type ChatBubbleProps = {
  message: ChatMessage;
};

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} fade-up`}>
      <div
        className={[
          "max-w-[85%] rounded-[18px] px-4 py-3 text-[15px] leading-7 shadow-[0_12px_32px_rgba(0,0,0,0.18)] md:max-w-[70%]",
          isUser
            ? "rounded-br-[4px] border border-[#185FA5] bg-[#0D1929]"
            : "rounded-bl-[4px] border border-[#1e1e2e] bg-[#111118]",
        ].join(" ")}
      >
        {!isUser ? (
          <div className="mb-2">
            <Logo size="sm" />
          </div>
        ) : null}
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </div>
  );
}
