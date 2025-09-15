import type { Language } from '@/types/Language';

type Translations = {
  [key: string]: {
    [lang in Language]: string;
  };
};

const translations: Translations = {
  searchInputPlaceholder: {
    'zh-tw': '搜尋顏文字或標籤...',
    en: 'Search for kaomojis or tags...',
  },
  searchInputAriaLabel: {
    'zh-tw': '搜尋顏文字或標籤',
    en: 'Search for kaomojis or tags',
  },
  searchResultsAriaLabel: {
    'zh-tw': '搜尋結果，共 {count} 筆',
    en: '{count} results found',
  },
  recommendedKaomojis: {
    'zh-tw': '推薦顏文字',
    en: 'Recommended Kaomojis',
  },
  noKaomojisFound: {
    'zh-tw': '沒有找到相關的顏文字',
    en: 'No related kaomojis found',
  },
  noKaomojisFoundWithTerm: {
    'zh-tw': '沒有找到 "{term}" 相關的顏文字',
    en: 'No kaomojis found for "{term}"',
  },
  exploreByCategory: {
    'zh-tw': '按分類探索',
    en: 'Explore by Category',
  },
  kaomojisCount: {
    'zh-tw': '{count} 個',
    en: '{count}',
  },
  categoryAriaLabel: {
    'zh-tw': '{categoryName}，{count} 個顏文字',
    en: '{categoryName}, {count} kaomojis',
  },
  navHome: {
    'zh-tw': '首頁',
    en: 'Home',
  },
  navCategories: {
    'zh-tw': '分類',
    en: 'Categories',
  },
  navTags: {
    'zh-tw': '標籤',
    en: 'Tags',
  },
  navGenerator: {
    'zh-tw': '顏文字產生器',
    en: 'Generator',
  },
  feedback: {
    'zh-tw': '意見回饋',
    en: 'Feedback',
  },
  admin: {
    'zh-tw': '管理後台',
    en: 'Admin',
  },
  language: {
    'zh-tw': '語言',
    en: 'Language',
  },
  english: {
    'zh-tw': 'English',
    en: 'English',
  },
  traditionalChinese: {
    'zh-tw': '中文',
    en: '中文',
  },
  categoryListTitle: {
    'zh-tw': '分類一覽',
    en: 'Category List',
  },
  categoryListDescription: {
    'zh-tw': '共 {categoryCount} 個分類 ｜ {kaomojiCount} 個顏文字',
    en: '{categoryCount} categories | {kaomojiCount} kaomojis',
  },
  sortByCount: {
    'zh-tw': '數量',
    en: 'Count',
  },
  sortByName: {
    'zh-tw': '名稱',
    en: 'Name',
  },
  unnamedCategory: {
    'zh-tw': '未命名分類',
    en: 'Unnamed Category',
  },
  kaomojiCountInCategory: {
    'zh-tw': '共 {count} 個顏文字',
    en: '{count} kaomojis in total',
  },
  searchInputPlaceholderInCategory: {
    'zh-tw': '請輸入顏文字或標籤...',
    en: 'Enter kaomoji or tags...',
  },
  searchInputAriaLabelInCategory: {
    'zh-tw': '搜尋顏文字或標籤',
    en: 'Search for kaomojis or tags',
  },
  noKaomojisFoundInCategory: {
    'zh-tw': '在此分類中沒有符合條件的顏文字或標籤',
    en: 'No matching kaomojis or tags found in this category',
  },
  backToCategories: {
    'zh-tw': '返回分類',
    en: 'Back to Categories',
  },
  siteTitle: {
    'zh-tw': '顏文字實驗室',
    en: 'Kaomoji Lab',
  },
  siteDescription: {
    'zh-tw': '收藏過 {count}+ 顏文字，一鍵複製輕鬆使用！',
    en: 'A collection of {count}+ kaomojis, copy and paste with one click!',
  },
  footerText: {
    'zh-tw': '© 2025 顏文字實驗室 All rights reserved.',
    en: '© 2025 Kaomoji Lab All rights reserved.',
  },
  meta_home_title: {
    'zh-tw': '顏文字實驗室',
    en: 'Kaomoji Lab',
  },
  meta_home_description: {
    'zh-tw': '顏文字實驗室',
    en: 'Kaomoji Lab',
  },
  meta_home_keywords: {
    'zh-tw': '顏文字,顏文字實驗室,Kaomoji,可愛顏文字,特殊符號,表情符號,一鍵複製',
    en: 'Kaomoji,Kaomoji Lab,cute kaomoji,special symbols,emoticons,one-click copy',
  },
  meta_home_og_title: {
    'zh-tw': '顏文字實驗室',
    en: 'Kaomoji Lab',
  },
  meta_home_og_description: {
    'zh-tw': '顏文字實驗室',
    en: 'Kaomoji Lab',
  },
  exploreMore: {
    'zh-tw': '探索更多',
    en: 'Explore More',
  },
  exploreCategoriesTitle: {
    'zh-tw': '瀏覽分類',
    en: 'Browse Categories',
  },
  exploreCategoriesDesc: {
    'zh-tw': '按照情緒、主題分類瀏覽',
    en: 'Browse by mood and theme',
  },
  exploreTagsTitle: {
    'zh-tw': '標籤搜尋',
    en: 'Search by Tag',
  },
  exploreTagsDesc: {
    'zh-tw': '透過標籤找到特定風格',
    en: 'Find specific styles with tags',
  },
  exploreGeneratorTitle: {
    'zh-tw': '顏文字產生器',
    en: 'Kaomoji Generator',
  },
  exploreGeneratorDesc: {
    'zh-tw': '使用 AI 生成你想要的顏文字',
    en: 'Generate your own kaomoji with AI',
  },
  generatorPromptLabel: {
    'zh-tw': '顏文字靈感輸入',
    en: 'Kaomoji inspiration input',
  },
  generatorPromptPlaceholder: {
    'zh-tw': '例如：閃亮飛舞的貓咪',
    en: 'e.g., a sparkling, dancing cat',
  },
  generatorHelperText: {
    'zh-tw': '最多可輸入 100 字，且每分鐘只能生成 1 次，暫請見諒。',
    en: 'Max 100 characters, 1 generation per minute. Thanks for your understanding.',
  },
  generating: {
    'zh-tw': '生成中',
    en: 'Generating',
  },
  generate: {
    'zh-tw': '立即生成',
    en: 'Generate',
  },
  inspirationDancing: {
    'zh-tw': '開心地跳舞',
    en: 'Dancing happily',
  },
  inspirationPeekingCat: {
    'zh-tw': '偷偷觀察的小貓咪',
    en: 'A peeking kitten',
  },
  inspirationSparklingEyes: {
    'zh-tw': '閃閃發亮的眼睛',
    en: 'Sparkling eyes',
  },
  inspirationTired: {
    'zh-tw': '疲憊地趴在桌上',
    en: 'Tired on the desk',
  },
  inspirationFlyingKiss: {
    'zh-tw': '送出一個飛吻',
    en: 'Blowing a kiss',
  },
  inspirationSurprised: {
    'zh-tw': '驚訝到下巴掉下來',
    en: 'Jaw-droppingly surprised',
  },
  generatorPromptError: {
    'zh-tw': '請輸入你的想法或選擇一個靈感！',
    en: 'Please enter your idea or choose an inspiration!',
  },
  generatorRateLimitError: {
    'zh-tw': '目前 1 分鐘內只能請求 1 次，請稍後再試。',
    en: 'You can only make 1 request per minute. Please try again later.',
  },
  generatorGenericError: {
    'zh-tw': '生成失敗，請稍後再試。',
    en: 'Generation failed. Please try again later.',
  },
  generatorDataError: {
    'zh-tw': '從伺服器收到的資料格式不正確！',
    en: 'Incorrect data format received from the server!',
  },
  generatorTitle: {
    'zh-tw': '顏文字產生器',
    en: 'Kaomoji Generator',
  },
  generatorSubtitle: {
    'zh-tw': '輸入你的靈感，AI 將為你創造 3 個獨一無二的顏文字！',
    en: 'Enter your inspiration and AI will create 3 unique kaomojis for you!',
  },
  yourKaomojis: {
    'zh-tw': '✨ 屬於你的顏文字 ✨',
    en: '✨ Your Own Kaomojis ✨',
  },
  noInspiration: {
    'zh-tw': '沒有靈感？試試看這些！',
    en: 'No inspiration? Try these!',
  },
  meta_default_title: {
    'zh-tw': '顏文字實驗室',
    en: 'Kaomoji Lab',
  },
  meta_template_title: {
    'zh-tw': '%s | 顏文字實驗室',
    en: '%s | Kaomoji Lab',
  },
  meta_description: {
    'zh-tw':
      '收藏超過 6000+ 可愛顏文字 (Kaomoji)，支援一鍵複製，按分類和標籤瀏覽，輕鬆找到喜歡的顏文字 (｡◕‿◕｡)',
    en: 'A collection of 6000+ cute Kaomoji, supports one-click copy, browse by category and tag, and easily find your favorite Kaomoji (｡◕‿◕｡)',
  },
  meta_keywords: {
    'zh-tw': '顏文字,Kaomoji,可愛顏文字,特殊符號,表情符號,一鍵複製',
    en: 'Kaomoji,cute kaomoji,special symbols,emoticons,one-click copy',
  },
  meta_og_description: {
    'zh-tw': '收藏超過 6000+ 可愛顏文字 (Kaomoji)，一鍵複製，輕鬆找到喜歡的顏文字 (｡◕‿◕｡)',
    en: 'A collection of 6000+ cute Kaomoji, one-click copy, and easily find your favorite Kaomoji (｡◕‿◕｡)',
  },
  meta_twitter_description: {
    'zh-tw': '收藏超過 6000+ 可愛顏文字 (Kaomoji)，一鍵複製，輕鬆找到喜歡的顏文字 (｡◕‿◕｡)',
    en: 'A collection of 6000+ cute Kaomoji, one-click copy, and easily find your favorite Kaomoji (｡◕‿◕｡)',
  },
  meta_generator_title: {
    'zh-tw': 'AI 顏文字產生器',
    en: 'AI Kaomoji Generator',
  },
  meta_generator_description: {
    'zh-tw': '輸入你的靈感或心情，讓 AI 為你生成獨一無二的客製化顏文字！簡單、快速，立即複製使用。',
    en: 'Enter your inspiration or mood, and let AI generate unique custom Kaomoji for you! Simple, fast, and ready to copy and use.',
  },
  meta_generator_keywords: {
    'zh-tw': '顏文字,AI產生器,表情符號,Kaomoji,客製化表情,客製化顏文字,Japanese Emoticons',
    en: 'Kaomoji,AI Generator,emoticon,custom emoji,custom kaomoji,Japanese Emoticons',
  },
  meta_generator_og_title: {
    'zh-tw': 'AI 顏文字產生器',
    en: 'AI Kaomoji Generator',
  },
  meta_generator_og_description: {
    'zh-tw': '輸入你的靈感或心情，讓 AI 為你生成獨一無二的客製化顏文字！簡單、快速，立即複製使用。',
    en: 'Enter your inspiration or mood, and let AI generate unique custom Kaomoji for you! Simple, fast, and ready to copy and use.',
  },
  meta_category_title: {
    'zh-tw': '分類一覽',
    en: 'Category List',
  },
  meta_category_description: {
    'zh-tw': '瀏覽所有顏文字分類，例如開心、悲傷、動物等，快速找到您想要的顏文字表情。',
    en: 'Browse all Kaomoji categories, such as happy, sad, animal, etc., to quickly find the emoticon you want.',
  },
  meta_category_keywords: {
    'zh-tw': '顏文字,表情符號,分類,Kaomoji,Categories,Japanese Emoticons',
    en: 'Kaomoji,emoticon,categories,Japanese Emoticons',
  },
  meta_category_og_title: {
    'zh-tw': '顏文字分類',
    en: 'Kaomoji Categories',
  },
  meta_category_og_description: {
    'zh-tw': '瀏覽所有顏文字分類，快速找到您想要的顏文字表情。',
    en: 'Browse all Kaomoji categories to quickly find the emoticon you want.',
  },
  meta_tag_title: {
    'zh-tw': '標籤一覽',
    en: 'Tag List',
  },
  meta_tag_description: {
    'zh-tw': '探索所有顏文字標籤，發現各種風格的顏文字，讓您的訊息更生動有趣。',
    en: 'Explore all Kaomoji tags, discover various styles of Kaomoji, and make your messages more lively and interesting.',
  },
  meta_tag_keywords: {
    'zh-tw': '顏文字,表情符號,標籤,Kaomoji,Tags,Japanese Emoticons',
    en: 'Kaomoji,emoticon,tags,Japanese Emoticons',
  },
  meta_tag_og_title: {
    'zh-tw': '顏文字標籤',
    en: 'Kaomoji Tags',
  },
  meta_tag_og_description: {
    'zh-tw': '探索所有顏文字標籤，發現各種風格的顏文字。',
    en: 'Explore all Kaomoji tags and discover various styles of Kaomoji.',
  },
  meta_tag_page_description: {
    'zh-tw':
      '探索帶有「{tag}」標籤的顏文字！我們為您找到了 {count} 個相關的顏文字，快來複製您喜歡的吧！',
    en: 'Explore Kaomoji with the tag "{tag}"! We found {count} related Kaomoji for you, come and copy your favorites!',
  },
  meta_tag_page_keywords: {
    'zh-tw': '{tag},顏文字,表情符號,標籤,Kaomoji,Tags,Japanese Emoticons',
    en: '{tag},Kaomoji,emoticon,tags,Japanese Emoticons',
  },
  tag_page_title: {
    'zh-tw': '{tag}',
    en: '{tag}',
  },
  tag_page_description: {
    'zh-tw': '共找到 {count} 個包含此標籤的顏文字',
    en: 'Found {count} kaomojis with this tag',
  },
  tag_page_no_results: {
    'zh-tw': '在此標籤中沒有符合條件的顏文字',
    en: 'No matching kaomojis found for this tag',
  },
  tag_page_back_to_all_tags: {
    'zh-tw': '返回所有標籤',
    en: 'Back to all tags',
  },
  tag_page_aria_label: {
    'zh-tw': '{tag}（共 {count} 個）',
    en: '{tag} ({count} total)',
  },
  tag_page_h1: {
    'zh-tw': '標籤',
    en: 'Tags',
  },
  tag_page_p: {
    'zh-tw': '透過標籤探索 {count} 種不同風格的顏文字',
    en: 'Explore {count} different styles of kaomoji through tags',
  },
};

export const t = (
  key: keyof typeof translations,
  lang: Language,
  options?: { [key: string]: string | number }
) => {
  let text = translations[key][lang];

  if (options) {
    Object.keys(options).forEach((optionKey) => {
      text = text.replace(`{${optionKey}}`, String(options[optionKey]));
    });
  }

  return text;
};
