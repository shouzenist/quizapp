"use client";

import TeacherAuthGuard from "@/components/TeacherAuthGuard";

export default function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TeacherAuthGuard>{children}</TeacherAuthGuard>;
}
