import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React from "react";

interface ToolCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  id?: string;
}

export function ToolCard({ title, description, children, id }: ToolCardProps) {
  return (
    <Card id={id} className="ink-accent border-primary/10 hover:border-primary/25 transition-all duration-300 hover:gold-glow">
      <CardHeader>
        <CardTitle className="font-serif text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}