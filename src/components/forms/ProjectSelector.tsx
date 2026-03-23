import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { useREProjects } from '@/hooks/useRealEstate';
import { useIndustryFeatures } from '@/hooks/useIndustryFeatures';

interface ProjectSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  className?: string;
  hideLabel?: boolean;
}

export function ProjectSelector({ 
  value, 
  onChange, 
  label = 'المشروع العقاري',
  className,
  hideLabel = false,
}: ProjectSelectorProps) {
  const features = useIndustryFeatures();
  const { data: projects = [] } = useREProjects();
  
  // Only show for companies with real estate projects
  if (!features.hasRealEstateProjects) return null;

  return (
    <div className={hideLabel ? '' : 'space-y-2'}>
      {!hideLabel && <Label className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{label}</Label>}
      <Select value={value || 'none'} onValueChange={v => onChange(v === 'none' ? null : v)}>
        <SelectTrigger className={className || 'h-10'}>
          <SelectValue placeholder="اختر المشروع" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">بدون مشروع</SelectItem>
          {projects.map((project: any) => (
            <SelectItem key={project.id} value={project.id}>
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <span>{project.code ? `${project.code} - ` : ''}{project.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
