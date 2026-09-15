import { parseMessageBlocks } from "./model";

function InlineText({ text }: { text: string }) {
  // Render supported formatting as React text nodes; links and HTML remain plain text.
  return text.split(/(\*\*[^*\n]+\*\*|`[^`\n]+`)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : part.startsWith("`") && part.endsWith("`") ? (
      <code key={index} className="rounded bg-black/5 px-1 text-[0.95em]">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    ),
  );
}

export function ChatMessageContent({ text }: { text: string }) {
  return (
    <div className="space-y-2 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
      {parseMessageBlocks(text).map((block, index) => {
        if (block.type === "heading")
          return (
            <p key={index} className="font-bold">
              <InlineText text={block.text} />
            </p>
          );
        if (block.type === "list") {
          const List = block.ordered ? "ol" : "ul";
          return (
            <List
              key={index}
              className={`space-y-1 pl-5 ${block.ordered ? "list-decimal" : "list-disc"}`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <InlineText text={item} />
                </li>
              ))}
            </List>
          );
        }
        return (
          <p key={index}>
            <InlineText text={block.text} />
          </p>
        );
      })}
    </div>
  );
}
