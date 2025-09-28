'use client';

import type { KaomojiItem } from '@/types/Kaomoji';
import KaomojiBtn from '@/components/atoms/KaomojiBtn';
import { cn } from '@/utils/cn';

interface KaomojiListProps extends React.HTMLAttributes<HTMLUListElement> {
  kaomojis: KaomojiItem[];
  onKaomojiCopy: (text: string, id: string) => void;
  copiedId: string | null;
  itemClassName?: string;
}

const KaomojiList: React.FC<KaomojiListProps> = ({
  kaomojis,
  onKaomojiCopy,
  copiedId,
  className,
  itemClassName,
  ...rest
}) => {
  return (
    <ul
      role="list"
      className={cn('flex-center flex-wrap gap-2 md:gap-3 -mx-4', className)}
      {...rest}
    >
      {kaomojis.map((kaomoji) => (
        <li key={kaomoji.id}>
          <KaomojiBtn
            text={kaomoji.text}
            onCopy={() => onKaomojiCopy(kaomoji.text, kaomoji.id)}
            isCopied={copiedId === kaomoji.id}
            className={itemClassName}
          />
        </li>
      ))}
    </ul>
  );
};

export default KaomojiList;
