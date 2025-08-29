import React from 'react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import { Globe, Check } from 'lucide-react';
import { useI18n } from '../hooks/useI18n';
import { cn } from '../lib/utils';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'popover' | 'compact';
  className?: string;
}

const flagEmojis: Record<string, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  ar: '🇸🇦',
  zh: '🇨🇳',
  ja: '🇯🇵'
};

export default function LanguageSelector({ 
  variant = 'dropdown', 
  className 
}: LanguageSelectorProps) {
  const { language, setLanguage, languages, t } = useI18n();

  const currentLanguage = languages[language];

  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn("h-8 w-8 p-0", className)}
        title={t('common.changeLanguage')}
      >
        <span className="text-sm">{flagEmojis[language] || '🌐'}</span>
      </Button>
    );
  }

  if (variant === 'popover') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("gap-2", className)}
          >
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">
              {flagEmojis[language]} {currentLanguage?.nativeName}
            </span>
            <span className="sm:hidden">
              {flagEmojis[language]}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2">
          <div className="space-y-1">
            <h4 className="font-medium text-sm mb-2 px-2">
              {t('common.selectLanguage')}
            </h4>
            {Object.entries(languages).map(([code, config]) => (
              <Button
                key={code}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-auto p-2",
                  language === code && "bg-accent"
                )}
                onClick={() => setLanguage(code)}
              >
                <span className="text-lg">{flagEmojis[code] || '🌐'}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium">{config.nativeName}</div>
                  <div className="text-xs text-muted-foreground">{config.name}</div>
                </div>
                {language === code && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Default dropdown variant
  return (
    <Select value={language} onValueChange={setLanguage}>
      <SelectTrigger className={cn("w-auto gap-2", className)}>
        <Globe className="w-4 h-4" />
        <SelectValue>
          <div className="flex items-center gap-2">
            <span>{flagEmojis[language]}</span>
            <span className="hidden sm:inline">{currentLanguage?.nativeName}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(languages).map(([code, config]) => (
          <SelectItem key={code} value={code}>
            <div className="flex items-center gap-3">
              <span className="text-lg">{flagEmojis[code] || '🌐'}</span>
              <div>
                <div className="font-medium">{config.nativeName}</div>
                <div className="text-xs text-muted-foreground">{config.name}</div>
              </div>
              {config.rtl && (
                <Badge variant="outline" className="text-xs">
                  RTL
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
