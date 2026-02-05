import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RegionActions } from "./region-actions";
import { CreateRegionDialog } from "./create-region-dialog";

async function getRegions() {
  const supabase = await createClient();
  const { data: regions } = await supabase
    .from("regions")
    .select("*")
    .order("name");
  return regions || [];
}

export default async function RegionsPage() {
  const regions = await getRegions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Regions</h1>
          <p className="text-muted-foreground">Manage regions of Uzbekistan</p>
        </div>
        <CreateRegionDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Regions ({regions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name (English)</TableHead>
                <TableHead>Name (Uzbek)</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.map((region) => (
                <TableRow key={region.id}>
                  <TableCell className="font-medium">{region.name}</TableCell>
                  <TableCell>{region.name_uz}</TableCell>
                  <TableCell>
                    {new Date(region.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <RegionActions region={region} />
                  </TableCell>
                </TableRow>
              ))}
              {regions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No regions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
