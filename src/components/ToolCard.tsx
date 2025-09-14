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
  id?: string; // Thêm prop id (tùy chọn)
}

export function ToolCard({ title, description, children, id }: ToolCardProps) {
  return (
    <Card id={id}> {/* Gán id cho component Card */}
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}