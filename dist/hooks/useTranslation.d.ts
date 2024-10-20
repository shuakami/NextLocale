declare const useTranslation: (additionalTranslationKey?: string) => {
    t: (key: string) => string;
    language: string;
    setLanguage: (lang: string) => void;
    additionalTranslationKey: string | undefined;
};
/**
 * 获取全局的翻译函数。
 * 如果没有初始化，会抛出错误。
 */
export declare const getTranslate: () => (key: string, variables?: Record<string, string>) => string;
export default useTranslation;
