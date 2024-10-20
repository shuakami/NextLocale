"use client";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { motion } from 'framer-motion';
const TranslationContext = createContext(undefined);
const translationCache = {}; // 缓存翻译文件
export const LanguageProvider = ({ children, defaultLanguage = 'en', additionalTranslationKey }) => {
    const [language, setLanguageState] = useState(() => {
        // 初始化语言，从 cookie 获取，如果没有，则使用默认值
        return Cookies.get('NEXT_LOCALE') || defaultLanguage;
    });
    const [translations, setTranslations] = useState({});
    const [, setIsLoading] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    // 加载翻译文件
    useEffect(() => {
        const loadTranslations = (lang) => __awaiter(void 0, void 0, void 0, function* () {
            setIsLoading(true);
            try {
                if (translationCache[lang]) {
                    setTranslations(translationCache[lang]);
                }
                else {
                    const commonResponse = yield fetch(`/locales/${lang}/common.json`);
                    if (!commonResponse.ok) {
                        throw new Error('Failed to load common translations');
                    }
                    const commonData = yield commonResponse.json();
                    let additionalData = {};
                    if (additionalTranslationKey) {
                        const additionalResponse = yield fetch(`/locales/${lang}/${additionalTranslationKey}.json`);
                        if (additionalResponse.ok) {
                            additionalData = yield additionalResponse.json();
                        }
                        else {
                            console.warn(`Failed to load additional translations for ${additionalTranslationKey}`);
                        }
                    }
                    const mergedTranslations = Object.assign(Object.assign({}, commonData), additionalData);
                    translationCache[lang] = mergedTranslations;
                    setTranslations(mergedTranslations);
                }
            }
            catch (error) {
                console.error(error);
            }
            finally {
                setIsLoading(false);
            }
        });
        loadTranslations(language);
    }, [language, additionalTranslationKey]);
    const t = useCallback((key) => {
        return translations[key] || key;
    }, [translations]);
    const setLanguage = useCallback((lang) => {
        if (lang === language)
            return; // 避免重复设置
        setLanguageState(lang);
        Cookies.set('NEXT_LOCALE', lang, { expires: 365 });
        // 构造新的 URL 路径，将语言代码添加到路径前
        const newPath = `/${lang}${pathname ? pathname : ''}`;
        router.push(newPath);
    }, [language, pathname, router]);
    return (React.createElement(TranslationContext.Provider, { value: { language, setLanguage, t } },
        React.createElement(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.8 } }, children)));
};
export const useTranslationContext = () => {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error('useTranslationContext must be used within a LanguageProvider');
    }
    return context;
};
