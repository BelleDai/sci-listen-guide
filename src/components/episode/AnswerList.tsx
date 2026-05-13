import ReactMarkdown from "react-markdown";
import SpeakLine from "./SpeakLine";
import { stripMarkdown } from "@/hooks/useTTS";

interface Props {
  idPrefix: string;
  text: string;
}

const AnswerList = ({ idPrefix, text }: Props) => {
  return (
    <div className="text-white/95 markdown-body">
      <ReactMarkdown
        components={{
          li: ({ node, children, ...props }) => {
            let textContent = "";
            const extractText = (nodes: any) => {
              if (typeof nodes === "string") textContent += nodes;
              else if (Array.isArray(nodes)) nodes.forEach(extractText);
              else if (nodes && nodes.props && nodes.props.children) extractText(nodes.props.children);
            };
            extractText(children);

            const clean = stripMarkdown(textContent).trim();
            if (!clean) return <li {...props}>{children}</li>;

            let hash = 0;
            for (let i = 0; i < clean.length; i++) {
              hash = (hash << 5) - hash + clean.charCodeAt(i);
              hash |= 0;
            }
            const id = `${idPrefix}-li-${Math.abs(hash)}`;

            return (
              <li {...props} className="my-2">
                <SpeakLine
                  id={id}
                  text={clean}
                  className="rounded-xl bg-card/50 border border-accent/20 px-4 py-3 text-base sm:text-lg leading-relaxed hover:border-accent/50 hover:bg-card/70"
                >
                  {children}
                </SpeakLine>
              </li>
            );
          }
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};

export default AnswerList;
