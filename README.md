# NextLocale

[简体中文](/README_ZH.md)

**NextLocale** is a multilingual (internationalization) solution built specifically for Next.js 14+ projects. It's simple, lightweight, and allows you to easily switch project languages while automatically handling the loading and caching of language files.

## Why I Created NextLocale

I was using Next.js version 14, and it completely clashed with popular translation libraries like `i18next` and `react-intl`, causing constant errors. It got so frustrating that I was about to have a cyber meltdown. These libraries are also often overcomplicated, requiring a lot of extra configuration.

So, I decided to create a lightweight but powerful solution, specifically designed for Next.js 14+, to solve these compatibility issues and reduce unnecessary complexity.

The main goal of NextLocale is that with just a few steps of configuration, you can bring global multilingual support to your Next.js project. It comes with smooth animation transitions, caching support, and allows easy dynamic language switching. No more manually tweaking your page logic for different languages.

## Installation

First, install the library in your project:

```bash
pnpm add @sdjzwiki/next-locale
```

Or if you're using npm or yarn:

```bash
npm install @sdjzwiki/next-locale
```

```bash
yarn add @sdjzwiki/next-locale
```

## Step 1: Configure Language Files

We first need to create a file to define the languages supported by the system. This file is called `languages.ts`.

Its purpose is to manage the available language options (like display names and language codes) and will be used in the language-switching logic.

### 1. Create `src/lib/languages.ts`

In your project, create a new file called `src/lib/languages.ts` and add the following content:

```typescript
// Define the format for supported languages
export interface Language {
    code: string;        // The language code, like 'en' for English
    name: string;        // The language name, like 'English'
    translationKey: string; // The name of the translation file, like 'translation_en'
    beta?: boolean;      // Optional property to mark a language as beta
}

// Define the list of supported languages
export const defaultLanguages: Language[] = [
    { code: 'en', name: 'English', translationKey: 'translation_en' },
    { code: 'zh_cn', name: '简体中文', translationKey: 'translation_zh_cn', beta: true },
    { code: 'es', name: 'Español', translationKey: 'translation_es' },
];
```

### Explanation:

- **code**: The shorthand for the language, like 'en' for English, 'zh_cn' for Simplified Chinese.
- **name**: The display name of the language, which will be shown in the user interface, like "简体中文" or "Español."
- **translationKey**: Used to find the corresponding translation file, which you'll use later.
- **beta**: An optional field to mark a language as a beta version. For example, you might be developing the translation for a new language.

## Step 2: Create Middleware

This middleware will detect the user's browser language or existing language cookie and automatically switch languages based on this information.

### 1. Create `middleware.ts`

In the root directory of your project, create a new file called `middleware.ts` with the following content:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define the list of supported languages
const supportedLanguages = new Set([
    'en', 'zh_cn', 'es'
]);

export function middleware(req: NextRequest) {
    const url = req.nextUrl.clone();
    const acceptLanguage = req.headers.get('Accept-Language');

    let lang = 'en';  // Default language
    const cookieLang = req.cookies.get('NEXT_LOCALE');

    if (cookieLang) {
        lang = cookieLang.value.toLowerCase();
    } else if (acceptLanguage) {
        const languages = acceptLanguage.split(',').map(l => l.split(';')[0].trim().toLowerCase());
        for (const l of languages) {
            const formattedLang = l.replace('-', '_');
            if (supportedLanguages.has(formattedLang)) {
                lang = formattedLang;
                break;
            }
        }
    }

    if (!cookieLang && lang) {
        const response = NextResponse.redirect(url);
        response.cookies.set('NEXT_LOCALE', lang, { path: '/' });
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next|favicon.ico).*)'],
};
```

### Explanation:

- This middleware checks the user's language on every request and sets a `NEXT_LOCALE` cookie that stores their language preference.
- **Accept-Language** is a request header sent by the browser that contains the user's preferred language. We extract the preferred language from this header.
- If the user has previously selected a language, the system will remember and use their chosen language.
- If no language has been selected before, we automatically choose one based on the browser's language settings and set a cookie.
- If the user manually switches languages on the frontend, the cookie will be updated to reflect the new language.

## Step 3: Wrap the `LanguageProvider`

Next, you need to wrap the root of your app with a `LanguageProvider` to provide multilingual support throughout your app.

### 1. Modify `_app.tsx`

Open your `_app.tsx` file and wrap the `LanguageProvider`:

```tsx
import { LanguageProvider } from '@sdjzwiki/next-locale';

function MyApp({ Component, pageProps }) {
    return (
        <LanguageProvider>
            <Component {...pageProps} />
        </LanguageProvider>
    );
}

export default MyApp;
```

If you're using `layout.tsx`, it works similarly:

```tsx
import { LanguageProvider } from '@sdjzwiki/next-locale';

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {

    return (
                <LanguageProvider>
                    {children}
                </LanguageProvider>
    );
}
```

## Step 4: Use the `useTranslation` Hook

`NextLocale` provides a `useTranslation` Hook to get the current language and perform translation operations.

Here are two demos to help you understand how to use it:

### 1. Translating Text

Suppose you have a component that needs to display different text based on the current language:

```tsx
import { useTranslation } from '@sdjzwiki/next-locale';

const Component = () => {
    const { t } = useTranslation();

    return (
        <div>
            <p>{t('welcome_message')}</p>
        </div>
    );
};

export default Component;
```

### 2. Getting and Switching Languages

```tsx
import { useTranslation } from '@sdjzwiki/next-locale';
import { defaultLanguages } from '@/lib/languages';

const LanguageSwitcher = () => {
    const { language, setLanguage } = useTranslation();  // Get translation function and language switcher

    return (
        <div>
            {/* Language switch buttons */}
            {defaultLanguages.map((lang) => (
                <button key={lang.code} onClick={() => setLanguage(lang.code)}>
                    {lang.name}
                </button>
            ))}
        </div>
    );
};

export default LanguageSwitcher;
```

### Explanation:

- The `useTranslation` Hook returns an object that contains the `t` function, the `language` property, and the `setLanguage` function.
- The `t` function is used to translate text; it takes a key as an argument and returns the corresponding translation.
- The `language` property represents the current language.
- The `setLanguage` function is used to switch languages, accepting a language code as an argument and updating the current language. It automatically updates the `NEXT_LOCALE` cookie, ensuring the correct language is used on the next visit.

## Step 5: Add Translation Files

In the last step, you'll need to create a translation file for each language under the `public` folder. For example:

### 1. Create Translation Files

In your project, create the following directory and files:

```plaintext
public/
  └── locales/
      ├── en/
      │   └── common.json
      ├── zh_cn/
      │   └── common.json
      └── es/
          └── common.json
```

Each `common.json` file contains the text you want to translate. For example, the `public/locales/en/common.json` file would look like this:

```json
{
    "welcome_message": "Welcome to our website!"
}
```

And `public/locales/zh_cn/common.json` could look like this:

```json
{
    "welcome_message": "欢迎来到我们的网站！"
}
```

> The `common.json` file is used to store translation content for each language. The `t('welcome_message')` function will look up this key in the file.
> Each language has its own folder under `public/locales`.

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT), meaning you can use and modify it freely, but don't forget to give credit.

If you think it's cool, give it a star ✨!

