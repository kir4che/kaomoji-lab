export interface GeneratorKaomoji {
  text: string;
  keywords: {
    'zh-tw': string[];
    en: string[];
  };
}

export const generatorKaomojis: GeneratorKaomoji[] = [
  // ── 開心 / Happy ──
  {
    text: '٩(ˊᗜˋ*)و',
    keywords: {
      'zh-tw': ['開心', '快樂', '歡呼', '興奮', '慶祝'],
      en: ['happy', 'joy', 'cheer', 'excited', 'celebrate'],
    },
  },
  {
    text: '✧*｡٩(ˊᗜˋ*)و✧*｡',
    keywords: {
      'zh-tw': ['開心', '閃亮', '興奮', '跳舞'],
      en: ['happy', 'sparkly', 'excited', 'dancing'],
    },
  },
  {
    text: '(b*´▽`*)b',
    keywords: {
      'zh-tw': ['開心', '讚', '很棒', '好耶'],
      en: ['happy', 'thumbs up', 'great', 'yay'],
    },
  },
  {
    text: 'ヾ(●´▽｀●)ﾉ',
    keywords: { 'zh-tw': ['開心', '揮手', '嗨', '喜悅'], en: ['happy', 'waving', 'hi', 'joyful'] },
  },
  {
    text: '⁽⁽٩( ´͈ ᗨ `͈ )۶⁾⁾',
    keywords: {
      'zh-tw': ['開心', '跳舞', '興奮', '搖擺'],
      en: ['happy', 'dancing', 'excited', 'wiggle'],
    },
  },
  {
    text: '(≧▽≦)',
    keywords: { 'zh-tw': ['開心', '大笑', '歡樂'], en: ['happy', 'laughing', 'joyful'] },
  },
  {
    text: '( ﾟ▽ﾟ)/',
    keywords: {
      'zh-tw': ['開心', '揮手', '嗨', '迎接'],
      en: ['happy', 'waving', 'hi', 'greeting'],
    },
  },
  {
    text: '₍₍ ( ๑॔˃̶◡ ˂̶๑॓)◞♡',
    keywords: {
      'zh-tw': ['開心', '可愛', '蹦跳', '興奮'],
      en: ['happy', 'cute', 'hopping', 'excited'],
    },
  },

  // ── 超開心 / Super Happy ──
  {
    text: '＼(＾▽＾)／',
    keywords: {
      'zh-tw': ['超開心', '萬歲', '歡呼', '慶祝'],
      en: ['super happy', 'hooray', 'cheer', 'celebrate'],
    },
  },
  {
    text: '☆*:.｡.o(≧▽≦)o.｡.:*☆',
    keywords: {
      'zh-tw': ['超開心', '閃亮', '興奮', '星星'],
      en: ['super happy', 'sparkly', 'excited', 'stars'],
    },
  },
  {
    text: '♪(๑ᴖ◡ᴖ๑)♪',
    keywords: {
      'zh-tw': ['開心', '音樂', '唱歌', '哼歌'],
      en: ['happy', 'music', 'singing', 'humming'],
    },
  },
  {
    text: '(ﾉ≧∀≦)ﾉ',
    keywords: {
      'zh-tw': ['超開心', '歡呼', '興奮', '跳躍'],
      en: ['super happy', 'cheer', 'excited', 'jumping'],
    },
  },

  // ── 開心跳舞 / Dancing ──
  {
    text: '┏(＾0＾)┛',
    keywords: {
      'zh-tw': ['跳舞', '開心', '派對', '搖擺'],
      en: ['dancing', 'party', 'groove', 'happy'],
    },
  },
  {
    text: '└( ＾ω＾)」',
    keywords: {
      'zh-tw': ['跳舞', '開心', '哼歌', '放鬆'],
      en: ['dancing', 'happy', 'humming', 'relaxed'],
    },
  },
  {
    text: '♪ヽ( ⌒o⌒)ﾉ',
    keywords: {
      'zh-tw': ['跳舞', '音樂', '開心', '派對'],
      en: ['dancing', 'music', 'happy', 'party'],
    },
  },

  // ── 愛心 / Love ──
  {
    text: '(｡♥‿♥｡)',
    keywords: {
      'zh-tw': ['愛', '戀愛', '喜歡', '心動', '甜蜜'],
      en: ['love', 'crush', 'heart', 'sweet'],
    },
  },
  {
    text: '(♡˙︶˙♡)',
    keywords: { 'zh-tw': ['愛', '甜蜜', '害羞', '心動'], en: ['love', 'sweet', 'shy', 'heart'] },
  },
  {
    text: '(´ ε ` )♡',
    keywords: {
      'zh-tw': ['愛', '飛吻', '親親', '甜蜜'],
      en: ['love', 'kiss', 'flying kiss', 'sweet'],
    },
  },
  {
    text: '( ˘ ³˘)♥',
    keywords: {
      'zh-tw': ['愛', '親親', '浪漫', '甜蜜'],
      en: ['love', 'kiss', 'romantic', 'sweet'],
    },
  },
  {
    text: '♡＼(￣▽￣)／♡',
    keywords: { 'zh-tw': ['愛', '開心', '幸福', '歡呼'], en: ['love', 'happy', 'bliss', 'cheer'] },
  },
  {
    text: '(⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)',
    keywords: { 'zh-tw': ['愛', '害羞', '臉紅', '心動'], en: ['love', 'shy', 'blushing', 'crush'] },
  },

  // ── 可愛 / Cute ──
  {
    text: '(◕‿◕✿)',
    keywords: {
      'zh-tw': ['可愛', '花', '微笑', '溫柔'],
      en: ['cute', 'flower', 'smile', 'gentle'],
    },
  },
  {
    text: '(｡◕‿◕｡)',
    keywords: {
      'zh-tw': ['可愛', '微笑', '純真', '開心'],
      en: ['cute', 'smile', 'innocent', 'happy'],
    },
  },
  {
    text: '(◠‿◠✿)',
    keywords: {
      'zh-tw': ['可愛', '花', '溫柔', '甜美'],
      en: ['cute', 'flower', 'gentle', 'sweet'],
    },
  },
  {
    text: '◝(⁰▿⁰)◜',
    keywords: {
      'zh-tw': ['可愛', '開心', '純真', '微笑'],
      en: ['cute', 'happy', 'innocent', 'smile'],
    },
  },
  {
    text: 'ʕ•ᴥ•ʔ',
    keywords: {
      'zh-tw': ['可愛', '熊', '動物', '毛茸茸'],
      en: ['cute', 'bear', 'animal', 'fluffy'],
    },
  },
  {
    text: 'ʕ•́ᴥ•̀ʔっ',
    keywords: {
      'zh-tw': ['可愛', '熊', '打招呼', '毛茸茸'],
      en: ['cute', 'bear', 'greeting', 'fluffy'],
    },
  },

  // ── 貓 / Cat ──
  {
    text: '(=^･ω･^=)',
    keywords: { 'zh-tw': ['貓', '可愛', '動物', '喵'], en: ['cat', 'cute', 'animal', 'meow'] },
  },
  {
    text: '(=ΦωΦ=)',
    keywords: {
      'zh-tw': ['貓', '可愛', '動物', '大眼睛'],
      en: ['cat', 'cute', 'animal', 'big eyes'],
    },
  },
  {
    text: '₍˄·͈༝·͈˄₎ฅ˒˒',
    keywords: { 'zh-tw': ['貓', '可愛', '喵', '毛茸茸'], en: ['cat', 'cute', 'meow', 'fluffy'] },
  },
  {
    text: '(=´∇`=)',
    keywords: { 'zh-tw': ['貓', '開心', '微笑', '可愛'], en: ['cat', 'happy', 'smile', 'cute'] },
  },
  {
    text: 'ㅇㅅㅇ',
    keywords: {
      'zh-tw': ['貓', '面無表情', '呆滯', '可愛'],
      en: ['cat', 'blank', 'staring', 'cute'],
    },
  },

  // ── 偷看 / Peeking ──
  {
    text: '┬┴┬┴┤･ω･)ﾉ',
    keywords: {
      'zh-tw': ['偷看', '躲藏', '害羞', '悄悄'],
      en: ['peeking', 'hiding', 'shy', 'sneaky'],
    },
  },
  {
    text: '|･ω･)ﾉ',
    keywords: {
      'zh-tw': ['偷看', '害羞', '悄悄', '躲'],
      en: ['peeking', 'shy', 'sneaky', 'hiding'],
    },
  },
  {
    text: '|ω･)و ̑̑',
    keywords: {
      'zh-tw': ['偷看', '好奇', '悄悄', '暗中'],
      en: ['peeking', 'curious', 'sneaky', 'lurking'],
    },
  },

  // ── 傷心 / Sad ──
  {
    text: '(╥﹏╥)',
    keywords: {
      'zh-tw': ['傷心', '哭泣', '難過', '悲傷'],
      en: ['sad', 'crying', 'upset', 'sorrow'],
    },
  },
  {
    text: '(╥_╥)',
    keywords: {
      'zh-tw': ['傷心', '哭泣', '難過', '眼淚'],
      en: ['sad', 'crying', 'upset', 'tears'],
    },
  },
  {
    text: '(｡•́︿•̀｡)',
    keywords: {
      'zh-tw': ['傷心', '難過', '委屈', '哭泣'],
      en: ['sad', 'upset', 'wronged', 'crying'],
    },
  },
  {
    text: '(´;︵;`)',
    keywords: {
      'zh-tw': ['傷心', '哭泣', '難過', '淚流滿面'],
      en: ['sad', 'crying', 'upset', 'teary'],
    },
  },
  {
    text: 'o(TヘTo)',
    keywords: {
      'zh-tw': ['傷心', '哭泣', '難過', '無助'],
      en: ['sad', 'crying', 'upset', 'helpless'],
    },
  },
  {
    text: '(っ˘̩╭╮˘̩)っ',
    keywords: {
      'zh-tw': ['傷心', '孤單', '需要抱抱', '難過'],
      en: ['sad', 'lonely', 'need hug', 'upset'],
    },
  },

  // ── 生氣 / Angry ──
  {
    text: '(╬ Ò﹏Ó)',
    keywords: {
      'zh-tw': ['生氣', '憤怒', '不滿', '暴躁'],
      en: ['angry', 'furious', 'mad', 'rage'],
    },
  },
  {
    text: '(｀Д´)',
    keywords: {
      'zh-tw': ['生氣', '憤怒', '不滿', '吼叫'],
      en: ['angry', 'furious', 'mad', 'yelling'],
    },
  },
  {
    text: '(╯°□°)╯︵ ┻━┻',
    keywords: {
      'zh-tw': ['生氣', '翻桌', '暴怒', '崩潰'],
      en: ['angry', 'flip table', 'rage', 'furious'],
    },
  },
  {
    text: '(ꐦ°᷄д°᷅)',
    keywords: {
      'zh-tw': ['生氣', '憤怒', '不滿', '瞪眼'],
      en: ['angry', 'furious', 'glaring', 'mad'],
    },
  },
  {
    text: '(`皿´)',
    keywords: {
      'zh-tw': ['生氣', '憤怒', '不滿', '咬牙切齒'],
      en: ['angry', 'furious', 'mad', 'gritting teeth'],
    },
  },

  // ── 驚訝 / Surprised ──
  {
    text: '(°ロ°)',
    keywords: {
      'zh-tw': ['驚訝', '震驚', '傻眼', '目瞪口呆'],
      en: ['surprised', 'shocked', 'stunned', 'jaw drop'],
    },
  },
  {
    text: 'Σ(°△°|||)',
    keywords: {
      'zh-tw': ['驚訝', '震驚', '傻眼', '不知所措'],
      en: ['surprised', 'shocked', 'stunned', 'lost'],
    },
  },
  {
    text: '(*ﾟﾛﾟ)',
    keywords: {
      'zh-tw': ['驚訝', '眼睛大睜', '嚇到'],
      en: ['surprised', 'wide eyes', 'startled', 'shocked'],
    },
  },
  {
    text: 'w(°ｏ°)w',
    keywords: {
      'zh-tw': ['驚訝', '震驚', '大叫', '傻眼'],
      en: ['surprised', 'shocked', 'yelling', 'stunned'],
    },
  },
  {
    text: '∑(O_O；)',
    keywords: {
      'zh-tw': ['驚訝', '震驚', '傻眼', '嚇到'],
      en: ['surprised', 'shocked', 'stunned', 'startled'],
    },
  },

  // ── 困惑 / Confused ──
  {
    text: '(￣ω￣;)',
    keywords: {
      'zh-tw': ['困惑', '尷尬', '苦笑', '不知'],
      en: ['confused', 'awkward', 'sweat', 'unsure'],
    },
  },
  {
    text: '(´･ω･`)?',
    keywords: {
      'zh-tw': ['困惑', '問號', '不解', '疑問'],
      en: ['confused', 'question', 'puzzled', 'wondering'],
    },
  },
  {
    text: '(•ิ_•ิ)?',
    keywords: {
      'zh-tw': ['困惑', '懷疑', '不解', '側目'],
      en: ['confused', 'suspicious', 'puzzled', 'side eye'],
    },
  },
  {
    text: '╮(╯_╰)╭',
    keywords: {
      'zh-tw': ['困惑', '無奈', '聳肩', '不知道'],
      en: ['confused', 'helpless', 'shrug', 'no idea'],
    },
  },

  // ── 疲憊 / Tired ──
  {
    text: '(￣ρ￣)..zzZZ',
    keywords: {
      'zh-tw': ['疲憊', '睡覺', '睏', '打瞌睡'],
      en: ['tired', 'sleeping', 'sleepy', 'dozing'],
    },
  },
  {
    text: '( -_-)zzz',
    keywords: {
      'zh-tw': ['疲憊', '睡覺', '睏', '無聊'],
      en: ['tired', 'sleeping', 'sleepy', 'bored'],
    },
  },
  {
    text: '(´-ω-`)',
    keywords: {
      'zh-tw': ['疲憊', '累', '無力', '放空'],
      en: ['tired', 'exhausted', 'drained', 'zoned out'],
    },
  },
  {
    text: '(￣﹃￣)',
    keywords: {
      'zh-tw': ['疲憊', '愛睏', '呆滯', '放空'],
      en: ['tired', 'sleepy', 'dazed', 'zoned out'],
    },
  },

  // ── 哭 / Crying ──
  {
    text: '(´;ω;`)',
    keywords: { 'zh-tw': ['哭', '傷心', '流淚', '難過'], en: ['crying', 'sad', 'tears', 'upset'] },
  },
  {
    text: '｡ﾟ(ﾟ´Д｀ﾟ)ﾟ｡',
    keywords: {
      'zh-tw': ['大哭', '傷心', '悲痛', '嚎啕'],
      en: ['crying hard', 'sad', 'grief', 'sobbing'],
    },
  },
  {
    text: '( ༎ຶŎ༎ຶ )',
    keywords: {
      'zh-tw': ['哭', '傷心', '無語', '難過'],
      en: ['crying', 'sad', 'speechless', 'upset'],
    },
  },
  {
    text: '(´°̥̥̥̥̥̥̥̥ω°̥̥̥̥̥̥̥̥｀)',
    keywords: {
      'zh-tw': ['大哭', '崩潰', '傷心欲絕', '絕望'],
      en: ['crying hard', 'breakdown', 'heartbroken', 'desperate'],
    },
  },

  // ── 尷尬 / Embarrassed ──
  {
    text: '(⌒_⌒;)',
    keywords: {
      'zh-tw': ['尷尬', '苦笑', '冒汗', '不好意思'],
      en: ['embarrassed', 'sweat', 'awkward', 'oops'],
    },
  },
  {
    text: '(^_^;)',
    keywords: {
      'zh-tw': ['尷尬', '苦笑', '冒汗', '不好意思'],
      en: ['embarrassed', 'nervous smile', 'sweat', 'awkward'],
    },
  },
  {
    text: '(；一_一)',
    keywords: {
      'zh-tw': ['尷尬', '無語', '無奈', '傻眼'],
      en: ['embarrassed', 'speechless', 'helpless', 'facepalm'],
    },
  },

  // ── 心虛 / Guilty ──
  {
    text: '(･ω<)☆',
    keywords: {
      'zh-tw': ['心虛', '俏皮', '眨眼', '調皮'],
      en: ['guilty', 'playful', 'wink', 'mischievous'],
    },
  },
  {
    text: '(｡•̀ᴗ-)و',
    keywords: {
      'zh-tw': ['心虛', '裝傻', '裝可愛', '躲避'],
      en: ['guilty', 'playing dumb', 'acting cute', 'dodging'],
    },
  },

  // ── 得意 / Proud / Smug ──
  {
    text: '(￣ー￣)',
    keywords: {
      'zh-tw': ['得意', '自信', '微笑', '驕傲'],
      en: ['smug', 'proud', 'confident', 'smirk'],
    },
  },
  {
    text: '(￣^￣)ゞ',
    keywords: {
      'zh-tw': ['得意', '敬禮', '驕傲', '自信'],
      en: ['proud', 'salute', 'smug', 'confident'],
    },
  },
  {
    text: '（￣︶￣）↗',
    keywords: {
      'zh-tw': ['得意', '驕傲', '自滿', '翹鼻'],
      en: ['smug', 'proud', 'cocky', 'nose up'],
    },
  },

  // ── 耍酷 / Cool ──
  {
    text: '(｀∀´)Ψ',
    keywords: {
      'zh-tw': ['耍酷', '邪惡', '壞笑', '惡作劇'],
      en: ['cool', 'evil', 'smirk', 'prank'],
    },
  },
  {
    text: '(•̀ᴗ•́)و ̑̑',
    keywords: {
      'zh-tw': ['耍酷', '自信', '帥氣', '有型'],
      en: ['cool', 'confident', 'stylish', 'swag'],
    },
  },
  {
    text: '╭( ･ㅂ･)و ̑̑',
    keywords: {
      'zh-tw': ['耍酷', '帥氣', '自信', '加油'],
      en: ['cool', 'stylish', 'confident', 'go'],
    },
  },

  // ── 害羞 / Shy ──
  {
    text: '(〃ω〃)',
    keywords: {
      'zh-tw': ['害羞', '臉紅', '心動', '靦腆'],
      en: ['shy', 'blush', 'flustered', 'bashful'],
    },
  },
  {
    text: '(⁄ ⁄•⁄ω⁄•⁄ ⁄)',
    keywords: {
      'zh-tw': ['害羞', '臉紅', '心動', '不知所措'],
      en: ['shy', 'blush', 'flustered', 'flustered'],
    },
  },
  {
    text: '(*/ω＼*)',
    keywords: {
      'zh-tw': ['害羞', '遮臉', '臉紅', '嬌羞'],
      en: ['shy', 'hide face', 'blush', 'bashful'],
    },
  },

  // ── 無辜 / Innocent ──
  {
    text: '૮₍ . ̫ .⑅₎ა',
    keywords: {
      'zh-tw': ['無辜', '可愛', '純真', '小動物'],
      en: ['innocent', 'cute', 'pure', 'small animal'],
    },
  },
  {
    text: '૮₍´• ˕ •`₎ა',
    keywords: {
      'zh-tw': ['無辜', '可愛', '純真', '期待'],
      en: ['innocent', 'cute', 'pure', 'hopeful'],
    },
  },
  {
    text: '(´•ω•`)',
    keywords: {
      'zh-tw': ['無辜', '可愛', '溫柔', '小聲'],
      en: ['innocent', 'cute', 'gentle', 'soft'],
    },
  },
  {
    text: '૮₍ ˃ ⤙ ˂ ₎ა',
    keywords: {
      'zh-tw': ['無辜', '可愛', '委屈', '閃亮'],
      en: ['innocent', 'cute', 'wronged', 'sparkly'],
    },
  },
  {
    text: '(｡>﹏<｡)',
    keywords: {
      'zh-tw': ['無辜', '委屈', '快哭', '可愛'],
      en: ['innocent', 'wronged', 'about to cry', 'cute'],
    },
  },

  // ── 無奈 / Helpless / Resigned ──
  {
    text: '(´-ι_-｀)',
    keywords: {
      'zh-tw': ['無奈', '無語', '嘆氣', '算了'],
      en: ['helpless', 'speechless', 'sigh', 'whatever'],
    },
  },
  {
    text: '( ´_ゝ`)',
    keywords: {
      'zh-tw': ['無奈', '無言', '冷漠', '尷尬'],
      en: ['helpless', 'speechless', 'cold', 'awkward'],
    },
  },
  {
    text: '( ￣ ￣)',
    keywords: {
      'zh-tw': ['無奈', '無言', '呆滯', '面無表情'],
      en: ['helpless', 'speechless', 'blank', 'expressionless'],
    },
  },

  // ── 閃亮 / Sparkly ──
  {
    text: '✧٩(•́⌄•́๑)و ✧',
    keywords: {
      'zh-tw': ['閃亮', '興奮', '星星', '亮眼'],
      en: ['sparkly', 'excited', 'stars', 'shiny'],
    },
  },
  {
    text: '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧',
    keywords: {
      'zh-tw': ['閃亮', '魔法', '開心', '燦爛'],
      en: ['sparkly', 'magic', 'happy', 'radiant'],
    },
  },
  {
    text: '✲ﾟ｡✧٩(･ิᴗ･ิ๑)۶✲ﾟ｡✧',
    keywords: {
      'zh-tw': ['閃亮', '繽紛', '美麗', '華麗'],
      en: ['sparkly', 'colorful', 'beautiful', 'fancy'],
    },
  },

  // ── 打招呼 / Greeting ──
  {
    text: '(｡･ω･｡)ﾉ',
    keywords: {
      'zh-tw': ['打招呼', '揮手', '嗨', '你好'],
      en: ['greeting', 'waving', 'hi', 'hello'],
    },
  },
  {
    text: '( ´ ∀ `)ﾉ',
    keywords: {
      'zh-tw': ['打招呼', '嗨', '微笑', '友善'],
      en: ['greeting', 'hi', 'smile', 'friendly'],
    },
  },
  {
    text: 'ヾ(＾∇＾)',
    keywords: {
      'zh-tw': ['打招呼', '嗨', '揮手', '開心'],
      en: ['greeting', 'hi', 'waving', 'happy'],
    },
  },

  // ── 感謝 / Thanks ──
  {
    text: '(｡•́︿•̀｡)',
    keywords: {
      'zh-tw': ['感謝', '感動', '快要哭', '謝意'],
      en: ['thanks', 'touched', 'grateful', 'appreciation'],
    },
  },
  {
    text: '(人´∀`)♪',
    keywords: {
      'zh-tw': ['感謝', '謝謝', '開心', '感恩'],
      en: ['thanks', 'thank you', 'grateful', 'appreciation'],
    },
  },
  {
    text: 'm(_ _)m',
    keywords: {
      'zh-tw': ['感謝', '道歉', '鞠躬', '拜託'],
      en: ['thanks', 'apology', 'bow', 'please'],
    },
  },

  // ── 祈禱 / Praying ──
  {
    text: '(人 •͈ᴗ•͈)',
    keywords: {
      'zh-tw': ['祈禱', '拜託', '希望', '心願'],
      en: ['praying', 'please', 'wish', 'hope'],
    },
  },
  {
    text: '(｡-人-｡)',
    keywords: {
      'zh-tw': ['祈禱', '對不起', '抱歉', '敬禮'],
      en: ['praying', 'sorry', 'apology', 'bow'],
    },
  },

  // ── 加油 / Fighting ──
  {
    text: 'ᕦ(ò_óˇ)ᕤ',
    keywords: {
      'zh-tw': ['加油', '努力', '力量', '肌肉'],
      en: ['fighting', 'strength', 'power', 'muscle'],
    },
  },
  {
    text: '(๑•̀ㅂ•́)و✧',
    keywords: {
      'zh-tw': ['加油', '閃亮', '決心', '努力'],
      en: ['fighting', 'sparkly', 'determined', 'effort'],
    },
  },
  {
    text: '╭( ･ㅂ･)و ̑̑ ˖✧',
    keywords: {
      'zh-tw': ['加油', '閃亮', '精神', '打氣'],
      en: ['fighting', 'sparkly', 'spirit', 'cheer'],
    },
  },

  // ── 害怕 / Scared ──
  {
    text: '(；ω；)',
    keywords: {
      'zh-tw': ['害怕', '恐懼', '發抖', '驚嚇'],
      en: ['scared', 'fear', 'trembling', 'terrified'],
    },
  },
  {
    text: '(((╹д╹;)))',
    keywords: {
      'zh-tw': ['害怕', '驚嚇', '顫抖', '發抖'],
      en: ['scared', 'terrified', 'shaking', 'trembling'],
    },
  },
  {
    text: '(>_<)',
    keywords: {
      'zh-tw': ['害怕', '緊張', '閉眼', '不敢看'],
      en: ['scared', 'nervous', 'closing eyes', 'nooo'],
    },
  },

  // ── 思考 / Thinking ──
  {
    text: '( ˘•ω•˘ )',
    keywords: {
      'zh-tw': ['思考', '想', '考慮', '沉思'],
      en: ['thinking', 'pondering', 'considering', 'contemplating'],
    },
  },
  {
    text: '(･_├┬┴┬┴',
    keywords: {
      'zh-tw': ['思考', '偷看', '觀察', '躲在牆後'],
      en: ['thinking', 'peeking', 'observing', 'behind wall'],
    },
  },
  {
    text: '(=↓_↓=)??',
    keywords: {
      'zh-tw': ['思考', '疑惑', '不解', '貓咪'],
      en: ['thinking', 'puzzled', 'confused', 'cat'],
    },
  },

  // ── 期待 / Expecting ──
  {
    text: '(๑•̀ㅁ•́๑)✧',
    keywords: {
      'zh-tw': ['期待', '閃亮', '興奮', '等待'],
      en: ['expecting', 'sparkly', 'excited', 'waiting'],
    },
  },
  {
    text: '( ﾟヮﾟ)凸',
    keywords: {
      'zh-tw': ['期待', '興奮', '好奇', '等待'],
      en: ['expecting', 'excited', 'curious', 'waiting'],
    },
  },

  // ── 食物 / Food ──
  {
    text: '( ´ڡ` )',
    keywords: {
      'zh-tw': ['食物', '好吃', '吃東西', '美味'],
      en: ['food', 'yummy', 'eating', 'delicious'],
    },
  },
  {
    text: '(￣￢￣)',
    keywords: {
      'zh-tw': ['食物', '流口水', '想吃', '好吃'],
      en: ['food', 'drooling', 'hungry', 'yummy'],
    },
  },
  {
    text: '(๑ᵔ⤙ᵔ๑)',
    keywords: {
      'zh-tw': ['食物', '好吃', '滿足', '微笑'],
      en: ['food', 'yummy', 'satisfied', 'smile'],
    },
  },

  // ── 狗 / Dog ──
  {
    text: '(ᵔᴥᵔ)',
    keywords: {
      'zh-tw': ['狗', '可愛', '動物', '毛茸茸'],
      en: ['dog', 'cute', 'animal', 'fluffy'],
    },
  },
  {
    text: '∪･ω･∪',
    keywords: {
      'zh-tw': ['狗', '可愛', '搖尾巴', '嗨'],
      en: ['dog', 'cute', 'wagging tail', 'hi'],
    },
  },
  {
    text: 'U＾ェ＾U',
    keywords: { 'zh-tw': ['狗', '開心', '汪', '動物'], en: ['dog', 'happy', 'woof', 'animal'] },
  },

  // ── 兔子 / Rabbit ──
  {
    text: '( •ω•ฅ)',
    keywords: { 'zh-tw': ['兔子', '可愛', '兔', '蹦'], en: ['rabbit', 'cute', 'bunny', 'hop'] },
  },
  {
    text: '／(=✪ x ✪=)＼',
    keywords: {
      'zh-tw': ['兔子', '可愛', '大眼睛', '驚嚇'],
      en: ['rabbit', 'cute', 'big eyes', 'startled'],
    },
  },

  // ── 企鵝 / Penguin ──
  {
    text: '(°(°ω(°ω°(☆ω☆)°ω°)ω°)°)',
    keywords: {
      'zh-tw': ['企鵝', '可愛', '動物', '排隊'],
      en: ['penguin', 'cute', 'animal', 'marching'],
    },
  },
  {
    text: '<( ･ω･)ﾉｼ',
    keywords: {
      'zh-tw': ['企鵝', '可愛', '搖擺', '嗨'],
      en: ['penguin', 'cute', 'waddling', 'hi'],
    },
  },

  // ── 晚安 / Good Night ──
  {
    text: 'お(￣o￣)や(￣O￣)す(￣｡￣)み(￣ー￣)',
    keywords: {
      'zh-tw': ['晚安', '睡覺', '睏', '休息'],
      en: ['good night', 'sleep', 'sleepy', 'rest'],
    },
  },
  {
    text: '(´-ωก`)',
    keywords: {
      'zh-tw': ['晚安', '想睡', '揉眼', '睏'],
      en: ['good night', 'sleepy', 'rubbing eyes', 'tired'],
    },
  },

  // ── 早安 / Good Morning ──
  {
    text: '(｡･ω･｡)ﾉ♡',
    keywords: {
      'zh-tw': ['早安', '打招呼', '愛心', '嗨'],
      en: ['good morning', 'greeting', 'heart', 'hi'],
    },
  },
  {
    text: '٩(ˊ〇ˋ*)و',
    keywords: {
      'zh-tw': ['早安', '起床', '精神', '伸懶腰'],
      en: ['good morning', 'waking', 'energetic', 'stretch'],
    },
  },

  // ── 其他 / Misc ──
  {
    text: '( º﹃º )',
    keywords: {
      'zh-tw': ['呆滯', '放空', '發呆', '想吃'],
      en: ['dazed', 'zoned out', 'spacing', 'hungry'],
    },
  },
  {
    text: '(屮｀∀´)屮',
    keywords: { 'zh-tw': ['中二', '邪惡', '囂張', '壞'], en: ['edgy', 'evil', 'cocky', 'bad'] },
  },
  {
    text: '(๑¯◡¯๑)',
    keywords: {
      'zh-tw': ['滿足', '幸福', '微笑', '開心'],
      en: ['content', 'bliss', 'smile', 'happy'],
    },
  },
  {
    text: 'ψ(｀∇´)ψ',
    keywords: {
      'zh-tw': ['邪惡', '計劃', '惡魔', '壞笑'],
      en: ['evil', 'scheming', 'devil', 'mischievous'],
    },
  },
  {
    text: '(´▽`ʃƪ)',
    keywords: {
      'zh-tw': ['放鬆', '享受', '開心', '悠閒'],
      en: ['relaxed', 'enjoying', 'chill', 'easy'],
    },
  },
  {
    text: '╰( ͡° ͜ʖ ͡° )つ──☆*:・ﾟ',
    keywords: {
      'zh-tw': ['魔法', '神秘', '咒語', '搞笑'],
      en: ['magic', 'mysterious', 'spell', 'funny'],
    },
  },
  {
    text: '(⊃｡•́‿•̀｡)⊃━✿✿✿✿✿✿',
    keywords: {
      'zh-tw': ['魔法', '花朵', '施展', '可愛'],
      en: ['magic', 'flower', 'casting', 'cute'],
    },
  },
];
