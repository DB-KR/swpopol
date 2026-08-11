import React from "react";
import { motion } from "framer-motion";

export default function Stamp({ text }) {
  return (
    <motion.div
      className="stamp"
      aria-hidden="true"
      initial={{ opacity: 0, scale: 1.6, rotate: -9 }}
      animate={{ opacity: 0.9, scale: 1, rotate: -9 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <span>{text}</span>
    </motion.div>
  );
}
