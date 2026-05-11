import ReactMarkdown from "react-markdown";
import SpeakLine from "./SpeakLine";
import { stripMarkdown } from "@/hooks/useTTS";

interface Props {
  idPrefix: string;
  text: string;
}

const AnswerList = ({ idPrefix, text }: Props) => {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-3 text-white/95">
      {blocks.map((b, i) => {
        const id = `${idPrefix}-${i}`;
        const clean = stripMarkdown(b);
        return (
          <SpeakLine
            key={i}
            id={id}
            text={clean}
            className="rounded-xl bg-card/50 border border-accent/20 px-4 py-3 text-base sm:text-lg leading-relaxed hover:border-accent/50 hover:bg-card/70"
          >
            <div className="markdown-body">
              <ReactMarkdown>{b}</ReactMarkdown>
            </div>
          </SpeakLine>
        );
      })}
    </div>
  );
};

export default AnswerList;
