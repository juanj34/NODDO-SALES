"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";

interface MagneticButtonProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
}

export function MagneticButton({
    children,
    className = "",
    onClick,
    disabled = false,
    type = "button",
}: MagneticButtonProps) {
    const ref = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouse = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!ref.current || disabled) return;

        const { clientX, clientY } = e;
        const { height, width, left, top } = ref.current.getBoundingClientRect();

        // Calculate distance from center of the button
        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);

        // Magnetic pull strength (lower is stronger pull)
        const pullStrength = 0.2;

        setPosition({ x: middleX * pullStrength, y: middleY * pullStrength });
    };

    const reset = () => {
        setPosition({ x: 0, y: 0 });
    };

    const { x, y } = position;

    return (
        <motion.button
            ref={ref}
            type={type}
            onMouseMove={handleMouse}
            onMouseLeave={reset}
            onClick={onClick}
            disabled={disabled}
            animate={{ x, y }}
            transition={{
                type: "spring",
                stiffness: 150,
                damping: 15,
                mass: 0.1,
            }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            className={`relative z-10 ${className}`}
        >
            {children}
        </motion.button>
    );
}
