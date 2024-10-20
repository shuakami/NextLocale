# NextLocale

[英文](/README.md)

**NextLocale** 是一个专为 Next.js 14+ 项目打造的多语言（国际化）解决方案。它简单、轻量，让你能够轻松切换项目语言，并自动处理语言文件的加载和缓存。

## 为什么我要创建 NextLocale

我用 Next.js 的时候是 14 版本。这个版本跟那些常用的翻译库，比如 `i18next`、`react-intl`，不兼容，直接炸了，还一直报错，搞得我差点就赛博飞升了。那些库有些设计得比较复杂，要做很多额外配置。

于是我决定自己搞一个轻量但强大的方案，专门为 Next.js 14+ 设计，解决这个兼容性问题，减少不必要的复杂性。

NextLocale 的主要目标是：你只需要几步配置，立马能为你的 Next.js 项目带来全局多语言支持。带有动画过渡，支持缓存，而且可以方便地动态切换语言。再也不用为不同语言手动去改页面逻辑。

## 安装

先在你的项目中安装这个库：

```bash
pnpm add @shuakami/next-locale
```

或者你用 npm/yarn：

```bash
npm install @shuakami/next-locale
```
```bash
yarn add @shuakami/next-locale
```

## 第一步：配置语言文件

我们首先需要创建一个文件来定义系统支持的语言，这个文件叫做 `languages.ts`。

它的作用是用来管理可用的语言选项（比如显示名称、语言代码），并且会被用于语言切换的逻辑中。

### 1. 创建 `src/lib/languages.ts`

在你的项目里，新建一个 `src/lib/languages.ts` 文件，写入以下内容：

```typescript
// 定义支持的语言格式
export interface Language {
    code: string;        // 语言的简写，比如 'en' 表示英语
    name: string;        // 语言的名称，比如 'English' 表示英语
    translationKey: string; // 翻译文件的名称，比如 'translation_en'
    beta?: boolean;      // 可选的属性，用来标记是否为测试版语言
}

// 定义支持的语言列表
export const defaultLanguages: Language[] = [
    { code: 'en', name: 'English', translationKey: 'translation_en' },
    { code: 'zh_cn', name: '简体中文', translationKey: 'translation_zh_cn', beta: true },
    { code: 'es', name: 'Español', translationKey: 'translation_es' },
];
```

### 解释：

- **code**：语言的简写，比如 'en' 代表英语，'zh_cn' 代表简体中文。
- **name**：语言的显示名称，会在用户界面显示，比如 "简体中文" 或 "Español"。
- **translationKey**：用于查找对应翻译文件的名称，稍后你会用到这个字段。
- **beta**：这是一个可选字段，用于标记是否是测试版语言。比如，你可能还在开发某个语言的翻译。



## 第二步：创建中间件（Middleware）

这个中间件会检测用户的浏览器语言或已有的语言 Cookie，并根据这些信息自动切换语言。

### 1. 创建 `middleware.ts`

在你的项目根目录下，新建 `middleware.ts` 文件，内容如下：

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 定义支持的语言列表
const supportedLanguages = new Set([
    'en', 'zh_cn', 'es'
]);

export function middleware(req: NextRequest) {
    const url = req.nextUrl.clone();
    const acceptLanguage = req.headers.get('Accept-Language');

    let lang = 'en';  // 默认语言
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

### 解释：

- 这个中间件会在每次用户请求时检查他们的语言，并设置一个 `NEXT_LOCALE` 的 Cookie，表示用户的语言选择。
- **Accept-Language** 是浏览器发送的请求头，包含用户首选的语言。我们会从中提取用户偏好的语言。
- 如果用户之前已经选择过语言，系统会记住并使用他们选择的语言。
- 如果用户没有选择过语言，我们会基于浏览器的语言设置自动选择并设置 Cookie。
- 如果用户在前端手动切换语言，Cookie 会被重新设置为新的语言。



## 第三步：包裹 `LanguageProvider`

接下来，你需要在应用的根部包裹一个 `LanguageProvider`，为整个应用提供多语言支持。

### 1. 修改 `_app.tsx`

打开你的 `_app.tsx` 文件，包裹 `LanguageProvider`：

```tsx
import { LanguageProvider } from '@shuakami/next-locale';

function MyApp({ Component, pageProps }) {
    return (
        <LanguageProvider>
            <Component {...pageProps} />
        </LanguageProvider>
    );
}

export default MyApp;
```

如果你是用 `layout.tsx`，也差不多这样操作。

```tsx
import { LanguageProvider } from '@shuakami/next-locale';

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



## 第四步：使用 `useTranslation` Hook

`NextLocale` 提供了一个 `useTranslation` Hook，用来获取当前的语言，并进行翻译操作。

我给了两个DEMO，让你理解它的用法：

### 1. 翻译文本

假设你有一个组件，需要根据当前语言显示不同的文本：

```tsx
import { useTranslation } from '@shuakami/next-locale';

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

### 2. 获取并切换语言

```tsx
import { useTranslation } from '@shuakami/next-locale';
import { defaultLanguages } from '@/lib/languages';

const LanguageSwitcher = () => {
    const { language, setLanguage } = useTranslation();  // 获取翻译函数和语言切换功能

    return (
        <div>
            {/* 语言切换按钮 */}
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

### 解释：

- `useTranslation` Hook 返回一个对象，其中包含 `t` 函数、`language` 属性和 `setLanguage` 函数。
- `t` 函数用于翻译文本，它接受一个键值作为参数，返回对应的翻译文本。
- `language` 属性表示当前的语言。
- `setLanguage` 函数用于切换语言，它接受一个语言代码作为参数，并更新当前的语言。它会自动更新 `NEXT_LOCALE` Cookie，确保下次用户访问时使用正确的语言。



## 第五步：添加翻译文件

最后一步，你需要在 `public` 文件夹下为每个语言创建一个翻译文件。例如：

### 1. 创建翻译文件

在你的项目中创建如下目录和文件：

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

每个 `common.json` 文件包含你要翻译的文本。比如，`public/locales/en/common.json` 文件内容如下：

```json
{
    "welcome_message": "Welcome to our website!"
}
```

而 `public/locales/zh_cn/common.json` 可以这样写：

```json
{
    "welcome_message": "欢迎来到我们的网站！"
}
```

>  `common.json` 文件用于存储每种语言的翻译内容。`t('welcome_message')` 就会查找这个文件中对应的键值。
>  每个语言都有自己独立的文件夹，放在 `public/locales` 下面。



## License

项目采用 [MIT License](https://opensource.org/licenses/MIT)，你可以自由使用和修改，但别忘了署名哦


觉得不错的话给个star✨吧~

