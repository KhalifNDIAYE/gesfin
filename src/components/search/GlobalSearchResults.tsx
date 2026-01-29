import { useNavigate } from 'react-router-dom';
import { 
  FolderKanban, 
  FileText, 
  Building2, 
  Briefcase, 
  Loader2,
  SearchX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SearchResults, SearchResult } from '@/hooks/useGlobalSearch';

interface GlobalSearchResultsProps {
  results: SearchResults;
  isLoading: boolean;
  query: string;
  onSelect: () => void;
}

const CATEGORY_CONFIG = {
  projects: {
    label: 'Projets',
    icon: FolderKanban,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  conventions: {
    label: 'Conventions',
    icon: FileText,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  contracts: {
    label: 'Marchés',
    icon: Briefcase,
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  bailleurs: {
    label: 'Bailleurs',
    icon: Building2,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
};

function SearchResultItem({ 
  result, 
  category, 
  onSelect 
}: { 
  result: SearchResult; 
  category: keyof typeof CATEGORY_CONFIG;
  onSelect: () => void;
}) {
  const navigate = useNavigate();
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  const handleClick = () => {
    navigate(result.link);
    onSelect();
  };

  return (
    <button
      onClick={handleClick}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent focus:bg-accent focus:outline-none"
    >
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', config.bgColor)}>
        <Icon className={cn('h-4 w-4', config.color)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{result.title}</span>
          {result.status && (
            <Badge variant="secondary" className="text-xs shrink-0">
              {result.status}
            </Badge>
          )}
        </div>
        <span className="truncate text-xs text-muted-foreground">{result.subtitle}</span>
      </div>
    </button>
  );
}

function CategorySection({ 
  category, 
  items, 
  onSelect 
}: { 
  category: keyof typeof CATEGORY_CONFIG;
  items: SearchResult[];
  onSelect: () => void;
}) {
  if (items.length === 0) return null;

  const config = CATEGORY_CONFIG[category];

  return (
    <div className="py-2">
      <div className="px-3 pb-2">
        <span className={cn('text-xs font-semibold uppercase tracking-wide', config.color)}>
          {config.label} ({items.length})
        </span>
      </div>
      <div className="space-y-0.5">
        {items.map((item) => (
          <SearchResultItem 
            key={item.id} 
            result={item} 
            category={category} 
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

export function GlobalSearchResults({ results, isLoading, query, onSelect }: GlobalSearchResultsProps) {
  const hasResults = 
    results.projects.length > 0 || 
    results.conventions.length > 0 || 
    results.contracts.length > 0 || 
    results.bailleurs.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Recherche en cours...</span>
      </div>
    );
  }

  if (query.length >= 2 && !hasResults) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <SearchX className="h-10 w-10 text-muted-foreground/50" />
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          Aucun résultat trouvé
        </p>
        <p className="text-xs text-muted-foreground">
          Essayez avec d'autres mots-clés
        </p>
      </div>
    );
  }

  if (query.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Saisissez au moins 2 caractères pour rechercher
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[400px]">
      <div className="divide-y divide-border">
        <CategorySection category="projects" items={results.projects} onSelect={onSelect} />
        <CategorySection category="conventions" items={results.conventions} onSelect={onSelect} />
        <CategorySection category="contracts" items={results.contracts} onSelect={onSelect} />
        <CategorySection category="bailleurs" items={results.bailleurs} onSelect={onSelect} />
      </div>
    </ScrollArea>
  );
}
