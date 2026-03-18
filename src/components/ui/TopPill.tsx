import { ChevronUp, ChevronDown } from "lucide-react";
import icon from "../icon.png";

interface TopPillProps {
    expanded: boolean;
    onToggle: () => void;
    onQuit: () => void;
    backgroundOpacity?: number;
    textScale?: number;
}

export default function TopPill({
    expanded,
    onToggle,
    onQuit,
    backgroundOpacity = 0.8,
    textScale = 1,
}: TopPillProps) {
    const borderAlpha = Math.max(0.72, Math.min(0.98, backgroundOpacity * 0.96));
    const borderSurface = `rgba(0, 0, 0, ${borderAlpha})`;

    return (
        <div className="flex justify-center mt-1 select-none z-50">
            <div
                className="
          draggable-area
          flex items-center gap-1
          rounded-full
          backdrop-blur-xl
          border
          px-1 py-0.5
          transition-all duration-200 ease-sculpted
        "
                style={{ backgroundColor: 'transparent', borderColor: borderSurface }}
            >
                <button
                    className="
            w-7 h-7
            rounded
            flex items-center justify-center
            relative overflow-hidden
            interaction-base interaction-press
            hover:brightness-110
          "
                >
                    <img
                        src={icon}
                        alt="Natively"
                        className="w-[19px] h-[19px] object-contain opacity-90 brightness-0"
                        draggable="false"
                        onDragStart={(e) => e.preventDefault()}
                    />
                </button>

                <button
                    onClick={onToggle}
                    className="
            flex items-center gap-1
            group
            px-1.5 py-1
            rounded
            text-text-primary
            font-bold
            interaction-base interaction-hover interaction-press
            hover:brightness-110 hover:text-text-primary
          "
                    style={{ fontSize: `${Math.max(11, 11 * textScale)}px` }}
                >
                    <span className="opacity-70 group-hover:opacity-100 transition-opacity duration-200">
                        {expanded ? (
                            <ChevronUp className="w-3 h-3" />
                        ) : (
                            <ChevronDown className="w-3 h-3" />
                        )}
                    </span>
                    <span className="opacity-80 group-hover:opacity-100">{expanded ? "Hide" : "Show"}</span>
                </button>

                <button
                    onClick={onQuit}
                    className="
            w-7 h-7
            rounded
            flex items-center justify-center
            text-text-primary
            interaction-base interaction-press
            hover:brightness-110 hover:text-red-500
          "
                >
                    <div className="w-3 h-3 rounded-[2px] bg-current opacity-80" />
                </button>
            </div>
        </div>
    );
}
