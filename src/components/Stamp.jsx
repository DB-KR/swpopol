import React from "react";
import { motion } from "framer-motion";

export default function Stamp({ text }) {
  return (
    <motion.div
      className="stamp"
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <span>{text}</span>
    </motion.div>
  );
}
