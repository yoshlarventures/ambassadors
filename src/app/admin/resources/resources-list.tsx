"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Resource, ResourceCategory, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ExternalLink, Trash } from "lucide-react";

type ResourceWithRelations = Resource & {
  resource_categories: Pick<ResourceCategory, "name"> | null;
  creator: Pick<User, "full_name"> | null;
};

interface ResourcesListProps {
  resources: ResourceWithRelations[];
  categories: ResourceCategory[];
}

export function ResourcesList({ resources }: ResourcesListProps) {
  const router = useRouter();

  const handleDelete = async (resourceId: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    const supabase = createClient();
    const { error } = await supabase.from("resources").delete().eq("id", resourceId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Resource deleted");
      router.refresh();
    }
  };

  if (resources.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No resources found</p>;
  }

  return (
    <div className="space-y-4">
      {resources.map((resource) => (
        <div
          key={resource.id}
          className="flex items-start justify-between p-4 border rounded-lg gap-4"
        >
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{resource.title}</h3>
              <Badge variant="secondary">
                {resource.resource_categories?.name}
              </Badge>
            </div>
            {resource.description && (
              <p className="text-sm text-muted-foreground">{resource.description}</p>
            )}
            {resource.url && (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-primary hover:underline"
              >
                Open Link <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            )}
            <p className="text-xs text-muted-foreground">
              Added by {resource.creator?.full_name}
            </p>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDelete(resource.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
