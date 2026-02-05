import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, BookOpen } from "lucide-react";

async function getResources() {
  const supabase = await createClient();
  const { data: resources } = await supabase
    .from("resources")
    .select("*, resource_categories(id, name)")
    .order("created_at", { ascending: false });
  return resources || [];
}

async function getCategories() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("resource_categories")
    .select("*")
    .order("name");
  return categories || [];
}

export default async function AmbassadorResourcesPage() {
  const [resources, categories] = await Promise.all([getResources(), getCategories()]);

  // Group resources by category
  const resourcesByCategory = categories.map(cat => ({
    category: cat,
    resources: resources.filter(r =>
      (r.resource_categories as { id: string } | null)?.id === cat.id
    ),
  })).filter(group => group.resources.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Resources</h1>
        <p className="text-muted-foreground">Learning materials and guides</p>
      </div>

      {resourcesByCategory.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold">No resources available</h3>
            <p className="text-muted-foreground">
              Check back later for learning materials
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {resourcesByCategory.map(({ category, resources }) => (
            <div key={category.id}>
              <h2 className="text-xl font-semibold mb-4">{category.name}</h2>
              {category.description && (
                <p className="text-muted-foreground mb-4">{category.description}</p>
              )}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {resources.map((resource) => (
                  <Card key={resource.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{resource.title}</CardTitle>
                      {resource.description && (
                        <CardDescription>{resource.description}</CardDescription>
                      )}
                    </CardHeader>
                    {resource.url && (
                      <CardContent>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-primary hover:underline"
                        >
                          Open Resource <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
