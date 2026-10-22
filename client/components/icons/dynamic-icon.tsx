import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface DynamicIconProps extends LucideProps {
  name: string;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const IconMap = LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>;
  const IconComponent = IconMap[name] || LucideIcons.HelpCircle;
  return <IconComponent {...props} />;
}
