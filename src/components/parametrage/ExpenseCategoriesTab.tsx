import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Trash2, FolderTree, Link2 } from "lucide-react";
import { useExpenseCategories, useExpenseCategoryMutations, ExpenseCategory } from "@/hooks/useExpenseCategories";
import { ExpenseCategoryDialog } from "./dialogs/ExpenseCategoryDialog";
import { useConventions } from "@/hooks/useConventionsBailleurs";

export const ExpenseCategoriesTab = () => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useExpenseCategories();
  const { data: conventions = [] } = useConventions();
  const { createCategory, updateCategory, deleteCategory, isCreating, isUpdating } = useExpenseCategoryMutations();

  const filteredCategories = categories.filter(
    (cat) =>
      cat.code.toLowerCase().includes(search.toLowerCase()) ||
      cat.name.toLowerCase().includes(search.toLowerCase())
  );

  // Build hierarchy for display
  const rootCategories = filteredCategories.filter(c => !c.parent_id);
  const getChildren = (parentId: string) => filteredCategories.filter(c => c.parent_id === parentId);

  const handleEdit = (category: ExpenseCategory) => {
    setSelectedCategory(category);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedCategory(null);
    setDialogOpen(true);
  };

  const handleSubmit = (data: any) => {
    if (selectedCategory) {
      updateCategory({ id: selectedCategory.id, ...data });
    } else {
      createCategory(data);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteCategory(deleteId);
      setDeleteId(null);
    }
  };

  // Count conventions using each category
  const getCategoryUsageCount = (categoryId: string) => {
    // This would need convention_categories data - simplified for now
    return 0;
  };

  const renderCategoryRow = (category: ExpenseCategory, level: number = 0) => {
    const children = getChildren(category.id);
    
    return (
      <>
        <TableRow key={category.id}>
          <TableCell>
            <div style={{ paddingLeft: `${level * 20}px` }} className="flex items-center gap-2">
              {children.length > 0 && <FolderTree className="h-4 w-4 text-muted-foreground" />}
              <span className="font-mono">{category.code}</span>
            </div>
          </TableCell>
          <TableCell>{category.name}</TableCell>
          <TableCell className="text-muted-foreground text-sm">
            {category.description || "-"}
          </TableCell>
          <TableCell>
            <Badge variant={category.is_active ? "default" : "secondary"}>
              {category.is_active ? "Active" : "Inactive"}
            </Badge>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Link2 className="h-3 w-3" />
              <span className="text-sm">{getCategoryUsageCount(category.id)} conventions</span>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteId(category.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {children.map(child => renderCategoryRow(child, level + 1))}
      </>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Catégories de dépenses</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Gérez les catégories utilisées dans les conventions de financement
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle catégorie
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par code ou nom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredCategories.length} catégorie(s)
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune catégorie trouvée
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Utilisation</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rootCategories.map(cat => renderCategoryRow(cat))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <ExpenseCategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={selectedCategory}
        categories={categories}
        onSubmit={handleSubmit}
        isLoading={isCreating || isUpdating}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
