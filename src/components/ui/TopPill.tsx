import { ChevronUp, ChevronDown } from "lucide-react";
import icon from "../icon.png";

interface TopPillProps {
    expanded: boolean;
    onToggle: () => void;
    onQuit: () => void;
    backgroundOpacity?: number;
}

export default function TopPill({
    expanded,
    onToggle,
    onQuit,
    backgroundOpacity = 0.8,
}: TopPillProps) {
    return (
        <div className="flex justify-center mt-2 select-none z-50">
            <div
                className="
          draggable-area
          flex items-center gap-2
          rounded-full
          backdrop-blur-md
          border border-white/10
          shadow-lg shadow-black/20
          pl-1.5 pr-1.5 py-1.5
          transition-all duration-300 ease-sculpted
          hover:brightness-110 hover:border-white/15 hover:shadow-xl
        "
                style={{ backgroundColor: `rgba(30, 30, 30, ${backgroundOpacity})` }}
            >
                {/* LOGO BUTTON */}
                <button
                    className="
            w-8 h-8
            rounded-full
            bg-white/5
            flex items-center justify-center
            relative overflow-hidden
            interaction-base interaction-press
            hover:bg-white/5
          "
                >
                    <img
                        src={icon}
                        alt="Natively"
                        className="w-[24px] h-[24px] object-contain opacity-90 scale-105"
                        draggable="false"
                        onDragStart={(e) => e.preventDefault()}
                    />
                </button>

                {/* CENTER SEGMENT */}
                <button
                    onClick={onToggle}
                    className="
            flex items-center gap-2
            group
            px-4 py-1.5
            rounded-full
            bg-white/5
            text-[12px]
            font-medium
            text-slate-200
            border border-white/0
            interaction-base interaction-hover interaction-press
            hover:bg-white/10 hover:border-white/5 hover:text-white
          "
                >
                    <span className="opacity-70 group-hover:opacity-100 transition-opacity duration-200">
                        {expanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                        )}
                    </span>
                    <span className="tracking-wide opacity-80 group-hover:opacity-100">{expanded ? "Hide" : "Show"}</span>
                </button>

                {/* STOP / QUIT BUTTON */}
                <button
                    onClick={onQuit}
                    className="
            w-8 h-8
            rounded-full
            bg-white/5
            flex items-center justify-center
            text-white
            interaction-base interaction-press
            hover:bg-red-500/10 hover:text-red-400
          "
                >
                    <div className="w-3.5 h-3.5 rounded-[3px] bg-current opacity-80" />
                </button>
            </div>
        </div>
    );
}
