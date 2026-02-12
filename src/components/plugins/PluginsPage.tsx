import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Puzzle, Download, Settings, Star, Globe, Zap, Package } from 'lucide-react';
import { toast } from 'sonner';
import { usePlugins, PluginInfo } from '@/hooks/usePlugins';
import { useLanguage } from '@/contexts/LanguageContext';

interface PluginsPageProps {
  setActivePage?: (page: string) => void;
}

export function PluginsPage({ setActivePage }: PluginsPageProps) {
  const { t, direction } = useLanguage();
  const { plugins, installedPlugins, activePlugins, availablePlugins, installPlugin, uninstallPlugin, togglePlugin } = usePlugins();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const CATEGORY_LABELS: Record<string, string> = {
    accounting: t.plugins_category_accounting,
    hr: t.plugins_category_hr,
    inventory: t.plugins_category_inventory,
    reports: t.plugins_category_reports,
    integrations: t.plugins_category_integrations,
    utilities: t.plugins_category_utilities,
  };

  const filteredMarketplace = selectedCategory === 'all'
    ? availablePlugins
    : availablePlugins.filter(p => p.category === selectedCategory);

  const handleInstall = (pluginId: string) => {
    installPlugin(pluginId);
    toast.success(t.plugins_toast_installed);
  };

  const handleUninstall = (pluginId: string) => {
    uninstallPlugin(pluginId);
    toast.success(t.plugins_toast_uninstalled);
  };

  const handleToggle = (pluginId: string, enabled: boolean) => {
    togglePlugin(pluginId, enabled);
    toast.success(enabled ? t.plugins_toast_enabled : t.plugins_toast_disabled);
  };

  const handleGoToPlugin = (plugin: PluginInfo) => {
    if (setActivePage) {
      setActivePage(plugin.pageId);
    }
  };

  const renderPluginCard = (plugin: PluginInfo) => (
    <Card key={plugin.id} className="hover:shadow-lg transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{plugin.icon}</div>
            <div>
              <CardTitle className="text-base">{plugin.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{plugin.name_en}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">v{plugin.version}</Badge>
            {plugin.installed && (
              <Switch
                checked={plugin.enabled}
                onCheckedChange={(checked) => handleToggle(plugin.id, checked)}
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{plugin.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              {plugin.rating}
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              {plugin.downloads}
            </span>
            <Badge variant="secondary" className="text-xs">
              {CATEGORY_LABELS[plugin.category]}
            </Badge>
          </div>
          <div className="flex gap-2">
            {plugin.installed && plugin.enabled && (
              <Button size="sm" variant="outline" onClick={() => handleGoToPlugin(plugin)}>
                {t.plugins_open}
              </Button>
            )}
            {!plugin.installed ? (
              <Button size="sm" onClick={() => handleInstall(plugin.id)}>
                <Download className="w-3 h-3 me-1" /> {t.plugins_install}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleUninstall(plugin.id)}
              >
                {t.plugins_uninstall}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in" dir={direction}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
          <Puzzle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.plugins_title}</h1>
          <p className="text-muted-foreground">{t.plugins_subtitle}</p>
        </div>
        <div className="ms-auto flex gap-2">
          <Badge variant="outline" className="gap-1">
            <Package className="w-3 h-3" />
            {installedPlugins.length} {t.plugins_installed_count}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Zap className="w-3 h-3" />
            {activePlugins.length} {t.plugins_active_count}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="installed" className="w-full">
        <TabsList>
          <TabsTrigger value="installed" className="gap-2">
            <Settings className="w-4 h-4" /> {t.plugins_tab_installed} ({installedPlugins.length})
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="gap-2">
            <Globe className="w-4 h-4" /> {t.plugins_tab_marketplace} ({availablePlugins.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="installed" className="mt-6">
          {installedPlugins.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Puzzle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{t.plugins_no_installed}</p>
                <p className="text-sm text-muted-foreground mt-1">{t.plugins_browse_marketplace}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {installedPlugins.map(renderPluginCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="marketplace" className="mt-6">
          <div className="flex gap-2 mb-4 flex-wrap">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              {t.plugins_filter_all}
            </Button>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(key)}
              >
                {label}
              </Button>
            ))}
          </div>
          {filteredMarketplace.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Puzzle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{t.plugins_no_results}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMarketplace.map(renderPluginCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
