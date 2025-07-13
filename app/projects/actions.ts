"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { CalculatorFormValues } from "@/components/calculator/types";

export async function getProjects() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return [];

  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.user.id)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function saveProject(
  name: string,
  formData: CalculatorFormValues,
  results: any
) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Unauthorized");

  await supabase.from("projects").insert({
    user_id: user.user.id,
    name,
    form_data: formData,
    results,
  });
  revalidatePath("/projects");
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Unauthorized");

  await supabase.from("projects").delete().match({ id, user_id: user.user.id });
  revalidatePath("/projects");
}

export async function renameProject(id: string, newName: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Unauthorized");

  await supabase
    .from("projects")
    .update({ name: newName })
    .match({ id, user_id: user.user.id });
  revalidatePath("/projects");
}
