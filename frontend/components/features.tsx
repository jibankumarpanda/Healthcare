"use client"

import { BarChart3, Brain, AlertCircle, Users } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI Predictions",
    description: "Forecast patient volumes and resource needs with advanced machine learning models.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Monitor bed occupancy, staff availability, and supply levels in real-time dashboards.",
  },
  {
    icon: AlertCircle,
    title: "Smart Alerts",
    description: "Get notified about pollution spikes, epidemics, and festivals affecting your hospital.",
  },
  {
    icon: Users,
    title: "Staff Optimization",
    description: "AI-suggested shift adjustments to ensure optimal staffing during peak periods.",
  },
]

export default function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-balance">Powerful Features for Modern Healthcare</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage your hospital efficiently and prepare for any scenario.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div
                key={idx}
                className="p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
              >
                <div className="mb-4 inline-flex p-3 rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
