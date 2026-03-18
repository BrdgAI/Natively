import React, { useEffect, useRef } from 'react';

interface RollingTranscriptProps {
    text: string;
    isActive?: boolean;
    textScale?: number;
}

/**
 * RollingTranscript - A single-line horizontally scrolling transcript bar
 * 
 * Displays real-time speech transcription as a smooth left-scrolling text track.
 * Features:
 * - Fixed height, single line only
 * - Text flows from right to left as new words arrive
 * - Edge fade gradients for visual polish
 */
const RollingTranscript: React.FC<RollingTranscriptProps> = ({ text, isActive = true, textScale = 1 }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to the end when text updates
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollLeft = containerRef.current.scrollWidth;
        }
    }, [text]);

    if (!text) return null;

    return (
        <div className="relative w-[96%] mx-auto pt-1">
            {/* Scrolling Container */}
            <div
                ref={containerRef}
                className="overflow-hidden whitespace-nowrap text-right scroll-smooth"
                style={{
                    maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
                }}
            >
                <span
                    className="inline-flex items-center font-bold text-black leading-5 transition-all duration-300"
                    style={{ fontSize: `${Math.max(12, 12 * textScale)}px` }}
                >
                    {text}
                    {isActive && (
                        <span className="inline-flex items-center ml-2">
                            <span className="w-1 h-1 bg-green-500/60 rounded-full animate-pulse" />
                        </span>
                    )}
                </span>
            </div>
        </div>
    );
};

export default RollingTranscript;
