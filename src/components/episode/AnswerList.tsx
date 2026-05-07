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
          <div
            key={i}
            className="rounded-xl bg-card/50 border border-accent/20 px-4 py-3 text-base sm:text-lg leading-relaxed"
          >
            <div className="markdown-body inline">
              <ReactMarkdown>{b}</ReactMarkdown>
            </div>
            <SpeakLine id={id} text={clean} />
          </div>
        );
      })}
    </div>
  );
};

export default AnswerList;
