"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Heart,
  MessageCircle,
  Activity,
  Sparkles,
  LineChart,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: MessageCircle,
    title: "AI Therapist Chat",
    description:
      "Talk with an empathetic AI companion designed to support mental wellbeing and guide reflective conversations.",
  },
  {
    icon: Brain,
    title: "Mood Tracking",
    description:
      "Track your emotional state daily and visualize patterns in your mood over time.",
  },
  {
    icon: Activity,
    title: "Wellness Activities",
    description:
      "Log activities like meditation, walking, journaling, and exercise to maintain healthy habits.",
  },
  {
    icon: LineChart,
    title: "Mood Analytics",
    description:
      "See weekly mood trends and gain insight into your emotional wellbeing.",
  },
  {
    icon: Heart,
    title: "Mental Health Companion",
    description:
      "Aura is designed to support mindfulness, self-reflection, and emotional balance.",
  },
  {
    icon: Sparkles,
    title: "Interactive Relief Tools",
    description:
      "Engage with calming experiences like breathing exercises and mindfulness games.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Container className="pt-28 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Aura Features</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Aura combines AI support, mood tracking, and wellness tools to help
            you better understand and care for your mental health.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full border-primary/10">
                <CardHeader className="flex flex-row items-center gap-3">
                  <feature.icon className="w-6 h-6 text-primary" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  {feature.description}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </Container>
    </div>
  );
}
