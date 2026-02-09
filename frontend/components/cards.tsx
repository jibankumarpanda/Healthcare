"use client"

import React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect"

const cardData = [
  {
    title: "Dashboard",
    description: "Real-time hospital analytics",
    color: "bg-emerald-900",
    colors: [[16, 185, 129]],
  },
  {
    title: "Predictions",
    description: "AI-powered forecasting",
    color: "bg-blue-900",
    colors: [[59, 130, 246]],
  },
  {
    title: "Resources",
    description: "Staff & supply management",
    color: "bg-cyan-900",
    colors: [[34, 211, 238]],
  },
]

const Card = ({
  title,
  description,
  color,
  colors,
}: {
  title: string
  description: string
  color: string
  colors: number[][]
}) => {
  const [hovered, setHovered] = React.useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="border border-border group/canvas-card flex flex-col items-center justify-center dark:border-white/[0.2] max-w-sm w-full mx-auto p-4 relative h-[30rem] rounded-xl overflow-hidden"
    >
      <AnimatePresence>
        {hovered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full w-full absolute inset-0">
            <CanvasRevealEffect animationSpeed={3} containerClassName={color} colors={colors} dotSize={2} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-20 text-center">
        <div className="text-center group-hover/canvas-card:-translate-y-4 group-hover/canvas-card:opacity-0 transition duration-200 w-full mx-auto flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-primary" />
          </div>
        </div>
        <h2 className="dark:text-white text-2xl opacity-0 group-hover/canvas-card:opacity-100 relative z-10 text-foreground mt-4 font-bold group-hover/canvas-card:text-white group-hover/canvas-card:-translate-y-2 transition duration-200">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground mt-2 opacity-0 group-hover/canvas-card:opacity-100 transition duration-200">
          {description}
        </p>
      </div>
    </div>
  )
}

export default function Cards() {
  return (
    <section id="cards" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-balance">Explore Our Solutions</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hover over the cards to see the interactive canvas reveal effect
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 justify-items-center">
          {cardData.map((card, idx) => (
            <Card key={idx} title={card.title} description={card.description} color={card.color} colors={card.colors} />
          ))}
        </div>
      </div>
    </section>
  )
}
