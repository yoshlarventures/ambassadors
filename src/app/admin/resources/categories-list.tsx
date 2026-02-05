"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ResourceCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash } from "lucide-react";

interface CategoriesListProps {
  categories: ResourceCategory[];
}

export function CategoriesList({ categories }: CategoriesListProps) {
  const router = useRouter();

  const handleDelete = async (categoryId: string) => {
    if (!confirm("Are you sure? This will delete all resources in this category.")) return;

    const supabase = createClient();
    const { error } = await supabase.from("resource_categories").delete().eq("id", categoryId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Category deleted");
      router.refresh();
    }
  };

  if (categories.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No categories found</p>;
  }

  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <div
          key={category.id}
          className="flex items-center justify-between p-3 border rounded-lg"
        >
          <div>
            <h3 className="font-medium">{category.name}</h3>
            {category.description && (
              <p className="text-sm text-muted-foreground">{category.description}</p>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(category.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
