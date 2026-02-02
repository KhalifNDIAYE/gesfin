import { useState, useMemo } from "react";
import { Search, Book, Lightbulb, HelpCircle, BookOpen, X, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { helpArticles, searchHelp, getArticlesByCategory, HelpArticle } from "./helpContent";

interface HelpDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpDrawer({ open, onOpenChange }: HelpDrawerProps) {
  const { roles } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  
  const isAdmin = roles?.some(r => r.name === 'admin') ?? false;
  const userRole = isAdmin ? 'admin' : 'user';
  
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    return searchHelp(searchQuery, userRole);
  }, [searchQuery, userRole]);
  
  const moduleArticles = useMemo(() => getArticlesByCategory('module', userRole), [userRole]);
  const guideArticles = useMemo(() => getArticlesByCategory('guide', userRole), [userRole]);
  const faqArticles = useMemo(() => getArticlesByCategory('faq', userRole), [userRole]);
  const glossaryArticles = useMemo(() => getArticlesByCategory('glossary', userRole), [userRole]);
  
  const handleArticleClick = (article: HelpArticle) => {
    setSelectedArticle(article);
  };
  
  const handleBack = () => {
    setSelectedArticle(null);
  };
  
  const clearSearch = () => {
    setSearchQuery("");
  };

  const renderArticleList = (articles: HelpArticle[]) => (
    <div className="space-y-2">
      {articles.map((article) => (
        <button
          key={article.id}
          onClick={() => handleArticleClick(article)}
          className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{article.title}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          {article.module && (
            <Badge variant="secondary" className="mt-1 text-xs">
              {article.module}
            </Badge>
          )}
        </button>
      ))}
    </div>
  );

  const renderArticleContent = (article: HelpArticle) => (
    <div className="space-y-4">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronRight className="h-4 w-4 rotate-180" />
        Retour
      </button>
      
      <div>
        <h2 className="text-lg font-semibold">{article.title}</h2>
        {article.module && (
          <Badge variant="outline" className="mt-2">
            {article.module}
          </Badge>
        )}
      </div>
      
      <div className="prose prose-sm dark:prose-invert max-w-none">
        {article.content.split('\n').map((paragraph, idx) => {
          if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
            return (
              <h3 key={idx} className="font-semibold text-base mt-4 mb-2">
                {paragraph.replace(/\*\*/g, '')}
              </h3>
            );
          }
          if (paragraph.startsWith('- ')) {
            return (
              <li key={idx} className="ml-4 text-sm text-muted-foreground">
                {paragraph.substring(2).replace(/\*\*/g, '')}
              </li>
            );
          }
          if (paragraph.match(/^\d+\./)) {
            return (
              <li key={idx} className="ml-4 text-sm list-decimal">
                {paragraph.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '')}
              </li>
            );
          }
          if (paragraph.trim() === '') {
            return <br key={idx} />;
          }
          return (
            <p key={idx} className="text-sm text-muted-foreground">
              {paragraph.split('**').map((part, i) => 
                i % 2 === 1 ? <strong key={i} className="text-foreground">{part}</strong> : part
              )}
            </p>
          );
        })}
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Centre d'aide
          </SheetTitle>
          <SheetDescription>
            Documentation et guides d'utilisation de la plateforme
          </SheetDescription>
        </SheetHeader>
        
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans l'aide..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-4">
            {selectedArticle ? (
              renderArticleContent(selectedArticle)
            ) : searchQuery.length >= 2 ? (
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">
                  {searchResults.length} résultat(s) pour "{searchQuery}"
                </h3>
                {searchResults.length > 0 ? (
                  renderArticleList(searchResults)
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun résultat trouvé. Essayez d'autres mots-clés.
                  </p>
                )}
              </div>
            ) : (
              <Tabs defaultValue="modules" className="w-full">
                <TabsList className="w-full grid grid-cols-4 mb-4">
                  <TabsTrigger value="modules" className="text-xs">
                    <Book className="h-3 w-3 mr-1" />
                    Modules
                  </TabsTrigger>
                  <TabsTrigger value="guides" className="text-xs">
                    <Lightbulb className="h-3 w-3 mr-1" />
                    Guides
                  </TabsTrigger>
                  <TabsTrigger value="faq" className="text-xs">
                    <HelpCircle className="h-3 w-3 mr-1" />
                    FAQ
                  </TabsTrigger>
                  <TabsTrigger value="glossary" className="text-xs">
                    <BookOpen className="h-3 w-3 mr-1" />
                    Glossaire
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="modules" className="mt-0">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground mb-4">
                      Documentation détaillée de chaque module de la plateforme.
                    </p>
                    {renderArticleList(moduleArticles)}
                  </div>
                </TabsContent>
                
                <TabsContent value="guides" className="mt-0">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground mb-4">
                      Guides pas-à-pas pour les tâches courantes.
                    </p>
                    {renderArticleList(guideArticles)}
                  </div>
                </TabsContent>
                
                <TabsContent value="faq" className="mt-0">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground mb-4">
                      Réponses aux questions fréquemment posées.
                    </p>
                    <Accordion type="single" collapsible className="w-full">
                      {faqArticles.map((article) => (
                        <AccordionItem key={article.id} value={article.id}>
                          <AccordionTrigger className="text-sm text-left">
                            {article.title}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="text-sm text-muted-foreground space-y-2">
                              {article.content.split('\n').map((line, idx) => {
                                if (line.trim() === '') return <br key={idx} />;
                                if (line.startsWith('**') && line.endsWith('**')) {
                                  return (
                                    <p key={idx} className="font-medium text-foreground mt-2">
                                      {line.replace(/\*\*/g, '')}
                                    </p>
                                  );
                                }
                                if (line.startsWith('- ')) {
                                  return <li key={idx} className="ml-4">{line.substring(2)}</li>;
                                }
                                if (line.match(/^\d+\./)) {
                                  return <li key={idx} className="ml-4 list-decimal">{line.replace(/^\d+\.\s*/, '')}</li>;
                                }
                                return <p key={idx}>{line}</p>;
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </TabsContent>
                
                <TabsContent value="glossary" className="mt-0">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground mb-4">
                      Définitions des termes métier utilisés dans la plateforme.
                    </p>
                    {glossaryArticles.map((article) => (
                      <div key={article.id} className="p-4 rounded-lg border border-border">
                        <div className="text-sm text-muted-foreground space-y-2">
                          {article.content.split('\n\n').map((definition, idx) => {
                            const [term, ...desc] = definition.split(':');
                            return (
                              <p key={idx}>
                                <strong className="text-foreground">{term.replace(/\*\*/g, '')}:</strong>
                                {desc.join(':')}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            Besoin d'aide supplémentaire ? Contactez votre administrateur.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
