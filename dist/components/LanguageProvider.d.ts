import React, { ReactNode } from 'react';
interface TranslationContextProps {
    language: string;
    setLanguage: (lang: string) => void;
    t: (key: string) => string;
}
interface LanguageProviderProps {
    children: ReactNode;
    defaultLanguage?: string;
    additionalTranslationKey?: string;
}
export declare const LanguageProvider: React.FC<LanguageProviderProps>;
export declare const useTranslationContext: () => TranslationContextProps;
export {};
