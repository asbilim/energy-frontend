"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Download, Trash2, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { CalculatorFormValues } from "@/components/calculator/types";

interface Project {
  id: string;
  name: string;
  form_data: CalculatorFormValues;
  results: any;
  created_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const router = useRouter();

  const refresh = async () => {
    const res = await fetch("/projects/api").then((r) => r.json());
    setProjects(res);
  };

  useEffect(() => {
    refresh();
  }, []);

  /* --- handlers --- */
  const handleImport = async (file: File) => {
    try {
      const imported = JSON.parse(await file.text()) as Omit<
        Project,
        "id" | "created_at"
      >;
      await fetch("/projects/api", {
        method: "POST",
        body: JSON.stringify({ ...imported }),
      });
      toast.success("Projet importé !");
      refresh();
    } catch {
      toast.error("Fichier invalide.");
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/projects/api?id=${id}`, { method: "DELETE" });
    refresh();
    toast.success("Supprimé.");
  };

  const handleRename = async (id: string, name: string) => {
    await fetch(`/projects/api`, {
      method: "PATCH",
      body: JSON.stringify({ id, name }),
    });
    refresh();
  };

  const handleLoad = (p: Project) => {
    localStorage.setItem("solarcal_draft", JSON.stringify(p.form_data));
    router.push("/calculator");
  };

  const handleExport = (p: Project) => {
    const blob = new Blob([JSON.stringify(p, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${p.name.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container max-w-4xl py-10 space-y-6">
      <h1 className="text-3xl font-bold">Mes projets</h1>

      <Card>
        <CardHeader>
          <CardTitle>Importer un projet</CardTitle>
          <CardDescription>Fichier JSON précédemment exporté.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="file"
            accept=".json"
            onChange={(e) =>
              e.target.files?.[0] && handleImport(e.target.files[0])
            }
          />
        </CardContent>
      </Card>

      {projects.length === 0 && (
        <p className="text-muted-foreground">Aucun projet.</p>
      )}

      <div className="space-y-4">
        {projects.map((p) => (
          <Card key={p.id}>
            <CardHeader className="flex flex-row justify-between items-start">
              <div>
                <CardTitle className="text-lg">{p.name}</CardTitle>
                <CardDescription>
                  {new Date(p.created_at).toLocaleDateString("fr")}
                </CardDescription>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleLoad(p)}>
                    <Edit3 className="w-4 h-4 mr-2" /> Charger
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport(p)}>
                    <Download className="w-4 h-4 mr-2" /> Exporter
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const n = prompt("Nouveau nom", p.name);
                      if (n) handleRename(p.id, n);
                    }}>
                    Renommer
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDelete(p.id)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
