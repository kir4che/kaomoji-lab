import Link from 'next/link';

import HomeIcon from '@/assets/icons/home.svg';
import CategoryIcon from '@/assets/icons/category.svg';
import HashIcon from '@/assets/icons/hash.svg';
import SparkleIcon from '@/assets/icons/sparkle.svg';

type IconComponent = React.FC<React.SVGProps<SVGSVGElement>>;

const navLinks = [
  { href: '/', text: '首頁', Icon: HomeIcon },
  { href: '/category', text: '分類', Icon: CategoryIcon },
  { href: '/tag', text: '標籤', Icon: HashIcon },
  { href: '/generator', text: '顏文字產生器', Icon: SparkleIcon },
];

interface NavItemProps {
  href: string;
  text: string;
  Icon: IconComponent;
}

const NavItem: React.FC<NavItemProps> = ({ href, text, Icon }) => (
  <Link
    href={href}
    className="group inline-flex items-center gap-x-1 text-sm font-medium text-primary-500"
  >
    <Icon className="size-4.5 text-primary-500 group-hover:text-primary-600" />
    <span className="text-primary-400 hidden xs:block">{text}</span>
  </Link>
);

const Header: React.FC = () => (
  <header className="container flex-between mx-auto p-2 md:px-4">
    <nav className="flex-center gap-x-3">
      {navLinks.map(({ href, text, Icon }) => (
        <NavItem key={href} href={href} text={text} Icon={Icon} />
      ))}
    </nav>
    <div className="flex-center gap-x-3">
      <a
        href="https://forms.gle/xFU2z2p6yr8Hww2A7"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-primary-400 hover:text-primary-500 hover:underline hover:underline-offset-2"
      >
        意見回饋
      </a>
      {process.env.NODE_ENV === 'development' && (
        <Link
          href="/admin"
          className="text-sm text-primary-400 hover:text-primary-500 hover:underline hover:underline-offset-2"
        >
          管理後台
        </Link>
      )}
    </div>
  </header>
);

export default Header;
