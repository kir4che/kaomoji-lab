'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  {
    href: '/category',
    bg: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200/65',
    title: '瀏覽分類',
    desc: '按照情緒、主題分類瀏覽',
  },
  {
    href: '/tag',
    bg: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200/65',
    title: '標籤搜尋',
    desc: '透過標籤找到特定風格',
  },
  {
    href: '/generator',
    bg: 'bg-violet-100 text-violet-800 hover:bg-violet-200/65',
    title: '顏文字產生器',
    desc: '使用 AI 生成你想要的顏文字',
  },
];

const ExploreMoreSection: React.FC = () => {
  const pathname = usePathname();

  const filteredLinks = links.filter(
    (link) => link.href !== pathname && !pathname.startsWith(link.href + '/')
  );

  if (pathname === '/admin') return null;

  return (
    <section className="container mx-auto px-4 pb-8 text-center">
      <div className="px-8 py-6 bg-white rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">探索更多</h3>
        <div className={`flex-between flex-col md:flex-row gap-x-4 gap-y-3`}>
          {filteredLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${link.bg} flex-1 w-full p-4 rounded-lg transition-colors`}
            >
              <h4 className="font-semibold mb-2">{link.title}</h4>
              <p className="text-sm">{link.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExploreMoreSection;
