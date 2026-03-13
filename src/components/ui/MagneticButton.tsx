"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";

interface MagneticButtonProps {
    children: React.ReactNode;
    className?: string;
}

export function MagneticButton({
    children,
    className = "",
}: MagneticButtonProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;

        const { clientX, clientY } = e;
        const { height, width, left, top } = ref.current.getBoundingClientRect();

        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);

        const pullStrength = 0.2;
        setPosition({ x: middleX * pullStrength, y: middleY * pullStrength });
    };

    const reset = () => {
        setPosition({ x: 0, y: 0 });
    };

    const { x, y } = position;

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouse}
            onMouseLeave={reset}
            animate={{ x, y }}
            transition={{
                type: "spring",
                stiffness: 150,
                damping: 15,
                mass: 0.1,
            }}
            className={`relative z-10 inline-block ${className}`}
        >
            {children}
        </motion.div>
    );
}
