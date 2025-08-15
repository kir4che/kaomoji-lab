const Hexo: React.FC = () => (
  <section className="text-center mb-6 md:mb-8">
    <h1 className="gradient-text mb-3 sm:mb-4">
      顏文字實驗室
      <span className="hidden sm:inline"> *｡٩(ˊᗜˋ*)و✦*｡</span>
      <span className="text-xl sm:hidden"> ♥</span>
    </h1>
    <p className="text-sm text-gray-400 sm:text-base">
      收藏過 {process.env.NEXT_PUBLIC_TOTAL_KAOMOJIS || 5000}+ 顏文字，一鍵複製輕鬆使用！
    </p>
  </section>
);

export default Hexo;
