"use client";

import React, {createContext, useContext, useState, useEffect, ReactNode, useCallback} from 'react';
import {useRouter, usePathname} from 'next/navigation';
import Cookies from 'js-cookie';
import {motion} from 'framer-motion';

interface Language {
    [key: string]: string;
}

interface TranslationContextProps {
    language: string;
    setLanguage: (lang: string) => void;
    t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextProps | undefined>(undefined);

interface LanguageProviderProps {
    children: ReactNode;
    defaultLanguage?: string;
    additionalTranslationKey?: string;
}

const translationCache: { [key: string]: Language } = {}; // 缓存翻译文件

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
                                                                      children,
                                                                      defaultLanguage = 'en',
                                                                      additionalTranslationKey
                                                                  }) => {
    const [language, setLanguageState] = useState<string>(() => {
        // 初始化语言，从 cookie 获取，如果没有，则使用默认值
        return Cookies.get('NEXT_LOCALE') || defaultLanguage;
    });
    const [translations, setTranslations] = useState<Language>({});
    const [, setIsLoading] = useState<boolean>(false);
    const router = useRouter();
    const pathname = usePathname();

    // 加载翻译文件
    useEffect(() => {
        const loadTranslations = async (lang: string) => {
            setIsLoading(true);
            try {
                if (translationCache[lang]) {
                    setTranslations(translationCache[lang]);
                } else {
                    const commonResponse = await fetch(`/locales/${lang}/common.json`);
                    if (!commonResponse.ok) {
                        throw new Error('Failed to load common translations');
                    }
                    const commonData = await commonResponse.json();

                    let additionalData: Language = {};
                    if (additionalTranslationKey) {
                        const additionalResponse = await fetch(`/locales/${lang}/${additionalTranslationKey}.json`);
                        if (additionalResponse.ok) {
                            additionalData = await additionalResponse.json();
                        } else {
                            console.warn(`Failed to load additional translations for ${additionalTranslationKey}`);
                        }
                    }

                    const mergedTranslations = {...commonData, ...additionalData};
                    translationCache[lang] = mergedTranslations;
                    setTranslations(mergedTranslations);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        loadTranslations(language);
    }, [language, additionalTranslationKey]);

    const t = useCallback((key: string) => {
        return translations[key] || key;
    }, [translations]);

    const setLanguage = useCallback((lang: string) => {
        if (lang === language) return; // 避免重复设置
        setLanguageState(lang);
        Cookies.set('NEXT_LOCALE', lang, {expires: 365});

        // 构造新的 URL 路径，将语言代码添加到路径前
        const newPath = `/${lang}${pathname ? pathname : ''}`;
        router.push(newPath);
    }, [language, pathname, router]);


    return (
        <TranslationContext.Provider value={{ language, setLanguage, t }}>
            <motion.div
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                exit={{opacity: 0}}
                transition={{duration: 0.8}}
            >
                {children}
            </motion.div>
        </TranslationContext.Provider>
    );
};

export const useTranslationContext = (): TranslationContextProps => {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error('useTranslationContext must be used within a LanguageProvider');
    }
    return context;
};
