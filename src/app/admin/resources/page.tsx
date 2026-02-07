import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResourcesList } from "./resources-list";
import { CategoriesList } from "./categories-list";
import { CreateResourceDialog } from "./create-resource-dialog";
import { CreateCategoryDialog } from "./create-category-dialog";

async function getResources() {
  const supabase = await createClient();
  const { data: resources } = await supabase
    .from("resources")
    .select("*, resource_categories(name), creator:users!resources_created_by_fkey(full_name)")
    .order("created_at", { ascending: false });
  return resources || [];
}

async function getCategories() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("resource_categories")
    .select("id, name, description, created_at")
    .order("name");
  return categories || [];
}

export default async function AdminResourcesPage() {
  const [resources, categories] = await Promise.all([getResources(), getCategories()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resources</h1>
          <p className="text-muted-foreground">Manage learning resources for ambassadors</p>
        </div>
        <div className="flex gap-2">
          <CreateCategoryDialog />
          <CreateResourceDialog categories={categories} />
        </div>
      </div>

      <Tabs defaultValue="resources" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resources">Resources ({resources.length})</TabsTrigger>
          <TabsTrigger value="categories">Categories ({categories.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>All Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <ResourcesList resources={resources} categories={categories} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoriesList categories={categories} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
