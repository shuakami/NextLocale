// src/hooks/useTranslation.ts
import { useTranslationContext } from '../components/LanguageProvider';

let translate: ((key: string, variables?: Record<string, string>) => string) | null = null;

const useTranslation = (additionalTranslationKey?: string) => {
    const { t, language, setLanguage } = useTranslationContext();

    // 将 t 函数赋值给全局 translate 变量
    translate = t;

    return {t, language, setLanguage, additionalTranslationKey};
};

/**
 * 获取全局的翻译函数。
 * 如果没有初始化，会抛出错误。
 */
export const getTranslate = () => {
    if (!translate) {
        throw new Error("翻译函数未初始化，请确保 useTranslation 已被调用！");
    }
    return translate;
};

export default useTranslation;
