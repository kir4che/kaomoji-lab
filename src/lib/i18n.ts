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
    'zh-tw': '收藏過 {count} + 顏文字，一鍵複製輕鬆使用！',
    en: 'A collection of {count}+ kaomojis, copy and paste with one click!',
  },
  footerText: {
    'zh-tw': '© 2025 顏文字實驗室 All rights reserved.',
    en: '© 2025 Kaomoji Lab All rights reserved.',
  },
  metaHomeTitle: {
    'zh-tw': '顏文字實驗室',
    en: 'Kaomoji Lab',
  },
  metaHomeDescription: {
    'zh-tw': '顏文字實驗室',
    en: 'Kaomoji Lab',
  },
  metaHomeKeywords: {
    'zh-tw': '顏文字,顏文字實驗室,Kaomoji,可愛顏文字,特殊符號,表情符號,一鍵複製',
    en: 'Kaomoji,Kaomoji Lab,cute kaomoji,special symbols,emoticons,one-click copy',
  },
  metaHomeOgTitle: {
    'zh-tw': '顏文字實驗室',
    en: 'Kaomoji Lab',
  },
  metaHomeOgDescription: {
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
    'zh-tw': '輸入心情或點擊下方情緒標籤，立即找到專屬顏文字！',
    en: 'Type a mood or click an emotion chip below to find matching kaomojis!',
  },
  generatorFallbackPlaceholder: {
    'zh-tw': '輸入心情，例如：開心、貓咪、吃飯...',
    en: 'Type a mood, e.g. happy, cat, eating...',
  },
  generatorClear: {
    'zh-tw': '清除',
    en: 'Clear',
  },
  generatorNoResults: {
    'zh-tw': '沒有找到匹配的顏文字',
    en: 'No matching kaomojis found',
  },
  generatorNoResultsHint: {
    'zh-tw': '試試看其他關鍵字，例如：開心、驚訝、可愛',
    en: 'Try other keywords, e.g. happy, surprised, cute',
  },
  generatorInitialHint: {
    'zh-tw': '點擊上方情緒標籤，或直接輸入心情關鍵字',
    en: 'Click an emotion chip above, or type a mood keyword',
  },
  emotionChip_happy: { 'zh-tw': '開心', en: 'Happy' },
  emotionChip_love: { 'zh-tw': '愛心', en: 'Love' },
  emotionChip_cute: { 'zh-tw': '可愛', en: 'Cute' },
  emotionChip_sad: { 'zh-tw': '傷心', en: 'Sad' },
  emotionChip_angry: { 'zh-tw': '生氣', en: 'Angry' },
  emotionChip_surprised: { 'zh-tw': '驚訝', en: 'Surprised' },
  emotionChip_shy: { 'zh-tw': '害羞', en: 'Shy' },
  emotionChip_tired: { 'zh-tw': '疲憊', en: 'Tired' },
  emotionChip_thinking: { 'zh-tw': '思考', en: 'Thinking' },
  emotionChip_cool: { 'zh-tw': '耍酷', en: 'Cool' },
  emotionChip_food: { 'zh-tw': '食物', en: 'Food' },
  emotionChip_greeting: { 'zh-tw': '打招呼', en: 'Greeting' },
  emotionChip_sparkly: { 'zh-tw': '閃亮', en: 'Sparkly' },
  emotionChip_peeking: { 'zh-tw': '偷看', en: 'Peeking' },
  emotionChip_praying: { 'zh-tw': '祈禱', en: 'Praying' },
  emotionChip_scared: { 'zh-tw': '害怕', en: 'Scared' },
  emotionChip_fighting: { 'zh-tw': '加油', en: 'Fighting' },
  emotionChip_guilty: { 'zh-tw': '心虛', en: 'Guilty' },
  emotionChip_cat: { 'zh-tw': '貓咪', en: 'Cat' },
  emotionChip_dog: { 'zh-tw': '狗狗', en: 'Dog' },
  yourKaomojis: {
    'zh-tw': '✨ 屬於你的顏文字 ✨',
    en: '✨ Your Own Kaomojis ✨',
  },
  noInspiration: {
    'zh-tw': '沒有靈感？試試看這些！',
    en: 'No inspiration? Try these!',
  },
  metaDefaultTitle: {
    'zh-tw': '顏文字實驗室',
    en: 'Kaomoji Lab',
  },
  metaTemplateTitle: {
    'zh-tw': '%s | 顏文字實驗室',
    en: '%s | Kaomoji Lab',
  },
  metaDescription: {
    'zh-tw':
      '收藏超過 6000+ 可愛顏文字 (Kaomoji)，支援一鍵複製，按分類和標籤瀏覽，輕鬆找到喜歡的顏文字 (｡◕‿◕｡)',
    en: 'A collection of 6000+ cute Kaomoji, supports one-click copy, browse by category and tag, and easily find your favorite Kaomoji (｡◕‿◕｡)',
  },
  metaKeywords: {
    'zh-tw': '顏文字,Kaomoji,可愛顏文字,特殊符號,表情符號,一鍵複製',
    en: 'Kaomoji,cute kaomoji,special symbols,emoticons,one-click copy',
  },
  metaOgDescription: {
    'zh-tw': '收藏超過 6000+ 可愛顏文字 (Kaomoji)，一鍵複製，輕鬆找到喜歡的顏文字 (｡◕‿◕｡)',
    en: 'A collection of 6000+ cute Kaomoji, one-click copy, and easily find your favorite Kaomoji (｡◕‿◕｡)',
  },
  metaTwitterDescription: {
    'zh-tw': '收藏超過 6000+ 可愛顏文字 (Kaomoji)，一鍵複製，輕鬆找到喜歡的顏文字 (｡◕‿◕｡)',
    en: 'A collection of 6000+ cute Kaomoji, one-click copy, and easily find your favorite Kaomoji (｡◕‿◕｡)',
  },
  metaGeneratorTitle: {
    'zh-tw': '顏文字產生器',
    en: 'Kaomoji Generator',
  },
  metaGeneratorDescription: {
    'zh-tw': '輸入心情或關鍵字，立即找到專屬顏文字！支援一鍵複製，快速又簡單。',
    en: 'Type a mood or keyword to find matching kaomojis instantly! One-click copy, fast and easy.',
  },
  metaGeneratorKeywords: {
    'zh-tw': '顏文字,產生器,表情符號,Kaomoji,可愛顏文字,Japanese Emoticons',
    en: 'Kaomoji,generator,emoticon,cute kaomoji,Japanese Emoticons',
  },
  metaGeneratorOgTitle: {
    'zh-tw': '顏文字產生器',
    en: 'Kaomoji Generator',
  },
  metaGeneratorOgDescription: {
    'zh-tw': '輸入心情或關鍵字，立即找到專屬顏文字！支援一鍵複製，快速又簡單。',
    en: 'Type a mood or keyword to find matching kaomojis instantly! One-click copy, fast and easy.',
  },
  metaCategoryTitle: {
    'zh-tw': '分類一覽',
    en: 'Category List',
  },
  metaCategoryDescription: {
    'zh-tw': '瀏覽所有顏文字分類，例如開心、悲傷、動物等，快速找到您想要的顏文字表情。',
    en: 'Browse all Kaomoji categories, such as happy, sad, animal, etc., to quickly find the emoticon you want.',
  },
  metaCategoryKeywords: {
    'zh-tw': '顏文字,表情符號,分類,Kaomoji,Categories,Japanese Emoticons',
    en: 'Kaomoji,emoticon,categories,Japanese Emoticons',
  },
  metaCategoryOgTitle: {
    'zh-tw': '顏文字分類',
    en: 'Kaomoji Categories',
  },
  metaCategoryOgDescription: {
    'zh-tw': '瀏覽所有顏文字分類，快速找到您想要的顏文字表情。',
    en: 'Browse all Kaomoji categories to quickly find the emoticon you want.',
  },
  metaTagTitle: {
    'zh-tw': '標籤一覽',
    en: 'Tag List',
  },
  metaTagDescription: {
    'zh-tw': '探索所有顏文字標籤，發現各種風格的顏文字，讓您的訊息更生動有趣。',
    en: 'Explore all Kaomoji tags, discover various styles of Kaomoji, and make your messages more lively and interesting.',
  },
  metaTagKeywords: {
    'zh-tw': '顏文字,表情符號,標籤,Kaomoji,Tags,Japanese Emoticons',
    en: 'Kaomoji,emoticon,tags,Japanese Emoticons',
  },
  metaTagOgTitle: {
    'zh-tw': '顏文字標籤',
    en: 'Kaomoji Tags',
  },
  metaTagOgDescription: {
    'zh-tw': '探索所有顏文字標籤，發現各種風格的顏文字。',
    en: 'Explore all Kaomoji tags and discover various styles of Kaomoji.',
  },
  metaTagPageDescription: {
    'zh-tw':
      '探索帶有「{tag}」標籤的顏文字！我們為您找到了 {count} 個相關的顏文字，快來複製您喜歡的吧！',
    en: 'Explore Kaomoji with the tag "{tag}"! We found {count} related Kaomoji for you, come and copy your favorites!',
  },
  metaTagPageKeywords: {
    'zh-tw': '{tag},顏文字,表情符號,標籤,Kaomoji,Tags,Japanese Emoticons',
    en: '{tag},Kaomoji,emoticon,tags,Japanese Emoticons',
  },
  tagPageTitle: {
    'zh-tw': '{tag}',
    en: '{tag}',
  },
  tagPageDescription: {
    'zh-tw': '共找到 {count} 個包含此標籤的顏文字',
    en: 'Found {count} kaomojis with this tag',
  },
  tagPageNoResults: {
    'zh-tw': '在此標籤中沒有符合條件的顏文字',
    en: 'No matching kaomojis found for this tag',
  },
  tagPageBackToAllTags: {
    'zh-tw': '返回所有標籤',
    en: 'Back to all tags',
  },
  tagPageAriaLabel: {
    'zh-tw': '{tag}（共 {count} 個）',
    en: '{tag} ({count} total)',
  },
  tagPageH1: {
    'zh-tw': '標籤',
    en: 'Tags',
  },
  tagPageP: {
    'zh-tw': '透過標籤探索 {count} 種不同風格的顏文字',
    en: 'Explore {count} different styles of kaomoji through tags',
  },
  a11yInputClear: { 'zh-tw': '清除內容', en: 'Clear input' },
  a11yScrollToTop: { 'zh-tw': '置頂', en: 'Back to top' },
  a11yRefreshRandom: { 'zh-tw': '重新隨機', en: 'Refresh random kaomojis' },
  a11yToastClose: { 'zh-tw': '關閉通知', en: 'Close notification' },
  a11yModalClose: { 'zh-tw': '關閉視窗', en: 'Close window' },
  a11ySelectAll: { 'zh-tw': '全選', en: 'Select all' },
  a11yDeselectAll: { 'zh-tw': '取消全選', en: 'Deselect all' },
  a11ySortAsc: { 'zh-tw': '切換正序', en: 'Sort ascending' },
  a11ySortDesc: { 'zh-tw': '切換倒序', en: 'Sort descending' },
  a11yToggleLanguage: { 'zh-tw': '切換語言', en: 'Toggle language' },
  a11yOpenInNewTab: { 'zh-tw': '（在新分頁開啟）', en: ' (opens in new tab)' },
};

export const t = (
  key: keyof typeof translations,
  lang: Language,
  options?: { [key: string]: string | number }
) => {
  let text = translations[key][lang];

  if (options)
    Object.keys(options).forEach((optionKey) => {
      text = text.replace(`{${optionKey}}`, String(options[optionKey]));
    });

  return text;
};
