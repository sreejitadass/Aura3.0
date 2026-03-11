"use client";

import { Container } from "@/components/ui/container";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Container className="pt-28 pb-16 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-6">About Aura</h1>

          <p className="text-muted-foreground mb-6 leading-relaxed">
            Aura is an AI-powered mental wellness companion designed to support
            emotional wellbeing through reflective conversation, mood tracking,
            and mindful activities.
          </p>

          <p className="text-muted-foreground mb-6 leading-relaxed">
            Sometimes people want a space to express how they feel without the
            pressure of immediately opening up to another person. Aura aims to
            provide that safe starting point — a place where users can talk
            about their thoughts, receive supportive responses, and reflect on
            their emotions at their own pace.
          </p>

          <p className="text-muted-foreground mb-6 leading-relaxed">
            For many individuals, beginning with a private and judgment-free
            conversation can make it easier to understand their feelings before
            seeking professional guidance. Aura is not intended to replace
            therapists or medical professionals, but rather to act as a
            supportive companion that encourages mindfulness, emotional
            awareness, and healthier mental habits.
          </p>

          <p className="text-muted-foreground mb-6 leading-relaxed">
            By combining conversational AI with mood analytics and wellness
            tools, Aura helps users explore patterns in their emotional health
            and build routines that support their mental wellbeing.
          </p>

          <div className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
            <p>
              Developed as a final year project exploring the intersection of
              artificial intelligence, mental health, and human-centered design.
            </p>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}
